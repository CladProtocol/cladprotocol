"use client";

import { useMutation } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { createPaymentHeader } from "x402/client";
import { apiPost } from "@/lib/api";
import type { DeployQuote } from "@/api/agents";

export function useDeployAgent(opts?: { onDeployed?: (instanceId: string) => void }) {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      objective,
    }: {
      agentId: string;
      objective?: string;
    }): Promise<string> => {
      const quote = await apiPost<DeployQuote>("/api/agents/deploy-quote", { agentId });

      if (quote.free) {
        const res = await apiPost<{ instanceId: string }>("/api/agents/deploy", {
          agentId,
          objective,
        });
        return res.instanceId;
      }

      if (!isConnected || !walletClient) {
        throw new Error("Connect your wallet to deploy.");
      }
      const payment = await createPaymentHeader(
        walletClient as never,
        quote.x402Version,
        quote.requirements,
      );
      const res = await apiPost<{ instanceId: string }>("/api/agents/deploy", {
        agentId,
        objective,
        payment,
      });
      return res.instanceId;
    },
    onSuccess: (instanceId) => opts?.onDeployed?.(instanceId),
  });
}
