/**
 * Fal.ai Provider Implementation
 * Supports Flux models with LoRA training and generation
 */

import { BaseProvider } from '../base/BaseProvider';
import {
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
  TrainingStatus,
} from '../../types';

interface FalGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

interface FalTrainingResponse {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  diffusion_lora_url?: string;
  config?: {
    trigger_word: string;
    rank: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Fal.ai Provider
 *
 * Capabilities:
 * - Image generation with Flux models
 * - LoRA support (loading and training)
 * - Multiple model variants (Pro, Dev, LoRA)
 * - Fast inference times
 *
 * Documentation: https://docs.fal.ai/
 */
export class FalAiProvider extends BaseProvider {
  readonly name = 'Fal.ai';
  readonly type: ProviderType = 'fal';
  readonly description = 'Fast inference with Flux models and LoRA training support';

  private baseUrl = 'https://fal.run';
  private defaultModel = 'fal-ai/flux-lora';

  // ============================================================================
  // Lifecycle
  // ============================================================================

  protected async onInitialize(config: ProviderConfig): Promise<void> {
    this.defaultModel = config.defaultModel || 'fal-ai/flux-lora';

    if (config.apiEndpoint) {
      this.baseUrl = config.apiEndpoint;
    }

    this.log('info', 'Fal.ai provider initialized', {
      defaultModel: this.defaultModel,
      loraSupport: true,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      // Simple health check - verify API key works
      const response = await fetch(`${this.baseUrl}/fal-ai/flux-dev`, {
        method: 'HEAD',
        headers: this.getAuthHeader(),
      });
      return response.ok || response.status === 405; // 405 is ok (method not allowed, but authenticated)
    } catch (error) {
      this.log('error', 'Health check failed', error);
      return false;
    }
  }

  // ============================================================================
  // Capabilities
  // ============================================================================

  getCapabilities(): ProviderCapabilities {
    return {
      imageGeneration: true,
      loraSupport: true,
      loraTraining: true,

      availableModels: [
        'fal-ai/flux-lora',
        'fal-ai/flux-pro',
        'fal-ai/flux-dev',
        'fal-ai/flux-realism',
        'fal-ai/stable-diffusion-v3',
      ],
      defaultModel: this.defaultModel,

      supportedSizes: ['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
      maxResolution: { width: 2048, height: 2048 },
      supportedFormats: ['jpeg', 'png'],

      averageGenerationTime: 10, // seconds
      maxConcurrentRequests: 5,

      pricing: {
        generation: 0.05, // $0.05 per image
        training: 2.5, // $2.50 per training
      },

      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'fal-ai/flux-lora',
        name: 'Flux LoRA',
        description: 'Flux model with LoRA support for personalization',
        type: 'lora',
        version: 'v1',
        supportsLora: true,
        supportedSizes: ['square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
        averageGenerationTime: 10,
        costPerGeneration: 0.05,
      },
      {
        id: 'fal-ai/flux-pro',
        name: 'Flux Pro',
        description: 'Professional quality image generation',
        type: 'base',
        version: 'v1',
        supportsLora: true,
        supportedSizes: ['square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
        averageGenerationTime: 15,
        costPerGeneration: 0.1,
      },
      {
        id: 'fal-ai/flux-dev',
        name: 'Flux Dev',
        description: 'Development model for testing',
        type: 'base',
        version: 'v1',
        supportsLora: true,
        supportedSizes: ['square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
        averageGenerationTime: 8,
        costPerGeneration: 0.025,
      },
      {
        id: 'fal-ai/flux-realism',
        name: 'Flux Realism',
        description: 'Photorealistic image generation',
        type: 'base',
        version: 'v1',
        supportsLora: true,
        supportedSizes: ['square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
        averageGenerationTime: 12,
        costPerGeneration: 0.075,
      },
    ];
  }

  // ============================================================================
  // Image Generation
  // ============================================================================

  async generate(options: GenerationOptions): Promise<ImageResult> {
    this.ensureInitialized();
    this.validateGenerationOptions(options);

    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.log('info', `Generating image with model ${model}`, {
      prompt: options.prompt.substring(0, 50) + '...',
    });

    // Build request payload
    const payload: any = {
      prompt: options.prompt,
      num_images: options.numImages || 1,
      enable_safety_checker: options.enableSafetyChecker !== false,
      output_format: options.outputFormat || 'jpeg',
    };

    // Image size
    if (options.imageSize) {
      payload.image_size = options.imageSize;
    } else if (options.width && options.height) {
      payload.image_size = { width: options.width, height: options.height };
    } else {
      payload.image_size = 'portrait_4_3';
    }

    // Generation parameters
    if (options.numInferenceSteps) {
      payload.num_inference_steps = options.numInferenceSteps;
    }
    if (options.guidanceScale) {
      payload.guidance_scale = options.guidanceScale;
    }
    if (options.seed) {
      payload.seed = options.seed;
    }
    if (options.negativePrompt) {
      payload.negative_prompt = options.negativePrompt;
    }

    // LoRA configuration
    if (options.loras && options.loras.length > 0) {
      payload.loras = options.loras.map((lora) => ({
        path: lora.path,
        scale: lora.scale,
      }));
    }

    // Make API request
    const response = await this.fetchWithRetry<FalGenerationResponse>(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const generationTime = Date.now() - startTime;

    if (!response.images || response.images.length === 0) {
      throw new ProviderError(ErrorCode.GENERATION_FAILED, 'No images returned from Fal.ai', this.type);
    }

    const image = response.images[0];

    this.log('info', `Generated image in ${generationTime}ms`, {
      url: image.url.substring(0, 50) + '...',
      size: `${image.width}x${image.height}`,
    });

    return this.createImageResult(image.url, options, {
      width: image.width,
      height: image.height,
      contentType: image.content_type,
      seed: response.seed,
      generationTimeMs: generationTime,
      cost: this.estimateCost(options),
    });
  }

  // ============================================================================
  // LoRA Training
  // ============================================================================

  supportsLora(): boolean {
    return true;
  }

  async trainLora(options: TrainingOptions): Promise<TrainingResult> {
    this.ensureInitialized();
    this.validateTrainingOptions(options);

    const startTime = Date.now();

    this.log('info', 'Starting LoRA training', {
      triggerWord: options.triggerWord,
      steps: options.steps || 1000,
    });

    // Build training payload
    const payload: any = {
      images_data_url: options.imagesZipUrl,
      trigger_word: options.triggerWord,
      steps: options.steps || 1000,
      learning_rate: options.learningRate || 0.0004,
      rank: options.rank || 16,
    };

    // Submit training job
    const response = await this.fetchWithRetry<FalTrainingResponse>(
      `${this.baseUrl}/fal-ai/flux-lora-portrait-trainer`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.request_id) {
      throw new ProviderError(ErrorCode.TRAINING_FAILED, 'No training job ID returned', this.type);
    }

    // For synchronous training, wait for completion
    if (response.status === 'COMPLETED' && response.diffusion_lora_url) {
      const trainingTime = Date.now() - startTime;

      this.log('info', `Training completed in ${trainingTime}ms`, {
        loraUrl: response.diffusion_lora_url.substring(0, 50) + '...',
      });

      return this.createTrainingResult(response.diffusion_lora_url, options, {
        model: 'fal-ai/flux-lora-portrait-trainer',
        trainingTimeMs: trainingTime,
        cost: this.getCapabilities().pricing.training,
      });
    }

    // For async training, throw error (caller should use checkTrainingStatus)
    throw new ProviderError(
      ErrorCode.TRAINING_FAILED,
      `Training started but not completed. Job ID: ${response.request_id}`,
      this.type,
      { jobId: response.request_id, status: response.status }
    );
  }

  async checkTrainingStatus(jobId: string): Promise<TrainingProgressInfo> {
    this.ensureInitialized();

    const response = await this.fetchWithRetry<FalTrainingResponse>(
      `${this.baseUrl}/fal-ai/flux-lora-portrait-trainer/requests/${jobId}`,
      {
        headers: {
          Authorization: `Key ${this.apiKey}`,
        },
      }
    );

    const status = this.mapFalStatusToTrainingStatus(response.status);
    const progress = this.estimateProgress(response.status);

    return {
      status,
      progress,
      error: response.error?.message,
    };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  estimateCost(options: GenerationOptions): number {
    const numImages = options.numImages || 1;
    const baseModels = this.getCapabilities().availableModels;
    const model = options.model || this.defaultModel;

    // Different pricing for different models
    let costPerImage = 0.05;
    if (model.includes('pro')) {
      costPerImage = 0.1;
    } else if (model.includes('dev')) {
      costPerImage = 0.025;
    } else if (model.includes('realism')) {
      costPerImage = 0.075;
    }

    return costPerImage * numImages;
  }

  protected getAuthHeader(): Record<string, string> {
    return {
      Authorization: `Key ${this.apiKey}`,
    };
  }

  private mapFalStatusToTrainingStatus(status: string): TrainingStatus {
    switch (status) {
      case 'IN_QUEUE':
        return 'pending';
      case 'IN_PROGRESS':
        return 'training';
      case 'COMPLETED':
        return 'ready';
      case 'FAILED':
        return 'failed';
      default:
        return 'training';
    }
  }

  private estimateProgress(status: string): number {
    switch (status) {
      case 'IN_QUEUE':
        return 0;
      case 'IN_PROGRESS':
        return 50;
      case 'COMPLETED':
        return 100;
      case 'FAILED':
        return 0;
      default:
        return 0;
    }
  }
}
