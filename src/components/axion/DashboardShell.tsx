"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  CreditCard,
  LayoutGrid,
  Plus,
  ScrollText,
  Settings,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { EASE } from "./shared";
import ConnectWallet from "./ConnectWallet";
import { shortAddress, useAuth } from "@/hooks/use-auth";

type NavItem = { label: string; to: string; icon: LucideIcon; exact?: boolean };

const NAV: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutGrid, exact: true },
  { label: "Fleet", to: "/dashboard/fleet", icon: Bot },
  { label: "IRONCLAD ledger", to: "/dashboard/ledger", icon: ScrollText },
  { label: "Payments", to: "/dashboard/payments", icon: CreditCard },
  { label: "My agents", to: "/dashboard/agents", icon: ShoppingBag },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export default function DashboardShell({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const { user, address } = useAuth();
  const { chain } = useAccount();
  const pathname = usePathname();
  const operatorAddress = user?.address ?? address ?? "";
  const operatorName =
    user?.displayName || user?.ens || (operatorAddress ? shortAddress(operatorAddress) : "Operator");
  const avatarChar = (user?.displayName || user?.ens || "O").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#EFEFEF" }}>
      <div className="mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <nav
          className="bg-white rounded-full flex items-center justify-between gap-2"
          style={{ padding: 5 }}
        >
          <Link href="/" className="flex items-center gap-3 pl-1 min-w-0">
            <img src="/clad-logo.png" alt="Clad Protocol" className="h-7 sm:h-8 w-auto" />
            <span className="text-[14px] font-medium text-gray-900 hidden sm:inline">
              {title ?? "Command Center"}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 pr-1">
            <span className="hidden md:flex items-center gap-1.5 text-[13px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ECE81A]" />
              Connected to {chain?.name ?? "Base"}
            </span>
            <Link
              href="/marketplace"
              className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-4 pr-2 py-2 inline-flex items-center gap-2"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Deploy agent</span>
              <span
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowUpRight size={12} className="text-gray-900" />
              </span>
            </Link>
            <ConnectWallet variant="dark" hideDashboardLink />
          </div>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-2 sm:px-3 pb-10 sm:pb-16">
        <div className="flex flex-col lg:flex-row gap-3">
          <aside className="lg:w-[248px] lg:shrink-0">
            <div className="bg-white rounded-2xl p-3 lg:sticky lg:top-3">
              <div className="hidden lg:flex items-center gap-3 px-2 pt-2 pb-4">
                <div className="w-9 h-9 rounded-full bg-[#ECE81A] flex items-center justify-center text-[13px] font-semibold text-gray-900">
                  {avatarChar}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">
                    {operatorName}
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono truncate">
                    {operatorAddress ? shortAddress(operatorAddress) : ""}
                  </div>
                </div>
              </div>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.to
                    : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      className={
                        isActive
                          ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium whitespace-nowrap bg-gray-900 text-white"
                          : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] whitespace-nowrap text-gray-600 hover:bg-[#F5F5F5] hover:text-gray-900 transition-colors"
                      }
                    >
                      <Icon size={16} className="shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="hidden lg:block mt-3 pt-3 border-t border-gray-100">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
                >
                  ← Back to site
                </Link>
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}
