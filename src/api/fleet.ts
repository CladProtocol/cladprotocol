import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DemoInstance, InstanceStatus } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { instanceSelection, toFullInstance, toInstanceSummary } from "./serialize";

export async function listInstances(input: {
  kind?: "digital" | "physical";
}): Promise<DemoInstance[]> {
  const db = await getDb();
  const owner = await requireOwner();

  const rows = await db
    .select(instanceSelection)
    .from(schema.agentInstances)
    .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
    .where(eq(schema.agentInstances.owner, owner))
    .orderBy(desc(schema.agentInstances.lastActivityAt));

  let list = rows.map(toInstanceSummary);
  if (input.kind) list = list.filter((i) => i.kind === input.kind);
  return list;
}

export async function getInstance(input: { instanceId: string }): Promise<{
  instance: DemoInstance | null;
  agent: { id: string; name: string } | null;
}> {
  const db = await getDb();
  const owner = await requireOwner();

  const [row] = await db
    .select(instanceSelection)
    .from(schema.agentInstances)
    .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
    .where(
      and(
        eq(schema.agentInstances.id, input.instanceId),
        eq(schema.agentInstances.owner, owner),
      ),
    )
    .limit(1);
  if (!row) return { instance: null, agent: null };

  const earnings = await db
    .select({ idx: schema.instanceDailyEarnings.idx, value: schema.instanceDailyEarnings.value })
    .from(schema.instanceDailyEarnings)
    .where(eq(schema.instanceDailyEarnings.instanceId, input.instanceId));

  const actions = await db
    .select()
    .from(schema.instanceActions)
    .where(eq(schema.instanceActions.instanceId, input.instanceId))
    .orderBy(desc(schema.instanceActions.createdAt));

  const [agent] = await db
    .select({ id: schema.agents.id, name: schema.agents.name })
    .from(schema.agents)
    .where(eq(schema.agents.id, row.agentId))
    .limit(1);

  return { instance: toFullInstance(row, earnings, actions), agent: agent ?? null };
}

const STATUS_VERB: Record<InstanceStatus, string> = {
  active: "resumed",
  idle: "set to idle",
  paused: "paused",
  halted: "halted",
};

const VALID_STATUSES: InstanceStatus[] = ["active", "idle", "paused", "halted"];

export async function setInstanceStatus(input: {
  instanceId: string;
  status: InstanceStatus;
}): Promise<{ instanceId: string; status: InstanceStatus }> {
  if (!VALID_STATUSES.includes(input.status)) {
    throw new Error(
      `Invalid status "${input.status}". Must be one of: ${VALID_STATUSES.join(", ")}.`,
    );
  }
  const db = await getDb();
  const owner = await requireOwner();

  const scope = and(
    eq(schema.agentInstances.id, input.instanceId),
    eq(schema.agentInstances.owner, owner),
  );
  const [inst] = await db
    .select({ name: schema.agentInstances.name })
    .from(schema.agentInstances)
    .where(scope)
    .limit(1);
  if (!inst) throw new Error(`Instance ${input.instanceId} not found`);

  await db
    .update(schema.agentInstances)
    .set({ status: input.status, lastActivityAt: new Date() })
    .where(scope);

  await db.insert(schema.activity).values({
    instanceId: input.instanceId,
    owner,
    tag: "Fleet",
    message: `${inst.name} ${STATUS_VERB[input.status]} by operator`,
  });

  return { instanceId: input.instanceId, status: input.status };
}

export async function haltFleet(): Promise<{ halted: number }> {
  const db = await getDb();
  const owner = await requireOwner();

  const rows = await db
    .select({ id: schema.agentInstances.id })
    .from(schema.agentInstances)
    .where(eq(schema.agentInstances.owner, owner));

  await db
    .update(schema.agentInstances)
    .set({ status: "halted", lastActivityAt: new Date() })
    .where(eq(schema.agentInstances.owner, owner));

  await db.insert(schema.activity).values({
    owner,
    tag: "Fleet",
    message: `Fleet halted by operator (${rows.length} units)`,
  });

  return { halted: rows.length };
}
