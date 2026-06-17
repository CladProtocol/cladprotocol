// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
// Load local dev secrets from .env into process.env so server functions can read
// them via getServerEnv() during `vite dev` (which runs in Node, not workerd).
// Production reads these from the Worker env/secrets instead — see src/api/env.ts.
import "dotenv/config";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig({
  // Build a plain Node server (Nitro `node-server` preset) instead of a Cloudflare
  // Worker. The lovable config only applies Cloudflare options when the preset is
  // "cloudflare-module"; this opts us out cleanly. Output: `node dist/server/index.mjs`.
  nitro: {
    preset: "node-server",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  // Pin PostCSS to an inline (empty) config so Vite does NOT search the
  // filesystem for a postcss.config.js. Without this, PostCSS walks UP the
  // directory tree and picks up an unrelated config in a parent folder
  // (e.g. C:\Users\USER\postcss.config.js), which breaks the build with
  // "Cannot find module 'tailwindcss'". Tailwind v4 runs via the
  // @tailwindcss/vite plugin and needs no PostCSS plugins here.
  vite: {
    css: { postcss: {} },
  },
});
