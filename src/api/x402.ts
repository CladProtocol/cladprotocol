/**
 * x402 settlement (server side). We run the "exact" EVM scheme as a self-hosted
 * facilitator: the operator's wallet signs an EIP-3009 USDC authorization
 * (gasless for them), and the treasury signer verifies + submits it on-chain.
 * No external facilitator/CDP keys are required on testnet or mainnet.
 *
 * Server-only — imported only inside server-fn handlers.
 */
import { settle as x402Settle, verify as x402Verify } from "x402/facilitator";
import { decodePayment } from "x402/schemes";
import { getDefaultAsset } from "x402/shared";
import type { ConnectedClient, PaymentPayload, PaymentRequirements, Signer } from "x402/types";
import type { Address } from "viem";
import { getChainConfig, getPublicClient, getTreasuryAddress, getTreasurySigner } from "./chain";

export const X402_VERSION = 1;

/** Build the payment requirements for a deploy/fork fee (paid to the treasury). */
export async function buildDeployRequirements(args: {
  agentId: string;
  agentName: string;
  atomic: bigint;
  resource: string;
  payTo?: Address;
  description?: string;
}): Promise<PaymentRequirements> {
  const { network } = await getChainConfig();
  const asset = getDefaultAsset(network);
  const payTo = args.payTo ?? (await getTreasuryAddress());
  return {
    scheme: "exact",
    network,
    maxAmountRequired: args.atomic.toString(),
    resource: args.resource as `${string}://${string}`,
    description: args.description ?? `Deploy ${args.agentName} (${args.agentId})`,
    mimeType: "application/json",
    payTo,
    maxTimeoutSeconds: 300,
    asset: asset.address as string,
    extra: asset.eip712,
  };
}

/** Decode a base64 X-PAYMENT header into a payment payload. */
export function decodeX402Payment(header: string): PaymentPayload {
  return decodePayment(header);
}

/**
 * Verify a signed payment against freshly-rebuilt requirements (never trust the
 * client's), then settle it on-chain via the treasury signer. Returns the real
 * settlement tx hash.
 */
export async function verifyAndSettle(
  payment: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<{ txHash: string }> {
  const publicClient = (await getPublicClient()) as unknown as ConnectedClient;
  const signer = (await getTreasurySigner()) as unknown as Signer;

  const verification = await x402Verify(publicClient, payment, requirements);
  if (!verification.isValid) {
    throw new Error(`Payment rejected: ${verification.invalidReason ?? "invalid"}`);
  }

  const settlement = await x402Settle(signer, payment, requirements);
  if (!settlement.success) {
    throw new Error(`Settlement failed: ${settlement.errorReason ?? "unknown error"}`);
  }
  return { txHash: settlement.transaction };
}
