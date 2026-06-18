"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bot, CheckCircle2, Cpu, ShieldCheck, Wallet, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatTime, usd } from "@/lib/demo-data";
import { dashboardQueryOptions } from "@/lib/queries";
import { MiniBars, MoreLink, SectionTag, StatusBadge } from "@/components/axion/shared";

function DashboardContent() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { totalRevenue, activeAgents, activeRobots, paymentsCount } = data.stats;
  const revenueSeries = data.revenueSeries;
  const activity = data.activity;
  const fleet = data.fleet;

  const stats: { key: string; label: string; value: string; icon: LucideIcon }[] = [
    { key: "revenue", label: "Total revenue earned", value: usd(totalRevenue), icon: Wallet },
    { key: "agents", label: "Active agents", value: String(activeAgents), icon: Bot },
    { key: "robots", label: "Active robots", value: String(activeRobots), icon: Cpu },
    {
      key: "payments",
      label: "x402 payments processed",
      value: String(paymentsCount),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7">
      <div className="pb-6 sm:pb-8 border-b border-gray-100">
        <SectionTag label="Operator overview" />
        <h1
          className="mt-4 font-medium text-gray-900"
          style={{
            fontSize: "clamp(1.6rem,4vw,2.8rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          Your fleet, <span className="italic font-light text-gray-500">verified</span> in real
          time.
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="bg-[#F5F5F5] rounded-2xl p-5 flex flex-col gap-4 border-b-[3px] border-[#ECE81A]"
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                <Icon size={16} className="text-gray-900" />
              </div>
              <div>
                <div
                  className="font-medium text-gray-900"
                  style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.02em" }}
                >
                  {stat.value}
                </div>
                <div className="text-[12px] sm:text-[13px] text-gray-600 mt-1">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-6 sm:mt-8">
        <div className="lg:col-span-2 bg-[#F5F5F5] rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-medium text-gray-900">Revenue · last 7 days</h2>
            <span className="text-[13px] text-gray-500">
              {usd(revenueSeries.reduce((s, d) => s + d.value, 0))} settled
            </span>
          </div>
          <MiniBars data={revenueSeries} height={160} />
        </div>

        <div className="bg-gray-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-medium">Live activity</h2>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECE81A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ECE81A]" />
              </span>
              Streaming
            </span>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {activity.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 border-t border-white/10 pt-4 first:border-0 first:pt-0"
              >
                <CheckCircle2 size={14} className="text-[#ECE81A] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug">{a.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono text-gray-500">{formatTime(a.at)}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#ECE81A]">
                      {a.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12px] text-gray-400">
              <Zap size={12} className="text-[#ECE81A]" />
              Anchored to Arweave
            </span>
            <MoreLink
              to="/dashboard/ledger"
              label="View ledger"
              className="text-white hover:!opacity-100 hover:text-[#ECE81A]"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] sm:text-[18px] font-medium text-gray-900">Active fleet</h2>
          <MoreLink
            to="/dashboard/fleet"
            label={`All ${fleet.length} units`}
            className="text-gray-900"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Unit</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Type</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium hidden md:table-cell">Actions</th>
                <th className="py-3 font-medium text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-[#F5F5F5] transition-colors"
                >
                  <td className="py-3.5">
                    <Link href={`/dashboard/fleet/${a.id}`} className="block">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">{a.id}</div>
                    </Link>
                  </td>
                  <td className="py-3.5 px-2 text-gray-700 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      {a.kind === "physical" ? <Cpu size={12} /> : <Bot size={12} />}
                      {a.kind === "physical" ? "Robotics" : "Digital"}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="py-3.5 px-2 text-gray-700 font-mono text-[12px] hidden md:table-cell">
                    {a.actions.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right font-medium text-gray-900">
                    ${a.earnings.toLocaleString()}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading overview…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
