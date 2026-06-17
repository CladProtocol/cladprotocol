/**
 * IRONCLAD cron runner (Node). A long-lived process that closes + anchors
 * attestation batches and re-anchors pending manifests on a fixed schedule. This
 * replaces the Cloudflare Cron Trigger (Node has no built-in scheduler).
 *
 * Production: bundled to `dist/cron.mjs` (`npm run build:cron`) and run with plain
 * `node dist/cron.mjs` as a separate worker process (see Dockerfile / DEPLOY.md).
 * Dev: `bun scripts/cron-runner.ts` (`npm run cron:watch`).
 *
 * Uses croner (in-process, zero-dep, bundles cleanly). `protect: true` skips a
 * tick if the previous run is still going; the work is idempotent regardless
 * (actions are stamped with their batch_number once attested).
 */
import { Cron } from "croner";
import { validateEnv } from "../src/api/env";
import { closeBatches } from "../src/api/attest";
import { retryPendingManifests } from "../src/api/manifests";

// Crash fast on missing config before starting the scheduler.
validateEnv(["DATABASE_URL", "TREASURY_PRIVATE_KEY"]).catch((err: Error) => {
  console.error("[ironclad] env validation failed:", err.message);
  process.exit(1);
});

const SCHEDULE = process.env.IRONCLAD_CRON_SCHEDULE ?? "*/10 * * * *";

let isShuttingDown = false;

process.on("SIGTERM", () => {
  console.info("[ironclad] SIGTERM received — waiting for current tick to finish...");
  isShuttingDown = true;
});
process.on("SIGINT", () => {
  console.info("[ironclad] SIGINT received — shutting down.");
  isShuttingDown = true;
  process.exit(0);
});

async function tick() {
  if (isShuttingDown) return;
  try {
    const batches = await closeBatches();
    const manifests = await retryPendingManifests();
    console.info("[ironclad]", new Date().toISOString(), {
      ...batches,
      manifestsAnchored: manifests.anchored,
    });
  } catch (err) {
    console.error("[ironclad] run failed:", err);
  }
}

let job: Cron;
try {
  // Constructing validates the pattern (throws on invalid). `protect` prevents
  // overlapping runs if a tick outlasts the interval.
  job = new Cron(SCHEDULE, { protect: true }, tick);
} catch (err) {
  console.error(`[ironclad] invalid IRONCLAD_CRON_SCHEDULE "${SCHEDULE}":`, err);
  process.exit(1);
}

console.info(
  `[ironclad] cron runner started (schedule: ${SCHEDULE}; next: ${job.nextRun()?.toISOString()})`,
);
// Kick once on boot so a fresh deploy doesn't wait a full interval.
void tick();
