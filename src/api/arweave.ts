/**
 * Arweave anchoring (IRONCLAD + manifests). Server-only.
 *
 * We anchor permanent records to Arweave through ArDrive **Turbo**, which accepts
 * signed ANS-104 data items and bundles them onto Arweave (uploads < 100 KiB are
 * free with an Ethereum signer). Rather than pull in `@ardrive/turbo-sdk` — whose
 * Node build is not guaranteed workerd-clean — we sign the ANS-104 data item
 * ourselves using only the treasury's EVM key (viem) and Web Crypto. This is
 * edge-safe on Cloudflare workerd and adds zero dependencies.
 *
 * Signing scheme (ANS-104, Ethereum / signatureType 3):
 *   - owner   = the 65-byte uncompressed secp256k1 public key
 *   - sigData = deepHash(["dataitem","1","3", owner, target, anchor, tags, data])
 *               (deepHash uses SHA-384, per the Arweave spec)
 *   - sig     = EIP-191 personal_sign over sigData (what arbundles' EthereumSigner
 *               does — viem's signMessage({ raw }) is byte-for-byte compatible)
 *   - id      = base64url(SHA-256(sig))
 * The binary layout matches arbundles so Turbo verifies it like any SDK upload.
 */
import type { Hex } from "viem";
import { getServerEnv } from "./env";
import { getTreasuryAccount } from "./chain";

const TURBO_DEFAULT_URL = "https://upload.ardrive.io";
const ETHEREUM_SIG_TYPE = 3;

// TS 5.7+ makes `Uint8Array` generic over its backing buffer; Web Crypto / fetch
// want ArrayBuffer-backed views. Pin every byte buffer we build to ArrayBuffer.
type Bytes = Uint8Array<ArrayBuffer>;

/* ---- low-level encoders -------------------------------------------------- */

const enc = new TextEncoder();
const u8 = (s: string): Bytes => enc.encode(s) as Bytes;

function concatU8(...parts: Bytes[]): Bytes {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

async function sha256(data: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}
async function sha384(data: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest("SHA-384", data));
}

export function toHex(bytes: Bytes): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Bytes {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function toBase64Url(bytes: Bytes): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // btoa is available on workerd and Node 18+.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function shortTo2ByteArray(short: number): Bytes {
  return Uint8Array.of(short & 0xff, (short >> 8) & 0xff);
}
function longTo8ByteArray(long: number): Bytes {
  const bytes = new Uint8Array(8);
  let n = long;
  for (let i = 0; i < 8; i++) {
    bytes[i] = n & 0xff;
    n = Math.floor(n / 256);
  }
  return bytes;
}

/* ---- ANS-104 tags (Apache Avro array of {name,value}) -------------------- */

export type Tag = { name: string; value: string };

function varint(value: number): number[] {
  const out: number[] = [];
  let v = value;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return out;
}
// Avro encodes signed longs zig-zag; for the non-negative lengths/counts we emit
// this reduces to value*2.
const avroLong = (n: number): number[] => varint(n * 2);
function avroString(s: string): Bytes {
  const body = u8(s);
  return concatU8(Uint8Array.from(avroLong(body.length)), body);
}

function serializeTags(tags: Tag[]): Bytes {
  if (tags.length === 0) return new Uint8Array(0);
  const records = tags.map((t) => concatU8(avroString(t.name), avroString(t.value)));
  return concatU8(
    Uint8Array.from(avroLong(tags.length)), // single block: item count
    ...records,
    Uint8Array.of(0), // 0-count block terminates the array
  );
}

/* ---- deep hash (Arweave spec, SHA-384) ----------------------------------- */

type DeepHashChunk = Bytes | DeepHashChunk[];

