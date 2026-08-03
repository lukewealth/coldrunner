# System Architecture

## Overview

ColdRunners is a full-stack autonomous business intelligence platform. This document describes the complete system architecture across all phases.

## Phase 1 — Current Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                                                             │
│  React 19 SPA served via Vite dev middleware or static dist │
│  14 view components + terminal overlay + detail modal        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────┴──────────────────────────────────┐
│                       API Layer                              │
│                                                             │
│  Express 4.x server with inline route definitions           │
│  CORS middleware, JSON body parser (10mb limit)              │
│  20+ REST endpoints + MCP tool/resource endpoints           │
└──────────┬──────────────┬───────────────┬───────────────────┘
           │              │               │
    ┌──────┴──────┐ ┌─────┴─────┐ ┌──────┴──────┐
    │   Agent     │ │  Plugin   │ │    MCP      │
    │   Layer     │ │  Layer    │ │   Server    │
    │             │ │           │ │             │
    │ Master      │ │ Registry  │ │ 9 Tools     │
    │ Planner     │ │   │       │ │ 6 Resources │
    │   ├─ GP     │ │   ├─ GPl  │ │             │
    │   ├─ WA     │ │   ├─ FC   │ │ JSON Schema │
    │   ├─ CD     │ │   ├─ Hu   │ │ inputSchema │
    │   ├─ OS     │ │   ├─ Ap   │ │ snake_case  │
    │   └─ DD     │ │   ├─ SA   │ │             │
    │             │ │   └─ PS   │ │ Resources   │
    └──────┬──────┘ └─────┬─────┘ │ scheme://   │
           │              │       └──────┬──────┘
    ┌──────┴──────────────┴──────────────┴──────┐
    │              Service Layer                  │
    │                                            │
    │  Workflow Engine ──→ Master Planner         │
    │  Database Service ──→ In-Memory Map         │
    │  Export Service ──→ CSV/JSON/Excel/MD       │
    │  Config ──→ dotenv + environment            │
    └────────────────────────────────────────────┘
```

### Request Lifecycle

```
1. Client sends POST /api/agents/run-search with SearchCriteria
2. Express route validates and normalizes criteria
3. WorkflowEngine creates WorkflowState, assigns workflowId
4. MasterPlanner.execute() begins sequential agent pipeline
5. Each agent reads context.leads, processes, writes back
6. Agents log progress via context.onLog()
7. PluginRegistry.executePlugin() handles external API calls
8. Results filtered by minRating, minReviews, minOpportunityScore
9. DuplicateDetector removes duplicates
10. Final leads trimmed to targetCount
11. DatabaseService.saveLeads() persists results
12. WorkflowState marked completed
13. Response returned to client with leads + workflowId
```

### Error Handling Strategy

```
Agent Error
    ↓
AgentResult.error populated
    ↓
MasterPlanner catches, logs error
    ↓
WorkflowEngine marks workflow as 'failed'
    ↓
Express route catches
    ↓
Fallback chain:
    1. Gemini AI generates simulated leads
    2. If no Gemini key → generateSimulatedLeads()
    3. Client always receives data
```

## Phase 2 — Local AI Integration

```
┌─────────────────────────────────────────────┐
│              Ollama (Local LLM)              │
│                                             │
│  Qwen2.5-Coder 32B  → Coding tasks         │
│  DeepSeek-R1        → Reasoning/planning    │
│  Gemma 3            → Vision/OCR            │
│  Qwen3 8B           → Fast tasks            │
│  BGE-M3             → Embeddings            │
│  BGE Reranker       → Search reranking      │
└──────────────────┬──────────────────────────┘
                   │ HTTP API (localhost:11434)
┌──────────────────┴──────────────────────────┐
│           LLM Router Service                 │
│                                             │
│  Task classification → Model selection       │
│  Fallback: Ollama → OpenRouter → Cloud      │
│  Rate limiting, retry, circuit breaker       │
└─────────────────────────────────────────────┘
```

## Phase 3 — Queue & Scale

```
┌──────────────┐     ┌──────────┐     ┌──────────────┐
│   NestJS     │────→│  Redis   │────→│   BullMQ     │
│   API        │     │  Cluster │     │   Workers    │
│              │     │          │     │              │
│  Fastify     │     │  Pub/Sub │     │  Planner x2  │
│  Helmet      │     │  Queue   │     │  Crawler x20 │
│  Swagger     │     │  Cache   │     │  Embed x10   │
│  Rate Limit  │     │          │     │  Report x4   │
│  OpenTelem   │     │          │     │  Export x2   │
└──────────────┘     └──────────┘     └──────────────┘
```

## Phase 4 — Enterprise

```
┌─────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                   │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ API Pod │  │ API Pod │  │ API Pod │  ← HPA     │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │             │             │                  │
│  ┌────┴─────────────┴─────────────┴────┐            │
│  │          Service Mesh (Istio)        │            │
│  └────┬─────────────┬─────────────┬────┘            │
│       │             │             │                  │
│  ┌────┴────┐  ┌─────┴─────┐  ┌───┴──────┐          │
│  │Postgres │  │  Qdrant   │  │  Redis   │          │
│  │ Primary │  │  Cluster  │  │  Cluster │          │
│  │+Replica │  │           │  │          │          │
│  └─────────┘  └───────────┘  └──────────┘          │
│                                                     │
│  ┌──────────────────────────────────────┐           │
│  │  Observability Stack                  │           │
│  │  Prometheus + Grafana + Loki + Jaeger │           │
│  └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

## Storage Architecture

| Store | Purpose | Phase |
|-------|---------|-------|
| In-Memory Map | Lead storage, workflow state | 1 (current) |
| SQLite | Persistent local storage | 1 (planned) |
| PostgreSQL | Primary relational database | 3 |
| Redis | Queue, cache, pub/sub | 3 |
| Qdrant | Vector search, embeddings | 2 |
| DuckDB | Analytical queries, aggregations | 3 |
| MinIO | File storage, exports | 4 |

## Network Topology

```
Internet
    │
Traefik / NGINX (reverse proxy)
    │
    ├──→ Next.js (port 3000)
    │        │
    │    ┌───┴───┐
    │    │       │
    │  SSR    API Routes
    │    │       │
    │    └───┬───┘
    │        │
    ├──→ NestJS API (port 4000)
    │        │
    │    ┌───┴────────────────┐
    │    │    │    │    │     │
    │  Auth  CORS  Rate  Swagger
    │    │
    ├──→ Redis (port 6379)
    ├──→ PostgreSQL (port 5432)
    ├──→ Qdrant (port 6333)
    ├──→ Ollama (port 11434)
    └──→ Prometheus (port 9090)
```
