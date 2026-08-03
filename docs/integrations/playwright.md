# Playwright Integration Guide

## Overview

Playwright is a browser automation framework for web scraping, testing, and interaction with dynamic websites. ColdRunners uses Playwright for JavaScript-rendered content and complex web interactions.

**Official Documentation:** https://playwright.dev  
**GitHub:** https://github.com/microsoft/playwright  
**API Reference:** https://playwright.dev/docs/api/class-playwright

## Features

- Cross-browser support (Chromium, Firefox, WebKit)
- JavaScript rendering
- Automatic waiting
- Network interception
- Screenshot and PDF generation
- Mobile emulation
- Geolocation and permissions
- Headless and headed modes

## Installation

### Node.js

```bash
npm install playwright

# Install browsers
npx playwright install
```

### Python (for Crawl4AI integration)

```bash
pip install playwright
playwright install chromium
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
```

## ColdRunners Usage

### Basic Scraping

```typescript
// src/server/services/playwright-scraper.ts
import { chromium, Browser, Page } from 'playwright';

export class PlaywrightScraper {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async scrape(url: string): Promise<ScrapeResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Extract content
      const title = await page.title();
      const content = await page.content();
      const text = await page.evaluate(() => document.body.innerText);

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
      });

      return {
        url,
        title,
        html: content,
        text,
        screenshot: screenshot.toString('base64'),
        metadata: await this.extractMetadata(page),
      };
    } finally {
      await page.close();
    }
  }

  private async extractMetadata(page: Page): Promise<Record<string, string>> {
    return await page.evaluate(() => {
      const meta: Record<string, string> = {};

      // Title
      meta.title = document.title;

      // Description
      const desc = document.querySelector('meta[name="description"]');
      if (desc) meta.description = desc.getAttribute('content') || '';

      // Keywords
      const keywords = document.querySelector('meta[name="keywords"]');
      if (keywords) meta.keywords = keywords.getAttribute('content') || '';

      // Open Graph
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) meta.ogTitle = ogTitle.getAttribute('content') || '';

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) meta.ogImage = ogImage.getAttribute('content') || '';

      return meta;
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

### Dynamic Content Handling

```typescript
async function scrapeDynamicContent(url: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);

  // Wait for specific element to appear
  await page.waitForSelector('.content-loaded', {
    timeout: 10000,
  });

  // Scroll to load lazy content
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });

  // Wait for additional content
  await page.waitForTimeout(2000);

  const content = await page.content();
  await browser.close();

  return content;
}
```

### Form Interaction

```typescript
async function submitForm(url: string, data: Record<string, string>): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);

  // Fill form fields
  for (const [selector, value] of Object.entries(data)) {
    await page.fill(selector, value);
  }

  // Click submit button
  await page.click('button[type="submit"]');

  // Wait for navigation or response
  await page.waitForNavigation({
    waitUntil: 'networkidle',
  });

  await browser.close();
}
```

### Screenshot Capture

```typescript
async function captureScreenshot(url: string, outputPath: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Full page screenshot
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: 'png',
  });

  await browser.close();
}
```

### Mobile Emulation

```typescript
async function scrapeMobileView(url: string): Promise<string> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const content = await page.content();
  await browser.close();

  return content;
}
```

### Network Interception

```typescript
async function scrapeWithBlockedResources(url: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Block images, stylesheets, and fonts
  await page.route('**/*', route => {
    const resourceType = route.request().resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  const content = await page.content();
  await browser.close();

  return content;
}
```

### Authentication

```typescript
async function scrapeAuthenticated(url: string, credentials: {
  username: string;
  password: string;
}): Promise<string> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page
  await page.goto('https://example.com/login');

  // Fill credentials
  await page.fill('#username', credentials.username);
  await page.fill('#password', credentials.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for authentication
  await page.waitForNavigation({ waitUntil: 'networkidle' });

  // Navigate to protected page
  await page.goto(url);
  const content = await page.content();

  await browser.close();
  return content;
}
```

### PDF Generation

```typescript
async function generatePDF(url: string, outputPath: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm',
    },
  });

  await browser.close();
}
```

## Integration with Agent System

### Website Analyzer Agent

```typescript
// src/server/agents/playwright-analyzer.ts
import { chromium } from 'playwright';

export class PlaywrightAnalyzerAgent {
  name = 'Playwright Website Analyzer';

