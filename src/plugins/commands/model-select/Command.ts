import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { ModelContext } from './types';
import { handleModelCommand } from './handler';
import { logger } from '@elizaos/core';

class ModelSelectService extends Service {
  static serviceType = 'model-select-command';
  constructor(runtime: IAgentRuntime) { super(runtime); }
  static async start(runtime: IAgentRuntime): Promise<ModelSelectService> {
    const service = new ModelSelectService(runtime);
    await service.initialize(runtime);
    return service;
  }
  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🤖 ModelSelectService initializing...');
    runtime.on('TELEGRAM_COMMAND_MODEL', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      if (!chatId) return;
      await handleModelCommand(runtime, message, { chatId, userId: message.content?.userId || 'unknown' });
    });
    logger.info('✅ ModelSelectService initialized');
  }
}

export function createModelSelectCommand(): Plugin {
  return {
    name: 'model-select-command',
    description: 'Выбор AI-модели для работы',
    version: '1.0.0',
    services: [ModelSelectService],
    actions: []
  };
}
