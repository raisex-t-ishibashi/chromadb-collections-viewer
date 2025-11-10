/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 環境変数をクライアントに公開しない（サーバーサイドのみ使用）
  // ChromaDB接続情報はサーバーサイドでのみ使用
};

module.exports = nextConfig;
