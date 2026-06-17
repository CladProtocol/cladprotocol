import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Single Drizzle client over Supabase Postgres (postgres.js), for both local dev
// and production. Connection string comes from DATABASE_URL — a hosted Supabase
// project (supabase.com) in prod, and either the same cloud project or a local
// `supabase start` Postgres in dev.

export type DB = PostgresJsDatabase<typeof schema>;

// Local Postgres (supabase CLI / Docker) is plaintext; hosted Supabase requires
// TLS. Auto-enable SSL for any non-local host so a pasted cloud connection string
// works without fiddling with sslmode. `prepare: false` keeps us compatible with
// Supabase's transaction pooler.
function isLocalHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Build a configured postgres.js client (SSL + pooler-safe). Shared with the seed.
 *
 * Connection budget: Supabase's Session pooler caps TOTAL client connections (e.g.
 * pool_size 15). We run several processes against it (web + IRONCLAD cron + agent
 * runner + one-shot scripts), and postgres.js defaults to `max: 10` PER process —
 * which exhausts the pool fast ("FATAL: max clients reached in session mode"). So
 * we cap `max` low for remote/pooled hosts (override via PG_POOL_MAX) and let idle
 * connections release quickly. A direct local Postgres has no such cap, so allow more.
 * For real headroom, point DATABASE_URL at the Transaction pooler (port 6543) instead.
 */
export function pgClient(url: string) {
  const local = isLocalHost(url);
  const isTransactionPooler = url.includes(":6543");
  const max = Number(process.env.PG_POOL_MAX) || (local ? 10 : isTransactionPooler ? 10 : 3);
  return postgres(url, {
    prepare: false,
    ssl: local ? false : "require",
    max,
    idle_timeout: 20, // seconds — return idle connections to the pool/pooler
  });
}

let dbPromise: Promise<DB> | undefined;

export async function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error(
          "DATABASE_URL is not set. Point it at your Supabase Postgres connection string " +
            "(Supabase dashboard → Project Settings → Database → Session pooler).",
        );
      }
      return drizzle(pgClient(url), { schema });
    })();
  }
  return dbPromise;
}

export { schema };
