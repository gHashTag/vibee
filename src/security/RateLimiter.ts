/**
 * Продвинутый Rate Limiter - защита от DDoS и спама
 * Поддерживает различные алгоритмы и стратегии ограничения
 */

import { logger } from '@elizaos/core';

export interface RateLimitConfig {
  limit: number; // Максимальное количество запросов
  window: number; // Временное окно в миллисекундах
  strictMode?: boolean; // Строгий режим с немедленным блокированием
}

export interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  violations: number;
  blockedUntil?: number;
}

export type GetLimitKeyFn = (ctx: any) => string;

/**
 * Token Bucket Algorithm для rate limiting
 */
export class RateLimiter {
  private buckets = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private defaultKeyGenerator: GetLimitKeyFn;

  constructor(config: RateLimitConfig, defaultKeyGenerator: GetLimitKeyFn) {
    this.config = config;
    this.defaultKeyGenerator = defaultKeyGenerator;
  }

  /**
   * Проверка возможности выполнить запрос
   */
  check(key?: string, customConfig?: Partial<RateLimitConfig>): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const actualKey = key || this.defaultKeyGenerator({});
    const actualConfig = { ...this.config, ...customConfig };

    const bucket = this.buckets.get(actualKey) || {
      tokens: actualConfig.limit,
      lastRefill: Date.now(),
      violations: 0,
    };

    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    // Рассчитываем количество токенов для добавления
    const tokensToAdd = Math.floor(elapsed / actualConfig.window) * actualConfig.limit;
    bucket.tokens = Math.min(actualConfig.limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Проверяем, заблокирован ли ключ
    if (bucket.blockedUntil && now < bucket.blockedUntil) {
      const retryAfter = Math.ceil((bucket.blockedUntil - now) / 1000);

      if (bucket.violations >= 5) {
        logger.warn(`[SECURITY] Rate limit: persistent block for key ${actualKey}`, {
          violations: bucket.violations,
          retryAfter,
        });
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.blockedUntil,
        retryAfter,
      };
    }

    // Проверяем доступные токены
    if (bucket.tokens > 0) {
      bucket.tokens--;
      this.buckets.set(actualKey, bucket);

      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + actualConfig.window,
      };
    }

    // Превышен лимит - засчитываем нарушение
    bucket.violations++;
    const resetTime = now + actualConfig.window;

    // При строгом режиме или множественных нарушениях - блокируем
    if (actualConfig.strictMode || bucket.violations >= 3) {
      const blockDuration = Math.min(bucket.violations * 60000, 3600000); // До 1 часа
      bucket.blockedUntil = now + blockDuration;

      logger.warn(`[SECURITY] Rate limit: blocking key ${actualKey}`, {
        violations: bucket.violations,
        blockDuration: blockDuration / 1000,
        limit: actualConfig.limit,
        window: actualConfig.window / 1000,
      });
    } else {
      logger.warn(`[SECURITY] Rate limit: key ${actualKey} exceeded`, {
        violations: bucket.violations,
        limit: actualConfig.limit,
        window: actualConfig.window / 1000,
      });
    }

    this.buckets.set(actualKey, bucket);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
    };
  }

  /**
   * Получение оставшихся токенов
   */
  getRemaining(key?: string): number {
    const actualKey = key || this.defaultKeyGenerator({});
    const bucket = this.buckets.get(actualKey);
    return bucket?.tokens ?? this.config.limit;
  }

  /**
   * Получение времени сброса
   */
  getResetTime(key?: string): number {
    const actualKey = key || this.defaultKeyGenerator({});
    const bucket = this.buckets.get(actualKey);
    if (!bucket) return 0;

    return bucket.lastRefill + this.config.window;
  }

  /**
   * Получение статистики по ключу
   */
  getStats(key?: string) {
    const actualKey = key || this.defaultKeyGenerator({});
    const bucket = this.buckets.get(actualKey);

    if (!bucket) {
      return {
        exists: false,
        tokens: this.config.limit,
        violations: 0,
      };
    }

    return {
      exists: true,
      tokens: bucket.tokens,
      violations: bucket.violations,
      blockedUntil: bucket.blockedUntil,
      lastRefill: bucket.lastRefill,
    };
  }

  /**
   * Очистка старых записей
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = this.config.window * 10; // Храним данные 10 окон

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge && (!bucket.blockedUntil || now > bucket.blockedUntil)) {
        this.buckets.delete(key);
      }
    }

    logger.debug(`[SECURITY] Rate limiter cleanup: ${this.buckets.size} active buckets`);
  }

  /**
   * Сброс лимитов для ключа (для админских команд)
   */
  reset(key?: string): void {
    const actualKey = key || this.defaultKeyGenerator({});
    this.buckets.delete(actualKey);
    logger.info(`[SECURITY] Rate limiter reset for key: ${actualKey}`);
  }
}

/**
 * Middleware для интеграции с обработчиками
 */
export const createRateLimitMiddleware = (
  limiter: RateLimiter,
  getKey: GetLimitKeyFn,
  config?: Partial<RateLimitConfig>
) => {
  return async (ctx: any, next: () => Promise<any>) => {
    const key = getKey(ctx);
    const result = limiter.check(key, config);

    if (!result.allowed) {
      const message = result.retryAfter
        ? `⏳ Слишком много запросов. Попробуйте через ${result.retryAfter} сек.`
        : '⏳ Слишком много запросов. Попробуйте позже.';

      // Логируем попытку
      logger.warn('Rate limit exceeded', {
        key,
        remaining: result.remaining,
        retryAfter: result.retryAfter,
        userId: ctx.from?.id,
        username: ctx.from?.username,
      });

      // Отвечаем пользователю
      if (ctx.reply) {
        await ctx.reply(message);
      }

      return;
    }

    return next();
  };
};

/**
 * Предустановленные конфигурации
 */
export const RateLimitPresets = {
  // Строгий лимит для команд бота
  botCommands: {
    limit: 5,
    window: 60000, // 1 минута
    strictMode: true,
  },

  // Лимит для генерации изображений
  imageGeneration: {
    limit: 3,
    window: 300000, // 5 минут
  },

  // Лимит для обучения моделей
  modelTraining: {
    limit: 1,
    window: 3600000, // 1 час
  },

  // Лимит для API запросов
  apiRequests: {
    limit: 100,
    window: 60000, // 1 минута
  },

  // Лимит для пользователя в целом
  perUser: {
    limit: 50,
    window: 60000, // 1 минута
  },
};

/**
 * Генераторы ключей для разных случаев
 */
export const KeyGenerators = {
  // По ID пользователя
  userId: (ctx: any) => `user:${ctx.from?.id}`,

  // По username
  username: (ctx: any) => `user:${ctx.from?.username || 'unknown'}`,

  // По IP адресу
  ipAddress: (ctx: any) => `ip:${ctx.ip || 'unknown'}`,

  // Комбинированный ключ
  combined: (ctx: any) => `user:${ctx.from?.id}:ip:${ctx.ip || 'unknown'}`,

  // По команде
  command: (ctx: any) => `cmd:${ctx.message?.text?.split(' ')[0] || 'unknown'}`,

  // Глобальный ключ
  global: () => 'global',
};
