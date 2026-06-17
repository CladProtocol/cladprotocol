/**
 * Wallet auth (Sign-In With Ethereum, EIP-4361) — the client-facing RPC surface.
 *
 * Only `createServerFn` server fns live here so the whole module strips cleanly
 * from the client bundle (their handler bodies — and the server-only session/db
 * imports they use — are split out). The session + request helpers and
 * `requireOwner()`/`getOptionalOwner()` live in `./session.server` (server-only).
 *
 * Flow: client connects a wallet → `getNonce()` → builds + signs the SIWE
 * message → `verifySiwe({ message, signature })` issues the session →
 * `requireOwner()` reads it on every subsequent owner-scoped call.
 */
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { isAddress, recoverMessageAddress } from "viem";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { getDb, schema } from "@/db";
import { appSession, getRequestDomain } from "./session.server";

export type Me = { address: string; ens: string | null; displayName: string | null };

const NONCE_TTL_MS = 10 * 60_000; // a minted nonce is valid for 10 minutes.

/** Mint a one-time nonce bound to the session for the next SIWE signature. */
export const getNonce = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ nonce: string }> => {
    const nonce = generateSiweNonce();
    const session = await appSession();
    await session.update({ nonce, nonceAt: Date.now() });
    return { nonce };
  },
);

/** Verify a signed SIWE message and issue the operator session. */
export const verifySiwe = createServerFn({ method: "POST" })
  .inputValidator((input: { message: string; signature: `0x${string}` }) => input)
  .handler(async ({ data }): Promise<Me> => {
    const session = await appSession();
    const { nonce, nonceAt } = session.data;
    if (!nonce || !nonceAt || Date.now() - nonceAt > NONCE_TTL_MS) {
      throw new Error("Sign-in nonce expired — please try connecting again.");
    }

    const fields = parseSiweMessage(data.message);
    if (!fields.address || !isAddress(fields.address)) {
      throw new Error("Invalid SIWE message: missing address.");
    }
    if (fields.nonce !== nonce) throw new Error("SIWE nonce mismatch.");

    // Bind the signature to this origin (EIP-4361 domain).
    const host = getRequestDomain();
    if (fields.domain && host && fields.domain !== host) {
      throw new Error(`SIWE domain mismatch (${fields.domain} ≠ ${host}).`);
    }
    const now = new Date();
    if (fields.expirationTime && now > new Date(fields.expirationTime)) {
      throw new Error("SIWE message has expired.");
    }
    if (fields.notBefore && now < new Date(fields.notBefore)) {
      throw new Error("SIWE message is not yet valid.");
    }
    // Reject messages issued too far in the past or future (replay protection).
    if (fields.issuedAt) {
      const skewMs = Math.abs(now.getTime() - new Date(fields.issuedAt).getTime());
      if (skewMs > 5 * 60_000) {
        throw new Error("SIWE message issuedAt is too far from now (max 5 minutes).");
      }
    }

    // EOA recovery (no RPC). Smart-contract (EIP-1271) wallets are out of scope.
    const recovered = await recoverMessageAddress({
      message: data.message,
      signature: data.signature,
    });
    if (recovered.toLowerCase() !== fields.address.toLowerCase()) {
      throw new Error("Signature does not match the claimed address.");
    }

    const address = fields.address.toLowerCase();
    const db = await getDb();
    await db.insert(schema.users).values({ address }).onConflictDoNothing();

    // Promote the session: drop the nonce, record the authenticated address.
    await session.update({ address, nonce: undefined, nonceAt: undefined });

    const [u] = await db.select().from(schema.users).where(eq(schema.users.address, address)).limit(1);
    return { address, ens: u?.ens ?? null, displayName: u?.displayName ?? null };
  });

/** The current operator, or null when not signed in. */
export const me = createServerFn({ method: "GET" }).handler(async (): Promise<Me | null> => {
  const session = await appSession();
  const address = session.data.address;
  if (!address) return null;
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.address, address)).limit(1);
  return { address, ens: u?.ens ?? null, displayName: u?.displayName ?? null };
});

/** Clear the session cookie. */
export const logout = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true }> => {
    const session = await appSession();
    await session.clear();
    return { ok: true };
  },
);
