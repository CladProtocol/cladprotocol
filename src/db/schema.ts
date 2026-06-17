import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Postgres (Supabase) schema via Drizzle. Ported 1:1 from the original SQLite
// schema — same tables, columns, names and semantics.
//
// Money: stored as `double precision` in whole USDC for v1 simplicity (e.g.
// 0.5 = 0.5 USDC); converted to integer atomic units only at the chain edge
// (toAtomic/fromAtomic in src/api/chain.ts). Timestamps are `timestamptz` and are
// serialized to ISO strings at the server-fn boundary (iso() in api/serialize.ts).

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Per-instance runtime config consumed by the agent runner (src/runtime). The
 * strategy reads `objective`/`params`; `mode` gates real funds — `paper` is fully
 * simulated (no on-chain transfers), `live` moves real USDC. Defaults to `paper`.
 */
export type InstanceRuntimeMode = "paper" | "live";
export type InstanceConfig = {
  objective?: string;
  mode: InstanceRuntimeMode;
  params?: Record<string, unknown>;
};
const DEFAULT_INSTANCE_CONFIG: InstanceConfig = { mode: "paper" };

/** A wallet that has connected / authenticated. Wallet address is the identity. */
export const users = pgTable("users", {
  // Lowercased EVM address (0x...).
  address: text("address").primaryKey(),
  displayName: text("display_name"),
  // ENS name resolved for the address, if any (e.g. "operator.clad.eth").
  ens: text("ens"),
  ...timestamps,
});

/** Per-operator notification preferences (settings page toggles). */
export const userSettings = pgTable("user_settings", {
  owner: text("owner")
    .primaryKey()
    .references(() => users.address),
  notifyAttestations: boolean("notify_attestations").notNull().default(true),
  notifySettlements: boolean("notify_settlements").notNull().default(true),
  notifyFleetAlerts: boolean("notify_fleet_alerts").notNull().default(true),
  notifyWeeklyDigest: boolean("notify_weekly_digest").notNull().default(false),
});

/**
 * A marketplace listing / template that can be forked or purchased.
 * "agents" covers both digital agents and physical robotics templates.
 */
export const agents = pgTable("agents", {
  id: text("id").primaryKey(), // e.g. "AGT-0481"
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  // "digital" | "physical"
  kind: text("kind", { enum: ["digital", "physical"] }).notNull(),
  // digital: MEV | Arbitrage | Mempool ; physical: Ground | Aerial | Manipulation
  category: text("category").notNull(),
  creator: text("creator").notNull(), // wallet address of the developer
  description: text("description").notNull().default(""),
  // Long-form marketing copy shown on the agent detail page.
  longDescription: text("long_description").notNull().default(""),
  // Free-form tags + capability bullets, stored as JSON arrays.
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
  // Price to fork/purchase, in `currency`.
  price: doublePrecision("price").notNull().default(0),
  currency: text("currency").notNull().default("USDC"),
  // Perpetual royalty taken by the original creator, as a percent (e.g. 5 = 5%).
  royaltyPct: doublePrecision("royalty_pct").notNull().default(0),
  rating: doublePrecision("rating").notNull().default(0), // 0..5
  forkCount: integer("fork_count").notNull().default(0),
  // Performance metrics (nullable — not all apply to every kind).
  winRate: doublePrecision("win_rate"), // digital, percent
  uptime: doublePrecision("uptime"), // percent
  distanceNavigatedKm: doublePrecision("distance_navigated_km"), // physical
  // Verified by the IRONCLAD ledger.
  verified: boolean("verified").notNull().default(false),
  ...timestamps,
});

/** Published version history for an agent (agent detail "Version history"). */
export const agentVersions = pgTable("agent_versions", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  version: text("version").notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }).notNull(),
  notes: text("notes").notNull().default(""),
  // Content-addressed manifest: SHA-256 of the canonical manifest JSON (set the
  // first time a fork pins this version) + the Arweave tx the manifest is anchored
  // to (null while pending anchor). See src/api/manifests.ts (Stage E).
  manifestHash: text("manifest_hash"),
  arweaveTx: text("arweave_tx"),
});

/** User reviews for an agent (agent detail "Reviews"). */
export const agentReviews = pgTable("agent_reviews", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  author: text("author").notNull(), // display name or shortened address
  address: text("address").notNull(),
  rating: integer("rating").notNull(), // 1..5
  body: text("body").notNull(),
  ...timestamps,
});

