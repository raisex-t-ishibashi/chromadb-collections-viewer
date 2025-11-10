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
        <main className="max-w-[90%] mx-auto my-8 px-4">
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">エラーが発生しました</h2>
            <p>Failed to fetch collections: {error}</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-[90%] mx-auto my-8 px-4">
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">コレクション一覧</h2>

          {collections.length > 0 ? (
            <ul className="list-none">
              {collections.map(collection => (
                <li key={collection.id} className="mb-2">
                  <Link href={`/collection/${collection.name}`} className="block p-3 bg-gray-100 rounded hover:bg-gray-200 text-gray-800 no-underline transition-colors">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-purple-600 font-medium">テナント: {collection.tenant}</span>
                        <span className="text-gray-500 font-bold">›</span>
                        <span className="text-blue-600 font-medium">データベース: {collection.database}</span>
                        <span className="text-gray-500 font-bold">›</span>
                        <span className="text-blue-500 font-semibold">コレクション: {collection.name}</span>
                      </div>
                      <div className="text-sm text-gray-500 font-mono">ID: {collection.id}</div>
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
