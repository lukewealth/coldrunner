# Security Handbook

## Current State (Phase 1)

- Environment variables for API keys via `.env`
- No authentication or authorization
- CORS allows all origins
- No rate limiting
- No input validation beyond TypeScript types

## Security Requirements by Phase

### Phase 1 — Baseline

| Area | Status | Notes |
|------|--------|-------|
| API key management | Done | dotenv + .env |
| CORS | Basic | Allows all origins |
| Input validation | Partial | TypeScript types only |
| Error handling | Done | No stack traces exposed |
| Secrets in code | None | All via environment |

### Phase 2 — Hardening

| Area | Implementation |
|------|---------------|
| Helmet.js | Security headers |
| Rate limiting | express-rate-limit |
| Input validation | zod / class-validator |
| SQL injection | Parameterized queries (Prisma) |
| XSS prevention | React auto-escaping + CSP |
| CSRF | SameSite cookies + tokens |

### Phase 3 — Enterprise

| Area | Implementation |
|------|---------------|
| Authentication | JWT + OAuth2/OIDC |
| Authorization | RBAC with role-based permissions |
| API keys | Per-user API key management |
| Audit logging | All actions logged with user context |
| Encryption | At-rest (AES-256) + in-transit (TLS 1.3) |
| Secrets | HashiCorp Vault or AWS Secrets Manager |

### Phase 4 — Compliance

| Area | Implementation |
|------|---------------|
| GDPR | Data export, right to deletion, consent |
| PIPEDA | Canadian privacy compliance |
| SOC2 | Security controls documentation |
| Penetration testing | Quarterly third-party audits |
| Incident response | Documented runbook |

## API Key Management

### Current

```bash
# .env (never committed)
GEMINI_API_KEY="..."
GOOGLE_PLACES_API_KEY="..."
FIRECRAWL_API_KEY="..."
HUNTER_API_KEY=""
APOLLO_API_KEY=""
```

### Phase 3

```typescript
import { Vault } from 'node-vault';

const vault = Vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const { data } = await vault.read('secret/coldrunners/api-keys');
```

## Authentication (Phase 3)

```typescript
// JWT middleware
import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);
```

## Input Validation

```typescript
import { z } from 'zod';

const SearchCriteriaSchema = z.object({
  country: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  radiusKm: z.number().min(1).max(100),
  category: z.string().min(1).max(200),
  targetCount: z.number().min(1).max(50),
  minRating: z.number().min(0).max(5),
  minReviews: z.number().min(0).max(10000),
  minOpportunityScore: z.number().min(0).max(100),
});

function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error });
    }
    req.validated = result.data;
    next();
  };
}
```

## Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());
// Sets: Content-Security-Policy, X-Content-Type-Options,
// X-Frame-Options, X-XSS-Protection, Strict-Transport-Security, etc.
```

## CORS Hardening

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));
```

## Data Protection

### Sensitive Fields

| Field | Protection |
|-------|-----------|
| API keys | Environment variables, never logged |
| Email addresses | Encrypted at rest (Phase 3) |
| Phone numbers | Encrypted at rest (Phase 3) |
| Business data | Access controlled (Phase 3) |

### Logging Rules

1. NEVER log API keys, tokens, or secrets
2. NEVER log full email addresses (mask: `c***@example.com`)
3. NEVER log full phone numbers (mask: `+1 (***) ***-0123`)
4. Log user IDs, not usernames
5. Sanitize error messages before returning to client

## .gitignore Rules

```
.env
.env.local
.env.production
*.key
*.pem
data/*.db
exports/
node_modules/
dist/
```
