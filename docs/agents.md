# Agent System

## Overview

ColdRunners uses a hierarchical agent system where a Master Planner Agent orchestrates 5 specialized agents in a sequential pipeline. Each agent is stateless, logs its progress, and communicates through a shared context object.

## Agent Hierarchy

```
Master Planner Agent
├── Google Places Discovery Agent
├── Website Intelligence Agent
├── Contact Discovery Agent
├── Opportunity Scoring Agent
└── Duplicate Detection Agent
```

## Interfaces

### Agent

```typescript
interface Agent {
  name: string;
  description: string;
  execute(context: AgentContext): Promise<AgentResult>;
}
```

### AgentContext

```typescript
interface AgentContext {
  taskId: string;
  criteria: SearchCriteria;
  leads: BusinessLead[];
  logs: WorkflowLog[];
  onLog: (log: Omit<WorkflowLog, 'id' | 'timestamp'>) => void;
}
```

### AgentResult

```typescript
interface AgentResult {
  success: boolean;
  itemsProcessed: number;
  leads?: BusinessLead[];
  error?: string;
}
```

## Agent Details

### Master Planner Agent

**File:** `src/server/agents/master-planner.ts`

Orchestrates the full workflow. Manages agent lifecycle, status tracking, and error handling.

**Responsibilities:**
- Initialize shared context
- Execute agents in sequence
- Track agent statuses
- Apply filtering after scoring
- Handle errors and log failures

**Status tracking:**

| Agent ID | Name | Type |
|----------|------|------|
| ag-mp | Master Planning Agent | master-planner |
| ag-gp | Google Places Discovery Agent | google-places |
| ag-wa | Website Intelligence Agent | website-analyzer |
| ag-cd | Contact & Email Discovery Agent | contact-discovery |
| ag-os | AI Opportunity Scoring Agent | opportunity-scorer |
| ag-dd | Duplicate Detection Agent | duplicate-detector |

### Google Places Discovery Agent

**File:** `src/server/agents/google-places.ts`

**Responsibilities:**
- Geocode city to coordinates via Google Geocoding API
- Execute Nearby Search or Text Search
- Enrich results with Place Details
- Populate initial `BusinessLead` objects

**Plugin used:** `google-places`

### Website Intelligence Agent

**File:** `src/server/agents/website-analyzer.ts`

**Responsibilities:**
- Scrape websites via Firecrawl
- Detect technology stack
- Run Lighthouse-style audit
- Check SSL certificate status
- Identify issues and opportunities

**Plugin used:** `firecrawl`

### Contact Discovery Agent

**File:** `src/server/agents/contact-discovery.ts`

**Responsibilities:**
- Discover emails via Hunter.io
- Enrich contacts via Apollo.io
- Find social media profiles
- Populate `hrContact` and `socials` fields

**Plugins used:** `hunter`, `apollo`, `social-analyzer`

### Opportunity Scoring Agent

**File:** `src/server/agents/opportunity-scorer.ts`

**Responsibilities:**
- Calculate 0-100 opportunity score
- Classify leads as HOT (85-100), WARM (60-84), COLD (0-59)
- Generate recommended services
- Create AI insights

**Scoring algorithm:**

```
Base Score: 0

Website Status:
  Missing:        +40
  Broken SSL:     +35
  Outdated:       +25
  Slow Speed:     +20
  Poor SEO:       +15

Technical Issues:
  No SSL:         +10
  Mobile < 50:    +10
  Performance < 50: +10
  SEO < 50:       +10

Reputation:
  Rating >= 4.5:  +10
  Rating >= 4.0:  +5
  Reviews >= 150: +10
  Reviews >= 50:  +5

Social Presence:
  3+ platforms:   +10
  1+ platforms:   +5

Revenue:
  $1M+:           +5

Maximum: 100
```

### Duplicate Detection Agent

**File:** `src/server/agents/duplicate-detector.ts`

**Responsibilities:**
- Compare leads by phone number
- Compare leads by business name
- Compare leads by address
- Compare leads by website domain
- Compare leads by Google Place ID
- Remove duplicates, keeping highest-scored version

## Workflow Execution

```
1. MasterPlanner.execute(criteria, onLog)
2. Create AgentContext with empty leads array
3. GooglePlacesAgent.execute(context) → populates context.leads
4. WebsiteAnalyzerAgent.execute(context) → enriches with audit data
5. ContactDiscoveryAgent.execute(context) → enriches with contacts
6. OpportunityScorerAgent.execute(context) → adds scores and grades
7. Filter by minRating, minReviews, minOpportunityScore
8. DuplicateDetectorAgent.execute(context) → removes duplicates
9. Trim to criteria.targetCount
10. Return final leads array
```

## Error Handling

```
Agent throws error
    ↓
MasterPlanner catches
    ↓
Logs error via context.onLog()
    ↓
Updates agent status to 'error'
    ↓
Throws to WorkflowEngine
    ↓
WorkflowEngine marks workflow as 'failed'
    ↓
Express route catches
    ↓
Fallback: Gemini AI or simulated data
```

## Adding a New Agent

1. Create file in `src/server/agents/`
2. Implement agent class with `execute(context)` method
3. Register in `MasterPlannerAgent.agents` map
4. Add status entry in `initializeStatuses()`
5. Add execution step in `execute()` method
6. Export from `src/server/agents/index.ts`

## Future Agents (Phase 2+)

| Agent | Purpose | Plugin Dependencies |
|-------|---------|-------------------|
| Crawler Agent | Crawl4AI + Playwright web crawling | crawl4ai, playwright |
| Embedding Agent | BGE-M3 vector embedding generation | ollama |
| llms.txt Agent | llms.txt discovery and parsing | crawl4ai |
| SEO Agent | Deep SEO analysis | firecrawl, pagespeed |
| Revenue Estimation Agent | ML-based revenue estimation | ollama |
| Report Generator Agent | AI-generated executive summaries | ollama |
| Export Agent | Async multi-format export with queue | bullmq |
