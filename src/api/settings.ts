import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireOwner } from "./session.server";
import { iso } from "./serialize";

export type NotificationPrefs = {
  attestations: boolean;
  settlements: boolean;
  fleetAlerts: boolean;
  weeklyDigest: boolean;
};

export type OperatorSettings = {
  operator: { displayName: string; address: string; ens: string; joinedAt: string };
  notifications: NotificationPrefs;
};

const DEFAULT_PREFS: NotificationPrefs = {
  attestations: true,
  settlements: true,
  fleetAlerts: true,
  weeklyDigest: false,
};

async function readSettings(owner: string): Promise<OperatorSettings> {
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.address, owner)).limit(1);
  const [s] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.owner, owner))
    .limit(1);

  return {
    operator: {
      displayName: u?.displayName ?? "",
      address: owner,
      ens: u?.ens ?? "",
      joinedAt: iso(u?.createdAt ?? null),
    },
    notifications: s
      ? {
          attestations: s.notifyAttestations,
          settlements: s.notifySettlements,
          fleetAlerts: s.notifyFleetAlerts,
          weeklyDigest: s.notifyWeeklyDigest,
        }
      : { ...DEFAULT_PREFS },
  };
}

export async function getSettings(): Promise<OperatorSettings> {
  const owner = await requireOwner();
  return readSettings(owner);
}

export async function updateSettings(input: {
  displayName?: string;
  notifications?: Partial<NotificationPrefs>;
}): Promise<OperatorSettings> {
  const db = await getDb();
  const owner = await requireOwner();

  if (typeof input.displayName === "string") {
    const name = input.displayName.trim();
    if (name.length > 64) throw new Error("Display name must be 64 characters or fewer.");
    await db.update(schema.users).set({ displayName: name }).where(eq(schema.users.address, owner));
    await db.insert(schema.activity).values({
      owner,
      tag: "Fleet",
      message: `Display name updated to "${name}"`,
    });
  }

  if (input.notifications) {
    const current = await readSettings(owner);
    const merged = { ...current.notifications, ...input.notifications };
    await db
      .insert(schema.userSettings)
      .values({
        owner,
        notifyAttestations: merged.attestations,
        notifySettlements: merged.settlements,
        notifyFleetAlerts: merged.fleetAlerts,
        notifyWeeklyDigest: merged.weeklyDigest,
      })
      .onConflictDoUpdate({
        target: schema.userSettings.owner,
        set: {
          notifyAttestations: merged.attestations,
          notifySettlements: merged.settlements,
          notifyFleetAlerts: merged.fleetAlerts,
          notifyWeeklyDigest: merged.weeklyDigest,
        },
      });
  }

  return readSettings(owner);
}
