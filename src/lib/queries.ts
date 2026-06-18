import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Me } from "@/api/auth";
import type { DemoAgent, DemoInstance, DemoAttestation, DemoPayment, AgentKind, LedgerStatus, PaymentKind } from "@/lib/demo-data";
import type { DashboardOverview } from "@/api/dashboard";
import type { MyAgentGroup } from "@/api/agents";
import type { OperatorSettings } from "@/api/settings";

const LIVE = 8_000;

/* ---- auth ----------------------------------------------------------------- */

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me | null>("/api/auth/me"),
    staleTime: 30_000,
  });

/* ---- marketplace + legion ------------------------------------------------ */

export type AgentFilters = { kind?: AgentKind; category?: string; q?: string };

export const agentsQueryOptions = (filters: AgentFilters = {}) =>
  queryOptions({
    queryKey: ["agents", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.kind) params.set("kind", filters.kind);
      if (filters.category) params.set("category", filters.category);
      if (filters.q) params.set("q", filters.q);
      const qs = params.toString();
      return apiFetch<DemoAgent[]>(`/api/agents${qs ? `?${qs}` : ""}`);
    },
  });

export const agentQueryOptions = (agentId: string) =>
  queryOptions({
    queryKey: ["agent", agentId],
    queryFn: () =>
      apiFetch<{ agent: DemoAgent | null; instances: DemoInstance[] }>(
        `/api/agents/${agentId}`,
      ),
  });

export const myAgentsQueryOptions = () =>
  queryOptions({
    queryKey: ["my-agents"],
    queryFn: () => apiFetch<{ deployed: MyAgentGroup[]; totalAgents: number }>("/api/agents/my"),
  });

/* ---- command center ------------------------------------------------------ */

export const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => apiFetch<DashboardOverview>("/api/dashboard"),
  refetchInterval: LIVE,
});

export const fleetQueryOptions = (kind?: AgentKind) =>
  queryOptions({
    queryKey: ["fleet", kind ?? "all"],
    queryFn: () => {
      const params = kind ? `?kind=${kind}` : "";
      return apiFetch<DemoInstance[]>(`/api/fleet${params}`);
    },
    refetchInterval: LIVE,
  });

export const instanceQueryOptions = (instanceId: string) =>
  queryOptions({
    queryKey: ["instance", instanceId],
    queryFn: () =>
      apiFetch<{ instance: DemoInstance | null; agent: { id: string; name: string } | null }>(
        `/api/fleet/${instanceId}`,
      ),
    refetchInterval: LIVE,
  });

export const ledgerQueryOptions = (status?: LedgerStatus) =>
  queryOptions({
    queryKey: ["ledger", status ?? "all"],
    queryFn: () => {
      const params = status ? `?status=${status}` : "";
      return apiFetch<DemoAttestation[]>(`/api/ledger${params}`);
    },
    refetchInterval: LIVE,
  });

export const attestationQueryOptions = (batch: number) =>
  queryOptions({
    queryKey: ["attestation", batch],
    queryFn: () => apiFetch<DemoAttestation | null>(`/api/ledger/${batch}`),
  });

export const paymentsQueryOptions = (kind?: PaymentKind) =>
  queryOptions({
    queryKey: ["payments", kind ?? "all"],
    queryFn: () => {
      const params = kind ? `?kind=${kind}` : "";
      return apiFetch<DemoPayment[]>(`/api/payments${params}`);
    },
  });

export const settingsQueryOptions = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: () => apiFetch<OperatorSettings>("/api/settings"),
  });
