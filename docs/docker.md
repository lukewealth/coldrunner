# Docker Guide

## Current State

No Docker configuration. Phase 1 runs directly on the host machine.

## Phase 2 Docker Setup

### Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p data exports && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

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
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - coldrunners

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - coldrunners

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-coldrunners}
      POSTGRES_USER: ${DB_USER:-coldrunners}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-coldrunners}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - coldrunners

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage
    restart: unless-stopped
    networks:
      - coldrunners

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
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

volumes:
  redis-data:
  pg-data:
  qdrant-data:
  ollama-data:

networks:
  coldrunners:
    driver: bridge
```

## Commands

```bash
# Build and start all services
docker compose up -d --build

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

## GPU Support (Ollama)

For NVIDIA GPU acceleration with Ollama:

```bash
# Install NVIDIA Container Toolkit
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

# Verify GPU is available
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

## Production Considerations

1. **Secrets** — Use Docker secrets or environment injection, never `.env` files
2. **Health checks** — All services should have health checks
3. **Resource limits** — Set memory and CPU limits per container
4. **Logging** — Use Docker log drivers for centralized logging
5. **Networking** — Use internal networks for service-to-service communication
6. **Volumes** — Use named volumes for persistent data
7. **Updates** — Use rolling updates with zero downtime
