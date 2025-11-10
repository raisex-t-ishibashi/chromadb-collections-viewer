// viewer/lib/chromadb-client.js
import { ChromaClient } from 'chromadb';

const client = new ChromaClient({
  host: process.env.CHROMADB_HOST || 'localhost',
  port: parseInt(process.env.CHROMADB_PORT || '8000')
});

/**
 * コレクション一覧を取得
 */
export async function getCollections() {
  const collections = await client.listCollections();
  return collections.map(collection => ({
    name: collection.name,
    id: collection.id,
    tenant: collection.tenant || 'default_tenant',
    database: collection.database || 'default_database'
  }));
}

/**
 * コレクションを取得
 */
export async function getCollection(name) {
  return await client.getCollection({ name });
}

/**
 * コレクションのレコード数を取得
 */
export async function getCollectionCount(name) {
  const collection = await getCollection(name);
  return await collection.count();
}

/**
 * コレクションのレコードを取得（ページネーション付き）
 */
export async function getCollectionRecords(name, { page = 1, limit = 10 }) {
  const collection = await getCollection(name);
  const offset = (page - 1) * limit;

  return await collection.get({
    limit,
    offset,
    include: ['embeddings', 'metadatas', 'documents']
  });
}

/**
 * コレクションをベクトル検索
 */
export async function searchCollection(name, queryEmbeddings, nResults = 10) {
  const collection = await getCollection(name);
  return await collection.query({
    queryEmbeddings,
    nResults
  });
}
