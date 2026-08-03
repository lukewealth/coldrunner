# API Reference

## Base URL

```
http://localhost:3000
```

## Authentication

Phase 1: No authentication required.
Phase 3+: JWT Bearer token + RBAC.

## Response Format

All endpoints return JSON. Success responses contain data directly. Error responses:

```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

---

## Agent Workflow

### POST /api/agents/run-search

Execute full autonomous business discovery workflow.

**Request Body:**
```json
{
  "country": "Canada",
  "province": "Ontario",
  "city": "Toronto",
  "radiusKm": 25,
  "category": "Dental Clinic",
  "minRating": 3.5,
  "minReviews": 10,
  "targetCount": 5,
  "websiteStatusFilter": "All Flaws",
  "revenueEstimateFilter": "All Ranges",
  "socialActivityFilter": "All Levels",
  "minOpportunityScore": 60,
  "targetJobTitle": "Owner",
  "searchPurpose": "Website Redesign",
  "techStackFilter": "WordPress",
  "aiPromptQuery": "Find dental clinics with outdated websites"
}
```

**Response:**
```json
{
  "leads": [BusinessLead],
  "source": "agent_workflow | gemini_fallback | simulated_fallback",
  "workflowId": "wf-1234567890",
  "logCount": 15
}
```

### POST /api/agents/analyze-website

Analyze a single website.

**Request Body:**
```json
{
  "url": "www.example.com"
}
```

**Response:**
```json
{
  "url": "example.com",
  "performance": 45,
  "seo": 62,
  "accessibility": 71,
  "bestPractices": 68,
  "mobileScore": 38,
  "hasSSL": true,
  "loadTimeMs": 4200,
  "techStack": ["WordPress 5.8", "Elementor", "Google Analytics"],
  "issues": ["Unoptimized images", "Missing structured data"],
  "opportunities": ["Next.js redesign", "AI chatbot integration"],
  "agencyProposalPitch": "Proposal for example.com: ..."
}
```

### POST /api/agents/auto-draft-email

Generate personalized outreach email.

**Request Body:**
```json
{
  "lead": { BusinessLead },
  "style": "Consultative Audit | Direct Pitch | Short & Punchy"
}
```

**Response:**
```json
{
  "subject": "Website Analysis & Growth Opportunity for Business Name",
  "body": "Hi Owner,\n\n...",
  "style": "Consultative Audit",
  "promptTemplateUsed": "..."
}
```

### POST /api/agents/generate-campaign

Generate multi-channel sales campaign.

**Request Body:**
```json
{
  "lead": { BusinessLead },
  "agencyType": "Website & AI Automation Agency"
}
```

**Response:**
```json
{
  "leadId": "...",
  "businessName": "...",
  "emailSubject": "...",
  "emailBody": "...",
  "linkedinPitch": "...",
  "callScript": "...",
  "whatsappMessage": "..."
}
```

---

## MCP

### POST /api/mcp/tools/:toolName

Execute an MCP tool.

**Parameters:** Tool name in URL path.
**Request Body:** Tool-specific parameters.
**Response:** Tool-specific result with `{ success: boolean }`.

### GET /api/mcp/tools

List all registered MCP tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "discover_businesses",
      "description": "...",
      "inputSchema": { ... }
    }
  ]
}
```

### GET /api/mcp/resources

List all registered MCP resources.

**Response:**
```json
{
  "resources": [
    {
      "uri": "leads://all",
      "name": "All Business Leads",
      "description": "..."
    }
  ]
}
```

### GET /api/mcp/resources/:uri

Access an MCP resource. URI must be URL-encoded.

**Response:**
```json
{
  "success": true,
  "uri": "leads://all",
  "data": [...],
  "mimeType": "application/json"
}
```

---

## Data Management

### GET /api/leads

List leads with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| grade | string | HOT, WARM, or COLD |
| category | string | Business category |
| city | string | City name |
| websiteStatus | string | Website status filter |
| minScore | number | Minimum opportunity score |
| status | string | Lead status |
| limit | number | Max results (default 100) |

**Response:**
```json
{
  "leads": [BusinessLead],
  "total": 42
}
```

### GET /api/leads/:id

Get a single lead by ID.

**Response:** `BusinessLead` object or 404.

### PUT /api/leads/:id

Update a lead.

**Request Body:** Partial `BusinessLead` fields.
**Response:** Updated `BusinessLead` or 404.

