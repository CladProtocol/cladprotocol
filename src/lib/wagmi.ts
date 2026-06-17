import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

// Wallet-connection config. Chain is Base mainnet (real USDC); Base Sepolia is
// kept for an easy testnet fallback. WalletConnect is optional: it only loads
// when VITE_WALLETCONNECT_PROJECT_ID is set; injected + Coinbase work without
// any project id. `ssr: true` + cookieStorage keeps SSR hydration clean.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Clad Protocol" }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
