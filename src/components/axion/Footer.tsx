import { ArrowRight, Send } from "lucide-react";
import Link from "next/link";

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

type FooterLink = { label: string; href: string };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Protocol",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Legion", href: "/legion" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    heading: "Command Center",
    links: [
      { label: "Overview", href: "/dashboard" },
      { label: "Fleet", href: "/dashboard/fleet" },
      { label: "IRONCLAD ledger", href: "/dashboard/ledger" },
      { label: "Payments", href: "/dashboard/payments" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Introduction", href: "/docs/introduction" },
      { label: "x402 payments", href: "/docs/x402" },
      { label: "IRONCLAD", href: "/docs/ironclad" },
      { label: "ROS 2 bridge", href: "/docs/ros2" },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  return (
    <Link href={link.href} className="text-[14px] text-gray-900 hover:opacity-70 transition-opacity">
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-8 sm:pb-10">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="h-0.5 w-16 bg-[#ECE81A] mb-10 sm:mb-14 lg:mb-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 lg:gap-8 pb-12 sm:pb-16 lg:pb-20">
          <div className="flex flex-col gap-6 max-w-md">
            <div className="flex items-center gap-3">
              <img src="/clad-logo.png" alt="Clad Protocol" className="h-8 w-auto" />
              <span className="text-[15px] font-medium text-gray-900">Clad Protocol</span>
            </div>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              The premier marketplace for AI agents and physical robotics on Base. Autonomous execution, ironclad verification.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/cladprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Telegram"
              >
                <Send size={15} className="text-white" />
              </a>
              <a
                href="https://x.com/cladprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="X"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
            <Link
              href="/marketplace"
              className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-3 self-start"
            >
              <span>Explore marketplace</span>
              <span
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={12} className="text-gray-900" />
              </span>
            </Link>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="text-[12px] uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ECE81A]" />
                {col.heading}
              </span>
              {col.links.map((l) => (
                <FooterLinkItem key={l.label} link={l} />
              ))}
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[12px] sm:text-[13px] text-gray-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ECE81A]" />
            © {new Date().getFullYear()} Clad Protocol. Deployed on Base mainnet.
          </span>
        </div>
      </div>
    </footer>
  );
}
