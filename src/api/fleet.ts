import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DemoInstance, InstanceStatus } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { instanceSelection, toFullInstance, toInstanceSummary } from "./serialize";

/** Fleet list. Owner-scoped, optional digital/physical filter. */
export const listInstances = createServerFn({ method: "GET" })
  .inputValidator((input: { kind?: "digital" | "physical" }): { kind?: "digital" | "physical" } => input ?? {})
  .handler(async ({ data }): Promise<DemoInstance[]> => {
    const db = await getDb();
    const owner = await requireOwner();

    const rows = await db
      .select(instanceSelection)
      .from(schema.agentInstances)
      .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
      .where(eq(schema.agentInstances.owner, owner))
      .orderBy(desc(schema.agentInstances.lastActivityAt));

    let list = rows.map(toInstanceSummary);
    if (data.kind) list = list.filter((i) => i.kind === data.kind);
    return list;
  });

/** Fleet detail: full instance (earnings chart + recent actions) + linked agent. */
export const getInstance = createServerFn({ method: "GET" })
  .inputValidator((input: { instanceId: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ instance: DemoInstance | null; agent: { id: string; name: string } | null }> => {
      const db = await getDb();
      const owner = await requireOwner();

      const [row] = await db
        .select(instanceSelection)
        .from(schema.agentInstances)
        .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
        .where(and(eq(schema.agentInstances.id, data.instanceId), eq(schema.agentInstances.owner, owner)))
        .limit(1);
      if (!row) return { instance: null, agent: null };

      const earnings = await db
        .select({ idx: schema.instanceDailyEarnings.idx, value: schema.instanceDailyEarnings.value })
        .from(schema.instanceDailyEarnings)
        .where(eq(schema.instanceDailyEarnings.instanceId, data.instanceId));

      const actions = await db
        .select()
        .from(schema.instanceActions)
        .where(eq(schema.instanceActions.instanceId, data.instanceId))
        .orderBy(desc(schema.instanceActions.createdAt));

      const [agent] = await db
        .select({ id: schema.agents.id, name: schema.agents.name })
        .from(schema.agents)
        .where(eq(schema.agents.id, row.agentId))
        .limit(1);

      return { instance: toFullInstance(row, earnings, actions), agent: agent ?? null };
    },
  );

/* ---- mutations ----------------------------------------------------------- */

const STATUS_VERB: Record<InstanceStatus, string> = {
  active: "resumed",
  idle: "set to idle",
  paused: "paused",
  halted: "halted",
};

const VALID_STATUSES: InstanceStatus[] = ["active", "idle", "paused", "halted"];

/** Pause / resume / halt a single unit. Halting also stops its settlement. */
export const setInstanceStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { instanceId: string; status: InstanceStatus }) => {
    if (!VALID_STATUSES.includes(input?.status)) {
      throw new Error(`Invalid status "${input?.status}". Must be one of: ${VALID_STATUSES.join(", ")}.`);
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ instanceId: string; status: InstanceStatus }> => {
    const db = await getDb();
    const owner = await requireOwner();

    const scope = and(
      eq(schema.agentInstances.id, data.instanceId),
      eq(schema.agentInstances.owner, owner),
    );
    const [inst] = await db
      .select({ name: schema.agentInstances.name })
      .from(schema.agentInstances)
      .where(scope)
      .limit(1);
    if (!inst) throw new Error(`Instance ${data.instanceId} not found`);

    await db
      .update(schema.agentInstances)
      .set({ status: data.status, lastActivityAt: new Date() })
      .where(scope);

    await db.insert(schema.activity).values({
      instanceId: data.instanceId,
      owner,
      tag: "Fleet",
      message: `${inst.name} ${STATUS_VERB[data.status]} by operator`,
    });

    return { instanceId: data.instanceId, status: data.status };
  });

/** Danger zone: halt every unit in the operator's fleet at once. */
export const haltFleet = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ halted: number }> => {
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
  },
);
