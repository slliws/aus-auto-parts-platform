# Backend Dockerfile — Production-ready multi-stage build
# TypeScript compiled clean (0 errors as of 2026-05-26)

# 1) Builder stage
FROM node:20 AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Prisma engine env vars must be set before npm ci so engines download during install
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-debian-openssl-3.0.x

# Install all dependencies (including dev, required for tsc + prisma generate)
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript (0 errors — fails hard if errors are introduced)
RUN npx tsc --skipLibCheck

# 2) Production runtime stage
FROM node:20 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy compiled application + Prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/v1/health || exit 1

# Regenerate Prisma client at startup (ensures engine compatibility with runtime node),
# then start compiled server
CMD ["sh", "-c", "npx prisma generate && node dist/server.js"]
