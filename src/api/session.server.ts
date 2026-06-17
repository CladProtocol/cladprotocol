/**
 * Server-only session + request helpers.
 *
 * This module imports `@tanstack/react-start/server`, which the client import-
 * protection plugin denies in the browser bundle. It is therefore kept in its
 * own `.server.ts` file and only ever referenced *inside* `createServerFn`
 * handlers (or other server fns) — never at the module top level of a client-
 * reachable file — so the server-fn split transform strips it from client builds.
 *
 * The session is an encrypted, signed, httpOnly cookie (h3 `useSession`, sealed
 * with `SESSION_SECRET`), which is edge-safe on workerd.
 */
import { getRequestHost, getRequestProtocol, useSession } from "@tanstack/react-start/server";
import { getServerEnv } from "./env";

export type SessionData = { address?: string; nonce?: string; nonceAt?: number };

// ≥32 chars (h3 requires it). Dev-only fallback; prod uses the SESSION_SECRET
// worker secret. Never relied on once SESSION_SECRET is set.
const DEV_SESSION_PASSWORD = "clad-protocol-insecure-dev-session-password-change-me";

let warnedDevSecret = false;

async function getSessionPassword(): Promise<string> {
  const secret = await getServerEnv("SESSION_SECRET");
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a string of ≥32 chars in production. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  if (!warnedDevSecret) {
    console.warn(
      "[auth] SESSION_SECRET is unset or shorter than 32 chars — using an insecure dev fallback. " +
        "Set it (a host env var, e.g. openssl rand -hex 32) before deploying.",
    );
    warnedDevSecret = true;
  }
  return DEV_SESSION_PASSWORD;
}

/** The current request's sealed session manager (read/update/clear). */
export async function appSession() {
  const password = await getSessionPassword();
  return useSession<SessionData>({
    password,
    name: "clad_session",
    // Keep the sealed token in the httpOnly cookie only (no echo header).
    sessionHeader: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // Browsers drop Secure cookies over http://localhost during dev.
      secure: getRequestProtocol() === "https",
    },
  });
}

/** The request host, for binding a SIWE signature to this origin (EIP-4361). */
export function getRequestDomain(): string | undefined {
  return getRequestHost() || undefined;
}

/** The authenticated address, or null. Use in public fns that personalize. */
export async function getOptionalOwner(): Promise<string | null> {
  const session = await appSession();
  return session.data.address ?? null;
}

/** The authenticated address; throws when unauthenticated. Use in gated fns. */
export async function requireOwner(): Promise<string> {
  const owner = await getOptionalOwner();
  if (!owner) throw new Error("UNAUTHENTICATED");
  return owner;
}
