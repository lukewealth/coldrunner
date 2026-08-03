# PostgreSQL Integration Guide

## Overview

PostgreSQL is the primary relational database for ColdRunners Phase 3+. It stores business leads, workflows, users, and application data.

**Official Documentation:** https://www.postgresql.org/docs  
**Website:** https://www.postgresql.org  
**Prisma ORM:** https://www.prisma.io/docs

## Features

- ACID compliance
- Advanced indexing (B-tree, Hash, GiST, SP-GiST, GIN)
- JSON/JSONB support
- Full-text search
- Window functions
- Common table expressions (CTEs)
- Triggers and stored procedures
- Replication and high availability

## ColdRunners Schema

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model BusinessLead {
  id                 String   @id @default(uuid())
  name               String
  category           String
  country            String
  province           String
  city               String
  address            String
  lat                Float
  lng                Float
  phone              String
  email              String
  ownerName          String?
  website            String
  websiteStatus      String
  rating             Float
  reviewCount        Int
  opportunityScore   Int
  grade              String   // HOT, WARM, COLD
  status             String   @default("New")
  estimatedRevenue   String
  companyBio         String?
  recommendedService String
  aiInsights         String
  dataConfidence     Int
  verificationStatus String   @default("Pending")
  placeId            String?
  googleMapsUrl      String?
  createdAt          DateTime @default(now())
  lastUpdated        DateTime @updatedAt

  audit              WebsiteAudit?
  socials            SocialLinks?
  hrContact          HrContact?

  @@index([city])
  @@index([grade])
  @@index([category])
  @@index([opportunityScore])
}

model WebsiteAudit {
  id              String   @id @default(uuid())
  leadId          String   @unique
  lead            BusinessLead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  performance     Int
  seo             Int
  accessibility   Int
  bestPractices   Int
  mobileScore     Int
  hasSSL          Boolean
  loadTimeMs      Int
  techStack       String[]
  issues          String[]
  opportunities   String[]
}

model SocialLinks {
  id        String   @id @default(uuid())
  leadId    String   @unique
  lead      BusinessLead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  facebook  String?
  instagram String?
  linkedin  String?
  x         String?
  whatsapp  String?
  tiktok    String?
  youtube   String?
  threads   String?
}

model HrContact {
  id        String   @id @default(uuid())
  leadId    String   @unique
  lead      BusinessLead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  name      String?
  email     String?
  title     String?
  phone     String?
}

model Workflow {
  id          String   @id @default(uuid())
  status      String   @default("pending")
  criteria    Json
  leadCount   Int      @default(0)
  logs        Json     @default("[]")
  startedAt   DateTime @default(now())
  completedAt DateTime?

  @@index([status])
}

model SearchHistory {
  id          String   @id @default(uuid())
  criteria    Json
  resultCount Int
  timestamp   DateTime @default(now())
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  passwordHash String
  role         String   @default("user")
  createdAt    DateTime @default(now())
  lastLogin    DateTime?
}
```

## Installation

### Docker

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=coldrunners \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=coldrunners \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: coldrunners
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: coldrunners
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coldrunners"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Prisma Setup

### Installation

```bash
npm install @prisma/client
npm install -D prisma
```

### Initialize

```bash
npx prisma init
```

### Generate Client

```bash
npx prisma generate
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

### Deploy Migrations (Production)

```bash
npx prisma migrate deploy
```

## Usage

### Database Service

