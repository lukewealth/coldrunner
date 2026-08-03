import { Plugin, PluginResult } from '../types';
import { GooglePlacesPlugin } from './google-places';
import { FirecrawlPlugin } from './firecrawl';
import { HunterPlugin, ApolloPlugin } from './contact-discovery';
import { SocialAnalyzerPlugin } from './social-analyzer';
import { PageSpeedPlugin } from './pagespeed';
import { SearXNGPlugin } from './searxng';
import { OllamaPlugin } from './ollama';
import { cache } from '../services/cache';
import { config } from '../config';
import { registerDefaultChannels } from '../services/channels';

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await cache.initialize();

    const pluginInstances: Plugin[] = [
      new GooglePlacesPlugin(),
      new FirecrawlPlugin(),
      new HunterPlugin(),
      new ApolloPlugin(),
      new SocialAnalyzerPlugin(),
      new PageSpeedPlugin(),
      new SearXNGPlugin(),
      new OllamaPlugin(),
    ];

    await Promise.all(pluginInstances.map((p) => p.initialize()));

    for (const plugin of pluginInstances) {
      this.plugins.set(plugin.name, plugin);
    }

    registerDefaultChannels();

    this.initialized = true;
  }

  get<T extends Plugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, plugin] of this.plugins) {
      try {
        results[name] = await plugin.healthCheck();
      } catch {
        results[name] = false;
      }
    }
    return results;
  }

  async executePlugin(name: string, params: any): Promise<PluginResult> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin "${name}" not found`,
        confidence: 0,
        source: name,
        timestamp: new Date(),
      };
    }

    if (config.cache.enabled) {
      const cacheKey = cache.generateKey(`plugin:${name}`, params);
      const cached = cache.get<PluginResult>(cacheKey);
      if (cached) return cached;

      try {
        const result = await plugin.execute(params);
        if (result.success) {
          cache.set(cacheKey, result, config.cache.defaultTtlMs);
        }
        return result;
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
          confidence: 0,
          source: name,
          timestamp: new Date(),
        };
      }
    }

    try {
      return await plugin.execute(params);
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        confidence: 0,
        source: name,
        timestamp: new Date(),
      };
    }
  }
}

export const pluginRegistry = new PluginRegistry();

export { GooglePlacesPlugin } from './google-places';
export { FirecrawlPlugin } from './firecrawl';
export { HunterPlugin, ApolloPlugin } from './contact-discovery';
export { SocialAnalyzerPlugin } from './social-analyzer';
export { PageSpeedPlugin } from './pagespeed';
export { SearXNGPlugin } from './searxng';
export { OllamaPlugin } from './ollama';
