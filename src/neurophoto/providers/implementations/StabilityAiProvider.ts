/**
 * Stability AI Provider Implementation
 * Official Stable Diffusion API
 */

import { BaseProvider } from '../base/BaseProvider';
import {
  ProviderType,
  ProviderConfig,
  ProviderCapabilities,
  GenerationOptions,
  ImageResult,
  ModelInfo,
  ErrorCode,
  ProviderError,
} from '../../types';

/**
 * Stability AI Provider
 * Official Stable Diffusion models
 * Documentation: https://platform.stability.ai/docs
 */
export class StabilityAiProvider extends BaseProvider {
  readonly name = 'Stability AI';
  readonly type: ProviderType = 'stability';
  readonly description = 'Official Stable Diffusion models from Stability AI';

  private baseUrl = 'https://api.stability.ai/v1';
  private defaultModel = 'stable-diffusion-xl-1024-v1-0';

  protected async onInitialize(config: ProviderConfig): Promise<void> {
    this.defaultModel = config.defaultModel || this.defaultModel;
    this.log('info', 'Stability AI provider initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      const response = await fetch(`${this.baseUrl}/user/account`, {
        headers: this.getDefaultHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      imageGeneration: true,
      loraSupport: false,
      loraTraining: false,

      availableModels: ['stable-diffusion-xl-1024-v1-0', 'stable-diffusion-v1-6', 'stable-diffusion-3'],
      defaultModel: this.defaultModel,

      supportedSizes: 'custom',
      maxResolution: { width: 2048, height: 2048 },
      supportedFormats: ['jpeg', 'png'],

      averageGenerationTime: 12,
      maxConcurrentRequests: 5,

      pricing: {
        generation: 0.04,
      },

      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'stable-diffusion-xl-1024-v1-0',
        name: 'SDXL 1.0',
        description: 'Stable Diffusion XL 1.0',
        type: 'base',
        version: '1.0',
        supportsLora: false,
        supportedSizes: ['custom'],
        averageGenerationTime: 12,
        costPerGeneration: 0.04,
      },
    ];
  }

  async generate(options: GenerationOptions): Promise<ImageResult> {
    this.ensureInitialized();
    this.validateGenerationOptions(options);

    const startTime = Date.now();

    const payload = {
      text_prompts: [
        { text: options.prompt, weight: 1 },
        ...(options.negativePrompt ? [{ text: options.negativePrompt, weight: -1 }] : []),
      ],
      cfg_scale: options.guidanceScale || 7,
      height: options.height || 1024,
      width: options.width || 1024,
      samples: options.numImages || 1,
      steps: options.numInferenceSteps || 50,
      seed: options.seed || 0,
    };

    const response = await this.fetchWithRetry<any>(
      `${this.baseUrl}/generation/${this.defaultModel}/text-to-image`,
      {
        method: 'POST',
        headers: {
          ...this.getDefaultHeaders(),
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const generationTime = Date.now() - startTime;

    if (!response.artifacts || response.artifacts.length === 0) {
      throw new ProviderError(ErrorCode.GENERATION_FAILED, 'No images generated', this.type);
    }

    // Convert base64 to URL (simplified - in production would upload to storage)
    const base64Image = response.artifacts[0].base64;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return this.createImageResult(imageUrl, options, {
      width: options.width || 1024,
      height: options.height || 1024,
      seed: response.artifacts[0].seed,
      generationTimeMs: generationTime,
      cost: this.estimateCost(options),
    });
  }

  estimateCost(options: GenerationOptions): number {
    return 0.04 * (options.numImages || 1);
  }
}
