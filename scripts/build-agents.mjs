/**
 * Bundles the agent fleet runner (scripts/agent-runner.ts) into a single,
 * self-contained `dist/agents.mjs` that runs on plain Node (`node dist/agents.mjs`)
 * — no bun, no path-alias resolution, no node_modules needed at runtime. Run as
 * part of `npm run build` (and standalone via `npm run build:agents`). Mirrors
 * scripts/build-cron.mjs.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["scripts/agent-runner.ts"],
  outfile: "dist/agents.mjs",
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

console.info("[build:agents] wrote dist/agents.mjs");
