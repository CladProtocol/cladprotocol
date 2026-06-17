/**
 * Seeds the Supabase Postgres database (DATABASE_URL) with the exact dataset the
 * frontend demo renders. To guarantee the DB matches the data contract
 * field-for-field, this seed imports the fixtures straight out of
 * `src/lib/demo-data.ts` and fans them out across the real schema tables.
 *
 * Run with:  bun scripts/db-seed.ts   (or `bun run db:seed`)
 * Requires the schema to already exist — run `bun run db:migrate` first, and have
 * a Postgres running (local: `supabase start`).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { pgClient } from "../src/db/index";
import * as schema from "../src/db/schema";
import {
  AGENTS,
  INSTANCES,
  ACTIVITY,
  ATTESTATIONS,
  PAYMENTS,
  OPERATOR,
} from "../src/lib/demo-data";

const url = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const db = drizzle(pgClient(url), { schema });

// The wallet that owns the demo fleet. Defaults to the fixture operator, but set
// SEED_OWNER=0x<your-wallet> to seed the fleet under YOUR connected MetaMask
// address so the (per-wallet) Command Center shows data when you sign in.
// Stored lowercased to match how SIWE auth records `owner` (see api/auth.ts).
const OPERATOR_ADDRESS = (process.env.SEED_OWNER ?? OPERATOR.address).toLowerCase();
const isCustomOwner = OPERATOR_ADDRESS !== OPERATOR.address.toLowerCase();

const date = (iso: string) => new Date(iso);

async function main() {
  // Delete children before parents (FK-safe regardless of pragma state).
  await db.delete(schema.payments);
  await db.delete(schema.attestations);
  await db.delete(schema.activity);
  await db.delete(schema.instanceDailyEarnings);
  await db.delete(schema.instanceActions);
  await db.delete(schema.agentInstances);
  await db.delete(schema.agentReviews);
  await db.delete(schema.agentVersions);
  await db.delete(schema.userSettings);
  await db.delete(schema.agents);
  await db.delete(schema.users);

  // ---- users: the operator + every distinct agent creator -----------------
  const creators = new Map<string, string>(); // address -> display name
  for (const a of AGENTS) creators.set(a.creatorAddress, a.creator);
  // Avoid a PK clash if the custom owner happens to also be a creator address.
  creators.delete(OPERATOR_ADDRESS);

  await db.insert(schema.users).values([
    {
      address: OPERATOR_ADDRESS,
      displayName: OPERATOR.displayName,
      // Don't attach the fixture ENS to a real personal wallet.
      ens: isCustomOwner ? null : OPERATOR.ens,
      createdAt: date(OPERATOR.joinedAt),
    },
    ...Array.from(creators, ([address, displayName]) => ({ address, displayName })),
  ]);

  await db.insert(schema.userSettings).values({
    owner: OPERATOR_ADDRESS,
    notifyAttestations: true,
    notifySettlements: true,
    notifyFleetAlerts: true,
    notifyWeeklyDigest: false,
  });

  // ---- agents + versions + reviews ----------------------------------------
  await db.insert(schema.agents).values(
    AGENTS.map((a) => ({
      id: a.id,
      name: a.name,
      version: a.version,
      kind: a.kind,
      category: a.category,
      creator: a.creatorAddress,
      description: a.description,
      longDescription: a.longDescription,
      tags: a.tags,
      capabilities: a.capabilities,
      price: a.price,
      currency: a.currency,
      royaltyPct: a.royaltyPct,
      rating: a.rating,
      forkCount: a.forkCount,
      winRate: a.winRate,
      uptime: a.uptime,
      distanceNavigatedKm: a.distanceNavigatedKm,
      verified: a.verified,
    })),
  );

  await db.insert(schema.agentVersions).values(
    AGENTS.flatMap((a) =>
      a.versions.map((v) => ({
        agentId: a.id,
        version: v.version,
        releasedAt: date(v.releasedAt),
        notes: v.notes,
      })),
    ),
  );

  await db.insert(schema.agentReviews).values(
    AGENTS.flatMap((a) =>
      a.reviews.map((r) => ({
        agentId: a.id,
        author: r.author,
        address: r.address,
        rating: r.rating,
        body: r.body,
        createdAt: date(r.at),
      })),
    ),
  );

  // ---- instances + task log + daily earnings rollup -----------------------
  await db.insert(schema.agentInstances).values(
    INSTANCES.map((i) => ({
      id: i.id,
      agentId: i.agentId,
      owner: OPERATOR_ADDRESS,
      name: i.name,
      status: i.status,
      actionsCount: i.actions,
      earnings: i.earnings,
      batteryLevel: i.batteryLevel,
      rosConnected: i.rosConnected,
      manifestVersion: i.manifestVersion,
      region: i.region,
      createdAt: date(i.deployedAt),
      lastActivityAt: date(i.lastActivityAt),
    })),
  );

  await db.insert(schema.instanceActions).values(
    INSTANCES.flatMap((i) =>
      i.recentActions.map((t) => ({
        id: t.id,
        instanceId: i.id,
        label: t.label,
        result: t.result,
        value: t.value,
        createdAt: date(t.at),
      })),
    ),
  );

  await db.insert(schema.instanceDailyEarnings).values(
    INSTANCES.flatMap((i) =>
      i.earningsSeries.map((p, idx) => ({ instanceId: i.id, idx, value: p.value })),
    ),
  );

  // ---- activity feed ------------------------------------------------------
  await db.insert(schema.activity).values(
    ACTIVITY.map((a) => ({
      instanceId: a.instanceId,
      owner: OPERATOR_ADDRESS,
      message: a.message,
      tag: a.tag,
      createdAt: date(a.at),
    })),
  );

  // ---- IRONCLAD attestations ----------------------------------------------
  await db.insert(schema.attestations).values(
    ATTESTATIONS.map((a) => ({
      instanceId: a.instanceId,
      batchNumber: a.batchNumber,
      arweaveTx: a.arweaveTx,
      sha256: a.sha256,
      actions: a.actions,
      windowStart: date(a.windowStart),
      windowEnd: date(a.windowEnd),
      payload: JSON.stringify(a.payload),
      createdAt: date(a.at),
    })),
  );

  // ---- x402 payments ------------------------------------------------------
  await db.insert(schema.payments).values(
    PAYMENTS.map((p) => ({
      instanceId: p.instanceId,
      owner: OPERATOR_ADDRESS,
      amount: p.amount,
      currency: p.currency,
      kind: p.kind,
      status: p.status,
      txHash: p.txHash,
      counterparty: p.counterparty,
      createdAt: date(p.at),
    })),
  );

  const counts = {
    users: (await db.select().from(schema.users)).length,
    agents: (await db.select().from(schema.agents)).length,
    versions: (await db.select().from(schema.agentVersions)).length,
    reviews: (await db.select().from(schema.agentReviews)).length,
    instances: (await db.select().from(schema.agentInstances)).length,
    tasks: (await db.select().from(schema.instanceActions)).length,
    dailyEarnings: (await db.select().from(schema.instanceDailyEarnings)).length,
    activity: (await db.select().from(schema.activity)).length,
    attestations: (await db.select().from(schema.attestations)).length,
    payments: (await db.select().from(schema.payments)).length,
  };
  console.info(`[seed] done (owner ${OPERATOR_ADDRESS}):`, counts);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