### DELETE /api/leads/:id

Delete a lead.

**Response:** `{ "success": true }`

### GET /api/stats

Get platform statistics.

**Response:**
```json
{
  "totalLeads": 42,
  "hotLeads": 15,
  "warmLeads": 20,
  "coldLeads": 7,
  "totalWorkflows": 8,
  "totalSearches": 12,
  "categories": ["Dental Clinic", "HVAC Services"],
  "cities": ["Toronto", "Vancouver"],
  "avgOpportunityScore": 78
}
```

---

## Export

### POST /api/export

Export leads in specified format.

**Request Body:**
```json
{
  "format": "csv | json | excel | markdown",
  "leadIds": ["id1", "id2"],
  "city": "Toronto"
}
```

**Response:** File download with appropriate Content-Type and Content-Disposition headers.

### GET /api/export/preview

Preview export content.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | csv, json, or markdown |
| limit | number | Max leads to preview (default 10) |

**Response:**
```json
{
  "preview": "...",
  "format": "csv"
}
```

---

## System

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "plugins": ["google-places", "firecrawl", "hunter", "apollo", "social-analyzer", "pagespeed"],
  "agents": [{ "name": "...", "status": "..." }]
}
```

### GET /api/agents/status

Get agent statuses and active workflows.

**Response:**
```json
{
  "agents": [AgentStatus],
  "plugins": ["google-places", "firecrawl", ...],
  "workflows": [{ "id": "...", "status": "...", "progress": 50, "leadCount": 10 }]
}
```

### GET /api/agents/logs

Get recent agent logs (last 200).

**Response:**
```json
{
  "logs": [WorkflowLog]
}
```

### GET /api/plugins/health

Check plugin health.

**Response:**
```json
{
  "plugins": {
    "google-places": true,
    "firecrawl": false,
    "hunter": true
  }
}
```

### GET /api/workflows

List all workflows.

**Response:**
```json
{
  "workflows": [{ "id": "...", "criteria": {...}, "leadCount": 10, "createdAt": "..." }]
}
```

### GET /api/workflows/:id

Get workflow details.

**Response:** `WorkflowState` object or 404.

### GET /api/search/history

Get search history.

**Response:**
```json
{
  "history": [{ "criteria": {...}, "resultCount": 10, "timestamp": "..." }]
}
```

---

## CRM

### POST /api/crm/sync

Sync leads to external CRM.

**Request Body:**
```json
{
  "crmId": "hubspot",
  "leads": [BusinessLead]
}
```

**Response:**
```json
{
  "success": true,
  "crmId": "hubspot",
  "message": "Successfully synced 10 leads to hubspot API.",
  "transactionId": "tx_hubspot_1234567890",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Types

### BusinessLead

```typescript
interface BusinessLead {
  id: string;
  name: string;
  category: string;
  country: string;
  province: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  ownerName?: string;
  website: string;
  websiteStatus: 'Missing' | 'Outdated' | 'Poor SEO' | 'Slow Speed' | 'Broken SSL' | 'Good';
  rating: number;
  reviewCount: number;
  opportunityScore: number;
  grade: 'HOT' | 'WARM' | 'COLD';
  status: 'New' | 'Qualified' | 'Contacted' | 'Meeting Set' | 'Converted' | 'Archived';
  estimatedRevenue: string;
  socials: { facebook?, instagram?, linkedin?, x?, whatsapp?, tiktok?, youtube?, threads? };
  audit: WebsiteAudit;
  recommendedService: string;
  aiInsights: string;
  dataConfidence: number;
  verificationStatus: 'Verified' | 'Pending' | 'Enriched';
  lastUpdated: string;
  createdAt: string;
  placeId?: string;
  googleMapsUrl?: string;
  openingHours?: string[];
  photos?: string[];
}
```

### SearchCriteria

```typescript
interface SearchCriteria {
  country: string;
  province?: string;
  city: string;
  radiusKm: number;
  category: string;
  categories?: string[];
  minRating: number;
  minReviews: number;
  targetCount: number;
  websiteStatusFilter?: string;
  revenueEstimateFilter?: string;
  socialActivityFilter?: string;
  minOpportunityScore: number;
  targetJobTitle?: string;
  searchPurpose?: string;
  techStackFilter?: string;
  aiPromptQuery?: string;
}
```
