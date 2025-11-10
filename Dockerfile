# Dockerfile
# Dependencies stage
FROM node:24-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Next.jsプロジェクトの依存関係をインストール
COPY viewer/package.json viewer/package-lock.json ./
RUN npm ci

# Builder stage
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY viewer/ ./

# Next.jsビルド（standaloneモード）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standaloneビルドの出力をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3300

ENV PORT=3300
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3300/ || exit 1

CMD ["node", "server.js"]
