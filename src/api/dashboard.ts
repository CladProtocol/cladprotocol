import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DemoActivity, DemoInstance } from "@/lib/demo-data";
import { requireOwner } from "./session.server";
import { instanceSelection, iso, toInstanceSummary } from "./serialize";

export type DashboardStats = {
  totalRevenue: number;
  activeAgents: number;
  activeRobots: number;
  paymentsCount: number;
};

export type DashboardOverview = {
  stats: DashboardStats;
  revenueSeries: { label: string; value: number }[];
  fleet: DemoInstance[];
  activity: DemoActivity[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Command Center overview: stat tiles, revenue chart, fleet table, live feed. */
export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardOverview> => {
    const db = await getDb();
    const owner = await requireOwner();

    const instanceRows = await db
      .select(instanceSelection)
      .from(schema.agentInstances)
      .innerJoin(schema.agents, eq(schema.agentInstances.agentId, schema.agents.id))
      .where(eq(schema.agentInstances.owner, owner))
      .orderBy(desc(schema.agentInstances.lastActivityAt));
    const fleet = instanceRows.map(toInstanceSummary);

    const activityRows = await db
      .select()
      .from(schema.activity)
      .where(eq(schema.activity.owner, owner))
      .orderBy(desc(schema.activity.createdAt));
    const activity: DemoActivity[] = activityRows.map((a) => ({
      id: a.id,
      instanceId: a.instanceId,
      message: a.message,
      tag: a.tag as DemoActivity["tag"],
      at: iso(a.createdAt),
    }));

    const paymentRows = await db
      .select({ id: schema.payments.id })
      .from(schema.payments)
      .where(eq(schema.payments.owner, owner));

    // Revenue series: derive by summing each instance's daily-earnings rollup.
    const instanceIds = instanceRows.map((i) => i.id);
    const earningRows = instanceIds.length
      ? await db
          .select({ idx: schema.instanceDailyEarnings.idx, value: schema.instanceDailyEarnings.value })
          .from(schema.instanceDailyEarnings)
          .where(inArray(schema.instanceDailyEarnings.instanceId, instanceIds))
      : [];
    const byIdx = new Map<number, number>();
    for (const e of earningRows) byIdx.set(e.idx, (byIdx.get(e.idx) ?? 0) + e.value);
    const revenueSeries = WEEKDAYS.map((label, idx) => ({
      label,
      value: Math.round(byIdx.get(idx) ?? 0),
    }));

    const stats: DashboardStats = {
      totalRevenue: fleet.reduce((s, i) => s + i.earnings, 0),
      activeAgents: fleet.filter((i) => i.kind === "digital" && i.status === "active").length,
      activeRobots: fleet.filter((i) => i.kind === "physical" && i.status === "active").length,
      paymentsCount: paymentRows.length,
    };

    return { stats, revenueSeries, fleet, activity };
  },
);
