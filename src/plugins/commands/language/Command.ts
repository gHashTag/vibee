import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { LanguageContext } from './types';
import { handleLanguageCommand } from './handler';
import { logger } from '@elizaos/core';

class LanguageService extends Service {
  static serviceType = 'language-command';
  constructor(runtime: IAgentRuntime) { super(runtime); }
  static async start(runtime: IAgentRuntime): Promise<LanguageService> {
    const service = new LanguageService(runtime);
    await service.initialize(runtime);
    return service;
  }
  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🌐 LanguageService initializing...');
    runtime.on('TELEGRAM_COMMAND_LANGUAGE', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      if (!chatId) return;
      await handleLanguageCommand(runtime, message, { chatId, userId: message.content?.userId || 'unknown' });
    });
    logger.info('✅ LanguageService initialized');
  }
}

export function createLanguageCommand(): Plugin {
  return {
    name: 'language-command',
    description: 'Переключение языка интерфейса',
    version: '1.0.0',
    services: [LanguageService],
    actions: []
  };
}
