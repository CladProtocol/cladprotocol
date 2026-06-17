import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Bot, Cpu, GitFork, Star } from "lucide-react";
import { usd } from "@/lib/demo-data";
import { myAgentsQueryOptions } from "@/lib/queries";
import { PillButton, SectionTag } from "@/components/axion/shared";

export const Route = createFileRoute("/dashboard/agents")({
  component: MyAgentsPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(myAgentsQueryOptions()),
  head: () => ({ meta: [{ title: "My agents — Clad Command Center" }] }),
});

function MyAgentsPage() {
  // Operator deployments grouped by the marketplace template they run.
  const { data } = useSuspenseQuery(myAgentsQueryOptions());
  const deployed = data.deployed;
  const totalDeployments = deployed.reduce((s, d) => s + d.instances.length, 0);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <SectionTag label="My agents" />
          <h1 className="mt-4 font-medium text-gray-900" style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}>
            {deployed.length} templates · {totalDeployments} deployments
          </h1>
          <p className="mt-3 text-[14px] text-gray-600 max-w-xl leading-relaxed">
            Marketplace templates you've forked and deployed. Each shares a perpetual royalty back to its creator.
          </p>
        </div>
        <PillButton label="Fork a new agent" variant="dark" to="/marketplace" />
      </div>

      {/* Deployed templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {deployed.map(({ agent, instances, earnings, actions }) => {
          const Icon = agent.kind === "physical" ? Cpu : Bot;
          return (
            <div key={agent.id} className="bg-white rounded-2xl p-5 sm:p-7 border-b-[3px] border-[#ECE81A]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                    <Icon size={18} className="text-gray-900" />
                  </div>
                  <div>
                    <Link
                      to="/marketplace/$agentId"
                      params={{ agentId: agent.id }}
                      className="text-[17px] font-medium text-gray-900 hover:underline underline-offset-2"
                    >
                      {agent.name}
                    </Link>
                    <div className="text-[12px] text-gray-500 font-mono mt-0.5">
                      {agent.id} · v{agent.version}
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[12px] text-gray-600">
                  <Star size={12} className="fill-[#ECE81A] text-[#ECE81A]" />
                  {agent.rating.toFixed(1)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
                <div>
                  <div className="text-[18px] font-medium text-gray-900">{instances.length}</div>
                  <div className="text-[11px] text-gray-500">Instances</div>
                </div>
                <div>
                  <div className="text-[18px] font-medium text-gray-900">{actions.toLocaleString()}</div>
                  <div className="text-[11px] text-gray-500">Actions</div>
                </div>
                <div>
                  <div className="text-[18px] font-medium text-gray-900">{usd(earnings)}</div>
                  <div className="text-[11px] text-gray-500">Earnings</div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                {instances.map((inst) => (
                  <Link
                    key={inst.id}
                    to="/dashboard/fleet/$instanceId"
                    params={{ instanceId: inst.id }}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#F5F5F5] transition-colors"
                  >
                    <span className="text-[13px] text-gray-700 truncate">{inst.name}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-gray-400">{inst.id}</span>
                      <ArrowUpRight size={13} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-[12px] text-gray-500">
                <GitFork size={12} />
                {agent.royaltyPct}% royalty to {agent.creator}
              </div>
            </div>
          );
        })}
      </div>

      {/* Discover more */}
      <div className="bg-gray-900 text-white rounded-2xl p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="text-[20px] font-medium">Scale your fleet</h2>
          <p className="mt-2 text-[14px] text-gray-400 max-w-md leading-relaxed">
            {data.totalAgents} verified templates are available in the marketplace, from MEV agents to inspection robots.
          </p>
        </div>
        <PillButton label="Browse marketplace" variant="accent" to="/marketplace" />
      </div>
    </div>
  );
}
