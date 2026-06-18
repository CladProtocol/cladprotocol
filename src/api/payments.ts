import { and, desc, eq, sql } from "drizzle-orm";
import { isAddress } from "viem";
import { getDb, schema } from "@/db";
import type { DemoPayment, PaymentKind } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { fromAtomic, getTreasuryAddress, toAtomic, verifyUsdcTransfer } from "./chain";
import { sendUsdc } from "./payouts";
import { iso } from "./serialize";

export async function listPayments(input: {
  kind?: PaymentKind;
}): Promise<DemoPayment[]> {
  const db = await getDb();
  const owner = await requireOwner();

  const where = input.kind
    ? and(eq(schema.payments.owner, owner), eq(schema.payments.kind, input.kind))
    : eq(schema.payments.owner, owner);

  const rows = await db
    .select({
      id: schema.payments.id,
      instanceId: schema.payments.instanceId,
      instanceName: schema.agentInstances.name,
      amount: schema.payments.amount,
      currency: schema.payments.currency,
      kind: schema.payments.kind,
      status: schema.payments.status,
      txHash: schema.payments.txHash,
      counterparty: schema.payments.counterparty,
      createdAt: schema.payments.createdAt,
    })
    .from(schema.payments)
    .leftJoin(schema.agentInstances, eq(schema.payments.instanceId, schema.agentInstances.id))
    .where(where)
    .orderBy(desc(schema.payments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    instanceId: r.instanceId,
    instanceName: r.instanceName,
    amount: r.amount,
    currency: r.currency,
    kind: r.kind as PaymentKind,
    status: r.status,
    txHash: r.txHash ?? "",
    counterparty: r.counterparty ?? "",
    at: iso(r.createdAt),
  }));
}

export async function withdraw(input: {
  amount: number;
}): Promise<{ ok: true; amount: number; txHash: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Withdrawal amount must be a positive finite number.");
  }
  const db = await getDb();
  const owner = await requireOwner();
  if (!isAddress(owner)) throw new Error("Operator address is invalid.");

  const txHash = await sendUsdc(owner, toAtomic(input.amount));

  const [u] = await db
    .select({ ens: schema.users.ens, name: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.address, owner))
    .limit(1);
  const counterparty = u?.ens || u?.name || owner;

  await db.insert(schema.payments).values({
    instanceId: null,
    owner,
    amount: input.amount,
    currency: "USDC",
    kind: "withdrawal",
    status: "settled",
    txHash,
    counterparty,
  });

  await db.insert(schema.activity).values({
    owner,
    tag: "x402",
    message: `Withdrew $${input.amount.toLocaleString()} to ${counterparty}`,
  });

  return { ok: true, amount: input.amount, txHash };
}

export async function reportSettlement(input: {
  instanceId: string;
  txHash: string;
}): Promise<{ ok: true; amount: number }> {
  const db = await getDb();
  const owner = await requireOwner();

  const [inst] = await db
    .select({
      id: schema.agentInstances.id,
      name: schema.agentInstances.name,
      earnings: schema.agentInstances.earnings,
      actions: schema.agentInstances.actionsCount,
    })
    .from(schema.agentInstances)
    .where(
      and(
        eq(schema.agentInstances.id, input.instanceId),
        eq(schema.agentInstances.owner, owner),
      ),
    )
    .limit(1);
  if (!inst) throw new Error(`Instance ${input.instanceId} not found`);

  const treasury = await getTreasuryAddress();
  const transfer = await verifyUsdcTransfer(input.txHash as `0x${string}`, { to: treasury });
  if (transfer.from.toLowerCase() !== owner.toLowerCase()) {
    throw new Error("Settlement transfer must originate from the instance owner's address.");
  }
  const amount = fromAtomic(transfer.value);

  await db.insert(schema.payments).values({
    instanceId: inst.id,
    owner,
    amount,
    currency: "USDC",
    kind: "settlement",
    status: "settled",
    txHash: input.txHash,
    counterparty: transfer.from,
  });

  await db
    .update(schema.agentInstances)
    .set({
      earnings: inst.earnings + amount,
      actionsCount: inst.actions + 1,
      lastActivityAt: new Date(),
    })
    .where(eq(schema.agentInstances.id, inst.id));

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
      label: `Settled $${amount.toLocaleString()} (${input.txHash.slice(0, 10)}…)`,
      result: "success",
      value: amount,
    });
  });

  await db.insert(schema.activity).values({
    instanceId: inst.id,
    owner,
    tag: "x402",
    message: `Settled $${amount.toLocaleString()} for ${inst.name}`,
  });

  return { ok: true, amount };
}
