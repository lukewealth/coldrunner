import { Plugin, PluginResult } from '../types';
import { config } from '../config';
import { withRetry, RetryOptions } from '../services/retry';
import { cache } from '../services/cache';

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  protected initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  abstract execute(params: any): Promise<PluginResult>;

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  protected validateApiKey(key: string | undefined, provider: string): void {
    if (!key || key === `MY_${provider}_API_KEY`) {
      throw new Error(`${provider} API key not configured. Set ${provider}_API_KEY in environment.`);
    }
  }

  protected async fetchWithRetry(url: string | URL, init?: RequestInit, retryOptions?: Partial<RetryOptions>): Promise<Response> {
    return withRetry(
      () => fetch(url, init),
      {
        maxAttempts: config.retry.maxAttempts,
        baseDelayMs: config.retry.baseDelayMs,
        maxDelayMs: config.retry.maxDelayMs,
        ...retryOptions,
      },
    );
  }

  protected getCachedResult<T>(params: Record<string, any>): T | undefined {
    if (!config.cache.enabled) return undefined;
    const key = cache.generateKey(this.name, params);
    return cache.get<T>(key);
  }

  protected setCachedResult<T>(params: Record<string, any>, value: T, ttlMs?: number): void {
    if (!config.cache.enabled) return;
    const key = cache.generateKey(this.name, params);
    cache.set(key, value, ttlMs ?? config.cache.defaultTtlMs);
  }
}
