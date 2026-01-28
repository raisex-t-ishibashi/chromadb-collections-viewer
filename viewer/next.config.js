/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 環境変数をクライアントに公開しない（サーバーサイドのみ使用）
  // ChromaDB接続情報はサーバーサイドでのみ使用

  // ChromaDB関連パッケージはサーバーサイドのみで使用するため、
  // Turbopackのバンドル対象から除外する
  serverExternalPackages: [
    'chromadb',
    '@chroma-core/default-embed',
    '@chroma-core/ai-embeddings-common',
  ],
};

module.exports = nextConfig;
