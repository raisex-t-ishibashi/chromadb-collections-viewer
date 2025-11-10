// viewer/app/page.js
import Link from 'next/link';
import Header from '@/components/Header';
import { getCollections } from '@/lib/chromadb-client';

// 動的レンダリングを強制（ビルド時にChromaDBに接続しない）
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let collections = [];
  let error = null;

  try {
    collections = await getCollections();
  } catch (e) {
    console.error('Error fetching collections:', e);
    error = e.message;
  }

  if (error) {
    return (
      <>
        <Header />
        <main>
          <section>
            <h2>エラーが発生しました</h2>
            <p>Failed to fetch collections: {error}</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="collections">
          <h2>コレクション一覧</h2>

          {collections.length > 0 ? (
            <ul className="collection-list">
              {collections.map(collection => (
                <li key={collection.id}>
                  <Link href={`/collection/${collection.name}`}>
                    <div className="collection-item">
                      <div className="collection-hierarchy">
                        <span className="tenant">テナント: {collection.tenant}</span>
                        <span className="separator">›</span>
                        <span className="database">データベース: {collection.database}</span>
                        <span className="separator">›</span>
                        <span className="collection-name">コレクション: {collection.name}</span>
                      </div>
                      <div className="collection-id">ID: {collection.id}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>コレクションがありません。ChromaDBにデータを追加してください。</p>
          )}
        </section>
      </main>
    </>
  );
}
