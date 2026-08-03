# Redis Integration Guide

## Overview

Redis is an in-memory data structure store used for caching, job queues (BullMQ), and real-time features in ColdRunners Phase 3+.

**Official Documentation:** https://redis.io/docs  
**Website:** https://redis.io  
**GitHub:** https://github.com/redis/redis

## Features

- In-memory data store
- Data structures (strings, hashes, lists, sets, sorted sets)
- Pub/Sub messaging
- Lua scripting
- Persistence (RDB snapshots, AOF logs)
- Replication and clustering
- High availability with Redis Sentinel

## Installation

### Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine \
  redis-server --appendonly yes
```

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

## ColdRunners Usage

### Caching Service

```typescript
// src/server/services/cache.ts
import { createClient } from 'redis';

export class CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async initialize(): Promise<void> {
    await this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async close(): Promise<void> {
    await this.client.disconnect();
  }
}

export const cacheService = new CacheService();
```

### Usage in API Routes

```typescript
// src/server/routes/leads.ts
import { cacheService } from '../services/cache';

app.get('/api/leads', async (req, res) => {
  const cacheKey = `leads:${JSON.stringify(req.query)}`;

  // Try cache first
  const cached = await cacheService.get<BusinessLead[]>(cacheKey);
  if (cached) {
    return res.json({ leads: cached, source: 'cache' });
  }

  // Fetch from database
  const leads = await database.searchLeads(req.query);

  // Cache for 2 minutes
  await cacheService.set(cacheKey, leads, 120);

  res.json({ leads, source: 'database' });
});
```

### Pub/Sub for Real-Time Updates

```typescript
// Publisher
await cacheService.client.publish('workflow:updates', JSON.stringify({
  workflowId: 'wf-123',
  status: 'completed',
  leadCount: 10,
}));

// Subscriber
const subscriber = cacheService.client.duplicate();
await subscriber.connect();

await subscriber.subscribe('workflow:updates', (message) => {
  const data = JSON.parse(message);
  console.log('Workflow update:', data);
  
  // Notify connected clients via WebSocket
  broadcastToClients(data);
});
```

## BullMQ Integration

### Queue Setup

```typescript
// src/server/queues/crawl-queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const crawlQueue = new Queue('crawl', { connection });

export const crawlWorker = new Worker('crawl', async (job) => {
  const { url, jobId } = job.data;

  // Update progress
  await job.updateProgress(10);

  // Perform crawl
  const result = await crawlUrl(url);

  await job.updateProgress(100);

  return result;
}, {
  connection,
  concurrency: 20,
  limiter: {
    max: 100,
    duration: 60000, // 100 jobs per minute
  },
});

// Event handlers
crawlWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

crawlWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

### Adding Jobs

```typescript
// Add single job
const job = await crawlQueue.add('crawl-url', {
  url: 'https://example.com',
  jobId: 'crawl-123',
}, {
  priority: 1, // Lower = higher priority
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
});

// Add bulk jobs
const jobs = await crawlQueue.addBulk([
  { name: 'crawl-url', data: { url: 'https://example.com/page1' } },
  { name: 'crawl-url', data: { url: 'https://example.com/page2' } },
  { name: 'crawl-url', data: { url: 'https://example.com/page3' } },
]);
```

### Monitoring Queue

```typescript
// Get queue stats
const waiting = await crawlQueue.getWaitingCount();
const active = await crawlQueue.getActiveCount();
const completed = await crawlQueue.getCompletedCount();
const failed = await crawlQueue.getFailedCount();

console.log({
  waiting,
  active,
  completed,
  failed,
});

// Get failed jobs
const failedJobs = await crawlQueue.getFailed(0, 10);
```

## Data Structures

### Hashes

```typescript
// Store business lead as hash
await client.hSet('lead:123', {
  name: 'Business Name',
  city: 'Toronto',
  rating: '4.5',
});

// Get all fields
const lead = await client.hGetAll('lead:123');

// Get specific field
const name = await client.hGet('lead:123', 'name');
```

### Sorted Sets

```typescript
// Add leads with score (opportunity score)
await client.zAdd('leads:sorted', [
  { score: 85, value: 'lead-1' },
  { score: 72, value: 'lead-2' },
  { score: 95, value: 'lead-3' },
]);

// Get top 10 leads
const topLeads = await client.zRangeWithScores('leads:sorted', 0, 9, { REV: true });

// Get leads by score range
const hotLeads = await client.zRangeByScore('leads:sorted', 85, 100);
```

### Lists

```typescript
// Add to workflow log
await client.lPush('workflow:logs:wf-123', JSON.stringify({
  timestamp: new Date(),
  message: 'Started crawling',
}));

// Get recent logs
const logs = await client.lRange('workflow:logs:wf-123', 0, 9);
```

## Performance Optimization

### Connection Pooling

```typescript
const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Max retries reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});
```

### Pipeline

```typescript
// Batch multiple commands
const pipeline = client.multi();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');

const results = await pipeline.exec();
```

### Memory Management

```bash
# Set max memory
redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

# Or in redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

## Monitoring

### Health Check

```typescript
async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
```

### Redis CLI

```bash
# Connect to Redis
redis-cli

# Check info
INFO

# Check memory usage
INFO memory

# Check connected clients
INFO clients

# Monitor commands in real-time
MONITOR
```

## Backup & Recovery

### RDB Snapshot

```bash
# Trigger manual snapshot
redis-cli BGSAVE

# List snapshots
ls /data/dump.rdb
```

### AOF (Append Only File)

```bash
# Enable AOF
redis-server --appendonly yes

# Rewrite AOF
redis-cli BGREWRITEAOF
```

## Troubleshooting

### Connection Refused

```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs redis

# Test connection
redis-cli ping
```

### Out of Memory

```bash
# Check memory usage
redis-cli INFO memory | grep used_memory_human

# Increase max memory
redis-cli CONFIG SET maxmemory 4gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Slow Queries

```bash
# Enable slow log
redis-cli CONFIG SET slowlog-log-slower-than 10000  # 10ms

# View slow queries
redis-cli SLOWLOG GET 10
```

## Resources

- **Official Docs:** https://redis.io/docs
- **Commands Reference:** https://redis.io/commands
- **BullMQ Docs:** https://docs.bullmq.io
- **Redis University:** https://university.redis.com (free courses)
