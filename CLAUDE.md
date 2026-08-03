# CLAUDE.md — ColdRunners AI Coding Guide

## Project Overview

ColdRunners is an autonomous business intelligence platform. Express backend + React frontend + MCP server + agentic workflow engine. TypeScript throughout.

## Tech Stack

- **Runtime:** Node.js 22+, TypeScript 5.8+
- **Backend:** Express 4.x, Vite 6.x (SSR dev mode)
- **Frontend:** React 19, Tailwind CSS 4, Recharts, Motion, Lucide React
- **AI:** Google Gemini API (with local Ollama planned)
- **Protocol:** MCP (Model Context Protocol)
- **Build:** esbuild (server bundle), Vite (client bundle)

## Commands

```bash
npm run dev        # Start dev server (tsx server.ts)
npm run build      # Production build (vite + esbuild)
npm run start      # Run production server
npm run lint       # Type check (tsc --noEmit)
npm run clean      # Remove dist/ and server.js
```

## Project Structure

```
coldrunners-business-finder/
├── server.ts                    # Express entry point, all API routes
├── src/
│   ├── App.tsx                  # React root component
│   ├── types.ts                 # Frontend TypeScript types
│   ├── components/              # React UI components (14 views)
│   ├── data/                    # Mock data and initial state
│   ├── services/                # Frontend services (CRM)
│   └── server/
│       ├── agents/              # Autonomous agent system (6 agents)
│       ├── plugins/             # External API integrations (6 plugins)
│       ├── mcp/                 # MCP server (9 tools, 6 resources)
│       ├── services/            # Backend services (database, export, workflow)
│       ├── config/              # Environment configuration
│       └── types.ts             # Backend TypeScript types
├── docs/                        # Engineering handbook
├── data/                        # Runtime data directory
├── exports/                     # Export output directory
└── dist/                        # Build output
```

## Code Conventions

- TypeScript strict mode, ES2022 target
- ES modules (`"type": "module"`)
- No comments unless explaining non-obvious logic
- Use existing type definitions from `src/server/types.ts` and `src/types.ts`
- Plugin pattern: implement `Plugin` interface with `initialize()`, `execute()`, `healthCheck()`
- Agent pattern: implement `Agent` interface with `execute(context)` returning `AgentResult`
- All API routes defined inline in `server.ts`
- Environment variables via `dotenv` from `.env`

## Key Patterns

### Adding a New Plugin
1. Create file in `src/server/plugins/`
2. Implement `Plugin` interface from `src/server/types.ts`
3. Register in `src/server/plugins/index.ts` PluginRegistry

### Adding a New Agent
1. Create file in `src/server/agents/`
2. Implement agent with `execute(context, onLog)` method
3. Register in `MasterPlannerAgent` agents map
4. Add status entry in `initializeStatuses()`

### Adding a New MCP Tool
1. Add tool definition in `src/server/mcp/server.ts` `registerTools()`
2. Define `name`, `description`, `inputSchema`, `handler`
3. Tool is automatically available via `/api/mcp/tools/:toolName`

### Adding a New API Route
1. Add route handler in `server.ts`
2. Follow existing pattern: `app.get/post/put/delete('/api/...', handler)`
3. Use existing services (database, exportService, etc.)

## Testing

Currently no test framework configured. When adding tests:
- Use Vitest (matches Vite ecosystem)
- Place tests adjacent to source: `*.test.ts`
- Mock external APIs, test agent logic in isolation

## Important Notes

- Server runs on port 3000 by default (configurable via PORT env)
- Vite HMR is disabled when `DISABLE_HMR=true` (for AI Studio compatibility)
- Database is in-memory; designed for SQLite/PostgreSQL swap
- Gemini API is optional; system falls back to simulated data
- All external API keys are optional; plugins degrade gracefully
