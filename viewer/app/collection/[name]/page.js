import Header from '@/components/Header';
import Pagination from '@/components/Pagination';
import SearchForm from '@/components/SearchForm';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { getCollectionRecords, getCollectionCount } from '@/lib/chromadb-client';

// 動的レンダリングを強制（ビルド時にChromaDBに接続しない）
export const dynamic = 'force-dynamic';

export default async function CollectionPage({ params, searchParams }) {
  const { name } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page) || 1;
  const limit = parseInt(resolvedSearchParams.limit) || 10;

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
        <main className="max-w-[90%] mx-auto my-8 px-4">
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">エラーが発生しました</h2>
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
      <main className="max-w-[90%] mx-auto my-8 px-4">
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-blue-500 mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">コレクション: {name}</h2>
          <p className="mb-4">総レコード数: {count}</p>

          <SearchForm collectionName={name} />

          <div className="mt-6">
            <h3 className="text-lg font-semibold my-6">レコード一覧</h3>

            {data && data.ids.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mt-4 table-fixed">
                    <thead>
                      <tr>
                        <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[15%]">ID</th>
                        <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[20%]">メタデータ</th>
                        <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[15%]">埋め込みベクトル</th>
                        <th className="p-3 text-left border border-gray-200 bg-gray-100 font-semibold w-[50%]">ドキュメント</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ids.map((id, i) => (
                        <tr key={id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">{id}</td>
                          <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
                            {data.metadatas?.[i] ? (
                              <CollapsibleDetails summary="メタデータを表示" className="metadatas">
                                {JSON.stringify(data.metadatas[i], null, 2)}
                              </CollapsibleDetails>
                            ) : '-'}
                          </td>
                          <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
                            {data.embeddings?.[i] ? (
                              <CollapsibleDetails
                                summary={`ベクトルを表示 (${data.embeddings[i].length} 次元)`}
                                className="vector"
                              >
                                {JSON.stringify(data.embeddings[i])}
                              </CollapsibleDetails>
                            ) : '-'}
                          </td>
                          <td className="p-3 border border-gray-200 break-words overflow-wrap-anywhere">
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
                </div>

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
