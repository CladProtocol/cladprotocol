"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ExternalLink, Hash, Layers, ShieldCheck } from "lucide-react";
import { formatTime, formatDate } from "@/lib/demo-data";
import { attestationQueryOptions } from "@/lib/queries";
import { PillButton, StatusBadge } from "@/components/axion/shared";

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</dt>
      <dd className={`text-[14px] text-gray-900 break-all ${mono ? "font-mono text-[13px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function AttestationContent({ batch }: { batch: string }) {
  const { data: att } = useSuspenseQuery(attestationQueryOptions(Number(batch)));

  if (!att) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <h1 className="text-[24px] font-medium text-gray-900">Batch not found</h1>
        <p className="mt-3 text-gray-600">No attestation batch #{batch}.</p>
        <div className="mt-6 flex justify-center">
          <PillButton label="Back to ledger" variant="dark" to="/dashboard/ledger" />
        </div>
      </div>
    );
  }

  const anchored = att.status === "anchored";
  const steps = [
    {
      icon: Check,
      title: "Actions signed",
      detail: `${att.actions} actions signed by instance key`,
      done: true,
    },
    {
      icon: Hash,
      title: "Batch hashed (SHA-256)",
      detail: "Digest computed over the action set",
      done: true,
    },
    {
      icon: Layers,
      title: "Merkle root computed",
      detail: String(att.payload.merkleRoot ?? "—"),
      done: true,
    },
    {
      icon: ShieldCheck,
      title: anchored ? "Anchored to Arweave" : "Awaiting anchor",
      detail: anchored ? (att.arweaveTx as string) : "Queued for next Arweave bundle",
      done: anchored,
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <Link
          href="/dashboard/ledger"
          className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> IRONCLAD ledger
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-[26px] sm:text-[32px] font-medium text-gray-900 font-mono"
                style={{ letterSpacing: "-0.02em" }}
              >
                #{att.batchNumber.toLocaleString()}
              </h1>
              <StatusBadge status={att.status} />
            </div>
            <div className="mt-2 text-[13px] text-gray-600">
              <Link
                href={`/dashboard/fleet/${att.instanceId}`}
                className="font-medium text-gray-900 hover:underline underline-offset-2"
              >
                {att.instanceName}
              </Link>{" "}
              <span className="font-mono text-gray-400">· {att.instanceId}</span>
            </div>
          </div>
          {anchored && (
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full border border-gray-300 hover:border-gray-900 px-4 py-2 transition-colors self-start"
            >
              View on Arweave <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-5 sm:p-7">
          <h2 className="text-[15px] font-medium text-gray-900 mb-5">Verification trail</h2>
          <div className="flex flex-col">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex gap-3 pb-6 last:pb-0 relative">
                  {i < steps.length - 1 && (
                    <span
                      className={`absolute left-[15px] top-8 bottom-0 w-px ${s.done ? "bg-[#ECE81A]" : "bg-gray-200"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      s.done ? "bg-[#ECE81A] text-gray-900" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 pt-1">
                    <div className="text-[14px] font-medium text-gray-900">{s.title}</div>
                    <div className="text-[12px] text-gray-500 font-mono break-all mt-0.5">
                      {s.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 sm:p-7">
            <h2 className="text-[15px] font-medium text-gray-900 mb-4">Batch metadata</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <Detail label="Actions" value={String(att.actions)} />
              <Detail
                label="Window"
                value={`${formatTime(att.windowStart)} – ${formatTime(att.windowEnd)}`}
              />
              <Detail label="Created" value={`${formatDate(att.at)}, ${formatTime(att.at)}`} />
              <Detail label="Arweave tx" value={att.arweaveTx ?? "Pending"} mono />
              <div className="sm:col-span-2">
                <Detail label="SHA-256" value={att.sha256} mono />
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-7">
            <h2 className="text-[15px] font-medium text-gray-900 mb-4">Payload</h2>
            <div className="rounded-2xl bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">
                  application/json
                </span>
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ECE81A]/60" />
                </span>
              </div>
              <pre className="px-5 py-4 overflow-x-auto text-[13px] leading-[1.6] text-gray-200 font-mono">
                <code>{JSON.stringify(att.payload, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttestationDetailPage() {
  const params = useParams();
  const batch = params.batch as string;
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading batch…</div>}>
      <AttestationContent batch={batch} />
    </Suspense>
  );
}
