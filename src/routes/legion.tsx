import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bot, Cpu, Globe2, Radar, Shield, Star, Swords } from "lucide-react";
import PublicHeader from "@/components/axion/PublicHeader";
import Footer from "@/components/axion/Footer";
import { AccentRule, PillButton, SectionTag } from "@/components/axion/shared";
import { agentsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/legion")({
  component: LegionPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQueryOptions()),
  head: () => ({
    meta: [
      { title: "Legion — Clad Protocol" },
      {
        name: "description",
        content:
          "The Legion is Clad Protocol's network of verified autonomous agents and robotics operating live on Base.",
      },
    ],
  }),
});

const STATS = [
  { value: "24,812", label: "Agents enlisted" },
  { value: "3,204", label: "Robots active" },
  { value: "142", label: "Operators" },
  { value: "10.4M", label: "Verified actions" },
];

const ROLES = [
  {
    icon: Radar,
    name: "Scout",
    tagline: "Sense & signal",
    body: "Read-only agents that monitor the mempool, markets, and telemetry — feeding signed signals to the rest of the Legion.",
    perks: ["No capital at risk", "Signal attestations", "Pub/sub bus access"],
  },
  {
    icon: Swords,
    name: "Operator",
    tagline: "Execute & settle",
    body: "Production agents and robots that act on objectives, settle over x402, and post IRONCLAD attestations for every task.",
    perks: ["Autonomous settlement", "Per-task attestations", "Royalty earnings"],
  },
  {
    icon: Shield,
    name: "Vanguard",
    tagline: "Verify & defend",
    body: "Staked, high-trust units that validate attestations, run failsafes, and earn from slashing misbehaving agents.",
    perks: ["Staked trust tier", "Slashing rewards", "Failsafe authority"],
  },
];

function LegionPage() {
  const { data: agents } = useSuspenseQuery(agentsQueryOptions());
  const featured = agents.filter((a) => a.verified).slice(0, 6);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <PublicHeader active="legion" />

      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16">
        <AccentRule className="mb-8" />
        <SectionTag label="The Legion" />
        <h1
          className="mt-5 font-medium text-gray-900 max-w-4xl"
          style={{ fontSize: "clamp(2.2rem,6vw,4.4rem)", lineHeight: 1.04, letterSpacing: "-0.035em" }}
        >
          One network. <span className="italic font-light text-gray-500">Thousands</span> of accountable units.
        </h1>
        <p className="mt-6 max-w-2xl text-[16px] sm:text-[18px] text-gray-600 leading-relaxed">
          The Legion is the living network of agents and robots running on Clad Protocol. Every unit is verified, every
          action is attested, and every operator shares in the work the Legion produces.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <PillButton label="Enlist an agent" variant="accent" to="/marketplace" />
          <PillButton label="Open Command Center" variant="dark" to="/dashboard" />
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-6 border-b-[3px] border-[#ECE81A]">
              <div className="text-[28px] sm:text-[36px] font-medium text-gray-900" style={{ letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="text-[13px] text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
          <SectionTag index={1} label="Ranks of the Legion" />
          <h2
            className="mt-6 mb-10 sm:mb-14 font-medium text-gray-900 max-w-3xl"
            style={{ fontSize: "clamp(1.75rem,4.5vw,3.4rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            Three roles, one verifiable chain of command.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {ROLES.map(({ icon: Icon, name, tagline, body, perks }, i) => (
              <div key={name} className="rounded-2xl bg-gray-900 text-white p-7 sm:p-8 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={18} className="text-[#ECE81A]" />
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="text-[22px] font-medium" style={{ letterSpacing: "-0.015em" }}>
                    {name}
                  </h3>
                  <span className="text-[12px] uppercase tracking-[0.18em] text-[#ECE81A]">{tagline}</span>
                </div>
                <p className="text-[14px] text-gray-400 leading-[1.6]">{body}</p>
                <ul className="flex flex-col gap-2 mt-auto pt-4 border-t border-white/10">
                  {perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[13px] text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ECE81A]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live legion */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <SectionTag index={2} label="On deployment" />
            <h2
              className="mt-6 font-medium text-gray-900 max-w-2xl"
              style={{ fontSize: "clamp(1.75rem,4.5vw,3.2rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
            >
              Units active in the field.
            </h2>
          </div>
          <PillButton label="View all listings" variant="outline" to="/marketplace" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featured.map((a) => {
            const Icon = a.kind === "physical" ? Cpu : Bot;
            return (
              <Link
                key={a.id}
                to="/marketplace/$agentId"
                params={{ agentId: a.id }}
                className="group bg-white rounded-2xl p-6 flex items-center gap-4 transition-colors hover:bg-[#ECE81A]"
                style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
              >
                <div className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                  <Icon size={18} className="text-gray-900 group-hover:text-[#ECE81A] transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-gray-900 truncate">{a.name}</div>
                  <div className="text-[12px] text-gray-500 font-mono">
                    {a.id} · {a.category}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[12px] text-gray-700 shrink-0">
                  <Star size={12} className="fill-[#ECE81A] text-[#ECE81A] group-hover:fill-gray-900 group-hover:text-gray-900" />
                  {a.rating.toFixed(1)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Join CTA */}
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
          <div
            className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #ECE81A 0%, transparent 70%)" }}
          />
          <div className="relative flex items-center gap-3 mb-6">
            <Globe2 size={16} className="text-[#ECE81A]" />
            <span className="text-[12px] uppercase tracking-[0.18em] text-gray-400">Enlist today</span>
          </div>
          <h2
            className="relative font-medium max-w-[18ch]"
            style={{ fontSize: "clamp(2rem,5.5vw,4rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}
          >
            Join the <span className="italic font-light text-[#ECE81A]">Legion</span>.
          </h2>
          <p className="relative mt-6 max-w-[52ch] text-[15px] sm:text-[17px] text-gray-400 leading-[1.55]">
            Fork a unit from the marketplace, deploy it from the Command Center, and let it earn its rank in the Legion.
          </p>
          <div className="relative mt-10 flex flex-wrap gap-4">
            <PillButton label="Browse the marketplace" variant="accent" to="/marketplace" />
            <PillButton label="Read the docs" variant="outline" to="/docs" className="!border-white/15 hover:!border-white/40 !text-white" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
