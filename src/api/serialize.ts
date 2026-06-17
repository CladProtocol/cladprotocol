/**
 * Pure row -> demo-shape mappers shared by the read server functions. These do
 * NOT touch the DB; callers pass in the rows they fetched. The output shapes are
 * the `demo-data.ts` types verbatim, so pages can consume server data unchanged.
 */
import { agentInstances, agents } from "@/db/schema";
import type { Agent } from "@/db/schema";
import type {
  AgentKind,
  DemoAgent,
  DemoInstance,
  FleetAction,
  InstanceStatus,
} from "@/lib/demo-data";

/** Serialize a Date/epoch column to an ISO string at the server boundary. */
export const iso = (d: Date | number | null | undefined): string =>
  d == null ? "" : (d instanceof Date ? d : new Date(d)).toISOString();

/**
 * A plausible-looking 20-byte tx hash for DB-only payment/manifest records.
 * Uses Web Crypto (edge-safe on workerd; also global in Node). Phase 4 replaces
 * these with real on-chain hashes behind the same mutation signatures.
 */
export const randomTxHash = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
};

/** Selected columns for an instance + its agent's kind (one source of truth). */
export const instanceSelection = {
  id: agentInstances.id,
  agentId: agentInstances.agentId,
  name: agentInstances.name,
  status: agentInstances.status,
  actions: agentInstances.actionsCount,
  earnings: agentInstances.earnings,
  manifestVersion: agentInstances.manifestVersion,
  batteryLevel: agentInstances.batteryLevel,
  rosConnected: agentInstances.rosConnected,
  region: agentInstances.region,
  deployedAt: agentInstances.createdAt,
  lastActivityAt: agentInstances.lastActivityAt,
  kind: agents.kind,
};

export type InstanceRow = {
  id: string;
  agentId: string;
  name: string;
  status: InstanceStatus;
  actions: number;
  earnings: number;
  manifestVersion: string;
  batteryLevel: number | null;
  rosConnected: boolean | null;
  region: string;
  deployedAt: Date | number | null;
  lastActivityAt: Date | number | null;
  kind: AgentKind;
};

/** Light instance shape for list/aggregation contexts (no series/task log). */
export function toInstanceSummary(r: InstanceRow): DemoInstance {
  return {
    id: r.id,
    agentId: r.agentId,
    name: r.name,
    kind: r.kind,
    status: r.status,
    actions: r.actions,
    earnings: r.earnings,
    manifestVersion: r.manifestVersion,
    batteryLevel: r.batteryLevel,
    rosConnected: r.rosConnected,
    region: r.region,
    deployedAt: iso(r.deployedAt),
    lastActivityAt: iso(r.lastActivityAt ?? r.deployedAt),
    earningsSeries: [],
    recentActions: [],
  };
}

const SERIES_LABELS = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

/** Full instance shape for the fleet-detail page (chart + recent actions). */
export function toFullInstance(
  r: InstanceRow,
  earnings: { idx: number; value: number }[],
  actions: {
    id: string;
    label: string;
    result: "success" | "reverted";
    value: number;
    createdAt: Date | number | null;
  }[],
): DemoInstance {
  const earningsSeries = [...earnings]
    .sort((a, b) => a.idx - b.idx)
    .map((e) => ({ label: SERIES_LABELS[e.idx] ?? `${e.idx}`, value: e.value }));
  const recentActions: FleetAction[] = actions.map((a) => ({
    id: a.id,
    label: a.label,
    result: a.result,
    value: a.value,
    at: iso(a.createdAt),
  }));
  return { ...toInstanceSummary(r), earningsSeries, recentActions };
}

/** Marketplace agent shape, joining creator display name + version/review rows. */
export function toAgent(
  a: Agent,
  creatorName: string | null,
  versions: { version: string; releasedAt: Date | number | null; notes: string }[],
  reviews: {
    author: string;
    address: string;
    rating: number;
    body: string;
    createdAt: Date | number | null;
  }[],
): DemoAgent {
  return {
    id: a.id,
    name: a.name,
    version: a.version,
    kind: a.kind,
    category: a.category,
    creator: creatorName ?? a.creator,
    creatorAddress: a.creator,
    description: a.description,
    longDescription: a.longDescription,
    price: a.price,
    currency: a.currency,
    royaltyPct: a.royaltyPct,
    rating: a.rating,
    forkCount: a.forkCount,
    winRate: a.winRate,
    uptime: a.uptime,
    distanceNavigatedKm: a.distanceNavigatedKm,
    verified: a.verified,
    tags: a.tags ?? [],
    capabilities: a.capabilities ?? [],
    versions: versions.map((v) => ({
      version: v.version,
      releasedAt: iso(v.releasedAt),
      notes: v.notes,
    })),
    reviews: reviews.map((r) => ({
      author: r.author,
      address: r.address,
      rating: r.rating,
      body: r.body,
      at: iso(r.createdAt),
    })),
  };
}
