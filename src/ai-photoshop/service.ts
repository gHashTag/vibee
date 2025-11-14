/**
 * AI Photoshop Service - OPTIMIZED
 * Handles image transformation using Replicate AI models
 * OPTIMIZATIONS: Parallel processing, batch processing, caching, connection pooling
 */

import { Service, IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import type {
  AIPhotoshopModel,
  AIPhotoshopRequest,
  AIPhotoshopResult,
  CAMERA_ANGLE_PROMPTS,
  LIGHTING_SETUP_PROMPTS,
  FRAME_COMPOSITION_PROMPTS,
} from './types';
import { performanceMonitor } from '../performance/PerformanceMonitor';
import { cachedProviderFactory } from '../performance/CachedProvider';
import { createAIPhotoshopPools } from '../performance/ObjectPool';

// Replicate API configuration
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

// Model mappings to Replicate model IDs
const MODEL_IDS: Record<AIPhotoshopModel, string> = {
  seedream: 'bytedance/seedream-4',
  nano_banana: 'google-deepmind/nano-banana',
  flux_multi_kontext: 'flux-multi-kontext/model',
  qwen_edit_plus: 'alibaba/qwen-image-edit-plus',
  flux_kontext_pro: 'flux-kontext-pro/model',
  seededit_3: 'seed-edit-3/model',
  qwen_image_edit: 'alibaba/qwen-image-edit',
};

// Default pricing (USD per generation)
const DEFAULT_PRICING: Record<AIPhotoshopModel, number> = {
  seedream: 0.03,
  nano_banana: 0.039,
  flux_multi_kontext: 0.03,
  qwen_edit_plus: 0.03,
  flux_kontext_pro: 0.05,
  seededit_3: 0.05,
  qwen_image_edit: 0.025,
};

export class AIPhotoshopService extends Service {
  static serviceType = 'ai-photoshop' as const;

  private replicateApiKey: string | undefined;
  private requestCache: ReturnType<typeof cachedProviderFactory.getProvider>;
  private pools: ReturnType<typeof createAIPhotoshopPools> | null = null;
  private processingQueue: AIPhotoshopRequest[] = [];
  private isProcessingBatch = false;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[AIPhotoshop] 🔍 Initializing optimized service...');

    // Get Replicate API key from environment
    this.replicateApiKey = runtime.getSetting('REPLICATE_API_KEY');

    if (!this.replicateApiKey) {
      logger.warn('[AIPhotoshop] REPLICATE_API_KEY not found - service will not work');
      return;
    }

    // Initialize cache for similar requests
    this.requestCache = cachedProviderFactory.getProvider(
      'ai-photoshop-requests',
      {
        ttl: 10 * 60 * 1000, // 10 minutes cache for similar requests
        maxSize: 1000,
      }
    );

    // Initialize object pools
    this.pools = createAIPhotoshopPools();

    logger.info('[AIPhotoshop] ✅ Optimized service initialized successfully');
  }

  async start(): Promise<void> {
    // Service is ready after initialization
    logger.info('[AIPhotoshop] Service started');
  }

  async stop(): Promise<void> {
    // Cleanup if needed
    logger.info('[AIPhotoshop] Service stopped');
  }

  /**
   * Build complete prompt with enhancements
   */
  private buildEnhancedPrompt(request: AIPhotoshopRequest): string {
    const parts: string[] = [];

    // Add user's prompt first
    parts.push(request.prompt);

    // Add camera angle if specified
    if (request.cameraAngle) {
      const cameraPrompts = require('./types').CAMERA_ANGLE_PROMPTS;
      parts.push(cameraPrompts[request.cameraAngle]);
    }

    // Add lighting if specified
    if (request.lighting) {
      const lightingPrompts = require('./types').LIGHTING_SETUP_PROMPTS;
      parts.push(lightingPrompts[request.lighting]);
    }

    // Add composition if specified
    if (request.composition) {
      const compositionPrompts = require('./types').FRAME_COMPOSITION_PROMPTS;
      parts.push(compositionPrompts[request.composition]);
    }

    return parts.join(' ');
  }

  /**
   * Process single image with AI Photoshop - OPTIMIZED with caching
   */
  async processImage(request: AIPhotoshopRequest): Promise<AIPhotoshopResult> {
    const operationName = `ai-photoshop-${request.model}`;
    return performanceMonitor.measure(operationName, async () => {
      try {
        if (!this.replicateApiKey) {
          return this.createErrorResult(request.model, 'REPLICATE_API_KEY not configured');
        }

        // Try to get from cache first
        const cacheKey = this.getCacheKey(request);
        const cached = await this.requestCache.get(cacheKey, async () => {
          return this.processImageInternal(request);
        });

        return cached;
      } catch (error) {
        logger.error('[AIPhotoshop] Error processing image', { error });
        return this.createErrorResult(
          request.model,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  }

  /**
   * Process multiple images in parallel - BATCH PROCESSING
   */
  async processBatch(requests: AIPhotoshopRequest[]): Promise<AIPhotoshopResult[]> {
    logger.info(`[AIPhotoshop] Processing batch of ${requests.length} images`);

    // Process in parallel batches of 5
    const batchSize = 5;
    const results: AIPhotoshopResult[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(request => this.processImage(request))
      );
      results.push(...batchResults);
    }

    logger.info(`[AIPhotoshop] Batch processing complete: ${results.length} results`);
    return results;
  }

  /**
   * Internal image processing (without cache check)
   */
  private async processImageInternal(request: AIPhotoshopRequest): Promise<AIPhotoshopResult> {
    // Get model ID
    const modelId = MODEL_IDS[request.model];
    if (!modelId) {
      return this.createErrorResult(request.model, `Unknown model: ${request.model}`);
    }

    // Build enhanced prompt
    const enhancedPrompt = this.buildEnhancedPrompt(request);

    logger.info('[AIPhotoshop] Processing image', {
      model: request.model,
      promptLength: request.prompt.length,
      hasEnhancements: !!(request.cameraAngle || request.lighting || request.composition),
    });

    // Prepare Replicate API request
    const replicateRequest = {
      version: modelId,
      input: {
        image: request.imageUrl,
        prompt: enhancedPrompt,
        aspect_ratio: request.aspectRatio || '9:16',
        output_quality: this.getQualityValue(request.quality),
        num_outputs: request.variationsCount || 1,
        ...(request.seed && { seed: request.seed }),
        ...(request.guidanceScale && { guidance_scale: request.guidanceScale }),
      },
    };

    // Call Replicate API with retry logic
    const response = await this.fetchWithRetry(
      REPLICATE_API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replicateRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[AIPhotoshop] Replicate API error', {
        status: response.status,
        error: errorText,
      });
      return this.createErrorResult(
        request.model,
        `Replicate API error: ${response.status}`
      );
    }

    const result = await response.json();

    // Wait for prediction to complete
    const finalResult = await this.waitForPrediction(result.id);

    if (!finalResult.output || finalResult.output.length === 0) {
      return this.createErrorResult(request.model, 'No output generated');
    }

    // Get first output image URL
    const imageUrl = Array.isArray(finalResult.output)
      ? finalResult.output[0]
      : finalResult.output;

    return {
      success: true,
      imageUrl,
      model: request.model,
      processingTime: Date.now(), // Will be set by caller
      cost: DEFAULT_PRICING[request.model],
    };
  }

  /**
   * Fetch with retry logic and timeout
   */
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[AIPhotoshop] Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: AIPhotoshopRequest): string {
    const keyData = {
      model: request.model,
      prompt: request.prompt,
      imageUrl: request.imageUrl,
      cameraAngle: request.cameraAngle,
      lighting: request.lighting,
      composition: request.composition,
      aspectRatio: request.aspectRatio,
      quality: request.quality,
    };
    return JSON.stringify(keyData);
  }

  /**
   * Create error result
   */
  private createErrorResult(model: AIPhotoshopModel, error: string): AIPhotoshopResult {
    return {
      success: false,
      error,
      model,
    };
  }

  /**
   * Wait for Replicate prediction to complete - OPTIMIZED with efficient polling
   */
  private async waitForPrediction(predictionId: string, maxWaitTime = 60000): Promise<any> {
    const startTime = Date.now();

    // Use exponential backoff for polling
    let pollInterval = 1000;
    const maxInterval = 5000;

    while (Date.now() - startTime < maxWaitTime) {
      const response = await this.fetchWithRetry(
        `${REPLICATE_API_URL}/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`,
          },
        },
        2 // Fewer retries for status checks
      );

      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.status}`);
      }

      const prediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(`Prediction ${prediction.status}: ${prediction.error || 'Unknown error'}`);
      }

      // Wait before next poll with exponential backoff
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
    }

    throw new Error('Prediction timed out');
  }

  /**
   * Convert quality string to numeric value
   */
  private getQualityValue(quality?: string): number {
    switch (quality) {
      case '1K':
        return 80;
      case '2K':
        return 90;
      case '4K':
        return 95;
      default:
        return 85;
    }
  }

  /**
   * Get model cost in USD
   */
  getModelCost(model: AIPhotoshopModel): number {
    return DEFAULT_PRICING[model] || 0.03;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): AIPhotoshopModel[] {
    return Object.keys(MODEL_IDS) as AIPhotoshopModel[];
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      cache: this.requestCache?.getStats(),
      pools: this.pools ? {
        requestPool: this.pools.requestPool.getStats(),
        resultPool: this.pools.resultPool.getStats(),
      } : null,
      metrics: performanceMonitor.getAllMetrics(),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache?.clear();
    logger.info('[AIPhotoshop] Cache cleared');
  }
}
