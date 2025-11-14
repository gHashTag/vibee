import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import { downloadInstagram, getDatasetItems, getRunDetails } from './generate';

export const createApifyProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.apify.com';

  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await downloadInstagram(params as any, config.apiKey, baseUrl);
  };

  const healthCheck = async (): Promise<PluginHealthStatus> => {
    try {
      const response = await fetch(`${baseUrl}/v2/users/me`, {
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

  const getDataset = async (datasetId: string) => await getDatasetItems(datasetId, config.apiKey, baseUrl);
  const getRun = async (runId: string) => await getRunDetails(runId, config.apiKey, baseUrl);

  return {
    id: 'provider-apify',
    name: 'Apify Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'apify',
    supportedTypes: ['video', 'image', 'model'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({ ...this, getDataset, getRun } as any);
    },
  };
};
