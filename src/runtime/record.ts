/**
 * Persist a tick's actions — the single seam every bot writes through. This is the
 * batch analogue of `reportSettlement` (src/api/payments.ts): it appends the
 * machine task log (instance_actions → the IRONCLAD cron Merkle-hashes + anchors
 * them for free), books a `settlement` payment per earning action, bumps the
 * instance counters, and emits activity. Paper actions get a synthetic tx hash;
 * live actions carry the real one from `action.settlement`.
 *
 * Plain async + direct `getDb()` writes (no server-fn / Start context) so it runs
 * from the background runner.
 */
import { eq, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { schema } from "@/db";
import { randomTxHash } from "@/api/serialize";
import type { AgentAction, RuntimeInstance } from "./types";

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;

export async function recordActions(
  db: DB,
  instance: RuntimeInstance,
  actions: AgentAction[],
): Promise<{ recorded: number; earned: number }> {
  if (actions.length === 0) return { recorded: 0, earned: 0 };

  // Advisory lock (1000002) + MAX query + all inserts in one transaction.
  // Ensures sequential TSK IDs even when multiple bot ticks run concurrently
  // across processes. Existing IDs are untouched; new ones continue from the max.
  const earned = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1000002)`);
    const [row] = await tx
      .select({ maxNum: sql<string>`COALESCE(MAX(CAST(REPLACE(id, 'TSK-', '') AS INTEGER)), 9900)` })
      .from(schema.instanceActions);
    let task = (Number(row?.maxNum) ?? 9900) + 1;
    let total = 0;

    for (const a of actions) {
      const value = round6(Math.max(0, a.value));

      await tx.insert(schema.instanceActions).values({
        id: `TSK-${task++}`,
        instanceId: instance.id,
        label: a.label,
        result: a.result,
        value,
      });

      if (value > 0 && a.result === "success") {
        total += value;
        await tx.insert(schema.payments).values({
          instanceId: instance.id,
          owner: instance.owner,
          amount: value,
          currency: "USDC",
          kind: "settlement",
          status: "settled",
          txHash: a.settlement?.txHash ?? randomTxHash(),
          counterparty: a.settlement?.counterparty ?? a.counterparty ?? "x402 consumer",
        });
      }

      await tx.insert(schema.activity).values({
        instanceId: instance.id,
        owner: instance.owner,
        tag: a.tag ?? (value > 0 ? "x402" : "Telemetry"),
        message: a.label,
      });
    }

    return round6(total);
  });

  const batteryPatch =
    instance.kind === "physical" && instance.batteryLevel != null
      ? { batteryLevel: Math.max(20, instance.batteryLevel - 1) }
      : {};

  await db
    .update(schema.agentInstances)
    .set({
      earnings: round6(instance.earnings + earned),
      actionsCount: instance.actions + actions.length,
      lastActivityAt: new Date(),
      ...batteryPatch,
    })
    .where(eq(schema.agentInstances.id, instance.id));

  return { recorded: actions.length, earned };
}
