# Express to Next.js 移行計画

## プロジェクト概要

ChromaDB Collections ViewerをExpressからNext.js (App Router) に移行し、機能とUIデザインを維持したまま、モダンなReactベースのアプリケーションに再構築する。

## 移行方針

- **段階的移行:** 既存のExpressコードを`old_viewer/`にリネームして保持し、参照可能にする
- **新規Next.jsアプリケーション:** `viewer/`ディレクトリに新しいNext.jsアプリを構築
- **Next.js App Router**を採用（最新のベストプラクティス）
- **Server Components**をデフォルトで使用（SSR/SSG）
- **Client Components**は必要な部分のみ（検索フォームなど）
- **Fetch API**を使用（axiosは使わない）
- **既存のCSSデザイン**を完全に保持
- **機能の完全な互換性**を維持
- **Dockerサポート**を継続
- **移行完了後:** `old_viewer/`を削除

---

## タスク一覧

### フェーズ0: 既存コードの保護

#### 0.1 既存viewerディレクトリのリネーム
- [x] `viewer/`を`old_viewer/`にリネーム
- [x] Gitでコミット（保護のため）
- [x] `.gitignore`に`old_viewer/`を追加（オプション、移行完了まで追跡する場合は不要）

**コマンド例:**
```bash
mv viewer old_viewer
git add .
git commit -m "Rename viewer to old_viewer for Next.js migration"
```

---

### フェーズ1: Next.jsプロジェクトのセットアップ

#### 1.1 新しいviewerディレクトリの作成とNext.jsのセットアップ
- [x] `viewer/`ディレクトリを作成
- [x] Next.js 15+をインストール（App Routerサポート）
- [x] プロジェクト構造を作成:
  ```
  viewer/
  ├── app/                    # Next.js App Router
  │   ├── layout.js          # ルートレイアウト
  │   ├── page.js            # トップページ（コレクション一覧）
  │   ├── globals.css        # グローバルCSS
  │   └── collection/
  │       └── [name]/
  │           ├── page.js    # コレクション詳細
  │           └── search/
  │               └── page.js # 検索結果
  ├── components/             # Reactコンポーネント
  ├── lib/                    # ユーティリティ（ChromaDBクライアント等）
  ├── public/                 # 静的ファイル
  ├── next.config.js         # Next.js設定
  ├── package.json           # 依存関係
  └── .gitignore             # Next.js用
  ```

#### 1.2 package.jsonの作成
- [x] 必要な依存関係をインストール:
  - `next` (v15+)
  - `react` (v18+)
  - `react-dom` (v18+)
  - `chromadb` (v3.1.1)
  - `@chroma-core/default-embed` (v0.1.8)
- [x] scriptsを設定:
  - `dev`: `next dev -p 3300`（開発サーバー、ポート3300）
  - `build`: `next build`
  - `start`: `next start -p 3300`（本番サーバー）
  - `lint`: `next lint`

**package.json例:**
```json
{
  "name": "chromadb-viewer-nextjs",
  "version": "2.0.0",
  "description": "ChromaDB Collections Viewer built with Next.js",
  "scripts": {
    "dev": "next dev -p 3300",
    "build": "next build",
    "start": "next start -p 3300",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "chromadb": "^3.1.1",
    "@chroma-core/default-embed": "^0.1.8"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 1.3 環境変数の設定
- [x] `viewer/.env.local`を作成
- [x] 既存の`old_viewer`から環境変数を移行:
  - `CHROMADB_HOST`
  - `CHROMADB_PORT`
  - `LITELLM_PROXY_URL`
  - `LITELLM_MODEL`
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_API_BASE`
  - `AZURE_OPENAI_API_VERSION`
- [x] ルートの`.env.example`を更新（Next.js用に）

