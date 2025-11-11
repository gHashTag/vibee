/**
 * Replicate Provider Implementation
 * Supports hundreds of models via Replicate API
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

interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | string;
  error?: string;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Replicate Provider
 *
 * Capabilities:
 * - Access to hundreds of community models
 * - SDXL, Flux, and other popular models
 * - No built-in LoRA training (model-dependent)
 *
 * Documentation: https://replicate.com/docs
 */
export class ReplicateProvider extends BaseProvider {
  readonly name = 'Replicate';
  readonly type: ProviderType = 'replicate';
  readonly description = 'Access to hundreds of community models including SDXL and Flux';

  private baseUrl = 'https://api.replicate.com/v1';
  private defaultModel = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
  private pollInterval = 2000; // 2 seconds
  private maxPollAttempts = 60; // 2 minutes total

  protected async onInitialize(config: ProviderConfig): Promise<void> {
    this.defaultModel = config.defaultModel || this.defaultModel;
    this.log('info', 'Replicate provider initialized', { defaultModel: this.defaultModel });
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });
      return response.ok;
    } catch (error) {
      this.log('error', 'Health check failed', error);
      return false;
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      imageGeneration: true,
      loraSupport: true, // Model-dependent
      loraTraining: false, // Not natively supported

      availableModels: [
        'stability-ai/sdxl',
        'black-forest-labs/flux-schnell',
        'black-forest-labs/flux-dev',
        'bytedance/sdxl-lightning',
      ],
      defaultModel: 'stability-ai/sdxl',

      supportedSizes: 'custom',
      maxResolution: { width: 2048, height: 2048 },
      supportedFormats: ['jpeg', 'png', 'webp'],

      averageGenerationTime: 15,
      maxConcurrentRequests: 10,

      pricing: {
        generation: 0.03, // Varies by model
      },

      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 5000,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    // In production, this would fetch from Replicate API
    return [
      {
        id: 'stability-ai/sdxl',
        name: 'Stable Diffusion XL',
        description: 'High-quality image generation with SDXL',
        type: 'base',
        version: 'latest',
        supportsLora: true,
        supportedSizes: ['custom'],
        averageGenerationTime: 15,
        costPerGeneration: 0.03,
      },
    ];
  }

  async generate(options: GenerationOptions): Promise<ImageResult> {
    this.ensureInitialized();
    this.validateGenerationOptions(options);

    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.log('info', `Starting generation with ${model}`);

    // Create prediction
    const payload = {
      version: model.split(':')[1] || model,
      input: {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        width: options.width || 1024,
        height: options.height || 1024,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: options.guidanceScale || 7.5,
        seed: options.seed,
        num_outputs: options.numImages || 1,
      },
    };

    // Start prediction
    const prediction = await this.fetchWithRetry<ReplicateResponse>(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(payload),
    });

    // Poll for completion
    const result = await this.pollPrediction(prediction.id);

    const generationTime = Date.now() - startTime;

    if (!result.output) {
      throw new ProviderError(ErrorCode.GENERATION_FAILED, 'No output from Replicate', this.type);
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    return this.createImageResult(imageUrl, options, {
      width: options.width || 1024,
      height: options.height || 1024,
      generationTimeMs: generationTime,
      cost: this.estimateCost(options),
    });
  }

  estimateCost(options: GenerationOptions): number {
    const numImages = options.numImages || 1;
    return 0.03 * numImages; // Base cost, varies by model
  }

  private async pollPrediction(predictionId: string): Promise<ReplicateResponse> {
    let attempts = 0;

    while (attempts < this.maxPollAttempts) {
      const prediction = await this.fetchWithRetry<ReplicateResponse>(
        `${this.baseUrl}/predictions/${predictionId}`,
        {
          method: 'GET',
          headers: this.getDefaultHeaders(),
        }
      );

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new ProviderError(
          ErrorCode.GENERATION_FAILED,
          `Prediction failed: ${prediction.error}`,
          this.type
        );
      }

      if (prediction.status === 'canceled') {
        throw new ProviderError(ErrorCode.GENERATION_FAILED, 'Prediction was canceled', this.type);
      }

      await this.sleep(this.pollInterval);
      attempts++;
    }

    throw new ProviderError(ErrorCode.TIMEOUT, 'Prediction timed out', this.type);
  }
}
