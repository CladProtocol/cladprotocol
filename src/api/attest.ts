/**
 * IRONCLAD attestation batching (Stage D). Server-only, runs from the Cron
 * Trigger (src/server.ts `scheduled`) — NOT from a request, so it is never
 * owner-scoped; it sweeps every instance's machine task log.
 *
 * Each run:
 *   1. retries any previously-pending batches (anchored = arweaveTx set),
 *   2. gathers each instance's un-attested `instance_actions`, hashes them into a
 *      SHA-256 Merkle root, anchors the batch payload to Arweave, writes the
 *      `attestations` row, stamps the actions with the batch number, and emits an
 *      `IRONCLAD` activity entry.
 *
 * Anchoring is best-effort: a batch is always recorded (so work is never lost);
 * if Arweave is unreachable it stays `pending` (arweaveTx null) and the next run
 * re-anchors it. `status` in the ledger derives from `arweaveTx`.
 */
import { asc, eq, isNull, max } from "drizzle-orm";
import type { DB } from "@/db";
import { getDb, schema } from "@/db";
import type { JsonValue } from "@/lib/demo-data";
import { anchorToArweave, merkleRoot, type Tag } from "./arweave";

const MAX_LEAVES_IN_PAYLOAD = 64; // keep anchored payloads well under Turbo's free tier

type ActionRow = {
  id: string;
  instanceId: string;
  label: string;
  result: "success" | "reverted";
  value: number;
  createdAt: Date | number | null;
};

const epoch = (d: Date | number | null): number =>
  d == null ? 0 : Math.floor((d instanceof Date ? d.getTime() : d) / 1000);

/** Canonical, stable leaf string for one action (hashed into the Merkle tree). */
const actionLeaf = (a: ActionRow): string =>
  JSON.stringify({ id: a.id, label: a.label, result: a.result, value: a.value, at: epoch(a.createdAt) });

function batchTags(instanceId: string, batchNumber: number, root: string): Tag[] {
  return [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "Clad-Protocol" },
    { name: "Type", value: "ironclad-attestation" },
    { name: "Instance", value: instanceId },
    { name: "Batch", value: String(batchNumber) },
    { name: "Merkle-Root", value: root },
  ];
}

async function nextBatchNumber(db: DB): Promise<number> {
  const [row] = await db.select({ max: max(schema.attestations.batchNumber) }).from(schema.attestations);
  return (row?.max ?? 0) + 1;
}

/* ---- retry: anchor batches that were recorded but not yet on Arweave ------ */

export async function retryPendingAttestations(dbArg?: DB): Promise<{ anchored: number }> {
  const db = dbArg ?? (await getDb());
  const pending = await db
    .select({
      id: schema.attestations.id,
      instanceId: schema.attestations.instanceId,
      batchNumber: schema.attestations.batchNumber,
      sha256: schema.attestations.sha256,
      payload: schema.attestations.payload,
      owner: schema.agentInstances.owner,
    })
    .from(schema.attestations)
    .innerJoin(schema.agentInstances, eq(schema.attestations.instanceId, schema.agentInstances.id))
    .where(isNull(schema.attestations.arweaveTx));

  let anchored = 0;
  for (const b of pending) {
    try {
      const { arweaveTx } = await anchorToArweave(
        b.payload,
        batchTags(b.instanceId, b.batchNumber, b.sha256),
      );
      await db
        .update(schema.attestations)
        .set({ arweaveTx })
        .where(eq(schema.attestations.id, b.id));
      await db.insert(schema.activity).values({
        instanceId: b.instanceId,
        owner: b.owner,
        tag: "IRONCLAD",
        message: `Attestation batch #${b.batchNumber.toLocaleString()} anchored to Arweave`,
      });
      anchored++;
    } catch (err) {
      console.error(`[attest] retry anchor failed for batch #${b.batchNumber}:`, err);
    }
  }
  return { anchored };
}

/* ---- main: close new batches from un-attested actions --------------------- */

