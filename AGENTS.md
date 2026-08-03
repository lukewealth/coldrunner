# AGENTS.md — AI Agent Orchestration Rules

## Agent System Overview

ColdRunners uses a hierarchical agent system orchestrated by a Master Planner Agent. Each agent is specialized, stateless, and communicates through a shared context object.

## Agent Hierarchy

```
Master Planner Agent
├── Google Places Discovery Agent
├── Website Intelligence Agent
├── Contact Discovery Agent
├── Opportunity Scoring Agent
└── Duplicate Detection Agent
```

## Agent Interface

Every agent must implement:

```typescript
interface Agent {
  name: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

interface AgentContext {
  taskId: string;
  criteria: SearchCriteria;
  leads: BusinessLead[];
  logs: WorkflowLog[];
  onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;
}

interface AgentResult {
  success: boolean;
  itemsProcessed: number;
  leads?: BusinessLead[];
  error?: string;
}
```

## Workflow Execution Order

1. **Google Places Discovery** — Geocode city, search businesses, enrich with Place Details
2. **Website Intelligence** — Firecrawl scrape, Lighthouse audit, tech stack detection
3. **Contact Discovery** — Hunter.io email lookup, Apollo.io contact enrichment, social profiles
4. **Opportunity Scoring** — Calculate 0-100 score, classify HOT/WARM/COLD
5. **Filtering** — Apply min rating, reviews, and score thresholds
6. **Duplicate Detection** — Remove duplicates by phone, name, address, website, Place ID
7. **Trim** — Limit to targetCount results

## Agent Rules

1. Agents MUST log their progress via `context.onLog()`
2. Agents MUST NOT modify leads from other agents directly; they operate on `context.leads`
3. Agents MUST handle errors gracefully and report via `AgentResult.error`
4. Agents MUST be idempotent — running twice produces the same result
5. Agents MUST respect `criteria.targetCount` as the upper bound
6. Agents MUST NOT make direct API calls; they use the Plugin Registry

## Plugin Registry Rules

1. Plugins MUST implement the `Plugin` interface
2. Plugins MUST initialize asynchronously via `initialize()`
3. Plugins MUST provide a `healthCheck()` method
4. Plugins MUST degrade gracefully when API keys are missing
5. Plugins MUST NOT cache across workflow runs
6. All plugin execution goes through `pluginRegistry.executePlugin(name, params)`

## MCP Tool Rules

1. Tools MUST have a JSON Schema `inputSchema`
2. Tools MUST return `{ success: boolean, ... }` format
3. Tools MUST handle errors without throwing
4. Resources MUST be read-only
5. Tool names use `snake_case`
6. Resource URIs use `scheme://path` format

## Future Agent Additions (Phase 2+)

| Agent | Purpose |
|-------|---------|
| Crawler Agent | Crawl4AI + Playwright web crawling |
| Embedding Agent | BGE-M3 vector embedding generation |
| llms.txt Agent | llms.txt discovery, parsing, indexing |
| SEO Agent | Deep SEO analysis beyond PageSpeed |
| Revenue Estimation Agent | ML-based revenue estimation |
| Report Generator Agent | AI-generated executive summaries |
| Export Agent | Async multi-format export with queue |

## LLM Routing Policy (Phase 2)

```
Coding tasks     → Qwen2.5-Coder 32B (local via Ollama)
Reasoning tasks  → DeepSeek-R1 (local via Ollama)
Vision tasks     → Gemma 3 (local via Ollama)
Fast tasks       → Qwen3 8B (local via Ollama)
Fallback         → Claude → GPT → Gemini (cloud)
```

## Confidence Scoring

Every data point includes a `dataConfidence` score (0-100):
- **95-100**: Directly verified via API (Google Places, Hunter.io)
- **85-94**: Enriched from multiple sources
- **70-84**: Inferred from available data
- **50-69**: Partial data with assumptions
- **<50**: Unverified, flagged for manual review

## Outreach Event System

The platform emits events at each stage of the workflow to enable automation integrations (n8n, Zapier, Make).

### Event Types

```
search.started        - Workflow initiated
search.completed      - Workflow finished
business.discovered   - New business found via Google Places
business.qualified    - Business meets filtering criteria
contact.enriched      - Contact info added (email, social)
website.analyzed      - Website audit completed
opportunity.scored    - Opportunity score calculated
lead.ready            - Lead fully processed and ready for outreach
campaign.created      - New outreach campaign created
email.generated       - AI-generated outreach message
email.approved        - Message approved by user
email.sent            - Message sent to recipient
reply.received        - Response received from prospect
meeting.booked        - Meeting scheduled
proposal.generated    - Proposal created
```

### Event Bus Usage

Agents emit events via the event bus service:

```typescript
import { eventBus } from '../services/event-bus';

await eventBus.emit('business.discovered', {
  name: lead.name,
  category: lead.category,
  city: lead.city,
}, lead.id);
```

### Webhook Subscriptions

Users can subscribe to events via webhooks:

```typescript
POST /api/webhooks
{
  "url": "https://n8n.example.com/webhook/coldrunners",
  "events": ["business.qualified", "lead.ready"],
  "platform": "n8n"
}
```

Webhook payloads include HMAC signatures for verification:

```
X-ColdRunners-Signature: sha256=<hmac>
X-ColdRunners-Event: business.qualified
```

### Outreach Service

The outreach service generates personalized messages using:
- Business strengths (rating, reviews)
- Identified opportunities (website issues)
- Industry-specific benefits
- Low-pressure CTAs

Messages go through an approval queue before sending.
