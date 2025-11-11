/**
 * BaseProvider
 * Abstract base class with common functionality for all providers
 */

import {
  IImageProvider,
  ProviderType,
  ProviderConfig,
  ProviderCapabilities,
  GenerationOptions,
  ImageResult,
  TrainingOptions,
  TrainingResult,
  TrainingProgressInfo,
  ModelInfo,
  ErrorCode,
  ProviderError,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base provider with common utilities
 *
 * Providers should extend this class and implement abstract methods.
 * This class provides:
 * - Configuration management
 * - Error handling utilities
 * - Common validation
 * - Retry logic
 */
export abstract class BaseProvider implements IImageProvider {
  // Implemented by subclasses
  abstract readonly name: string;
  abstract readonly type: ProviderType;
  abstract readonly description: string;

  protected config: ProviderConfig | null = null;
  protected apiKey: string = '';
  protected maxRetries: number = 3;
  protected timeout: number = 120000; // 120 seconds

  // ============================================================================
  // Lifecycle Methods (to be implemented by subclasses)
  // ============================================================================

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.apiKey = config.apiKey || '';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 120000;

    if (!this.apiKey) {
      console.warn(`[${this.name}] API key not configured`);
    }

    await this.onInitialize(config);
  }

  /**
   * Custom initialization logic for subclasses
   */
  protected abstract onInitialize(config: ProviderConfig): Promise<void>;

  // ============================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ============================================================================

  abstract healthCheck(): Promise<boolean>;
  abstract getCapabilities(): ProviderCapabilities;
  abstract listModels(): Promise<ModelInfo[]>;
  abstract generate(options: GenerationOptions): Promise<ImageResult>;
  abstract estimateCost(options: GenerationOptions): number;

  // ============================================================================
  // LoRA Support (optional, default implementations)
  // ============================================================================

  supportsLora(): boolean {
    return false;
  }

  async trainLora(options: TrainingOptions): Promise<TrainingResult> {
    throw new ProviderError(
      ErrorCode.TRAINING_NOT_SUPPORTED,
      `Provider ${this.name} does not support LoRA training`,
      this.type
    );
  }

  async checkTrainingStatus(jobId: string): Promise<TrainingProgressInfo> {
    throw new ProviderError(
      ErrorCode.TRAINING_NOT_SUPPORTED,
      `Provider ${this.name} does not support training status checks`,
      this.type
    );
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Validate that provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.config) {
      throw new ProviderError(ErrorCode.PROVIDER_UNAVAILABLE, `Provider ${this.name} not initialized`, this.type);
    }

    if (!this.apiKey) {
      throw new ProviderError(ErrorCode.INVALID_API_KEY, `API key not configured for ${this.name}`, this.type);
    }
  }

  /**
   * Validate generation options
   */
  protected validateGenerationOptions(options: GenerationOptions): void {
    if (!options.prompt || options.prompt.trim().length === 0) {
      throw new ProviderError(ErrorCode.INVALID_PROMPT, 'Prompt is required and cannot be empty', this.type);
    }

    if (options.prompt.length > 2000) {
      throw new ProviderError(ErrorCode.INVALID_PROMPT, 'Prompt is too long (max 2000 characters)', this.type);
    }

    if (options.numImages && (options.numImages < 1 || options.numImages > 10)) {
      throw new ProviderError(
        ErrorCode.INVALID_PARAMETERS,
        'Number of images must be between 1 and 10',
        this.type
      );
    }
  }

  /**
   * Validate training options
   */
  protected validateTrainingOptions(options: TrainingOptions): void {
    if (!options.imagesZipUrl || !this.isValidUrl(options.imagesZipUrl)) {
      throw new ProviderError(ErrorCode.INVALID_TRAINING_DATA, 'Invalid or missing images ZIP URL', this.type);
    }

    if (!options.triggerWord || options.triggerWord.trim().length === 0) {
      throw new ProviderError(ErrorCode.INVALID_TRAINING_DATA, 'Trigger word is required', this.type);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          const error = new ProviderError(
            this.mapHttpStatusToErrorCode(response.status),
            `HTTP ${response.status}: ${errorText}`,
            this.type,
            { status: response.status, body: errorText },
            response.status >= 500 || response.status === 429 // Retryable for server errors and rate limits
          );

          // Rate limiting - wait before retry
          if (response.status === 429 && attempt < retries) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
            await this.sleep(waitTime);
            continue;
          }

          throw error;
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (error instanceof ProviderError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new ProviderError(
      ErrorCode.NETWORK_ERROR,
      `Failed after ${retries + 1} attempts: ${lastError?.message}`,
      this.type,
      lastError,
      false
    );
  }

  /**
   * Map HTTP status code to error code
   */
  protected mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.INVALID_PARAMETERS;
      case 401:
      case 403:
        return ErrorCode.AUTHENTICATION_FAILED;
      case 404:
        return ErrorCode.MODEL_NOT_FOUND;
      case 429:
        return ErrorCode.PROVIDER_RATE_LIMITED;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorCode.PROVIDER_UNAVAILABLE;
      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * URL validation
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Build authorization header
   */
  protected getAuthHeader(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Get default headers
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
    };
  }

  /**
   * Log provider activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[${this.type.toUpperCase()}]`;
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
    }
  }

  /**
   * Create ImageResult from provider response
   */
  protected createImageResult(
    url: string,
    options: GenerationOptions,
    metadata: {
      width: number;
      height: number;
      contentType?: string;
      seed?: number;
      generationTimeMs: number;
      cost?: number;
    }
  ): ImageResult {
    return {
      id: this.generateId(),
      url,
      width: metadata.width,
      height: metadata.height,
      contentType: metadata.contentType || 'image/jpeg',
      prompt: options.prompt,
      enhancedPrompt: options.prompt,
      seed: metadata.seed,
      provider: this.type,
      model: options.model || this.getCapabilities().defaultModel,
      generationTimeMs: metadata.generationTimeMs,
      cost: metadata.cost,
    };
  }

  /**
   * Create TrainingResult from provider response
   */
  protected createTrainingResult(
    loraUrl: string,
    options: TrainingOptions,
    metadata: {
      model: string;
      trainingTimeMs: number;
      cost?: number;
    }
  ): TrainingResult {
    return {
      id: this.generateId(),
      loraUrl,
      triggerWord: options.triggerWord,
      model: metadata.model,
      provider: this.type,
      steps: options.steps || 1000,
      learningRate: options.learningRate || 0.0004,
      rank: options.rank || 16,
      trainingTimeMs: metadata.trainingTimeMs,
      cost: metadata.cost,
    };
  }
}
