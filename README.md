# ChromaDB Collections Viewer

ChromaDBに保存されたコレクションとレコードを簡単に閲覧・検索できるWebビューワーです。Azure OpenAIのembeddingモデル（text-embedding-ada-002）でベクトル化されたデータの表示と検索に対応しています。

## 特徴

- **コレクション一覧表示**: テナント/データベース/コレクションの階層構造で表示
- **レコード詳細表示**: ID、メタデータ、埋め込みベクトル、ドキュメントをページネーション付きで表示
- **ベクトル検索**: Azure OpenAI（text-embedding-ada-002）を使用したセマンティック検索
- **外部ChromaDB対応**: 既存のChromaDBインスタンスに接続して使用
- **Docker対応**: Docker Composeで簡単にセットアップ

## 前提条件

このビューワーは以下を前提としています：

- ChromaDBに保存されているベクトルが**Azure OpenAIのtext-embedding-ada-002**でembeddingされていること
- 検索時も同じembeddingモデルを使用するため、LiteLLMプロキシ経由でAzure OpenAIに接続

## 必要な環境

- Docker & Docker Compose
- Azure OpenAI APIキー（text-embedding-ada-002モデルへのアクセス）
- 接続先のChromaDBインスタンス

## セットアップ方法

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd chroma-record-viewer
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な情報を設定します。

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_BASE=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Viewer Configuration
VIEWER_PORT=3300
CHROMADB_HOST=host.docker.internal  # ChromaDBのホスト名
CHROMADB_PORT=8000                   # ChromaDBのポート
LITELLM_PROXY_URL=http://litellm:4000
LITELLM_MODEL=azure-text-embedding-ada-002

# LiteLLM Configuration
LITELLM_PORT=4000
```

#### 環境変数の説明

| 変数名 | 説明 | デフォルト値 |
|--------|------|--------------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI APIキー | - |
| `AZURE_OPENAI_API_BASE` | Azure OpenAIエンドポイントURL | - |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI APIバージョン | - |
| `VIEWER_PORT` | ビューワーのポート番号 | 3300 |
| `CHROMADB_HOST` | ChromaDBのホスト名 | host.docker.internal |
| `CHROMADB_PORT` | ChromaDBのポート番号 | 8000 |
| `LITELLM_PROXY_URL` | LiteLLMプロキシのURL | http://litellm:4000 |
| `LITELLM_MODEL` | 使用するembeddingモデル名 | azure-text-embedding-ada-002 |

**注意**: `CHROMADB_HOST`は、Docker Desktop（macOS/Windows）でホストマシン上のサービスにアクセスする場合は`host.docker.internal`を使用してください。

### 3. Dockerイメージのビルドと起動

```bash
# イメージをビルド
docker compose build

# サービスを起動
docker compose up -d
```

### 4. アクセス

ブラウザで以下のURLにアクセスします：

```
http://localhost:3300
```

## 使い方

### コレクション一覧

トップページでは、ChromaDBに登録されている全てのコレクションが表示されます。各コレクションは以下の情報を含みます：

- テナント名
- データベース名
- コレクション名
- コレクションID

### レコード表示

コレクション名をクリックすると、そのコレクション内のレコードがページネーション付きで表示されます。

各レコードには以下の情報が含まれます：

- **ID**: レコードの一意識別子
- **メタデータ**: JSON形式のメタデータ（折りたたみ表示）
- **埋め込みベクトル**: ベクトルの次元数と値（折りたたみ表示）
- **ドキュメント**: テキストコンテンツ（デフォルトで展開表示）

### ベクトル検索

レコード一覧ページの検索フォームから、テキストクエリで類似レコードを検索できます。

1. 「検索フォームを表示/非表示」をクリック
2. 検索クエリを入力
3. 表示件数を指定（デフォルト: 10件）
4. 「検索」ボタンをクリック

検索結果には類似度スコアが表示され、関連性の高い順に並べられます。

## アーキテクチャ

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
┌──────▼──────────────────────────────┐
│  Viewer (Express + ChromaDB Client) │
└──────┬──────────────┬────────────────┘
       │              │
       │ ChromaDB API │ Embedding API
       │              │
┌──────▼──────┐  ┌───▼────────────────┐
│  ChromaDB   │  │  LiteLLM Proxy     │
│  (External) │  │  ├─ Azure OpenAI   │
└─────────────┘  │  └─ text-embedding │
                 │     -ada-002        │
                 └────────────────────┘
```

### コンポーネント

- **Viewer**: Express.jsベースのWebアプリケーション
  - ChromaDBクライアントでコレクション/レコードを取得
  - EJSテンプレートでUIをレンダリング

- **LiteLLM Proxy**: Azure OpenAI APIへのプロキシサービス
  - テキストクエリをtext-embedding-ada-002でベクトル化
  - ChromaDBに保存されているベクトルと同じモデルを使用

- **ChromaDB**: ベクトルデータベース（外部）
  - コレクションとレコードを管理
  - ベクトル検索を実行

## 開発

### ローカル開発

```bash
cd viewer
npm install
npm run dev  # nodemonで自動リロード
```

### ログの確認

```bash
# Viewerのログ
docker compose logs -f viewer

# LiteLLMのログ
docker compose logs -f litellm
```

### サービスの再起動

```bash
# 全サービスを再起動
docker compose restart

# 特定のサービスのみ再起動
docker compose restart viewer
```

### イメージの再ビルド

```bash
docker compose build --no-cache
docker compose up -d
```

## トラブルシューティング

### ChromaDBに接続できない

```bash
# ChromaDBの接続確認
curl http://CHROMADB_HOST:CHROMADB_PORT/api/v1/heartbeat

# Viewerのログを確認
docker compose logs viewer
```

**解決方法**:
- `.env`の`CHROMADB_HOST`と`CHROMADB_PORT`が正しいか確認
- ChromaDBが起動しているか確認
- Docker DesktopでホストマシンのChromaDBにアクセスする場合は`CHROMADB_HOST=host.docker.internal`を使用

### Azure OpenAI APIエラー

```bash
# LiteLLMのログを確認
docker compose logs litellm
```

**解決方法**:
- `.env`のAzure OpenAI認証情報が正しいか確認
- `AZURE_OPENAI_API_KEY`、`AZURE_OPENAI_API_BASE`、`AZURE_OPENAI_API_VERSION`を確認
- Azure OpenAIのtext-embedding-ada-002モデルへのアクセス権限を確認

### 検索時のベクトル次元エラー

**エラー例**: `Collection expecting embedding with dimension of 1536, got 384`

**原因**: ChromaDBに保存されているベクトルとLiteLLMで生成するベクトルの次元数が異なる

**解決方法**:
- ChromaDBのコレクションがtext-embedding-ada-002（1536次元）で作成されているか確認
- `.env`の`LITELLM_MODEL`が`azure-text-embedding-ada-002`になっているか確認

## セキュリティについて

- このビューワーには認証機能が含まれていません
- 信頼できるネットワーク環境でのみ使用してください
- `.env`ファイルには機密情報が含まれるため、バージョン管理システムにコミットしないでください

## ライセンス

このプロジェクトは[MIT License](LICENSE)の下で公開されています。

## 技術スタック

- **Frontend**: EJS, CSS
- **Backend**: Node.js 24, Express 5
- **Database Client**: ChromaDB JavaScript Client v3.1.1
- **Embedding**: Azure OpenAI (text-embedding-ada-002) via LiteLLM
- **Container**: Docker, Docker Compose
