/**
 * One-shot fleet sweep — runs every ACTIVE instance through its runtime once and
 * exits. Lets you exercise the bots against your local DB without a long-lived
 * process. Run with:  bun scripts/run-fleet.ts   (or `bun run agents:tick`)
 *
 * Bun auto-loads `.env`, so DATABASE_URL (and RUNTIME_MODE) are picked up.
 */
import { runActiveFleet } from "../src/runtime";

async function main() {
  const result = await runActiveFleet();
  console.info("[agents] done:", result);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[agents] failed:", err);
    process.exit(1);
  });
