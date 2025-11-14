/**
 * ElevenLabs Provider Factory
 * Factory for creating ElevenLabs provider instances for voice generation and cloning
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type {
  ElevenLabsVoice,
  VoiceCloneRequest,
  AudioInfo,
} from './types';
import {
  generateSpeech,
  listVoices,
  getVoice,
  cloneVoice,
  deleteVoice,
  getSubscription,
  getHistory,
  getAudio,
} from './generate';
import { checkElevenLabsHealth, checkVoiceHealth } from './healthCheck';

export const createElevenLabsProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.elevenlabs.io';

  /**
   * Main generate function (TTS)
   */
  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    return await generateSpeech(
      {
        prompt: params.prompt,
        contentType: 'audio',
        voiceId: (params as any).voiceId,
        modelId: (params as any).modelId,
        voiceSettings: (params as any).voiceSettings,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkElevenLabsHealth(config.apiKey, baseUrl);
  };

  /**
   * List available voices
   */
  const getVoices = async (): Promise<ElevenLabsVoice[]> => {
    return await listVoices(config.apiKey, baseUrl);
  };

  /**
   * Get specific voice
   */
  const getVoiceInfo = async (voiceId: string): Promise<ElevenLabsVoice | null> => {
    return await getVoice(voiceId, config.apiKey, baseUrl);
  };

  /**
   * Clone a voice
   */
  const cloneVoiceHandler = async (request: VoiceCloneRequest): Promise<ProviderResult> => {
    return await cloneVoice(request, config.apiKey, baseUrl);
  };

  /**
   * Delete a voice
   */
  const deleteVoiceHandler = async (voiceId: string): Promise<ProviderResult> => {
    return await deleteVoice(voiceId, config.apiKey, baseUrl);
  };

  /**
   * Get user subscription
   */
  const getSubscriptionInfo = async () => {
    return await getSubscription(config.apiKey, baseUrl);
  };

  /**
   * Get audio history
   */
  const getHistoryHandler = async (pageSize?: number): Promise<AudioInfo[]> => {
    return await getHistory(config.apiKey, baseUrl, pageSize);
  };

  /**
   * Get audio by ID
   */
  const getAudioHandler = async (audioId: string): Promise<Buffer | null> => {
    return await getAudio(audioId, config.apiKey, baseUrl);
  };

  /**
   * Check voice health
   */
  const checkVoice = async (voiceId: string): Promise<PluginHealthStatus> => {
    return await checkVoiceHealth(voiceId, config.apiKey, baseUrl);
  };

  return {
    id: 'provider-elevenlabs',
    name: 'ElevenLabs Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'elevenlabs',
    supportedTypes: ['audio'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getVoices,
        getVoice: getVoiceInfo,
        cloneVoice: cloneVoiceHandler,
        deleteVoice: deleteVoiceHandler,
        getSubscriptionInfo,
        getHistory: getHistoryHandler,
        getAudio: getAudioHandler,
        checkVoice,
      } as any);
    },
  };
};
