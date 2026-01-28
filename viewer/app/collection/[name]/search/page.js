import Header from '@/components/Header';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { searchCollection } from '@/lib/chromadb-client';
import { generateEmbedding } from '@/lib/embedding-service';

// 動的レンダリングを強制（ビルド時にChromaDBに接続しない）
export const dynamic = 'force-dynamic';

export default async function SearchResultsPage({ params, searchParams }) {
  const { name } = await params;
  const { query, k } = await searchParams;
  const numResults = parseInt(k) || 10;

  let results = null;
  let error = null;

  try {
    const embedding = await generateEmbedding(query);
    results = await searchCollection(name, [embedding], numResults);
  } catch (e) {
    console.error(`Error searching collection ${name}:`, e);
    error = e.message;
  }

  const navLinks = [
    { href: '/', text: 'コレクション一覧に戻る' },
    { href: `/collection/${name}`, text: `コレクション: ${name} に戻る` }
  ];

  if (error) {
    return (
      <>
        <Header navLinks={navLinks} />
        <main className="max-w-[90%] mx-auto my-8 px-4">
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">エラーが発生しました</h2>
            <p>Failed to search collection {name}: {error}</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header navLinks={navLinks} />
      <main className="max-w-[90%] mx-auto my-8 px-4">
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">検索クエリ: &quot;{query}&quot;</h2>

          {results && results.ids[0].length > 0 ? (
            <div className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mt-4 table-fixed">
                  <thead>
                    <tr>
                      <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[15%]">ID</th>
                      <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[15%]">スコア</th>
                      <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[20%]">メタデータ</th>
                      <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[50%]">ドキュメント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.ids[0].map((id, i) => (
                      <tr key={id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">{id}</td>
                        <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
                          {results.distances?.[0]?.[i] !== undefined
                            ? results.distances[0][i].toFixed(4)
                            : '-'}
                        </td>
                        <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
                          {results.metadatas?.[0]?.[i] ? (
                            <CollapsibleDetails summary="メタデータを表示" className="metadatas">
                              {JSON.stringify(results.metadatas[0][i], null, 2)}
                            </CollapsibleDetails>
                          ) : '-'}
                        </td>
                        <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
                          {results.documents?.[0]?.[i] ? (
                            <CollapsibleDetails summary="ドキュメントを表示" defaultOpen className="documents">
                              {results.documents[0][i]}
                            </CollapsibleDetails>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>検索結果はありませんでした。</p>
          )}
        </section>
      </main>
    </>
  );
}
