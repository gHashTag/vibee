/**
 * Stats Command Factory
 */

import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { StatsCommandContext } from './types';
import { handleStatsCommand, handleDetailedStats } from './handler';
import { logger } from '@elizaos/core';

/**
 * Stats Service для обработки статистики
 */
class StatsService extends Service {
  static serviceType = 'stats-command';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<StatsService> {
    const service = new StatsService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('📊 StatsService initializing...');

    // Слушаем события команды stats
    runtime.on('TELEGRAM_COMMAND_STATS', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';

      if (!chatId) return;

      const context: StatsCommandContext = {
        chatId,
        userId,
        isAdmin: true // Проверка админа в реальном приложении
      };

      await handleStatsCommand(runtime, message, context);
    });

    // Слушаем callback от кнопок статистики
    runtime.on('TELEGRAM_CALLBACK_STATS', async (data: any) => {
      const message = data.memory || data;
      const callbackData = message.content?.callback_data;
      const chatId = message.content?.channelId || message.content?.chatId;

      if (!chatId) return;

      if (callbackData === 'stats_detailed') {
        await handleDetailedStats(runtime, chatId);
      }
      // Другие callbacks...
    });

    logger.info('✅ StatsService initialized');
  }
}

/**
 * Создание Stats Command Plugin
 */
export function createStatsCommand(): Plugin {
  return {
    name: 'stats-command',
    description: 'Команда для отображения статистики бота',
    version: '1.0.0',
    services: [StatsService],
    actions: []
  };
}
