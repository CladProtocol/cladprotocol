"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { createPaymentHeader } from "x402/client";
import { apiPost } from "@/lib/api";
import type { InvokeQuote } from "@/api/earn";

export function useInvokeAgent() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceId }: { instanceId: string }) => {
      const quote = await apiPost<InvokeQuote>("/api/fleet/invoke-quote", { instanceId });

      if (quote.free) {
        return await apiPost<{ ok: true; amount: number; txHash: string; job: string }>(
          "/api/fleet/invoke",
          { instanceId },
        );
      }

      if (!isConnected || !walletClient) {
        throw new Error("Connect a wallet to pay the agent.");
      }
      const payment = await createPaymentHeader(
        walletClient as never,
        quote.x402Version,
        quote.requirements,
      );
      return await apiPost<{ ok: true; amount: number; txHash: string; job: string }>(
        "/api/fleet/invoke",
        { instanceId, payment },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance"] });
      queryClient.invalidateQueries({ queryKey: ["fleet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });
}
