/**
 * §3.2 — Yield router runtime. Drives the yield template (AGT-0449 Yield Router;
 * matched by id/name since its catalog category is "Arbitrage"). Monitors Base
 * lending venues, rotates capital to the best risk-adjusted rate, auto-compounds.
 *
 * Paper-first: real funds are non-adversarial but still real, so live routing is
 * gated. In `live` mode this is where actual USDC transfers between venues would
 * happen (treasury signer in src/api/chain.ts) and `tick` would return real
 * `settlement` hashes; until a funded treasury + venue allow-list exist it runs
 * paper regardless (TECH-UPDATE.md §3.2).
 */
import type { AgentAction, AgentRuntime } from "../types";
import { money, pick } from "../util";

const VENUES = ["Moonwell", "Aave v3", "Morpho", "Aerodrome", "Compound"] as const;

export const yieldRouter: AgentRuntime = {
  id: "yield-router",
  label: "Yield router (paper→live)",
  appliesTo: (a) =>
    a.id === "AGT-0449" || a.category === "Yield" || /yield/i.test(a.name),
  async tick(_instance, _agent, ctx) {
    // NOTE: live on-chain routing not enabled yet — runs paper in both modes.
    const { rand } = ctx;
    const actions: AgentAction[] = [];

    if (rand() < 0.3) {
      actions.push({
        label: `Rotated to ${pick(rand, VENUES)} supply (best risk-adj. rate)`,
        result: "success",
        value: 0,
        tag: "Fleet",
      });
    }
    actions.push({
      label: "Compounded rewards",
      result: "success",
      value: money(rand, 0.1, 0.8),
      tag: "x402",
    });
    return actions;
  },
};
