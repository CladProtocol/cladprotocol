/**
 * §3.3 — Market maker / arb runtime. Drives MEV + Arbitrage templates
 * (AGT-0481 Market Maker β, AGT-0467 Arb Hunter).
 *
 * PAPER ONLY at launch. A real, profitable MEV market maker is serious,
 * adversarial quant work and a naive live version loses real USDC fast — so this
 * simulates the quote → fill → rebalance loop and books synthetic fills to keep
 * the fleet, IRONCLAD ledger, and payments pages alive. Flip to live only behind a
 * risk sign-off + capped capital (TECH-UPDATE.md §3.3) — at which point `tick`
 * would place real orders and return real `settlement` hashes.
 */
import type { AgentAction, AgentRuntime } from "../types";
import { money, stubHash } from "../util";

export const marketMaker: AgentRuntime = {
  id: "market-maker",
  label: "Market maker / arb (paper)",
  appliesTo: (a) => a.kind === "digital" && (a.category === "MEV" || a.category === "Arbitrage"),
  async tick(_instance, _agent, ctx) {
    const { rand } = ctx; // mode is ignored: this runtime never moves real funds yet
    const actions: AgentAction[] = [];
    const steps = 1 + Math.floor(rand() * 3); // 1–3 actions per tick

    for (let i = 0; i < steps; i++) {
      const roll = rand();
      if (roll < 0.45) {
        actions.push({
          label: `Settled fill ${stubHash(rand)} (ETH/USDC)`,
          result: "success",
          value: money(rand, 0.03, 0.6),
          tag: "x402",
        });
      } else if (roll < 0.7) {
        actions.push({
          label: "Rebalanced inventory band",
          result: "success",
          value: money(rand, 0.01, 0.12),
          tag: "Fleet",
        });
      } else if (roll < 0.9) {
        actions.push({
          label: "Quote refresh (ETH/USDC)",
          result: "success",
          value: 0,
          tag: "Telemetry",
        });
      } else {
        actions.push({
          label: "Cancelled stale order (revert-guarded)",
          result: "reverted",
          value: 0,
          tag: "Fleet",
        });
      }
    }
    return actions;
  },
};
