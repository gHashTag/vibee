/**
 * Manage Providers Action
 * Commands for managing image generation providers
 */

import type { Action, ActionResult, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { ImageGenerationService } from '../services/ImageGenerationService';

/**
 * Provider Management Action
 *
 * Commands:
 * - /provider list - List all providers
 * - /provider use <id> - Set active provider
 * - /provider models <id> - List models for provider
 * - /provider status - Show provider statuses
 */
export const manageProvidersAction: Action = {
  name: 'MANAGE_PROVIDERS',
  similes: ['PROVIDER_MANAGEMENT', 'LIST_PROVIDERS', 'SWITCH_PROVIDER'],
  description: `Manage image generation providers.

Commands:
- /provider list - Show all available providers
- /provider use <name> - Set active provider
- /provider models <name> - Show models for a provider
- /provider status - Show provider health status`,

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();
    if (!text) return false;

    return text.includes('/provider') || text.includes('provider list') || text.includes('list providers');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const text = message.content?.text || '';
      const imageService = runtime.getService<ImageGenerationService>('image-generation' as any);

      if (!imageService) {
        await callback({
          text: 'Image generation service not available',
        });
        return { success: false, error: new Error('Service not found') };
      }

      const registry = imageService.getRegistry();

      // Parse command
      if (text.includes('/provider list') || text.includes('list providers')) {
        // List all providers
        const providers = registry.listProviders();

        if (providers.length === 0) {
          await callback({
            text: 'No providers configured. Please set up API keys in your environment.',
          });
          return { success: true };
        }

        const activeProvider = imageService.getActiveProvider();
        const activeId = activeProvider?.type || null;

        let response = '**Available Image Generation Providers**\n\n';

        for (const provider of providers) {
          const isActive = provider.type === activeId;
          const statusEmoji =
            provider.status === 'active' ? '✅' : provider.status === 'error' ? '❌' : '⏸️';

          response += `${statusEmoji} **${provider.name}** ${isActive ? '(Active)' : ''}\n`;
          response += `├ Type: \`${provider.type}\`\n`;
          response += `├ Status: ${provider.status}\n`;
          response += `├ Priority: ${provider.priority}\n`;

          const caps = provider.capabilities;
          response += `├ Capabilities:\n`;
          response += `│  ├ LoRA: ${caps.loraSupport ? '✓' : '✗'}\n`;
          response += `│  ├ Training: ${caps.loraTraining ? '✓' : '✗'}\n`;
          response += `│  ├ Models: ${caps.availableModels.length}\n`;
          response += `│  └ Avg time: ${caps.averageGenerationTime}s\n`;
          response += `└ Cost: $${caps.pricing.generation} per image\n\n`;
        }

        response += '\n**Commands**:\n';
        response += '• `/provider use <type>` - Set active provider\n';
        response += '• `/provider models <type>` - List models\n';
        response += '• `/provider status` - Check health';

        await callback({ text: response });
        return { success: true };
      } else if (text.includes('/provider use')) {
        // Set active provider
        const match = text.match(/\/provider\s+use\s+(\w+)/i);
        if (!match) {
          await callback({
            text: 'Usage: `/provider use <type>`\nAvailable types: fal, replicate, stability, openai',
          });
          return { success: false };
        }

        const providerType = match[1].toLowerCase();
        const providers = registry.listProviders();
        const provider = providers.find((p) => p.type === providerType);

        if (!provider) {
          await callback({
            text: `Provider "${providerType}" not found.\nAvailable: ${providers.map((p) => p.type).join(', ')}`,
          });
          return { success: false };
        }

        try {
          registry.setActiveProvider(provider.id);

          await callback({
            text: `✅ Active provider set to **${provider.name}**\n\nCapabilities:\n- LoRA: ${provider.capabilities.loraSupport ? '✓' : '✗'}\n- Training: ${provider.capabilities.loraTraining ? '✓' : '✗'}\n- Cost: $${provider.capabilities.pricing.generation}/image`,
          });
          return { success: true };
        } catch (error) {
          await callback({
            text: `Failed to set active provider: ${error instanceof Error ? error.message : String(error)}`,
          });
          return { success: false, error: error as Error };
        }
      } else if (text.includes('/provider models')) {
        // List models for provider
        const match = text.match(/\/provider\s+models\s+(\w+)/i);
        if (!match) {
          await callback({
            text: 'Usage: `/provider models <type>`',
          });
          return { success: false };
        }

        const providerType = match[1].toLowerCase();
        const providers = registry.listProviders();
        const providerInfo = providers.find((p) => p.type === providerType);

        if (!providerInfo) {
          await callback({
            text: `Provider "${providerType}" not found`,
          });
          return { success: false };
        }

        const provider = registry.getProvider(providerInfo.id);
        if (!provider) {
          await callback({
            text: 'Provider not available',
          });
          return { success: false };
        }

        const models = await provider.listModels();

        let response = `**${providerInfo.name} - Available Models**\n\n`;

        for (const model of models) {
          response += `**${model.name}** (\`${model.id}\`)\n`;
          response += `${model.description}\n`;
          response += `├ Type: ${model.type}\n`;
          response += `├ LoRA: ${model.supportsLora ? '✓' : '✗'}\n`;
          response += `├ Avg time: ${model.averageGenerationTime}s\n`;
          response += `└ Cost: $${model.costPerGeneration}\n\n`;
        }

        await callback({ text: response });
        return { success: true };
      } else if (text.includes('/provider status')) {
        // Show provider health status
        const providers = registry.listProviders();

        let response = '**Provider Health Status**\n\n';

        for (const provider of providers) {
          const statusEmoji =
            provider.status === 'active'
              ? '✅'
              : provider.status === 'error'
                ? '❌'
                : provider.status === 'rate_limited'
                  ? '⏱️'
                  : '⏸️';

          response += `${statusEmoji} **${provider.name}**: ${provider.status}\n`;
        }

        await callback({ text: response });
        return { success: true };
      }

      // Default help message
      await callback({
        text: `**Provider Management**

Commands:
• \`/provider list\` - Show all providers
• \`/provider use <type>\` - Set active provider
• \`/provider models <type>\` - List models
• \`/provider status\` - Check health

Available types: fal, replicate, stability, openai`,
      });

      return { success: true };
    } catch (error) {
      await callback({
        text: `Error managing providers: ${error instanceof Error ? error.message : String(error)}`,
      });
      return { success: false, error: error as Error };
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: '/provider list' },
      },
      {
        name: 'assistant',
        content: {
          text: '✅ Available providers: Fal.ai (Active), Replicate, OpenAI',
          actions: ['MANAGE_PROVIDERS'],
        },
      },
    ],
  ],
};
