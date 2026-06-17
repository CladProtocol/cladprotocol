import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import DashboardShell from "@/components/axion/DashboardShell";
import { meQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/dashboard")({
  // Gate the whole Command Center: redirect to the landing page (where the
  // connect-wallet flow lives) when there is no authenticated session.
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());
    if (!user) throw redirect({ to: "/" });
  },
  component: DashboardLayout,
  head: () => ({
    meta: [
      { title: "Command Center — Clad Protocol" },
      {
        name: "description",
        content: "Operator dashboard for Clad Protocol agents and robotics fleets on Base.",
      },
      { property: "og:title", content: "Command Center — Clad Protocol" },
      {
        property: "og:description",
        content: "Operator dashboard for Clad Protocol agents and robotics fleets on Base.",
      },
    ],
  }),
});

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