async function deepHash(data: DeepHashChunk): Promise<Bytes> {
  if (Array.isArray(data)) {
    const tag = concatU8(u8("list"), u8(String(data.length)));
    return deepHashChunks(data, await sha384(tag));
  }
  const tag = concatU8(u8("blob"), u8(String(data.length)));
  const tagged = concatU8(await sha384(tag), await sha384(data));
  return sha384(tagged);
}

async function deepHashChunks(chunks: DeepHashChunk[], acc: Bytes): Promise<Bytes> {
  let out = acc;
  for (const chunk of chunks) {
    out = await sha384(concatU8(out, await deepHash(chunk)));
  }
  return out;
}

/* ---- data item construction + upload ------------------------------------- */

async function buildDataItem(data: Bytes, tags: Tag[]): Promise<{ raw: Bytes; id: string }> {
  const account = await getTreasuryAccount();
  const owner = hexToBytes(account.publicKey); // 65-byte uncompressed pubkey
  const anchor = crypto.getRandomValues(new Uint8Array(32)); // uniqueness / retry-safe
  const target: Bytes = new Uint8Array(0);
  const tagsBytes = serializeTags(tags);

  const signatureData = await deepHash([
    u8("dataitem"),
    u8("1"),
    u8(String(ETHEREUM_SIG_TYPE)),
    owner,
    target,
    anchor,
    tagsBytes,
    data,
  ]);

  // EIP-191 personal_sign over the deep hash — matches arbundles' EthereumSigner.
  const signatureHex = (await account.signMessage({ message: { raw: signatureData } })) as Hex;
  const signature = hexToBytes(signatureHex); // 65 bytes (r,s,v)
  const id = toBase64Url(await sha256(signature));

  const raw = concatU8(
    shortTo2ByteArray(ETHEREUM_SIG_TYPE),
    signature,
    owner,
    Uint8Array.of(0), // target absent
    concatU8(Uint8Array.of(1), anchor), // anchor present
    longTo8ByteArray(tags.length),
    longTo8ByteArray(tagsBytes.length),
    tagsBytes,
    data,
  );
  return { raw, id };
}

async function turboUploadUrl(): Promise<string> {
  const base = (await getServerEnv("TURBO_UPLOAD_URL")) ?? TURBO_DEFAULT_URL;
  return `${base.replace(/\/+$/, "")}/v1/tx`;
}

/**
 * Sign + upload a payload to Arweave via Turbo. Returns the Arweave tx id.
 * Throws on any failure (callers treat anchoring as best-effort and retry later).
 */
export async function anchorToArweave(
  payload: string | Bytes,
  tags: Tag[] = [],
): Promise<{ arweaveTx: string }> {
  const data: Bytes = typeof payload === "string" ? u8(payload) : payload;
  const { raw, id } = await buildDataItem(data, tags);

  const url = await turboUploadUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: raw,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Turbo upload failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json().catch(() => undefined)) as { id?: string } | undefined;
  if (!json?.id) {
    throw new Error("Turbo upload returned an invalid response (missing id).");
  }
  return { arweaveTx: json.id };
}

/* ---- hashing helpers reused by attest.ts / manifests.ts ------------------ */

/** SHA-256 of a UTF-8 string, as a 0x-prefixed hex digest. */
export async function sha256Hex(input: string): Promise<string> {
  return `0x${toHex(await sha256(u8(input)))}`;
}

/**
 * Binary Merkle root (SHA-256) over leaf strings. Each leaf is hashed, then pairs
 * are hashed up the tree (odd nodes are promoted/duplicated). Returns a 0x hex
 * root; the empty set yields the SHA-256 of the empty string.
 */
export async function merkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return `0x${toHex(await sha256(new Uint8Array(0)))}`;
  let level: Bytes[] = await Promise.all(leaves.map((l) => sha256(u8(l))));
  while (level.length > 1) {
    const next: Bytes[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left; // duplicate the last node when odd
      next.push(await sha256(concatU8(left, right)));
    }
    level = next;
  }
  return `0x${toHex(level[0])}`;
}
