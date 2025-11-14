/**
 * Fal Provider - Refactored with strict typing
 * Factory for creating Fal provider instances for images, video, and audio
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { PluginRegistry } from '../base/types';
import { BaseImageProvider, BaseVideoProvider, BaseAudioProvider, type ProviderModel } from '../../core/base-provider';
import { ProviderError, ValidationError } from '../../core/errors';
import { withRetry } from '../../core/retry';
import type { FalModel, FalGenerationParams } from './types';
import {
  generateContent,
  listModels,
  estimateCost,
  getSubscription,
} from './generate';
import {
  checkFalHealth,
  checkModelHealth,
  checkSubscriptionHealth,
} from './healthCheck';

/**
 * Fal Provider Configuration
 */
export interface FalProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Fal Image Provider Implementation
 */
export class FalImageProvider extends BaseImageProvider {
  private baseUrl: string;

  constructor(runtime: IAgentRuntime, config: FalProviderConfig) {
    super(runtime, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://fal.run',
      timeout: config.timeout,
      retries: config.retries,
      cache: { enabled: true, ttl: 300000 }, // 5 minutes
    });

    this.baseUrl = config.baseUrl || 'https://fal.run';
  }

  /**
   * Generate image using Fal API
   */
  async generate(params: FalGenerationParams): Promise<import('../core/base-provider').ProviderResult> {
    try {
      // Validate parameters
      this.validateImageParams(params);

      // Use retry logic
      return await withRetry(async () => {
        const result = await generateContent(
          {
            prompt: params.prompt,
            model: params.model,
            contentType: params.contentType || 'image',
            imageSize: params.imageSize,
            numImages: params.numImages,
            numInferenceSteps: params.numInferenceSteps,
            guidanceScale: params.guidanceScale,
            seed: params.seed,
            negativePrompt: params.negativePrompt,
            loras: params.loras,
            safetyChecker: params.safetyChecker,
            outputFormat: params.outputFormat,
          },
          this.config.apiKey,
          this.baseUrl
        );

        if (!result.success) {
          throw new ProviderError(
            result.error || 'Generation failed',
            'fal-image',
            { params }
          );
        }

        return result;
      }, 'generate-image');
    } catch (error) {
      this.logError(error as Error, 'generate');
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<ProviderModel[]> {
    return this.getOrExecute(
      'fal-models',
      async () => {
        const models = await listModels(this.config.apiKey, this.baseUrl);
        return models
          .filter(m => m.contentType === 'image')
          .map(m => ({
            id: m.id,
            name: m.name,
            type: 'image' as const,
            status: 'active' as const,
            description: m.description,
            parameters: m.parameters,
          }));
      },
      300000 // 5 minutes cache
    );
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<import('../core/base-provider').ProviderHealth> {
    try {
      return await withRetry(async () => {
        return await checkFalHealth(this.config.apiKey, this.baseUrl);
      }, 'health-check');
    } catch (error) {
      this.logError(error as Error, 'health-check');
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      id: 'provider-fal-image',
      name: 'Fal Image Provider',
      version: '1.0.0',
      supportedTypes: ['image' as const],
    };
  }

  /**
   * Get specific model
   */
  async getModel(modelId: string): Promise<ProviderModel | null> {
    const models = await this.getModels();
    return models.find(m => m.id === modelId) || null;
  }

  /**
   * Check model health
   */
  async checkModel(modelId: string): Promise<import('../core/base-provider').ProviderHealth> {
    try {
      return await withRetry(async () => {
        return await checkModelHealth(modelId, this.config.apiKey, this.baseUrl);
      }, `check-model-${modelId}`);
    } catch (error) {
      this.logError(error as Error, `check-model-${modelId}`);
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Model check failed',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Estimate cost
   */
  async estimate(modelId: string, params: FalGenerationParams): Promise<number> {
    try {
      return await withRetry(async () => {
        return estimateCost(modelId, params);
      }, `estimate-${modelId}`);
    } catch (error) {
      this.logError(error as Error, `estimate-${modelId}`);
      throw new ProviderError(
        'Failed to estimate cost',
        'fal-image',
        { modelId, params, error }
      );
    }
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo() {
    try {
      return await withRetry(async () => {
        return await getSubscription(this.config.apiKey, this.baseUrl);
      }, 'get-subscription');
    } catch (error) {
      this.logError(error as Error, 'get-subscription');
      throw new ProviderError(
        'Failed to get subscription',
        'fal-image',
        { error }
      );
    }
  }

  /**
   * Check subscription health
   */
  async checkSubscription(): Promise<import('../core/base-provider').ProviderHealth> {
    try {
      return await withRetry(async () => {
        return await checkSubscriptionHealth(this.config.apiKey, this.baseUrl);
      }, 'check-subscription');
    } catch (error) {
      this.logError(error as Error, 'check-subscription');
      return {
        healthy: false,
        message: 'Subscription check failed',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Register with plugin registry
   */
  register(registry: PluginRegistry): void {
    registry.registerProvider({
      id: this.getMetadata().id,
      name: this.getMetadata().name,
      version: this.getMetadata().version,
      type: 'provider',
      providerName: 'fal-image',
      supportedTypes: this.getMetadata().supportedTypes,
      generate: this.generate.bind(this),
      healthCheck: this.checkHealth.bind(this),
      getModels: this.getModels.bind(this),
      getModel: this.getModel.bind(this),
      checkModel: this.checkModel.bind(this),
      estimate: this.estimate.bind(this),
      getSubscriptionInfo: this.getSubscriptionInfo.bind(this),
      checkSubscription: this.checkSubscription.bind(this),
      register: undefined as any, // Will be set by registry
    });
  }
}

/**
 * Fal Video Provider Implementation
 */
export class FalVideoProvider extends BaseVideoProvider {
  private baseUrl: string;

  constructor(runtime: IAgentRuntime, config: FalProviderConfig) {
    super(runtime, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://fal.run',
      timeout: config.timeout,
      retries: config.retries,
      cache: { enabled: true, ttl: 300000 },
    });

    this.baseUrl = config.baseUrl || 'https://fal.run';
  }

  async generate(params: FalGenerationParams): Promise<import('../core/base-provider').ProviderResult> {
    try {
      this.validateVideoParams(params);

      return await withRetry(async () => {
        const result = await generateContent(
          {
            prompt: params.prompt,
            model: params.model,
            contentType: 'video',
            duration: params.duration,
            fps: params.fps,
            resolution: params.resolution,
          },
          this.config.apiKey,
          this.baseUrl
        );

        if (!result.success) {
          throw new ProviderError(
            result.error || 'Video generation failed',
            'fal-video',
            { params }
          );
        }

        return result;
      }, 'generate-video');
    } catch (error) {
      this.logError(error as Error, 'generate');
      throw error;
    }
  }

  async getModels(): Promise<ProviderModel[]> {
    return this.getOrExecute(
      'fal-video-models',
      async () => {
        const models = await listModels(this.config.apiKey, this.baseUrl);
        return models
          .filter(m => m.contentType === 'video')
          .map(m => ({
            id: m.id,
            name: m.name,
            type: 'video' as const,
            status: 'active' as const,
            description: m.description,
          }));
      },
      300000
    );
  }

  async checkHealth(): Promise<import('../core/base-provider').ProviderHealth> {
    try {
      return await withRetry(async () => {
        return await checkFalHealth(this.config.apiKey, this.baseUrl);
      }, 'health-check');
    } catch (error) {
      this.logError(error as Error, 'health-check');
      return {
        healthy: false,
        message: 'Health check failed',
        lastChecked: new Date(),
      };
    }
  }

  getMetadata() {
    return {
      id: 'provider-fal-video',
      name: 'Fal Video Provider',
      version: '1.0.0',
      supportedTypes: ['video' as const],
    };
  }

  register(registry: PluginRegistry): void {
    registry.registerProvider({
      id: this.getMetadata().id,
      name: this.getMetadata().name,
      version: this.getMetadata().version,
      type: 'provider',
      providerName: 'fal-video',
      supportedTypes: this.getMetadata().supportedTypes,
      generate: this.generate.bind(this),
      healthCheck: this.checkHealth.bind(this),
      getModels: this.getModels.bind(this),
      register: undefined as any,
    });
  }
}

/**
 * Fal Audio Provider Implementation
 */
export class FalAudioProvider extends BaseAudioProvider {
  private baseUrl: string;

  constructor(runtime: IAgentRuntime, config: FalProviderConfig) {
    super(runtime, {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://fal.run',
      timeout: config.timeout,
      retries: config.retries,
      cache: { enabled: true, ttl: 300000 },
    });

    this.baseUrl = config.baseUrl || 'https://fal.run';
  }

  async generate(params: FalGenerationParams): Promise<import('../core/base-provider').ProviderResult> {
    try {
      this.validateAudioParams(params);

      return await withRetry(async () => {
        const result = await generateContent(
          {
            prompt: params.prompt,
            model: params.model,
            contentType: 'audio',
            voice: params.voice,
            speed: params.speed,
            format: params.format,
          },
          this.config.apiKey,
          this.baseUrl
        );

        if (!result.success) {
          throw new ProviderError(
            result.error || 'Audio generation failed',
            'fal-audio',
            { params }
          );
        }

        return result;
      }, 'generate-audio');
    } catch (error) {
      this.logError(error as Error, 'generate');
      throw error;
    }
  }

  async getModels(): Promise<ProviderModel[]> {
    return this.getOrExecute(
      'fal-audio-models',
      async () => {
        const models = await listModels(this.config.apiKey, this.baseUrl);
        return models
          .filter(m => m.contentType === 'audio')
          .map(m => ({
            id: m.id,
            name: m.name,
            type: 'audio' as const,
            status: 'active' as const,
            description: m.description,
          }));
      },
      300000
    );
  }

  async checkHealth(): Promise<import('../core/base-provider').ProviderHealth> {
    try {
      return await withRetry(async () => {
        return await checkFalHealth(this.config.apiKey, this.baseUrl);
      }, 'health-check');
    } catch (error) {
      this.logError(error as Error, 'health-check');
      return {
        healthy: false,
        message: 'Health check failed',
        lastChecked: new Date(),
      };
    }
  }

  getMetadata() {
    return {
      id: 'provider-fal-audio',
      name: 'Fal Audio Provider',
      version: '1.0.0',
      supportedTypes: ['audio' as const],
    };
  }

  register(registry: PluginRegistry): void {
    registry.registerProvider({
      id: this.getMetadata().id,
      name: this.getMetadata().name,
      version: this.getMetadata().version,
      type: 'provider',
      providerName: 'fal-audio',
      supportedTypes: this.getMetadata().supportedTypes,
      generate: this.generate.bind(this),
      healthCheck: this.checkHealth.bind(this),
      getModels: this.getModels.bind(this),
      register: undefined as any,
    });
  }
}

/**
 * Unified Fal Provider Factory
 */
export class FalProviderFactory {
  static createImageProvider(
    runtime: IAgentRuntime,
    config: FalProviderConfig
  ): FalImageProvider {
    return new FalImageProvider(runtime, config);
  }

  static createVideoProvider(
    runtime: IAgentRuntime,
    config: FalProviderConfig
  ): FalVideoProvider {
    return new FalVideoProvider(runtime, config);
  }

  static createAudioProvider(
    runtime: IAgentRuntime,
    config: FalProviderConfig
  ): FalAudioProvider {
    return new FalAudioProvider(runtime, config);
  }

  static createAllProviders(
    runtime: IAgentRuntime,
    config: FalProviderConfig
  ): {
    image: FalImageProvider;
    video: FalVideoProvider;
    audio: FalAudioProvider;
  } {
    return {
      image: new FalImageProvider(runtime, config),
      video: new FalVideoProvider(runtime, config),
      audio: new FalAudioProvider(runtime, config),
    };
  }
}

export default FalProviderFactory;
