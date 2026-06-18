import { and, eq, gte, sql } from "drizzle-orm";
import type { PaymentRequirements } from "x402/types";
import { getDb, schema } from "@/db";
import { getServerEnv } from "./env";
import { toAtomic } from "./chain";
import { buildDeployRequirements, decodeX402Payment, verifyAndSettle, X402_VERSION } from "./x402";
import { randomTxHash } from "./serialize";

const PER_CALL_USDC = 0.05;

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

export async function getInvokeQuote(input: { instanceId: string }): Promise<InvokeQuote> {
  const db = await getDb();
  const [inst] = await db
    .select({
      id: schema.agentInstances.id,
      agentId: schema.agentInstances.agentId,
      name: schema.agentInstances.name,
    })
    .from(schema.agentInstances)
    .where(eq(schema.agentInstances.id, input.instanceId))
    .limit(1);
  if (!inst) throw new Error(`Instance ${input.instanceId} not found`);

  if (!(await isLive())) return { free: true, fee: PER_CALL_USDC };

  const requirements = await buildDeployRequirements({
    agentId: inst.agentId,
    agentName: inst.name,
    atomic: toAtomic(PER_CALL_USDC),
    resource: invokeResource(inst.id),
    description: `Invoke ${inst.name} (${inst.id})`,
  });
  return { free: false, fee: PER_CALL_USDC, x402Version: X402_VERSION, requirements };
}

export async function invokeAgent(input: {
  instanceId: string;
  payment?: string;
}): Promise<{ ok: true; amount: number; txHash: string; job: string }> {
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
    .where(eq(schema.agentInstances.id, input.instanceId))
    .limit(1);
  if (!inst) throw new Error(`Instance ${input.instanceId} not found`);
  if (inst.status !== "active") {
    throw new Error(`${inst.id} is not accepting tasks (status: ${inst.status}).`);
  }

  const [rateRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.instanceActions)
    .where(
      and(
        eq(schema.instanceActions.instanceId, input.instanceId),
        gte(schema.instanceActions.createdAt, new Date(Date.now() - 60_000)),
      ),
    );
  if ((rateRow?.count ?? 0) >= 30) {
    throw new Error("Rate limit exceeded for this instance. Try again in a minute.");
  }

  const amount = PER_CALL_USDC;
  let txHash: string;

  if (await isLive()) {
    if (!input.payment) throw new Error("Payment is required to invoke this agent.");
    const requirements = await buildDeployRequirements({
      agentId: inst.agentId,
      agentName: inst.name,
      atomic: toAtomic(amount),
      resource: invokeResource(inst.id),
      description: `Invoke ${inst.name} (${inst.id})`,
    });
    const settled = await verifyAndSettle(decodeX402Payment(input.payment), requirements);
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

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1000002)`);
    const [taskRow] = await tx
      .select({
        maxNum: sql<string>`COALESCE(MAX(CAST(REPLACE(id, 'TSK-', '') AS INTEGER)), 9900)`,
      })
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
}
