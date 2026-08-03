# Agent-Reach Integration Patterns

This document describes the patterns ported from [Agent-Reach](https://github.com/Panniantong/Agent-Reach) into the ColdRunners TypeScript codebase.

## What is Agent-Reach?

Agent-Reach is a Python CLI tool that gives AI agents internet capabilities. It provides:
- **Backend routing with fallback** - Each platform has an ordered list of backends (tools) to try
- **Health check/doctor** - Diagnostic tool that checks all integrations and reports status
- **Probe pattern** - Actually tests if tools work, not just checks existence

## Patterns Ported to TypeScript

### 1. Channel Manager with Backend Routing

**File:** `src/server/services/channels.ts`

Each integration channel has an ordered list of backends with priority. If the primary backend fails, the system automatically tries the next.

```typescript
channelManager.register({
  name: 'web-scraping',
  description: 'Website content extraction and analysis',
  tier: 0, // 0=zero-config, 1=needs-key, 2=needs-setup
  backends: [
    { name: 'Firecrawl', priority: 1, check: async () => { /* ... */ } },
    { name: 'Jina Reader', priority: 2, check: async () => { /* ... */ } },
  ],
});
```

**Benefits:**
- Automatic fallback when primary API fails
- Clear visibility into which backend is active
- Easy to add new backends without code changes

### 2. Doctor Service

**File:** `src/server/services/doctor.ts`

Comprehensive health diagnostics for all plugins, channels, and system components.

**API Endpoint:**
```
GET /api/doctor          # JSON report
GET /api/doctor?format=text  # Human-readable report
```

**Report includes:**
- Plugin status (initialized, API key configured)
- Channel status (backend availability, latency)
- System config (cache stats, retry settings)
- Tiered services (core, optional, advanced)

**Example output:**
```
ColdRunners System Health
==================================================

Status: 8/10 healthy

Core Services (zero-config):
  [OK] web-scraping: API responding (Firecrawl)
  [OK] google-places: API responding
  [!!] email-discovery: API key not configured

Optional Services (configured):
  [OK] contact-enrichment: API key configured

System Configuration:
  Cache: enabled (142 entries)
  Retry: 3 attempts
  Cache TTL: 30 minutes
```

### 3. Retry with Exponential Backoff

**File:** `src/server/services/retry.ts`

All API calls now use `fetchWithRetry()` with:
- Exponential backoff: `baseDelay * 2^attempt`
- Jitter to prevent thundering herd
- Configurable max attempts, delays
- Detects retryable errors (429, 5xx, timeout, network)

**Usage in plugins:**
```typescript
const response = await this.fetchWithRetry(url, init);
```

**Configuration:**
```bash
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY_MS=1000
RETRY_MAX_DELAY_MS=30000
```

### 4. Caching Layer

**File:** `src/server/services/cache.ts`

In-memory cache with disk persistence:
- TTL-based expiration
- LRU eviction when max entries reached
- Periodic flush to disk (`./data/cache.json`)
- Survives server restarts

**Integration:**
- Plugin registry caches successful results automatically
- Configurable via env vars

**Configuration:**
```bash
CACHE_ENABLED=true
CACHE_TTL_MS=1800000  # 30 minutes
CACHE_MAX_ENTRIES=5000
CACHE_PERSIST=true
CACHE_PATH=./data/cache.json
```

### 5. Parallel Processing

**Contact Discovery Agent:**
- Hunter + Apollo + Social calls run concurrently per lead
- Batch size: 5 leads at a time
- Reduces total processing time by ~3x

**Website Analyzer:**
- Batch size increased from 5 to 10 concurrent Firecrawl scrapes

### 6. Workflow State Persistence

**File:** `src/server/services/workflow.ts`

Workflow state saved to `./data/workflow-state.json`:
- Saved at every log entry and progress update
- Includes criteria, partial leads, current step
- `getResumeData()` method to recover after crash

**Master Planner Progress Tracking:**
- Reports step 1-6 with partial leads after each phase
- Enables resuming long-running workflows

## Comparison: Agent-Reach vs ColdRunners Implementation

| Feature | Agent-Reach (Python) | ColdRunners (TypeScript) |
|---------|---------------------|-------------------------|
| Backend routing | `Channel` base class with `backends` list | `ChannelManager` with `BackendRoute[]` |
| Health check | `doctor` CLI command | `GET /api/doctor` endpoint |
| Probe pattern | `probe_command()` executes tool | `check()` function tests API |
| Retry | Not built-in (delegates to tools) | `withRetry()` wrapper on all fetch calls |
| Caching | Not built-in | `CacheService` with disk persistence |
| Tiers | `tier` field (0, 1, 2) | Same pattern |
| Active backend | `active_backend` attribute | `activeBackends` Map |

## Files Added/Modified

**New files:**
- `src/server/services/retry.ts` - Retry utility with exponential backoff
- `src/server/services/cache.ts` - Cache service with disk persistence
- `src/server/services/channels.ts` - Channel manager with backend routing
- `src/server/services/doctor.ts` - Health diagnostics service

**Modified files:**
- `src/server/plugins/base.ts` - Added `fetchWithRetry()`, cache helpers
- `src/server/plugins/index.ts` - Integrated cache, registered channels
- `src/server/plugins/*.ts` - All plugins use `fetchWithRetry()`
- `src/server/agents/contact-discovery.ts` - Parallelized API calls
- `src/server/agents/website-analyzer.ts` - Increased batch size
- `src/server/agents/master-planner.ts` - Progress tracking
- `src/server/services/workflow.ts` - State persistence
- `src/server/config/index.ts` - Added retry, cache config
- `server.ts` - Added `/api/doctor` endpoint
- `.env.example` - Added new env vars
- `INTEGRATION_STATUS.md` - Documented resilience features

## Testing the Doctor Endpoint

```bash
# JSON report
curl http://localhost:3000/api/doctor

# Text report
curl http://localhost:3000/api/doctor?format=text
```

## Configuration

All new features are configurable via environment variables:

```bash
# Retry
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY_MS=1000
RETRY_MAX_DELAY_MS=30000

# Cache
CACHE_ENABLED=true
CACHE_TTL_MS=1800000
CACHE_MAX_ENTRIES=5000
CACHE_PERSIST=true
CACHE_PATH=./data/cache.json
```

## Future Enhancements

Potential additions inspired by Agent-Reach:
1. **More fallback backends** - Add Jina Reader as Firecrawl fallback in actual plugin execution
2. **Channel-specific caching** - Different TTLs per channel (e.g., 1 hour for Places, 5 min for web scraping)
3. **Backend auto-selection** - Automatically select fastest backend based on latency history
4. **Circuit breaker** - Temporarily disable backends that fail repeatedly
5. **Metrics export** - Export doctor reports to Prometheus/Grafana

## References

- Agent-Reach: https://github.com/Panniantong/Agent-Reach
- Agent-Reach channels: https://github.com/Panniantong/Agent-Reach/tree/main/agent_reach/channels
- Agent-Reach doctor: https://github.com/Panniantong/Agent-Reach/blob/main/agent_reach/doctor.py
