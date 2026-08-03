# Scalability Guide

## Current Architecture (Phase 1)

Single-process Express server with in-memory database. Suitable for development and small-scale usage.

**Limits:**
- Single workflow at a time
- In-memory data lost on restart
- No horizontal scaling
- API rate limits apply per-process

## Phase 2 — Worker Scaling

### Architecture

```
                    ┌──────────────┐
                    │   API Server │
                    │   (NestJS)   │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │    Redis     │
                    │  (Queue)     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
   │  Crawler    │ │  Embedding  │ │  Export     │
   │  Worker x20 │ │  Worker x10 │ │  Worker x2  │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Worker Pool Configuration

| Worker Type | Count | Memory | CPU |
|-------------|-------|--------|-----|
| Planner | 2 | 512MB | 1 core |
| Crawler | 20 | 256MB each | 0.5 core each |
| Embedding | 10 | 512MB each | 1 core each |
| Report | 4 | 256MB each | 0.5 core each |
| Export | 2 | 256MB each | 0.5 core each |

### BullMQ Queue Setup

```typescript
import { Queue, Worker } from 'bullmq';

const crawlQueue = new Queue('crawl', { connection: { host: 'localhost', port: 6379 } });

const crawlWorker = new Worker('crawl', async (job) => {
  const { url } = job.data;
  const result = await crawl4ai.crawl(url);
  return result;
}, {
  concurrency: 20,
  connection: { host: 'localhost', port: 6379 },
});
```

## Phase 3 — Database Scaling

### PostgreSQL

```
Primary (read/write)
    │
    ├──→ Replica 1 (read-only)
    ├──→ Replica 2 (read-only)
    └──→ Replica 3 (read-only)
```

### Connection Pooling

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  log: ['query', 'info', 'warn', 'error'],
});
```

### Redis Cluster

```
Redis Node 1 (Master)
    │
    ├──→ Redis Node 2 (Replica)
    ├──→ Redis Node 3 (Master)
    └──→ Redis Node 4 (Replica)
```

## Phase 4 — Kubernetes

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: coldrunners-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: coldrunners-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Resource Limits

```yaml
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "1000m"
    memory: "512Mi"
```

## Performance Targets

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Workflows/hour | 10 | 200 | 2,000 | 20,000 |
| API latency (p95) | 500ms | 200ms | 100ms | 50ms |
| Crawl throughput | 1/min | 50/min | 500/min | 5,000/min |
| Data storage | 10K leads | 1M leads | 10M leads | 100M leads |
| Uptime | 95% | 99% | 99.9% | 99.99% |

## Bottleneck Analysis

### Current Bottlenecks

1. **Sequential agent execution** — Agents run one after another
2. **In-memory database** — No persistence, limited by RAM
3. **Single process** — No parallelism
4. **External API rate limits** — Google Places, Firecrawl, etc.

### Solutions by Phase

| Phase | Solution |
|-------|----------|
| 2 | Parallel agent execution where possible |
| 2 | Redis queue for async processing |
| 3 | PostgreSQL for persistent, scalable storage |
| 3 | Read replicas for query distribution |
| 4 | Kubernetes for auto-scaling |
| 4 | CDN for static assets |
| 4 | Caching layer (Redis) for frequent queries |

## Caching Strategy

```
API Request
    ↓
Check Redis cache
    ├─ Hit → Return cached response
    └─ Miss → Execute query
                ↓
              Store in Redis (TTL: 5 min)
                ↓
              Return response
```

### Cache Keys

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `lead:{id}` | 5 min | Single lead data |
| `leads:search:{hash}` | 2 min | Search results |
| `stats:platform` | 1 min | Platform statistics |
| `plugin:health` | 30 sec | Plugin health status |
