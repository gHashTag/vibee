import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { HelpContext } from './types';
import { handleHelpCommand } from './handler';
import { logger } from '@elizaos/core';

class HelpService extends Service {
  static serviceType = 'help-command';
  constructor(runtime: IAgentRuntime) { super(runtime); }
  static async start(runtime: IAgentRuntime): Promise<HelpService> {
    const service = new HelpService(runtime);
    await service.initialize(runtime);
    return service;
  }
  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('❓ HelpService initializing...');
    runtime.on('TELEGRAM_COMMAND_HELP', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      if (!chatId) return;
      await handleHelpCommand(runtime, message, { chatId, userId: message.content?.userId || 'unknown' });
    });
    logger.info('✅ HelpService initialized');
  }
}

export function createHelpCommand(): Plugin {
  return {
    name: 'help-command',
    description: 'Команда помощи и документации',
    version: '1.0.0',
    services: [HelpService],
    actions: []
  };
}
