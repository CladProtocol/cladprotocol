"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BatteryMedium, Bot, Cpu, Pause, Play, Radio, Square, Zap } from "lucide-react";
import { formatDate, timeAgo, usd, type InstanceStatus } from "@/lib/demo-data";
import { instanceQueryOptions } from "@/lib/queries";
import { apiPost } from "@/lib/api";
import { useInvokeAgent } from "@/hooks/use-invoke";
import { toast } from "sonner";
import { MiniBars, MoreLink, PillButton, StatusBadge } from "@/components/axion/shared";

function InstanceDetailContent({ instanceId }: { instanceId: string }) {
  const { data } = useSuspenseQuery(instanceQueryOptions(instanceId));
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: (status: InstanceStatus) => apiPost(`/api/fleet/${instanceId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance", instanceId] });
      queryClient.invalidateQueries({ queryKey: ["fleet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const invoke = useInvokeAgent();
  const inst = data.instance;
  const agent = data.agent;

  if (!inst) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <h1 className="text-[24px] font-medium text-gray-900">Unit not found</h1>
        <p className="mt-3 text-gray-600">No instance with id {instanceId}.</p>
        <div className="mt-6 flex justify-center">
          <PillButton label="Back to fleet" variant="dark" to="/dashboard/fleet" />
        </div>
      </div>
    );
  }

  const KindIcon = inst.kind === "physical" ? Cpu : Bot;
  const status = inst.status;
  const halted = status === "halted";
  const busy = statusMutation.isPending;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <Link
          href="/dashboard/fleet"
          className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Fleet
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
              <KindIcon size={22} className="text-[#ECE81A]" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-[24px] sm:text-[30px] font-medium text-gray-900"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {inst.name}
                </h1>
                <StatusBadge status={status} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-[13px] text-gray-500 font-mono flex-wrap">
                <span>{inst.id}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>manifest v{inst.manifestVersion}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{inst.region}</span>
              </div>
              {agent && (
                <div className="mt-3 text-[13px] text-gray-600">
                  Running{" "}
                  <Link
                    href={`/marketplace/${agent.id}`}
                    className="font-medium text-gray-900 hover:underline underline-offset-2"
                  >
                    {agent.name}
                  </Link>{" "}
                  · deployed {formatDate(inst.deployedAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inst.kind === "digital" && status === "active" && (
              <button
                onClick={() =>
                  invoke.mutate(
                    { instanceId },
                    {
                      onSuccess: (r) =>
                        toast.success(`Earned $${r.amount.toFixed(2)} — ${r.job}`, {
                          description: `Settled ${r.txHash.slice(0, 12)}…`,
                        }),
                      onError: (e) => toast.error(e instanceof Error ? e.message : "Task failed"),
                    },
                  )
                }
                disabled={invoke.isPending}
                title="Simulate a customer paying this agent for a task (x402)"
                className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-[#ECE81A] hover:bg-[#d4ce15] disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 px-4 py-2 transition-colors"
              >
                <Zap size={14} /> {invoke.isPending ? "Running…" : "Paid task"}
              </button>
            )}
            {status === "active" ? (
              <button
                onClick={() => statusMutation.mutate("paused")}
                disabled={busy}
                className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full border border-gray-300 hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 transition-colors"
              >
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button
                onClick={() => statusMutation.mutate("active")}
                disabled={halted || busy}
                className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-[#ECE81A] hover:bg-[#d4ce15] disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 px-4 py-2 transition-colors"
              >
                <Play size={14} /> Resume
              </button>
            )}
            <button
              onClick={() => statusMutation.mutate("halted")}
              disabled={halted || busy}
              className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 transition-colors"
            >
              <Square size={13} /> Halt
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
            <div>
              <div className="text-[24px] font-medium text-gray-900">
                {inst.actions.toLocaleString()}
              </div>
              <div className="text-[12px] text-gray-500">Actions</div>
            </div>
            <div>
              <div className="text-[24px] font-medium text-gray-900">
                ${inst.earnings.toLocaleString()}
              </div>
              <div className="text-[12px] text-gray-500">Earnings</div>
            </div>
            <div>
              <div className="text-[24px] font-medium text-gray-900">
                {timeAgo(inst.lastActivityAt)}
              </div>
              <div className="text-[12px] text-gray-500">Last active</div>
            </div>
            <div>
              <div className="text-[24px] font-medium text-gray-900 capitalize">
                {inst.kind === "physical" ? "Robotics" : "Digital"}
              </div>
              <div className="text-[12px] text-gray-500">Type</div>
            </div>
          </div>
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium text-gray-900">Earnings · last 7 days</h2>
              <span className="text-[13px] text-gray-500">{usd(inst.earnings)} lifetime</span>
            </div>
            <MiniBars data={inst.earningsSeries} height={150} />
          </div>
        </div>

        <div className="bg-gray-900 text-white rounded-2xl p-5 sm:p-7 flex flex-col">
          <h2 className="text-[15px] font-medium mb-5">Telemetry</h2>
          <div className="flex flex-col gap-4 flex-1">
            {inst.kind === "physical" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] text-gray-400">
                    <BatteryMedium size={15} className="text-[#ECE81A]" /> Battery
                  </span>
                  <span className="text-[14px] font-medium">{inst.batteryLevel}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ECE81A]"
                    style={{ width: `${inst.batteryLevel ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="flex items-center gap-2 text-[13px] text-gray-400">
                    <Radio size={15} className="text-[#ECE81A]" /> ROS 2 link
                  </span>
                  <span className="text-[14px] font-medium">
                    {inst.rosConnected ? "Connected" : "Offline"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Digital agent — no hardware telemetry. Execution traces are signed and anchored to
                the IRONCLAD ledger every batch window.
              </p>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-white/10">
            <MoreLink
              to="/dashboard/ledger"
              label="View attestations"
              className="text-white hover:text-[#ECE81A]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <h2 className="text-[16px] font-medium text-gray-900 mb-4">Recent actions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Task</th>
                <th className="py-3 px-2 font-medium">Result</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">When</th>
                <th className="py-3 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {inst.recentActions.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3.5">
                    <div className="text-gray-900">{a.label}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{a.id}</div>
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusBadge status={a.result} />
                  </td>
                  <td className="py-3.5 px-2 text-gray-500 hidden sm:table-cell">
                    {timeAgo(a.at)}
                  </td>
                  <td className="py-3.5 text-right font-medium text-gray-900">
                    {a.value > 0 ? `+$${a.value.toFixed(2)}` : "—"}
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

export default function InstanceDetailPage() {
  const params = useParams();
  const instanceId = params.instanceId as string;
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading instance…</div>}>
      <InstanceDetailContent instanceId={instanceId} />
    </Suspense>
  );
}
