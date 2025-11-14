/**
 * Runway Provider Factory
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import { generateVideo, listModels, checkStatus } from './generate';

export const createRunwayProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.runwayml.com';

  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateVideo(
      {
        prompt: params.prompt,
        model: params.model,
        duration: (params as any).duration,
        ratio: (params as any).ratio,
        seed: (params as any).seed,
      },
      config.apiKey,
      baseUrl
    );
  };

  const healthCheck = async (): Promise<PluginHealthStatus> => {
    try {
      const response = await fetch(`${baseUrl}/v1/user`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return {
        healthy: response.ok,
        statusCode: response.status,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
        lastChecked: new Date(),
      };
    }
  };

  const getModels = async () => await listModels();
  const checkTask = async (taskId: string) => await checkStatus(taskId, config.apiKey, baseUrl);

  return {
    id: 'provider-runway',
    name: 'Runway Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'runway',
    supportedTypes: ['video'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({ ...this, getModels, checkTask } as any);
    },
  };
};
