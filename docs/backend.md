# Backend Standards

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 22+ |
| Language | TypeScript | 5.8+ |
| Framework | Express | 4.x |
| Build | esbuild + Vite | Latest |
| Config | dotenv | 17.x |

## Project Structure

```
src/server/
├── config/
│   └── index.ts              # Centralized configuration
├── types.ts                   # All backend TypeScript types
├── plugins/                   # External API integrations
│   ├── base.ts               # Plugin interface
│   ├── google-places.ts      # Google Places API
│   ├── firecrawl.ts          # Web scraping
│   ├── contact-discovery.ts  # Hunter.io + Apollo.io
│   ├── social-analyzer.ts    # Social media analysis
│   ├── pagespeed.ts          # PageSpeed Insights
│   └── index.ts              # PluginRegistry class
├── agents/                    # Autonomous agent system
│   ├── types.ts              # Agent, AgentContext, AgentResult
│   ├── master-planner.ts     # Orchestrator
│   ├── google-places.ts      # Discovery agent
│   ├── website-analyzer.ts   # Website audit agent
│   ├── contact-discovery.ts  # Contact enrichment agent
│   ├── opportunity-scorer.ts # Scoring agent
│   ├── duplicate-detector.ts # Deduplication agent
│   └── index.ts              # Agent exports
├── mcp/
│   └── server.ts             # MCP server implementation
├── services/
│   ├── database.ts           # Data persistence layer
│   ├── export.ts             # Multi-format export
│   └── workflow.ts           # Workflow engine
└── routes/                   # (Future) Modular route files
```

## Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  initialize(): Promise<void>;
  execute(params: any): Promise<PluginResult>;
  healthCheck(): Promise<boolean>;
}

interface PluginResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence: number;
  source: string;
  timestamp: Date;
}
```

### Plugin Rules

1. Implement `Plugin` interface
2. Initialize asynchronously via `initialize()`
3. Provide `healthCheck()` method
4. Degrade gracefully when API keys are missing
5. Do not cache across workflow runs
6. All execution through `pluginRegistry.executePlugin(name, params)`

### Adding a New Plugin

```typescript
// src/server/plugins/my-plugin.ts
import { Plugin, PluginResult } from '../types';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'Description of what this plugin does';

  async initialize(): Promise<void> {
    // Load config, validate API keys
  }

  async execute(params: any): Promise<PluginResult> {
    try {
      // Execute logic
      return {
        success: true,
        data: result,
        confidence: 95,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    // Check API connectivity
    return true;
  }
}
```

Register in `src/server/plugins/index.ts`:

```typescript
const pluginInstances: Plugin[] = [
  new GooglePlacesPlugin(),
  new FirecrawlPlugin(),
  new MyPlugin(),  // Add here
];
```

## Agent Interface

```typescript
interface Agent {
  name: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

interface AgentContext {
  taskId: string;
  criteria: SearchCriteria;
  leads: BusinessLead[];
  logs: WorkflowLog[];
  onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;
}

interface AgentResult {
  success: boolean;
  itemsProcessed: number;
  leads?: BusinessLead[];
  error?: string;
}
```

### Agent Rules

1. Log progress via `context.onLog()`
2. Operate on `context.leads` — do not modify other agents' leads directly
3. Handle errors gracefully, report via `AgentResult.error`
4. Be idempotent
5. Respect `criteria.targetCount` as upper bound
6. Use Plugin Registry for external API calls

## Database Service

Current implementation uses in-memory `Map<string, BusinessLead>`. Designed for drop-in replacement with SQLite or PostgreSQL.

### Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Setup connection |
| `saveLeads(leads)` | Persist leads |
| `getLead(id)` | Get single lead |
| `getAllLeads()` | Get all leads |
| `updateLead(id, updates)` | Partial update |
| `deleteLead(id)` | Remove lead |
| `searchLeads(query)` | Filter leads |
| `saveWorkflow(criteria, leads, logs)` | Save workflow |
| `getWorkflow(id)` | Get workflow |
| `getAllWorkflows()` | List workflows |
| `addSearchHistory(criteria, count)` | Log search |
| `getSearchHistory()` | Get history |
| `getStats()` | Platform statistics |
| `clearAll()` | Reset all data |

## Export Service

Supports 4 formats:

| Format | Method | MIME Type |
|--------|--------|-----------|
| CSV | `generateCSV(leads, options)` | text/csv |
| JSON | `generateJSON(leads, city)` | application/json |
| Excel | `generateExcelXML(leads)` | application/vnd.ms-excel |
| Markdown | `generateMarkdown(leads, city)` | text/markdown |

## Configuration

Centralized in `src/server/config/index.ts`:

```typescript
export const config = {
  port: number,
  nodeEnv: string,
  apiKeys: {
    gemini: string,
    googlePlaces: string,
    firecrawl: string,
    hunter: string,
    apollo: string,
    clearbit: string,
    pagespeed: string,
  },
  database: { path: string },
  agents: {
    maxConcurrent: number,
    timeout: number,
    retryAttempts: number,
  },
  search: {
    defaultRadius: number,
    defaultTargetCount: number,
    minRating: number,
    minReviews: number,
  },
  export: { outputDir: string },
};
```

## Error Handling

- Plugins return `PluginResult` with `success: false` and `error` message
- Agents return `AgentResult` with `success: false` and `error` message
- Express routes catch errors and return JSON with `error` field
- Fallback chain: Agent workflow → Gemini AI → Simulated data
- No unhandled exceptions should reach the client

## Logging

Structured workflow logs via `WorkflowLog`:

```typescript
interface WorkflowLog {
  id: string;
  timestamp: Date;
  agent: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
```

## Phase 2+ Backend Migration

### NestJS Migration Path

```
Express → NestJS
─────────────────
Inline routes → Module-based controllers
Manual middleware → NestJS guards, interceptors, pipes
Manual DI → NestJS dependency injection
Manual error handling → Exception filters
No validation → class-validator + ValidationPipe
```

### PostgreSQL Migration

```typescript
// Replace in-memory Map with Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schema (prisma/schema.prisma)
model BusinessLead {
  id              String   @id
  name            String
  category        String
  city            String
  province        String
  country         String
  rating          Float
  reviewCount     Int
  opportunityScore Int
  grade           String
  status          String
  website         String
  websiteStatus   String
  phone           String
  email           String
  createdAt       DateTime @default(now())
  lastUpdated     DateTime @updatedAt
}
```