**viewer/.env.local例:**
```env
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
LITELLM_PROXY_URL=http://localhost:4000
LITELLM_MODEL=azure-text-embedding-ada-002
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_BASE=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

#### 1.4 .gitignoreの更新
- [x] `viewer/.gitignore`を作成
- [x] Next.js用のエントリを追加:
  ```
  # next.js
  .next/
  out/

  # environment
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local

  # dependencies
  node_modules/

  # misc
  .DS_Store
  *.log
  ```

---

### フェーズ2: ChromaDBクライアントとユーティリティの実装

#### 2.1 ChromaDBクライアントのラッパー作成
**ファイル:** `viewer/lib/chromadb-client.js`

- [ ] ChromaDBクライアントのシングルトンインスタンスを作成
- [ ] 環境変数からホスト/ポートを読み込み
- [ ] エラーハンドリングを実装
- [ ] Server Components用のAPI関数を実装:
  - `getCollections()` - コレクション一覧取得
  - `getCollection(name)` - コレクション取得
  - `getCollectionRecords(name, { page, limit })` - ページネーション付きレコード取得
  - `getCollectionCount(name)` - レコード数取得
  - `searchCollection(name, embeddings, nResults)` - ベクトル検索

**実装例:**
```javascript
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
```

#### 2.2 埋め込み生成サービスの実装（Fetch API使用）
**ファイル:** `viewer/lib/embedding-service.js`

- [ ] LiteLLM Proxyへのリクエスト処理（Fetch API使用）
- [ ] エラーハンドリングとリトライロジック
- [ ] `generateEmbedding(query)` 関数を実装

**実装例:**
```javascript
// viewer/lib/embedding-service.js

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
```

---

### フェーズ3: UIコンポーネントの実装

#### 3.1 グローバルCSSの移行
**ファイル:** `viewer/app/globals.css`

- [ ] `old_viewer/public/css/style.css`の内容を`viewer/app/globals.css`にコピー
- [ ] CSS変数とスタイルを完全に保持
- [ ] レスポンシブデザインを維持

**実装:**
```bash
# 既存のCSSをコピー
cp old_viewer/public/css/style.css viewer/app/globals.css
```

#### 3.2 ルートレイアウトコンポーネント
**ファイル:** `viewer/app/layout.js`

- [ ] HTMLの基本構造を実装
- [ ] `<head>`メタデータの設定
- [ ] グローバルCSSの読み込み
- [ ] ヘッダーを組み込み
- [ ] `old_viewer/views/*.ejs`のヘッダー部分を参照

**実装例:**
```javascript
// viewer/app/layout.js
import './globals.css';

export const metadata = {
  title: 'ChromaDB Collections Viewer',
  description: 'Browse ChromaDB collections and records',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header>
          <h1>ChromaDB Collections Viewer</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

#### 3.3 共通コンポーネントの作成

##### 3.3.1 Navigationコンポーネント
**ファイル:** `viewer/components/Navigation.js`

- [ ] ナビゲーションリンクを実装
- [ ] Server Componentとして実装

**実装例:**
```javascript
// viewer/components/Navigation.js
import Link from 'next/link';

export default function Navigation({ links }) {
  return (
    <nav>
      {links.map((link, index) => (
        <Link key={index} href={link.href}>
          {link.text}
        </Link>
      ))}
    </nav>
  );
}
```

##### 3.3.2 Paginationコンポーネント
**ファイル:** `viewer/components/Pagination.js`

- [ ] ページネーションUIを実装
- [ ] 前へ/次へボタン
- [ ] ページ番号リスト
- [ ] Server Componentとして実装（Linkコンポーネント使用）
- [ ] `old_viewer/views/collection.ejs`のページネーション部分を参照

**実装例:**
```javascript
// viewer/components/Pagination.js
import Link from 'next/link';

export default function Pagination({ collectionName, currentPage, totalPages, limit }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      {currentPage > 1 && (
        <Link href={`/collection/${collectionName}?page=${currentPage - 1}&limit=${limit}`}>
          &laquo; 前へ
        </Link>
      )}

      {pages.map(page => (
        page === currentPage ? (
          <span key={page} className="current-page">{page}</span>
        ) : (
          <Link key={page} href={`/collection/${collectionName}?page=${page}&limit=${limit}`}>
            {page}
          </Link>
        )
      ))}

      {currentPage < totalPages && (
        <Link href={`/collection/${collectionName}?page=${currentPage + 1}&limit=${limit}`}>
          次へ &raquo;
        </Link>
      )}
    </div>
  );
}
```

##### 3.3.3 CollapsibleDetailsコンポーネント
**ファイル:** `viewer/components/CollapsibleDetails.js`

- [ ] `<details>`要素のラッパー
- [ ] メタデータ、ベクトル、ドキュメント表示用
- [ ] Server Componentとして実装（HTML標準の`<details>`を使用）
- [ ] `old_viewer/views/collection.ejs`のdetails部分を参照

**実装例:**
```javascript
// viewer/components/CollapsibleDetails.js
export default function CollapsibleDetails({
  summary,
  children,
  defaultOpen = false,
  className = ''
}) {
  return (
    <details open={defaultOpen}>
      <summary>{summary}</summary>
      <pre className={className}>{children}</pre>
    </details>
  );
}
```

---

### フェーズ4: ページの実装

#### 4.1 トップページ（コレクション一覧）
**ファイル:** `viewer/app/page.js`

- [ ] Server Componentとして実装
- [ ] `getCollections()`を呼び出してコレクション一覧を取得
- [ ] 階層構造（テナント → データベース → コレクション）を表示
- [ ] 各コレクションへのリンク
- [ ] エラーハンドリング
- [ ] `old_viewer/views/index.ejs`を参照してUIを完全に再現

**実装例:**
```javascript
// viewer/app/page.js
import Link from 'next/link';
import { getCollections } from '@/lib/chromadb-client';

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
      <section>
        <h2>エラーが発生しました</h2>
        <p>Failed to fetch collections: {error}</p>
      </section>
    );
  }

  return (
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
  );
}
```

#### 4.2 コレクション詳細ページ
**ファイル:** `viewer/app/collection/[name]/page.js`

- [ ] Server Componentとして実装
- [ ] URLパラメータから`name`を取得
- [ ] クエリパラメータから`page`と`limit`を取得
- [ ] `getCollectionRecords(name, { page, limit })`でレコード取得
- [ ] `getCollectionCount(name)`で総数取得
- [ ] レコードをテーブル形式で表示
- [ ] Paginationコンポーネントを使用
- [ ] SearchFormコンポーネントを組み込み
- [ ] Navigationコンポーネントを使用
- [ ] `old_viewer/views/collection.ejs`を参照してUIを完全に再現

**実装例:**
```javascript
// viewer/app/collection/[name]/page.js
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Pagination from '@/components/Pagination';
import SearchForm from '@/components/SearchForm';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { getCollectionRecords, getCollectionCount } from '@/lib/chromadb-client';

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

  if (error) {
    return (
      <>
        <Navigation links={[{ href: '/', text: 'コレクション一覧に戻る' }]} />
        <section>
          <h2>エラーが発生しました</h2>
          <p>Failed to fetch collection {name}: {error}</p>
        </section>
      </>
    );
  }

  const totalPages = Math.ceil(count / limit);

  return (
    <>
      <Navigation links={[{ href: '/', text: 'コレクション一覧に戻る' }]} />

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
    </>
  );
}
```

#### 4.3 検索フォームコンポーネント
**ファイル:** `viewer/components/SearchForm.js`

- [ ] Client Componentとして実装
- [ ] フォーム送信処理
- [ ] `useRouter`でプログラマティックナビゲーション
- [ ] 検索結果ページへリダイレクト
- [ ] `old_viewer/views/collection.ejs`の検索フォーム部分を参照

**実装例:**
```javascript
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
```

#### 4.4 検索結果ページ
**ファイル:** `viewer/app/collection/[name]/search/page.js`

- [ ] Server Componentとして実装
- [ ] URLパラメータから`name`を取得
- [ ] クエリパラメータから`query`と`k`を取得
- [ ] `generateEmbedding(query)`で埋め込みベクトル生成
- [ ] `searchCollection(name, embeddings, nResults)`でベクトル検索
- [ ] 結果をテーブル形式で表示（スコア付き）
- [ ] Navigationコンポーネントを使用
- [ ] `old_viewer/views/search_results.ejs`を参照してUIを完全に再現

**実装例:**
```javascript
// viewer/app/collection/[name]/search/page.js
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CollapsibleDetails from '@/components/CollapsibleDetails';
import { searchCollection } from '@/lib/chromadb-client';
import { generateEmbedding } from '@/lib/embedding-service';

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
        <Navigation links={navLinks} />
        <section>
          <h2>エラーが発生しました</h2>
          <p>Failed to search collection {name}: {error}</p>
        </section>
      </>
    );
  }

  return (
    <>
      <Navigation links={navLinks} />

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
    </>
  );
}
```

---

### フェーズ5: Next.js設定ファイルの作成

#### 5.1 next.config.jsの作成
**ファイル:** `viewer/next.config.js`

- [ ] Standaloneモードを有効化（Docker最適化）
- [ ] 必要な設定を追加

**実装例:**
```javascript
// viewer/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 環境変数をクライアントに公開しない（サーバーサイドのみ使用）
  // ChromaDB接続情報はサーバーサイドでのみ使用
};

module.exports = nextConfig;
```

---

### フェーズ6: Docker設定の更新

#### 6.1 Dockerfileの更新
**ファイル:** `Dockerfile`（ルートディレクトリ）

- [ ] Next.js用のマルチステージビルドに変更
- [ ] `next build`ステップを追加
- [ ] Standaloneモードを使用（最適化）
- [ ] 本番環境用の設定
- [ ] `old_viewer`は含めない

**実装例:**
```dockerfile
# Dockerfile
# Dependencies stage
FROM node:24-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Next.jsプロジェクトの依存関係をインストール
COPY viewer/package.json viewer/package-lock.json ./
RUN npm ci

# Builder stage
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY viewer/ ./

# Next.jsビルド（standaloneモード）
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standaloneビルドの出力をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3300

ENV PORT=3300
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3300/ || exit 1

CMD ["node", "server.js"]
```

#### 6.2 compose.ymlの更新
**ファイル:** `compose.yml`（ルートディレクトリ）

- [ ] viewerサービスのビルドコンテキストを確認
- [ ] ポートマッピングを3300に維持（Next.jsでポート指定）
- [ ] 環境変数を更新

**実装例:**
```yaml
# compose.yml
services:
  viewer:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3300:3300"
    environment:
      - CHROMADB_HOST=${CHROMADB_HOST:-host.docker.internal}
      - CHROMADB_PORT=${CHROMADB_PORT:-8000}
      - LITELLM_PROXY_URL=http://litellm:4000
      - LITELLM_MODEL=${LITELLM_MODEL:-azure-text-embedding-ada-002}
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_API_BASE=${AZURE_OPENAI_API_BASE}
      - AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION}
    depends_on:
      - litellm
    restart: unless-stopped

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - "4000:4000"
    volumes:
      - ./litellm_config.yaml:/app/config.yaml
    environment:
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
      - AZURE_OPENAI_API_BASE=${AZURE_OPENAI_API_BASE}
      - AZURE_OPENAI_API_VERSION=${AZURE_OPENAI_API_VERSION}
    command: --config /app/config.yaml
    restart: unless-stopped
```

#### 6.3 .dockerignoreの更新
**ファイル:** `.dockerignore`（ルートディレクトリ）

- [ ] Next.js用のエントリを追加
- [ ] `old_viewer/`を除外

**実装例:**
```
# .dockerignore
node_modules
npm-debug.log
.next
.env.local
.env.development.local
.env.test.local
.env.production.local
.git
.gitignore
README.md
old_viewer
```

---

### フェーズ7: テストと検証

#### 7.1 ローカル開発環境でのテスト
- [ ] `viewer/`ディレクトリで`npm install`実行
- [ ] `.env.local`を設定
- [ ] `npm run dev`で開発サーバー起動（ポート3300）
- [ ] `old_viewer`と並行して動作確認
- [ ] 各機能のテスト:
  - [ ] トップページ（コレクション一覧）の表示
  - [ ] コレクション詳細ページの表示
  - [ ] ページネーションの動作
  - [ ] 検索機能の動作
  - [ ] UIデザインの一致確認（`old_viewer`と比較）

#### 7.2 UIの詳細比較
- [ ] ブラウザで`old_viewer`（ポート3300、Expressサーバー起動時）と新`viewer`（Next.js）を並べて表示
- [ ] 以下の項目を確認:
  - [ ] ヘッダーのスタイル
  - [ ] コレクション一覧の階層表示
  - [ ] テーブルのレイアウト
  - [ ] ボタンとフォームのスタイル
  - [ ] ページネーションのスタイル
  - [ ] `<details>`要素の動作
  - [ ] レスポンシブデザイン（モバイル表示）

#### 7.3 Docker環境でのテスト
- [ ] `docker compose build`でビルド
- [ ] `docker compose up`でコンテナ起動
- [ ] ヘルスチェックの動作確認
- [ ] ChromaDB接続の確認
- [ ] LiteLLM Proxy連携の確認
- [ ] 全機能の統合テスト

#### 7.4 エラーハンドリングの検証
- [ ] ChromaDB接続エラー時の挙動（ChromaDBを停止して確認）
- [ ] LiteLLM接続エラー時の挙動
- [ ] 存在しないコレクションへのアクセス
- [ ] 無効なページネーションパラメータ（負の数、文字列など）
- [ ] 空のクエリでの検索

---

### フェーズ8: ドキュメントの更新

#### 8.1 README.mdの更新
- [ ] Next.js移行の記載
- [ ] 新しい開発コマンド:
  - `cd viewer && npm run dev` - 開発サーバー
  - `cd viewer && npm run build` - 本番ビルド
  - `cd viewer && npm start` - 本番サーバー
- [ ] ディレクトリ構造の更新
- [ ] 環境変数の説明更新
- [ ] Docker設定の説明更新

#### 8.2 CLAUDE.mdの更新
- [ ] プロジェクト概要をNext.js用に更新
- [ ] アーキテクチャセクションの更新:
  - Express → Next.js App Router
  - EJS → React Server Components
  - axios → Fetch API
- [ ] コアコンポーネントの説明更新
- [ ] ルート構造の説明（App Router）
- [ ] 開発コマンドの更新
- [ ] Docker設定の説明更新
- [ ] プロジェクト構造の更新

#### 8.3 .env.exampleの更新
- [ ] Next.js用の環境変数テンプレートに更新
- [ ] 既存の環境変数を維持
- [ ] コメントを追加

---

### フェーズ9: クリーンアップと最終確認

#### 9.1 最終動作確認
- [ ] ローカル環境で全機能テスト
- [ ] Docker環境で全機能テスト
- [ ] `old_viewer`と新`viewer`の機能比較（完全一致を確認）
- [ ] UIデザインの最終確認

#### 9.2 old_viewerの削除
- [ ] `old_viewer/`ディレクトリを削除
- [ ] Gitコミット

**コマンド例:**
```bash
rm -rf old_viewer
git add .
git commit -m "Remove old Express-based viewer after Next.js migration"
```

#### 9.3 最終的な.gitignoreの確認
- [ ] ルートの`.gitignore`を確認
- [ ] 不要なエントリを削除
- [ ] `old_viewer/`のエントリを削除（もし追加していた場合）

---

## 技術的な注意事項

### Server Components vs Client Components

- **Server Components（デフォルト）:**
  - データフェッチ（ChromaDB、埋め込み生成）
  - SEOに有利
  - ページ、レイアウト、静的コンポーネント
  - `'use client'`ディレクティブなし

- **Client Components（`'use client'`が必要）:**
  - フォーム送信処理（SearchForm）
  - `useState`, `useEffect`, `useRouter`などのフック使用時
  - ブラウザAPIアクセス

### Fetch API使用時の注意

- Next.jsのFetch APIは拡張されており、キャッシュ制御が可能
- ChromaDBやLiteLLMへのリクエストは`cache: 'no-store'`を設定（毎回最新データ取得）
- エラーハンドリングは`response.ok`をチェック

### ページネーションとURLパラメータ

- `searchParams`はServer Componentsで自動的に利用可能
- クエリパラメータは`searchParams.page`, `searchParams.limit`で取得
- URLSearchParamsでクエリ文字列を構築（Client Components）

### パスエイリアス

- `@/`エイリアスで`viewer/`ルートからのインポート
- `jsconfig.json`または`tsconfig.json`で設定:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

### エラーハンドリング

- try-catchでエラーをキャッチし、エラーUIを表示
- 将来的に`error.js`と`loading.js`を追加可能（Next.js App Routerの機能）

### パフォーマンス最適化

- Server Componentsでデータフェッチ → クライアントへのJavaScript送信量を削減
- Standaloneビルド → Dockerイメージサイズ削減
- Next.jsの自動最適化（コード分割、プリフェッチなど）

---

## マイルストーン

1. **Week 1:** フェーズ0-2（既存コード保護、セットアップ、ユーティリティ実装）
2. **Week 2:** フェーズ3-4（UIコンポーネント、ページ実装）
3. **Week 3:** フェーズ5-7（Next.js設定、Docker設定、テスト）
4. **Week 4:** フェーズ8-9（ドキュメント更新、クリーンアップ）

---

## 成功基準

- [ ] 全ての既存機能がNext.jsで動作する
- [ ] UIデザインが既存（`old_viewer`）と完全に一致する
- [ ] Docker環境で正常に動作する
- [ ] パフォーマンスが既存と同等以上
- [ ] コードがモダンなNext.jsベストプラクティスに従っている
- [ ] `old_viewer`を削除しても問題なく動作する
- [ ] ドキュメントが最新の状態に更新されている
- [ ] Fetch APIを使用し、axiosは使わない

---

## リスクと対策

### リスク1: ChromaDBクライアントのNext.js互換性
- **対策:** 初期段階でChromaDBクライアントの動作を確認し、必要に応じてAPIラッパーを実装

### リスク2: Server ComponentsでのFetch使用
- **対策:** Fetch APIは標準的なブラウザAPIでありNode.jsでもサポート済み。エラーハンドリングを適切に実装

### リスク3: Docker環境での環境変数
- **対策:** `.env.local`と`compose.yml`で環境変数を適切に設定し、テスト環境で検証

### リスク4: UIデザインの完全一致
- **対策:** `old_viewer`を保持し、並行して比較しながら実装。CSSを完全にコピーして使用

### リスク5: Standaloneビルドのサイズ
- **対策:** Next.jsのStandaloneモードは最適化されているため、問題なし。必要に応じてビルドサイズを確認

---

## 補足: 並行開発アプローチ

- `old_viewer`を保持することで、いつでも参照・比較可能
- 新`viewer`の開発中も既存のExpressアプリケーションは動作可能（ポートを変えれば並行起動も可）
- 移行完了後、`old_viewer`を削除してクリーンな状態に

---

## 参考リソース

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Components vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [ChromaDB JavaScript Client](https://docs.trychroma.com/js_reference/Client)
- [Docker Next.js Best Practices](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Fetch API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
