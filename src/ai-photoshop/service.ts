/**
 * AI Photoshop Service
 * Handles image transformation using Replicate AI models
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

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Get Replicate API key from environment
    this.replicateApiKey = runtime.getSetting('REPLICATE_API_KEY');

    if (!this.replicateApiKey) {
      logger.warn('[AIPhotoshop] REPLICATE_API_KEY not found - service will not work');
    } else {
      logger.info('[AIPhotoshop] Service initialized successfully');
    }
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
   * Process image with AI Photoshop
   */
  async processImage(request: AIPhotoshopRequest): Promise<AIPhotoshopResult> {
    const startTime = Date.now();

    try {
      if (!this.replicateApiKey) {
        return {
          success: false,
          error: 'REPLICATE_API_KEY not configured',
          model: request.model,
        };
      }

      // Get model ID
      const modelId = MODEL_IDS[request.model];
      if (!modelId) {
        return {
          success: false,
          error: `Unknown model: ${request.model}`,
          model: request.model,
        };
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

      // Call Replicate API
      const response = await fetch(REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replicateRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[AIPhotoshop] Replicate API error', {
          status: response.status,
          error: errorText,
        });
        return {
          success: false,
          error: `Replicate API error: ${response.status}`,
          model: request.model,
        };
      }

      const result = await response.json();

      // Wait for prediction to complete
      const finalResult = await this.waitForPrediction(result.id);

      const processingTime = Date.now() - startTime;

      if (!finalResult.output || finalResult.output.length === 0) {
        return {
          success: false,
          error: 'No output generated',
          model: request.model,
          processingTime,
        };
      }

      // Get first output image URL
      const imageUrl = Array.isArray(finalResult.output)
        ? finalResult.output[0]
        : finalResult.output;

      return {
        success: true,
        imageUrl,
        model: request.model,
        processingTime,
        cost: DEFAULT_PRICING[request.model],
      };
    } catch (error) {
      logger.error('[AIPhotoshop] Error processing image', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model: request.model,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Wait for Replicate prediction to complete
   */
  private async waitForPrediction(predictionId: string, maxWaitTime = 60000): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 1000; // Check every second

    while (Date.now() - startTime < maxWaitTime) {
      const response = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
        },
      });

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

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
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
}
