'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm({ collectionName }) {
  const [query, setQuery] = useState('');
  const [k, setK] = useState(10);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ query, k: k.toString() });
    router.push(`/collection/${collectionName}/search?${params.toString()}`);
  };

  return (
    <div className="my-4">
      <details className="cursor-pointer">
        <summary className="text-blue-500 cursor-pointer list-none select-none">検索フォームを表示/非表示</summary>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="query" className="font-medium whitespace-nowrap min-w-fit">検索クエリ:</label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              className="w-1/2 px-2 py-2 border border-gray-200 rounded"
            />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="k" className="font-medium whitespace-nowrap min-w-fit">表示件数:</label>
            <input
              type="number"
              id="k"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              min="1"
              max="100"
              className="w-1/2 px-2 py-2 border border-gray-200 rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white border-none px-4 py-2 rounded cursor-pointer font-medium hover:bg-blue-600"
          >
            検索
          </button>
        </form>
      </details>
    </div>
  );
}
