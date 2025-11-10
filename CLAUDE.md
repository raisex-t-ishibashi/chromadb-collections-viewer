# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChromaDB Collections Viewer is a web-based viewer for browsing ChromaDB collections and records. It's a **Next.js 15 (App Router)** application that connects to external ChromaDB instances and provides a simple interface for viewing collections, records, and performing vector searches with Azure OpenAI embeddings.

## Architecture

### Core Components

- **Next.js Application** (`viewer/`): Modern React-based web application using App Router
  - **Server Components**: Data fetching and SSR for pages (`app/page.js`, `app/collection/[name]/page.js`)
  - **Client Components**: Interactive UI elements (`components/SearchForm.js`)
  - **API Routes**: None (uses Server Components for data fetching)
- **ChromaDB Client** (`lib/chromadb-client.js`): Uses the official `chromadb` npm package (v3.1.1)
- **Embedding Service** (`lib/embedding-service.js`): Generates embeddings via LiteLLM Proxy using **Fetch API**
- **LiteLLM Proxy**: Standalone service that provides embedding generation via Azure OpenAI
- **Styling**: Global CSS (`app/globals.css`) with CSS variables and responsive design
- **Docker Container**: Node 24 Alpine-based multi-stage build with Next.js Standalone mode

### Key Routes (Next.js App Router)

- `/`: Lists all collections with tenant/database/collection hierarchy (Server Component)
- `/collection/[name]`: Shows paginated records from a specific collection (Server Component)
- `/collection/[name]/search`: Displays vector search results (Server Component)

### Data Flow

1. ChromaDB client connects to ChromaDB instance via `CHROMADB_HOST:CHROMADB_PORT`
2. For searches: User query → Fetch API → LiteLLM Proxy → Azure OpenAI text-embedding-ada-002 → Collection query with embeddings
3. Results rendered via React Server Components with pagination and collapsible details

## Development Commands

### Local Development
```bash
cd viewer
npm install
npm run dev   # Next.js dev server (port 3300)
npm run build # Production build
npm start     # Production server (port 3300)
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

Required environment variables:

### For Docker (configure in `.env` at root)
- `CHROMADB_HOST`: ChromaDB hostname (e.g., host.docker.internal)
- `CHROMADB_PORT`: ChromaDB port (default: 8000)
- `LITELLM_PROXY_URL`: LiteLLM proxy URL (default: http://litellm:4000)
- `LITELLM_MODEL`: Embedding model name (default: azure-text-embedding-ada-002)
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_OPENAI_API_BASE`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_VERSION`: API version (e.g., 2025-01-01-preview)

### For Local Development (configure in `viewer/.env.local`)
- `CHROMADB_HOST`: localhost
- `CHROMADB_PORT`: 8000
- `LITELLM_PROXY_URL`: http://localhost:4000
- `LITELLM_MODEL`: azure-text-embedding-ada-002
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_API_BASE`: Your Azure OpenAI endpoint
- `AZURE_OPENAI_API_VERSION`: API version

## Important Implementation Details

### Next.js App Router
- **Server Components** (default): Used for data fetching, SSR, and static content
  - `app/page.js`: Top page (collections list)
  - `app/collection/[name]/page.js`: Collection detail page
  - `app/collection/[name]/search/page.js`: Search results page
- **Client Components** (`'use client'` directive): Used for interactive UI
  - `components/SearchForm.js`: Search form with state management
- **No API Routes**: Data fetching is done directly in Server Components

### Vector Search with Azure OpenAI
- Uses **Fetch API** (not axios) to call LiteLLM proxy for embedding generation
- LiteLLM configuration in `litellm_config.yaml` maps model names to Azure deployments
- Embedding generation: `fetch(LITELLM_PROXY_URL/embeddings)` with `cache: 'no-store'`
- Collection must be created with the same embedding function (text-embedding-ada-002, 1536 dimensions)

