import { getIronSession } from "iron-session";
import type { IronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { getServerEnv } from "./env";

export type SessionData = { address?: string; nonce?: string; nonceAt?: number };

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
    console.warn("[auth] SESSION_SECRET is unset — using insecure dev fallback.");
    warnedDevSecret = true;
  }
  return DEV_SESSION_PASSWORD;
}

export async function appSession(): Promise<IronSession<SessionData>> {
  const password = await getSessionPassword();
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    password,
    cookieName: "clad_session",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  });
}

export async function getRequestDomain(): Promise<string | undefined> {
  const h = await headers();
  return h.get("host") || undefined;
}

export async function getOptionalOwner(): Promise<string | null> {
  const session = await appSession();
  return session.address ?? null;
}

export async function requireOwner(): Promise<string> {
  const owner = await getOptionalOwner();
  if (!owner) throw new Error("UNAUTHENTICATED");
  return owner;
}
