# ChromaDB Viewer

ChromaDBのレコードを簡単に確認するためのシンプルなWebビューワーです。Docker上で動作し、既存のChromaDBインスタンスに接続して使用することができます。

## 機能

- コレクション一覧の表示
- コレクション内のレコード表示（ページネーション付き）
- ベクトル検索機能
- メタデータ、埋め込みベクトル、ドキュメントの表示
- Docker Composeを使った簡単なセットアップ

## 必要条件

- Docker
- Docker Compose

## セットアップ方法

1. リポジトリをクローンまたはダウンロードします。

2. 以下のディレクトリ構造を作成します:

```
chromadb-viewer/
│
├── docker-compose.yml
│
└── viewer/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    ├── public/
    │   └── css/
    │       └── style.css
    │
    └── views/
        ├── index.ejs
        ├── collection.ejs
        ├── search_results.ejs
        └── error.ejs
```

3. Docker Composeを使ってコンテナを起動します:

```bash
docker-compose up -d
```

4. ブラウザで `http://localhost:3000` にアクセスしてビューワーを使用します。

## 既存のChromaDBに接続する方法

既存のChromaDBコンテナに接続する場合は、`docker-compose.yml`を編集して、chromadbサービスを削除し、viewerサービスの環境変数を次のように変更します:

```yaml
environment:
  - CHROMA_API_ADDR=http://あなたのchromadbのホスト:8000
```

## 注意事項

このビューワーはシンプルな表示用ツールとして設計されています。大量のデータを含むコレクションの表示には時間がかかる場合があります。また、埋め込みベクトルは大きさの関係で最初の10次元のみ表示しています。

## セキュリティ

このビューワーには認証機能が含まれていないため、信頼できるネットワーク環境でのみ使用してください。