/** A deployed running instance of an agent, owned by a wallet (the fleet). */
export const agentInstances = pgTable("agent_instances", {
  id: text("id").primaryKey(), // e.g. "INST-1042"
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  owner: text("owner")
    .notNull()
    .references(() => users.address),
  name: text("name").notNull(),
  // "active" | "idle" | "paused" | "halted"
  status: text("status", { enum: ["active", "idle", "paused", "halted"] })
    .notNull()
    .default("active"),
  actionsCount: integer("actions_count").notNull().default(0),
  earnings: doublePrecision("earnings").notNull().default(0), // total earned, in USDC
  // Physical-only hardware telemetry (nullable for digital agents).
  batteryLevel: doublePrecision("battery_level"), // 0..100
  rosConnected: boolean("ros_connected"),
  manifestVersion: text("manifest_version").notNull().default("1.0.0"),
  // Where the unit runs ("Base mainnet", "DC-East · Bay 3", …).
  region: text("region").notNull().default(""),
  // Runtime config the agent runner reads each tick (objective + paper/live mode).
  config: jsonb("config").$type<InstanceConfig>().notNull().default(DEFAULT_INSTANCE_CONFIG),
  ...timestamps, // createdAt doubles as "deployedAt"
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
});

/** Machine task log for an instance ("Recent actions" table on fleet detail). */
export const instanceActions = pgTable("instance_actions", {
  id: text("id").primaryKey(), // e.g. "TSK-9912"
  instanceId: text("instance_id")
    .notNull()
    .references(() => agentInstances.id),
  label: text("label").notNull(),
  // "success" | "reverted"
  result: text("result", { enum: ["success", "reverted"] }).notNull(),
  value: doublePrecision("value").notNull().default(0), // USDC realized by this task
  // IRONCLAD batch that covered this action (null = un-attested; the cron picks
  // these up, hashes them into a Merkle root, and anchors a batch). See attest.ts.
  batchNumber: integer("batch_number"),
  ...timestamps,
});

/**
 * Daily earnings rollup per instance, idx 0..6 (6 days ago → today). Powers the
 * fleet-detail earnings chart and the overview revenue chart (summed per idx).
 * A rollup table keeps the 7-point series cheap to read without redundant joins.
 */
export const instanceDailyEarnings = pgTable("instance_daily_earnings", {
  id: serial("id").primaryKey(),
  instanceId: text("instance_id")
    .notNull()
    .references(() => agentInstances.id),
  idx: integer("idx").notNull(), // 0 = 6 days ago … 6 = today
  value: doublePrecision("value").notNull(),
});

/** Live activity / log entries surfaced in the Command Center feed. */
export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  instanceId: text("instance_id").references(() => agentInstances.id),
  owner: text("owner").references(() => users.address),
  message: text("message").notNull(),
  // "x402" | "IRONCLAD" | "Fleet" | "Manifest" | "Telemetry"
  tag: text("tag").notNull(),
  ...timestamps,
});

/** IRONCLAD ledger entries: batched, hashed attestations of executed work. */
export const attestations = pgTable("attestations", {
  id: serial("id").primaryKey(),
  instanceId: text("instance_id")
    .notNull()
    .references(() => agentInstances.id),
  batchNumber: integer("batch_number").notNull(),
  // Arweave tx id once anchored; null while pending (status derives from this).
  arweaveTx: text("arweave_tx"),
  sha256: text("sha256").notNull(),
  // Number of actions covered by this batch + the batch window.
  actions: integer("actions").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }),
  windowEnd: timestamp("window_end", { withTimezone: true }),
  // Raw batched JSON/log payload, expandable in the ledger UI.
  payload: text("payload").notNull().default("{}"),
  ...timestamps,
});

/** x402 payment receipts (settlements, fork fees, royalties, withdrawals). */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  instanceId: text("instance_id").references(() => agentInstances.id),
  owner: text("owner").references(() => users.address),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("USDC"),
  // "settlement" | "fork_fee" | "royalty" | "withdrawal"
  kind: text("kind").notNull(),
  // "settled" | "pending"
  status: text("status", { enum: ["settled", "pending"] }).notNull().default("settled"),
  txHash: text("tx_hash"),
  counterparty: text("counterparty"),
  ...timestamps,
});

export type Agent = typeof agents.$inferSelect;
export type AgentVersionRow = typeof agentVersions.$inferSelect;
export type AgentReviewRow = typeof agentReviews.$inferSelect;
export type AgentInstance = typeof agentInstances.$inferSelect;
export type InstanceAction = typeof instanceActions.$inferSelect;
export type InstanceDailyEarning = typeof instanceDailyEarnings.$inferSelect;
export type ActivityEntry = typeof activity.$inferSelect;
export type Attestation = typeof attestations.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
