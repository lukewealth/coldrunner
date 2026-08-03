# Server Design

## Overview

ColdRunners runs as a single Express server that serves both the API and the React frontend. In production, the frontend is pre-built and served as static files.

## Bootstrap Lifecycle

```
1. Load environment variables (dotenv)
2. Create Express app
3. Configure middleware (CORS, JSON body parser)
4. Initialize Plugin Registry
5. Initialize Database Service
6. Initialize MCP Server
7. Register API routes
8. Mount Vite dev middleware (dev) or static files (prod)
9. Start listening on PORT
10. Log startup information
```

## Server Entry Point

**File:** `server.ts`

```typescript
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(corsMiddleware);

  // Initialize services
  await pluginRegistry.initialize();
  await database.initialize();
  await mcpServer.initialize();

  // Register routes...

  // Vite / Static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile('dist/index.html'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ColdRunners listening on http://0.0.0.0:${PORT}`);
  });
}
```

## Middleware Stack

```
Request
  ↓
CORS Middleware (Access-Control-*)
  ↓
JSON Body Parser (10mb limit)
  ↓
Route Handler
  ↓
Response
```

### CORS Configuration

```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

## AI Integration

### Gemini AI (Current)

```typescript
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
};
```

### Ollama (Phase 2)

```typescript
const getLocalAi = async (model: string, prompt: string) => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  return response.json();
};
```

## Fallback Chain

```
Agent Workflow (Google Places + Firecrawl + Hunter + Apollo)
    ↓ (error?)
Gemini AI generates simulated leads
    ↓ (no API key?)
generateSimulatedLeads() returns deterministic mock data
    ↓
Client always receives data
```

## Route Organization

All routes are defined inline in `server.ts`. Future migration to modular route files:

```
src/server/routes/
├── agents.ts       # /api/agents/*
├── mcp.ts          # /api/mcp/*
├── leads.ts        # /api/leads/*
├── export.ts       # /api/export/*
├── system.ts       # /api/health, /api/stats, etc.
├── workflows.ts    # /api/workflows/*
└── crm.ts          # /api/crm/*
```

## Phase 2+ Server Migration

### NestJS Migration

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000, '0.0.0.0');
}
```

### Production Hardening

```typescript
// Add to Express server
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(compression());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
```

## Health Checks

```
GET /api/health
    ↓
Check plugin registry
    ↓
Check database connection
    ↓
Check Ollama connectivity (Phase 2)
    ↓
Return status + component health
```

## Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Cancel active workflows
  // Close database connections
  // Close Redis connections (Phase 3)
  process.exit(0);
});
```
