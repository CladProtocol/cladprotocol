import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { isAddress } from "viem";
import type { PaymentRequirements } from "x402/types";
import { getDb, schema } from "@/db";
import type { DemoAgent, DemoInstance } from "@/lib/demo-data";
import { getOptionalOwner, requireOwner } from "./session.server";
import { getServerEnv } from "./env";
import { toAtomic } from "./chain";
import { sendUsdc } from "./payouts";
import { buildDeployRequirements, decodeX402Payment, verifyAndSettle, X402_VERSION } from "./x402";
import { pinManifest } from "./manifests";
import { instanceSelection, toAgent, toInstanceSummary } from "./serialize";

type AgentFilters = { kind?: "digital" | "physical"; category?: string; q?: string };

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    (m.get(k) ?? m.set(k, []).get(k)!).push(r);
  }
  return m;
}

/** Marketplace + legion listing. Returns full DemoAgent[] (only 8 rows). */
export const listAgents = createServerFn({ method: "GET" })
  .inputValidator((input: AgentFilters): AgentFilters => input ?? {})
  .handler(async ({ data }): Promise<DemoAgent[]> => {
    const db = await getDb();
    const rows = await db
      .select({ agent: schema.agents, creatorName: schema.users.displayName })
      .from(schema.agents)
      .leftJoin(schema.users, eq(schema.agents.creator, schema.users.address))
      .orderBy(desc(schema.agents.rating))
      .limit(500);

    const versions = await db
      .select()
      .from(schema.agentVersions)
      .orderBy(desc(schema.agentVersions.releasedAt));
    const reviews = await db
      .select()
      .from(schema.agentReviews)
      .orderBy(desc(schema.agentReviews.createdAt));
    const vByAgent = groupBy(versions, (v) => v.agentId);
    const rByAgent = groupBy(reviews, (r) => r.agentId);

    let list = rows.map((r) =>
      toAgent(r.agent, r.creatorName, vByAgent.get(r.agent.id) ?? [], rByAgent.get(r.agent.id) ?? []),
    );

    if (data.kind) list = list.filter((a) => a.kind === data.kind);
    if (data.category && data.category !== "All") list = list.filter((a) => a.category === data.category);
    if (data.q) {
      const q = data.q.trim().toLowerCase();
      list = list.filter((a) =>
        `${a.name} ${a.description} ${a.category} ${a.id}`.toLowerCase().includes(q),
      );
    }
    return list;
  });

/** Agent detail: the full listing + the viewer's own instances running it. */
export const getAgent = createServerFn({ method: "GET" })
  .inputValidator((input: { agentId: string }) => input)
  .handler(async ({ data }): Promise<{ agent: DemoAgent | null; instances: DemoInstance[] }> => {
    const db = await getDb();
    // Public page: personalize "Your deployments" only when signed in.
    const owner = await getOptionalOwner();

    const [row] = await db
      .select({ agent: schema.agents, creatorName: schema.users.displayName })
      .from(schema.agents)
      .leftJoin(schema.users, eq(schema.agents.creator, schema.users.address))
      .where(eq(schema.agents.id, data.agentId))
      .limit(1);
    if (!row) return { agent: null, instances: [] };

    const versions = await db
      .select()
      .from(schema.agentVersions)
      .where(eq(schema.agentVersions.agentId, data.agentId))
      .orderBy(desc(schema.agentVersions.releasedAt));
    const reviews = await db
      .select()
      .from(schema.agentReviews)
      .where(eq(schema.agentReviews.agentId, data.agentId))
      .orderBy(desc(schema.agentReviews.createdAt));

    const instanceRows = owner
      ? await db
          .select(instanceSelection)
          .from(schema.agentInstances)
          .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
          .where(
            and(eq(schema.agentInstances.agentId, data.agentId), eq(schema.agentInstances.owner, owner)),
          )
      : [];

    return {
      agent: toAgent(row.agent, row.creatorName, versions, reviews),
      instances: instanceRows.map(toInstanceSummary),
    };
  });

export type MyAgentGroup = {
  agent: DemoAgent;
  instances: DemoInstance[];
  earnings: number;
  actions: number;
};

