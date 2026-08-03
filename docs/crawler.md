# Crawler Architecture

## Overview

ColdRunners uses a multi-layered crawling strategy that prioritizes AI-friendly content sources (llms.txt) before falling back to traditional web scraping. All crawling is done with compliant, open-source tools.

## Crawler Stack

| Tool | Purpose | License |
|------|---------|---------|
| Crawl4AI | Primary local crawler, JS rendering | Open Source |
| Firecrawl | Web scraping, search, map, extract | AGPL (self-host) |
| Playwright | Browser automation, dynamic sites | Apache 2.0 |
| BeautifulSoup | HTML parsing (Python workers) | MIT |
| Trafilatura | Content extraction | Apache 2.0 |
| Readability | Article extraction | Apache 2.0 |
| Mercury Parser | Content extraction | Apache 2.0 |

## Crawl Priority

```
Input URL
    ↓
1. Check robots.txt
    ↓ (allowed?)
2. Check llms.txt
    ↓ (exists?)
3. Check llms-full.txt
    ↓ (exists?)
4. Check sitemap.xml
    ↓ (found?)
5. Crawl with Crawl4AI
    ↓ (JS needed?)
6. Fallback to Playwright
    ↓
7. Extract clean Markdown
    ↓
8. Chunk content
    ↓
9. Generate embeddings (BGE-M3)
    ↓
10. Store in Qdrant
    ↓
11. Generate AI summary
```

## llms.txt Discovery

The `llms.txt` convention provides a curated, machine-readable summary of a site's important content for AI agents.

### Discovery Flow

```
https://domain.com/llms.txt
    ↓
HTTP 200?
    ├─ Yes → Parse markdown
    │         ↓
    │       Extract links
    │         ↓
    │       Prioritize important pages
    │         ↓
    │       Crawl prioritized URLs
    │         ↓
    │       Embed + store
    │
    └─ No → Check llms-full.txt
              ↓
            HTTP 200?
              ├─ Yes → Parse full content
              └─ No → Fall back to sitemap.xml / crawl
```

### llms.txt Format

```markdown
# Example Business

> A dental clinic in Toronto specializing in cosmetic dentistry.

## Docs
- [About Us](https://example.com/about)
- [Services](https://example.com/services)
- [Contact](https://example.com/contact)
- [Booking](https://example.com/book)

## Optional
- [Blog](https://example.com/blog)
- [FAQ](https://example.com/faq)
- [Team](https://example.com/team)
```

## Crawl4AI

### Features

- Fully open source, runs locally
- JavaScript rendering via Playwright
- Markdown output (AI-ready)
- JSON extraction with schemas
- Parallel crawling
- Session management
- Proxy support

### Usage

```python
from crawl4ai import WebCrawler, CrawlerRunConfig
from crawl4ai.content_filter import PruneContentFilter

config = CrawlerRunConfig(
    content_filter=PruneContentFilter(),
    word_count_threshold=100,
)

crawler = WebCrawler()
result = crawler.run(url="https://example.com", config=config)

# Access clean markdown
markdown = result.markdown
```

### Integration with ColdRunners

```
Python Worker (Crawl4AI)
    ↓ HTTP/gRPC
NestJS API Server
    ↓
Qdrant Vector Store
```

## Firecrawl

### Features

- Crawl, search, map, extract
- Browser automation
- Markdown conversion
- Self-hostable (AGPL) or cloud
- MCP integration
- llms.txt support

### API Usage

```typescript
const result = await pluginRegistry.executePlugin('firecrawl', {
  url: 'https://example.com',
});
// result.data = { markdown, metadata, links, techStack }
```

### Firecrawl MCP

Firecrawl exposes its own MCP server for direct AI agent integration:

```
Firecrawl MCP Server
├── crawl_url
├── map_site
├── extract_data
├── search
└── scrape
```

## Playwright

### Use Cases

- Login-protected pages
- Dynamic JavaScript websites
- Infinite scroll handling
- Screenshot capture
- Form interaction
- Multi-page navigation

### Usage

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
const content = await page.content();
const screenshot = await page.screenshot();
await browser.close();
```

## Content Processing Pipeline

```
Raw HTML / Markdown
    ↓
1. Remove navigation, footer, ads
    ↓
2. Extract main content (Trafilatura/Readability)
    ↓
3. Clean whitespace, normalize formatting
    ↓
4. Chunk into semantic sections (500-1000 tokens)
    ↓
5. Generate embeddings (BGE-M3)
    ↓
6. Store in Qdrant with metadata
    ↓
7. Generate AI summary (local LLM)
    ↓
8. Index for search
```

## Robots.txt Compliance

```typescript
async function checkRobotsTxt(url: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url).href;
  const response = await fetch(robotsUrl);
  if (!response.ok) return true; // No robots.txt = allowed

  const content = await response.text();
  const userAgent = 'ColdRunners';
  // Parse User-agent and Disallow rules
  // Return false if disallowed
  return true;
}
```

## Rate Limiting

```
Per-domain rate limit: 1 request per 2 seconds
Concurrent crawls: max 5
Retry with backoff: 3 attempts
Timeout: 30 seconds per page
Respect Crawl-delay in robots.txt
```

## Sitemap Parsing

```typescript
async function parseSitemap(url: string): Promise<string[]> {
  const sitemapUrl = new URL('/sitemap.xml', url).href;
  const response = await fetch(sitemapUrl);
  if (!response.ok) return [];

  const xml = await response.text();
  // Parse <loc> elements from sitemap
  // Handle sitemap index files recursively
  return urls;
}
```

## Phase 2 Implementation

1. Add Crawl4AI Python worker service
2. Create crawl queue in BullMQ
3. Implement llms.txt discovery agent
4. Add sitemap parsing utility
5. Create content cleaning pipeline
6. Integrate BGE-M3 embeddings via Ollama
7. Set up Qdrant vector store
8. Create search API endpoint
9. Add crawl result caching
10. Implement robots.txt compliance checker