export async function closeBatches(
  dbArg?: DB,
): Promise<{ retried: number; created: number; anchored: number; pending: number }> {
  const db = dbArg ?? (await getDb());

  // First, try to anchor anything still pending from previous runs.
  const { anchored: retried } = await retryPendingAttestations(db);

  // Gather un-attested actions (batch_number IS NULL), oldest first, with owner.
  const rows = await db
    .select({
      id: schema.instanceActions.id,
      instanceId: schema.instanceActions.instanceId,
      label: schema.instanceActions.label,
      result: schema.instanceActions.result,
      value: schema.instanceActions.value,
      createdAt: schema.instanceActions.createdAt,
      owner: schema.agentInstances.owner,
      instanceName: schema.agentInstances.name,
    })
    .from(schema.instanceActions)
    .innerJoin(schema.agentInstances, eq(schema.instanceActions.instanceId, schema.agentInstances.id))
    .where(isNull(schema.instanceActions.batchNumber))
    .orderBy(asc(schema.instanceActions.createdAt));

  // Group by instance.
  const byInstance = new Map<string, { owner: string | null; name: string; actions: ActionRow[] }>();
  for (const r of rows) {
    const entry = byInstance.get(r.instanceId) ?? { owner: r.owner, name: r.instanceName, actions: [] };
    entry.actions.push(r);
    byInstance.set(r.instanceId, entry);
  }

  let batchNumber = await nextBatchNumber(db);
  let created = 0;
  let anchored = 0;
  let pending = 0;

  for (const [instanceId, { owner, name, actions }] of byInstance) {
    const root = await merkleRoot(actions.map(actionLeaf));
    const reverted = actions.filter((a) => a.result === "reverted").length;
    const realized = Math.round(actions.reduce((s, a) => s + a.value, 0) * 1e6) / 1e6;
    const starts = actions.map((a) => epoch(a.createdAt)).filter((n) => n > 0);
    const windowStart = starts.length ? new Date(Math.min(...starts) * 1000) : null;
    const windowEnd = starts.length ? new Date(Math.max(...starts) * 1000) : null;

    const leaves: JsonValue[] = actions.slice(0, MAX_LEAVES_IN_PAYLOAD).map((a) => ({
      id: a.id,
      label: a.label,
      result: a.result,
      value: a.value,
      at: epoch(a.createdAt),
    }));
    const payload: Record<string, JsonValue> = {
      instance: instanceId,
      instanceName: name,
      batchNumber,
      actions: actions.length,
      reverted,
      realized,
      merkleRoot: root,
      window: { start: windowStart?.toISOString() ?? null, end: windowEnd?.toISOString() ?? null },
      leaves,
      truncated: actions.length > MAX_LEAVES_IN_PAYLOAD,
    };
    const payloadStr = JSON.stringify(payload);

    // Best-effort anchor; record the batch either way.
    let arweaveTx: string | null = null;
    try {
      arweaveTx = (await anchorToArweave(payloadStr, batchTags(instanceId, batchNumber, root))).arweaveTx;
    } catch (err) {
      console.error(`[attest] anchor failed for batch #${batchNumber} (${instanceId}):`, err);
    }

    await db.insert(schema.attestations).values({
      instanceId,
      batchNumber,
      arweaveTx,
      sha256: root,
      actions: actions.length,
      windowStart,
      windowEnd,
      payload: payloadStr,
    });

    // Stamp the covered actions so they are never re-attested.
    for (const a of actions) {
      await db
        .update(schema.instanceActions)
        .set({ batchNumber })
        .where(eq(schema.instanceActions.id, a.id));
    }

    await db.insert(schema.activity).values({
      instanceId,
      owner,
      tag: "IRONCLAD",
      message: arweaveTx
        ? `Attestation batch #${batchNumber.toLocaleString()} anchored to Arweave`
        : `Attestation batch #${batchNumber.toLocaleString()} pending anchor`,
    });

    created++;
    if (arweaveTx) anchored++;
    else pending++;
    batchNumber++;
  }

  return { retried, created, anchored, pending };
}
