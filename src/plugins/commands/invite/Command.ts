import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { InviteContext } from './types';
import { handleInviteCommand } from './handler';
import { logger } from '@elizaos/core';

class InviteService extends Service {
  static serviceType = 'invite-command';
  constructor(runtime: IAgentRuntime) { super(runtime); }
  static async start(runtime: IAgentRuntime): Promise<InviteService> {
    const service = new InviteService(runtime);
    await service.initialize(runtime);
    return service;
  }
  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('👥 InviteService initializing...');
    runtime.on('TELEGRAM_COMMAND_INVITE', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      if (!chatId) return;
      await handleInviteCommand(runtime, message, { chatId, userId: message.content?.userId || 'unknown', userName: message.content?.userName || 'User' });
    });
    logger.info('✅ InviteService initialized');
  }
}

export function createInviteCommand(): Plugin {
  return {
    name: 'invite-command',
    description: 'Реферальная программа и приглашения',
    version: '1.0.0',
    services: [InviteService],
    actions: []
  };
}
