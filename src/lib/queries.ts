import { queryOptions } from "@tanstack/react-query";
import { me } from "@/api/auth";
import { getAgent, getMyAgents, listAgents } from "@/api/agents";
import { getDashboardOverview } from "@/api/dashboard";
import { getInstance, listInstances } from "@/api/fleet";
import { getAttestation, listAttestations } from "@/api/ledger";
import { listPayments } from "@/api/payments";
import { getSettings } from "@/api/settings";
import type { AgentKind, LedgerStatus, PaymentKind } from "@/lib/demo-data";

// Central place for query definitions so loaders (SSR prefetch) and components
// share one cache key. Live-ish polling is a one-line `refetchInterval` here.

const LIVE = 8_000; // ms — overview/fleet/ledger poll for near-real-time updates.

/* ---- auth ----------------------------------------------------------------- */

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: () => me(),
    staleTime: 30_000,
  });

/* ---- marketplace + legion ------------------------------------------------ */

export type AgentFilters = { kind?: AgentKind; category?: string; q?: string };

export const agentsQueryOptions = (filters: AgentFilters = {}) =>
  queryOptions({
    queryKey: ["agents", filters],
    queryFn: () => listAgents({ data: filters }),
  });

export const agentQueryOptions = (agentId: string) =>
  queryOptions({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent({ data: { agentId } }),
  });

export const myAgentsQueryOptions = () =>
  queryOptions({
    queryKey: ["my-agents"],
    queryFn: () => getMyAgents(),
  });

/* ---- command center ------------------------------------------------------ */

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboardOverview(),
  refetchInterval: LIVE,
});

export const fleetQueryOptions = (kind?: AgentKind) =>
  queryOptions({
    queryKey: ["fleet", kind ?? "all"],
    queryFn: () => listInstances({ data: kind ? { kind } : {} }),
    refetchInterval: LIVE,
  });

export const instanceQueryOptions = (instanceId: string) =>
  queryOptions({
    queryKey: ["instance", instanceId],
    queryFn: () => getInstance({ data: { instanceId } }),
    refetchInterval: LIVE,
  });

export const ledgerQueryOptions = (status?: LedgerStatus) =>
  queryOptions({
    queryKey: ["ledger", status ?? "all"],
    queryFn: () => listAttestations({ data: status ? { status } : {} }),
    refetchInterval: LIVE,
  });

export const attestationQueryOptions = (batch: number) =>
  queryOptions({
    queryKey: ["attestation", batch],
    queryFn: () => getAttestation({ data: { batch } }),
  });

export const paymentsQueryOptions = (kind?: PaymentKind) =>
  queryOptions({
    queryKey: ["payments", kind ?? "all"],
    queryFn: () => listPayments({ data: kind ? { kind } : {} }),
  });

export const settingsQueryOptions = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
