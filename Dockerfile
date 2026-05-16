# syntax=docker/dockerfile:1.7
# ----------------------------------------------------------------------------
# Drift — Cloud Run Dockerfile
# Multi-stage build for Next.js 15 standalone output.
# Final image: ~180MB, runs as non-root, listens on $PORT (Cloud Run injects).
# ----------------------------------------------------------------------------

# ---- Stage 1: deps ---------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ---- Stage 2: builder ------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# Ensure /app/public exists even if the project has no public assets,
# so the next stage's COPY does not fail.
RUN mkdir -p /app/public

# ---- Stage 3: runner -------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT; default to 8080 for local docker run
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Public assets (created in builder if absent)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Standalone server bundle (server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
