import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bot, ChevronRight, Cpu, Search, ShieldCheck, Star } from "lucide-react";
import { AGENT_CATEGORIES, usdExact, type DemoAgent } from "@/lib/demo-data";
import { agentsQueryOptions } from "@/lib/queries";
import { AccentRule, SectionTag } from "@/components/axion/shared";

export const Route = createFileRoute("/marketplace/")({
  component: MarketplacePage,
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQueryOptions()),
  head: () => ({
    meta: [
      { title: "Marketplace — Clad Protocol" },
      {
        name: "description",
        content:
          "Browse verified AI agents and physical robotics templates on Clad Protocol. Fork, deploy, and settle on Base.",
      },
    ],
  }),
});

type KindFilter = "all" | "digital" | "physical";

function AgentCard({ agent }: { agent: DemoAgent }) {
  const KindIcon = agent.kind === "physical" ? Cpu : Bot;
  // Robotics is a roadmap preview; the paper DeFi bots (MEV/Arbitrage/Yield) run in
  // simulation. The earn/task agents are the real path and carry no caveat badge.
  const preview = agent.kind === "physical";
  const simulation = !preview && ["MEV", "Arbitrage", "Yield"].includes(agent.category);
  return (
    <Link
      to="/marketplace/$agentId"
      params={{ agentId: agent.id }}
      className="group flex flex-col gap-5 rounded-2xl bg-white p-6 sm:p-7 border-b-[3px] border-[#ECE81A] transition-transform duration-500 hover:-translate-y-1"
      style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center transition-colors duration-500 group-hover:bg-gray-900">
          <KindIcon size={18} className="text-gray-900 transition-colors duration-500 group-hover:text-[#ECE81A]" />
        </div>
        <div className="flex items-center gap-2">
          {preview ? (
            <span className="inline-flex items-center text-[11px] font-medium text-white bg-gray-900 rounded-full px-2 py-1">
              Preview
            </span>
          ) : (
            <>
              {simulation && (
                <span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-1">
                  Simulation
                </span>
              )}
              {agent.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-[#F5F5F5] rounded-full px-2 py-1">
                  <ShieldCheck size={12} className="text-gray-900" />
                  Verified
                </span>
              )}
            </>
          )}
          <ChevronRight size={16} className="text-gray-400 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-gray-900" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[18px] sm:text-[20px] font-medium text-gray-900" style={{ letterSpacing: "-0.01em" }}>
            {agent.name}
          </h3>
          <span className="flex items-center gap-1 text-[12px] text-gray-600 shrink-0">
            <Star size={12} className="fill-[#ECE81A] text-[#ECE81A]" />
            {agent.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
          <span>{agent.id}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="uppercase tracking-wider">{agent.category}</span>
        </div>
        <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed mt-1">{agent.description}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
        <div>
          <div className="text-[15px] font-medium text-gray-900">{usdExact(agent.price)}</div>
          <div className="text-[11px] text-gray-500">per fork · {agent.royaltyPct}% royalty</div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-medium text-gray-900">{agent.forkCount}</div>
          <div className="text-[11px] text-gray-500">forks</div>
        </div>
      </div>
    </Link>
  );
}

function MarketplacePage() {
  const { data: agents } = useSuspenseQuery(agentsQueryOptions());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [kind, setKind] = useState<KindFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (category !== "All" && a.category !== category) return false;
      if (q && !`${a.name} ${a.description} ${a.category} ${a.id}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, search, category, kind]);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-10">
        <AccentRule className="mb-8" />
        <SectionTag label="Marketplace" />
        <h1
          className="mt-5 font-medium text-gray-900 max-w-4xl"
          style={{ fontSize: "clamp(2rem,5vw,3.8rem)", lineHeight: 1.06, letterSpacing: "-0.03em" }}
        >
          Autonomous agents and robotics, <span className="italic font-light text-gray-500">verified</span> and ready to deploy.
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] sm:text-[17px] text-gray-600 leading-relaxed">
          Fork a vetted template, configure objectives, and ship to Base in minutes. Every listing is source-verified and
          anchored to the IRONCLAD ledger.
        </p>
      </section>

      {/* Filter bar */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents, categories, IDs…"
              className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#ECE81A]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white rounded-full p-1 self-start">
            {(["all", "digital", "physical"] as KindFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`text-[13px] font-medium rounded-full px-4 py-2 capitalize transition-colors ${
                  kind === k ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {k === "all" ? "All types" : k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {AGENT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[13px] rounded-full px-3.5 py-1.5 border transition-colors ${
                category === c
                  ? "bg-[#ECE81A] border-[#ECE81A] text-gray-900 font-medium"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[13px] text-gray-500">
            {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-[15px] text-gray-600">No agents match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setKind("all");
              }}
              className="mt-4 text-[13px] font-medium text-gray-900 underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
