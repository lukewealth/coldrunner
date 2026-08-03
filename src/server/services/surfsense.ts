const SURFSENSE_API_URL = process.env.SURFSENSE_API_URL?.trim() || '';
const SURFSENSE_API_KEY = process.env.SURFSENSE_API_KEY?.trim() || '';
const SURFSENSE_WORKSPACE_ID = process.env.SURFSENSE_WORKSPACE_ID?.trim() || '';

export interface SurfSenseGoogleMapsResult {
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  website?: string;
  category?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  hours?: string;
  priceLevel?: string;
}

export interface SurfSenseIndeedResult {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url?: string;
  postedAt?: string;
  jobType?: string;
}

export interface SurfSenseWebCrawlResult {
  url: string;
  title: string;
  content: string;
  metadata?: Record<string, string>;
}

export interface SurfSenseGoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  position?: number;
}

async function surfSenseRequest<T>(endpoint: string, body: any): Promise<T | null> {
  if (!SURFSENSE_API_URL || !SURFSENSE_API_KEY) return null;

  try {
    const res = await fetch(`${SURFSENSE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SURFSENSE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error(`[SurfSense] ${endpoint} returned ${res.status}`);
      return null;
    }

    return await res.json() as T;
  } catch (err: any) {
    console.error(`[SurfSense] ${endpoint} error:`, err.message);
    return null;
  }
}

export async function searchGoogleMaps(query: string, location: string): Promise<SurfSenseGoogleMapsResult[]> {
  if (!SURFSENSE_API_URL) return [];

  const workspacePath = SURFSENSE_WORKSPACE_ID
    ? `/workspaces/${SURFSENSE_WORKSPACE_ID}/scrapers/google-maps/scrape`
    : '/scrapers/google-maps/scrape';

  const data = await surfSenseRequest<any>(workspacePath, {
    search_queries: [query],
    location: location,
    max_results: 20,
  });

  if (!data?.results) return [];

  return data.results.map((r: any) => ({
    name: r.name || r.title || '',
    address: r.address || '',
    rating: Number(r.rating) || 0,
    reviewCount: Number(r.review_count || r.reviews_count) || 0,
    phone: r.phone || r.phone_number || undefined,
    website: r.website || r.url || undefined,
    category: r.category || r.type || undefined,
    lat: r.latitude || r.lat || undefined,
    lng: r.longitude || r.lng || undefined,
    placeId: r.place_id || undefined,
    hours: r.hours || r.opening_hours || undefined,
    priceLevel: r.price_level || undefined,
  }));
}

export async function searchIndeed(query: string, location: string, options?: { remoteOnly?: boolean; maxResults?: number }): Promise<SurfSenseIndeedResult[]> {
  if (!SURFSENSE_API_URL) return [];

  const workspacePath = SURFSENSE_WORKSPACE_ID
    ? `/workspaces/${SURFSENSE_WORKSPACE_ID}/scrapers/indeed/scrape`
    : '/scrapers/indeed/scrape';

  const data = await surfSenseRequest<any>(workspacePath, {
    search_queries: [query],
    location: location,
    max_results: options?.maxResults || 20,
    remote_only: options?.remoteOnly || false,
  });

  if (!data?.results) return [];

  return data.results.map((r: any) => ({
    title: r.title || r.job_title || '',
    company: r.company || r.company_name || '',
    location: r.location || '',
    salary: r.salary || r.salary_text || undefined,
    description: (r.description || r.snippet || '').slice(0, 1000),
    url: r.url || r.job_url || undefined,
    postedAt: r.posted_at || r.date || undefined,
    jobType: r.job_type || r.type || undefined,
  }));
}

export async function searchGoogle(query: string, maxResults = 10): Promise<SurfSenseGoogleSearchResult[]> {
  if (!SURFSENSE_API_URL) return [];

  const workspacePath = SURFSENSE_WORKSPACE_ID
    ? `/workspaces/${SURFSENSE_WORKSPACE_ID}/scrapers/google-search/scrape`
    : '/scrapers/google-search/scrape';

  const data = await surfSenseRequest<any>(workspacePath, {
    search_queries: [query],
    max_results: maxResults,
  });

  if (!data?.results) return [];

  return data.results.map((r: any, i: number) => ({
    title: r.title || '',
    url: r.url || r.link || '',
    snippet: (r.snippet || r.description || '').slice(0, 500),
    position: r.position || i + 1,
  }));
}

export async function crawlWebPage(url: string): Promise<SurfSenseWebCrawlResult | null> {
  if (!SURFSENSE_API_URL) return null;

  const workspacePath = SURFSENSE_WORKSPACE_ID
    ? `/workspaces/${SURFSENSE_WORKSPACE_ID}/scrapers/web-crawl`
    : '/scrapers/web-crawl';

  const data = await surfSenseRequest<any>(workspacePath, { url });
  if (!data) return null;

  return {
    url: data.url || url,
    title: data.title || '',
    content: (data.content || data.text || '').slice(0, 5000),
    metadata: data.metadata || undefined,
  };
}

export function isSurfSenseAvailable(): boolean {
  return !!(SURFSENSE_API_URL && SURFSENSE_API_KEY);
}
