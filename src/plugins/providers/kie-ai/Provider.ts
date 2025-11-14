/**
 * Kie.ai Provider Factory
 * Factory for creating Kie.ai provider instances with fail-over support
 */

import type {
  ProviderPlugin,
  ProviderConfig,
  PluginHealthStatus,
  ProviderGenerationParams,
  ProviderResult,
  PluginRegistry,
} from '../base/types';
import type { KieAIConfig } from './types';
import { generateContent, checkJobStatus } from './generate';
import { checkKieAIHealth } from './healthCheck';

export const createKieAIProvider = (
  config: ProviderConfig & { kieConfig?: KieAIConfig },
  logger?: (context: any) => void
): ProviderPlugin => {
  const baseUrl = config.baseUrl || 'https://api.kie.ai';
  const kieConfig = config.kieConfig || {};
  const projectId = kieConfig.projectId;
  const webhookUrl = kieConfig.webhookUrl;

  /**
   * Main generate function
   */
  const generate = async (params: ProviderGenerationParams): Promise<ProviderResult> => {
    // For async operations (video generation), we may need to poll
    // For now, handle simple cases directly

    const result = await generateContent(
      {
        prompt: params.prompt,
        contentType: (params as any).contentType || 'video',
        duration: (params as any).duration,
        aspectRatio: (params as any).aspectRatio,
        quality: (params as any).quality,
        voiceId: (params as any).voiceId,
        style: (params as any).style,
        loraPath: (params as any).loraPath,
      },
      config.apiKey,
      baseUrl
    );

    // Handle async jobs
    if (result.success && result.metadata?.jobId) {
      // In a real implementation, you might return immediately and let the caller poll
      // Or you could implement polling here
      return result;
    }

    return result;
  };

  /**
   * Health check
   */
  const healthCheck = async (): Promise<PluginHealthStatus> => {
    return await checkKieAIHealth(config.apiKey, baseUrl, projectId);
  };

  /**
   * Get status of async job
   */
  const getJobStatus = async (jobId: string, contentType: 'video' | 'audio'): Promise<ProviderResult> => {
    return await checkJobStatus(jobId, contentType, config.apiKey, baseUrl);
  };

  return {
    id: 'provider-kie-ai',
    name: 'Kie.ai Provider',
    version: '1.0.0',
    type: 'provider',
    providerName: 'kie',
    supportedTypes: ['video', 'audio'],
    generate,
    healthCheck,
    register: (registry: PluginRegistry) => {
      registry.registerProvider({
        ...this,
        getJobStatus, // Extended functionality
      } as any);
    },
  };
};

/**
 * Factory with fail-over chain
 */
export const createKieAIProviderWithFailover = (
  primaryConfig: ProviderConfig & { kieConfig?: KieAIConfig },
  fallbackProviders: Array<{
    name: string;
    generate: (params: ProviderGenerationParams) => Promise<ProviderResult>;
  }>,
  logger?: (context: any) => void
): ProviderPlugin => {
  const primary = createKieAIProvider(primaryConfig, logger);

  return {
    ...primary,
    generate: async (params: ProviderGenerationParams): Promise<ProviderResult> => {
      // Try primary provider
      try {
        const result = await primary.generate(params);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger?.({
          level: 'warn',
          message: `Primary provider failed, trying fallbacks`,
          data: { error: error instanceof Error ? error.message : String(error) },
        });
      }

      // Try fallback providers
      for (const fallback of fallbackProviders) {
        try {
          const result = await fallback.generate(params);
          if (result.success) {
            logger?.({
              level: 'info',
              message: `Successfully used fallback provider: ${fallback.name}`,
            });
            return result;
          }
        } catch (error) {
          logger?.({
            level: 'warn',
            message: `Fallback provider ${fallback.name} failed`,
            data: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      }

      return {
        success: false,
        error: 'All providers (primary and fallbacks) failed',
      };
    },
  };
};
