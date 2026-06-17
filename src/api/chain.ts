/**
 * On-chain layer (Base). Server-only: builds viem clients from env, exposes the
 * treasury signer, USDC helpers, and amount conversion.
 *
 * Money is stored/displayed in whole USDC; on-chain amounts are integer atomic
 * units (6 dp). Convert at the boundary with `toAtomic`/`fromAtomic` so the DB
 * and UI stay unchanged while settlements/payouts use exact integers.
 */
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  getAddress,
  http,
  parseAbi,
  publicActions,
} from "viem";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { getServerEnv, requireServerEnv } from "./env";

export type NetworkName = "base-sepolia" | "base";

/** Native USDC (Circle) per network. */
const USDC_ADDRESS: Record<NetworkName, Address> = {
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

const CHAINS = { "base-sepolia": baseSepolia, base } as const;

export const USDC_DECIMALS = 6;
export const USDC_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

/** whole USDC → integer atomic units (exact for 6-dp amounts). */
export const toAtomic = (usd: number): bigint =>
  BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
/** integer atomic units → whole USDC (for display/record). */
export const fromAtomic = (atomic: bigint): number => Number(atomic) / 10 ** USDC_DECIMALS;

export async function getNetwork(): Promise<NetworkName> {
  const n = await getServerEnv("NETWORK");
  // Defaults to Base mainnet (real USDC). Set NETWORK=base-sepolia for testnet.
  return n === "base-sepolia" ? "base-sepolia" : "base";
}

export async function getChainConfig() {
  const network = await getNetwork();
  return { network, chain: CHAINS[network], usdc: USDC_ADDRESS[network] };
}

function normalizePrivateKey(raw: string): Hex {
  const hex = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "TREASURY_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string (64 hex chars). " +
        "Generate one with: cast wallet new",
    );
  }
  return hex as Hex;
}

/** Read-only Base client (BASE_RPC_URL, or the chain's default RPC). */
export async function getPublicClient() {
  const { chain } = await getChainConfig();
  const rpc = await getServerEnv("BASE_RPC_URL");
  return createPublicClient({ chain, transport: http(rpc) });
}

/**
 * The treasury local account (signs txs, EIP-191 messages, x402 authorizations,
 * and ANS-104 Arweave data items). Exposes `.publicKey` used for Arweave owners.
 */
export async function getTreasuryAccount() {
  const pk = await requireServerEnv("TREASURY_PRIVATE_KEY");
  return privateKeyToAccount(normalizePrivateKey(pk));
}

/**
 * Treasury signer: a wallet client extended with public actions so it can both
 * sign/send (USDC payouts, x402 settlement) and read (simulate, wait for
 * receipts). Doubles as the x402 `Signer` and the self-hosted facilitator.
 */
export async function getTreasurySigner() {
  const account = await getTreasuryAccount();
  const { chain } = await getChainConfig();
  const rpc = await getServerEnv("BASE_RPC_URL");
  return createWalletClient({ account, chain, transport: http(rpc) }).extend(publicActions);
}

/** The treasury address (payTo for settlements/fork fees). */
export async function getTreasuryAddress(): Promise<Address> {
  const signer = await getTreasurySigner();
  return signer.account.address;
}

/**
 * Verify a USDC transfer happened on-chain: the tx succeeded and emitted a
 * Transfer from the USDC contract (optionally matching recipient/min amount).
 * Returns the matched atomic value. Throws if no matching transfer is found.
 */
export async function verifyUsdcTransfer(
  txHash: Hex,
  opts: { to?: Address; minAtomic?: bigint } = {},
): Promise<{ value: bigint; from: Address; to: Address }> {
  const client = await getPublicClient();
  const { usdc } = await getChainConfig();
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") throw new Error("Transaction did not succeed on-chain.");

  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(usdc)) continue;
    try {
      const decoded = decodeEventLog({ abi: USDC_ABI, data: log.data, topics: log.topics });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args as { from: Address; to: Address; value: bigint };
      if (opts.to && getAddress(to) !== getAddress(opts.to)) continue;
      if (opts.minAtomic !== undefined && value < opts.minAtomic) continue;
      return { value, from, to };
    } catch {
      // Not a Transfer event we can decode — skip.
    }
  }
  throw new Error("No matching USDC Transfer found in the transaction.");
}
