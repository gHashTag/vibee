/**
 * Cached Provider with TTL
 * Кэширующий провайдер для повторного использования результатов
 */

import { performanceMonitor } from './PerformanceMonitor';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  prefix?: string; // Cache key prefix
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

export class CachedProvider<TParams, TResult> {
  private cache = new Map<string, CacheEntry<TResult>>();
  private options: Required<CacheOptions>;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize ?? 1000,
      prefix: options.prefix ?? '',
    };
  }

  /**
   * Генерирует ключ кэша из параметров
   */
  private generateCacheKey(params: TParams): string {
    const paramStr = JSON.stringify(params, Object.keys(params).sort());
    const hash = this.simpleHash(paramStr);
    return `${this.options.prefix}${hash}`;
  }

  /**
   * Простая хеш-функция
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Проверяет валидность записи в кэше
   */
  private isValid(entry: CacheEntry<TResult>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.options.ttl;
  }

  /**
   * Получает значение из кэша
   */
  private getFromCache(key: string): TResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      performanceMonitor.recordCacheStats(key, false);
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.missCount++;
      performanceMonitor.recordCacheStats(key, false);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    this.hitCount++;
    performanceMonitor.recordCacheStats(key, true);
    return entry.value;
  }

  /**
   * Сохраняет значение в кэш
   */
  private setCache(key: string, value: TResult): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Выполняет запрос с кэшированием
   */
  async get(
    params: TParams,
    fetcher: () => Promise<TResult>
  ): Promise<TResult> {
    const cacheKey = this.generateCacheKey(params);

    return performanceMonitor.measure(`cache_get_${cacheKey}`, async () => {
      // Try to get from cache
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Fetch new value
      const result = await fetcher();

      // Store in cache
      this.setCache(cacheKey, result);

      return result;
    });
  }

  /**
   * Принудительно обновляет кэш
   */
  async refresh(
    params: TParams,
    fetcher: () => Promise<TResult>
  ): Promise<TResult> {
    const result = await fetcher();
    const cacheKey = this.generateCacheKey(params);
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Очищает кэш
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Удаляет запись из кэша
   */
  delete(params: TParams): boolean {
    const cacheKey = this.generateCacheKey(params);
    return this.cache.delete(cacheKey);
  }

  /**
   * Проверяет наличие в кэше
   */
  has(params: TParams): boolean {
    const cacheKey = this.generateCacheKey(params);
    const entry = this.cache.get(cacheKey);
    return entry !== undefined && this.isValid(entry);
  }

  /**
   * Получает статистику кэша
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: hitRate.toFixed(2) + '%',
      ttl: this.options.ttl,
    };
  }

  /**
   * Получает все ключи кэша
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Получает информацию о записи кэша
   */
  getCacheInfo(params: TParams): { hits: number; age: number } | null {
    const cacheKey = this.generateCacheKey(params);
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    return {
      hits: entry.hits,
      age: Date.now() - entry.timestamp,
    };
  }
}

/**
 * Factory для создания кэшированных провайдеров
 */
export class CachedProviderFactory {
  private providers = new Map<string, CachedProvider<any, any>>();

  getProvider<TParams, TResult>(
    name: string,
    options?: CacheOptions
  ): CachedProvider<TParams, TResult> {
    if (!this.providers.has(name)) {
      this.providers.set(name, new CachedProvider<TParams, TResult>(options));
    }
    return this.providers.get(name)!;
  }

  clearAll(): void {
    for (const provider of this.providers.values()) {
      provider.clear();
    }
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, provider] of this.providers) {
      stats[name] = provider.getStats();
    }
    return stats;
  }
}

// Экспортируем singleton factory
export const cachedProviderFactory = new CachedProviderFactory();
