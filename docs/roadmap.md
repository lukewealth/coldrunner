# Roadmap

## Phase 1 — Foundation (Current)

**Status:** Complete

- [x] Express server with API routes
- [x] React frontend with Vite + Tailwind
- [x] Agent workflow engine (6 agents)
- [x] Plugin system (6 plugins)
- [x] MCP server (9 tools, 6 resources)
- [x] Opportunity scoring algorithm
- [x] Multi-format export (CSV, JSON, Excel, Markdown)
- [x] Dashboard, Explorer, Analyzer, Campaign Builder
- [x] Terminal logs overlay
- [x] Gemini AI integration with fallback
- [x] In-memory database
- [x] Engineering documentation

## Phase 2 — Local AI Integration

**Target:** Q4 2025

- [ ] Ollama integration for local LLM inference
- [ ] Qwen2.5-Coder 32B for coding/reasoning
- [ ] DeepSeek-R1 for multi-step planning
- [ ] Gemma 3 for vision/OCR tasks
- [ ] BGE-M3 embeddings via Ollama
- [ ] LLM Router service with fallback chain
- [ ] Crawl4AI Python worker
- [ ] Playwright browser automation
- [ ] llms.txt discovery agent
- [ ] Sitemap.xml parsing
- [ ] Content cleaning pipeline
- [ ] Qdrant vector database setup
- [ ] Vector search API endpoint
- [ ] Prompt template system
- [ ] Response caching layer

## Phase 3 — Queue & Scale

**Target:** Q1 2026

- [ ] NestJS migration from Express
- [ ] PostgreSQL with Prisma ORM
- [ ] Redis + BullMQ job queues
- [ ] Horizontal worker scaling
- [ ] DuckDB for analytical queries
- [ ] OpenTelemetry instrumentation
- [ ] Prometheus + Grafana monitoring
- [ ] Loki log aggregation
- [ ] Jaeger distributed tracing
- [ ] Sentry error tracking
- [ ] JWT authentication
- [ ] RBAC authorization
- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet security headers
- [ ] Input validation (zod)
- [ ] Docker Compose for all services
- [ ] CI/CD pipeline (GitHub Actions)

## Phase 4 — Enterprise

**Target:** Q2 2026

- [ ] Kubernetes deployment manifests
- [ ] Helm charts
- [ ] Istio service mesh
- [ ] Multi-tenant architecture
- [ ] CRM sync (HubSpot, Salesforce)
- [ ] Audit logging
- [ ] GDPR compliance tools
- [ ] PIPEDA compliance
- [ ] SOC2 readiness documentation
- [ ] HashiCorp Vault for secrets
- [ ] CDN for static assets
- [ ] Database read replicas
- [ ] Connection pooling
- [ ] Horizontal Pod Autoscaling
- [ ] Disaster recovery plan
- [ ] Penetration testing
- [ ] Performance benchmarking suite

## Phase 5 — Advanced AI

**Target:** Q3 2026

- [ ] Knowledge graph construction
- [ ] RAG (Retrieval Augmented Generation) pipeline
- [ ] Fine-tuned business analysis model
- [ ] Multi-modal analysis (screenshots + text)
- [ ] Autonomous campaign execution
- [ ] AI-powered lead qualification
- [ ] Predictive scoring (ML model)
- [ ] Revenue estimation model
- [ ] Competitor analysis agent
- [ ] Market trend detection
- [ ] Natural language search interface
- [ ] AI-generated reports with charts
- [ ] Voice interface for search

## Feature Backlog

### High Priority

- [ ] SQLite persistence (replace in-memory)
- [ ] Search history UI
- [ ] Lead status management (CRM pipeline)
- [ ] Batch email sending
- [ ] Email template library
- [ ] A/B testing for campaigns
- [ ] Lead scoring customization
- [ ] Custom agent workflows
- [ ] Webhook notifications
- [ ] API key management UI

### Medium Priority

- [ ] Dark mode
- [ ] Internationalization (i18n)
- [ ] Mobile-responsive bottom navigation
- [ ] Keyboard shortcuts
- [ ] Data import (CSV, JSON)
- [ ] Lead merge/dedup UI
- [ ] Custom fields per lead
- [ ] Tag/label system
- [ ] Saved searches
- [ ] Scheduled searches

### Low Priority

- [ ] Desktop app (Electron)
- [ ] CLI tool
- [ ] Browser extension
- [ ] Slack/Discord integration
- [ ] Zapier/Make integration
- [ ] Public API documentation (Swagger)
- [ ] GraphQL API alternative
- [ ] WebSocket real-time updates
- [ ] Offline mode
- [ ] PWA support

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-07 | Initial release with agent workflow |
| 1.1.0 | 2025-07 | MCP server, 9 tools, 6 resources |
| 1.2.0 | 2025-08 | Engineering handbook documentation |
