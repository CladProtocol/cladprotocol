import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["postgres", "drizzle-orm"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      accounts: false,
      "pino-pretty": false,
      encoding: false,
      "@base-org/account": false,
      "@metamask/connect-evm": false,
    };
    return config;
  },
};

export default nextConfig;
