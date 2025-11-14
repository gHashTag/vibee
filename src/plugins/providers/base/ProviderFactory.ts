/**
 * Provider Factory
 * Factory pattern for creating provider instances
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
  LogLevel,
  LogContext,
} from './types';

/**
 * Base provider factory with common utilities
 */
export abstract class ProviderFactory {
  protected config: ProviderConfig;
  protected logger?: (context: LogContext) => void;

  constructor(config: ProviderConfig, logger?: (context: LogContext) => void) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
      failOver: {
        enabled: false,
        maxRetries: 3,
      },
      ...config,
    };
    this.logger = logger;
  }

  /**
   * Create provider instance
   */
  abstract create(): ProviderPlugin;

  /**
   * Log message with context
   */
  protected log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (this.logger) {
      this.logger({
        level,
        message,
        data,
        provider: this.config.apiKey ? 'provider' : 'unknown',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<any> {
    const { retryAttempts = 3 } = this.config;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.log('error', `Request failed (attempt ${retryCount + 1})`, {
        error: error instanceof Error ? error.message : String(error),
        url,
      });

      if (retryCount < retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        this.log('info', `Retrying in ${delay}ms`, { retryCount: retryCount + 1 });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check health of provider
   */
  async checkHealth(endpoint?: string): Promise<PluginHealthStatus> {
    const start = Date.now();

    try {
      const url = endpoint || `${this.config.baseUrl}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        healthy: response.ok,
        latency: Date.now() - start,
        statusCode: response.status,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Rate limiting check
   */
  protected checkRateLimit(): boolean {
    // In a real implementation, this would check against a rate limiter
    // For now, just return true to allow requests
    return true;
  }

  /**
   * Get cost estimate
   */
  protected estimateCost(model: string, params: ProviderGenerationParams): number {
    // Default implementation - override in specific providers
    return 0.001;
  }

  /**
   * Validate generation parameters
   */
  protected validateParams(params: ProviderGenerationParams): void {
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (params.prompt.length > 4000) {
      throw new Error('Prompt exceeds maximum length of 4000 characters');
    }
  }
}

/**
 * Simple registry implementation
 */
export class SimplePluginRegistry implements PluginRegistry {
  private providers = new Map<string, ProviderPlugin>();

  registerProvider(provider: ProviderPlugin): void {
    this.providers.set(provider.providerName, provider);
  }

  getProvider(name: string): ProviderPlugin | undefined {
    return this.providers.get(name);
  }

  listProviders(): ProviderPlugin[] {
    return Array.from(this.providers.values());
  }

  unregisterProvider(name: string): void {
    this.providers.delete(name);
  }

  async healthCheck(name: string): Promise<PluginHealthStatus> {
    const provider = this.providers.get(name);
    if (!provider) {
      return {
        healthy: false,
        lastChecked: new Date(),
        error: `Provider ${name} not found`,
      };
    }

    return provider.healthCheck();
  }
}
