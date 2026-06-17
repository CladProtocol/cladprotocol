/**
 * Frontend demo dataset for Clad Protocol.
 *
 * This is the single source of truth for the clickable frontend demo. Every
 * page (marketplace, command center, ledgers, payments) reads from here, so the
 * whole product is navigable WITHOUT a backend or database running.
 *
 * The shapes intentionally mirror `src/db/schema.ts` so this can be swapped for
 * live server data later by replacing the lookups below with query results.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AgentKind = "digital" | "physical";
export type InstanceStatus = "active" | "idle" | "paused" | "halted";
export type LedgerStatus = "anchored" | "pending";
export type PaymentKind = "settlement" | "fork_fee" | "royalty" | "withdrawal";

export type Review = {
  author: string;
  address: string;
  rating: number;
  body: string;
  at: string; // ISO
};

export type AgentVersion = {
  version: string;
  releasedAt: string; // ISO
  notes: string;
};

export type DemoAgent = {
  id: string;
  name: string;
  version: string;
  kind: AgentKind;
  category: string;
  creator: string; // display name
  creatorAddress: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  royaltyPct: number;
  rating: number;
  forkCount: number;
  winRate: number | null;
  uptime: number | null;
  distanceNavigatedKm: number | null;
  verified: boolean;
  tags: string[];
  capabilities: string[];
  versions: AgentVersion[];
  reviews: Review[];
};

export type FleetAction = {
  id: string;
  label: string;
  result: "success" | "reverted";
  value: number; // USDC
  at: string; // ISO
};

export type DemoInstance = {
  id: string;
  agentId: string;
  name: string;
  kind: AgentKind;
  status: InstanceStatus;
  actions: number;
  earnings: number;
  manifestVersion: string;
  batteryLevel: number | null;
  rosConnected: boolean | null;
  region: string;
  deployedAt: string; // ISO
  lastActivityAt: string; // ISO
  earningsSeries: { label: string; value: number }[];
  recentActions: FleetAction[];
};

export type DemoActivity = {
  id: number;
  instanceId: string | null;
  message: string;
  tag: "x402" | "IRONCLAD" | "Fleet" | "Manifest" | "Telemetry";
  at: string; // ISO
};

/** A JSON-serializable value (server functions must return serializable data). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DemoAttestation = {
  id: number;
  batchNumber: number;
  instanceId: string;
  instanceName: string;
  status: LedgerStatus;
  arweaveTx: string | null;
  sha256: string;
  actions: number;
  windowStart: string; // ISO
  windowEnd: string; // ISO
  payload: Record<string, JsonValue>;
  at: string; // ISO
};

export type DemoPayment = {
  id: number;
  instanceId: string | null;
  instanceName: string | null;
  amount: number;
  currency: string;
  kind: PaymentKind;
  status: "settled" | "pending";
  txHash: string;
  counterparty: string;
  at: string; // ISO
};

/* ------------------------------------------------------------------ */
/* Time helpers (build a believable recent timeline at module load)    */
/* ------------------------------------------------------------------ */

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW - ms).toISOString();

/* ------------------------------------------------------------------ */
/* Operator identity (demo)                                            */
/* ------------------------------------------------------------------ */

export const OPERATOR = {
  displayName: "Demo Operator",
  address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  ens: "operator.clad.eth",
  joinedAt: ago(214 * DAY),
};

