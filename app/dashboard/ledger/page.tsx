"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Database, ShieldCheck } from "lucide-react";
import { formatTime } from "@/lib/demo-data";
import { ledgerQueryOptions } from "@/lib/queries";
import { SectionTag, StatusBadge } from "@/components/axion/shared";

const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;

type Filter = "all" | "anchored" | "pending";

function LedgerContent() {
  const { data: attestations } = useSuspenseQuery(ledgerQueryOptions());
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => attestations.filter((a) => filter === "all" || a.status === filter),
    [attestations, filter],
  );

  const anchored = attestations.filter((a) => a.status === "anchored").length;
  const pending = attestations.filter((a) => a.status === "pending").length;
  const totalActions = attestations.reduce((s, a) => s + a.actions, 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <SectionTag label="IRONCLAD ledger" />
        <h1
          className="mt-4 font-medium text-gray-900"
          style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}
        >
          Every action, <span className="italic font-light text-gray-500">attested</span>.
        </h1>
        <p className="mt-3 text-[14px] text-gray-600 max-w-2xl leading-relaxed">
          Actions are batched, hashed with SHA-256, and anchored to Arweave for permanent
          provenance. Open any batch to inspect its payload and verification trail.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
          <div>
            <div className="text-[20px] font-medium text-gray-900">{anchored}</div>
            <div className="text-[12px] text-gray-500 flex items-center gap-1">
              <ShieldCheck size={12} className="text-gray-900" /> Anchored
            </div>
          </div>
          <div>
            <div className="text-[20px] font-medium text-gray-900">{pending}</div>
            <div className="text-[12px] text-gray-500">Pending anchor</div>
          </div>
          <div>
            <div className="text-[20px] font-medium text-gray-900">
              {totalActions.toLocaleString()}
            </div>
            <div className="text-[12px] text-gray-500">Actions attested</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-[16px] font-medium text-gray-900 flex items-center gap-2">
            <Database size={16} /> Attestation batches
          </h2>
          <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-full p-1">
            {(["all", "anchored", "pending"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[13px] font-medium rounded-full px-3.5 py-1.5 capitalize transition-colors ${
                  filter === f ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Batch</th>
                <th className="py-3 px-2 font-medium hidden md:table-cell">Unit</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Actions</th>
                <th className="py-3 px-2 font-medium hidden lg:table-cell">SHA-256</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">When</th>
                <th className="py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-100 last:border-0 group hover:bg-[#F5F5F5] transition-colors"
                >
                  <td className="py-3.5">
                    <Link href={`/dashboard/ledger/${a.batchNumber}`} className="block">
                      <span className="font-medium text-gray-900 font-mono">
                        #{a.batchNumber.toLocaleString()}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-2 text-gray-700 hidden md:table-cell">
                    {a.instanceName}
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="py-3.5 px-2 text-gray-700 font-mono text-[12px] hidden sm:table-cell">
                    {a.actions}
                  </td>
                  <td className="py-3.5 px-2 text-gray-500 font-mono text-[12px] hidden lg:table-cell">
                    {shortHash(a.sha256)}
                  </td>
                  <td className="py-3.5 px-2 text-gray-500 hidden sm:table-cell">
                    {formatTime(a.at)}
                  </td>
                  <td className="py-3.5">
                    <Link
                      href={`/dashboard/ledger/${a.batchNumber}`}
                      className="block text-gray-400 group-hover:text-gray-900 transition-colors"
                    >
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

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading ledger…</div>}>
      <LedgerContent />
    </Suspense>
  );
}
