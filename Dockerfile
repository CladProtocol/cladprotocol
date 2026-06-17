# syntax=docker/dockerfile:1
# Production image for the Clad Protocol Node server (TanStack Start / Nitro
# node-server) + the IRONCLAD cron worker + the agent fleet runner. Two stages:
# build with full deps, then ship only the self-contained `dist/` (Nitro bundles
# the server's deps; the cron → dist/cron.mjs, the agent runner → dist/agents.mjs)
# — no node_modules in the final image.

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Optional: bake the WalletConnect project id into the client bundle (build-time).
ARG VITE_WALLETCONNECT_PROJECT_ID=""
ENV VITE_WALLETCONNECT_PROJECT_ID=$VITE_WALLETCONNECT_PROJECT_ID

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build   # → dist/server (web) + dist/client + dist/cron.mjs + dist/agents.mjs

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# The whole build output is self-contained.
COPY --from=builder /app/dist ./dist

EXPOSE 3000
# Web server by default; the worker processes override this (see docker-compose.yml):
#   docker run … node dist/cron.mjs      # IRONCLAD attestation cron
#   docker run … node dist/agents.mjs    # agent fleet runner
CMD ["node", "dist/server/index.mjs"]
