import { BasePlugin } from './base';
import { PluginResult } from '../types';
import { config } from '../config';

export interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  category: string;
  score?: number;
  publishedDate?: string;
}

export interface SearXNGSearchParams {
  query: string;
  categories?: string[];
  language?: string;
  pageno?: number;
  safesearch?: number;
  format?: string;
}

export class SearXNGPlugin extends BasePlugin {
  name = 'searxng';
  version = '1.0.0';
  description = 'Self-hosted SearXNG metasearch engine for private web search without API keys';

  private baseUrl: string;
  private available = false;

  constructor() {
    super();
    this.baseUrl = process.env.SEARXNG_URL || 'http://localhost:8888';
  }

  async initialize(): Promise<void> {
    await super.initialize();
    try {
      const res = await fetch(`${this.baseUrl}/search?q=test&format=json`, {
        signal: AbortSignal.timeout(5000),
      });
      this.available = res.ok;
    } catch {
      this.available = false;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.initialized) return false;
    try {
      const res = await fetch(`${this.baseUrl}/search?q=healthcheck&format=json`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async execute(params: any): Promise<PluginResult> {
    const { query, categories, language, pageno, safesearch } = params as SearXNGSearchParams;

    if (!query) {
      return {
        success: false,
        error: 'Query parameter is required',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    const cached = this.getCachedResult<PluginResult>({ query, categories });
    if (cached) return cached;

    if (!this.available) {
      return {
        success: false,
        error: 'SearXNG is not available. Ensure the SearXNG Docker container is running.',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
        data: { fallback: 'SearXNG unavailable' },
      };
    }

    try {
      const searchParams = new URLSearchParams({
        q: query,
        format: 'json',
      });

      if (categories?.length) searchParams.set('categories', categories.join(','));
      if (language) searchParams.set('language', language);
      if (pageno) searchParams.set('pageno', String(pageno));
      if (safesearch !== undefined) searchParams.set('safesearch', String(safesearch));

      const res = await this.fetchWithRetry(
        `${this.baseUrl}/search?${searchParams.toString()}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!res.ok) {
        throw new Error(`SearXNG returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const results: SearXNGResult[] = (data.results || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        engine: r.engine || 'unknown',
        category: r.category || 'general',
        score: r.score,
        publishedDate: r.publishedDate,
      }));

      const result: PluginResult = {
        success: true,
        data: {
          query,
          results,
          totalResults: results.length,
          engines: [...new Set(results.map((r) => r.engine))],
          suggestions: data.suggestions || [],
          corrections: data.corrections || [],
        },
        confidence: 90,
        source: this.name,
        timestamp: new Date(),
      };

      this.setCachedResult({ query, categories }, result, 300000);
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: `SearXNG search failed: ${err.message}`,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }

  async scrapeUrl(url: string): Promise<PluginResult> {
    if (!this.available) {
      return {
        success: false,
        error: 'SearXNG unavailable',
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }

    try {
      const res = await this.fetchWithRetry(
        `${this.baseUrl}/search?q=${encodeURIComponent(url)}&format=json&categories=general`,
        { signal: AbortSignal.timeout(10000) },
      );

      const data = await res.json();
      const pageResult = (data.results || []).find((r: any) => r.url === url);

      return {
        success: true,
        data: {
          url,
          title: pageResult?.title || '',
          content: pageResult?.content || '',
          engine: pageResult?.engine || 'unknown',
        },
        confidence: 80,
        source: this.name,
        timestamp: new Date(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: `URL scrape failed: ${err.message}`,
        confidence: 0,
        source: this.name,
        timestamp: new Date(),
      };
    }
  }
}
