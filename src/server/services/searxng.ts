import { createHash } from 'node:crypto';

const SEARXNG_BASE_URL = process.env.SEARXNG_BASE_URL?.trim() || '';

export interface SearXNGResult {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
  score?: number;
}

export interface SearXNGSearchResponse {
  results: SearXNGResult[];
  cached: boolean;
  query: string;
  engines: string[];
}

const cache = new Map<string, { data: SearXNGResult[]; expires: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function searchSearXNG(query: string, maxResults = 10): Promise<SearXNGSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], cached: false, query: trimmed, engines: [] };

  if (!SEARXNG_BASE_URL) {
    return searchFallback(trimmed, maxResults);
  }

  const key = cacheKey(trimmed);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return { results: cached.data.slice(0, maxResults), cached: true, query: trimmed, engines: ['cache'] };
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    language: 'en',
    safesearch: '1',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${SEARXNG_BASE_URL}/search?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[SearXNG] HTTP ${res.status}`);
      return searchFallback(trimmed, maxResults);
    }

    const data = await res.json() as {
      results?: Array<{ title?: string; url?: string; content?: string; engine?: string; score?: number }>;
      engines?: string[];
    };

    if (!Array.isArray(data.results)) {
      return searchFallback(trimmed, maxResults);
    }

    const results: SearXNGResult[] = data.results
      .filter((r) => r.url && r.title)
      .slice(0, maxResults)
      .map((r) => ({
        title: String(r.title || ''),
        url: String(r.url || ''),
        snippet: String(r.content || '').slice(0, 500),
        engine: r.engine || 'unknown',
        score: r.score,
      }));

    if (results.length > 0) {
      cache.set(key, { data: results, expires: Date.now() + CACHE_TTL_MS });
    }

    return {
      results,
      cached: false,
      query: trimmed,
      engines: data.engines || ['searxng'],
    };
  } catch (err: any) {
    console.error('[SearXNG] fetch error:', err.message);
    return searchFallback(trimmed, maxResults);
  }
}

async function searchFallback(query: string, maxResults: number): Promise<SearXNGSearchResponse> {
  const results: SearXNGResult[] = [];

  try {
    const ddgParams = new URLSearchParams({ q: query, format: 'json', no_redirect: '1' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://api.duckduckgo.com/?${ddgParams}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as any;
      if (data.AbstractURL && data.Abstract) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: (data.Abstract || '').slice(0, 500),
          engine: 'duckduckgo',
        });
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - 1)) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.slice(0, 80),
              url: topic.FirstURL,
              snippet: topic.Text.slice(0, 500),
              engine: 'duckduckgo',
            });
          }
        }
      }
    }
  } catch {}

  if (results.length === 0) {
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${maxResults}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (wikiRes.ok) {
        const data = await wikiRes.json() as any;
        if (data.query?.search) {
          for (const item of data.query.search) {
            results.push({
              title: item.title,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
              snippet: (item.snippet || '').replace(/<[^>]*>/g, '').slice(0, 500),
              engine: 'wikipedia',
            });
          }
        }
      }
    } catch {}
  }

  return {
    results: results.slice(0, maxResults),
    cached: false,
    query,
    engines: results.length > 0 ? ['duckduckgo', 'wikipedia'] : [],
  };
}

function cacheKey(query: string): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export function clearSearXNGCache(): void {
  cache.clear();
}
