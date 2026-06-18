"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Send, XIcon } from "lucide-react";
import ConnectWallet from "./ConnectWallet";

export type PublicNavKey = "marketplace" | "legion" | "docs" | "dashboard";

const NAV: { key: PublicNavKey; label: string; to: string }[] = [
  { key: "marketplace", label: "Marketplace", to: "/marketplace" },
  { key: "legion", label: "Legion", to: "/legion" },
  { key: "docs", label: "Documentation", to: "/docs" },
  { key: "dashboard", label: "Command Center", to: "/dashboard" },
];

export default function PublicHeader({ active }: { active?: PublicNavKey }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-30 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
      <nav
        className="bg-white rounded-full flex items-center justify-between gap-2"
        style={{ padding: 5 }}
      >
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-3 pl-1 shrink-0">
            <img src="/clad-logo.png" alt="Clad Protocol" className="h-7 sm:h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {NAV.map((l) => (
              <Link
                key={l.key}
                href={l.to}
                className={`text-[14px] transition-opacity hover:opacity-70 ${
                  active === l.key ? "text-gray-900 font-medium" : "text-gray-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 lg:gap-4 pr-1">
          <a
            href="https://t.me/cladprotocol"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Telegram"
          >
            <Send size={14} className="text-gray-700" />
          </a>
          <ConnectWallet variant="dark" />
        </div>

        <button
          onClick={() => setOpen(true)}
          className="md:hidden bg-gray-900 text-white rounded-full p-2.5"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 right-0 bottom-0 mx-3 mb-3 bg-white rounded-2xl p-6"
            style={{ animation: "slideUp 0.4s cubic-bezier(0.32,0.72,0,1)" }}
          >
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={() => setOpen(false)}
                className="bg-gray-900 text-white rounded-full p-2.5"
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {NAV.map((l) => (
                <Link
                  key={l.key}
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="text-[28px] leading-[32px] font-medium text-gray-900"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <ConnectWallet variant="accent" className="w-full justify-between !pl-6" />
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
