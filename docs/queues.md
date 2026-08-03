# Queue Architecture

## Overview

ColdRunners will use Redis + BullMQ for distributed job queues in Phase 3. This enables horizontal scaling of workers and reliable task processing.

## Queue Design

### Queue Types

| Queue | Purpose | Concurrency | Priority |
|-------|---------|-------------|----------|
| planner | Workflow orchestration | 2 | High |
| crawler | Web crawling tasks | 20 | Medium |
| embedding | Vector embedding generation | 10 | Medium |
| export | Multi-format export | 2 | Low |
| screenshot | Page screenshot capture | 5 | Low |
| email | Outreach email sending | 3 | Medium |
| notification | User notifications | 5 | Low |
| report | Report generation | 4 | Low |
| cleanup | Data cleanup tasks | 1 | Low |
| retry | Failed job retries | 2 | High |

### Job Lifecycle

```
Job Created
    ↓
Added to Queue (Redis)
    ↓
Worker picks up job
    ↓
Job processing
    ├─ Success → Mark completed
    ├─ Failure → Retry (up to 3 times)
    │              ↓
    │           Max retries → Move to failed queue
    └─ Timeout → Mark failed
```

## BullMQ Implementation

### Queue Setup

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

const crawlQueue = new Queue('crawl', { connection });
const embeddingQueue = new Queue('embedding', { connection });
const exportQueue = new Queue('export', { connection });
```

### Worker Setup

```typescript
const crawlWorker = new Worker('crawl', async (job) => {
  const { url, options } = job.data;

  job.updateProgress(10);
  const result = await crawlUrl(url, options);
  job.updateProgress(100);

  return result;
}, {
  connection,
  concurrency: 20,
  limiter: { max: 100, duration: 60000 },
});

crawlWorker.on('completed', (job) => {
  console.log(`Crawl job ${job.id} completed`);
});

crawlWorker.on('failed', (job, err) => {
  console.error(`Crawl job ${job?.id} failed: ${err.message}`);
});
```

### Adding Jobs

```typescript
// Single job
const job = await crawlQueue.add('crawl-url', {
  url: 'https://example.com',
  options: { followLinks: true, maxDepth: 2 },
}, {
  priority: 1,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
});

// Bulk jobs
const jobs = await crawlQueue.addBulk(
  urls.map((url) => ({
    name: 'crawl-url',
    data: { url },
    opts: { priority: 2 },
  }))
);
```

## Worker Scaling

### Local Development

```bash
# Start all workers
npm run worker:crawler &
npm run worker:embedding &
npm run worker:export &
npm run worker:planner &
```

### Docker Compose

```yaml
services:
  worker-crawler:
    build: .
    command: npm run worker:crawler
    deploy:
      replicas: 5
    environment:
      - REDIS_HOST=redis
      - WORKER_CONCURRENCY=20

  worker-embedding:
    build: .
    command: npm run worker:embedding
    deploy:
      replicas: 3
    environment:
      - REDIS_HOST=redis
      - OLLAMA_URL=http://ollama:11434

  worker-export:
    build: .
    command: npm run worker:export
    deploy:
      replicas: 1
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker-crawler
spec:
  replicas: 5
  selector:
    matchLabels:
      app: worker-crawler
  template:
    spec:
      containers:
        - name: worker
          image: coldrunners:latest
          command: ["npm", "run", "worker:crawler"]
          resources:
            requests:
              cpu: "500m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
```

## Job Priorities

```typescript
enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 5,
  LOW = 10,
  BACKGROUND = 20,
}

// Workflow steps get priority
await crawlQueue.add('crawl', data, { priority: Priority.HIGH });
await embeddingQueue.add('embed', data, { priority: Priority.MEDIUM });
await exportQueue.add('export', data, { priority: Priority.LOW });
```

## Retry Strategy

```typescript
const jobOpts = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s
  },
};
```

## Dead Letter Queue

Failed jobs after max retries go to a dead letter queue for manual inspection:

```typescript
crawlWorker.on('failed', (job, err) => {
  if (job && job.attemptsMade >= job.opts.attempts!) {
    // Move to dead letter queue
    deadLetterQueue.add('failed-crawl', {
      originalJob: job.data,
      error: err.message,
      failedAt: new Date(),
    });
  }
});
```

## Monitoring

```typescript
// Queue metrics
const waiting = await crawlQueue.getWaitingCount();
const active = await crawlQueue.getActiveCount();
const completed = await crawlQueue.getCompletedCount();
const failed = await crawlQueue.getFailedCount();

// Expose via API
app.get('/api/queues/stats', async (req, res) => {
  res.json({
    crawl: {
      waiting: await crawlQueue.getWaitingCount(),
      active: await crawlQueue.getActiveCount(),
      completed: await crawlQueue.getCompletedCount(),
      failed: await crawlQueue.getFailedCount(),
    },
    // ... other queues
  });
});
```

## Phase 3 Migration Checklist

- [ ] Install `bullmq` and `ioredis`
- [ ] Set up Redis connection
- [ ] Create queue definitions
- [ ] Create worker processes
- [ ] Migrate workflow engine to use queues
- [ ] Add job progress tracking
- [ ] Implement retry logic
- [ ] Add dead letter queue
- [ ] Create monitoring endpoints
- [ ] Add queue dashboard UI
