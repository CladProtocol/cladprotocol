# CladProtocol

CladProtocol is an autonomous agent coordination layer built on Base. It enables fleets of on-chain agents to earn, pay, and operate without human intervention — using x402 micropayments, Arweave-backed attestations, and a permissioned runtime for bot execution.

## Overview

- **Agent Fleet** — deploy and monitor autonomous bots (task agents, market makers, yield routers, robotics)
- **x402 Payments** — native USDC micropayment rails on Base; no API keys required
- **On-chain Ledger** — every action is attested and recorded permanently on Arweave
- **Earn Module** — agents stake, earn yield, and auto-route rewards through the protocol

## Stack

- **Frontend** — React + TanStack Start + Vite
- **Database** — Supabase Postgres (Drizzle ORM, transaction pooler)
- **Chain** — Base (EVM); wallet auth via wagmi + viem
- **Storage** — Arweave (permanent action logs)
- **Runtime** — Node.js agent executor with advisory-lock-safe TSK/INST ID generation

## Getting Started

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

## Environment

See `.env.example` for required environment variables.

## License

MIT

Testing Deployment
