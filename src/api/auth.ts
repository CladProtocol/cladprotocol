import { eq } from "drizzle-orm";
import { isAddress, recoverMessageAddress } from "viem";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { getDb, schema } from "@/db";
import { appSession, getRequestDomain } from "./session.server";

export type Me = { address: string; ens: string | null; displayName: string | null };

const NONCE_TTL_MS = 10 * 60_000;

export async function getNonce(): Promise<{ nonce: string }> {
  const nonce = generateSiweNonce();
  const session = await appSession();
  session.nonce = nonce;
  session.nonceAt = Date.now();
  await session.save();
  return { nonce };
}

export async function verifySiwe(input: {
  message: string;
  signature: `0x${string}`;
}): Promise<Me> {
  const session = await appSession();
  const { nonce, nonceAt } = session;
  if (!nonce || !nonceAt || Date.now() - nonceAt > NONCE_TTL_MS) {
    throw new Error("Sign-in nonce expired — please try connecting again.");
  }

  const fields = parseSiweMessage(input.message);
  if (!fields.address || !isAddress(fields.address)) {
    throw new Error("Invalid SIWE message: missing address.");
  }
  if (fields.nonce !== nonce) throw new Error("SIWE nonce mismatch.");

  const host = await getRequestDomain();
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
  if (fields.issuedAt) {
    const skewMs = Math.abs(now.getTime() - new Date(fields.issuedAt).getTime());
    if (skewMs > 5 * 60_000) {
      throw new Error("SIWE message issuedAt is too far from now (max 5 minutes).");
    }
  }

  const recovered = await recoverMessageAddress({
    message: input.message,
    signature: input.signature,
  });
  if (recovered.toLowerCase() !== fields.address.toLowerCase()) {
    throw new Error("Signature does not match the claimed address.");
  }

  const address = fields.address.toLowerCase();
  const db = await getDb();
  await db.insert(schema.users).values({ address }).onConflictDoNothing();

  session.address = address;
  session.nonce = undefined;
  session.nonceAt = undefined;
  await session.save();

  const [u] = await db.select().from(schema.users).where(eq(schema.users.address, address)).limit(1);
  return { address, ens: u?.ens ?? null, displayName: u?.displayName ?? null };
}

export async function getMe(): Promise<Me | null> {
  const session = await appSession();
  const address = session.address;
  if (!address) return null;
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.address, address)).limit(1);
  return { address, ens: u?.ens ?? null, displayName: u?.displayName ?? null };
}

export async function logoutUser(): Promise<{ ok: true }> {
  const session = await appSession();
  await session.destroy();
  return { ok: true };
}
