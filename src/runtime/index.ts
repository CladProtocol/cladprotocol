/**
 * Agent runtime entry. Importing this module registers the built-in bots and
 * exposes the fleet runner. The background worker + one-shot script both import
 * from here so registration always happens before a sweep.
 *
 * Registration order matters: `runtimeFor` returns the first match, so specific
 * runtimes go before the digital catch-all (task-agent).
 */
import { register } from "./registry";
import { yieldRouter } from "./bots/yield-router";
import { marketMaker } from "./bots/market-maker";
import { taskAgent } from "./bots/task-agent";
import { robotAgent } from "./bots/robot";

register(
  yieldRouter, // AGT-0449 (matched by id/name before MEV/Arb)
  marketMaker, // MEV + Arbitrage
  taskAgent, // catch-all for any other digital template
  robotAgent, // every physical template
);

export { runActiveFleet } from "./run";
export type { FleetTickResult } from "./run";
export { registeredRuntimes } from "./registry";
