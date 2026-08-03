# Firecrawl Integration Guide

## Overview

Firecrawl is a web scraping API that converts websites into LLM-ready markdown. It supports crawling, scraping, mapping, and structured data extraction.

**Official Documentation:** https://docs.firecrawl.dev  
**API Reference:** https://docs.firecrawl.dev/api-reference  
**GitHub:** https://github.com/mendableai/firecrawl

## Features

- Web scraping with JavaScript rendering
- Full-site crawling
- Site mapping (discover all URLs)
- Structured data extraction
- Markdown conversion
- Screenshot capture
- Self-hostable (AGPL license)
- MCP integration

## ColdRunners Current Usage

### Plugin Implementation

```typescript
// src/server/plugins/firecrawl.ts
import { Plugin, PluginResult } from '../types';

export class FirecrawlPlugin implements Plugin {
  name = 'firecrawl';
  version = '1.0.0';
  description = 'Web scraping and content extraction';

  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v1';

  async initialize(): Promise<void> {
    this.apiKey = process.env.FIRECRAWL_API_KEY || '';
  }

  async execute(params: { url: string }): Promise<PluginResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Firecrawl API key not configured',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: params.url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
        }),
      });

      const data = await response.json();

      return {
        success: true,
        data: {
          markdown: data.markdown,
          html: data.html,
          metadata: data.metadata,
          url: params.url,
        },
        confidence: 95,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Website Analyzer Agent

```typescript
// src/server/agents/website-analyzer.ts
export class WebsiteAnalyzerAgent {
  async execute(context: AgentContext): Promise<AgentResult> {
    const leads = context.leads;
    let processed = 0;

    for (const lead of leads) {
      if (!lead.website) continue;

      const url = lead.website.startsWith('http') 
        ? lead.website 
        : `https://${lead.website}`;

      const result = await pluginRegistry.executePlugin('firecrawl', { url });

      if (result.success && result.data) {
        lead.audit = {
          performance: this.calculatePerformanceScore(result.data),
          seo: this.calculateSEOScore(result.data),
          accessibility: this.calculateAccessibilityScore(result.data),
          bestPractices: this.calculateBestPracticesScore(result.data),
          mobileScore: this.calculateMobileScore(result.data),
          hasSSL: url.startsWith('https'),
          loadTimeMs: this.estimateLoadTime(result.data),
          techStack: this.detectTechStack(result.data),
          issues: this.identifyIssues(result.data),
          opportunities: this.identifyOpportunities(result.data),
        };
        processed++;
      }

      context.onLog({
        agent: this.name,
        level: 'info',
        message: `Analyzed ${lead.name} website`,
      });
    }

    return { success: true, itemsProcessed: processed };
  }
}
```

## API Endpoints

### Scrape Single Page

```bash
curl -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "url": "https://example.com",
    "formats": ["markdown", "html"],
    "onlyMainContent": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markdown": "# Example\n\nContent...",
    "html": "<html>...</html>",
    "metadata": {
      "title": "Example",
      "description": "...",
      "language": "en"
    }
  }
}
```

### Crawl Multiple Pages

```bash
curl -X POST https://api.firecrawl.dev/v1/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "url": "https://example.com",
    "maxDepth": 2,
    "limit": 100,
    "allowBackwardLinks": false
  }'
```

**Response:**
```json
{
  "success": true,
  "id": "crawl-123",
  "status": "processing"
}
```

**Check Status:**
```bash
curl https://api.firecrawl.dev/v1/crawl/123 \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY"
```

### Map Site (Discover URLs)

```bash
curl -X POST https://api.firecrawl.dev/v1/map \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "url": "https://example.com",
    "search": "blog"
  }'
```

**Response:**
```json
{
  "success": true,
  "links": [
    "https://example.com/blog/post-1",
    "https://example.com/blog/post-2"
  ]
}
```

### Extract Structured Data

```bash
curl -X POST https://api.firecrawl.dev/v1/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -d '{
    "urls": ["https://example.com"],
    "prompt": "Extract business name, address, phone, and email",
    "schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "address": {"type": "string"},
        "phone": {"type": "string"},
        "email": {"type": "string"}
      },
      "required": ["name"]
    }
  }'
```

## TypeScript SDK

### Installation

```bash
npm install @mendable/firecrawl-js
```

### Usage

```typescript
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Scrape
const scrapeResult = await app.scrapeUrl('https://example.com', {
  formats: ['markdown', 'html'],
});

