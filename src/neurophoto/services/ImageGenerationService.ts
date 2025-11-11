/**
 * Image Generation Service
 * High-level service for image generation with provider management
 */

import { Service, IAgentRuntime, ServiceType, UUID } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import {
  IProviderRegistry,
  GenerationOptions,
  ImageResult,
  ServiceResult,
  ErrorCode,
  ProviderError,
  ProviderSelectionCriteria,
} from '../types';
import { ProviderRegistry } from '../providers/registry/ProviderRegistry';
import { ProviderFactory } from '../providers/registry/ProviderFactory';

/**
 * Image Generation Service
 *
 * High-level service that:
 * - Manages provider registry
 * - Handles provider selection
 * - Implements fallback logic
 * - Records generation history
 */
export class ImageGenerationService extends Service {
  static serviceType: ServiceType = 'image-generation' as ServiceType;
  capabilityDescription = 'Image generation with multi-provider support and automatic fallback';

  private registry: IProviderRegistry;
  protected runtime: IAgentRuntime;
  private enableFallback = true;
  private maxFallbackAttempts = 3;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    this.registry = new ProviderRegistry();

    // Register default providers
    const defaultProviders = ProviderFactory.createDefaultProviders();

    for (const { provider, config } of defaultProviders) {
      this.registry.register(provider, config);
    }

    console.log(
      `[ImageGenerationService] Initialized with ${defaultProviders.length} provider(s)`,
      defaultProviders.map((p) => p.config.name)
    );
  }

  // ============================================================================
  // Image Generation
  // ============================================================================

  /**
   * Generate image with automatic provider selection
   */
  async generate(options: GenerationOptions, userId: UUID): Promise<ServiceResult<ImageResult>> {
    try {
      // Determine which provider to use
      const provider = options.model
        ? this.registry.getProvider(options.model) || this.registry.getActiveProvider()
        : this.registry.getActiveProvider();

      if (!provider) {
        return {
          success: false,
          error: {
            code: ErrorCode.PROVIDER_NOT_FOUND,
            message: 'No active provider available',
          },
        };
      }

      // Generate with selected provider
      const result = await this.generateWithProvider(provider, options, userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // If fallback is enabled and error is retryable, try another provider
      if (this.enableFallback && error instanceof ProviderError && error.retryable) {
        return await this.generateWithFallback(options, userId, error);
      }

      return {
        success: false,
        error: {
          code: error instanceof ProviderError ? error.code : ErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
          provider: error instanceof ProviderError ? error.provider : undefined,
        },
      };
    }
  }

  /**
   * Generate with specific provider
   */
  async generateWithSpecificProvider(
    providerId: string,
    options: GenerationOptions,
    userId: UUID
  ): Promise<ServiceResult<ImageResult>> {
    try {
      const provider = this.registry.getProvider(providerId);

      if (!provider) {
        return {
          success: false,
          error: {
            code: ErrorCode.PROVIDER_NOT_FOUND,
            message: `Provider ${providerId} not found`,
          },
        };
      }

      const result = await this.generateWithProvider(provider, options, userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof ProviderError ? error.code : ErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : String(error),
          provider: error instanceof ProviderError ? error.provider : undefined,
        },
      };
    }
  }

  /**
   * Generate with best provider based on criteria
   */
  async generateWithBestProvider(
    options: GenerationOptions,
    criteria: ProviderSelectionCriteria,
    userId: UUID
  ): Promise<ServiceResult<ImageResult>> {
    const provider = this.registry.selectBestProvider(criteria);

    if (!provider) {
      return {
        success: false,
        error: {
          code: ErrorCode.PROVIDER_NOT_FOUND,
          message: 'No provider matches the specified criteria',
        },
      };
    }

    return await this.generateWithSpecificProvider(provider.type, options, userId);
  }

  // ============================================================================
  // Provider Management
  // ============================================================================

  /**
   * Get provider registry
   */
  getRegistry(): IProviderRegistry {
    return this.registry;
  }

  /**
   * List all available providers
   */
  listProviders() {
    return this.registry.listProviders();
  }

  /**
   * Get active provider
   */
  getActiveProvider() {
    return this.registry.getActiveProvider();
  }

  /**
   * Set active provider
   */
  setActiveProvider(providerId: string) {
    this.registry.setActiveProvider(providerId);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async generateWithProvider(provider: any, options: GenerationOptions, userId: UUID): Promise<ImageResult> {
    const startTime = Date.now();

    console.log(`[ImageGenerationService] Generating with provider: ${provider.name}`);

    // Generate image
    const result = await provider.generate(options);

    const generationTime = Date.now() - startTime;

    // Record in database
    await this.recordGeneration(result, userId);

    console.log(`[ImageGenerationService] Generation completed in ${generationTime}ms`);

    return result;
  }

  private async generateWithFallback(
    options: GenerationOptions,
    userId: UUID,
    lastError: ProviderError
  ): Promise<ServiceResult<ImageResult>> {
    console.log('[ImageGenerationService] Primary provider failed, attempting fallback...');

    const providers = this.registry.listProviders();
    const activeProviders = providers.filter((p) => p.enabled && p.status === 'active');

    let attempts = 0;

    for (const providerInfo of activeProviders) {
      if (attempts >= this.maxFallbackAttempts) {
        break;
      }

      // Skip the provider that just failed
      if (lastError.provider && providerInfo.type === lastError.provider) {
        continue;
      }

      try {
        console.log(`[ImageGenerationService] Trying fallback provider: ${providerInfo.name}`);

        const provider = this.registry.getProvider(providerInfo.id);
        if (!provider) continue;

        const result = await this.generateWithProvider(provider, options, userId);

        console.log(`[ImageGenerationService] Fallback successful with ${providerInfo.name}`);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error(`[ImageGenerationService] Fallback provider ${providerInfo.name} failed:`, error);
        attempts++;
      }
    }

    return {
      success: false,
      error: {
        code: ErrorCode.GENERATION_FAILED,
        message: `All providers failed. Last error: ${lastError.message}`,
        details: lastError,
      },
    };
  }

  private async recordGeneration(result: ImageResult, userId: UUID): Promise<void> {
    try {
      await this.runtime.run(
        `INSERT INTO generation_history (
          id, user_id, prompt, enhanced_prompt, image_url,
          provider_id, provider_type, model_used,
          generation_time_ms, cost, seed,
          width, height, content_type,
          config, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          userId,
          result.prompt,
          result.enhancedPrompt || result.prompt,
          result.url,
          `${result.provider}-default`, // Provider ID
          result.provider,
          result.model,
          result.generationTimeMs,
          result.cost || null,
          result.seed || null,
          result.width,
          result.height,
          result.contentType,
          JSON.stringify({ prompt: result.prompt, model: result.model }), // config
          Date.now(),
        ]
      );
    } catch (error) {
      console.error('[ImageGenerationService] Failed to record generation:', error);
      // Don't throw - generation was successful even if recording failed
    }
  }

  async stop(): Promise<void> {
    console.log('[ImageGenerationService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