const CREATOR_A = { name: "Forge Labs", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984" };
const CREATOR_B = { name: "Vanguard Robotics", address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84" };
const CREATOR_C = { name: "Helix Systems", address: "0x6b175474e89094c44da98b954eedeac495271d0f" };
const CREATOR_D = { name: "Mesh Compute", address: "0x2b1c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e" };
const CREATOR_E = { name: "Cipher Works", address: "0x5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f" };
const CREATOR_F = { name: "Datum Collective", address: "0x90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3" };

/* ------------------------------------------------------------------ */
/* Marketplace agents                                                  */
/* ------------------------------------------------------------------ */

export const AGENTS: DemoAgent[] = [
  {
    id: "AGT-0481",
    name: "Market Maker β",
    version: "2.3.0",
    kind: "digital",
    category: "MEV",
    creator: CREATOR_A.name,
    creatorAddress: CREATOR_A.address,
    description: "Adaptive on-chain market maker with MEV-aware order routing on Base.",
    longDescription:
      "Market Maker β continuously quotes two-sided liquidity across Base DEXs, rebalancing inventory with MEV-aware routing to minimize toxic flow. Every quote, fill, and rebalance is signed and streamed to the IRONCLAD ledger, so PnL is fully reconstructable and auditable.",
    price: 0.5,
    currency: "USDC",
    royaltyPct: 5,
    rating: 4.8,
    forkCount: 312,
    winRate: 71.4,
    uptime: 99.98,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["MEV", "Market making", "Base"],
    capabilities: [
      "Two-sided quoting across Aerodrome, Uniswap v3 & SushiSwap",
      "Inventory-aware skew with configurable risk limits",
      "Atomic rebalance bundles with revert protection",
      "x402 settlement on every realized fill",
    ],
    versions: [
      { version: "2.3.0", releasedAt: ago(9 * DAY), notes: "MEV-aware routing v2, lower toxic flow." },
      { version: "2.2.1", releasedAt: ago(31 * DAY), notes: "Hotfix: inventory skew under thin books." },
      { version: "2.1.0", releasedAt: ago(74 * DAY), notes: "Added Aerodrome pools." },
    ],
    reviews: [
      { author: "blockwright.eth", address: "0x3ab…71", rating: 5, body: "Best-in-class fill quality on Base. The ledger trace makes accounting trivial.", at: ago(4 * DAY) },
      { author: "0x91c…0e", address: "0x91c…0e", rating: 4, body: "Solid uptime. Wish the risk limits were a bit more granular.", at: ago(18 * DAY) },
    ],
  },
  {
    id: "AGT-0467",
    name: "Arb Hunter",
    version: "3.1.0",
    kind: "digital",
    category: "Arbitrage",
    creator: CREATOR_B.name,
    creatorAddress: CREATOR_B.address,
    description: "Cross-DEX arbitrage executor with atomic bundle settlement.",
    longDescription:
      "Arb Hunter scans Base liquidity venues for price dislocations and executes atomic multi-hop arbitrage in a single bundle. Failed simulations never touch the chain, and every realized arb settles through x402 with a matching IRONCLAD attestation.",
    price: 0.75,
    currency: "USDC",
    royaltyPct: 6,
    rating: 4.9,
    forkCount: 504,
    winRate: 68.9,
    uptime: 99.95,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Arbitrage", "Atomic", "Base"],
    capabilities: [
      "Multi-hop path search across 14 venues",
      "Pre-trade simulation with revert guard",
      "Flash-settled atomic bundles",
      "Per-arb x402 receipts",
    ],
    versions: [
      { version: "3.1.0", releasedAt: ago(6 * DAY), notes: "Path search 2x faster, added 4 venues." },
      { version: "3.0.0", releasedAt: ago(52 * DAY), notes: "Rewrote bundle builder." },
    ],
    reviews: [
      { author: "quantfox.eth", address: "0x77a…b2", rating: 5, body: "Consistent edge, near-zero reverts. Forked twice already.", at: ago(2 * DAY) },
    ],
  },
  {
    id: "AGT-0473",
    name: "Mempool Sentinel",
    version: "1.7.2",
    kind: "digital",
    category: "Mempool",
    creator: CREATOR_A.name,
    creatorAddress: CREATOR_A.address,
    description: "Streams and classifies pending Base transactions for front-run defense.",
    longDescription:
      "Mempool Sentinel ingests the Base pending pool, classifies intent (sandwich, liquidation, oracle update), and emits early-warning signals your other agents can subscribe to. It is a defensive primitive: it does not trade, it informs.",
    price: 0.35,
    currency: "USDC",
    royaltyPct: 4,
    rating: 4.5,
    forkCount: 188,
    winRate: 64.1,
    uptime: 99.91,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Mempool", "Signals", "Defense"],
    capabilities: [
      "Real-time pending-pool classification",
      "Sandwich & liquidation detection",
      "Pub/sub signal bus for downstream agents",
      "Signed signal attestations",
    ],
    versions: [
      { version: "1.7.2", releasedAt: ago(13 * DAY), notes: "Improved sandwich precision." },
      { version: "1.6.0", releasedAt: ago(60 * DAY), notes: "Added liquidation classifier." },
    ],
    reviews: [
      { author: "0x4de…9a", address: "0x4de…9a", rating: 5, body: "Cut our front-run losses dramatically.", at: ago(11 * DAY) },
      { author: "shieldwall.eth", address: "0x2b1…cc", rating: 4, body: "Great signals, would love a Python client.", at: ago(27 * DAY) },
    ],
  },
  {
    id: "AGT-0468",
    name: "Warehouse Rover R4",
    version: "4.0.1",
    kind: "physical",
    category: "Ground",
    creator: CREATOR_B.name,
    creatorAddress: CREATOR_B.address,
    description: "Autonomous warehouse ground rover with ROS 2 navigation stack.",
    longDescription:
      "Warehouse Rover R4 is a full ROS 2 navigation stack template for autonomous ground robots. It handles SLAM, dynamic obstacle avoidance, and task queueing, publishing every waypoint and pick as IRONCLAD-verified telemetry. Settles task fees over x402.",
    price: 1.2,
    currency: "USDC",
    royaltyPct: 8,
    rating: 4.7,
    forkCount: 96,
    winRate: null,
    uptime: 99.4,
    distanceNavigatedKm: 1840.5,
    verified: true,
    tags: ["Robotics", "Ground", "ROS 2"],
    capabilities: [
      "Nav2 stack with dynamic obstacle avoidance",
      "Cryptographic kill-switch & actuator health checks",
      "Per-task telemetry attestations",
      "Battery & fault-aware task scheduling",
    ],
    versions: [
      { version: "4.0.1", releasedAt: ago(20 * DAY), notes: "Nav2 humble support, battery telemetry." },
      { version: "3.5.0", releasedAt: ago(88 * DAY), notes: "Dock-charging routine." },
    ],
    reviews: [
      { author: "logiprime.eth", address: "0x8cc…41", rating: 5, body: "Deployed a fleet of 12 in our DC. Rock solid.", at: ago(7 * DAY) },
    ],
  },
  {
    id: "AGT-0461",
    name: "Survey Drone D2",
    version: "2.0.0",
    kind: "physical",
    category: "Aerial",
    creator: CREATOR_B.name,
    creatorAddress: CREATOR_B.address,
    description: "Aerial survey drone publishing IRONCLAD-verified telemetry frames.",
    longDescription:
      "Survey Drone D2 flies pre-planned survey grids, capturing geotagged imagery and publishing each frame with a cryptographic attestation. Ideal for inspection, mapping, and compliance workloads where provenance of every frame matters.",
    price: 0.95,
    currency: "USDC",
    royaltyPct: 7,
    rating: 4.6,
    forkCount: 142,
    winRate: null,
    uptime: 98.7,
    distanceNavigatedKm: 920.3,
    verified: true,
    tags: ["Robotics", "Aerial", "Survey"],
    capabilities: [
      "Autonomous grid survey planning",
      "Geotagged frame attestations",
      "Return-to-home failsafe",
      "Live telemetry streaming",
    ],
    versions: [
      { version: "2.0.0", releasedAt: ago(34 * DAY), notes: "New flight controller, frame signing." },
      { version: "1.4.0", releasedAt: ago(120 * DAY), notes: "Wind-compensated planner." },
    ],
    reviews: [
      { author: "0x55b…12", address: "0x55b…12", rating: 5, body: "Frame provenance passed our auditor instantly.", at: ago(15 * DAY) },
    ],
  },
  {
    id: "AGT-0455",
    name: "Pick-Place Arm X1",
    version: "1.4.0",
    kind: "physical",
    category: "Manipulation",
    creator: CREATOR_A.name,
    creatorAddress: CREATOR_A.address,
    description: "6-DOF manipulation arm template for bin-picking and assembly tasks.",
    longDescription:
      "Pick-Place Arm X1 is a 6-DOF manipulation template with grasp planning and force feedback. Suited to bin-picking, kitting, and light assembly. Currently pending IRONCLAD verification — telemetry signing is in beta.",
    price: 1.5,
    currency: "USDC",
    royaltyPct: 9,
    rating: 4.4,
    forkCount: 61,
    winRate: null,
    uptime: 99.1,
    distanceNavigatedKm: null,
    verified: false,
    tags: ["Robotics", "Manipulation", "Beta"],
    capabilities: [
      "Grasp planning with force feedback",
      "Bin-picking & kitting routines",
      "Collision-aware motion planning",
      "Telemetry signing (beta)",
    ],
    versions: [
      { version: "1.4.0", releasedAt: ago(41 * DAY), notes: "Force feedback grasp v1." },
      { version: "1.2.0", releasedAt: ago(96 * DAY), notes: "Improved IK solver." },
    ],
    reviews: [
      { author: "0x19a…77", address: "0x19a…77", rating: 4, body: "Promising. Waiting on full verification before scaling.", at: ago(22 * DAY) },
    ],
  },
  {
    id: "AGT-0449",
    name: "Yield Router",
    version: "2.6.0",
    kind: "digital",
    category: "Arbitrage",
    creator: CREATOR_C.name,
    creatorAddress: CREATOR_C.address,
    description: "Auto-compounding yield router across Base lending markets.",
    longDescription:
      "Yield Router monitors supply and borrow rates across Base money markets and rotates capital to the best risk-adjusted venue, auto-compounding rewards. Position changes are attested so LPs can verify the strategy never deviated from its mandate.",
    price: 0.6,
    currency: "USDC",
    royaltyPct: 5,
    rating: 4.7,
    forkCount: 233,
    winRate: 73.2,
    uptime: 99.93,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Yield", "DeFi", "Base"],
    capabilities: [
      "Cross-market rate monitoring",
      "Risk-adjusted capital rotation",
      "Auto-compounding rewards",
      "Mandate-compliance attestations",
    ],
    versions: [
      { version: "2.6.0", releasedAt: ago(5 * DAY), notes: "Added two new lending venues." },
      { version: "2.4.0", releasedAt: ago(48 * DAY), notes: "Gas-aware rebalance throttle." },
    ],
    reviews: [
      { author: "yieldmaxi.eth", address: "0x6f0…aa", rating: 5, body: "Set and forget. The attestations sold our risk team.", at: ago(9 * DAY) },
    ],
  },
  {
    id: "AGT-0442",
    name: "Inspection Quadruped Q3",
    version: "1.1.0",
    kind: "physical",
    category: "Ground",
    creator: CREATOR_C.name,
    creatorAddress: CREATOR_C.address,
    description: "Legged inspection robot for industrial sites with thermal telemetry.",
    longDescription:
      "Inspection Quadruped Q3 patrols industrial sites on a fixed or adaptive route, capturing visual and thermal readings and flagging anomalies. Every reading is signed, building a tamper-evident inspection record on the IRONCLAD ledger.",
    price: 1.35,
    currency: "USDC",
    royaltyPct: 8,
    rating: 4.5,
    forkCount: 48,
    winRate: null,
    uptime: 98.9,
    distanceNavigatedKm: 412.8,
    verified: true,
    tags: ["Robotics", "Quadruped", "Inspection"],
    capabilities: [
      "Adaptive patrol routing",
      "Visual + thermal anomaly detection",
      "Signed inspection records",
      "Auto-dock recharge",
    ],
    versions: [
      { version: "1.1.0", releasedAt: ago(17 * DAY), notes: "Thermal anomaly classifier." },
      { version: "1.0.0", releasedAt: ago(63 * DAY), notes: "Initial release." },
    ],
    reviews: [
      { author: "0x2aa…b9", address: "0x2aa…b9", rating: 4, body: "Great coverage. Thermal flags are accurate.", at: ago(13 * DAY) },
    ],
  },
  {
    id: "AGT-0501",
    name: "Contact Enricher",
    version: "1.4.0",
    kind: "digital",
    category: "Data",
    creator: CREATOR_F.name,
    creatorAddress: CREATOR_F.address,
    description: "Resolves a wallet, domain, or handle into an enriched profile — paid per lookup.",
    longDescription:
      "Contact Enricher takes an address, domain, or social handle and returns a structured, source-cited profile: identity, links, and on-chain footprint. Every lookup settles over x402 and the response hash is anchored to IRONCLAD, so a consumer can prove exactly what the agent returned and when.",
    price: 0.25,
    currency: "USDC",
    royaltyPct: 4,
    rating: 4.6,
    forkCount: 274,
    winRate: null,
    uptime: 99.7,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Data", "Enrichment", "x402"],
    capabilities: [
      "Address / domain / handle resolution",
      "Source-cited profile assembly",
      "Per-lookup x402 settlement",
      "Signed response attestations",
    ],
    versions: [
      { version: "1.4.0", releasedAt: ago(7 * DAY), notes: "Added on-chain footprint join." },
      { version: "1.2.0", releasedAt: ago(40 * DAY), notes: "Faster handle resolution." },
    ],
    reviews: [
      { author: "growth.eth", address: "0x7c1…d4", rating: 5, body: "Plugged it into our pipeline in an hour. Pay-per-call beats a subscription.", at: ago(6 * DAY) },
    ],
  },
  {
    id: "AGT-0502",
    name: "Web Harvester",
    version: "2.1.0",
    kind: "digital",
    category: "Data",
    creator: CREATOR_F.name,
    creatorAddress: CREATOR_F.address,
    description: "Turns any URL into clean structured JSON, billed per page.",
    longDescription:
      "Web Harvester fetches a page, strips boilerplate, and returns structured fields against a requested schema. Built for agents that need fresh web data without running their own scrapers — each extraction is x402-settled and the output is hashed into the IRONCLAD ledger for provenance.",
    price: 0.18,
    currency: "USDC",
    royaltyPct: 3,
    rating: 4.4,
    forkCount: 196,
    winRate: null,
    uptime: 99.4,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Data", "Scraping", "Web"],
    capabilities: [
      "Boilerplate-stripped extraction",
      "Schema-guided structured output",
      "Per-page x402 billing",
      "Provenance-hashed responses",
    ],
    versions: [
      { version: "2.1.0", releasedAt: ago(11 * DAY), notes: "Schema-guided extraction." },
      { version: "1.8.0", releasedAt: ago(55 * DAY), notes: "Better dynamic-page rendering." },
    ],
    reviews: [
      { author: "0x4b8…21", address: "0x4b8…21", rating: 4, body: "Reliable structured output. Would love more concurrency.", at: ago(10 * DAY) },
    ],
  },
  {
    id: "AGT-0503",
    name: "Research Scout",
    version: "1.2.0",
    kind: "digital",
    category: "Research",
    creator: CREATOR_D.name,
    creatorAddress: CREATOR_D.address,
    description: "Answers a research question with a cited, sourced summary.",
    longDescription:
      "Research Scout runs a multi-step web search and returns a concise answer with inline citations. Designed to be a paid sub-skill other agents call mid-task — quote, pay, receive a sourced brief — with every answer signed so the citation trail is auditable.",
    price: 0.4,
    currency: "USDC",
    royaltyPct: 5,
    rating: 4.7,
    forkCount: 318,
    winRate: null,
    uptime: 99.6,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Research", "Search", "Summarization"],
    capabilities: [
      "Multi-step web search",
      "Inline-cited summaries",
      "Callable as a paid sub-skill",
      "Signed citation trail",
    ],
    versions: [
      { version: "1.2.0", releasedAt: ago(5 * DAY), notes: "Citation accuracy pass." },
      { version: "1.0.0", releasedAt: ago(44 * DAY), notes: "Initial release." },
    ],
    reviews: [
      { author: "analyst.eth", address: "0x9a2…7e", rating: 5, body: "The citations are what sold our compliance team.", at: ago(8 * DAY) },
    ],
  },
  {
    id: "AGT-0504",
    name: "Price Oracle Relay",
    version: "3.0.1",
    kind: "digital",
    category: "Oracle",
    creator: CREATOR_C.name,
    creatorAddress: CREATOR_C.address,
    description: "Signed, multi-source spot prices delivered per request.",
    longDescription:
      "Price Oracle Relay aggregates spot prices across CEX and DEX sources, medianizes them, and returns a signed quote a consumer can verify and even post on-chain. Each call is an x402 micropayment; the signed feed plus its IRONCLAD attestation make the price tamper-evident.",
    price: 0.3,
    currency: "USDC",
    royaltyPct: 5,
    rating: 4.8,
    forkCount: 401,
    winRate: null,
    uptime: 99.95,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Oracle", "Price", "Signed"],
    capabilities: [
      "CEX + DEX source aggregation",
      "Median price with outlier rejection",
      "Signed, postable quotes",
      "Per-call x402 settlement",
    ],
    versions: [
      { version: "3.0.1", releasedAt: ago(9 * DAY), notes: "Added two CEX sources." },
      { version: "2.7.0", releasedAt: ago(61 * DAY), notes: "Outlier rejection v2." },
    ],
    reviews: [
      { author: "0x1c4…aa", address: "0x1c4…aa", rating: 5, body: "Rock-solid feed, signature verifies every time.", at: ago(12 * DAY) },
    ],
  },
  {
    id: "AGT-0505",
    name: "Contract Sentinel",
    version: "1.5.0",
    kind: "digital",
    category: "Security",
    creator: CREATOR_E.name,
    creatorAddress: CREATOR_E.address,
    description: "Scans a deployed contract for known vulnerability patterns, per scan.",
    longDescription:
      "Contract Sentinel pulls a verified contract's bytecode and source, runs a battery of known-vulnerability detectors, and returns a severity-ranked report. Sold per scan over x402, with each report hashed to IRONCLAD so a project can prove it ran due diligence at a point in time.",
    price: 0.65,
    currency: "USDC",
    royaltyPct: 6,
    rating: 4.5,
    forkCount: 152,
    winRate: null,
    uptime: 99.2,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Security", "Audit", "Static analysis"],
    capabilities: [
      "Known-vuln pattern detection",
      "Severity-ranked findings",
      "Per-scan x402 settlement",
      "Timestamped, hashed reports",
    ],
    versions: [
      { version: "1.5.0", releasedAt: ago(14 * DAY), notes: "Added reentrancy variants." },
      { version: "1.3.0", releasedAt: ago(58 * DAY), notes: "Proxy-pattern awareness." },
    ],
    reviews: [
      { author: "0x6dd…90", address: "0x6dd…90", rating: 4, body: "Caught an issue our manual review missed.", at: ago(16 * DAY) },
    ],
  },
  {
    id: "AGT-0506",
    name: "Event Watcher",
    version: "2.0.0",
    kind: "digital",
    category: "Security",
    creator: CREATOR_E.name,
    creatorAddress: CREATOR_E.address,
    description: "Real-time on-chain event monitoring with signed alerts, billed per alert.",
    longDescription:
      "Event Watcher subscribes to contracts and wallets you care about and emits a signed alert the instant a matching event lands — large transfers, ownership changes, suspicious approvals. Consumers pay per alert over x402, and every alert is attested so the timeline is provable after the fact.",
    price: 0.22,
    currency: "USDC",
    royaltyPct: 4,
    rating: 4.4,
    forkCount: 167,
    winRate: null,
    uptime: 99.5,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Security", "Monitoring", "Alerts"],
    capabilities: [
      "Contract + wallet subscriptions",
      "Signed real-time alerts",
      "Per-alert x402 billing",
      "Attested alert timeline",
    ],
    versions: [
      { version: "2.0.0", releasedAt: ago(10 * DAY), notes: "Approval-drain heuristics." },
      { version: "1.6.0", releasedAt: ago(50 * DAY), notes: "Lower alert latency." },
    ],
    reviews: [
      { author: "guardian.eth", address: "0x2f7…cd", rating: 5, body: "Alerted us to a drained approval in seconds.", at: ago(9 * DAY) },
    ],
  },
  {
    id: "AGT-0507",
    name: "Inference Worker",
    version: "1.3.0",
    kind: "digital",
    category: "Compute",
    creator: CREATOR_D.name,
    creatorAddress: CREATOR_D.address,
    description: "Runs an open-model inference job and returns the result, paid per call.",
    longDescription:
      "Inference Worker exposes a hosted open model behind an x402 endpoint: send a prompt, pay the per-call fee, get the completion. It lets agents rent compute on demand without managing GPUs, and each job's request/response digest is anchored so usage is verifiable.",
    price: 0.35,
    currency: "USDC",
    royaltyPct: 5,
    rating: 4.6,
    forkCount: 289,
    winRate: null,
    uptime: 99.3,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Compute", "Inference", "AI"],
    capabilities: [
      "Hosted open-model inference",
      "On-demand, per-call compute",
      "x402-metered usage",
      "Digest-anchored jobs",
    ],
    versions: [
      { version: "1.3.0", releasedAt: ago(8 * DAY), notes: "Lower cold-start latency." },
      { version: "1.1.0", releasedAt: ago(47 * DAY), notes: "Added streaming responses." },
    ],
    reviews: [
      { author: "0x83a…11", address: "0x83a…11", rating: 5, body: "Cheaper than keeping a GPU warm for bursty load.", at: ago(7 * DAY) },
    ],
  },
  {
    id: "AGT-0508",
    name: "Sentiment Indexer",
    version: "1.1.0",
    kind: "digital",
    category: "Social",
    creator: CREATOR_D.name,
    creatorAddress: CREATOR_D.address,
    description: "Scores social sentiment for a token or topic, per query.",
    longDescription:
      "Sentiment Indexer ingests social streams for a token or topic and returns a normalized sentiment score with supporting samples. Built as a paid signal other agents subscribe to before they act — every score is signed so a consumer can reconcile a decision against the data it saw.",
    price: 0.28,
    currency: "USDC",
    royaltyPct: 4,
    rating: 4.3,
    forkCount: 138,
    winRate: null,
    uptime: 99.1,
    distanceNavigatedKm: null,
    verified: false,
    tags: ["Social", "Signals", "Sentiment"],
    capabilities: [
      "Multi-stream social ingestion",
      "Normalized sentiment scoring",
      "Sample-backed explanations",
      "Signed signal output",
    ],
    versions: [
      { version: "1.1.0", releasedAt: ago(12 * DAY), notes: "Sarcasm-aware classifier (beta)." },
      { version: "1.0.0", releasedAt: ago(39 * DAY), notes: "Initial release." },
    ],
    reviews: [
      { author: "0x5b2…7f", address: "0x5b2…7f", rating: 4, body: "Useful signal, still tuning thresholds on our end.", at: ago(15 * DAY) },
    ],
  },
  {
    id: "AGT-0509",
    name: "Caption Synth",
    version: "1.0.2",
    kind: "digital",
    category: "Compute",
    creator: CREATOR_F.name,
    creatorAddress: CREATOR_F.address,
    description: "Generates captions and alt-text for an image, billed per image.",
    longDescription:
      "Caption Synth takes an image URL and returns a caption plus accessibility alt-text. A small, composable paid skill for content and accessibility pipelines — each generation is an x402 micropayment and the output is hashed for auditability.",
    price: 0.12,
    currency: "USDC",
    royaltyPct: 3,
    rating: 4.5,
    forkCount: 174,
    winRate: null,
    uptime: 99.4,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Compute", "Content", "Accessibility"],
    capabilities: [
      "Image captioning",
      "Accessibility alt-text",
      "Per-image x402 billing",
      "Hashed outputs",
    ],
    versions: [
      { version: "1.0.2", releasedAt: ago(6 * DAY), notes: "Alt-text length tuning." },
      { version: "1.0.0", releasedAt: ago(33 * DAY), notes: "Initial release." },
    ],
    reviews: [
      { author: "a11y.eth", address: "0x7e0…b3", rating: 5, body: "Dropped it straight into our CMS for alt-text.", at: ago(5 * DAY) },
    ],
  },
  {
    id: "AGT-0510",
    name: "Polyglot Relay",
    version: "2.2.0",
    kind: "digital",
    category: "Compute",
    creator: CREATOR_F.name,
    creatorAddress: CREATOR_F.address,
    description: "Translates text between 90+ languages, paid per request.",
    longDescription:
      "Polyglot Relay is a pay-per-call translation endpoint covering 90+ languages with tone preservation. Designed to be wired into multilingual agent workflows — quote, pay, translate — with each request settled over x402 and digested into the ledger.",
    price: 0.15,
    currency: "USDC",
    royaltyPct: 3,
    rating: 4.6,
    forkCount: 222,
    winRate: null,
    uptime: 99.6,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Compute", "Language", "Translation"],
    capabilities: [
      "90+ language pairs",
      "Tone-preserving translation",
      "Per-request x402 settlement",
      "Ledger-digested requests",
    ],
    versions: [
      { version: "2.2.0", releasedAt: ago(9 * DAY), notes: "Added 12 language pairs." },
      { version: "2.0.0", releasedAt: ago(52 * DAY), notes: "Tone preservation." },
    ],
    reviews: [
      { author: "0x3c9…48", address: "0x3c9…48", rating: 5, body: "Quality holds up across the long tail of languages.", at: ago(11 * DAY) },
    ],
  },
  {
    id: "AGT-0511",
    name: "Wallet Profiler",
    version: "1.6.0",
    kind: "digital",
    category: "Analytics",
    creator: CREATOR_E.name,
    creatorAddress: CREATOR_E.address,
    description: "Risk-scores and labels an address from its on-chain history, per lookup.",
    longDescription:
      "Wallet Profiler analyzes an address's transaction graph and returns a risk score plus behavioral labels (bridge user, LP, mixer-adjacent, fresh wallet). A paid screening primitive other agents call before they transact — each profile is signed and attested for compliance trails.",
    price: 0.45,
    currency: "USDC",
    royaltyPct: 6,
    rating: 4.7,
    forkCount: 263,
    winRate: null,
    uptime: 99.5,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Analytics", "Risk", "On-chain"],
    capabilities: [
      "Transaction-graph analysis",
      "Risk scoring + behavioral labels",
      "Per-lookup x402 settlement",
      "Attested compliance trail",
    ],
    versions: [
      { version: "1.6.0", releasedAt: ago(7 * DAY), notes: "New label: mixer-adjacent." },
      { version: "1.4.0", releasedAt: ago(49 * DAY), notes: "Faster graph traversal." },
    ],
    reviews: [
      { author: "risk.eth", address: "0x8a1…02", rating: 5, body: "Screening step before every payout now.", at: ago(10 * DAY) },
    ],
  },
  {
    id: "AGT-0512",
    name: "Proof Checker",
    version: "1.0.0",
    kind: "digital",
    category: "Verification",
    creator: CREATOR_C.name,
    creatorAddress: CREATOR_C.address,
    description: "Verifies an attestation or credential and returns a signed verdict, per check.",
    longDescription:
      "Proof Checker validates a signed attestation, IRONCLAD batch, or verifiable credential — checking signatures, anchoring, and revocation — and returns a signed pass/fail verdict. The verifier-as-a-service primitive: agents pay per check to trust what another agent claims.",
    price: 0.2,
    currency: "USDC",
    royaltyPct: 4,
    rating: 4.6,
    forkCount: 119,
    winRate: null,
    uptime: 99.8,
    distanceNavigatedKm: null,
    verified: true,
    tags: ["Verification", "Attestation", "Trust"],
    capabilities: [
      "Signature + anchoring checks",
      "Revocation lookups",
      "Signed pass/fail verdicts",
      "Per-check x402 settlement",
    ],
    versions: [
      { version: "1.0.0", releasedAt: ago(4 * DAY), notes: "Initial release." },
    ],
    reviews: [
      { author: "0x9f3…7c", address: "0x9f3…7c", rating: 5, body: "Lets our agents trust each other without us in the loop.", at: ago(3 * DAY) },
    ],
  },
];

export const AGENT_CATEGORIES = [
  "All",
  "MEV",
  "Arbitrage",
  "Mempool",
  "Yield",
  "Data",
  "Research",
  "Oracle",
  "Security",
  "Compute",
  "Social",
  "Analytics",
  "Verification",
  "Ground",
  "Aerial",
  "Manipulation",
] as const;

/* ------------------------------------------------------------------ */
/* Operator fleet (deployed instances)                                 */
/* ------------------------------------------------------------------ */

function series(base: number, points: number, drift: number): { label: string; value: number }[] {
  const labels = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];
  const out: { label: string; value: number }[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v = Math.max(0, v + Math.round((Math.sin(i * 1.7) + 0.4) * drift));
    out.push({ label: labels[i] ?? `${points - i}d`, value: v });
  }
  return out;
}

export const INSTANCES: DemoInstance[] = [
  {
    id: "INST-1042",
    agentId: "AGT-0481",
    name: "Logistics Router α",
    kind: "digital",
    status: "active",
    actions: 12409,
    earnings: 3240,
    manifestVersion: "2.3.0",
    batteryLevel: null,
    rosConnected: null,
    region: "Base mainnet",
    deployedAt: ago(46 * DAY),
    lastActivityAt: ago(2 * MIN),
    earningsSeries: series(2600, 7, 120),
    recentActions: [
      { id: "TSK-9912", label: "Settled invoice 0x9f…ce", result: "success", value: 0.42, at: ago(2 * MIN) },
      { id: "TSK-9908", label: "Rebalanced inventory band", result: "success", value: 0.18, at: ago(14 * MIN) },
      { id: "TSK-9901", label: "Quote refresh (ETH/USDC)", result: "success", value: 0.05, at: ago(31 * MIN) },
      { id: "TSK-9894", label: "Cancelled stale order", result: "reverted", value: 0, at: ago(52 * MIN) },
    ],
  },
  {
    id: "INST-1039",
    agentId: "AGT-0468",
    name: "Warehouse Rover R4",
    kind: "physical",
    status: "active",
    actions: 8712,
    earnings: 2108,
    manifestVersion: "4.0.1",
    batteryLevel: 82,
    rosConnected: true,
    region: "DC-East · Bay 3",
    deployedAt: ago(38 * DAY),
    lastActivityAt: ago(1 * MIN),
    earningsSeries: series(1500, 7, 95),
    recentActions: [
      { id: "TSK-7710", label: "Completed pick task", result: "success", value: 1.08, at: ago(1 * MIN) },
      { id: "TSK-7702", label: "Navigated to Bay 7", result: "success", value: 0.0, at: ago(9 * MIN) },
      { id: "TSK-7698", label: "Telemetry frame batch signed", result: "success", value: 0.0, at: ago(22 * MIN) },
    ],
  },
  {
    id: "INST-1033",
    agentId: "AGT-0481",
    name: "Market Maker β",
    kind: "digital",
    status: "idle",
    actions: 21084,
    earnings: 5902,
    manifestVersion: "2.3.0",
    batteryLevel: null,
    rosConnected: null,
    region: "Base mainnet",
    deployedAt: ago(72 * DAY),
    lastActivityAt: ago(18 * MIN),
    earningsSeries: series(5200, 7, 140),
    recentActions: [
      { id: "TSK-8841", label: "Paused: low volatility regime", result: "success", value: 0, at: ago(18 * MIN) },
      { id: "TSK-8830", label: "Settled invoice 0x2a…77", result: "success", value: 0.31, at: ago(46 * MIN) },
    ],
  },
  {
    id: "INST-1028",
    agentId: "AGT-0461",
    name: "Survey Drone D2",
    kind: "physical",
    status: "active",
    actions: 3206,
    earnings: 1184,
    manifestVersion: "2.0.0",
    batteryLevel: 64,
    rosConnected: true,
    region: "Site-9 · North grid",
    deployedAt: ago(21 * DAY),
    lastActivityAt: ago(3 * MIN),
    earningsSeries: series(800, 7, 70),
    recentActions: [
      { id: "TSK-5521", label: "Survey grid 14 complete (98 frames)", result: "success", value: 0.74, at: ago(3 * MIN) },
      { id: "TSK-5510", label: "Frame batch signed & anchored", result: "success", value: 0.0, at: ago(27 * MIN) },
    ],
  },
  {
    id: "INST-1021",
    agentId: "AGT-0473",
    name: "Compliance Scanner",
    kind: "digital",
    status: "paused",
    actions: 942,
    earnings: 310,
    manifestVersion: "1.7.2",
    batteryLevel: null,
    rosConnected: null,
    region: "Base mainnet",
    deployedAt: ago(15 * DAY),
    lastActivityAt: ago(3 * HOUR),
    earningsSeries: series(240, 7, 22),
    recentActions: [
      { id: "TSK-3301", label: "Paused by operator", result: "success", value: 0, at: ago(3 * HOUR) },
      { id: "TSK-3290", label: "Flagged sandwich attempt", result: "success", value: 0.0, at: ago(5 * HOUR) },
    ],
  },
  {
    id: "INST-1014",
    agentId: "AGT-0449",
    name: "Yield Router (Treasury)",
    kind: "digital",
    status: "active",
    actions: 6431,
    earnings: 4015,
    manifestVersion: "2.6.0",
    batteryLevel: null,
    rosConnected: null,
    region: "Base mainnet",
    deployedAt: ago(58 * DAY),
    lastActivityAt: ago(7 * MIN),
    earningsSeries: series(3400, 7, 110),
    recentActions: [
      { id: "TSK-6620", label: "Rotated to Moonwell supply", result: "success", value: 0.0, at: ago(7 * MIN) },
      { id: "TSK-6611", label: "Compounded rewards", result: "success", value: 0.52, at: ago(2 * HOUR) },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */

export const ACTIVITY: DemoActivity[] = [
  { id: 1, instanceId: "INST-1042", tag: "x402", message: "INST-1042 settled invoice 0x9f…ce on Base", at: ago(2 * MIN) },
  { id: 2, instanceId: "INST-1039", tag: "Fleet", message: "Rover R4 completed task TSK-7710", at: ago(1 * MIN) },
  { id: 3, instanceId: "INST-1042", tag: "IRONCLAD", message: "Attestation batch #18,402 anchored to Arweave", at: ago(6 * MIN) },
  { id: 4, instanceId: "INST-1028", tag: "Telemetry", message: "Survey Drone D2 telemetry verified (98 frames)", at: ago(3 * MIN) },
  { id: 5, instanceId: "INST-1014", tag: "Fleet", message: "Yield Router rotated to Moonwell supply", at: ago(7 * MIN) },
  { id: 6, instanceId: "INST-1033", tag: "Manifest", message: "Manifest v2.3 published for Market Maker β", at: ago(18 * MIN) },
  { id: 7, instanceId: "INST-1014", tag: "x402", message: "INST-1014 compounded rewards (+$0.52)", at: ago(2 * HOUR) },
  { id: 8, instanceId: "INST-1021", tag: "Fleet", message: "Compliance Scanner paused by operator", at: ago(3 * HOUR) },
  { id: 9, instanceId: "INST-1039", tag: "IRONCLAD", message: "Attestation batch #18,401 pending anchor", at: ago(12 * MIN) },
  { id: 10, instanceId: "INST-1028", tag: "x402", message: "INST-1028 settled survey fee 0x7c…14", at: ago(28 * MIN) },
];

/* ------------------------------------------------------------------ */
/* IRONCLAD ledger (attestations)                                      */
/* ------------------------------------------------------------------ */

export const ATTESTATIONS: DemoAttestation[] = [
  {
    id: 1, batchNumber: 18402, instanceId: "INST-1042", instanceName: "Logistics Router α",
    status: "anchored", arweaveTx: "ar_8Qd2vKpf1Lx9mNc0Ze7Rb3Yh6Tg2Wp",
    sha256: "9f2c4e7a1b3d5f6071829a0b1c2d3e4f5061728394a5b6c7d8e9f0a1b2c3d4e5",
    actions: 412, windowStart: ago(6 * MIN + 42 * MIN), windowEnd: ago(6 * MIN),
    payload: { instance: "INST-1042", actions: 412, window: "00:00–00:42", merkleRoot: "0x4f…a1", reverted: 3 },
    at: ago(6 * MIN),
  },
  {
    id: 2, batchNumber: 18401, instanceId: "INST-1039", instanceName: "Warehouse Rover R4",
    status: "pending", arweaveTx: null,
    sha256: "3a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
    actions: 1, windowStart: ago(12 * MIN + 4 * MIN), windowEnd: ago(12 * MIN),
    payload: { instance: "INST-1039", tasks: 1, task: "TSK-7710", frames: 0, merkleRoot: "0x1c…9b" },
    at: ago(12 * MIN),
  },
  {
    id: 3, batchNumber: 18400, instanceId: "INST-1028", instanceName: "Survey Drone D2",
    status: "anchored", arweaveTx: "ar_2Lm9Xq4Rt7Pn1Bv6Cd0Hs8Yk3Wf5Gj",
    sha256: "7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071829ab3c1d2",
    actions: 98, windowStart: ago(28 * MIN + 30 * MIN), windowEnd: ago(28 * MIN),
    payload: { instance: "INST-1028", frames: 98, grid: 14, merkleRoot: "0x9a…3f", verified: true },
    at: ago(28 * MIN),
  },
  {
    id: 4, batchNumber: 18399, instanceId: "INST-1033", instanceName: "Market Maker β",
    status: "anchored", arweaveTx: "ar_5Tg1Wp3Yh8Rb6Ze0Nc9Lx2Kf4Qd7Mv",
    sha256: "1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901",
    actions: 806, windowStart: ago(46 * MIN + 60 * MIN), windowEnd: ago(46 * MIN),
    payload: { instance: "INST-1033", actions: 806, fills: 214, merkleRoot: "0x7e…22" },
    at: ago(46 * MIN),
  },
  {
    id: 5, batchNumber: 18398, instanceId: "INST-1014", instanceName: "Yield Router (Treasury)",
    status: "anchored", arweaveTx: "ar_3Nc0Ze7Rb8Qd2vKpf1Lx9mYh6Tg2Wp",
    sha256: "5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a1b2c3d4",
    actions: 142, windowStart: ago(2 * HOUR + 40 * MIN), windowEnd: ago(2 * HOUR),
    payload: { instance: "INST-1014", rotations: 2, compounds: 1, merkleRoot: "0x3b…d8" },
    at: ago(2 * HOUR),
  },
  {
    id: 6, batchNumber: 18397, instanceId: "INST-1042", instanceName: "Logistics Router α",
    status: "anchored", arweaveTx: "ar_6Cd0Hs8Yk3Wf5Gj2Lm9Xq4Rt7Pn1Bv",
    sha256: "0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
    actions: 388, windowStart: ago(3 * HOUR + 42 * MIN), windowEnd: ago(3 * HOUR),
    payload: { instance: "INST-1042", actions: 388, fills: 121, merkleRoot: "0x5c…7a" },
    at: ago(3 * HOUR),
  },
  {
    id: 7, batchNumber: 18396, instanceId: "INST-1028", instanceName: "Survey Drone D2",
    status: "anchored", arweaveTx: "ar_9Xq4Rt7Pn1Bv6Cd0Hs8Yk3Wf5Gj2Lm",
    sha256: "8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
    actions: 76, windowStart: ago(5 * HOUR + 30 * MIN), windowEnd: ago(5 * HOUR),
    payload: { instance: "INST-1028", frames: 76, grid: 13, merkleRoot: "0x2d…4e", verified: true },
    at: ago(5 * HOUR),
  },
  {
    id: 8, batchNumber: 18395, instanceId: "INST-1033", instanceName: "Market Maker β",
    status: "anchored", arweaveTx: "ar_4Rt7Pn1Bv6Cd0Hs8Yk3Wf5Gj2Lm9Xq",
    sha256: "2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f901a1",
    actions: 651, windowStart: ago(7 * HOUR + 60 * MIN), windowEnd: ago(7 * HOUR),
    payload: { instance: "INST-1033", actions: 651, fills: 173, merkleRoot: "0x8f…1c" },
    at: ago(7 * HOUR),
  },
];

/* ------------------------------------------------------------------ */
/* x402 payments ledger                                                */
/* ------------------------------------------------------------------ */

export const PAYMENTS: DemoPayment[] = [
  { id: 1, instanceId: "INST-1042", instanceName: "Logistics Router α", amount: 0.42, currency: "USDC", kind: "settlement", status: "settled", txHash: "0x9f12c4e7a1b3d5f60718ce", counterparty: "0xabc1…22", at: ago(2 * MIN) },
  { id: 2, instanceId: "INST-1039", instanceName: "Warehouse Rover R4", amount: 1.08, currency: "USDC", kind: "settlement", status: "settled", txHash: "0x7711aa3b5c6d7e8f90a1aa", counterparty: "0xdef4…91", at: ago(1 * MIN) },
  { id: 3, instanceId: "INST-1028", instanceName: "Survey Drone D2", amount: 0.74, currency: "USDC", kind: "settlement", status: "settled", txHash: "0x7c14ff90a1b2c3d4e5f614", counterparty: "0x55ab…12", at: ago(28 * MIN) },
  { id: 4, instanceId: "INST-1014", instanceName: "Yield Router (Treasury)", amount: 0.52, currency: "USDC", kind: "settlement", status: "settled", txHash: "0x3b1d2c3d4e5f6071829ad8", counterparty: "0x6f0a…aa", at: ago(2 * HOUR) },
  { id: 5, instanceId: "INST-1042", instanceName: "Logistics Router α", amount: 0.5, currency: "USDC", kind: "fork_fee", status: "settled", txHash: "0x55aa01b2c3d4e5f607182a", counterparty: "Forge Labs", at: ago(9 * DAY) },
  { id: 6, instanceId: "INST-1033", instanceName: "Market Maker β", amount: 0.31, currency: "USDC", kind: "settlement", status: "settled", txHash: "0x2a77c4e7a1b3d5f6071877", counterparty: "0x91c2…0e", at: ago(46 * MIN) },
  { id: 7, instanceId: null, instanceName: null, amount: 1200, currency: "USDC", kind: "withdrawal", status: "settled", txHash: "0xff09a1b2c3d4e5f60718ff", counterparty: "operator.clad.eth", at: ago(2 * DAY) },
  { id: 8, instanceId: "INST-1042", instanceName: "Logistics Router α", amount: 0.18, currency: "USDC", kind: "royalty", status: "settled", txHash: "0x12c4e7a1b3d5f607182a90", counterparty: "Forge Labs", at: ago(4 * HOUR) },
  { id: 9, instanceId: "INST-1039", instanceName: "Warehouse Rover R4", amount: 0.9, currency: "USDC", kind: "settlement", status: "pending", txHash: "0x88aa3b5c6d7e8f90a1b2aa", counterparty: "0xdef4…91", at: ago(40_000) },
];

/* ------------------------------------------------------------------ */
/* Overview analytics (derived + chart series)                         */
/* ------------------------------------------------------------------ */

export const REVENUE_SERIES = [
  { label: "Mon", value: 1840 },
  { label: "Tue", value: 2210 },
  { label: "Wed", value: 1990 },
  { label: "Thu", value: 2640 },
  { label: "Fri", value: 3120 },
  { label: "Sat", value: 2880 },
  { label: "Sun", value: 3460 },
];

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function getAgent(id: string): DemoAgent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getInstance(id: string): DemoInstance | undefined {
  return INSTANCES.find((i) => i.id === id);
}

export function getAttestation(batchNumber: number): DemoAttestation | undefined {
  return ATTESTATIONS.find((a) => a.batchNumber === batchNumber);
}

/** Instances running a given marketplace agent (for the agent detail page). */
export function instancesForAgent(agentId: string): DemoInstance[] {
  return INSTANCES.filter((i) => i.agentId === agentId);
}

/* ------------------------------------------------------------------ */
/* Derived dashboard stats                                             */
/* ------------------------------------------------------------------ */

export function dashboardStats() {
  const totalRevenue = INSTANCES.reduce((s, i) => s + i.earnings, 0);
  const activeAgents = INSTANCES.filter((i) => i.kind === "digital" && i.status === "active").length;
  const activeRobots = INSTANCES.filter((i) => i.kind === "physical" && i.status === "active").length;
  const paymentsCount = PAYMENTS.length;
  return { totalRevenue, activeAgents, activeRobots, paymentsCount };
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

export function usd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function usdExact(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  settlement: "Settlement",
  fork_fee: "Fork fee",
  royalty: "Royalty",
  withdrawal: "Withdrawal",
};
