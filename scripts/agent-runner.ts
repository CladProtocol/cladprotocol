/**
 * Agent fleet runner (Node). A long-lived process that drives every ACTIVE
 * instance through its registered runtime on a fixed schedule, so deployed bots
 * actually do work — appending actions, settling x402 fees, and feeding the
 * IRONCLAD cron. The sibling of scripts/cron-runner.ts.
 *
 * Production: bundled to `dist/agents.mjs` (`npm run build:agents`) and run with
 * plain `node dist/agents.mjs` as its own worker process (see docker-compose.yml).
 * Dev: `bun scripts/agent-runner.ts` (`npm run agents:watch`).
 *
 * Uses croner (in-process). `protect: true` skips a tick if the previous run is
 * still going; persistence is idempotent-friendly (each action is a new TSK row).
 */
import { Cron } from "croner";
import { validateEnv } from "../src/api/env";
import { runActiveFleet } from "../src/runtime";

// Crash fast on missing config before starting the scheduler.
validateEnv(["DATABASE_URL"]).catch((err: Error) => {
  console.error("[agents] env validation failed:", err.message);
  process.exit(1);
});

const SCHEDULE = process.env.AGENT_CRON_SCHEDULE ?? "*/2 * * * *";

let isShuttingDown = false;

process.on("SIGTERM", () => {
  console.info("[agents] SIGTERM received — waiting for current tick to finish...");
  isShuttingDown = true;
});
process.on("SIGINT", () => {
  console.info("[agents] SIGINT received — shutting down.");
  isShuttingDown = true;
  process.exit(0);
});

async function tick() {
  if (isShuttingDown) return;
  try {
    const result = await runActiveFleet();
    console.info("[agents]", new Date().toISOString(), result);
  } catch (err) {
    console.error("[agents] run failed:", err);
  }
}

let job: Cron;
try {
  job = new Cron(SCHEDULE, { protect: true }, tick);
} catch (err) {
  console.error(`[agents] invalid AGENT_CRON_SCHEDULE "${SCHEDULE}":`, err);
  process.exit(1);
}

console.info(
  `[agents] runner started (schedule: ${SCHEDULE}; next: ${job.nextRun()?.toISOString()})`,
);
// Kick once on boot so a fresh deploy doesn't wait a full interval.
void tick();
