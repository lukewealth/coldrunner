import { config } from '../config';

export interface BackendStatus {
  name: string;
  status: 'ok' | 'warn' | 'off' | 'error';
  message: string;
  latencyMs?: number;
}

export interface BackendRoute {
  name: string;
  check: () => Promise<BackendStatus>;
  priority: number;
}

export interface ChannelConfig {
  name: string;
  description: string;
  backends: BackendRoute[];
  tier: 0 | 1 | 2;
}

export class ChannelManager {
  private channels: Map<string, ChannelConfig> = new Map();
  private activeBackends: Map<string, string> = new Map();

  register(config: ChannelConfig): void {
    this.channels.set(config.name, config);
  }

  async selectBackend(channelName: string): Promise<BackendRoute | null> {
    const channel = this.channels.get(channelName);
    if (!channel) return null;

    const sorted = [...channel.backends].sort((a, b) => a.priority - b.priority);

    for (const backend of sorted) {
      const status = await backend.check();
      if (status.status === 'ok') {
        this.activeBackends.set(channelName, backend.name);
        return backend;
      }
    }

    return null;
  }

  async getActiveBackend(channelName: string): Promise<string | null> {
    return this.activeBackends.get(channelName) || null;
  }

  async diagnose(channelName?: string): Promise<Record<string, BackendStatus[]>> {
    const results: Record<string, BackendStatus[]> = {};

    const channelsToCheck = channelName
      ? [this.channels.get(channelName)].filter(Boolean) as ChannelConfig[]
      : Array.from(this.channels.values());

    for (const channel of channelsToCheck) {
      const statuses: BackendStatus[] = [];

      for (const backend of channel.backends) {
        try {
          const status = await backend.check();
          statuses.push(status);
        } catch (err: any) {
          statuses.push({
            name: backend.name,
            status: 'error',
            message: err.message,
          });
        }
      }

      results[channel.name] = statuses;
    }

    return results;
  }

  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }

  getChannel(name: string): ChannelConfig | undefined {
    return this.channels.get(name);
  }
}

export const channelManager = new ChannelManager();

export function registerDefaultChannels(): void {
  channelManager.register({
    name: 'web-scraping',
    description: 'Website content extraction and analysis',
    tier: config.apiKeys.firecrawl ? 0 : 1,
    backends: [
      {
        name: 'Firecrawl',
        priority: 1,
        check: async () => {
          if (!config.apiKeys.firecrawl) {
            return { name: 'Firecrawl', status: 'off', message: 'API key not configured' };
          }
          const start = Date.now();
          try {
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKeys.firecrawl}`,
              },
              body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] }),
              signal: AbortSignal.timeout(10000),
            });
            const latency = Date.now() - start;
            if (response.ok) {
              return { name: 'Firecrawl', status: 'ok', message: 'API responding', latencyMs: latency };
            }
            return { name: 'Firecrawl', status: 'error', message: `HTTP ${response.status}` };
          } catch (err: any) {
            return { name: 'Firecrawl', status: 'error', message: err.message };
          }
        },
      },
      {
        name: 'Jina Reader',
        priority: 2,
        check: async () => {
          const start = Date.now();
          try {
            const response = await fetch('https://r.jina.ai/https://example.com', {
              signal: AbortSignal.timeout(10000),
              headers: { 'Accept': 'text/plain' },
            });
            const latency = Date.now() - start;
            if (response.ok) {
              return { name: 'Jina Reader', status: 'ok', message: 'Free fallback available', latencyMs: latency };
            }
            return { name: 'Jina Reader', status: 'error', message: `HTTP ${response.status}` };
          } catch (err: any) {
            return { name: 'Jina Reader', status: 'error', message: err.message };
          }
        },
      },
    ],
  });

  channelManager.register({
    name: 'google-places',
    description: 'Business discovery via Google Places API',
    tier: config.apiKeys.googlePlaces ? 0 : 1,
    backends: [
      {
        name: 'Google Places API',
        priority: 1,
        check: async () => {
          if (!config.apiKeys.googlePlaces) {
            return { name: 'Google Places API', status: 'off', message: 'API key not configured' };
          }
          const start = Date.now();
          try {
            const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
            url.searchParams.set('query', 'test');
            url.searchParams.set('key', config.apiKeys.googlePlaces);
            const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
            const latency = Date.now() - start;
            const data = await response.json();
            if (data.status === 'OK' || data.status === 'ZERO_RESULTS' || data.status === 'REQUEST_DENIED') {
              return { name: 'Google Places API', status: 'ok', message: 'API responding', latencyMs: latency };
            }
            return { name: 'Google Places API', status: 'error', message: `Status: ${data.status}` };
          } catch (err: any) {
            return { name: 'Google Places API', status: 'error', message: err.message };
          }
        },
      },
    ],
  });

  channelManager.register({
    name: 'email-discovery',
    description: 'Business email and contact discovery',
    tier: config.apiKeys.hunter ? 0 : 1,
    backends: [
      {
        name: 'Hunter.io',
        priority: 1,
        check: async () => {
          if (!config.apiKeys.hunter) {
            return { name: 'Hunter.io', status: 'off', message: 'API key not configured' };
          }
          return { name: 'Hunter.io', status: 'ok', message: 'API key configured' };
        },
      },
    ],
  });

  channelManager.register({
    name: 'contact-enrichment',
    description: 'Decision-maker contact enrichment',
    tier: config.apiKeys.apollo ? 0 : 1,
    backends: [
      {
        name: 'Apollo.io',
        priority: 1,
        check: async () => {
          if (!config.apiKeys.apollo) {
            return { name: 'Apollo.io', status: 'off', message: 'API key not configured' };
          }
          return { name: 'Apollo.io', status: 'ok', message: 'API key configured' };
        },
      },
    ],
  });

  channelManager.register({
    name: 'performance-audit',
    description: 'Website performance and SEO auditing',
    tier: config.apiKeys.pagespeed ? 0 : 1,
    backends: [
      {
        name: 'PageSpeed Insights',
        priority: 1,
        check: async () => {
          if (!config.apiKeys.pagespeed) {
            return { name: 'PageSpeed Insights', status: 'off', message: 'API key not configured' };
          }
          return { name: 'PageSpeed Insights', status: 'ok', message: 'API key configured' };
        },
      },
    ],
  });
}
