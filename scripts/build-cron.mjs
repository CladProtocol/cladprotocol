/**
 * Bundles the IRONCLAD cron worker (scripts/cron-runner.ts) into a single,
 * self-contained `dist/cron.mjs` that runs on plain Node (`node dist/cron.mjs`) —
 * no bun, no path-alias resolution, no node_modules needed at runtime. Run as
 * part of `npm run build` (and standalone via `npm run build:cron`).
 */
import { build } from "esbuild";

await build({
  entryPoints: ["scripts/cron-runner.ts"],
  outfile: "dist/cron.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  tsconfig: "tsconfig.json", // resolves the @/* path alias
  // ESM-compat shims for any bundled dep that references CJS globals.
  banner: {
    js: [
      "import{createRequire as __cr}from'module';",
      "import{fileURLToPath as __ftu}from'url';",
      "import{dirname as __dn}from'path';",
      "const require=__cr(import.meta.url);",
      "const __filename=__ftu(import.meta.url);",
      "const __dirname=__dn(__filename);",
    ].join(""),
  },
  logLevel: "info",
});

console.info("[build:cron] wrote dist/cron.mjs");
