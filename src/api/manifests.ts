/**
 * Content-addressed agent manifests (Stage E). Server-only.
 *
 * A manifest is the canonical, signed description of an agent template at a given
 * version. On fork/deploy we content-hash it (SHA-256 over canonical JSON) and
 * anchor it to Arweave via the treasury key, then pin `manifestHash`/`arweaveTx`
 * onto the matching `agent_versions` row. The hash is deterministic per (agent,
 * version), so the manifest is pinned once and reused by later forks. Anchoring is
 * best-effort: if Turbo is unreachable the hash is still pinned and the cron's
 * `retryPendingManifests` re-anchors later.
 */
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { DB } from "@/db";
import { getDb, schema } from "@/db";
import type { Agent } from "@/db/schema";
import { anchorToArweave, sha256Hex, type Tag } from "./arweave";
import { getNetwork } from "./chain";

/** Stable stringify (recursively sorted keys) so the content hash is canonical. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

/** The canonical manifest document for an agent template at its current version. */
export function buildManifest(agent: Agent, network: string): Record<string, unknown> {
  return {
    schema: "clad.manifest/v1",
    agentId: agent.id,
    name: agent.name,
    version: agent.version,
    kind: agent.kind,
    category: agent.category,
    creator: agent.creator,
    network,
    price: agent.price,
    currency: agent.currency,
    royaltyPct: agent.royaltyPct,
    capabilities: agent.capabilities ?? [],
    tags: agent.tags ?? [],
  };
}

function manifestTags(agent: Agent, manifestHash: string): Tag[] {
  return [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "Clad-Protocol" },
    { name: "Type", value: "agent-manifest" },
    { name: "Agent-Id", value: agent.id },
    { name: "Agent-Version", value: agent.version },
    { name: "Manifest-Hash", value: manifestHash },
  ];
}

async function findOrCreateVersionRow(db: DB, agent: Agent): Promise<number> {
  const [existing] = await db
    .select({ id: schema.agentVersions.id })
    .from(schema.agentVersions)
    .where(and(eq(schema.agentVersions.agentId, agent.id), eq(schema.agentVersions.version, agent.version)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(schema.agentVersions)
    .values({
      agentId: agent.id,
      version: agent.version,
      releasedAt: new Date(),
      notes: "Manifest pinned on first deploy",
    })
    .returning({ id: schema.agentVersions.id });
  return created.id;
}

/**
 * Pin (and anchor) the manifest for an agent's current version. Idempotent: if
 * the version row already has a `manifestHash` it is returned unchanged. Never
 * throws — anchoring failures leave `arweaveTx` null for the cron to retry.
 */
export async function pinManifest(
  agent: Agent,
  dbArg?: DB,
): Promise<{ manifestHash: string; arweaveTx: string | null }> {
  const db = dbArg ?? (await getDb());
  const network = await getNetwork();

  const [row] = await db
    .select({
      id: schema.agentVersions.id,
      manifestHash: schema.agentVersions.manifestHash,
      arweaveTx: schema.agentVersions.arweaveTx,
    })
    .from(schema.agentVersions)
    .where(and(eq(schema.agentVersions.agentId, agent.id), eq(schema.agentVersions.version, agent.version)))
    .limit(1);

  if (row?.manifestHash) {
    return { manifestHash: row.manifestHash, arweaveTx: row.arweaveTx ?? null };
  }

  const json = canonicalJson(buildManifest(agent, network));
  const manifestHash = await sha256Hex(json);
  const versionId = row?.id ?? (await findOrCreateVersionRow(db, agent));

  let arweaveTx: string | null = null;
  try {
    const res = await anchorToArweave(json, manifestTags(agent, manifestHash));
    arweaveTx = res.arweaveTx;
  } catch (err) {
    console.error(`[manifest] anchor failed for ${agent.id} v${agent.version}:`, err);
  }

  await db
    .update(schema.agentVersions)
    .set({ manifestHash, arweaveTx })
    .where(eq(schema.agentVersions.id, versionId));

  return { manifestHash, arweaveTx };
}

/**
 * Re-anchor manifests that were content-hashed but never made it to Arweave
 * (anchoring failed when they were first pinned). Called from the cron.
 */
export async function retryPendingManifests(dbArg?: DB): Promise<{ anchored: number }> {
  const db = dbArg ?? (await getDb());
  const network = await getNetwork();

  const pending = await db
    .select({
      id: schema.agentVersions.id,
      agentId: schema.agentVersions.agentId,
      version: schema.agentVersions.version,
      manifestHash: schema.agentVersions.manifestHash,
    })
    .from(schema.agentVersions)
    .where(and(isNotNull(schema.agentVersions.manifestHash), isNull(schema.agentVersions.arweaveTx)));

  let anchored = 0;
  for (const v of pending) {
    const [agent] = await db
      .select()
      .from(schema.agents)
      .where(eq(schema.agents.id, v.agentId))
      .limit(1);
    if (!agent) continue;
    // Rebuild from the same inputs → same canonical JSON → same hash.
    const json = canonicalJson(buildManifest({ ...agent, version: v.version }, network));
    try {
      const res = await anchorToArweave(json, manifestTags({ ...agent, version: v.version }, v.manifestHash!));
      await db
        .update(schema.agentVersions)
        .set({ arweaveTx: res.arweaveTx })
        .where(eq(schema.agentVersions.id, v.id));
      anchored++;
    } catch (err) {
      console.error(`[manifest] retry anchor failed for ${v.agentId} v${v.version}:`, err);
    }
  }
  return { anchored };
}
