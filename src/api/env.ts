/**
 * Server-only environment access. The app runs on Node (Nitro `node-server`), so
 * config + secrets come from `process.env` — populated from `.env` in dev (loaded
 * via dotenv in vite.config.ts) and from the host's env vars in production.
 *
 * Never import this from client code — it resolves secrets. Kept async so call
 * sites (which `await` these) stay unchanged.
 */

/** Read a string env var, or undefined when unset/empty. */
export async function getServerEnv(key: string): Promise<string | undefined> {
  const value = typeof process !== "undefined" ? process.env?.[key] : undefined;
  return value && value.length > 0 ? value : undefined;
}

/** Read a required env var, throwing a clear error when missing. */
export async function requireServerEnv(key: string): Promise<string> {
  const value = await getServerEnv(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

/**
 * Validate that required env vars are present at startup. Pass the list of keys
 * your process needs — web server, cron runner, and agent runner each have different
 * requirements. Throws on the first problem so the process crashes fast with a clear
 * message rather than failing on the first request.
 */
export async function validateEnv(required: string[]): Promise<void> {
  const missing: string[] = [];
  for (const key of required) {
    const val = await getServerEnv(key);
    if (!val) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
  const secret = await getServerEnv("SESSION_SECRET");
  if (secret !== undefined && secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters (generate with: openssl rand -hex 32).");
  }
}
