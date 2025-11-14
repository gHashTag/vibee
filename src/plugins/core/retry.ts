/**
 * Retry utilities with exponential backoff
 */

export interface RetryOptions {
  retries?: number;
  delay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Execute function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    jitter = true,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retries) {
        throw new RetryError(
          `Failed after ${retries + 1} attempts`,
          attempt + 1,
          lastError
        );
      }

      // Calculate backoff delay
      let backoffDelay = delay * Math.pow(backoffMultiplier, attempt);
      backoffDelay = Math.min(backoffDelay, maxDelay);

      // Add jitter to prevent thundering herd
      if (jitter) {
        backoffDelay = backoffDelay * (0.5 + Math.random() * 0.5);
      }

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry with conditional predicate
 */
export async function withRetryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3 } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === retries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      const { delay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;

      const backoffDelay = Math.min(
        delay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
}