/** "My agents": the operator's deployments grouped by the template they run. */
export const getMyAgents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ deployed: MyAgentGroup[]; totalAgents: number }> => {
    const db = await getDb();
    const owner = await requireOwner();

    const instanceRows = await db
      .select(instanceSelection)
      .from(schema.agentInstances)
      .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
      .where(eq(schema.agentInstances.owner, owner));

    const agentRows = await db
      .select({ agent: schema.agents, creatorName: schema.users.displayName })
      .from(schema.agents)
      .leftJoin(schema.users, eq(schema.agents.creator, schema.users.address));
    const agentById = new Map(agentRows.map((r) => [r.agent.id, r]));

    const byAgent = new Map<string, DemoInstance[]>();
    for (const row of instanceRows) {
      const inst = toInstanceSummary(row);
      (byAgent.get(inst.agentId) ?? byAgent.set(inst.agentId, []).get(inst.agentId)!).push(inst);
    }

    const deployed: MyAgentGroup[] = [];
    for (const [agentId, instances] of byAgent) {
      const ref = agentById.get(agentId);
      if (!ref) continue;
      deployed.push({
        agent: toAgent(ref.agent, ref.creatorName, [], []),
        instances,
        earnings: instances.reduce((s, i) => s + i.earnings, 0),
        actions: instances.reduce((s, i) => s + i.actions, 0),
      });
    }
    deployed.sort((a, b) => b.earnings - a.earnings);

    return { deployed, totalAgents: agentRows.length };
  },
);

/* ---- mutations ----------------------------------------------------------- */

export type DeployQuote =
  | { free: true }
  | { free: false; x402Version: number; requirements: PaymentRequirements };

const deployResource = (agentId: string) => `https://clad.protocol/deploy/${agentId}`;

/**
 * Quote the x402 USDC payment required to deploy an agent. Free agents (price 0)
 * return `{ free: true }`; paid agents return the payment requirements the client
 * signs (USDC on Base, paid to the treasury).
 */
export const getDeployQuote = createServerFn({ method: "POST" })
  .inputValidator((input: { agentId: string }) => input)
  .handler(async ({ data }): Promise<DeployQuote> => {
    await requireOwner();
    // Free while bots are in paper mode — no treasury/x402 until RUNTIME_MODE=live.
    if ((await getServerEnv("RUNTIME_MODE")) !== "live") return { free: true };
    const db = await getDb();
    const [agent] = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, data.agentId))
      .limit(1);
    if (!agent) throw new Error(`Unknown agent ${data.agentId}`);

    const atomic = toAtomic(agent.price);
    if (atomic <= 0n) return { free: true };

    const requirements = await buildDeployRequirements({
      agentId: agent.id,
      agentName: agent.name,
      atomic,
      resource: deployResource(agent.id),
    });
    return { free: false, x402Version: X402_VERSION, requirements };
  });

/**
 * Fork/deploy a marketplace agent into the operator's fleet. For paid agents the
 * client must pass a signed x402 `payment` (base64 X-PAYMENT) covering the price;
 * the treasury verifies + settles it on Base, then we mint the INST-#### instance,
 * record the fork fee with the real settlement tx, pay the creator royalty from the
 * treasury, and append Manifest/Fleet activity.
 */
