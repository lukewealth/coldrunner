# ColdRunners — System Architecture

## Overview

Full-stack autonomous business intelligence system with agentic workflow, MCP integration, and compliant API usage. Local-first design with optional cloud services.

## Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Vite + React 19 + Tailwind CSS 4 + Recharts + Motion   │
│                                                         │
│  Dashboard │ Explorer │ Analyzer │ Campaigns │ Reports   │
│  Search    │ Intelligence │ Exports │ Settings │ Memory  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────┴────────────────────────────────┐
│                   Express Server                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Agents   │  │ Plugins  │  │    MCP Server        │  │
│  │           │  │          │  │  9 tools, 6 resources│  │
│  │ Master    │  │ Google   │  │                      │  │
│  │ Planner   │  │ Places   │  │  discover_businesses │  │
│  │     │     │  │ Firecrawl│  │  analyze_website     │  │
│  │ ┌───┴───┐ │  │ Hunter   │  │  discover_contacts   │  │
│  │ │Agents │ │  │ Apollo   │  │  run_pagespeed       │  │
│  │ │ 6     │ │  │ Social   │  │  get_leads           │  │
│  │ └───────┘ │  │ PageSpeed│  │  export_leads        │  │
│  └──────────┘  └──────────┘  │  get_stats            │  │
│                               │  geocode_location     │  │
│  ┌──────────────────────┐    │  check_plugin_health  │  │
│  │   Workflow Engine     │    └──────────────────────┘  │
│  │   Queue │ State │ Log │                              │
│  └──────────┬───────────┘                              │
│             │                                           │
│  ┌──────────┴───────────┐                              │
│  │   Database Service    │                              │
│  │   In-Memory (SQLite)  │                              │
│  └──────────────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## Target Architecture (Phase 2-4)

```
                       ColdRunners
                           │
              ┌────────────┴────────────┐
              │                         │
         Next.js UI               MCP Gateway
              │                         │
              └────────────┬────────────┘
                           │
                   Master AI Planner
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
 Search Agents      Research Agents     Intelligence Agents
      │                    │                    │
 Google Places      Crawl4AI             Opportunity Score
 Playwright         Firecrawl            Revenue Estimate
 Browser            llms.txt             Contact Discovery
 Sitemaps           Markdown             SEO Analysis
 Robots.txt         Embeddings           Report Generator
                           │
                     Vector Layer
                  Qdrant + DuckDB
                           │
                     PostgreSQL
                           │
                  Excel / JSON / MD / PDF
```

## Backend Structure

```
src/server/
├── config/
│   └── index.ts              # Environment configuration
├── types.ts                   # Core TypeScript types
├── plugins/                   # Compliant API integrations
│   ├── base.ts               # Base plugin interface
│   ├── google-places.ts      # Google Places API
│   ├── firecrawl.ts          # Web scraping & Lighthouse
│   ├── contact-discovery.ts  # Hunter.io & Apollo.io
│   ├── social-analyzer.ts    # Social media analysis
│   ├── pagespeed.ts          # Google PageSpeed Insights
│   └── index.ts              # Plugin registry
├── agents/                    # Autonomous agent system
│   ├── types.ts              # Agent interfaces
│   ├── master-planner.ts     # Orchestrates full workflow
│   ├── google-places.ts      # Business discovery agent
│   ├── website-analyzer.ts   # Website audit agent
│   ├── contact-discovery.ts  # Contact enrichment agent
│   ├── opportunity-scorer.ts # Lead scoring agent
│   ├── duplicate-detector.ts # Deduplication agent
│   └── index.ts              # Agent exports
├── mcp/
│   └── server.ts             # MCP server (9 tools, 6 resources)
├── services/
│   ├── database.ts           # In-memory database (SQLite-ready)
│   ├── export.ts             # CSV, JSON, Excel, Markdown export
│   └── workflow.ts           # Workflow engine
└── routes/                   # (Future) Express route modules

server.ts                      # Main Express server with all API routes
```

## Frontend Structure

