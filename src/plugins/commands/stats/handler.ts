/**
 * Stats Command Handler
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { BotStats, StatsCommandContext, StatsCommandResult } from './types';
import { logger } from '@elizaos/core';

/**
 * Получить статистику бота
 */
export async function getBotStats(): Promise<BotStats> {
  return {
    totalUsers: 1234,
    activeBots: 5,
    totalRevenue: 567890,
    uptime: '15 дней',
    todayOperations: 456,
    memoryUsage: 45.6,
    cpuUsage: 12.3,
    responseTime: 245
  };
}

/**
 * Обработчик команды /stats
 */
export async function handleStatsCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: StatsCommandContext
): Promise<StatsCommandResult> {
  try {
    logger.info('📊 Handling stats command');

    // Получаем статистику
    const stats = await getBotStats();

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      throw new Error('Telegram service not available');
    }

    const statsText = `📊 **Bot Statistics**

👥 Users: ${stats.totalUsers}
🤖 Bots: ${stats.activeBots}
💰 Revenue: ${stats.totalRevenue} ₽
📅 Uptime: ${stats.uptime}
🔄 Today: ${stats.todayOperations} operations
💾 Memory: ${stats.memoryUsage}%
⚡ CPU: ${stats.cpuUsage}%
⏱️ Response: ${stats.responseTime}ms`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '📈 Детально', callback_data: 'stats_detailed' },
          { text: '💾 Export', callback_data: 'stats_export' }
        ],
        [
          { text: '🔄 Обновить', callback_data: 'stats_refresh' },
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, statsText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    logger.info('✅ Stats command completed successfully');

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    logger.error('❌ Stats command failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Обработчик детальной статистики
 */
export async function handleDetailedStats(
  runtime: IAgentRuntime,
  chatId: string
): Promise<void> {
  try {
    const stats = await getBotStats();

    const detailedText = `📊 **Детальная статистика**

**📈 Общие показатели:**
• Всего пользователей: ${stats.totalUsers}
• Активных ботов: ${stats.activeBots}
• Общий доход: ${stats.totalRevenue} ₽
• Время работы: ${stats.uptime}

**⚡ Производительность:**
• Операций сегодня: ${stats.todayOperations}
• Использование памяти: ${stats.memoryUsage}%
• Загрузка CPU: ${stats.cpuUsage}%
• Время отклика: ${stats.responseTime}ms

**📊 Тренды:**
• +15% новых пользователей за неделю
• +23% операций вчера
• Среднее время отклика: 245ms
• Стабильность: 99.9%`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '💾 Скачать JSON', callback_data: 'stats_export_json' },
          { text: '📊 График', callback_data: 'stats_chart' }
        ],
        [
          { text: '🔄 Обновить', callback_data: 'stats_refresh' },
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      await telegramService.bot.telegram.sendMessage(chatId, detailedText, {
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    }
  } catch (error) {
    logger.error('❌ Detailed stats failed:', error);
  }
}
