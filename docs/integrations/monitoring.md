# Monitoring Stack Integration Guide

## Overview

ColdRunners uses a comprehensive monitoring stack for observability: OpenTelemetry for tracing, Prometheus for metrics, Grafana for visualization, Loki for logs, and Sentry for error tracking.

## OpenTelemetry

**Documentation:** https://opentelemetry.io/docs  
**GitHub:** https://github.com/open-telemetry

### Installation

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http
```

### Configuration

```typescript
// src/server/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});
```

### Usage

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('coldrunners');

async function processWorkflow(criteria: SearchCriteria) {
  return await tracer.startActiveSpan('workflow.execute', async (span) => {
    try {
      span.setAttribute('workflow.city', criteria.city);
      span.setAttribute('workflow.category', criteria.category);
      
      const result = await masterPlanner.execute(criteria);
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Prometheus

**Documentation:** https://prometheus.io/docs  
**Website:** https://prometheus.io

### Installation

```bash
npm install prom-client
```

### Metrics Setup

```typescript
// src/server/metrics.ts
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const workflowExecutionsTotal = new Counter({
  name: 'workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['status'],
  registers: [register],
});

export const workflowDuration = new Histogram({
  name: 'workflow_duration_seconds',
  help: 'Workflow execution duration',
  buckets: [5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const leadsDiscoveredTotal = new Counter({
  name: 'leads_discovered_total',
  help: 'Total leads discovered',
  registers: [register],
});

export const activeWorkflows = new Gauge({
  name: 'active_workflows',
  help: 'Number of active workflows',
  registers: [register],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });
    
    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );
  });
  
  next();
}

// Expose metrics endpoint
export function setupMetricsEndpoint(app: any) {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'coldrunners'
    metrics_path: '/metrics'
    scrape_interval: 10s
    static_configs:
      - targets: ['coldrunners:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

## Grafana

**Documentation:** https://grafana.com/docs  
**Website:** https://grafana.com

### Docker Compose

```yaml
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
  volumes:
    - grafana_data:/var/lib/grafana
    - ./grafana/provisioning:/etc/grafana/provisioning
  depends_on:
    - prometheus
    - loki

volumes:
  grafana_data:
```

### Data Sources

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```

### Dashboard Example

```json
{
  "dashboard": {
    "title": "ColdRunners Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Request Duration",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_bucket[5m])",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "title": "Active Workflows",
        "type": "stat",
        "targets": [
          {
            "expr": "active_workflows"
          }
        ]
      }
    ]
  }
}
```

## Loki

**Documentation:** https://grafana.com/oss/loki  
**GitHub:** https://github.com/grafana/loki

### Docker Compose

```yaml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  volumes:
    - loki_data:/loki
    - ./loki-config.yml:/etc/loki/local-config.yaml
  command: -config.file=/etc/loki/local-config.yaml

volumes:
  loki_data:
```

### Configuration

```yaml
# loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 3m
  chunk_block_size: 262144
  chunk_retain_period: 1m
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

### Logging to Loki

```typescript
import pino from 'pino';
import pinoLoki from 'pino-loki';

const logger = pino({
  transport: {
    target: 'pino-loki',
    options: {
      host: 'http://localhost:3100',
      labels: { app: 'coldrunners' },
      batching: true,
      interval: 5,
    },
  },
});

logger.info({ workflowId: 'wf-123' }, 'Workflow started');
logger.error({ error: err.message }, 'Workflow failed');
```

## Sentry

**Documentation:** https://docs.sentry.io  
**Website:** https://sentry.io

### Installation

```bash
npm install @sentry/node @sentry/tracing
```

### Configuration

```typescript
// src/server/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
});

// Express error handler
import * as Sentry from '@sentry/node';

app.use(Sentry.Handlers.errorHandler());
```

### Usage

```typescript
import * as Sentry from '@sentry/node';

try {
  await processWorkflow(criteria);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      workflow: 'business-discovery',
      city: criteria.city,
    },
    extra: {
      criteria,
    },
  });
  throw error;
}
```

## Full Monitoring Stack

### Docker Compose

```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
      - loki

  # Loki
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki
      - ./loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  # Jaeger (for OpenTelemetry traces)
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4318:4318"    # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://coldrunners:${DB_PASSWORD}@postgres:5432/coldrunners?sslmode=disable
    depends_on:
      - postgres

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
    depends_on:
      - redis

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Grafana | http://localhost:3001 | Dashboards |
| Prometheus | http://localhost:9090 | Metrics queries |
| Loki | http://localhost:3100 | Log queries |
| Jaeger | http://localhost:16686 | Trace visualization |

## Resources

- **OpenTelemetry:** https://opentelemetry.io/docs
- **Prometheus:** https://prometheus.io/docs
- **Grafana:** https://grafana.com/docs
- **Loki:** https://grafana.com/docs/loki
- **Jaeger:** https://www.jaegertracing.io/docs
- **Sentry:** https://docs.sentry.io
