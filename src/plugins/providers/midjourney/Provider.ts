import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import { generateImage, checkStatus } from './generate';

export const createMidjourneyProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.midjourney.com';

  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateImage(params as any, config.apiKey, baseUrl);
  };

  const healthCheck = async (): Promise<PluginHealthStatus> => {
    try {
      const response = await fetch(`${baseUrl}/health`, {
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

  const checkTask = async (taskId: string) => await checkStatus(taskId, config.apiKey, baseUrl);

  return {
    id: 'provider-midjourney',
    name: 'Midjourney Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'midjourney',
    supportedTypes: ['image'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({ ...this, checkTask } as any);
    },
  };
};
