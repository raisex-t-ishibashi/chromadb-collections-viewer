# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChromaDB Collections Viewer is a web-based viewer for browsing ChromaDB collections and records. It's a Node.js/Express application that connects to external ChromaDB instances and provides a simple interface for viewing collections, records, and performing vector searches with Azure OpenAI embeddings.

## Architecture

### Core Components

- **Express Server** (`viewer/server.js`): Main application server handling routes and ChromaDB client interactions
- **ChromaDB Client**: Uses the official `chromadb` npm package (v3.1.1) to communicate with ChromaDB instances
- **LiteLLM Proxy**: Standalone service that provides embedding generation via Azure OpenAI
- **EJS Templates** (`viewer/views/`): Server-side rendering for collection lists, record displays, and search results
- **Docker Container**: Node 24 Alpine-based container with multi-stage build for deployment

### Key Routes

- `GET /`: Lists all collections with tenant/database/collection hierarchy
- `GET /collection/:name`: Shows paginated records from a specific collection
- `POST /collection/:name/search`: Performs vector search using LiteLLM proxy for embeddings

### Data Flow

1. ChromaDB client connects to ChromaDB instance via `CHROMADB_HOST:CHROMADB_PORT`
2. For searches: User query → LiteLLM Proxy → Azure OpenAI text-embedding-ada-002 → Collection query with embeddings
3. Results rendered via EJS templates with pagination and collapsible details

## Development Commands

### Local Development
```bash
cd viewer
npm install
npm run dev  # Runs with nodemon for auto-reload
npm start    # Production mode
```

### Docker Development
```bash
# Setup environment
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Build and start services
docker compose build
docker compose up -d

# View logs
docker compose logs -f viewer
docker compose logs -f litellm

# Stop services
docker compose down
```

The viewer runs on port 3300 by default and connects to an external ChromaDB instance.

## Environment Variables

Required environment variables (configure in `.env`):

### Azure OpenAI Configuration
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_OPENAI_API_BASE`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_VERSION`: API version (e.g., 2025-01-01-preview)

### Viewer Configuration
- `VIEWER_PORT`: Application port (default: 3300)
- `CHROMADB_HOST`: ChromaDB hostname (e.g., host.docker.internal or chromadb)
- `CHROMADB_PORT`: ChromaDB port (default: 8000)
- `LITELLM_PROXY_URL`: LiteLLM proxy URL (default: http://litellm:4000)
- `LITELLM_MODEL`: Embedding model name (default: azure-text-embedding-ada-002)

### LiteLLM Configuration
- `LITELLM_PORT`: LiteLLM proxy port (default: 4000)

## Important Implementation Details

### Vector Search with Azure OpenAI
- Uses LiteLLM proxy to generate embeddings via Azure OpenAI text-embedding-ada-002 (1536 dimensions)
- LiteLLM configuration in `litellm_config.yaml` maps model names to Azure deployments
- Embedding generation happens via HTTP call to LiteLLM proxy before querying ChromaDB
- Collection must be created with the same embedding function (text-embedding-ada-002)

### ChromaDB Client Configuration
- Uses host/port configuration instead of path-based URL
- Client connects via: `new ChromaClient({ host: CHROMADB_HOST, port: CHROMADB_PORT })`
- Collections fetched with metadata including tenant, database, and collection ID

### Pagination
- Implemented using `limit` and `offset` parameters
- Default: 10 records per page
- Data fetched with `include: ['embeddings', 'metadatas', 'documents']` to retrieve all fields

### Display Features
- Collection list shows tenant → database → collection hierarchy with color coding
- Embedding vectors displayed in collapsible `<details>` elements with word-wrap
- Documents displayed expanded by default with full text and word-wrap
- Metadata displayed in collapsible `<details>` with formatted JSON
- All text content uses CSS word-wrap to prevent horizontal overflow

### Docker Best Practices
- Multi-stage build to reduce image size
- Non-root user (node) for security
- Health check configured (curl to localhost:3300)
- `.dockerignore` excludes node_modules and development files
- Production dependencies only (`npm ci --omit=dev`)

## Project Structure

```
chroma-record-viewer/
├── Dockerfile              # Multi-stage production build
├── compose.yml            # Docker Compose configuration
├── litellm_config.yaml    # LiteLLM model configuration
├── .env                   # Environment variables (not committed)
├── .env.example           # Environment variable template
├── .dockerignore          # Docker build exclusions
└── viewer/
    ├── package.json
    ├── server.js          # Express application
    ├── public/
    │   └── css/
    │       └── style.css  # Responsive styles with word-wrap
    └── views/
        ├── index.ejs           # Collection list
        ├── collection.ejs      # Collection detail with records
        ├── search_results.ejs  # Search results
        └── error.ejs           # Error page
```

## Connecting to External ChromaDB

The application is designed to connect to an external ChromaDB instance. Configure in `.env`:

```bash
CHROMADB_HOST=your-chromadb-host
CHROMADB_PORT=8000
```

For Docker Desktop on macOS/Windows, use `host.docker.internal` to access host machine services.

## Common Development Tasks

### Updating Dependencies
```bash
cd viewer
npm update
npm audit fix
```

### Rebuilding Docker Image
```bash
docker compose build --no-cache
docker compose up -d
```

### Debugging Connection Issues
- Check viewer logs: `docker compose logs viewer`
- Check LiteLLM logs: `docker compose logs litellm`
- Verify ChromaDB connectivity: `curl http://CHROMADB_HOST:CHROMADB_PORT/api/v1/heartbeat`
- Verify LiteLLM proxy: `curl http://localhost:4000/health`
