/**
 * Dev-only runner for the IRONCLAD attestation cron (Stage D/E). Closes new
 * attestation batches from un-attested `instance_actions`, anchors them to
 * Arweave via Turbo, and re-anchors anything still pending (batches + manifests).
 * In production this same logic runs from the Cloudflare Cron Trigger (the
 * `scheduled()` handler in src/server.ts) — this script just lets you exercise it
 * against the local libSQL DB without deploying.
 *
 * Run with:  bun scripts/close-batches.ts   (or `bun run cron:ironclad`)
 *
 * Bun auto-loads `.env`, so TREASURY_PRIVATE_KEY (used to sign the Arweave data
 * items) is picked up if present. Without it, anchoring fails gracefully and
 * batches are recorded as `pending` for a later run to anchor.
 */
import { closeBatches } from "../src/api/attest";
import { retryPendingManifests } from "../src/api/manifests";

async function main() {
  const batches = await closeBatches();
  const manifests = await retryPendingManifests();
  console.info("[ironclad] done:", { ...batches, manifestsAnchored: manifests.anchored });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[ironclad] failed:", err);
    process.exit(1);
  });
