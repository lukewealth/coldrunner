# Qdrant Integration Guide

## Overview

Qdrant is a high-performance vector search engine designed for AI applications. ColdRunners uses Qdrant for semantic search over crawled content, business descriptions, and embeddings.

**Official Documentation:** https://qdrant.tech/documentation  
**GitHub:** https://github.com/qdrant/qdrant  
**TypeScript Client:** https://github.com/qdrant/qdrant-js

## Features

- Vector similarity search (cosine, euclidean, dot product)
- Hybrid search (vector + filtering)
- Multi-vector support
- Payload indexing
- Distributed deployment
- REST and gRPC APIs
- Web UI dashboard

## Installation

### Docker

```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

### Docker Compose

```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"  # REST API
      - "6334:6334"  # gRPC
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped

volumes:
  qdrant_data:
```

### Access

- REST API: http://localhost:6333
- gRPC: localhost:6334
- Web UI: http://localhost:6333/dashboard

## ColdRunners Integration

### TypeScript Client

```typescript
// src/server/services/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  async initialize(): Promise<void> {
    // Create collections if they don't exist
    await this.ensureCollection('business_leads', 1024);
    await this.ensureCollection('crawled_content', 1024);
    await this.ensureCollection('documents', 1024);
  }

  private async ensureCollection(name: string, vectorSize: number): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(c => c.name === name);

    if (!exists) {
      await this.client.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      console.log(`Created Qdrant collection: ${name}`);
    }
  }

  async storeEmbedding(
    collection: string,
    id: string,
    vector: number[],
    payload: Record<string, any>
  ): Promise<void> {
    await this.client.upsert(collection, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    });
  }

  async search(
    collection: string,
    vector: number[],
    limit: number = 10,
    filter?: Record<string, any>
  ): Promise<any[]> {
    const results = await this.client.search(collection, {
      vector,
      limit,
      filter: filter ? {
        must: Object.entries(filter).map(([key, value]) => ({
          key,
          match: { value },
        })),
      } : undefined,
      with_payload: true,
    });

    return results.map(r => ({
      id: r.id,
      score: r.score,
      ...r.payload,
    }));
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.client.delete(collection, {
      points: [id],
    });
  }
}

export const qdrantService = new QdrantService();
```

### RAG Pipeline

```typescript
// src/server/services/rag.ts
import { Ollama } from 'ollama';
import { qdrantService } from './qdrant';

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });

export async function retrieveAndGenerate(
  query: string,
  collection: string = 'documents'
): Promise<string> {
  // 1. Generate query embedding
  const embeddingResult = await ollama.embeddings({
    model: 'bge-m3:latest',
    prompt: query,
  });

  const queryVector = embeddingResult.embedding;

  // 2. Search for relevant documents
  const results = await qdrantService.search(
    collection,
    queryVector,
    5
  );

  // 3. Build context from retrieved documents
  const context = results
    .map((r, i) => `[${i + 1}] ${r.text || r.content}`)
    .join('\n\n');

  // 4. Generate response with context
  const response = await ollama.chat({
    model: 'qwen2.5-coder:32b',
    messages: [
      {
        role: 'system',
        content: `You are a business intelligence assistant. Use the following context to answer the question:\n\n${context}`
      },
      { role: 'user', content: query }
    ],
    options: { temperature: 0.3 }
  });

  return response.message.content;
}
```

### Business Lead Embedding

```typescript
// src/server/services/lead-embedding.ts
import { Ollama } from 'ollama';
import { qdrantService } from './qdrant';

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });

export async function embedBusinessLead(lead: BusinessLead): Promise<void> {
  // Build text representation
  const text = [
    `Business: ${lead.name}`,
    `Category: ${lead.category}`,
    `Location: ${lead.city}, ${lead.province}, ${lead.country}`,
    `Rating: ${lead.rating}/5 (${lead.reviewCount} reviews)`,
    `Website: ${lead.website || 'N/A'}`,
    `Status: ${lead.websiteStatus}`,
    `Opportunity Score: ${lead.opportunityScore}/100`,
    `Recommended: ${lead.recommendedService}`,
    `Insights: ${lead.aiInsights}`,
  ].join('\n');

  // Generate embedding
  const result = await ollama.embeddings({
    model: 'bge-m3:latest',
    prompt: text,
  });

  // Store in Qdrant
  await qdrantService.storeEmbedding(
    'business_leads',
    lead.id,
    result.embedding,
    {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      province: lead.province,
      country: lead.country,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      opportunityScore: lead.opportunityScore,
      grade: lead.grade,
      website: lead.website,
      websiteStatus: lead.websiteStatus,
      recommendedService: lead.recommendedService,
    }
  );
}

