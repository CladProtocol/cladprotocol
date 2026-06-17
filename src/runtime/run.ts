/**
 * Fleet runner orchestrator (TECH-UPDATE.md §3.0). One sweep drives every ACTIVE
 * instance through its registered runtime and persists the results. Plain async +
 * direct `getDb()` (no server-fn / Start context) so it runs from the background
 * worker (scripts/agent-runner.ts) and the one-shot script (scripts/run-fleet.ts).
 *
 * Per-instance failures are caught and logged so one bad tick never stops the
 * sweep — mirroring the IRONCLAD cron's per-item resilience.
 */
import { eq } from "drizzle-orm";
import type { DB } from "@/db";
import { getDb, schema } from "@/db";
import { getServerEnv } from "@/api/env";
import { recordActions } from "./record";
import { runtimeFor } from "./registry";
import { hashStr, mulberry32 } from "./util";
import type { RuntimeAgent, RuntimeInstance, RuntimeMode } from "./types";

export type FleetTickResult = {
  instances: number; // active instances seen
  ticked: number; // instances a runtime ran for
  skipped: number; // active instances with no matching runtime
  actions: number; // total actions recorded
  earned: number; // total USDC realized this sweep
};

async function defaultMode(): Promise<RuntimeMode> {
  return (await getServerEnv("RUNTIME_MODE")) === "live" ? "live" : "paper";
}

export async function runActiveFleet(dbArg?: DB): Promise<FleetTickResult> {
  const db = dbArg ?? (await getDb());
  const mode0 = await defaultMode();
  const now = new Date();
  const minute = Math.floor(now.getTime() / 60000);

  const rows = await db
    .select({
      id: schema.agentInstances.id,
      agentId: schema.agentInstances.agentId,
      owner: schema.agentInstances.owner,
      name: schema.agentInstances.name,
      status: schema.agentInstances.status,
      earnings: schema.agentInstances.earnings,
      actions: schema.agentInstances.actionsCount,
      batteryLevel: schema.agentInstances.batteryLevel,
      config: schema.agentInstances.config,
      category: schema.agents.category,
      kind: schema.agents.kind,
      agentName: schema.agents.name,
    })
    .from(schema.agentInstances)
    .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
    .where(eq(schema.agentInstances.status, "active"));

  let ticked = 0;
  let skipped = 0;
  let totalActions = 0;
  let totalEarned = 0;

  for (const r of rows) {
    const agent: RuntimeAgent = { id: r.agentId, name: r.agentName, kind: r.kind, category: r.category };
    const runtime = runtimeFor(agent);
    if (!runtime) {
      skipped++;
      continue;
    }

    const config = r.config ?? { mode: mode0 };
    const mode = config.mode ?? mode0;
    const rand = mulberry32(hashStr(r.id) ^ minute);

    const instance: RuntimeInstance = {
      id: r.id,
      agentId: r.agentId,
      owner: r.owner,
      name: r.name,
      kind: r.kind,
      status: r.status,
      earnings: r.earnings,
      actions: r.actions,
      batteryLevel: r.batteryLevel,
      config,
    };

    try {
      const acts = await runtime.tick(instance, agent, { db, mode, config, now, rand });
      const { recorded, earned } = await recordActions(db, instance, acts);
      ticked++;
      totalActions += recorded;
      totalEarned += earned;
    } catch (err) {
      console.error(`[agents] tick failed for ${r.id} (${runtime.id}):`, err);
    }
  }

  return {
    instances: rows.length,
    ticked,
    skipped,
    actions: totalActions,
    earned: Math.round(totalEarned * 1e6) / 1e6,
  };
}
