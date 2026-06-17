import { useEffect, useState } from "react";
import { ArrowRight, Clock, Menu, Send, Wallet, XIcon } from "lucide-react";
import { ChromaFlow, FilmGrain, FlutedGlass, Shader, Swirl } from "shaders/react";
import { Link, useNavigate } from "@tanstack/react-router";
import cladLogo from "@/assets/clad-logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useWalletModal } from "./wallet-modal";

const NAV_LINKS = [
  { label: "Marketplace", to: "/marketplace" },
  { label: "Legion", to: "/legion" },
  { label: "Documentation", to: "/docs" },
  { label: "Command Center", to: "/dashboard" },
] as const;

function useLondonTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const t = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
      setTime(t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const PartnerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
  </svg>
);

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

function RollText({ label }: { label: string }) {
  return (
    <span className="flex flex-col overflow-hidden h-[20px] leading-[20px]">
      <span
        className="transition-transform duration-500 group-hover:-translate-y-1/2"
        style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
      >
        <span className="block h-[20px]">{label}</span>
        <span className="block h-[20px]">{label}</span>
      </span>
    </span>
  );
}

export default function Hero() {
  const time = useLondonTime();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { open } = useWalletModal();
  const onConnectClick = () =>
    isAuthenticated ? navigate({ to: "/dashboard" }) : open({ redirect: true });

  return (
    <section
      className="relative flex flex-col min-h-[640px] sm:min-h-[720px] lg:min-h-screen"
      style={{ backgroundColor: "#EFEFEF" }}
    >
      {/* Shader stack */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <Shader style={{ width: "100%", height: "100%" }}>
          <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
          <ChromaFlow
            baseColor="#ffffff"
            downColor="#ECE81A"
            leftColor="#ECE81A"
            rightColor="#ECE81A"
            upColor="#ECE81A"
            momentum={13}
            radius={3.5}
          />
          <FlutedGlass
            aberration={0.61}
            angle={31}
            frequency={8}
            highlight={0.12}
            highlightSoftness={0}
            lightAngle={-90}
            refraction={4}
            shape="rounded"
            softness={1}
            speed={0.15}
          />
          <FilmGrain strength={0.05} />
        </Shader>
      </div>

      {/* Nav */}
      <div className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <nav className="bg-white rounded-full flex items-center justify-between gap-2" style={{ padding: 5 }}>
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <img src={cladLogo} alt="Clad Protocol" className="h-7 sm:h-8 w-auto" />
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {NAV_LINKS.map((l) => (
                <Link key={l.label} to={l.to} className="text-[14px] text-gray-900 hover:opacity-70 transition-opacity">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-5 pr-1">
            <a
              href="https://t.me/cladprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Telegram"
            >
              <Send size={14} className="text-gray-700" />
            </a>
            <a
              href="https://x.com/cladprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="X"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-[13px] text-gray-600">
              <Clock size={14} />
              {time} in London
            </span>
            <Link
              to="/marketplace"
              className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-4 lg:pl-5 pr-2 py-2 flex items-center gap-2 lg:gap-3 shrink-0"
            >
              <RollText label="Explore marketplace" />
              <span
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={12} className="text-gray-900" />
              </span>
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden bg-gray-900 text-white rounded-full p-2.5"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute left-0 right-0 bottom-0 mx-3 mb-3 bg-white rounded-2xl p-6 translate-y-0 transition-transform duration-500"
            style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)", animation: "slideUp 0.5s cubic-bezier(0.32,0.72,0,1)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] text-gray-600 border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1.5">
                <Clock size={14} /> {time} in London
              </span>
              <button onClick={() => setMenuOpen(false)} className="bg-gray-900 text-white rounded-full p-2.5">
                <XIcon size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-[28px] leading-[32px] font-medium text-gray-900"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <Link
              to="/marketplace"
              onClick={() => setMenuOpen(false)}
              className="group w-full bg-[#ECE81A] text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2 flex items-center justify-between"
            >
              <RollText label="Explore marketplace" />
              <span
                className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={14} className="text-[#ECE81A]" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Hero content */}
      <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
        <h1
          className="font-medium text-gray-900"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">
            <span className="italic font-light text-gray-500">Autonomous</span> execution and ironclad verification for AI agents and physical robotics on Base.
          </span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.5rem,5vw,4.2rem)" }}>
            <span className="italic font-light text-gray-500">Autonomous</span> execution.
            <br />
            <span className="italic font-light text-gray-500">Ironclad</span> verification for AI agents
            <br />
            and robotics on Base.
          </span>
        </h1>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
          <Link
            to="/marketplace"
            className="group bg-[#ECE81A] hover:bg-[#d4ce15] text-gray-900 text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 flex items-center gap-3 transition-colors"
          >
            <RollText label="Explore marketplace" />
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
              style={{ transitionTimingFunction: EASE }}
            >
              <ArrowRight size={14} className="text-[#ECE81A]" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onConnectClick}
            className="group bg-gray-900 hover:bg-gray-800 text-white text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 flex items-center gap-3 transition-colors"
          >
            <Wallet size={15} className="shrink-0" />
            <RollText label={isAuthenticated ? "Open Command Center" : "Connect wallet"} />
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
              style={{ transitionTimingFunction: EASE }}
            >
              <ArrowRight size={14} className="text-gray-900" />
            </span>
          </button>

          <div
            className="bg-white flex items-center gap-2 px-3 py-2 transition-shadow"
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
          >
            <PartnerIcon className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#ECE81A]" />
            <span className="text-[13px] sm:text-[14px] font-medium text-gray-900">Verified by IRONCLAD</span>
            <span className="text-[10px] sm:text-[11px] bg-gray-900 text-white px-1.5 sm:px-2 py-0.5 rounded">Ledger</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}