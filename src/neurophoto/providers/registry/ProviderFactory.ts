/**
 * Provider Factory
 * Factory for creating provider instances
 */

import { IImageProvider, ProviderType, ProviderConfig } from '../../types';
import { FalAiProvider } from '../implementations/FalAiProvider';
import { ReplicateProvider } from '../implementations/ReplicateProvider';
import { StabilityAiProvider } from '../implementations/StabilityAiProvider';
import { OpenAiProvider } from '../implementations/OpenAiProvider';

/**
 * Provider Factory
 *
 * Creates provider instances based on type
 */
export class ProviderFactory {
  /**
   * Create a provider instance
   */
  static createProvider(type: ProviderType): IImageProvider {
    switch (type) {
      case 'fal':
        return new FalAiProvider();

      case 'replicate':
        return new ReplicateProvider();

      case 'stability':
        return new StabilityAiProvider();

      case 'openai':
        return new OpenAiProvider();

      case 'midjourney':
        throw new Error('Midjourney provider not yet implemented');

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Create and register default providers
   */
  static createDefaultProviders(): Array<{ provider: IImageProvider; config: ProviderConfig }> {
    const providers: Array<{ provider: IImageProvider; config: ProviderConfig }> = [];

    // Fal.ai - Priority 100 (highest)
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    if (falKey) {
      providers.push({
        provider: new FalAiProvider(),
        config: {
          id: 'fal-default',
          type: 'fal',
          name: 'Fal.ai (Default)',
          enabled: true,
          priority: 100,
          apiKey: falKey,
          defaultModel: 'fal-ai/flux-lora',
          defaultSettings: {
            imageSize: 'portrait_4_3',
            numInferenceSteps: 28,
            guidanceScale: 3.5,
            enableSafetyChecker: true,
          },
        },
      });
    }

    // Replicate - Priority 80
    const replicateKey = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
    if (replicateKey) {
      providers.push({
        provider: new ReplicateProvider(),
        config: {
          id: 'replicate-default',
          type: 'replicate',
          name: 'Replicate (Default)',
          enabled: true,
          priority: 80,
          apiKey: replicateKey,
          defaultModel: 'stability-ai/sdxl',
        },
      });
    }

    // Stability AI - Priority 70
    const stabilityKey = process.env.STABILITY_API_KEY || process.env.STABILITY_KEY;
    if (stabilityKey) {
      providers.push({
        provider: new StabilityAiProvider(),
        config: {
          id: 'stability-default',
          type: 'stability',
          name: 'Stability AI (Default)',
          enabled: true,
          priority: 70,
          apiKey: stabilityKey,
          defaultModel: 'stable-diffusion-xl-1024-v1-0',
        },
      });
    }

    // OpenAI - Priority 60
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      providers.push({
        provider: new OpenAiProvider(),
        config: {
          id: 'openai-default',
          type: 'openai',
          name: 'OpenAI (Default)',
          enabled: true,
          priority: 60,
          apiKey: openaiKey,
          defaultModel: 'dall-e-3',
          defaultSettings: {
            imageSize: 'square_hd',
          },
        },
      });
    }

    return providers;
  }

  /**
   * Get environment variable names for a provider type
   */
  static getProviderEnvVars(type: ProviderType): string[] {
    switch (type) {
      case 'fal':
        return ['FAL_KEY', 'FAL_API_KEY'];

      case 'replicate':
        return ['REPLICATE_API_TOKEN', 'REPLICATE_API_KEY'];

      case 'stability':
        return ['STABILITY_API_KEY', 'STABILITY_KEY'];

      case 'openai':
        return ['OPENAI_API_KEY'];

      case 'midjourney':
        return ['MIDJOURNEY_API_KEY'];

      default:
        return [];
    }
  }

  /**
   * Check if provider is configured in environment
   */
  static isProviderConfigured(type: ProviderType): boolean {
    const envVars = this.getProviderEnvVars(type);
    return envVars.some((varName) => !!process.env[varName]);
  }

  /**
   * Get all configured provider types
   */
  static getConfiguredProviders(): ProviderType[] {
    const types: ProviderType[] = ['fal', 'replicate', 'stability', 'openai', 'midjourney'];
    return types.filter((type) => this.isProviderConfigured(type));
  }
}
