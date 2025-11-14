import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime } from '@elizaos/core';
import type { SubscriptionContext } from './types';
import { handleSubscriptionCommand } from './handler';
import { logger } from '@elizaos/core';

class SubscriptionStatusService extends Service {
  static serviceType = 'subscription-status-command';
  constructor(runtime: IAgentRuntime) { super(runtime); }
  static async start(runtime: IAgentRuntime): Promise<SubscriptionStatusService> {
    const service = new SubscriptionStatusService(runtime);
    await service.initialize(runtime);
    return service;
  }
  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('📋 SubscriptionStatusService initializing...');
    runtime.on('TELEGRAM_COMMAND_SUBSCRIPTION', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      if (!chatId) return;
      await handleSubscriptionCommand(runtime, message, { chatId, userId: message.content?.userId || 'unknown', userName: message.content?.userName || 'User' });
    });
    logger.info('✅ SubscriptionStatusService initialized');
  }
}

export function createSubscriptionStatusCommand(): Plugin {
  return {
    name: 'subscription-status-command',
    description: 'Просмотр статуса подписки пользователя',
    version: '1.0.0',
    services: [SubscriptionStatusService],
    actions: []
  };
}
