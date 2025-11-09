# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# 必要なシステムライブラリをインストール
RUN apk add --no-cache libc6-compat

# 依存関係のインストール
COPY viewer/package.json viewer/package-lock.json ./
RUN npm ci --omit=dev

# Production stage
FROM node:24-alpine

WORKDIR /app

# 必要なシステムライブラリをインストール
RUN apk add --no-cache libc6-compat curl

# 非rootユーザーでの実行
RUN chown -R node:node /app
USER node

# ビルドステージから依存関係をコピー
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# アプリケーションコードをコピー
COPY --chown=node:node ./viewer ./

EXPOSE 3300

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3300/ || exit 1

CMD ["npm", "start"]