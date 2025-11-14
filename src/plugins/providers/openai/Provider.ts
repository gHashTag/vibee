/**
 * OpenAI Provider Factory
 * Factory for creating OpenAI provider instances for GPT-4, Vision, and TTS
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type { ChatMessage } from './types';
import {
  generateChat,
  analyzeImage,
  generateSpeech,
  generateEmbeddings,
  listModels,
  getUser,
} from './generate';
import { checkOpenAIHealth } from './healthCheck';

export const createOpenAIProvider = (
  config: ProviderConfig,
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.openai.com';

  /**
   * Main generate function
   */
  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    if (params.prompt && (params as any).messages) {
      return await generateChat((params as any), config.apiKey, baseUrl);
    } else if (params.prompt && (params as any).imageUrl) {
      return await analyzeImage((params as any), config.apiKey, baseUrl);
    } else if (params.prompt) {
      return await generateSpeech((params as any), config.apiKey, baseUrl);
    } else {
      throw new Error('Invalid generation parameters');
    }
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkOpenAIHealth(config.apiKey, baseUrl);
  };

  /**
   * Generate chat completion
   */
  const chat = async (
    messages: ChatMessage[],
    model?: string,
    options?: Partial<OpenAIChatParams>
  ): Promise<ProviderResult> => {
    return await generateChat(
      {
        prompt: '',
        contentType: 'text',
        messages,
        model,
        ...options,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Analyze image with vision
   */
  const vision = async (
    imageUrl: string,
    prompt: string,
    options?: Partial<OpenAIVisionParams>
  ): Promise<ProviderResult> => {
    return await analyzeImage(
      {
        prompt,
        contentType: 'image',
        imageUrl,
        ...options,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Generate speech
   */
  const textToSpeech = async (
    text: string,
    options?: Partial<OpenAITTSParams>
  ): Promise<ProviderResult> => {
    return await generateSpeech(
      {
        prompt: text,
        contentType: 'audio',
        ...options,
      },
      config.apiKey,
      baseUrl
    );
  };

  /**
   * Generate embeddings
   */
  const embeddings = async (
    input: string | string[],
    model: string = 'text-embedding-3-small'
  ): Promise<ProviderResult> => {
    return await generateEmbeddings(input, model, config.apiKey, baseUrl);
  };

  /**
   * List models
   */
  const getModels = async () => {
    return await listModels(config.apiKey, baseUrl);
  };

  /**
   * Get user info
   */
  const getUserInfo = async () => {
    return await getUser(config.apiKey, baseUrl);
  };

  return {
    id: 'provider-openai',
    name: 'OpenAI Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'openai',
    supportedTypes: ['text', 'image', 'audio'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        chat,
        vision,
        textToSpeech,
        embeddings,
        getModels,
        getUserInfo,
      } as any);
    },
  };
};
