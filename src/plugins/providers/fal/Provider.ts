/**
 * Fal Provider Factory
 * Factory for creating Fal provider instances for images, video, and audio
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type { FalModel } from './types';
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

export const createFalProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://fal.run';

  /**
   * Main generate function
   */
  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateContent(
      {
        prompt: params.prompt,
        model: params.model,
        contentType: (params as any).contentType || 'image',
        imageSize: (params as any).imageSize,
        numImages: (params as any).numImages,
        numInferenceSteps: (params as any).numInferenceSteps,
        guidanceScale: (params as any).guidanceScale,
        seed: (params as any).seed,
        negativePrompt: (params as any).negativePrompt,
        loras: (params as any).loras,
        safetyChecker: (params as any).safetyChecker,
        outputFormat: (params as any).outputFormat,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkFalHealth(config.apiKey, baseUrl);
  };

  /**
   * List available models
   */
  const getModels = async (): Promise<FalModel[]> => {
    return await listModels(config.apiKey, baseUrl);
  };

  /**
   * Get specific model
   */
  const getModel = async (modelId: string): Promise<FalModel | null> => {
    const models = await getModels();
    return models.find((m) => m.id === modelId) || null;
  };

  /**
   * Check model health
   */
  const checkModel = async (modelId: string): Promise<PluginHealthStatus> => {
    return await checkModelHealth(modelId, config.apiKey, baseUrl);
  };

  /**
   * Estimate cost
   */
  const estimate = async (modelId: string, params: ProviderGenerationParams): Promise<number> => {
    return estimateCost(modelId, params as any);
  };

  /**
   * Get subscription info
   */
  const getSubscriptionInfo = async () => {
    return await getSubscription(config.apiKey, baseUrl);
  };

  /**
   * Check subscription health
   */
  const checkSubscription = async (): Promise<PluginHealthStatus> => {
    return await checkSubscriptionHealth(config.apiKey, baseUrl);
  };

  return {
    id: 'provider-fal',
    name: 'Fal Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'fal',
    supportedTypes: ['image', 'video', 'audio'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getModels,
        getModel,
        checkModel,
        estimate,
        getSubscriptionInfo,
        checkSubscription,
      } as any);
    },
  };
};

/**
 * Specialized providers by content type
 */

export const createFalImageProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-image',
    name: 'Fal Image Provider',
    providerName: 'fal-image',
    supportedTypes: ['image'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'image',
      } as any);
    },
  };
};

export const createFalVideoProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-video',
    name: 'Fal Video Provider',
    providerName: 'fal-video',
    supportedTypes: ['video'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'video',
      } as any);
    },
  };
};

export const createFalAudioProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-audio',
    name: 'Fal Audio Provider',
    providerName: 'fal-audio',
    supportedTypes: ['audio'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'audio',
      } as any);
    },
  };
};

/**
 * Specialized providers for specific models
 */

export const createFluxLoRAProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-flux-lora',
    name: 'Flux LoRA Provider',
    providerName: 'fal-flux-lora',
    supportedTypes: ['image'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        model: 'fal-ai/flux-lora',
        contentType: 'image',
      } as any);
    },
  };
};

export const createFluxProProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-flux-pro',
    name: 'Flux Pro Provider',
    providerName: 'fal-flux-pro',
    supportedTypes: ['image'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        model: 'fal-ai/flux-pro',
        contentType: 'image',
      } as any);
    },
  };
};

export const createVideoDiffusionProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createFalProvider(config, logger);

  return {
    ...base,
    id: 'provider-fal-video-diffusion',
    name: 'Video Diffusion Provider',
    providerName: 'fal-video-diffusion',
    supportedTypes: ['video'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        model: 'fal-ai/stable-video-diffusion',
        contentType: 'video',
      } as any);
    },
  };
};