### ChromaDB Client Configuration
- Client initialized in `lib/chromadb-client.js` as singleton
- Connects via: `new ChromaClient({ host: CHROMADB_HOST, port: CHROMADB_PORT })`
- Collections fetched with metadata including tenant, database, and collection ID
- Functions exported:
  - `getCollections()`: Fetch all collections
  - `getCollection(name)`: Get specific collection
  - `getCollectionCount(name)`: Get record count
  - `getCollectionRecords(name, { page, limit })`: Fetch paginated records
  - `searchCollection(name, queryEmbeddings, nResults)`: Perform vector search

### Pagination
- Implemented using `limit` and `offset` parameters
- Default: 10 records per page
- Data fetched with `include: ['embeddings', 'metadatas', 'documents']` to retrieve all fields
- Pagination component: `components/Pagination.js` (Server Component with Next.js Link)

### Display Features
- Collection list shows tenant → database → collection hierarchy with color coding
- Embedding vectors displayed in collapsible `<details>` elements with word-wrap
- Documents displayed expanded by default with full text and word-wrap
- Metadata displayed in collapsible `<details>` with formatted JSON
- All text content uses CSS word-wrap to prevent horizontal overflow

### Docker Best Practices
- **Multi-stage build**: deps → builder → runner stages
- **Standalone mode**: Next.js output optimization (`output: 'standalone'` in next.config.js)
- Non-root user (nextjs:nodejs) for security
- Health check configured (curl to localhost:3300)
- `.dockerignore` excludes `node_modules`, `.next`, and `old_viewer`
- Production-only dependencies

## Project Structure

```
chroma-record-viewer/
├── viewer/                          # Next.js application
│   ├── app/                        # App Router directory
│   │   ├── layout.js              # Root layout (Server Component)
│   │   ├── page.js                # Top page - collections list (Server Component)
│   │   ├── globals.css            # Global CSS styles
│   │   └── collection/
│   │       └── [name]/            # Dynamic route for collection name
│   │           ├── page.js        # Collection detail page (Server Component)
│   │           └── search/
│   │               └── page.js    # Search results page (Server Component)
│   ├── components/                 # React components
│   │   ├── Navigation.js          # Navigation links (Server Component)
│   │   ├── Pagination.js          # Pagination UI (Server Component)
│   │   ├── SearchForm.js          # Search form (Client Component)
│   │   └── CollapsibleDetails.js  # Collapsible details wrapper (Server Component)
│   ├── lib/                        # Utility libraries
│   │   ├── chromadb-client.js     # ChromaDB client wrapper
│   │   └── embedding-service.js   # Embedding generation (Fetch API)
│   ├── public/                     # Static files
│   ├── next.config.js             # Next.js configuration
│   ├── jsconfig.json              # JavaScript configuration (path aliases)
│   ├── package.json               # Dependencies
│   └── .env.local                 # Local environment variables (not committed)
├── old_viewer/                     # Legacy Express application (for reference)
├── Dockerfile                      # Multi-stage Docker build for Next.js
├── compose.yml                     # Docker Compose configuration
├── litellm_config.yaml            # LiteLLM model configuration
├── .env.example                   # Environment variable template
├── .env                           # Environment variables (not committed)
└── .dockerignore                  # Docker build exclusions
```

## Connecting to External ChromaDB

The application is designed to connect to an external ChromaDB instance. Configure in `.env` (Docker) or `viewer/.env.local` (local development):

**For Docker**:
```bash
CHROMADB_HOST=host.docker.internal
CHROMADB_PORT=8000
```

**For Local Development**:
```bash
CHROMADB_HOST=localhost
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

### Testing Next.js Build
```bash
cd viewer
npm run build
npm start
```

## Migration from Express to Next.js

This project was migrated from Express/EJS to Next.js 15 (App Router). Key changes:

- **Express → Next.js App Router**: Modern React framework with SSR
- **EJS Templates → React Components**: Server and Client Components
- **axios → Fetch API**: Standard browser/Node.js API
- **Routes → File-based routing**: App Router convention
- **Standalone deployment**: Optimized Docker build

The legacy Express application is preserved in `old_viewer/` for reference and will be removed after final verification.
