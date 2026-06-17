import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { createPaymentHeader } from "x402/client";
import { getInvokeQuote, invokeAgent } from "@/api/earn";

/**
 * "Customer pays the agent" flow (Path 3 — the earn bot). Quotes the per-call x402
 * fee; in live mode the connected wallet signs a USDC authorization the treasury
 * settles, then the agent records a real settlement and credits its owner. In paper
 * mode the call is free/synthetic.
 *
 * NOT owner-scoped — the caller is a customer, not the operator. In the demo the
 * operator plays the customer (their connected wallet pays). On success it
 * invalidates the dashboard surfaces so the new earning shows live.
 */
export function useInvokeAgent() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceId }: { instanceId: string }) => {
      const quote = await getInvokeQuote({ data: { instanceId } });

      // Paper mode: free/synthetic — no wallet signature needed.
      if (quote.free) {
        return await invokeAgent({ data: { instanceId } });
      }

      // Live mode: the connected wallet signs the x402 USDC authorization.
      if (!isConnected || !walletClient) {
        throw new Error("Connect a wallet to pay the agent.");
      }
      const payment = await createPaymentHeader(
        walletClient as never,
        quote.x402Version,
        quote.requirements,
      );
      return await invokeAgent({ data: { instanceId, payment } });
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
