"use client";

import Link from "next/link";
import { ChevronDown, LayoutGrid, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortAddress, useAuth } from "@/hooks/use-auth";
import { useWalletModal } from "./wallet-modal";
import { PillButton } from "./shared";

type Props = {
  variant?: "dark" | "accent" | "outline";
  redirect?: boolean;
  hideDashboardLink?: boolean;
  className?: string;
};

export default function ConnectWallet({
  variant = "dark",
  redirect = true,
  hideDashboardLink = false,
  className = "",
}: Props) {
  const { isAuthenticated, user, signOut } = useAuth();
  const { open } = useWalletModal();

  if (!isAuthenticated || !user) {
    return (
      <PillButton
        label="Connect wallet"
        variant={variant}
        onClick={() => open({ redirect })}
        className={className}
      />
    );
  }

  const label = user.displayName || user.ens || shortAddress(user.address);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`group inline-flex items-center gap-2 rounded-full bg-gray-900 py-2 pl-4 pr-3 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#ECE81A]" />
        <span className="font-mono">{label}</span>
        <ChevronDown size={14} className="opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-[12px] text-gray-500">
          {shortAddress(user.address)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!hideDashboardLink && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <LayoutGrid size={15} /> Command Center
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => void signOut()} className="cursor-pointer text-red-600">
          <LogOut size={15} /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
