import { config } from '../config';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> & { retryableErrors: string[] } = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true,
  retryableErrors: [
    'rate limit',
    '429',
    '500',
    '502',
    '503',
    '504',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'network',
    'socket hang up',
  ],
};

function isRetryable(error: Error, retryableErrors: string[]): boolean {
  const msg = error.message.toLowerCase();
  return retryableErrors.some((pattern) => msg.includes(pattern.toLowerCase()));
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number, jitter: boolean): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelayMs);
  if (jitter) {
    return capped * (0.5 + Math.random() * 0.5);
  }
  return capped;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      if (attempt === opts.maxAttempts - 1) break;
      if (!isRetryable(err, opts.retryableErrors)) break;

      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs, opts.jitter);
      opts.onRetry?.(attempt + 1, err, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function createRetryableFetch(
  options?: RetryOptions,
): (url: string | URL, init?: RequestInit) => Promise<Response> {
  return (url, init) =>
    withRetry(() => fetch(url, init), {
      ...options,
      onRetry: (attempt, error, delay) => {
        options?.onRetry?.(attempt, error, delay);
      },
    });
}
