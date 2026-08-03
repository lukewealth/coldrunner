# Monitoring & Observability

## Current State (Phase 1)

- Console.log for server events
- Workflow logs stored in-memory
- Health check endpoint at `/api/health`
- Agent status endpoint at `/api/agents/status`
- Plugin health endpoint at `/api/plugins/health`

## Target Observability Stack

```
┌─────────────────────────────────────────────────┐
│                  Grafana                         │
│  Dashboards │ Alerts │ Annotations │ Variables   │
└──────┬──────────┬───────────┬───────────────────┘
       │          │           │
  ┌────┴────┐ ┌───┴───┐ ┌────┴────┐
  │Prometheus│ │ Loki  │ │ Jaeger  │
  │ Metrics  │ │ Logs  │ │ Traces  │
  └────┬─────┘ └───┬───┘ └────┬────┘
       │           │          │
       └───────────┴──────────┘
                   │
          ┌────────┴────────┐
          │  OpenTelemetry  │
          │    SDK          │
          │                 │
          │  ColdRunners    │
          │  Application    │
          └─────────────────┘
```

## Health Checks

### Application Health

```
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 86400,
  "plugins": ["google-places", "firecrawl", "hunter", "apollo"],
  "agents": [
    { "name": "Master Planner", "status": "idle" },
    { "name": "Google Places", "status": "idle" }
  ]
}
```

### Component Health

| Component | Check | Endpoint |
|-----------|-------|----------|
| Database | Connection test | Internal |
| Redis | PING command | Internal |
| Ollama | Model list | Internal |
| Qdrant | Collections check | Internal |
| Plugins | API key validation | `/api/plugins/health` |

## Metrics (Phase 3)

### Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `workflow_executions_total` | Counter | Total workflows run |
| `workflow_duration_seconds` | Histogram | Workflow execution time |
| `leads_discovered_total` | Counter | Total leads found |
| `plugin_api_calls_total` | Counter | External API calls |
| `plugin_api_errors_total` | Counter | Failed API calls |
| `queue_depth` | Gauge | Items in queue |
| `active_workflows` | Gauge | Currently running workflows |
| `memory_usage_bytes` | Gauge | Process memory usage |

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'coldrunners'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['coldrunners:3000']
```

## Logging

### Structured Log Format

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: 'coldrunners';
  module: string;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| debug | Development details, variable values |
| info | Normal operations, workflow starts/completes |
| warn | Degraded performance, fallback triggered |
| error | Failures, exceptions, data loss |

### Logger Setup (Phase 3)

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});
```

## Distributed Tracing (Phase 3)

### OpenTelemetry Setup

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    new ExpressInstrumentation(),
  ],
});

sdk.start();
```

### Trace Structure

```
Workflow Execution (root span)
    ├── Google Places Discovery (child span)
    │   ├── Geocode (sub-span)
    │   ├── Nearby Search (sub-span)
    │   └── Place Details (sub-span)
    ├── Website Analysis (child span)
    │   ├── Firecrawl Scrape (sub-span)
    │   └── Tech Detection (sub-span)
    ├── Contact Discovery (child span)
    │   ├── Hunter.io Lookup (sub-span)
    │   └── Apollo Enrichment (sub-span)
    ├── Opportunity Scoring (child span)
    └── Duplicate Detection (child span)
```

## Alerting Rules (Phase 3)

```yaml
# alerting-rules.yml
groups:
  - name: coldrunners
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status="500"}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: WorkflowTimeout
        expr: workflow_duration_seconds{quantile="0.95"} > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Workflows taking too long"

      - alert: PluginDown
        expr: plugin_health == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Plugin {{ $labels.plugin }} is down"
```

## Grafana Dashboards

### Dashboard 1: Overview

- Request rate (req/s)
- Error rate (%)
- Latency (p50, p95, p99)
- Active workflows
- Lead discovery rate

### Dashboard 2: Agent Performance

- Agent execution time
- Items processed per agent
- Error rate per agent
- Queue depth per agent

### Dashboard 3: Plugin Health

- API call rate per plugin
- Error rate per plugin
- Response time per plugin
- Rate limit utilization

### Dashboard 4: Infrastructure

- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database connections
