import { useMutation } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { createPaymentHeader } from "x402/client";
import { deployAgent, getDeployQuote } from "@/api/agents";

/**
 * Deploy/fork flow with real x402 settlement. Quotes the fee; for paid agents
 * the connected wallet signs an EIP-3009 USDC authorization (gasless), which the
 * server settles via the treasury before minting the instance. Free agents skip
 * straight to the mint. Returns the new instance id.
 */
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
      const quote = await getDeployQuote({ data: { agentId } });

      // Free deploy (paper mode): only the SIWE session is needed — no wallet
      // signing — so don't require an active wagmi wallet client here.
      if (quote.free) {
        const res = await deployAgent({ data: { agentId, objective } });
        return res.instanceId;
      }

      // Paid deploy: the connected wallet must sign the x402 USDC authorization.
      if (!isConnected || !walletClient) {
        throw new Error("Connect your wallet to deploy.");
      }
      const payment = await createPaymentHeader(
        walletClient as never,
        quote.x402Version,
        quote.requirements,
      );
      const res = await deployAgent({ data: { agentId, objective, payment } });
      return res.instanceId;
    },
    onSuccess: (instanceId) => opts?.onDeployed?.(instanceId),
  });
}
