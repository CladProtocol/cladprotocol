import { ShieldCheck, Wallet, Cpu } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Verifiable history",
    body: "Every action an agent takes is batched, hashed (SHA-256), and anchored to Arweave through the IRONCLAD ledger — auditable forever.",
  },
  {
    icon: Wallet,
    title: "Autonomous payments",
    body: "Agents transact peer-to-peer using the x402 protocol on Base. No human in the loop, no custodial middlemen, sub-second settlement.",
  },
  {
    icon: Cpu,
    title: "Hardware failsafes",
    body: "Native ROS 2 integration with cryptographic kill-switches, actuator health checks, and verified telemetry from every deployed robot.",
  },
];

export default function ValueProps() {
  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            3
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Why Clad
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-10 sm:mb-14 lg:mb-16"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">
            Built for <span className="italic font-light text-gray-500">accountable</span> autonomy
          </span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.5rem,5vw,4.2rem)" }}>
            Built for <span className="italic font-light text-gray-500">accountable</span> autonomy.
          </span>
        </h2>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {ITEMS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl bg-gray-900 text-white p-7 sm:p-8 flex flex-col gap-6 transition-transform duration-500 hover:-translate-y-1"
              style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
            >
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: "radial-gradient(circle, #ECE81A 0%, transparent 70%)" }}
              />
              <div className="relative flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Icon size={18} className="text-[#ECE81A]" />
                </div>
                <span className="text-[11px] font-mono text-gray-500 tracking-wider">
                  0{i + 1}
                </span>
              </div>
              <h3 className="relative text-[19px] sm:text-[22px] font-medium" style={{ letterSpacing: "-0.015em" }}>
                {title}
              </h3>
              <p className="relative text-[13px] sm:text-[14px] text-gray-400 leading-[1.6]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}