import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const projectId =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    : undefined;

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
