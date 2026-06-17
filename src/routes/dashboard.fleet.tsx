import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BatteryMedium, Bot, ChevronRight, Cpu } from "lucide-react";
import { timeAgo, usd } from "@/lib/demo-data";
import { fleetQueryOptions } from "@/lib/queries";
import { SectionTag, StatusBadge } from "@/components/axion/shared";

export const Route = createFileRoute("/dashboard/fleet")({
  component: FleetPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(fleetQueryOptions()),
  head: () => ({ meta: [{ title: "Fleet — Clad Command Center" }] }),
});

type KindFilter = "all" | "digital" | "physical";

function FleetPage() {
  const { data: instances } = useSuspenseQuery(fleetQueryOptions());
  const [kind, setKind] = useState<KindFilter>("all");

  const rows = useMemo(
    () => instances.filter((i) => kind === "all" || i.kind === kind),
    [instances, kind],
  );

  const totalEarnings = instances.reduce((s, i) => s + i.earnings, 0);
  const totalActions = instances.reduce((s, i) => s + i.actions, 0);
  const active = instances.filter((i) => i.status === "active").length;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <SectionTag label="Fleet" />
        <h1 className="mt-4 font-medium text-gray-900" style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}>
          {instances.length} units deployed
        </h1>
        <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
          <div>
            <div className="text-[20px] font-medium text-gray-900">{active}</div>
            <div className="text-[12px] text-gray-500">Active</div>
          </div>
          <div>
            <div className="text-[20px] font-medium text-gray-900">{totalActions.toLocaleString()}</div>
            <div className="text-[12px] text-gray-500">Total actions</div>
          </div>
          <div>
            <div className="text-[20px] font-medium text-gray-900">{usd(totalEarnings)}</div>
            <div className="text-[12px] text-gray-500">Earnings</div>
          </div>
        </div>
      </div>

      {/* Filter + table */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-[16px] font-medium text-gray-900">Units</h2>
          <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-full p-1">
            {(["all", "digital", "physical"] as KindFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`text-[13px] font-medium rounded-full px-3.5 py-1.5 capitalize transition-colors ${
                  kind === k ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {k === "all" ? "All" : k === "digital" ? "Digital" : "Robotics"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Unit</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Type</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium hidden lg:table-cell">Region</th>
                <th className="py-3 px-2 font-medium hidden md:table-cell">Last active</th>
                <th className="py-3 px-2 font-medium text-right">Earnings</th>
                <th className="py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 last:border-0 group hover:bg-[#F5F5F5] transition-colors">
                  <td className="py-3.5">
                    <Link to="/dashboard/fleet/$instanceId" params={{ instanceId: i.id }} className="block">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {i.name}
                        {i.batteryLevel != null && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 font-normal">
                            <BatteryMedium size={12} /> {i.batteryLevel}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">{i.id}</div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-2 text-gray-700 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      {i.kind === "physical" ? <Cpu size={12} /> : <Bot size={12} />}
                      {i.kind === "physical" ? "Robotics" : "Digital"}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="py-3.5 px-2 text-gray-600 hidden lg:table-cell">{i.region}</td>
                  <td className="py-3.5 px-2 text-gray-500 hidden md:table-cell">{timeAgo(i.lastActivityAt)}</td>
                  <td className="py-3.5 px-2 text-right font-medium text-gray-900">${i.earnings.toLocaleString()}</td>
                  <td className="py-3.5">
                    <Link to="/dashboard/fleet/$instanceId" params={{ instanceId: i.id }} className="block text-gray-400 group-hover:text-gray-900 transition-colors">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
