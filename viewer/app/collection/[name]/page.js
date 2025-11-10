// viewer/app/collection/[name]/page.js
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';
import SearchForm from '@/components/SearchForm';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { getCollectionRecords, getCollectionCount } from '@/lib/chromadb-client';

// 動的レンダリングを強制（ビルド時にChromaDBに接続しない）
export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params, searchParams }) {
  const { name } = params;
  const page = parseInt(searchParams.page) || 1;
  const limit = parseInt(searchParams.limit) || 10;

  let data = null;
  let count = 0;
  let error = null;

  try {
    count = await getCollectionCount(name);
    data = await getCollectionRecords(name, { page, limit });
  } catch (e) {
    console.error(`Error fetching collection ${name}:`, e);
    error = e.message;
  }

  const navLinks = [{ href: '/', text: 'コレクション一覧に戻る' }];

  if (error) {
    return (
      <>
        <Header navLinks={navLinks} />
        <main>
          <section>
            <h2>エラーが発生しました</h2>
            <p>Failed to fetch collection {name}: {error}</p>
          </section>
        </main>
      </>
    );
  }

  const totalPages = Math.ceil(count / limit);

  return (
    <>
      <Header navLinks={navLinks} />
      <main>
        <section className="collection-details">
        <h2>コレクション: {name}</h2>
        <p>総レコード数: {count}</p>

        <SearchForm collectionName={name} />

        <div className="data-table">
          <h3>レコード一覧</h3>

          {data && data.ids.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>メタデータ</th>
                    <th>埋め込みベクトル</th>
                    <th>ドキュメント</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ids.map((id, i) => (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>
                        {data.metadatas?.[i] ? (
                          <CollapsibleDetails summary="メタデータを表示" className="metadatas">
                            {JSON.stringify(data.metadatas[i], null, 2)}
                          </CollapsibleDetails>
                        ) : '-'}
                      </td>
                      <td>
                        {data.embeddings?.[i] ? (
                          <CollapsibleDetails
                            summary={`ベクトルを表示 (${data.embeddings[i].length} 次元)`}
                            className="vector"
                          >
                            {JSON.stringify(data.embeddings[i])}
                          </CollapsibleDetails>
                        ) : '-'}
                      </td>
                      <td>
                        {data.documents?.[i] ? (
                          <CollapsibleDetails summary="ドキュメントを表示" defaultOpen className="documents">
                            {data.documents[i]}
                          </CollapsibleDetails>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                collectionName={name}
                currentPage={page}
                totalPages={totalPages}
                limit={limit}
              />
            </>
          ) : (
            <p>このコレクションにはレコードがありません。</p>
          )}
        </div>
      </section>
      </main>
    </>
  );
}
