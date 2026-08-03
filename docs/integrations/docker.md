# Docker Integration Guide

## Overview

Docker enables containerized deployment of ColdRunners and all its dependencies. This guide covers Dockerfile creation, docker-compose setup, and best practices.

**Official Documentation:** https://docs.docker.com  
**Website:** https://www.docker.com  
**Docker Hub:** https://hub.docker.com

## Features

- Containerization
- Multi-stage builds
- Docker Compose for multi-container apps
- Volume management
- Network isolation
- Health checks
- Resource limits

## Dockerfile

### Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directories
RUN mkdir -p data exports && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "dist/server.cjs"]
```

### .dockerignore

```
node_modules
dist
data
exports
.env
.env.local
.git
*.md
docs
tests
coverage
.DS_Store
```

## Docker Compose

### Full Stack Setup

```yaml
version: '3.8'

services:
  # Main application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://coldrunners:${DB_PASSWORD}@postgres:5432/coldrunners
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - OLLAMA_URL=http://ollama:11434
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - coldrunners
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # PostgreSQL database
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
    restart: unless-stopped
    networks:
      - coldrunners

  # Redis for caching and queues
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
    restart: unless-stopped
    networks:
      - coldrunners

  # Qdrant vector database
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped
    networks:
      - coldrunners

  # Ollama for local LLM inference
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - coldrunners

  # Worker for background jobs
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://coldrunners:${DB_PASSWORD}@postgres:5432/coldrunners
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - postgres
      - redis
      - qdrant
      - ollama
    restart: unless-stopped
    networks:
      - coldrunners
    deploy:
      replicas: 3

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  ollama_data:

networks:
  coldrunners:
    driver: bridge
```

### Worker Dockerfile

```dockerfile
# Dockerfile.worker
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["node", "dist/workers/main.cjs"]
```

## Commands

### Build and Run

```bash
# Build images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild single service
docker compose up -d --build app

# Execute command in running container
docker compose exec app sh

# View resource usage
docker stats
```

### Database Operations

```bash
# Run migrations
docker compose exec app npm run db:migrate

# Seed database
docker compose exec app npm run db:seed

# Access PostgreSQL
docker compose exec postgres psql -U coldrunners -d coldrunners
```

### Redis Operations

```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Check Redis info
docker compose exec redis redis-cli INFO
```

## GPU Support

### NVIDIA Container Toolkit

```bash
# Install NVIDIA Container Toolkit
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

# Verify GPU is available
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

### Ollama with GPU

```yaml
ollama:
  image: ollama/ollama:latest
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

## Production Considerations

### Secrets Management

```yaml
# Use Docker secrets instead of environment variables
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  app:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Logging

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Health Checks

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Monitoring

### Docker Stats

```bash
# View container resource usage
docker stats

# View specific container
docker stats coldrunners-app-1
```

### Prometheus Integration

```yaml
services:
  app:
    labels:
      - "prometheus-job=coldrunners"
      - "prometheus-port=3000"
      - "prometheus-path=/metrics"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check container status
docker compose ps

# Inspect container
docker inspect coldrunners-app-1
```

### Network Issues

```bash
# List networks
docker network ls

# Inspect network
docker network inspect coldrunners_coldrunners

# Restart network
docker compose down
docker compose up -d
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Remove volume
docker volume rm coldrunners_postgres_data

# Backup volume
docker run --rm -v coldrunners_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory

# Or set in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G
```

## Resources

- **Official Docs:** https://docs.docker.com
- **Docker Compose:** https://docs.docker.com/compose
- **Best Practices:** https://docs.docker.com/develop/develop-images/dockerfile_best-practices
- **Multi-stage Builds:** https://docs.docker.com/build/building/multi-stage
- **Docker Hub:** https://hub.docker.com
