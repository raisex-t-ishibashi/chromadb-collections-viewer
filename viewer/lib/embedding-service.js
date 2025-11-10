/**
 * LiteLLM Proxyを使って埋め込みベクトルを生成
 * @param {string} query - クエリテキスト
 * @returns {Promise<number[]>} 埋め込みベクトル
 */
export async function generateEmbedding(query) {
  const litellmUrl = process.env.LITELLM_PROXY_URL || 'http://localhost:4000';
  const model = process.env.LITELLM_MODEL || 'azure-text-embedding-ada-002';

  try {
    const response = await fetch(`${litellmUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [query]
      }),
      // キャッシュを無効化（毎回新しいリクエスト）
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LiteLLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}
