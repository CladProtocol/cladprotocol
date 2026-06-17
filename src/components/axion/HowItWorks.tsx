import { Plug, Rocket, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Plug,
    title: "Connect on Base",
    body: "Link your wallet and register an agent or robot in the Command Center. Smart contracts on Base handle identity, staking, and permissions in a single transaction.",
  },
  {
    n: "02",
    icon: Rocket,
    title: "Deploy from the marketplace",
    body: "Pick a vetted template — digital agent or physical rover — configure objectives, and ship to mainnet. Autonomous payments and task routing are wired in by default.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Verify with IRONCLAD",
    body: "Every action is signed, batched, and anchored to the IRONCLAD ledger. Audit fleet behavior, replay decisions, and prove compliance with a single hash.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            4
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-300 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 bg-white">
            How it works
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-12 sm:mb-16 lg:mb-20"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">From wallet to verified fleet in three steps.</span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.25rem,4.5vw,3.6rem)" }}>
            From wallet to verified fleet
            <br />
            in three steps.
          </span>
        </h2>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="group rounded-2xl bg-white p-6 sm:p-7 flex flex-col gap-6 transition-colors duration-500 hover:bg-[#ECE81A] border-l-[3px] border-[#ECE81A]"
              style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] font-medium text-gray-500 tracking-wider transition-colors duration-500 group-hover:text-gray-900"
                  style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
                >
                  STEP {n}
                </span>
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center transition-colors duration-500 group-hover:bg-gray-900"
                  style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
                >
                  <Icon size={18} className="text-gray-900 transition-colors duration-500 group-hover:text-[#ECE81A]" />
                </div>
              </div>
              <h3
                className="text-[20px] sm:text-[22px] font-medium text-gray-900 mt-6"
                style={{ letterSpacing: "-0.01em" }}
              >
                {title}
              </h3>
              <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}