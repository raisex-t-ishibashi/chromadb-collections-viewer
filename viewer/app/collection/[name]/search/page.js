// viewer/app/collection/[name]/search/page.js
import Header from '@/components/Header';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { searchCollection } from '@/lib/chromadb-client';
import { generateEmbedding } from '@/lib/embedding-service';

// 動的レンダリングを強制（ビルド時にChromaDBに接続しない）
export const dynamic = 'force-dynamic';

export default async function SearchResultsPage({ params, searchParams }) {
  const { name } = params;
  const { query, k } = searchParams;
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
        <main>
          <section>
            <h2>エラーが発生しました</h2>
            <p>Failed to search collection {name}: {error}</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header navLinks={navLinks} />
      <main>
        <section className="search-results">
          <h2>検索クエリ: &quot;{query}&quot;</h2>

          {results && results.ids[0].length > 0 ? (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>スコア</th>
                    <th>メタデータ</th>
                    <th>ドキュメント</th>
                  </tr>
                </thead>
                <tbody>
                  {results.ids[0].map((id, i) => (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>
                        {results.distances?.[0]?.[i] !== undefined
                          ? results.distances[0][i].toFixed(4)
                          : '-'}
                      </td>
                      <td>
                        {results.metadatas?.[0]?.[i] ? (
                          <CollapsibleDetails summary="メタデータを表示" className="metadatas">
                            {JSON.stringify(results.metadatas[0][i], null, 2)}
                          </CollapsibleDetails>
                        ) : '-'}
                      </td>
                      <td>
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
          ) : (
            <p>検索結果はありませんでした。</p>
          )}
        </section>
      </main>
    </>
  );
}