console.log(scrapeResult.markdown);

// Crawl
const crawlResult = await app.crawlUrl('https://example.com', {
  maxDepth: 2,
  limit: 100,
});

// Map
const mapResult = await app.mapUrl('https://example.com', {
  search: 'blog',
});

console.log(mapResult.links);
```

## Self-Hosting

### Docker Compose

```yaml
version: '3.8'
services:
  firecrawl:
    image: mendable/firecrawl:latest
    ports:
      - "3002:3002"
    environment:
      - REDIS_URL=redis://redis:6379
      - PLAYWRIGHT_MICROSERVICE_URL=http://playwright:3000
    depends_on:
      - redis
      - playwright

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  playwright:
    image: mendable/firecrawl-playwright:latest
    ports:
      - "3000:3000"
```

### Environment Variables

```bash
# .env
FIRECRAWL_SELF_HOSTED=true
FIRECRAWL_BASE_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379
```

## MCP Integration

Firecrawl provides its own MCP server:

```bash
npx -y @mendable/firecrawl-mcp
```

### Tools Exposed

- `firecrawl_scrape` - Scrape single page
- `firecrawl_crawl` - Crawl multiple pages
- `firecrawl_map` - Discover URLs
- `firecrawl_extract` - Extract structured data
- `firecrawl_search` - Search the web

### Configuration

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "@mendable/firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "your-key"
      }
    }
  }
}
```

## Advanced Features

### Screenshot Capture

```typescript
const result = await app.scrapeUrl('https://example.com', {
  formats: ['screenshot'],
  screenshot: {
    fullPage: true,
    type: 'png',
  }
});

console.log(result.screenshot); // Base64 encoded image
```

### Wait for Element

```typescript
const result = await app.scrapeUrl('https://example.com', {
  waitFor: 5000, // Wait 5 seconds
  // or
  waitForSelector: '.content-loaded',
});
```

### Custom Headers

```typescript
const result = await app.scrapeUrl('https://example.com', {
  headers: {
    'User-Agent': 'ColdRunners/1.0',
    'Accept-Language': 'en-US,en;q=0.9',
  }
});
```

### Proxy Support

```typescript
const result = await app.scrapeUrl('https://example.com', {
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
  }
});
```

## Rate Limits

| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 20 | 500 |
| Hobby | 100 | 10,000 |
| Standard | 500 | 100,000 |
| Growth | 2000 | 1,000,000 |

### Rate Limit Handling

```typescript
async function scrapeWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await app.scrapeUrl(url);
      return result;
    } catch (err) {
      if (err.status === 429) {
        const retryAfter = err.headers['retry-after'] || 60;
        await sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Error Handling

```typescript
try {
  const result = await app.scrapeUrl('https://example.com');
  
  if (!result.success) {
    console.error('Scrape failed:', result.error);
  }
} catch (err) {
  if (err.status === 401) {
    console.error('Invalid API key');
  } else if (err.status === 429) {
    console.error('Rate limit exceeded');
  } else if (err.status === 500) {
    console.error('Firecrawl server error');
  }
}
```

## Best Practices

1. **Use `onlyMainContent: true`** - Removes navigation, footer, ads
2. **Set appropriate `maxDepth`** - Don't crawl entire sites unnecessarily
3. **Implement retry logic** - Handle transient failures
4. **Cache results** - Avoid re-scraping same URLs
5. **Respect robots.txt** - Firecrawl does this automatically
6. **Monitor usage** - Track API calls and costs

## Troubleshooting

### Timeout Errors

```typescript
const result = await app.scrapeUrl('https://example.com', {
  timeout: 60000, // 60 seconds
});
```

### JavaScript Not Rendering

```typescript
const result = await app.scrapeUrl('https://example.com', {
  waitFor: 5000,
  // or
  actions: [
    { type: 'wait', milliseconds: 3000 }
  ]
});
```

### Blocked by Anti-Bot

```typescript
const result = await app.scrapeUrl('https://example.com', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
  }
});
```

## Resources

- **Official Docs:** https://docs.firecrawl.dev
- **API Reference:** https://docs.firecrawl.dev/api-reference
- **GitHub:** https://github.com/mendableai/firecrawl
- **MCP Server:** https://github.com/mendableai/firecrawl-mcp
- **Status Page:** https://status.firecrawl.dev
