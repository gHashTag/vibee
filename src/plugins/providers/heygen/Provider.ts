/**
 * HeyGen Provider Factory
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import {
  generateVideo,
  createStreaming,
  checkVideoStatus,
  listAvatars,
  listVoices,
} from './generate';
import { checkHeyGenHealth } from './healthCheck';

export const createHeyGenProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.heygen.com';

  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateVideo(
      {
        avatar_id: (params as any).avatar_id,
        voice_id: (params as any).voice_id,
        script: params.prompt || (params as any).script,
        test: (params as any).test,
        caption: (params as any).caption,
        aspect_ratio: (params as any).aspect_ratio,
      },
      config.apiKey,
      baseUrl
    );
  };

  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkHeyGenHealth(config.apiKey, baseUrl);
  };

  const getAvatars = async () => {
    return await listAvatars(config.apiKey, baseUrl);
  };

  const getVoices = async () => {
    return await listVoices(config.apiKey, baseUrl);
  };

  const createStream = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await createStreaming(
      {
        avatar_id: (params as any).avatar_id,
        voice_id: (params as any).voice_id,
        script: params.prompt || (params as any).script,
      },
      config.apiKey,
      baseUrl
    );
  };

  const checkVideo = async (videoId: string): Promise<ProviderResult> => {
    return await checkVideoStatus(videoId, config.apiKey, baseUrl);
  };

  return {
    id: 'provider-heygen',
    name: 'HeyGen Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'heygen',
    supportedTypes: ['video'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getAvatars,
        getVoices,
        createStream,
        checkVideo,
      } as any);
    },
  };
};
