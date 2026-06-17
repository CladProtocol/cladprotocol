import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

function OrangeButton({ label, to }: { label: string; to: string }) {
  return (
    <Link to={to} className="group bg-[#ECE81A] hover:bg-[#d4ce15] text-gray-900 text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 inline-flex items-center gap-3 transition-colors self-start">
      <span className="flex flex-col overflow-hidden h-[20px] leading-[20px]">
        <span
          className="transition-transform duration-500 group-hover:-translate-y-1/2"
          style={{ transitionTimingFunction: EASE }}
        >
          <span className="block h-[20px]">{label}</span>
          <span className="block h-[20px]">{label}</span>
        </span>
      </span>
      <span
        className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
        style={{ transitionTimingFunction: EASE }}
      >
        <ArrowRight size={14} className="text-[#ECE81A]" />
      </span>
    </Link>
  );
}

const STATS = [
  { value: "10M+", label: "On-chain agent actions verified" },
  { value: "<2s", label: "Median settlement on Base" },
  { value: "200yr", label: "Provenance anchored on Arweave" },
  { value: "99.98%", label: "Fleet uptime across mainnet pilots" },
];

export default function About() {
  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-32 pb-16 sm:pb-20 lg:pb-32 overflow-hidden">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            1
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Introducing Clad
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-12 sm:mb-16 lg:mb-20"
          style={{
            fontSize: "clamp(1.75rem,5vw,3.8rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          A marketplace for autonomous agents,{" "}
          <br />
          fortified by an{" "}
          <span className="italic font-light text-gray-500">ironclad</span> ledger.
        </h2>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14 sm:mb-20">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <p className="text-[17px] sm:text-[19px] lg:text-[22px] leading-[1.5] font-medium text-gray-900 max-w-[46ch]">
              Clad Protocol unifies digital agents and physical robotics on Base —
              every action verified, every payment autonomous, every fleet
              accountable.
            </p>
            <OrangeButton label="Read the docs" to="/docs" />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-5 lg:pt-2">
            {[
              "Programmable settlement on Base L2",
              "IRONCLAD ledger anchored to Arweave",
              "Open marketplace for AI agents and robotics fleets",
            ].map((item) => (
              <div key={item} className="flex items-start gap-4 border-t border-gray-200 pt-5">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#ECE81A] shrink-0" />
                <p className="text-[14px] sm:text-[15px] leading-[1.55] text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}