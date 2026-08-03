import fs from 'fs';
import path from 'path';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
  key: string;
}

interface CacheOptions {
  defaultTtlMs?: number;
  maxEntries?: number;
  persistToDisk?: boolean;
  persistPath?: string;
  persistIntervalMs?: number;
}

const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  defaultTtlMs: 30 * 60 * 1000,
  maxEntries: 5000,
  persistToDisk: true,
  persistPath: './data/cache.json',
  persistIntervalMs: 60 * 1000,
};

export class CacheService {
  private store: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor(options?: CacheOptions) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.options.persistToDisk) {
      this.loadFromDisk();
    }

    if (this.options.persistToDisk && this.options.persistIntervalMs > 0) {
      this.persistTimer = setInterval(() => this.saveToDisk(), this.options.persistIntervalMs);
    }

    this.initialized = true;
  }

  get<T = any>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T = any>(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.options.maxEntries) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.options.defaultTtlMs),
      createdAt: Date.now(),
      key,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expired++;
      else valid++;
    }

    return {
      totalEntries: this.store.size,
      validEntries: valid,
      expiredEntries: expired,
      maxEntries: this.options.maxEntries,
    };
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  generateKey(namespace: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {} as Record<string, any>);
    return `${namespace}:${JSON.stringify(sorted)}`;
  }

  shutdown(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    if (this.options.persistToDisk) {
      this.saveToDisk();
    }
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  private loadFromDisk(): void {
    try {
      const filePath = path.resolve(this.options.persistPath);
      if (!fs.existsSync(filePath)) return;

      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries: CacheEntry[] = JSON.parse(raw);
      const now = Date.now();

      for (const entry of entries) {
        if (now <= entry.expiresAt) {
          this.store.set(entry.key, entry);
        }
      }
    } catch {
      // Corrupted cache file; start fresh
    }
  }

  private saveToDisk(): void {
    try {
      const filePath = path.resolve(this.options.persistPath);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const entries = Array.from(this.store.values());
      fs.writeFileSync(filePath, JSON.stringify(entries), 'utf-8');
    } catch {
      // Disk write failure; cache continues in memory
    }
  }
}

export const cache = new CacheService();
