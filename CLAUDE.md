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
- **Styling**: **TailwindCSS v4** with `@tailwindcss/postcss` for utility-first styling
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
- **Dynamic Rendering**: All pages use `export const dynamic = 'force-dynamic'` to avoid build-time ChromaDB connections
- **Server Components** (default): Used for data fetching, SSR, and dynamic content
  - `app/page.js`: Top page (collections list)
  - `app/collection/[name]/page.js`: Collection detail page with pagination
  - `app/collection/[name]/search/page.js`: Search results page
- **Client Components** (`'use client'` directive): Used for interactive UI
  - `components/SearchForm.js`: Search form with state management and router navigation
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

### Display Features & Styling
- **TailwindCSS v4**: Utility-first CSS framework for all styling
  - Configuration: `tailwind.config.js` with custom colors (primary: #3b82f6, secondary: #6b7280)
  - PostCSS setup: `@tailwindcss/postcss` plugin in `postcss.config.js`
  - Import: `@import "tailwindcss";` in `app/globals.css`
- **Components**:
  - `Header.js`: Blue header with white text, shadow (`bg-blue-500 text-white px-8 py-4 shadow-md`)
  - `Navigation.js`: Flex layout with gap and hover effects
  - `Pagination.js`: Centered flex layout with blue current page indicator
  - `SearchForm.js`: Collapsible form with TailwindCSS classes
  - `CollapsibleDetails.js`: Reusable component for metadata, vectors, and documents with max-height and overflow
- **UI Design**:
  - Collection list shows tenant → database → collection hierarchy with color coding (purple/blue/blue)
  - Responsive tables with fixed column widths and horizontal scroll on mobile
  - Striped table rows for better readability
  - Embedding vectors displayed in collapsible elements with max-height scrolling
  - Documents displayed expanded by default
  - All text uses `break-words` and `overflow-wrap-anywhere` for proper wrapping

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
│   │   ├── layout.js              # Root layout with suppressHydrationWarning (Server Component)
│   │   ├── page.js                # Top page - collections list (Server Component, dynamic)
│   │   ├── globals.css            # TailwindCSS import: @import "tailwindcss";
│   │   └── collection/
│   │       └── [name]/            # Dynamic route for collection name
│   │           ├── page.js        # Collection detail page (Server Component, dynamic)
│   │           └── search/
│   │               └── page.js    # Search results page (Server Component, dynamic)
│   ├── components/                 # React components (all use TailwindCSS)
│   │   ├── Header.js              # Header with title and navigation (Server Component)
│   │   ├── Navigation.js          # Navigation links (Server Component)
│   │   ├── Pagination.js          # Pagination UI (Server Component)
│   │   ├── SearchForm.js          # Search form (Client Component)
│   │   └── CollapsibleDetails.js  # Collapsible details wrapper (Server Component)
│   ├── lib/                        # Utility libraries
│   │   ├── chromadb-client.js     # ChromaDB client wrapper
│   │   └── embedding-service.js   # Embedding generation (Fetch API)
│   ├── public/                     # Static files
│   ├── tailwind.config.js         # TailwindCSS configuration
│   ├── postcss.config.js          # PostCSS with @tailwindcss/postcss
│   ├── next.config.js             # Next.js configuration (standalone mode)
│   ├── jsconfig.json              # JavaScript configuration (path aliases)
│   ├── package.json               # Dependencies (Next.js 15, TailwindCSS, chromadb)
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

The application is designed to connect to an external ChromaDB instance running on your host machine or a separate server.

### Configuration

**For Docker Development** (configure in root `.env`):
```bash
CHROMADB_HOST=host.docker.internal  # For Docker Desktop on macOS/Windows
CHROMADB_PORT=8000
```

**For Local Development** (configure in `viewer/.env.local`):
```bash
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
LITELLM_PROXY_URL=http://localhost:4000
```

**Important Notes**:
- Docker Desktop (macOS/Windows): Use `host.docker.internal` to access services running on your host machine
- Linux Docker: Use `172.17.0.1` (default Docker bridge IP) or configure a custom network
- Remote ChromaDB: Use the actual hostname or IP address of your ChromaDB server

## Common Development Tasks

### Local Development Workflow
```bash
cd viewer
npm install                  # Install dependencies
cp .env.local.example .env.local  # Create local environment config (if needed)
npm run dev                  # Start development server on port 3300
```

### Production Build Testing
```bash
cd viewer
npm run build                # Build Next.js application (standalone mode)
npm start                    # Start production server
```
All routes should show as `ƒ (Dynamic)` in build output, indicating runtime rendering.

### Docker Development Workflow
```bash
cp .env.example .env         # Create environment config
# Edit .env with your Azure OpenAI credentials
docker compose build         # Build all services
docker compose up -d         # Start services in background
docker compose logs -f viewer   # Follow viewer logs
docker compose down          # Stop all services
```

### Rebuilding Docker Image
```bash
docker compose build --no-cache  # Force rebuild without cache
docker compose up -d
```

### Updating Dependencies
```bash
cd viewer
npm update                   # Update dependencies
npm audit fix               # Fix security vulnerabilities
npm install                 # Reinstall dependencies
```

### Debugging Connection Issues

**Check Service Status**:
```bash
docker compose ps            # Check running containers
docker compose logs viewer   # View viewer logs
docker compose logs litellm  # View LiteLLM logs
```

**Test Connectivity**:
```bash
# ChromaDB heartbeat
curl http://CHROMADB_HOST:CHROMADB_PORT/api/v1/heartbeat

# LiteLLM health check
curl http://localhost:4000/health

# Next.js application
curl http://localhost:3300
```

### TailwindCSS Development
```bash
# TailwindCSS is automatically processed by PostCSS during Next.js dev/build
# No separate build step needed

# If styles aren't applying:
# 1. Check viewer/app/globals.css has: @import "tailwindcss";
# 2. Check viewer/postcss.config.js uses: '@tailwindcss/postcss': {}
# 3. Restart dev server: npm run dev
```

## Migration from Express to Next.js

This project was migrated from Express/EJS (old_viewer/) to Next.js 15 (App Router) in viewer/.

### Key Architecture Changes

| Aspect | Express (old_viewer/) | Next.js 15 (viewer/) |
|--------|----------------------|----------------------|
| **Framework** | Express.js server | Next.js App Router |
| **Templating** | EJS templates | React Server/Client Components |
| **HTTP Client** | axios | Fetch API (built-in) |
| **Routing** | `app.get('/route', ...)` | File-based routing (`app/*/page.js`) |
| **Styling** | Custom CSS (`public/css/style.css`) | TailwindCSS v4 utility classes |
| **Data Fetching** | Async route handlers | React Server Components |
| **ChromaDB Client** | `server.js` | `lib/chromadb-client.js` |
| **Embedding Service** | Inline in routes | `lib/embedding-service.js` |
| **Docker Build** | Simple Node image | Multi-stage with Standalone mode |
| **Static Files** | Express static middleware | Next.js public/ directory |
| **Port Config** | `PORT` env var | `PORT` env var (default 3300) |

### Migration Benefits

1. **Performance**: React Server Components reduce client-side JavaScript
2. **SEO**: Built-in SSR with streaming support
3. **Developer Experience**: Hot reload, TypeScript support, modern tooling
4. **Build Optimization**: Standalone mode reduces Docker image size
5. **Maintainability**: Component-based architecture, cleaner separation of concerns
6. **Styling**: TailwindCSS provides consistent, responsive design system

### Legacy Code

The legacy Express application is preserved in `old_viewer/` for reference purposes. Once the Next.js migration is fully verified in production, the `old_viewer/` directory can be safely removed.

**Note**: The `.dockerignore` file already excludes `old_viewer/` from Docker builds to keep images lean.
