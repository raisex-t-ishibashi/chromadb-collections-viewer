# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChromaDB Viewer is a web-based viewer for browsing ChromaDB collections and records. It's a Node.js/Express application that connects to ChromaDB instances and provides a simple interface for viewing collections, records, and performing vector searches.

## Architecture

### Core Components

- **Express Server** (`viewer/server.js`): Main application server handling routes and ChromaDB client interactions
- **ChromaDB Client**: Uses the official `chromadb` npm package to communicate with ChromaDB instances
- **EJS Templates** (`viewer/views/`): Server-side rendering for collection lists, record displays, and search results
- **Docker Container**: Node 20 Alpine-based container for deployment

### Key Routes

- `GET /`: Lists all collections
- `GET /collection/:name`: Shows paginated records from a specific collection
- `POST /collection/:name/search`: Performs vector search using DefaultEmbeddingFunction

### Data Flow

1. ChromaDB client connects to ChromaDB instance via `CHROMA_API_ADDR`
2. For searches: User query → DefaultEmbeddingFunction → Direct API call to `/api/v2/collections/{name}/query`
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
docker compose up -d  # Starts viewer service
docker compose down   # Stops services
```

The viewer runs on port 3100 (mapped from container port 3000) and connects to ChromaDB at `http://host.docker.internal:8000` by default.

## Environment Variables

- `CHROMA_API_ADDR`: ChromaDB API endpoint (default: `http://localhost:8000`)
- `PORT`: Application port (default: 3300 in code, 3000 in Docker)

## Important Implementation Details

### Vector Search
- Uses `DefaultEmbeddingFunction` from `chromadb-default-embed` package
- Search bypasses the ChromaDB client's query method and directly calls the REST API at `/api/v2/collections/{name}/query`
- Embedding generation happens server-side before querying

### Pagination
- Implemented using `limit` and `offset` parameters
- Default: 10 records per page
- Page numbers and limits are query parameters

### Display Optimization
- Embedding vectors show only first 10 dimensions by default (collapsed in `<details>`)
- Documents truncated to 500 characters (full text in collapsed view)
- Metadata displayed as formatted JSON

## Connecting to External ChromaDB

To connect to an existing ChromaDB instance, modify `compose.yml`:
1. Comment out or remove the `chromadb` service
2. Update `viewer` service environment: `CHROMA_API_ADDR=http://your-chromadb-host:8000`