export async function findSimilarLeads(
  leadId: string,
  limit: number = 10
): Promise<any[]> {
  // Get the lead's embedding
  const lead = await qdrantService.retrieve('business_leads', leadId);

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  // Search for similar leads
  const results = await qdrantService.search(
    'business_leads',
    lead.vector,
    limit + 1 // +1 to exclude the lead itself
  );

  // Filter out the original lead
  return results.filter(r => r.id !== leadId).slice(0, limit);
}
```

## Collections

### business_leads

Stores embeddings of business lead data for semantic search.

```typescript
await client.createCollection('business_leads', {
  vectors: {
    size: 1024,  // BGE-M3 embedding size
    distance: 'Cosine',
  },
  payload_schema: {
    name: 'keyword',
    category: 'keyword',
    city: 'keyword',
    province: 'keyword',
    country: 'keyword',
    rating: 'float',
    reviewCount: 'integer',
    opportunityScore: 'integer',
    grade: 'keyword',
  }
});
```

### crawled_content

Stores embeddings of crawled web content.

```typescript
await client.createCollection('crawled_content', {
  vectors: {
    size: 1024,
    distance: 'Cosine',
  },
  payload_schema: {
    url: 'keyword',
    domain: 'keyword',
    title: 'text',
    chunk: 'text',
    crawledAt: 'datetime',
  }
});
```

### documents

General-purpose document storage for RAG.

```typescript
await client.createCollection('documents', {
  vectors: {
    size: 1024,
    distance: 'Cosine',
  }
});
```

## API Usage

### REST API

#### Create Collection

```bash
curl -X PUT http://localhost:6333/collections/business_leads \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1024,
      "distance": "Cosine"
    }
  }'
```

#### Insert Points

```bash
curl -X PUT http://localhost:6333/collections/business_leads/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, ...],
        "payload": {
          "name": "Business Name",
          "city": "Toronto"
        }
      }
    ]
  }'
```

#### Search

```bash
curl -X POST http://localhost:6333/collections/business_leads/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 10,
    "with_payload": true
  }'
```

#### Filtered Search

```bash
curl -X POST http://localhost:6333/collections/business_leads/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 10,
    "filter": {
      "must": [
        {
          "key": "city",
          "match": { "value": "Toronto" }
        },
        {
          "key": "grade",
          "match": { "value": "HOT" }
        }
      ]
    },
    "with_payload": true
  }'
```

## Performance Optimization

### Indexing

Create payload indexes for frequently filtered fields:

```typescript
await client.createPayloadIndex('business_leads', {
  field_name: 'city',
  field_schema: 'keyword',
});

await client.createPayloadIndex('business_leads', {
  field_name: 'grade',
  field_schema: 'keyword',
});
```

### Batch Operations

Insert multiple points in a single request:

```typescript
const points = leads.map(lead => ({
  id: lead.id,
  vector: lead.embedding,
  payload: { name: lead.name, city: lead.city },
}));

await client.upsert('business_leads', {
  wait: true,
  points,
});
```

### Quantization

Reduce memory usage with scalar quantization:

```typescript
await client.createCollection('business_leads', {
  vectors: {
    size: 1024,
    distance: 'Cosine',
  },
  quantization_config: {
    scalar: {
      type: 'int8',
      quantile: 0.99,
      always_ram: true,
    }
  }
});
```

## Monitoring

### Health Check

```typescript
async function checkQdrantHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.QDRANT_URL}/healthz`);
    return response.ok;
  } catch {
    return false;
  }
}
```

### Collection Stats

```typescript
const stats = await client.getCollection('business_leads');

console.log({
  pointsCount: stats.points_count,
  vectorsCount: stats.vectors_count,
  segmentsCount: stats.segments_count,
  status: stats.status,
});
```

## Backup & Recovery

### Snapshot

```bash
# Create snapshot
curl -X POST http://localhost:6333/collections/business_leads/snapshots

# List snapshots
curl http://localhost:6333/collections/business_leads/snapshots

# Download snapshot
curl http://localhost:6333/collections/business_leads/snapshots/{snapshot_name} -o backup.tar
```

### Restore

```bash
# Upload snapshot
curl -X PUT http://localhost:6333/collections/business_leads/snapshots/recover \
  -H "Content-Type: application/json" \
  -d '{
    "location": "http://example.com/backup.tar"
  }'
```

## Troubleshooting

### Connection Refused

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Check logs
docker logs qdrant

# Restart container
docker restart qdrant
```

### Out of Memory

```bash
# Reduce vector size (use smaller embedding model)
# Enable quantization
# Increase Docker memory limit
docker run -m 4g qdrant/qdrant
```

### Slow Queries

1. Create payload indexes for filtered fields
2. Use quantization to reduce memory
3. Increase `search_timeout` parameter
4. Optimize vector size (smaller = faster)

### Collection Not Found

```typescript
// Check if collection exists
const collections = await client.getCollections();
console.log(collections.collections.map(c => c.name));

// Create collection if missing
await client.createCollection('my_collection', {
  vectors: { size: 1024, distance: 'Cosine' }
});
```

## Resources

- **Official Docs:** https://qdrant.tech/documentation
- **GitHub:** https://github.com/qdrant/qdrant
- **TypeScript Client:** https://github.com/qdrant/qdrant-js
- **Python Client:** https://github.com/qdrant/qdrant-client
- **REST API:** https://qdrant.tech/documentation/api-reference
- **Web UI:** http://localhost:6333/dashboard
