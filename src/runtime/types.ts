/**
 * Agent Runtime contract (TECH-UPDATE.md §2). A runtime is the *brain* of a bot:
 * given an active instance + its template, it runs ONE step and returns the
 * actions it performed. The runner (src/runtime/run.ts) drives every active
 * instance through its registered runtime and persists the results via
 * record.ts — exactly the rows the rest of the app already reads.
 *
 * IMPORTANT: runtimes are plain async logic, never `createServerFn`. They run from
 * a background Node process (scripts/agent-runner.ts) with direct DB access, like
 * the IRONCLAD cron — so they must not import session/Start-context modules.
 */
import type { DB } from "@/db";
import type { InstanceConfig, InstanceRuntimeMode } from "@/db/schema";
import type { AgentKind, InstanceStatus } from "@/lib/demo-data";

export type { InstanceConfig, InstanceRuntimeMode };
export type RuntimeMode = InstanceRuntimeMode;

export type ActivityTag = "x402" | "IRONCLAD" | "Fleet" | "Manifest" | "Telemetry";

/** One unit of work a bot performed during a tick. */
export interface AgentAction {
  /** Human-readable log line (shown in the fleet task log + activity feed). */
  label: string;
  result: "success" | "reverted";
  /** USDC realized by this action (0 for non-earning steps). */
  value: number;
  /** Activity-feed tag. Defaults to "x402" when value > 0, else "Telemetry". */
  tag?: ActivityTag;
  /** Counterparty for the settlement payment (defaults to "x402 consumer"). */
  counterparty?: string;
  /**
   * Present ONLY for real on-chain earnings (live mode). Carries the verified
   * USDC transfer hash; in paper mode this is omitted and a synthetic hash is used.
   */
  settlement?: { txHash: string; counterparty: string };
}

/** The active instance the runner hands to a runtime. */
export interface RuntimeInstance {
  id: string;
  agentId: string;
  owner: string;
  name: string;
  kind: AgentKind;
  status: InstanceStatus;
  earnings: number;
  actions: number;
  batteryLevel: number | null;
  config: InstanceConfig;
}

/** The marketplace template a runtime matches + reads. */
export interface RuntimeAgent {
  id: string;
  name: string;
  kind: AgentKind;
  category: string;
}

export interface RuntimeContext {
  db: DB;
  mode: RuntimeMode;
  config: InstanceConfig;
  now: Date;
  /** Seeded PRNG (deterministic per instance per minute). */
  rand: () => number;
}

export interface AgentRuntime {
  /** Stable runtime id, e.g. "market-maker". */
  id: string;
  label: string;
  /** Does this runtime drive the given template? First match wins (registry order). */
  appliesTo(agent: RuntimeAgent): boolean;
  /** Run ONE step for one active instance; return what it did. */
  tick(instance: RuntimeInstance, agent: RuntimeAgent, ctx: RuntimeContext): Promise<AgentAction[]>;
}