  async execute(context: AgentContext): Promise<AgentResult> {
    const browser = await chromium.launch();
    let processed = 0;

    try {
      for (const lead of context.leads) {
        if (!lead.website) continue;

        const url = lead.website.startsWith('http')
          ? lead.website
          : `https://${lead.website}`;

        const page = await browser.newPage();

        try {
          // Measure load time
          const startTime = Date.now();
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          const loadTime = Date.now() - startTime;

          // Extract performance metrics
          const metrics = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
              domContentLoaded: perf.domContentLoadedEventEnd - perf.startTime,
              loadComplete: perf.loadEventEnd - perf.startTime,
              domInteractive: perf.domInteractive - perf.startTime,
            };
          });

          // Check for common issues
          const issues = await page.evaluate(() => {
            const issues: string[] = [];

            // Check for missing meta tags
            if (!document.querySelector('meta[name="description"]')) {
              issues.push('Missing meta description');
            }

            // Check for missing alt attributes
            const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
            if (imagesWithoutAlt.length > 0) {
              issues.push(`${imagesWithoutAlt.length} images missing alt attributes`);
            }

            // Check for mixed content
            if (window.location.protocol === 'https:') {
              const httpResources = document.querySelectorAll('[src^="http:"]');
              if (httpResources.length > 0) {
                issues.push('Mixed content detected (HTTP resources on HTTPS page)');
              }
            }

            return issues;
          });

          // Update lead audit
          lead.audit.loadTimeMs = loadTime;
          lead.audit.issues = [...lead.audit.issues, ...issues];

          processed++;

          context.onLog({
            agent: this.name,
            level: 'info',
            message: `Analyzed ${lead.name} with Playwright`,
          });
        } catch (err) {
          context.onLog({
            agent: this.name,
            level: 'warning',
            message: `Failed to analyze ${lead.name}: ${(err as Error).message}`,
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }

    return { success: true, itemsProcessed: processed };
  }
}
```

## Performance Optimization

### Browser Pool

```typescript
import { Browser, chromium } from 'playwright';

class BrowserPool {
  private browsers: Browser[] = [];
  private maxSize: number;

  constructor(maxSize: number = 5) {
    this.maxSize = maxSize;
  }

  async acquire(): Promise<Browser> {
    if (this.browsers.length > 0) {
      return this.browsers.pop()!;
    }

    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
  }

  async release(browser: Browser): Promise<void> {
    if (this.browsers.length < this.maxSize) {
      this.browsers.push(browser);
    } else {
      await browser.close();
    }
  }

  async closeAll(): Promise<void> {
    for (const browser of this.browsers) {
      await browser.close();
    }
    this.browsers = [];
  }
}

const pool = new BrowserPool(5);

// Usage
async function scrapeWithPool(url: string) {
  const browser = await pool.acquire();
  try {
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    await page.close();
    return content;
  } finally {
    await pool.release(browser);
  }
}
```

### Resource Blocking

```typescript
async function scrapeFast(url: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Block unnecessary resources
  await page.route('**/*', route => {
    const type = route.request().resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const content = await page.content();
  await browser.close();

  return content;
}
```

## Error Handling

```typescript
async function safeScrape(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const content = await page.content();
      await browser.close();

      return content;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Troubleshooting

### Browser Not Launching

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install -y \
  libwoff1 \
  libopus0 \
  libwebp6 \
  libwebpdemux2 \
  libenchant1c2a \
  libgudev-1.0-0 \
  libsecret-1-0 \
  libhyphen0 \
  libgdk-pixbuf2.0-0 \
  libegl1 \
  libnotify4 \
  libxslt1.1 \
  libvpx6 \
  libxcomposite1 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libepoxy0 \
  libgtk-3-0 \
  libharfbuzz-icu0
```

### Timeout Errors

```typescript
// Increase timeout
await page.goto(url, {
  timeout: 60000,  // 60 seconds
});

// Or wait for specific event
await page.goto(url, {
  waitUntil: 'domcontentloaded',  // Faster than 'networkidle'
});
```

### Memory Issues

```typescript
// Launch with reduced memory
const browser = await chromium.launch({
  args: [
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
  ],
});
```

### Detection by Anti-Bot

```typescript
// Use stealth plugin
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const browser = await chromium.launch();
```

## Resources

- **Official Docs:** https://playwright.dev
- **API Reference:** https://playwright.dev/docs/api/class-playwright
- **GitHub:** https://github.com/microsoft/playwright
- **Examples:** https://github.com/microsoft/playwright-examples
- **Trace Viewer:** https://playwright.dev/docs/trace-viewer
