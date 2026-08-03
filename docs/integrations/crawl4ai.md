# Crawl4AI Integration Guide

## Overview

Crawl4AI is a fully open-source web crawler designed for AI applications. It provides JavaScript rendering, markdown output, and structured data extraction.

**Official Documentation:** https://docs.crawl4ai.com  
**GitHub:** https://github.com/unclecode/crawl4ai

## Features

- JavaScript rendering via Playwright
- Markdown output (AI-ready)
- JSON extraction with schemas
- Parallel crawling
- Session management
- Proxy support
- Content filtering
- Chunking strategies

## Installation

### Python

```bash
pip install crawl4ai
playwright install chromium
```

### Docker

```bash
docker pull unclecode/crawl4ai
docker run -p 11234:11234 unclecode/crawl4ai
```

## ColdRunners Integration

### Architecture

```
Python Worker (Crawl4AI)
    ↓ HTTP/gRPC
NestJS API Server
    ↓
Qdrant Vector Store
```

### Worker Implementation

```python
# workers/crawler.py
from crawl4ai import WebCrawler, CrawlerRunConfig
from crawl4ai.content_filter import PruneContentFilter
from crawl4ai.chunking import RegexChunking
import asyncio
import httpx

crawler = WebCrawler()
crawler.warmup()

async def crawl_and_store(url: str, job_id: str):
    config = CrawlerRunConfig(
        content_filter=PruneContentFilter(),
        chunking_strategy=RegexChunking(),
        word_count_threshold=100,
        bypass_cache=True,
    )
    
    result = crawler.run(url=url, config=config)
    
    if result.success:
        # Store in vector database
        await store_embeddings(result.markdown, url, job_id)
        
        # Notify API server
        async with httpx.AsyncClient() as client:
            await client.post(
                'http://api:3000/api/workers/crawl/complete',
                json={'jobId': job_id, 'status': 'completed'}
            )
    else:
        # Report failure
        async with httpx.AsyncClient() as client:
            await client.post(
                'http://api:3000/api/workers/crawl/complete',
                json={'jobId': job_id, 'status': 'failed', 'error': result.error}
            )

async def store_embeddings(markdown: str, url: str, job_id: str):
    # Chunk content
    chunks = chunk_content(markdown)
    
    # Generate embeddings
    embeddings = await generate_embeddings(chunks)
    
    # Store in Qdrant
    await qdrant_client.upload_collection(
        collection_name='crawled_content',
        vectors=embeddings,
        payload=[
            {'url': url, 'chunk': chunk, 'job_id': job_id}
            for chunk in chunks
        ]
    )
```

### API Server Integration

```typescript
// src/server/services/crawl-service.ts
import { Queue } from 'bullmq';

const crawlQueue = new Queue('crawl', {
  connection: { host: 'localhost', port: 6379 }
});

export async function startCrawl(url: string): Promise<string> {
  const jobId = `crawl-${Date.now()}`;
  
  await crawlQueue.add('crawl-url', {
    url,
    jobId,
    options: {
      followLinks: true,
      maxDepth: 2,
      maxPages: 50,
    }
  });
  
  return jobId;
}

export async function getCrawlStatus(jobId: string): Promise<CrawlStatus> {
  const job = await crawlQueue.getJob(jobId);
  
  return {
    jobId,
    status: job?.getState() ?? 'unknown',
    progress: job?.progress ?? 0,
    result: job?.returnvalue,
  };
}
```

## Advanced Usage

### Structured Data Extraction

```python
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

schema = {
    'name': 'Business Info',
    'baseSelector': 'div.business-info',
    'fields': [
        {'name': 'name', 'selector': 'h1.title'},
        {'name': 'address', 'selector': 'span.address'},
        {'name': 'phone', 'selector': 'a.phone'},
        {'name': 'rating', 'selector': 'span.rating'},
    ]
}

config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(schema)
)

result = crawler.run(url='https://example.com', config=config)
print(result.extracted_content)  # JSON string
```

### JavaScript Execution

```python
from crawl4ai.js_executor import JsExecutor

js_executor = JsExecutor()

# Execute JavaScript and get result
config = CrawlerRunConfig(
    js_code="window.scrollTo(0, document.body.scrollHeight);",
    js_only=True,
    wait_for="css:.content-loaded"
)

result = crawler.run(url='https://example.com', config=config)
```

### Proxy Configuration

```python
config = CrawlerRunConfig(
    proxy={
        'server': 'http://proxy.example.com:8080',
        'username': 'user',
        'password': 'pass'
    }
)
```

### Session Management

```python
from crawl4ai.session import BrowserSession

session = BrowserSession(
    headless=True,
    user_agent='ColdRunners/1.0',
    viewport={'width': 1920, 'height': 1080}
)

config = CrawlerRunConfig(
    session=session
)
```

## Content Filtering

### PruneContentFilter

Removes boilerplate content (navigation, footer, ads):

