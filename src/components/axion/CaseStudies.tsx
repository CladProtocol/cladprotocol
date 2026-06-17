import { Globe, Shield, HardDrive, Zap, Landmark, Link2, ChevronRight } from "lucide-react";

const PARTNERS = [
  {
    icon: Globe,
    name: "Base",
    description: "Native L2. All agents and fleets settle on Base — fast, cheap, and EVM-equivalent.",
  },
  {
    icon: HardDrive,
    name: "Arweave",
    description: "Permanent data layer. IRONCLAD ledger hashes are anchored for 200+ year provenance.",
  },
  {
    icon: Shield,
    name: "SAFE",
    description: "Smart account infrastructure. Every fleet wallet is a multi-sig with programmable recovery.",
  },
  {
    icon: Zap,
    name: "Etherscan",
    description: "Verified contracts. Every template is source-verified and auditable before deployment.",
  },
  {
    icon: Link2,
    name: "Optimism",
    description: "OP Stack lineage. Inherited sequencer decentralization roadmap and shared security model.",
  },
  {
    icon: Landmark,
    name: "Worldcoin",
    description: "Human verification. Sybil-resistant operator onboarding for high-value fleet roles.",
  },
];

export default function CaseStudies() {
  return (
    <section className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            2
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-300 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Integrations
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
          <span className="sm:hidden">Built on Base, backed by the best.</span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.25rem,4.5vw,3.6rem)" }}>
            Built on Base,
            <br />
            backed by the best.
          </span>
        </h2>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {PARTNERS.map(({ icon: Icon, name, description }) => (
            <a
              key={name}
              href="#"
              className="group flex flex-col gap-5 rounded-2xl bg-white p-6 sm:p-7 transition-colors duration-500 hover:bg-[#ECE81A] border-b-[3px] border-[#ECE81A]"
              style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center transition-colors duration-500 group-hover:bg-gray-900">
                  <Icon size={18} className="text-gray-900 transition-colors duration-500 group-hover:text-[#ECE81A]" />
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-400 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-gray-900"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[18px] sm:text-[20px] font-medium text-gray-900" style={{ letterSpacing: "-0.01em" }}>
                  {name}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors duration-500">
                  {description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
