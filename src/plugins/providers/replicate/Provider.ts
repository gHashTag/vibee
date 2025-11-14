/**
 * Replicate Provider Factory
 * Factory for creating Replicate provider instances with 20+ AI models
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type { ReplicateModel, ReplicatePagination } from './types';
import {
  generateContent,
  listModels,
  getPrediction,
  cancelPrediction,
  listPredictions,
} from './generate';
import { checkReplicateHealth, checkPredictionHealth } from './healthCheck';

export const createReplicateProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.replicate.com';

  /**
   * Main generate function
   */
  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateContent(
      {
        prompt: params.prompt,
        model: params.model,
        contentType: (params as any).contentType || 'image',
        input: (params as any).input || {},
        webhook: (params as any).webhook,
        waitForCompletion: (params as any).waitForCompletion || false,
        pollInterval: (params as any).pollInterval,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkReplicateHealth(config.apiKey, baseUrl);
  };

  /**
   * List available models
   */
  const getModels = async (): Promise<ReplicateModel[]> => {
    return await listModels(config.apiKey, baseUrl);
  };

  /**
   * Get specific model
   */
  const getModel = async (modelId: string): Promise<ReplicateModel | null> => {
    const models = await getModels();
    return models.find((m) => m.id === modelId) || null;
  };

  /**
   * Check prediction status
   */
  const checkPrediction = async (predictionId: string): Promise<ProviderResult> => {
    try {
      const prediction = await getPrediction(predictionId, config.apiKey, baseUrl);
      return {
        success: true,
        data: prediction,
        metadata: {
          predictionId,
          status: prediction.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  /**
   * Cancel prediction
   */
  const cancelPredictionJob = async (predictionId: string): Promise<ProviderResult> => {
    return await cancelPrediction(predictionId, config.apiKey, baseUrl);
  };

  /**
   * List user predictions
   */
  const getPredictions = async (
    cursor?: string
  ): Promise<{ predictions: any[]; pagination: ReplicatePagination }> => {
    return await listPredictions(config.apiKey, baseUrl, cursor);
  };

  return {
    id: 'provider-replicate',
    name: 'Replicate Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'replicate',
    supportedTypes: ['image', 'video', 'audio', 'text'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getModels,
        getModel,
        checkPrediction,
        cancelPrediction: cancelPredictionJob,
        getPredictions,
      } as any);
    },
  };
};

/**
 * Specialized providers for different content types
 */

export const createReplicateImageProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createReplicateProvider(config, logger);

  return {
    ...base,
    id: 'provider-replicate-image',
    name: 'Replicate Image Provider',
    providerName: 'replicate-image',
    supportedTypes: ['image'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'image',
      } as any);
    },
  };
};

export const createReplicateVideoProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createReplicateProvider(config, logger);

  return {
    ...base,
    id: 'provider-replicate-video',
    name: 'Replicate Video Provider',
    providerName: 'replicate-video',
    supportedTypes: ['video'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'video',
      } as any);
    },
  };
};

export const createReplicateAudioProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createReplicateProvider(config, logger);

  return {
    ...base,
    id: 'provider-replicate-audio',
    name: 'Replicate Audio Provider',
    providerName: 'replicate-audio',
    supportedTypes: ['audio'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'audio',
      } as any);
    },
  };
};

export const createReplicateTextProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const base = createReplicateProvider(config, logger);

  return {
    ...base,
    id: 'provider-replicate-text',
    name: 'Replicate Text Provider',
    providerName: 'replicate-text',
    supportedTypes: ['text'],
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      return await base.generate({
        ...params,
        contentType: 'text',
      } as any);
    },
  };
};
