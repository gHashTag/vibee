/**
 * Balance Command Factory
 */

import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { BalanceContext } from './types';
import { handleBalanceCommand, handleAddBalance } from './handler';
import { logger } from '@elizaos/core';

class BalanceService extends Service {
  static serviceType = 'balance-command';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<BalanceService> {
    const service = new BalanceService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('💰 BalanceService initializing...');

    runtime.on('TELEGRAM_COMMAND_BALANCE', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';

      if (!chatId) return;

      const context: BalanceContext = { chatId, userId };
      await handleBalanceCommand(runtime, message, context);
    });

    runtime.on('TELEGRAM_COMMAND_ADD_BALANCE', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';

      if (!chatId) return;

      const context: BalanceContext = { chatId, userId };
      await handleAddBalance(runtime, message, context);
    });

    logger.info('✅ BalanceService initialized');
  }
}

export function createBalanceCommand(): Plugin {
  return {
    name: 'balance-command',
    description: 'Команды баланса: просмотр, пополнение, история операций',
    version: '1.0.0',
    services: [BalanceService],
    actions: []
  };
}
