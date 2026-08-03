# Scripts Reference

## Current Scripts

```bash
npm run dev        # Start development server (tsx server.ts)
npm run build      # Production build (vite build + esbuild)
npm run start      # Run production server (node dist/server.cjs)
npm run lint       # TypeScript type check (tsc --noEmit)
npm run clean      # Remove dist/ and server.js
```

## Planned Scripts (Phase 2+)

### Development

```bash
npm run dev            # Start full dev environment
npm run dev:api        # Start API server only
npm run dev:frontend   # Start frontend only (Vite)
npm run dev:worker     # Start all workers
npm run dev:watch      # Start with file watching
```

### Workers

```bash
npm run worker:crawler     # Start crawler worker
npm run worker:embedding   # Start embedding worker
npm run worker:export      # Start export worker
npm run worker:planner     # Start planner worker
npm run worker:report      # Start report worker
npm run worker:all         # Start all workers
```

### AI / LLM

```bash
npm run ollama:start     # Start Ollama server
npm run ollama:pull      # Pull required models
npm run ollama:status    # Check model availability
npm run ollama:benchmark # Run inference benchmark
```

### Database

```bash
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database
npm run db:status        # Check database status
```

### Queue

```bash
npm run queue:start      # Start Redis server
npm run queue:status     # Check queue status
npm run queue:clean      # Clean completed/failed jobs
npm run queue:pause      # Pause all queues
npm run queue:resume     # Resume all queues
```

### Crawling

```bash
npm run crawl:start      # Start crawl4ai service
npm run crawl:test URL   # Test crawl a single URL
npm run crawl:sitemap    # Parse and crawl sitemap
npm run crawl:llms       # Discover and parse llms.txt
```

### Export

```bash
npm run export:csv       # Export all leads to CSV
npm run export:json      # Export all leads to JSON
npm run export:excel     # Export all leads to Excel
npm run export:markdown  # Export all leads to Markdown
npm run export:all       # Export all formats
```

### Docker

```bash
npm run docker:build     # Build Docker image
npm run docker:up        # Start all services (docker compose up)
npm run docker:down      # Stop all services
npm run docker:logs      # View service logs
npm run docker:restart   # Restart all services
npm run docker:clean     # Remove containers and volumes
```

### Testing

```bash
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests
```

### Linting & Formatting

```bash
npm run lint             # TypeScript type check
npm run lint:fix         # Fix linting errors
npm run format           # Format code (Prettier)
npm run format:check     # Check formatting
```

### Utilities

```bash
npm run health           # Check all service health
npm run status           # Show system status
npm run benchmark        # Run performance benchmarks
npm run clean:all        # Clean everything (node_modules, dist, data)
npm run setup            # Initial project setup
```

## Package.json Scripts Configuration

```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "dev:api": "tsx server.ts --api-only",
    "dev:frontend": "vite",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist server.js",

    "worker:crawler": "tsx src/workers/crawler.ts",
    "worker:embedding": "tsx src/workers/embedding.ts",
    "worker:export": "tsx src/workers/export.ts",
    "worker:all": "concurrently \"npm:worker:*\"",

    "ollama:start": "ollama serve",
    "ollama:pull": "ollama pull qwen2.5-coder:32b && ollama pull deepseek-r1 && ollama pull bge-m3",

    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",

    "docker:build": "docker compose build",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