```
src/
├── App.tsx                    # Root component with state management
├── types.ts                   # Shared TypeScript types
├── components/
│   ├── Navbar.tsx             # Top navigation bar
│   ├── DashboardView.tsx      # Overview dashboard
│   ├── SearchWizardView.tsx   # Multi-step search wizard
│   ├── BusinessExplorerView.tsx # Lead table with filtering
│   ├── BusinessDetailModal.tsx  # Lead detail modal
│   ├── WebsiteAnalyzerView.tsx  # Single website analysis
│   ├── LeadIntelligenceView.tsx # Lead analytics & charts
│   ├── CampaignBuilderView.tsx  # Multi-channel campaign builder
│   ├── ReportsView.tsx        # Report generation
│   ├── ExportCenterView.tsx   # Multi-format export
│   ├── AgentMemoryView.tsx    # Agent memory & knowledge
│   ├── SettingsView.tsx       # Platform settings
│   ├── TerminalLogsOverlay.tsx  # Real-time log overlay
│   └── Logo.tsx               # Brand logo component
├── data/
│   ├── mockLeads.ts           # Initial mock data
│   └── initialLogs.ts         # Initial terminal logs
└── services/
    └── crmService.ts          # CRM integration service
```

## Autonomous Workflow

```
User Request
    ↓
Master Planner Agent
    ↓
┌─────────────────────────────────────────┐
│ 1. Google Places Discovery Agent        │
│    - Geocode city                       │
│    - Nearby Search / Text Search        │
│    - Place Details enrichment           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Website Intelligence Agent           │
│    - Firecrawl scraping                 │
│    - Lighthouse audit                   │
│    - Tech stack detection               │
│    - SSL verification                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Contact Discovery Agent              │
│    - Hunter.io email discovery          │
│    - Apollo.io contact enrichment       │
│    - Social media profile discovery     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Opportunity Scoring Agent            │
│    - Calculate 0-100 score              │
│    - Classify HOT/WARM/COLD             │
│    - Generate recommendations           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. Duplicate Detection Agent            │
│    - Remove duplicates by phone,        │
│      name, address, website, Place ID   │
└─────────────────────────────────────────┘
    ↓
Filtered & Scored Leads → Database → Export
```

## Data Flow

```
External APIs          Agent System           Storage           Output
─────────────          ────────────           ───────           ──────
Google Places  ──→  Discovery Agent  ──→  In-Memory DB  ──→  CSV
Firecrawl      ──→  Website Agent    ──→  SQLite (soon) ──→  JSON
Hunter.io      ──→  Contact Agent    ──→  PostgreSQL    ──→  Excel
Apollo.io      ──→  Scoring Agent    ──→  Qdrant        ──→  Markdown
PageSpeed      ──→  Dedup Agent      ──→  DuckDB        ──→  PDF
```

## Plugin System

| Plugin | API | Purpose |
|--------|-----|---------|
| google-places | Google Places API | Business discovery, geocoding |
| firecrawl | Firecrawl API | Web scraping, tech detection |
| hunter | Hunter.io API | Email discovery |
| apollo | Apollo.io API | Contact enrichment |
| social-analyzer | Multi-platform | Social profile analysis |
| pagespeed | PageSpeed Insights | Performance/SEO audit |

## MCP Integration

9 tools exposed via MCP protocol:

1. `discover_businesses` — Full autonomous workflow
2. `analyze_website` — Website analysis
3. `discover_contacts` — Contact discovery
4. `run_pagespeed` — PageSpeed audit
5. `get_leads` — Lead retrieval
6. `export_leads` — Multi-format export
7. `get_stats` — Platform statistics
8. `geocode_location` — Geocoding
9. `check_plugin_health` — Health check

6 resources available:

- `leads://all` — All leads
- `leads://hot` — HOT leads only
- `stats://platform` — Statistics
- `agents://status` — Agent status
- `plugins://health` — Plugin health
- `workflows://active` — Active workflows

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript | Type safety, ecosystem |
| Backend | Express | Mature, flexible, large ecosystem |
| Frontend | React + Vite | Fast HMR, component model |
| Styling | Tailwind CSS 4 | Utility-first, rapid prototyping |
| AI | Gemini → Ollama | Cloud fallback, local-first goal |
| Protocol | MCP | Standard tool integration |
| Database | In-memory → PostgreSQL | Fast start, enterprise ready |
| Build | esbuild + Vite | Fast builds, tree shaking |
