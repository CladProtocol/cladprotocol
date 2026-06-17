/**
 * §3.1 — Off-chain task agent (x402). The lowest-risk bot: it performs verifiable
 * off-chain work (data / signal / compute) and earns a small fee per call. Acts as
 * the catch-all for any digital template not claimed by a more specific runtime
 * (e.g. AGT-0473 Mempool Sentinel).
 *
 * This is the runtime closest to going *live* safely: earnings come from a consumer
 * paying an x402 invoice (no capital at risk). In live mode `tick` would quote
 * (HTTP 402) → verify the consumer's USDC payment to the treasury (src/api/x402.ts)
 * → return the real `settlement` hash. Paper mode books synthetic per-call fees.
 */
import type { AgentAction, AgentRuntime } from "../types";
import { money, pick } from "../util";

const JOBS = [
  "Classified pending-pool batch",
  "Served signal request (x402)",
  "Scored sandwich risk for subscriber",
  "Returned liquidation watchlist",
  "Answered capability query",
] as const;

export const taskAgent: AgentRuntime = {
  id: "task-agent",
  label: "Off-chain task agent (x402)",
  appliesTo: (a) => a.kind === "digital", // catch-all; register AFTER specific digital bots
  async tick(_instance, _agent, ctx) {
    const { rand } = ctx;
    const actions: AgentAction[] = [];
    const calls = 1 + Math.floor(rand() * 2); // 1–2 paid calls per tick

    for (let i = 0; i < calls; i++) {
      // Rare failed job (no fee) to keep the success/revert mix realistic.
      if (rand() < 0.08) {
        actions.push({ label: "Dropped malformed request", result: "reverted", value: 0, tag: "Telemetry" });
      } else {
        actions.push({
          label: pick(rand, JOBS),
          result: "success",
          value: money(rand, 0.01, 0.2),
          tag: "x402",
        });
      }
    }
    return actions;
  },
};
