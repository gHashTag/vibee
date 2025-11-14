/**
 * Performance Monitor
 * Отслеживает производительность операций
 */

export interface PerformanceStats {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export interface CacheStats {
  key: string;
  hit: boolean;
  timestamp: number;
}

class PerformanceMonitor {
  private stats: PerformanceStats[] = [];
  private cacheStats: CacheStats[] = [];

  /**
   * Измеряет время выполнения операции
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;

      this.recordStats(name, duration, true);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordStats(name, duration, false);
      throw error;
    }
  }

  /**
   * Записывает статистику выполнения
   */
  private recordStats(name: string, duration: number, success: boolean): void {
    this.stats.push({
      name,
      duration,
      timestamp: Date.now(),
      success,
    });

    // Ограничиваем размер массива (храним последние 1000 записей)
    if (this.stats.length > 1000) {
      this.stats.shift();
    }
  }

  /**
   * Записывает статистику кэша
   */
  recordCacheStats(key: string, hit: boolean): void {
    this.cacheStats.push({
      key,
      hit,
      timestamp: Date.now(),
    });

    // Ограничиваем размер массива
    if (this.cacheStats.length > 1000) {
      this.cacheStats.shift();
    }
  }

  /**
   * Получает статистику по операциям
   */
  getStats(): {
    operations: PerformanceStats[];
    cache: CacheStats[];
  } {
    return {
      operations: [...this.stats],
      cache: [...this.cacheStats],
    };
  }

  /**
   * Очищает статистику
   */
  clear(): void {
    this.stats = [];
    this.cacheStats = [];
  }
}

// Экспортируем singleton
export const performanceMonitor = new PerformanceMonitor();
