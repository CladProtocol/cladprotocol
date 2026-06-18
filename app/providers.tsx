"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletModalProvider } from "@/components/axion/wallet-modal";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletModalProvider>
          {children}
          <Toaster />
        </WalletModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
