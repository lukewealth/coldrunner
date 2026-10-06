# ColdRunners

**Agentic business-intelligence platform that discovers, analyzes, scores, and exports qualified business leads.**

Local-first multi-agent system built with TypeScript, Express, React, and MCP. A Master Planner orchestrates specialist agents that call compliant external APIs, score opportunities, and expose tools/resources over the Model Context Protocol.

> **Honesty note:** This README describes what is implemented in the repository and what is planned. It does not claim production scale, customer volume, uptime SLAs, or business outcomes unless those are measured and documented.

## Problem

Finding and qualifying business leads is slow and fragmented. Sales and growth teams manually search directories, scrape websites, enrich contacts, and score fit — work that is repetitive, error-prone, and hard to scale without burning API budget or violating terms of service.

## Solution

ColdRunners automates the lead-research workflow with a hierarchical agent system:

1. Discover businesses (location + category)
2. Analyze websites and technical signals
3. Enrich contacts
4. Score opportunity (0–100, HOT / WARM / COLD)
5. Deduplicate and export

An MCP server exposes the same capabilities as tools and resources so external agents and assistants can drive the platform programmatically. The system degrades gracefully when API keys are missing (simulated fallback data).

## Architecture

### Current (Phase 1 — implemented)

```
React Frontend (Vite + Tailwind)
         │
    Express Server
         │
    ┌────┼────────────────┐
    │    │                │
  Agents Plugins       MCP Server
    │    │                │
    └────┼────────────────┘
         │
   Workflow Engine
         │
   In-Memory / SQLite-ready DB
```

**Agent hierarchy (implemented):**

- Master Planner — orchestrates the full workflow
- Google Places Discovery Agent
- Website Intelligence Agent (Firecrawl + PageSpeed)
- Contact Discovery Agent (Hunter / Apollo)
- Opportunity Scoring Agent
- Duplicate Detection Agent

**MCP layer (implemented):** 9 tools + 6 resources (see `docs/mcp.md`).

### Target (Phase 2–4 — roadmap)

PostgreSQL, Qdrant / vector layer, local models via Ollama, additional agents (crawler, embedding, SEO, revenue estimation, report generator), queues, stronger observability. See `ARCHITECTURE.md` and `docs/roadmap.md`.

## Features

- **Autonomous agent workflow** — Master Planner + 5 specialist agents
- **MCP server** — 9 tools + 6 resources for external agent integration
- **Compliant API plugins** — Google Places, Firecrawl, Hunter.io, Apollo.io, PageSpeed Insights
- **Opportunity scoring** — 0–100 algorithm with HOT / WARM / COLD classification
- **Multi-format export** — CSV, JSON, Excel, Markdown
- **Real-time dashboard** — lead explorer, campaign builder, reports, terminal logs
- **Graceful degradation** — runs without API keys using simulated fallback data
- **Plugin health checks** and structured workflow logging

## Tech stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.8 |
| Backend | Express 4, Node.js |
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| Charts / UI | Recharts, Motion, Lucide |
| AI | Google Gemini (`@google/genai`); Ollama planned |
| Protocol | Model Context Protocol (MCP) |
| Data | In-memory + better-sqlite3 path ready |
| APIs | Google Places, Firecrawl, Hunter.io, Apollo.io, PageSpeed |
| Tooling | tsx, esbuild, Docker Compose (supporting services) |

## Repository structure

```
.
├── server.ts                 # Express entry + routes
├── src/
│   ├── server/
│   │   ├── agents/           # Master Planner + specialist agents
│   │   ├── plugins/          # API integrations
│   │   ├── mcp/              # MCP server (tools + resources)
│   │   └── services/         # DB, export, workflow
│   └── ...                   # Frontend components & views
├── docs/                     # Engineering handbook
├── ARCHITECTURE.md
├── AGENTS.md
├── PLAN.md
├── docker-compose.yaml
├── .env.example
└── package.json
```

See `docs/` for deeper backend, frontend, API, MCP, agents, and roadmap docs.

## Installation

```bash
git clone https://github.com/lukewealth/coldrunner.git
cd coldrunner
npm install
cp .env.example .env
# Edit .env with your keys (optional — system falls back to simulated data)
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example`. Key variables:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | LLM calls |
| `GOOGLE_PLACES_API_KEY` | Business discovery |
| `GOOGLE_PAGESPEED_API_KEY` | Performance audits |
| `FIRECRAWL_API_KEY` | Website scraping |
| `HUNTER_API_KEY` / `APOLLO_API_KEY` | Contact enrichment |
| `PORT` | Server port (default 3000) |
| `DB_PATH` | SQLite path when enabled |
| `MAX_CONCURRENT_AGENTS` / `AGENT_TIMEOUT` / `AGENT_RETRY_ATTEMPTS` | Agent runtime |
| `CACHE_*` | Cache behaviour |

Never commit real secrets. Prefer a secret manager in any shared or production environment.

## Usage

```bash
npm run dev      # Development (tsx server.ts)
npm run build    # Production build (Vite + esbuild)
npm run start    # Run production server
npm run lint     # TypeScript check (`tsc --noEmit`)
npm run clean    # Remove build artifacts
```

Drive the UI for interactive workflows, or call the MCP tools/resources from compatible clients (see `docs/mcp.md`).

## Testing

Current status: TypeScript type-checking via `npm run lint`. Automated unit/integration test suite is limited; treat behaviour verification as manual + type-level for now.

**Recommended next steps:** unit tests for scoring and deduplication, plugin contract tests with mocked APIs, and lightweight end-to-end smoke tests for the main workflow.

## Deployment

- Local / self-host: `npm run build && npm run start`
- Demo deployment has been used on Vercel (`coldrunner-ten.vercel.app` — confirm current status)
- Supporting services (e.g. SearXNG) via `docker-compose.yaml`

Production hardening (auth, rate limits, persistent DB, observability) is part of the roadmap, not claimed as complete.

## Security

- API keys and secrets must come from environment variables or a managed secret store.
- Do not commit `.env` or any real credentials.
- MCP tools and agent plugins should be treated as privileged: constrain what external callers can invoke.
- Prompt-injection and tool-permission boundaries for agentic systems remain an active design concern; document and enforce allow-lists as the tool surface grows.
- Review `.gitignore` and remove any accidentally committed secrets from history if present.

## Limitations

- Phase 1 storage is in-memory / SQLite-ready, not a full multi-tenant production database.
- Some enrichment quality depends on third-party API availability and quotas.
- Local LLM path (Ollama) is planned, not the primary runtime today.
- Automated test coverage is not yet comprehensive.
- Not a claim of compliance certification (SOC2, etc.).

## Current status

**Active engineering / portfolio proof-of-work project.**  
Phase 1 agent workflow, MCP server, plugins, dashboard, and export paths are present in the repository. Verify any specific claim against the current source tree and docs before using it in a CV or interview.

## Roadmap

High-level (see `docs/roadmap.md` and `ARCHITECTURE.md` for detail):

- Persistent PostgreSQL + vector store (Qdrant)
- Local model routing (Ollama)
- Additional agents (crawler, embeddings, SEO, revenue estimation, report generation)
- Stronger evaluation, observability, and security controls
- Queue-backed async export and outreach flows

## Keywords

`ai` `artificial-intelligence` `agentic-ai` `ai-agents` `llm` `mcp` `model-context-protocol` `typescript` `nodejs` `express` `react` `backend` `api` `automation` `software-architecture` `workflow-orchestration` `business-intelligence`

## License

Proprietary — ColdRunners
