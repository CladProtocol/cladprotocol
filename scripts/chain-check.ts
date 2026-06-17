/**
 * Base / x402 preflight. Read-only — moves no funds. Confirms the on-chain config
 * is actually wired before you click through the payment flow:
 *   - BASE_RPC_URL reachable (prints the chain + latest block)
 *   - USDC contract responds for the selected network
 *   - TREASURY_PRIVATE_KEY resolves to an address, with its ETH (gas) + USDC float
 *
 * Run with:  bun scripts/chain-check.ts   (or `npm run chain:check`)
 * Bun auto-loads `.env`, so NETWORK / BASE_RPC_URL / TREASURY_PRIVATE_KEY are picked up.
 */
import { formatEther } from "viem";
import {
  fromAtomic,
  getChainConfig,
  getPublicClient,
  getTreasuryAccount,
  USDC_ABI,
} from "../src/api/chain";
import { getServerEnv } from "../src/api/env";

async function main() {
  const { network, chain, usdc } = await getChainConfig();
  const rpc = (await getServerEnv("BASE_RPC_URL")) ?? "(viem default public RPC)";
  console.info(`\n● network        ${network}  (chainId ${chain.id})`);
  console.info(`● rpc            ${rpc}`);
  console.info(`● usdc           ${usdc}`);

  // 1) RPC reachable?
  const client = await getPublicClient();
  let block: bigint;
  try {
    block = await client.getBlockNumber();
    console.info(`✓ rpc reachable  latest block #${block}`);
  } catch (err) {
    console.error(`✗ rpc unreachable — check BASE_RPC_URL:`, (err as Error).message);
    process.exit(1);
  }

  // 2) USDC contract sane on this network?
  try {
    const decimals = (await client.readContract({
      address: usdc,
      abi: [{ type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }],
      functionName: "decimals",
    })) as number;
    console.info(`✓ usdc responds  decimals=${decimals}`);
  } catch (err) {
    console.error(`✗ usdc read failed (wrong network/RPC?):`, (err as Error).message);
  }

  // 3) Treasury wallet + balances.
  let treasury: `0x${string}`;
  try {
    treasury = (await getTreasuryAccount()).address;
  } catch (err) {
    console.warn(`\n! TREASURY_PRIVATE_KEY not set — skipping treasury balances. (${(err as Error).message})`);
    console.info(`\nRPC + USDC OK. Set TREASURY_PRIVATE_KEY to check the hot-wallet float.\n`);
    return;
  }

  const [eth, usdcBal] = await Promise.all([
    client.getBalance({ address: treasury }),
    client.readContract({ address: usdc, abi: USDC_ABI, functionName: "balanceOf", args: [treasury] }) as Promise<bigint>,
  ]);
  console.info(`\n● treasury       ${treasury}`);
  console.info(`  ETH (gas)      ${formatEther(eth)}`);
  console.info(`  USDC (float)   ${fromAtomic(usdcBal)}`);

  if (eth === 0n) console.warn(`  ⚠ 0 ETH — treasury can't pay gas for settlement/payouts/royalties.`);
  if (usdcBal === 0n) console.warn(`  ⚠ 0 USDC — withdrawals/royalties will fail until funded.`);
  if (eth > 0n && usdcBal > 0n) console.info(`\n✓ treasury funded — Base payment path is ready.\n`);
  else console.info(`\nFund the treasury (ETH for gas + USDC float) to complete the wiring.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[chain:check] failed:", err);
    process.exit(1);
  });
