/**
 * OpenAI Provider Implementation
 * DALL-E 3 image generation
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
 * OpenAI Provider
 * DALL-E 3 for high-quality image generation
 * Documentation: https://platform.openai.com/docs/api-reference/images
 */
export class OpenAiProvider extends BaseProvider {
  readonly name = 'OpenAI';
  readonly type: ProviderType = 'openai';
  readonly description = 'DALL-E 3 for creative, high-quality image generation';

  private baseUrl = 'https://api.openai.com/v1';
  private defaultModel = 'dall-e-3';

  protected async onInitialize(config: ProviderConfig): Promise<void> {
    this.defaultModel = config.defaultModel || 'dall-e-3';
    this.log('info', 'OpenAI provider initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      const response = await fetch(`${this.baseUrl}/models`, {
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

      availableModels: ['dall-e-3', 'dall-e-2'],
      defaultModel: this.defaultModel,

      supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
      maxResolution: { width: 1792, height: 1792 },
      supportedFormats: ['png'],

      averageGenerationTime: 20,
      maxConcurrentRequests: 5,

      pricing: {
        generation: 0.08, // $0.08 for standard, $0.12 for HD
      },

      rateLimits: {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'Latest DALL-E model with improved quality and prompt following',
        type: 'base',
        version: '3',
        supportsLora: false,
        supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
        averageGenerationTime: 20,
        costPerGeneration: 0.08,
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        description: 'Previous generation DALL-E model',
        type: 'base',
        version: '2',
        supportsLora: false,
        supportedSizes: ['256x256', '512x512', '1024x1024'],
        averageGenerationTime: 15,
        costPerGeneration: 0.02,
      },
    ];
  }

  async generate(options: GenerationOptions): Promise<ImageResult> {
    this.ensureInitialized();
    this.validateGenerationOptions(options);

    const startTime = Date.now();

    // DALL-E 3 only supports 1 image per request
    if (this.defaultModel === 'dall-e-3' && (options.numImages || 1) > 1) {
      throw new ProviderError(
        ErrorCode.INVALID_PARAMETERS,
        'DALL-E 3 only supports generating 1 image at a time',
        this.type
      );
    }

    // Determine size
    let size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    if (options.width && options.height) {
      size = `${options.width}x${options.height}` as any;
    } else if (typeof options.imageSize === 'string') {
      // Map image size presets to OpenAI sizes
      if (options.imageSize.includes('landscape')) {
        size = '1792x1024';
      } else if (options.imageSize.includes('portrait')) {
        size = '1024x1792';
      }
    }

    const payload: any = {
      model: this.defaultModel,
      prompt: options.prompt,
      n: options.numImages || 1,
      size,
      quality: options.providerOptions?.quality || 'standard',
      style: options.providerOptions?.style || 'vivid',
      response_format: 'url',
    };

    const response = await this.fetchWithRetry<any>(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: this.getDefaultHeaders(),
      body: JSON.stringify(payload),
    });

    const generationTime = Date.now() - startTime;

    if (!response.data || response.data.length === 0) {
      throw new ProviderError(ErrorCode.GENERATION_FAILED, 'No images generated', this.type);
    }

    const image = response.data[0];
    const [width, height] = size.split('x').map(Number);

    // DALL-E often revises prompts for safety/clarity
    const enhancedPrompt = image.revised_prompt || options.prompt;

    return this.createImageResult(image.url, options, {
      width,
      height,
      contentType: 'image/png',
      generationTimeMs: generationTime,
      cost: this.estimateCost(options),
    });
  }

  estimateCost(options: GenerationOptions): number {
    const quality = options.providerOptions?.quality || 'standard';
    const basePrice = quality === 'hd' ? 0.12 : 0.08;

    if (this.defaultModel === 'dall-e-2') {
      return 0.02 * (options.numImages || 1);
    }

    return basePrice * (options.numImages || 1);
  }
}
