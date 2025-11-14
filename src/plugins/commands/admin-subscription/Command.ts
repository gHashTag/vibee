/**
 * Admin Subscription Command Factory
 */

import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { AdminSubContext } from './types';
import { handleAdminSubCommand, handleSubList } from './handler';
import { logger } from '@elizaos/core';

class AdminSubscriptionService extends Service {
  static serviceType = 'admin-subscription-command';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<AdminSubscriptionService> {
    const service = new AdminSubscriptionService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('💳 AdminSubscriptionService initializing...');

    runtime.on('TELEGRAM_COMMAND_ADMIN_SUB', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';

      if (!chatId) return;

      const context: AdminSubContext = { chatId, userId, isAdmin: true } as any;
      await handleAdminSubCommand(runtime, message, context);
    });

    runtime.on('TELEGRAM_CALLBACK_ADMIN_SUB', async (data: any) => {
      const message = data.memory || data;
      const callbackData = message.content?.callback_data;
      const chatId = message.content?.channelId || message.content?.chatId;

      if (!chatId) return;

      if (callbackData === 'admin_sub_list') {
        await handleSubList(runtime, chatId);
      }
    });

    logger.info('✅ AdminSubscriptionService initialized');
  }
}

export function createAdminSubscriptionCommand(): Plugin {
  return {
    name: 'admin-subscription-command',
    description: 'Админ команда для управления подписками пользователей',
    version: '1.0.0',
    services: [AdminSubscriptionService],
    actions: []
  };
}
