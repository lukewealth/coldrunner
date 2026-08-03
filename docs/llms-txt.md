# llms.txt Convention

## Overview

`llms.txt` is an emerging convention for websites to expose a curated, machine-readable summary of their content for AI agents. ColdRunners checks for `llms.txt` on every discovered business website to prioritize important content for crawling and indexing.

## Specification

### File Location

```
https://example.com/llms.txt
https://example.com/llms-full.txt
```

### Format

Markdown with YAML-like structure:

```markdown
# Company Name

> One-line description of the business.

## Docs
- [About](https://example.com/about)
- [Services](https://example.com/services)
- [Contact](https://example.com/contact)
- [Booking](https://example.com/book)

## Optional
- [Blog](https://example.com/blog)
- [FAQ](https://example.com/faq)
- [Team](https://example.com/team)
- [Careers](https://example.com/careers)
```

### Sections

| Section | Purpose | Priority |
|---------|---------|----------|
| `# Title` | Business name | Required |
| `> Description` | One-line summary | Recommended |
| `## Docs` | Important pages | High priority for crawling |
| `## Optional` | Secondary pages | Lower priority |
| `## API` | API documentation | If applicable |

## Discovery Flow

```
For each discovered business website:
    ↓
1. Fetch https://domain.com/robots.txt
    ↓ (check if ColdRunners user-agent is allowed)
2. Fetch https://domain.com/llms.txt
    ↓
    HTTP 200?
    ├─ Yes → Parse markdown
    │         ↓
    │       Extract all URLs
    │         ↓
    │       Classify: Docs (high) vs Optional (low)
    │         ↓
    │       Crawl Docs URLs first
    │         ↓
    │       Embed content (BGE-M3)
    │         ↓
    │       Store in Qdrant
    │
    └─ No → Check https://domain.com/llms-full.txt
              ↓
              HTTP 200?
              ├─ Yes → Parse full content directly
              └─ No → Fall back to sitemap.xml / full crawl
```

## Implementation

### llms.txt Parser

```typescript
interface LlmsTxt {
  title: string;
  description?: string;
  docs: { title: string; url: string }[];
  optional: { title: string; url: string }[];
  api?: { title: string; url: string }[];
}

function parseLlmsTxt(markdown: string): LlmsTxt {
  const lines = markdown.split('\n');
  const result: LlmsTxt = { title: '', docs: [], optional: [] };

  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      result.title = line.replace('# ', '').trim();
    } else if (line.startsWith('> ')) {
      result.description = line.replace('> ', '').trim();
    } else if (line.startsWith('## Docs')) {
      currentSection = 'docs';
    } else if (line.startsWith('## Optional')) {
      currentSection = 'optional';
    } else if (line.startsWith('## API')) {
      currentSection = 'api';
    } else if (line.startsWith('- [')) {
      const match = line.match(/- \[(.+?)\]\((.+?)\)/);
      if (match) {
        const entry = { title: match[1], url: match[2] };
        if (currentSection === 'docs') result.docs.push(entry);
        else if (currentSection === 'optional') result.optional.push(entry);
        else if (currentSection === 'api') {
          if (!result.api) result.api = [];
          result.api.push(entry);
        }
      }
    }
  }

  return result;
}
```

### Integration with Crawler

```typescript
async function crawlWithLlmsTxt(domain: string): Promise<CrawlResult> {
  // Step 1: Try llms.txt
  const llmsTxt = await fetchLlmsTxt(domain);
  if (llmsTxt) {
    const parsed = parseLlmsTxt(llmsTxt);

    // Step 2: Crawl high-priority docs first
    const docResults = await Promise.all(
      parsed.docs.map((d) => crawlUrl(d.url))
    );

    // Step 3: Crawl optional pages
    const optionalResults = await Promise.all(
      parsed.optional.slice(0, 5).map((o) => crawlUrl(o.url))
    );

    return {
      source: 'llms.txt',
      title: parsed.title,
      description: parsed.description,
      pages: [...docResults, ...optionalResults],
    };
  }

  // Step 4: Fall back to sitemap / full crawl
  return crawlFallback(domain);
}
```

## Benefits

1. **Reduced crawling** — Only crawl important pages
2. **Better content** — Curated by the site owner
3. **Faster indexing** — Prioritized URL list
4. **Lower bandwidth** — Fewer unnecessary requests
5. **Respectful** — Site owners control what AI agents see

## ColdRunners llms.txt

ColdRunners exposes its own `llms.txt` at the repository root for AI agents to discover project documentation. See `/llms.txt`.

## Adoption

The `llms.txt` convention is supported by:
- Chrome for Developers (Lighthouse)
- Firecrawl
- Crawl4AI
- Various AI agent frameworks

## Resources

- [llms.txt spec](https://llmstxt.org)
- [Chrome for Developers guide](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt)
- [Firecrawl llms.txt support](https://docs.firecrawl.dev)
