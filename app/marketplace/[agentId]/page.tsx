"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Check, Cpu, GitFork, Rocket, ShieldCheck, Star } from "lucide-react";
import { usdExact, formatDate, timeAgo } from "@/lib/demo-data";
import { agentQueryOptions } from "@/lib/queries";
import { useDeployAgent } from "@/hooks/use-deploy";
import { useAuth } from "@/hooks/use-auth";
import { useWalletModal } from "@/components/axion/wallet-modal";
import { PillButton, StatusBadge } from "@/components/axion/shared";

function AgentDetailContent({ agentId }: { agentId: string }) {
  const { data } = useSuspenseQuery(agentQueryOptions(agentId));
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { open } = useWalletModal();
  const deploy = useDeployAgent({
    onDeployed: (instanceId) => {
      queryClient.invalidateQueries({ queryKey: ["fleet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["my-agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      router.push(`/dashboard/fleet/${instanceId}`);
    },
  });
  const onDeploy = () => (isAuthenticated ? deploy.mutate({ agentId }) : open());
  const agent = data.agent;
  const instances = data.instances;

  if (!agent) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-24 text-center">
        <h1 className="text-[28px] font-medium text-gray-900">Agent not found</h1>
        <p className="mt-3 text-gray-600">No listing with id {agentId} exists.</p>
        <div className="mt-6 flex justify-center">
          <PillButton label="Back to marketplace" variant="dark" to="/marketplace" />
        </div>
      </section>
    );
  }

  const KindIcon = agent.kind === "physical" ? Cpu : Bot;

  const metrics: { label: string; value: string }[] = [
    { label: "Forks", value: String(agent.forkCount) },
    ...(agent.winRate != null ? [{ label: "Win rate", value: `${agent.winRate}%` }] : []),
    ...(agent.uptime != null ? [{ label: "Uptime", value: `${agent.uptime}%` }] : []),
    ...(agent.distanceNavigatedKm != null
      ? [{ label: "Distance", value: `${agent.distanceNavigatedKm.toLocaleString()} km` }]
      : []),
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-10 sm:pt-12 pb-16 sm:pb-20">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Marketplace
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
            <KindIcon size={24} className="text-[#ECE81A]" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-[28px] sm:text-[36px] font-medium text-gray-900"
                style={{ letterSpacing: "-0.02em" }}
              >
                {agent.name}
              </h1>
              {agent.verified ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-900 bg-[#ECE81A] rounded-full px-2.5 py-1">
                  <ShieldCheck size={13} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-700 bg-gray-200 rounded-full px-2.5 py-1">
                  Pending verification
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[13px] text-gray-500 font-mono flex-wrap">
              <span>{agent.id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="uppercase tracking-wider">{agent.category}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>v{agent.version}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">
                <Star size={12} className="fill-[#ECE81A] text-[#ECE81A]" />
                {agent.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-3 text-[13px] text-gray-600">
              by <span className="font-medium text-gray-900">{agent.creator}</span>{" "}
              <span className="font-mono text-gray-400">
                {agent.creatorAddress.slice(0, 6)}…{agent.creatorAddress.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-[18px] font-medium text-gray-900 mb-3">Overview</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">{agent.longDescription}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {agent.tags.map((t) => (
                <span
                  key={t}
                  className="text-[12px] text-gray-600 bg-[#F5F5F5] rounded-full px-3 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-[18px] font-medium text-gray-900 mb-5">Capabilities</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {agent.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#ECE81A] flex items-center justify-center shrink-0">
                    <Check size={12} className="text-gray-900" />
                  </span>
                  <span className="text-[14px] text-gray-700 leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-[18px] font-medium text-gray-900 mb-5">Version history</h2>
            <div className="flex flex-col">
              {agent.versions.map((v, i) => (
                <div
                  key={v.version}
                  className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 first:pt-0"
                >
                  <span
                    className={`text-[12px] font-mono font-medium rounded-full px-2.5 py-1 shrink-0 ${
                      i === 0 ? "bg-gray-900 text-white" : "bg-[#F5F5F5] text-gray-700"
                    }`}
                  >
                    v{v.version}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] text-gray-700">{v.notes}</p>
                    <p className="text-[12px] text-gray-400 mt-1">{formatDate(v.releasedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-[18px] font-medium text-gray-900 mb-5">Reviews</h2>
            <div className="flex flex-col gap-5">
              {agent.reviews.map((r, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-gray-900">{r.author}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          size={12}
                          className={
                            s < r.rating ? "fill-[#ECE81A] text-[#ECE81A]" : "text-gray-300"
                          }
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-600 leading-relaxed mt-2">{r.body}</p>
                  <p className="text-[12px] text-gray-400 mt-1.5">{timeAgo(r.at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-3 flex flex-col gap-6">
            <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-7">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[12px] text-gray-400">Fork price</div>
                  <div className="text-[32px] font-medium leading-none mt-1">
                    {usdExact(agent.price)}
                  </div>
                </div>
                <span className="text-[12px] text-gray-400">{agent.currency}</span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={onDeploy}
                  disabled={deploy.isPending}
                  className="group bg-[#ECE81A] hover:bg-[#d4ce15] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 inline-flex items-center justify-between transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Rocket size={15} /> {deploy.isPending ? "Deploying…" : "Deploy to fleet"}
                  </span>
                  <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <GitFork size={14} className="text-[#ECE81A]" />
                  </span>
                </button>
                <button
                  onClick={onDeploy}
                  disabled={deploy.isPending}
                  className="border border-white/15 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-medium rounded-full px-6 py-2.5 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <GitFork size={15} /> Fork manifest
                </button>
              </div>
              <p className="text-[12px] text-gray-400 leading-relaxed mt-4">
                {agent.royaltyPct}% perpetual royalty to {agent.creator}. Settles in{" "}
                {agent.currency} on Base via x402.
              </p>
              {deploy.isError && (
                <p className="text-[12px] text-red-400 leading-relaxed mt-3">
                  {deploy.error instanceof Error
                    ? deploy.error.message
                    : "Deploy failed. Please try again."}
                </p>
              )}
              {!isAuthenticated && (
                <p className="text-[12px] text-gray-400 leading-relaxed mt-3">
                  Connect your wallet to deploy — free while bots run in paper mode.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-7">
              <h3 className="text-[14px] font-medium text-gray-900 mb-4">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-[20px] font-medium text-gray-900">{m.value}</div>
                    <div className="text-[12px] text-gray-500">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {instances.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-7">
                <h3 className="text-[14px] font-medium text-gray-900 mb-4">Your deployments</h3>
                <div className="flex flex-col gap-2">
                  {instances.map((inst) => (
                    <Link
                      key={inst.id}
                      href={`/dashboard/fleet/${inst.id}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#F5F5F5] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-gray-900 truncate">
                          {inst.name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">{inst.id}</div>
                      </div>
                      <StatusBadge status={inst.status} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-400">Loading agent…</div>}>
      <AgentDetailContent agentId={agentId} />
    </Suspense>
  );
}
