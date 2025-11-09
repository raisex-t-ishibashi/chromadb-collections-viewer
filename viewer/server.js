// viewer/server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const { ChromaClient } = require('chromadb');

const app = express();
const PORT = process.env.PORT || 3300;
const CHROMA_API_ADDR = process.env.CHROMA_API_ADDR || 'http://localhost:8000';
const LITELLM_PROXY_URL = process.env.LITELLM_PROXY_URL || 'http://localhost:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'azure-embedding';


// ChromaDBクライアントの設定
const client = new ChromaClient({
  path: CHROMA_API_ADDR
});

// テンプレートエンジンの設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// メインルート - コレクションの一覧を表示
app.get('/', async (req, res) => {
  try {
    const collections = await client.listCollections();
    const collectionNames = collections.map(collection => collection.name);
    res.render('index', { collections: collectionNames });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).render('error', { message: 'Failed to fetch collections', error });
  }
});

// コレクション詳細ページ
app.get('/collection/:name', async (req, res) => {
  try {
    const collectionName = req.params.name;
    const collection = await client.getCollection({ name: collectionName });
    const count = await collection.count();
    
    // ページネーション情報
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // データの取得（ページネーション付き）
    const result = await collection.get({
      limit: limit,
      offset: skip
    });
    
    res.render('collection', {
      name: collectionName,
      data: result,
      count,
      page,
      limit,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error(`Error fetching collection ${req.params.name}:`, error);
    res.status(500).render('error', { message: `Failed to fetch collection ${req.params.name}`, error });
  }
});

// 検索エンドポイント
app.post('/collection/:name/search', async (req, res) => {
  try {
    const collectionName = req.params.name;
    const { query, k } = req.body;
    const numResults = parseInt(k) || 10;
    
    const collection = await client.getCollection({ name: collectionName });

    // LiteLLM Proxyを使ってembedding生成
    const response = await axios.post(`${LITELLM_PROXY_URL}/embeddings`, {
      model: LITELLM_MODEL,
      input: [query]
    });

    const embeddings = [response.data.data[0].embedding];
    const results = await collection.query({
      queryEmbeddings: embeddings,
      nResults: numResults
    });

    return res.render('search_results', {
      name: collectionName,
      query,
      results: results
    });
  } catch (error) {
    console.error(`Error searching collection ${req.params.name}:`, error);
    res.status(500).render('error', { message: `Failed to search collection ${req.params.name}`, error });
  }
});

// サーバーの起動
app.listen(PORT, () => {
  console.log(`ChromaDB Viewer is running on http://localhost:${PORT}`);
  console.log(`Connected to ChromaDB at ${CHROMA_API_ADDR}`);
});