export const deployAgent = createServerFn({ method: "POST" })
  .inputValidator((input: { agentId: string; objective?: string; payment?: string }) => {
    if (input?.objective && input.objective.trim().length > 500) {
      throw new Error("Objective must be 500 characters or fewer.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ instanceId: string }> => {
    const db = await getDb();
    const owner = await requireOwner();

    const [agent] = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, data.agentId))
      .limit(1);
    if (!agent) throw new Error(`Unknown agent ${data.agentId}`);

    // Charging (x402 fork fee + creator royalty + manifest anchoring) is OFF until
    // RUNTIME_MODE=live. While bots are in paper mode the deploy is free and never
    // touches the treasury — so you can test that bots work first.
    const charging = (await getServerEnv("RUNTIME_MODE")) === "live";

    // Settle the fork fee on-chain (x402) before minting anything (live only).
    const priceAtomic = toAtomic(agent.price);
    let forkFeeTx: string | null = null;
    if (charging && priceAtomic > 0n) {
      if (!data.payment) throw new Error("Payment is required to deploy this agent.");
      const requirements = await buildDeployRequirements({
        agentId: agent.id,
        agentName: agent.name,
        atomic: priceAtomic,
        resource: deployResource(agent.id),
      });
      const settled = await verifyAndSettle(decodeX402Payment(data.payment), requirements);
      forkFeeTx = settled.txHash;
    }

    const isPhysical = agent.kind === "physical";
    const now = new Date();
    const mode = charging ? "live" : "paper";
    const objective = data.objective?.trim() || undefined;

    // Advisory lock (1000001) + MAX query + insert in one transaction — prevents
    // concurrent deployments from allocating the same INST-#### id. Existing IDs
    // are untouched; new ones simply continue from the current max.
    const instanceId = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1000001)`);
      const [row] = await tx
        .select({ maxNum: sql<string>`COALESCE(MAX(CAST(REPLACE(id, 'INST-', '') AS INTEGER)), 1000)` })
        .from(schema.agentInstances);
      const id = `INST-${(Number(row?.maxNum) ?? 1000) + 1}`;
      await tx.insert(schema.agentInstances).values({
        id,
        agentId: agent.id,
        owner,
        name: objective || agent.name,
        status: "active",
        actionsCount: 0,
        earnings: 0,
        batteryLevel: isPhysical ? 100 : null,
        rosConnected: isPhysical ? true : null,
        manifestVersion: agent.version,
        region: isPhysical ? "Unassigned" : "Base mainnet",
        config: { objective, mode },
        createdAt: now,
        lastActivityAt: now,
      });
      return id;
    });

    await db
      .update(schema.agents)
      .set({ forkCount: agent.forkCount + 1 })
      .where(eq(schema.agents.id, agent.id));

    const [creator] = await db
      .select({ name: schema.users.displayName })
      .from(schema.users)
      .where(eq(schema.users.address, agent.creator))
      .limit(1);
    const counterparty = creator?.name ?? agent.creator;

    // Record the fork fee with the real settlement tx (paid agents only).
    if (priceAtomic > 0n && forkFeeTx) {
      await db.insert(schema.payments).values({
        instanceId,
        owner,
        amount: agent.price,
        currency: agent.currency,
        kind: "fork_fee",
        status: "settled",
        txHash: forkFeeTx,
        counterparty,
      });
    }

    // Pay the creator royalty from the treasury when the creator is a real address.
    const royaltyUsd = Math.round(agent.price * (agent.royaltyPct / 100) * 1e6) / 1e6;
    if (charging && royaltyUsd > 0) {
      let royaltyTx: string | null = null;
      if (isAddress(agent.creator)) {
        try {
          royaltyTx = await sendUsdc(agent.creator, toAtomic(royaltyUsd));
        } catch (err) {
          console.error(`[deploy] royalty payout failed for ${instanceId}:`, err);
        }
      }
      await db.insert(schema.payments).values({
        instanceId,
        owner,
        amount: royaltyUsd,
        currency: agent.currency,
        kind: "royalty",
        status: royaltyTx ? "settled" : "pending",
        txHash: royaltyTx,
        counterparty,
      });
    }

    // Content-address + anchor the forked manifest (Stage E, live only — it signs
    // with the treasury key). Best-effort: a pinning hiccup must never fail deploy.
    let manifestHash: string | null = null;
    if (charging) {
      try {
        manifestHash = (await pinManifest(agent, db)).manifestHash;
      } catch (err) {
        console.error(`[deploy] manifest pin failed for ${agent.id}:`, err);
      }
    }

    await db.insert(schema.activity).values([
      {
        instanceId,
        owner,
        tag: "Manifest",
        message: manifestHash
          ? `Forked ${agent.name} manifest v${agent.version} (${manifestHash.slice(0, 12)}…)`
          : `Forked ${agent.name} manifest v${agent.version}`,
      },
      { instanceId, owner, tag: "Fleet", message: `Deployed ${instanceId} to fleet` },
    ]);

    return { instanceId };
  });
