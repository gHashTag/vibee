/**
 * Base classes for plugin providers
 */

import type { IAgentRuntime } from '@elizaos/core';
import { PluginError, ValidationError } from './errors';
import { withRetry, type RetryOptions } from './retry';
import { CacheService } from './cache';

/**
 * Common provider types
 */
export type ContentType = 'image' | 'video' | 'audio' | 'text';
export type ModelStatus = 'active' | 'deprecated' | 'beta';

/**
 * Provider generation parameters
 */
export interface BaseGenerationParams {
  prompt: string;
  model?: string;
  contentType?: ContentType;
}

/**
 * Provider result
 */
export interface ProviderResult {
  success: boolean;
  url?: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Model information
 */
export interface ProviderModel {
  id: string;
  name: string;
  type: ContentType;
  status: ModelStatus;
  description?: string;
  parameters?: Record<string, any>;
  cost?: number;
  estimatedTime?: number;
}

/**
 * Health check result
 */
export interface ProviderHealth {
  healthy: boolean;
  message: string;
  latency?: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
}

/**
 * Abstract base provider class
 */
export abstract class BaseProvider {
  protected runtime: IAgentRuntime;
  protected config: ProviderConfig;
  protected cache: CacheService;
  private retryOptions: Required<Pick<RetryOptions, 'retries' | 'delay'>>;

  constructor(runtime: IAgentRuntime, config: ProviderConfig) {
    this.runtime = runtime;
    this.config = config;
    this.cache = new CacheService({
      ttl: config.cache?.ttl ?? 60000,
      maxSize: 1000,
    });
    this.retryOptions = {
      retries: config.retries ?? 3,
      delay: 1000,
    };
  }

  /**
   * Generate content using the provider
   */
  abstract generate(params: BaseGenerationParams): Promise<ProviderResult>;

  /**
   * Get available models
   */
  abstract getModels(): Promise<ProviderModel[]>;

  /**
   * Check provider health
   */
  abstract checkHealth(): Promise<ProviderHealth>;

  /**
   * Validate generation parameters
   */
  protected validateParams(params: BaseGenerationParams): void {
    if (!params.prompt || typeof params.prompt !== 'string') {
      throw new ValidationError('Prompt must be a non-empty string');
    }

    if (params.prompt.length > 4000) {
      throw new ValidationError('Prompt too long (max 4000 characters)');
    }

    if (params.model && typeof params.model !== 'string') {
      throw new ValidationError('Model must be a string');
    }
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    return withRetry(operation, {
      ...this.retryOptions,
      retries: this.config.retries ?? 3,
      delay: this.config.timeout ? Math.min(this.config.timeout, 1000) : 1000,
    });
  }

  /**
   * Get from cache or execute operation
   */
  protected async getOrExecute<T>(
    key: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await operation();
    this.cache.set(key, result, ttl);
    return result;
  }

  /**
   * Log error with context
   */
  protected logError(error: Error, context: string): void {
    console.error(`[${this.constructor.name}] ${context}:`, error);
  }

  /**
   * Get provider metadata
   */
  abstract getMetadata(): {
    id: string;
    name: string;
    version: string;
    supportedTypes: ContentType[];
  };
}

/**
 * Image provider specific parameters
 */
export interface ImageGenerationParams extends BaseGenerationParams {
  contentType: 'image';
  imageSize?: '512x512' | '768x768' | '1024x1024' | '1536x1536' | '2048x2048';
  numImages?: number;
  quality?: 'low' | 'medium' | 'high';
  style?: string;
}

/**
 * Video provider specific parameters
 */
export interface VideoGenerationParams extends BaseGenerationParams {
  contentType: 'video';
  duration?: number;
  fps?: number;
  resolution?: '720p' | '1080p' | '4k';
}

/**
 * Audio provider specific parameters
 */
export interface AudioGenerationParams extends BaseGenerationParams {
  contentType: 'audio';
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

/**
 * Abstract image provider
 */
export abstract class BaseImageProvider extends BaseProvider {
  abstract generate(params: ImageGenerationParams): Promise<ProviderResult>;
  abstract getModels(): Promise<ProviderModel[]>;

  protected validateImageParams(params: ImageGenerationParams): void {
    this.validateParams(params);

    if (params.numImages && (params.numImages < 1 || params.numImages > 10)) {
      throw new ValidationError('numImages must be between 1 and 10');
    }
  }
}

/**
 * Abstract video provider
 */
export abstract class BaseVideoProvider extends BaseProvider {
  abstract generate(params: VideoGenerationParams): Promise<ProviderResult>;
  abstract getModels(): Promise<ProviderModel[]>;

  protected validateVideoParams(params: VideoGenerationParams): void {
    this.validateParams(params);

    if (params.duration && (params.duration < 1 || params.duration > 60)) {
      throw new ValidationError('duration must be between 1 and 60 seconds');
    }
  }
}

/**
 * Abstract audio provider
 */
export abstract class BaseAudioProvider extends BaseProvider {
  abstract generate(params: AudioGenerationParams): Promise<ProviderResult>;
  abstract getModels(): Promise<ProviderModel[]>;

  protected validateAudioParams(params: AudioGenerationParams): void {
    this.validateParams(params);

    if (params.speed && (params.speed < 0.5 || params.speed > 2)) {
      throw new ValidationError('speed must be between 0.5 and 2');
    }
  }
}
