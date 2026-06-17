import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { isAddress } from "viem";
import { getDb, schema } from "@/db";
import type { DemoPayment, PaymentKind } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { fromAtomic, getTreasuryAddress, toAtomic, verifyUsdcTransfer } from "./chain";
import { sendUsdc } from "./payouts";
import { iso } from "./serialize";

/** x402 settlement ledger. Owner-scoped, optional kind filter. */
export const listPayments = createServerFn({ method: "GET" })
  .inputValidator((input: { kind?: PaymentKind }): { kind?: PaymentKind } => input ?? {})
  .handler(async ({ data }): Promise<DemoPayment[]> => {
    const db = await getDb();
    const owner = await requireOwner();

    const where = data.kind
      ? and(eq(schema.payments.owner, owner), eq(schema.payments.kind, data.kind))
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
  });

/* ---- mutations ----------------------------------------------------------- */

/** Withdraw USDC to the operator's wallet: sends real USDC from the treasury. */
export const withdraw = createServerFn({ method: "POST" })
  .inputValidator((input: { amount: number }) => input)
  .handler(async ({ data }): Promise<{ ok: true; amount: number; txHash: string }> => {
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("Withdrawal amount must be a positive finite number.");
    }
    const db = await getDb();
    const owner = await requireOwner();
    if (!isAddress(owner)) throw new Error("Operator address is invalid.");

    // Treasury sends real USDC on Base to the operator.
    const txHash = await sendUsdc(owner, toAtomic(data.amount));

    const [u] = await db
      .select({ ens: schema.users.ens, name: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.address, owner))
      .limit(1);
    const counterparty = u?.ens || u?.name || owner;

    await db.insert(schema.payments).values({
      instanceId: null,
      owner,
      amount: data.amount,
      currency: "USDC",
      kind: "withdrawal",
      status: "settled",
      txHash,
      counterparty,
    });

    await db.insert(schema.activity).values({
      owner,
      tag: "x402",
      message: `Withdrew $${data.amount.toLocaleString()} to ${counterparty}`,
    });

    return { ok: true, amount: data.amount, txHash };
  });

/**
 * Verified settlement ingest: an agent reports that it earned USDC for an
 * instance by providing the on-chain tx hash. We confirm a USDC Transfer to the
 * treasury actually happened on Base, then record the settlement and credit the
 * instance. Rejects forged/unrelated hashes.
 */
export const reportSettlement = createServerFn({ method: "POST" })
  .inputValidator((input: { instanceId: string; txHash: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; amount: number }> => {
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
      .where(and(eq(schema.agentInstances.id, data.instanceId), eq(schema.agentInstances.owner, owner)))
      .limit(1);
    if (!inst) throw new Error(`Instance ${data.instanceId} not found`);

    // Confirm a real USDC transfer to the treasury before crediting anything.
    const treasury = await getTreasuryAddress();
    const transfer = await verifyUsdcTransfer(data.txHash as `0x${string}`, { to: treasury });
    // The transfer must originate from the instance owner — prevents someone
    // submitting an unrelated real tx to credit an account they don't own.
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
      txHash: data.txHash,
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

    // Append the machine task log so IRONCLAD can batch + anchor it (cron).
    // Advisory lock (1000002) prevents concurrent handlers allocating the same TSK id.
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1000002)`);
      const [taskRow] = await tx
        .select({ maxNum: sql<string>`COALESCE(MAX(CAST(REPLACE(id, 'TSK-', '') AS INTEGER)), 9900)` })
        .from(schema.instanceActions);
      const nextTask = (Number(taskRow?.maxNum) ?? 9900) + 1;
      await tx.insert(schema.instanceActions).values({
        id: `TSK-${nextTask}`,
        instanceId: inst.id,
        label: `Settled $${amount.toLocaleString()} (${data.txHash.slice(0, 10)}…)`,
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
  });
