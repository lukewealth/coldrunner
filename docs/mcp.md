# MCP Integration

## Overview

ColdRunners implements a Model Context Protocol (MCP) server that exposes 9 tools and 6 resources for AI agent integration. The MCP server enables external AI assistants and agents to interact with the platform programmatically.

## MCP Server

**File:** `src/server/mcp/server.ts`

### Architecture

```typescript
class McpServer {
  private tools: Map<string, McpTool>;
  private resources: Map<string, McpResource>;

  async initialize(): Promise<void>;
  async handleToolCall(toolName: string, params: any): Promise<any>;
  async handleResourceRequest(uri: string): Promise<any>;
  listTools(): McpTool[];
  listResources(): McpResource[];
}
```

### Tool Interface

```typescript
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}
```

### Resource Interface

```typescript
interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<any>;
}
```

## Tools (9)

### 1. discover_businesses

Discover businesses using Google Places API. Runs the full autonomous workflow.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "country": { "type": "string" },
    "province": { "type": "string" },
    "city": { "type": "string" },
    "category": { "type": "string" },
    "radiusKm": { "type": "number", "default": 25 },
    "targetCount": { "type": "number", "default": 20 },
    "minRating": { "type": "number", "default": 4.3 },
    "minReviews": { "type": "number", "default": 50 },
    "minOpportunityScore": { "type": "number", "default": 60 }
  },
  "required": ["country", "city", "category"]
}
```

**Returns:** `{ success, workflowId, leadCount, hotLeads, leads[] }`

### 2. analyze_website

Run comprehensive website analysis including PageSpeed, SEO, tech stack, SSL.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" }
  },
  "required": ["url"]
}
```

**Returns:** `{ success, data: { performance, seo, accessibility, techStack, issues, opportunities } }`

### 3. discover_contacts

Discover business emails, owner contacts, and social profiles.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "companyName": { "type": "string" },
    "city": { "type": "string" }
  }
}
```

**Returns:** `{ success, data: { hunter, apollo, social } }`

### 4. run_pagespeed

Run Google PageSpeed Insights analysis.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "strategy": { "type": "string", "enum": ["mobile", "desktop"], "default": "mobile" }
  },
  "required": ["url"]
}
```

**Returns:** `{ success, data: { performance, seo, accessibility, bestPractices } }`

### 5. get_leads

Retrieve stored leads with optional filtering.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "grade": { "type": "string", "enum": ["HOT", "WARM", "COLD"] },
    "category": { "type": "string" },
    "city": { "type": "string" },
    "websiteStatus": { "type": "string" },
    "minScore": { "type": "number" },
    "limit": { "type": "number", "default": 50 }
  }
}
```

**Returns:** `{ success, count, leads[] }`

### 6. export_leads

Export leads to CSV, JSON, Markdown, or Excel.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "format": { "type": "string", "enum": ["csv", "json", "markdown", "excel"] },
    "leadIds": { "type": "array", "items": { "type": "string" } },
    "city": { "type": "string" }
  },
  "required": ["format"]
}
```

**Returns:** `{ success, format, mimeType, content, leadCount }`

### 7. get_stats

Get platform statistics.

**Input Schema:** `{ "type": "object", "properties": {} }`

**Returns:** `{ success, data: { totalLeads, hotLeads, warmLeads, coldLeads, totalWorkflows, ... } }`

### 8. geocode_location

Convert address to coordinates.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "address": { "type": "string" }
  },
  "required": ["address"]
}
```

**Returns:** `{ success, data: { lat, lng, formattedAddress } }`

### 9. check_plugin_health

Check health of all registered plugins.

**Input Schema:** `{ "type": "object", "properties": {} }`

**Returns:** `{ success, plugins: { "google-places": true, "firecrawl": true, ... } }`

## Resources (6)

| URI | Name | Description |
|-----|------|-------------|
| `leads://all` | All Business Leads | Complete list of all leads |
| `leads://hot` | HOT Leads | Leads with score >= 85 |
| `stats://platform` | Platform Statistics | Overall metrics |
| `agents://status` | Agent Status | Current agent states |
| `plugins://health` | Plugin Health | Plugin health status |
| `workflows://active` | Active Workflows | Running workflow states |

## API Endpoints

```
POST /api/mcp/tools/:toolName    Execute MCP tool
GET  /api/mcp/tools              List all tools
GET  /api/mcp/resources          List all resources
GET  /api/mcp/resources/:uri     Access resource
```

## MCP Rules

1. Tools MUST have a JSON Schema `inputSchema`
2. Tools MUST return `{ success: boolean, ... }` format
3. Tools MUST handle errors without throwing
4. Resources MUST be read-only
5. Tool names use `snake_case`
6. Resource URIs use `scheme://path` format

## Adding a New MCP Tool

1. Open `src/server/mcp/server.ts`
2. Add tool definition in `registerTools()`:

```typescript
this.tools.set('my_tool', {
  name: 'my_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
    },
    required: ['param1'],
  },
  handler: async (params) => {
    const result = await someService.doSomething(params.param1);
    return { success: true, data: result };
  },
});
```

3. Tool is automatically available via `/api/mcp/tools/my_tool`

## Adding a New MCP Resource

1. Open `src/server/mcp/server.ts`
2. Add resource definition in `registerResources()`:

```typescript
this.resources.set('myresource://type', {
  uri: 'myresource://type',
  name: 'My Resource',
  description: 'Description',
  mimeType: 'application/json',
  handler: async () => {
    return database.getSomeData();
  },
});
```

## Future MCP Servers (Phase 2+)

| MCP Server | Purpose |
|------------|---------|
| Filesystem MCP | Local file operations |
| PostgreSQL MCP | Database queries |
| GitHub MCP | Repository integration |
| Playwright MCP | Browser automation |
| Firecrawl MCP | Web crawling |
| Browser MCP | Browser control |
| Fetch MCP | HTTP requests |
| Memory MCP | Persistent memory |
| Qdrant MCP | Vector search |
| DuckDB MCP | Analytical queries |
| Docker MCP | Container management |
