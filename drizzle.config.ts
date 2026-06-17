import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit generates + applies Postgres (Supabase) migrations.
//   - generate: `npm run db:generate`  (SQL from src/db/schema.ts → drizzle/migrations)
//   - apply:    `npm run db:migrate`   (drizzle-kit migrate against DATABASE_URL)
// DATABASE_URL points at Supabase Postgres (local: the `supabase start` default).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
