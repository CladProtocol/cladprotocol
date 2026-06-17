/**
 * Treasury payouts. Sends real USDC on Base from the treasury hot wallet for
 * operator withdrawals and creator royalties. Server-only.
 */
import type { Address, Hex } from "viem";
import { getChainConfig, getTreasurySigner, toAtomic, USDC_ABI } from "./chain";

/** Send `atomic` USDC units from the treasury to `to`; waits for confirmation. */
export async function sendUsdc(to: Address, atomic: bigint): Promise<Hex> {
  if (atomic <= 0n) throw new Error("Payout amount must be positive.");
  const signer = await getTreasurySigner();
  const { usdc, chain } = await getChainConfig();

  const hash = await signer.writeContract({
    address: usdc,
    abi: USDC_ABI,
    functionName: "transfer",
    args: [to, atomic],
    account: signer.account,
    chain,
  });

  const receipt = await signer.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("USDC payout transaction reverted.");
  return hash;
}

/** Convenience: send a whole-USDC amount from the treasury. */
export async function sendUsdcUsd(to: Address, usd: number): Promise<Hex> {
  return sendUsdc(to, toAtomic(usd));
}
