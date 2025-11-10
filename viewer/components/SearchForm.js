// viewer/components/SearchForm.js
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
    <div className="search-form">
      <details>
        <summary>検索フォームを表示/非表示</summary>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="query">検索クエリ:</label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="k">表示件数:</label>
            <input
              type="number"
              id="k"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <button type="submit">検索</button>
        </form>
      </details>
    </div>
  );
}