```python
from crawl4ai.content_filter import PruneContentFilter

config = CrawlerRunConfig(
    content_filter=PruneContentFilter(
        threshold=0.48,
        min_word_count=100
    )
)
```

### Custom Filter

```python
from crawl4ai.content_filter import ContentFilter

class BusinessContentFilter(ContentFilter):
    def filter(self, content: str) -> str:
        # Remove irrelevant sections
        lines = content.split('\n')
        filtered = [
            line for line in lines
            if not self._is_irrelevant(line)
        ]
        return '\n'.join(filtered)
    
    def _is_irrelevant(self, line: str) -> bool:
        irrelevant_patterns = [
            'cookie policy',
            'privacy policy',
            'terms of service',
        ]
        return any(p in line.lower() for p in irrelevant_patterns)

config = CrawlerRunConfig(
    content_filter=BusinessContentFilter()
)
```

## Chunking Strategies

### RegexChunking

```python
from crawl4ai.chunking import RegexChunking

config = CrawlerRunConfig(
    chunking_strategy=RegexChunking(
        pattern=r'\n##\s+',  # Split on markdown headers
        min_chunk_size=200,
        max_chunk_size=1000
    )
)
```

### SlidingWindowChunking

```python
from crawl4ai.chunking import SlidingWindowChunking

config = CrawlerRunConfig(
    chunking_strategy=SlidingWindowChunking(
        window_size=500,
        step_size=250
    )
)
```

## Performance Optimization

### Parallel Crawling

```python
import asyncio
from crawl4ai import AsyncWebCrawler

async def crawl_multiple(urls: list[str]):
    async with AsyncWebCrawler() as crawler:
        tasks = [
            crawler.run(url=url, config=CrawlerRunConfig())
            for url in urls
        ]
        results = await asyncio.gather(*tasks)
        return results
```

### Rate Limiting

```python
import time

class RateLimitedCrawler:
    def __init__(self, requests_per_second: int = 2):
        self.delay = 1.0 / requests_per_second
        self.last_request = 0
    
    async def crawl(self, url: str):
        elapsed = time.time() - self.last_request
        if elapsed < self.delay:
            await asyncio.sleep(self.delay - elapsed)
        
        self.last_request = time.time()
        return crawler.run(url=url, config=CrawlerRunConfig())
```

## Error Handling

```python
from crawl4ai.exceptions import CrawlError, TimeoutError

try:
    result = crawler.run(url='https://example.com', config=config)
    
    if not result.success:
        print(f"Crawl failed: {result.error}")
        
except TimeoutError:
    print("Crawl timed out")
except CrawlError as e:
    print(f"Crawl error: {e}")
```

## Integration with llms.txt

```python
async def crawl_with_llms_txt(domain: str):
    # Try llms.txt first
    llms_txt_url = f"https://{domain}/llms.txt"
    result = crawler.run(url=llms_txt_url, config=CrawlerRunConfig())
    
    if result.success and result.markdown:
        # Parse llms.txt
        parsed = parse_llms_txt(result.markdown)
        
        # Crawl high-priority docs
        for doc in parsed['docs']:
            await crawl_and_store(doc['url'])
    else:
        # Fall back to sitemap
        sitemap_url = f"https://{domain}/sitemap.xml"
        # ... parse and crawl
```

## Monitoring

### Metrics

```python
from prometheus_client import Counter, Histogram

CRAWL_REQUESTS = Counter('crawl_requests_total', 'Total crawl requests')
CRAWL_DURATION = Histogram('crawl_duration_seconds', 'Crawl duration')
CRAWL_ERRORS = Counter('crawl_errors_total', 'Total crawl errors')

@CRAWL_DURATION.time()
def crawl_with_metrics(url: str):
    CRAWL_REQUESTS.inc()
    try:
        result = crawler.run(url=url, config=CrawlerRunConfig())
        if not result.success:
            CRAWL_ERRORS.inc()
        return result
    except Exception as e:
        CRAWL_ERRORS.inc()
        raise
```

## Troubleshooting

### JavaScript Not Rendering

```python
# Increase wait time
config = CrawlerRunConfig(
    wait_for="css:.content-loaded",
    delay_before_return_html=2.0
)
```

### Blocked by Anti-Bot

```python
# Use realistic browser fingerprint
config = CrawlerRunConfig(
    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
    headers={
        'Accept': 'text/html,application/xhtml+xml,...',
        'Accept-Language': 'en-US,en;q=0.9',
    }
)
```

### Memory Issues

```python
# Limit concurrent crawls
config = CrawlerRunConfig(
    max_concurrent=5,
    clear_cookies=True
)
```

## Resources

- **Official Docs:** https://docs.crawl4ai.com
- **GitHub:** https://github.com/unclecode/crawl4ai
- **Examples:** https://github.com/unclecode/crawl4ai/tree/main/docs/examples
- **Discord:** https://discord.gg/crawl4ai
