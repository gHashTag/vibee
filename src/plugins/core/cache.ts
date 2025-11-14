/**
 * Simple in-memory cache with TTL
 */

export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 60000; // Default 1 minute
    this.maxSize = options.maxSize ?? 1000;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttlMs ?? this.ttl);

    this.cache.set(key, {
      data,
      expiry,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    // Filter out expired keys
    this.cleanup();
    return Array.from(this.cache.keys());
  }
}

/**
 * Decorator for caching async function results
 */
export function cached<TArgs extends any[], TResult>(
  cache: CacheService,
  keyResolver: (...args: TArgs) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: TArgs): Promise<TResult> {
      const key = keyResolver(...args);
      const cachedResult = cache.get<TResult>(key);

      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * Memoization utility
 */
export function memoize<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyResolver?: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  const cache = new CacheService();

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    const cachedResult = cache.get<TResult>(key);

    if (cachedResult !== null) {
      return cachedResult;
    }

    const result = await fn(...args);
    cache.set(key, result);

    return result;
  };
}
