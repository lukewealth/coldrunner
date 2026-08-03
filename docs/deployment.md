# Deployment Guide

## Local Development

### Prerequisites

- Node.js 22+
- npm 10+
- Git

### Setup

```bash
git clone <repo-url>
cd coldrunners-business-finder
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### Access

- Application: http://localhost:3000
- API: http://localhost:3000/api/health
- MCP Tools: http://localhost:3000/api/mcp/tools

## Docker (Phase 2)

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: coldrunners
      POSTGRES_USER: coldrunners
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pg-data:/var/lib/postgresql/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

volumes:
  redis-data:
  pg-data:
  qdrant-data:
  ollama-data:
```

### Build & Run

```bash
docker compose up -d
docker compose logs -f app
docker compose down
```

## Cloud Deployment

### Vercel (Frontend)

```bash
npm install -g vercel
vercel --prod
```

### Railway (Full Stack)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Fly.io

```bash
npm install -g @flyio/flyctl
flyctl auth login
flyctl launch
flyctl deploy
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Configure run command: `npm run start`
4. Set environment variables
5. Deploy

### AWS (Phase 4)

```yaml
# ECS Fargate
Resources:
  ColdRunnersService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          SecurityGroups:
            - !Ref ServiceSecurityGroup
```

### Kubernetes (Phase 4)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coldrunners
spec:
  replicas: 3
  selector:
    matchLabels:
      app: coldrunners
  template:
    metadata:
      labels:
        app: coldrunners
    spec:
      containers:
        - name: coldrunners
          image: coldrunners:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: coldrunners
spec:
  selector:
    app: coldrunners
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

## Environment Configuration

### Development

```bash
NODE_ENV=development
PORT=3000
GEMINI_API_KEY=your-key
GOOGLE_PLACES_API_KEY=your-key
```

### Production

```bash
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=vault:secret/coldrunners/gemini
GOOGLE_PLACES_API_KEY=vault:secret/coldrunners/google-places
DATABASE_URL=postgresql://user:pass@host:5432/coldrunners
REDIS_URL=redis://host:6379
QDRANT_URL=http://host:6333
OLLAMA_URL=http://host:11434
```

## CI/CD (GitHub Actions)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - name: Deploy
        run: |
          # Deploy to target environment
          echo "Deploying..."
```

## Monitoring in Production

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus | Collect metrics |
| Visualization | Grafana | Dashboards |
| Logs | Loki | Log aggregation |
| Tracing | Jaeger | Distributed tracing |
| Errors | Sentry | Error tracking |
| Uptime | UptimeRobot | Availability monitoring |
