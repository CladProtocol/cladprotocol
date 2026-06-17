import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DemoAttestation, JsonValue, LedgerStatus } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { iso } from "./serialize";

const safeJson = (s: string): Record<string, JsonValue> => {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, JsonValue>) : {};
  } catch {
    return {};
  }
};

const attestationSelection = {
  id: schema.attestations.id,
  batchNumber: schema.attestations.batchNumber,
  instanceId: schema.attestations.instanceId,
  instanceName: schema.agentInstances.name,
  arweaveTx: schema.attestations.arweaveTx,
  sha256: schema.attestations.sha256,
  actions: schema.attestations.actions,
  windowStart: schema.attestations.windowStart,
  windowEnd: schema.attestations.windowEnd,
  payload: schema.attestations.payload,
  createdAt: schema.attestations.createdAt,
};

type AttestationRow = {
  id: number;
  batchNumber: number;
  instanceId: string;
  instanceName: string;
  arweaveTx: string | null;
  sha256: string;
  actions: number;
  windowStart: Date | number | null;
  windowEnd: Date | number | null;
  payload: string;
  createdAt: Date | number | null;
};

const toAttestation = (r: AttestationRow): DemoAttestation => ({
  id: r.id,
  batchNumber: r.batchNumber,
  instanceId: r.instanceId,
  instanceName: r.instanceName,
  status: (r.arweaveTx ? "anchored" : "pending") as LedgerStatus,
  arweaveTx: r.arweaveTx,
  sha256: r.sha256,
  actions: r.actions,
  windowStart: iso(r.windowStart),
  windowEnd: iso(r.windowEnd),
  payload: safeJson(r.payload),
  at: iso(r.createdAt),
});

/** IRONCLAD ledger list. Owner-scoped; status derived from `arweaveTx`. */
export const listAttestations = createServerFn({ method: "GET" })
  .inputValidator((input: { status?: LedgerStatus }): { status?: LedgerStatus } => input ?? {})
  .handler(async ({ data }): Promise<DemoAttestation[]> => {
    const db = await getDb();
    const owner = await requireOwner();

    const rows = await db
      .select(attestationSelection)
      .from(schema.attestations)
      .innerJoin(schema.agentInstances, eq(schema.attestations.instanceId, schema.agentInstances.id))
      .where(eq(schema.agentInstances.owner, owner))
      .orderBy(desc(schema.attestations.batchNumber));

    let list = rows.map(toAttestation);
    if (data.status) list = list.filter((a) => a.status === data.status);
    return list;
  });

/** Single attestation batch by its (integer) batch number. */
export const getAttestation = createServerFn({ method: "GET" })
  .inputValidator((input: { batch: number }) => input)
  .handler(async ({ data }): Promise<DemoAttestation | null> => {
    const db = await getDb();
    const owner = await requireOwner();

    const [row] = await db
      .select(attestationSelection)
      .from(schema.attestations)
      .innerJoin(schema.agentInstances, eq(schema.attestations.instanceId, schema.agentInstances.id))
      .where(and(eq(schema.attestations.batchNumber, data.batch), eq(schema.agentInstances.owner, owner)))
      .limit(1);

    return row ? toAttestation(row) : null;
  });
