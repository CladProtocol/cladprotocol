/**
 * Earn bot (Path 3) — the "customer pays the agent" endpoint.
 *
 * A consumer invokes a deployed digital agent for a small task and pays a per-call
 * x402 fee. In live mode the consumer's signed USDC authorization is settled on
 * Base by the treasury (real tx); in paper mode the fee is synthetic. Either way we
 * record a real `settlement` payment + an `instance_actions` row (which the IRONCLAD
 * cron batches + anchors) + activity, and credit the instance's owner.
 *
 * NOT owner-scoped: the caller is a *customer*, not the operator — so no
 * `requireOwner()`. The forgery guard is the on-chain settlement itself
 * (`verifyAndSettle`). Mirrors `reportSettlement` (src/api/payments.ts), minus the
 * session. Server-only helpers (chain/x402) are imported only inside the handlers.
 */
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import type { PaymentRequirements } from "x402/types";
import { getDb, schema } from "@/db";
import { getServerEnv } from "./env";
import { toAtomic } from "./chain";
import { buildDeployRequirements, decodeX402Payment, verifyAndSettle, X402_VERSION } from "./x402";
import { randomTxHash } from "./serialize";

/** Flat fee a consumer pays per task, in whole USDC. */
const PER_CALL_USDC = 0.05;

/** Canned task labels — the "work" is a stub; the point is the payment rail. */
const JOBS = [
  "Served signal request",
  "Classified pending-pool batch",
  "Scored sandwich risk",
  "Returned liquidation watchlist",
  "Answered capability query",
] as const;

const invokeResource = (instanceId: string) => `https://clad.protocol/invoke/${instanceId}`;

async function isLive(): Promise<boolean> {
  return (await getServerEnv("RUNTIME_MODE")) === "live";
}

export type InvokeQuote =
  | { free: true; fee: number }
  | { free: false; fee: number; x402Version: number; requirements: PaymentRequirements };

/**
 * Quote the per-call x402 fee to invoke an agent. Paper mode → free/synthetic;
 * live mode → the requirements the customer's wallet signs (USDC to the treasury).
 */
export const getInvokeQuote = createServerFn({ method: "POST" })
  .inputValidator((input: { instanceId: string }) => input)
  .handler(async ({ data }): Promise<InvokeQuote> => {
    const db = await getDb();
    const [inst] = await db
      .select({
        id: schema.agentInstances.id,
        agentId: schema.agentInstances.agentId,
        name: schema.agentInstances.name,
      })
      .from(schema.agentInstances)
      .where(eq(schema.agentInstances.id, data.instanceId))
      .limit(1);
    if (!inst) throw new Error(`Instance ${data.instanceId} not found`);

    if (!(await isLive())) return { free: true, fee: PER_CALL_USDC };

    const requirements = await buildDeployRequirements({
      agentId: inst.agentId,
      agentName: inst.name,
      atomic: toAtomic(PER_CALL_USDC),
      resource: invokeResource(inst.id),
      description: `Invoke ${inst.name} (${inst.id})`,
    });
    return { free: false, fee: PER_CALL_USDC, x402Version: X402_VERSION, requirements };
  });

/**
 * Invoke an active agent: settle the per-call fee (real on-chain in live mode),
 * record the settlement + task + activity, credit the owner, and return the result.
 */
export const invokeAgent = createServerFn({ method: "POST" })
  .inputValidator((input: { instanceId: string; payment?: string }) => input)
  .handler(
    async ({ data }): Promise<{ ok: true; amount: number; txHash: string; job: string }> => {
      const db = await getDb();

      const [inst] = await db
        .select({
          id: schema.agentInstances.id,
          agentId: schema.agentInstances.agentId,
          name: schema.agentInstances.name,
          owner: schema.agentInstances.owner,
          status: schema.agentInstances.status,
          earnings: schema.agentInstances.earnings,
          actions: schema.agentInstances.actionsCount,
        })
        .from(schema.agentInstances)
        .where(eq(schema.agentInstances.id, data.instanceId))
        .limit(1);
      if (!inst) throw new Error(`Instance ${data.instanceId} not found`);
      if (inst.status !== "active") {
        throw new Error(`${inst.id} is not accepting tasks (status: ${inst.status}).`);
      }

      // Rate limit: max 30 invocations per minute per instance (paper mode guard).
      const [rateRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.instanceActions)
        .where(
          and(
            eq(schema.instanceActions.instanceId, data.instanceId),
            gte(schema.instanceActions.createdAt, new Date(Date.now() - 60_000)),
          ),
        );
      if ((rateRow?.count ?? 0) >= 30) {
        throw new Error("Rate limit exceeded for this instance. Try again in a minute.");
      }

      const amount = PER_CALL_USDC;
      let txHash: string;

      if (await isLive()) {
        if (!data.payment) throw new Error("Payment is required to invoke this agent.");
        const requirements = await buildDeployRequirements({
          agentId: inst.agentId,
          agentName: inst.name,
          atomic: toAtomic(amount),
          resource: invokeResource(inst.id),
          description: `Invoke ${inst.name} (${inst.id})`,
        });
        const settled = await verifyAndSettle(decodeX402Payment(data.payment), requirements);
        txHash = settled.txHash;
      } else {
        txHash = randomTxHash();
      }

      const job = JOBS[Math.floor(Math.random() * JOBS.length)];

      await db.insert(schema.payments).values({
        instanceId: inst.id,
        owner: inst.owner,
        amount,
        currency: "USDC",
        kind: "settlement",
        status: "settled",
        txHash,
        counterparty: "x402 consumer",
      });

      // Advisory lock (1000002) prevents concurrent invocations allocating the same TSK id.
      await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(1000002)`);
        const [taskRow] = await tx
          .select({ maxNum: sql<string>`COALESCE(MAX(CAST(REPLACE(id, 'TSK-', '') AS INTEGER)), 9900)` })
          .from(schema.instanceActions);
        const nextTask = (Number(taskRow?.maxNum) ?? 9900) + 1;
        await tx.insert(schema.instanceActions).values({
          id: `TSK-${nextTask}`,
          instanceId: inst.id,
          label: `${job} (x402)`,
          result: "success",
          value: amount,
        });
      });

      await db
        .update(schema.agentInstances)
        .set({
          earnings: inst.earnings + amount,
          actionsCount: inst.actions + 1,
          lastActivityAt: new Date(),
        })
        .where(eq(schema.agentInstances.id, inst.id));

      await db.insert(schema.activity).values({
        instanceId: inst.id,
        owner: inst.owner,
        tag: "x402",
        message: `${inst.name} earned $${amount.toFixed(2)} — ${job}`,
      });

      return { ok: true, amount, txHash, job };
    },
  );