```typescript
// src/server/services/database.ts
import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async initialize(): Promise<void> {
    await this.prisma.$connect();
  }

  async saveLeads(leads: BusinessLead[]): Promise<void> {
    for (const lead of leads) {
      await this.prisma.businessLead.upsert({
        where: { id: lead.id },
        update: {
          name: lead.name,
          category: lead.category,
          city: lead.city,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          opportunityScore: lead.opportunityScore,
          grade: lead.grade,
          website: lead.website,
          websiteStatus: lead.websiteStatus,
          email: lead.email,
          phone: lead.phone,
          audit: {
            upsert: {
              create: {
                performance: lead.audit.performance,
                seo: lead.audit.seo,
                accessibility: lead.audit.accessibility,
                bestPractices: lead.audit.bestPractices,
                mobileScore: lead.audit.mobileScore,
                hasSSL: lead.audit.hasSSL,
                loadTimeMs: lead.audit.loadTimeMs,
                techStack: lead.audit.techStack,
                issues: lead.audit.issues,
                opportunities: lead.audit.opportunities,
              },
              update: {
                performance: lead.audit.performance,
                seo: lead.audit.seo,
                accessibility: lead.audit.accessibility,
                bestPractices: lead.audit.bestPractices,
                mobileScore: lead.audit.mobileScore,
                hasSSL: lead.audit.hasSSL,
                loadTimeMs: lead.audit.loadTimeMs,
                techStack: lead.audit.techStack,
                issues: lead.audit.issues,
                opportunities: lead.audit.opportunities,
              },
            },
          },
        },
        create: {
          id: lead.id,
          name: lead.name,
          category: lead.category,
          country: lead.country,
          province: lead.province,
          city: lead.city,
          address: lead.address,
          lat: lead.lat,
          lng: lead.lng,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          websiteStatus: lead.websiteStatus,
          rating: lead.rating,
          reviewCount: lead.reviewCount,
          opportunityScore: lead.opportunityScore,
          grade: lead.grade,
          status: lead.status,
          estimatedRevenue: lead.estimatedRevenue,
          recommendedService: lead.recommendedService,
          aiInsights: lead.aiInsights,
          dataConfidence: lead.dataConfidence,
          verificationStatus: lead.verificationStatus,
          audit: {
            create: {
              performance: lead.audit.performance,
              seo: lead.audit.seo,
              accessibility: lead.audit.accessibility,
              bestPractices: lead.audit.bestPractices,
              mobileScore: lead.audit.mobileScore,
              hasSSL: lead.audit.hasSSL,
              loadTimeMs: lead.audit.loadTimeMs,
              techStack: lead.audit.techStack,
              issues: lead.audit.issues,
              opportunities: lead.audit.opportunities,
            },
          },
        },
      });
    }
  }

  async getLead(id: string): Promise<BusinessLead | null> {
    const lead = await this.prisma.businessLead.findUnique({
      where: { id },
      include: {
        audit: true,
        socials: true,
        hrContact: true,
      },
    });

    return lead;
  }

  async searchLeads(query: {
    grade?: string;
    category?: string;
    city?: string;
    minScore?: number;
  }): Promise<BusinessLead[]> {
    const leads = await this.prisma.businessLead.findMany({
      where: {
        grade: query.grade,
        category: query.category,
        city: query.city,
        opportunityScore: query.minScore ? { gte: query.minScore } : undefined,
      },
      include: {
        audit: true,
        socials: true,
        hrContact: true,
      },
      orderBy: {
        opportunityScore: 'desc',
      },
    });

    return leads;
  }

  async getStats(): Promise<any> {
    const totalLeads = await this.prisma.businessLead.count();
    const hotLeads = await this.prisma.businessLead.count({ where: { grade: 'HOT' } });
    const warmLeads = await this.prisma.businessLead.count({ where: { grade: 'WARM' } });
    const coldLeads = await this.prisma.businessLead.count({ where: { grade: 'COLD' } });

    const avgScore = await this.prisma.businessLead.aggregate({
      _avg: { opportunityScore: true },
    });

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      avgOpportunityScore: Math.round(avgScore._avg.opportunityScore || 0),
    };
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

## Performance Optimization

### Indexing

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_leads_city ON "BusinessLead"(city);
CREATE INDEX idx_leads_grade ON "BusinessLead"(grade);
CREATE INDEX idx_leads_category ON "BusinessLead"(category);
CREATE INDEX idx_leads_score ON "BusinessLead"("opportunityScore" DESC);
CREATE INDEX idx_leads_created ON "BusinessLead"("createdAt" DESC);

-- Composite index for common queries
CREATE INDEX idx_leads_city_grade ON "BusinessLead"(city, grade);
```

### Connection Pooling

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  log: ['error'],
});
```

### Query Optimization

```typescript
// Use select to fetch only needed fields
const leads = await prisma.businessLead.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    opportunityScore: true,
    grade: true,
  },
  where: { grade: 'HOT' },
});

// Use pagination for large datasets
const pageSize = 50;
const page = 1;

const leads = await prisma.businessLead.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

## Backup & Recovery

### Manual Backup

```bash
# Dump database
pg_dump -U coldrunners -h localhost coldrunners > backup.sql

# Restore
psql -U coldrunners -h localhost coldrunners < backup.sql
```

### Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

pg_dump -U coldrunners -h localhost coldrunners | gzip > "$BACKUP_DIR/coldrunners_$TIMESTAMP.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "coldrunners_*.sql.gz" -mtime +7 -delete
```

## Monitoring

### Check Connection

```typescript
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

### Query Performance

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs postgres

# Test connection
psql -U coldrunners -h localhost -d coldrunners
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate resolve --applied <migration-name>
```

### Performance Issues

1. Check for missing indexes
2. Analyze query execution plans: `EXPLAIN ANALYZE <query>`
3. Increase connection pool size
4. Enable query caching
5. Consider read replicas for heavy read workloads

## Resources

- **Official Docs:** https://www.postgresql.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Tutorial:** https://www.postgresqltutorial.com
- **pgAdmin:** https://www.pgadmin.org (GUI tool)
