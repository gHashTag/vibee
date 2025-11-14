/**
 * Rate limiting utilities
 */

export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  keyGenerator?: (context?: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

/**
 * Token bucket rate limiter
 */
export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private windowMs: number;
  private max: number;
  private keyGenerator: (context?: any) => string;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;
    this.keyGenerator = options.keyGenerator || (() => 'default');
  }

  /**
   * Check if request is allowed
   */
  check(context?: any): RateLimitResult {
    const key = this.keyGenerator(context);
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.max, lastRefill: now };

    // Calculate tokens to add based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.windowMs) * this.max;

    // Update bucket
    bucket.tokens = Math.min(this.max, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens > 0) {
      bucket.tokens--;
      this.buckets.set(key, bucket);

      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: bucket.lastRefill + this.windowMs,
        totalHits: this.max - bucket.tokens,
      };
    } else {
      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.lastRefill + this.windowMs,
        totalHits: this.max,
      };
    }
  }

  /**
   * Consume one token if available
   */
  consume(context?: any): boolean {
    return this.check(context).allowed;
  }

  /**
   * Get remaining tokens
   */
  remaining(context?: any): number {
    return this.check(context).remaining;
  }

  /**
   * Reset limiter for key
   */
  reset(context?: any): void {
    const key = this.keyGenerator(context);
    this.buckets.delete(key);
  }

  /**
   * Get current state for monitoring
   */
  getState(context?: any): { tokens: number; lastRefill: number } | null {
    const key = this.keyGenerator(context);
    return this.buckets.get(key) || null;
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs: number;
  private max: number;

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests
    const validRequests = requests.filter(
      time => now - time < this.windowMs
    );

    if (validRequests.length >= this.max) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Get number of requests in current window
   */
  getCount(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    return requests.filter(time => now - time < this.windowMs).length;
  }

  /**
   * Reset counter for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Get time until reset
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    if (requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...requests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }
}

/**
 * Fixed window rate limiter
 */
export class FixedWindowRateLimiter {
  private counters = new Map<string, { count: number; windowStart: number }>();
  private windowMs: number;
  private max: number;

  constructor(windowMs: number, max: number) {
    this.windowMs = windowMs;
    this.max = max;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const counter = this.counters.get(key);

    if (!counter || counter.windowStart !== windowStart) {
      this.counters.set(key, { count: 1, windowStart });
      return true;
    }

    if (counter.count < this.max) {
      counter.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const counter = this.counters.get(key);

    if (!counter || counter.windowStart !== windowStart) {
      return this.max;
    }

    return Math.max(0, this.max - counter.count);
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  keyGenerator?: (ctx: any) => string
) {
  return async (ctx: any, next: () => Promise<void>) => {
    const key = keyGenerator ? keyGenerator(ctx) : String(ctx.from?.id);
    const result = limiter.check(key);

    if (!result.allowed) {
      await ctx.reply(
        `⚠️ Слишком много запросов. Попробуйте через ${Math.ceil(result.resetTime / 1000)} секунд.`
      );
      return;
    }

    await next();
  };
}
