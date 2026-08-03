# ColdRunners — Product Plan

## Vision

ColdRunners is a 100% local-first Agentic AI platform for autonomous business intelligence. It discovers, analyzes, scores, and exports qualified business leads without depending on cloud-only services.

## Product Goals

1. **Local-first AI** — Run entirely on local infrastructure with Ollama, Qwen, DeepSeek
2. **Autonomous agents** — Zero-touch workflow from search to export
3. **Compliant APIs** — Google Places, Firecrawl, Hunter.io, Apollo.io used per ToS
4. **MCP-native** — Model Context Protocol for tool orchestration
5. **Enterprise export** — CSV, JSON, Excel, Markdown, PDF outputs
6. **Scalable architecture** — From single developer to distributed worker pools

## Architecture Principles

- **Event-driven** — Queues decouple agents from API layer
- **Plugin-based** — Every external integration is a swappable plugin
- **Type-safe** — TypeScript end-to-end with strict mode
- **Observable** — Structured logs, workflow traces, health checks
- **Offline-capable** — Fallback to simulated data when APIs are unavailable

## Development Phases

### Phase 1 — Foundation (Current)
- Express server with Vite + React frontend
- In-memory database with agent workflow engine
- Google Places, Firecrawl, Hunter.io, Apollo.io plugins
- MCP server with 9 tools and 6 resources
- Opportunity scoring algorithm
- Multi-format export (CSV, JSON, Excel, Markdown)

### Phase 2 — Local AI Integration
- Ollama integration for local LLM inference
- Qwen2.5-Coder 32B for coding/reasoning tasks
- DeepSeek-R1 for multi-step planning
- BGE-M3 embeddings with Qdrant vector store
- Crawl4AI + Playwright for local web crawling
- llms.txt discovery and parsing pipeline

### Phase 3 — Queue & Scale
- Redis + BullMQ for distributed job queues
- Horizontal worker scaling
- PostgreSQL with Prisma ORM
- DuckDB for analytical queries
- OpenTelemetry + Prometheus + Grafana

### Phase 4 — Enterprise
- Kubernetes deployment manifests
- RBAC with OAuth2/OIDC
- Multi-tenant architecture
- CRM sync (HubSpot, Salesforce)
- Audit logging and compliance (GDPR, PIPEDA, SOC2)

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| MVP with agent workflow | Q3 2025 | Done |
| MCP tool server | Q3 2025 | Done |
| Frontend dashboard | Q3 2025 | Done |
| Export center | Q3 2025 | Done |
| Ollama local LLM | Q4 2025 | Planned |
| Crawl4AI pipeline | Q4 2025 | Planned |
| Redis + BullMQ | Q1 2026 | Planned |
| PostgreSQL migration | Q1 2026 | Planned |
| Vector search (Qdrant) | Q2 2026 | Planned |
| Kubernetes deployment | Q2 2026 | Planned |

## KPIs

- **Lead discovery rate** — Businesses found per minute
- **Data confidence** — Average verification score across leads
- **Agent throughput** — Workflows completed per hour
- **Export accuracy** — Data fidelity across format conversions
- **System uptime** — Platform availability percentage
- **Local inference ratio** — % of AI tasks handled locally vs cloud

## AI Agent Responsibilities

| Agent | Responsibility |
|-------|---------------|
| Master Planner | Orchestrates full workflow, manages agent lifecycle |
| Google Places Discovery | Geospatial business search via compliant API |
| Website Intelligence | Firecrawl scraping, Lighthouse audit, tech detection |
| Contact Discovery | Hunter.io + Apollo.io email/contact enrichment |
| Opportunity Scorer | 0-100 scoring with HOT/WARM/COLD classification |
| Duplicate Detector | Deduplication by phone, name, address, website, Place ID |
| Report Generator | Markdown/summary report creation |
| Export Agent | Multi-format data export |
| Crawler Agent (Phase 2) | Crawl4AI + Playwright web crawling |
| Embedding Agent (Phase 2) | BGE-M3 vector embedding generation |
| llms.txt Agent (Phase 2) | llms.txt discovery and parsing |
