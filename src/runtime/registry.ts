/**
 * Runtime registry. Bots register here (see src/runtime/index.ts) and the runner
 * resolves one per template. `runtimeFor` returns the FIRST runtime whose
 * `appliesTo` matches — so registration order is significant (specific before
 * catch-all). Adding a new bot = write a runtime module + register it; nothing
 * else changes.
 */
import type { AgentRuntime, RuntimeAgent } from "./types";

const RUNTIMES: AgentRuntime[] = [];

export function register(...runtimes: AgentRuntime[]): void {
  for (const r of runtimes) {
    if (!RUNTIMES.some((x) => x.id === r.id)) RUNTIMES.push(r);
  }
}

export function runtimeFor(agent: RuntimeAgent): AgentRuntime | undefined {
  return RUNTIMES.find((r) => r.appliesTo(agent));
}

export function registeredRuntimes(): readonly AgentRuntime[] {
  return RUNTIMES;
}
