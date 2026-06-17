/**
 * Physical-fleet runtime — the robotics analogue of the task agent. Drives every
 * physical template (Ground / Aerial / Manipulation: rovers, drones, arms,
 * quadrupeds). Publishes signed telemetry + completes paid tasks so the physical
 * side of the fleet is alive alongside the digital bots.
 *
 * Paper telemetry for now. Live = the ROS 2 bridge feeding real waypoints/picks +
 * signed sensor frames into instance_actions (TECH-UPDATE.md §5 / docs ROS 2).
 */
import type { AgentAction, AgentRuntime } from "../types";
import { money, pick } from "../util";

const ZONES = ["Bay 3", "Bay 7", "Dock A", "North grid", "Sector 9", "Aisle 12"] as const;

export const robotAgent: AgentRuntime = {
  id: "robot",
  label: "Physical fleet (paper telemetry)",
  appliesTo: (a) => a.kind === "physical",
  async tick(_instance, _agent, ctx) {
    const { rand } = ctx;
    const actions: AgentAction[] = [];
    const roll = rand();

    if (roll < 0.4) {
      actions.push({
        label: "Completed pick task",
        result: "success",
        value: money(rand, 0.6, 1.4),
        tag: "Fleet",
      });
    } else if (roll < 0.7) {
      actions.push({
        label: `Navigated to ${pick(rand, ZONES)}`,
        result: "success",
        value: 0,
        tag: "Telemetry",
      });
    } else {
      const frames = 24 + Math.floor(rand() * 120);
      actions.push({
        label: `Telemetry frame batch signed (${frames} frames)`,
        result: "success",
        value: 0,
        tag: "Telemetry",
      });
    }
    return actions;
  },
};
