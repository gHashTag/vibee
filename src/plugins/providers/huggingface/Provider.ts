/**
 * HuggingFace Provider Factory
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type { HFModel } from './types';
import { listModels, generateText, getModel, chatCompletion } from './generate';
import { checkHuggingFaceHealth } from './healthCheck';

export const createHuggingFaceProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api-inference.huggingface.co';

  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateText(
      {
        prompt: params.prompt,
        model: params.model,
        maxNewTokens: (params as any).maxNewTokens,
        temperature: (params as any).temperature,
      },
      config.apiKey,
      baseUrl
    );
  };

  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkHuggingFaceHealth(config.apiKey, baseUrl);
  };

  const getModels = async (task?: string): Promise<HFModel[]> => {
    return await listModels(config.apiKey, baseUrl, task);
  };

  const getModelInfo = async (modelId: string): Promise<HFModel | null> => {
    return await getModel(modelId, config.apiKey, baseUrl);
  };

  const chat = async (inputs: string, params: Partial<HFChatParams> = {}): Promise<ProviderResult> => {
    return await chatCompletion(
      {
        prompt: '',
        inputs,
        model: params.model,
        parameters: params.parameters,
      },
      config.apiKey,
      baseUrl
    );
  };

  return {
    id: 'provider-huggingface',
    name: 'HuggingFace Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'huggingface',
    supportedTypes: ['text', 'image', 'audio'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getModels,
        getModel: getModelInfo,
        chat,
      } as any);
    },
  };
};
