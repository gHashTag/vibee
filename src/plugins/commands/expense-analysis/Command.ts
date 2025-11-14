/**
 * Expense Analysis Command Factory
 */

import { Plugin, Service } from '@elizaos/core';
import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { ExpenseContext } from './types';
import { handleExpenseCommand, handleExpenseSuggestions } from './handler';
import { logger } from '@elizaos/core';

/**
 * Expense Analysis Service
 */
class ExpenseAnalysisService extends Service {
  static serviceType = 'expense-analysis-command';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<ExpenseAnalysisService> {
    const service = new ExpenseAnalysisService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('💰 ExpenseAnalysisService initializing...');

    runtime.on('TELEGRAM_COMMAND_EXPENSES', async (data: any) => {
      const message = data.memory || data;
      const chatId = message.content?.channelId || message.content?.chatId;
      const userId = message.content?.userId || 'unknown';
      const text = (message.content?.text || '').toLowerCase();

      if (!chatId) return;

      // Определяем период из команды
      let period: 'week' | 'month' | 'year' = 'month';
      if (text.includes('week') || text.includes('неделя')) {
        period = 'week';
      } else if (text.includes('year') || text.includes('год')) {
        period = 'year';
      }

      const context: ExpenseContext = {
        chatId,
        userId,
        period
      };

      await handleExpenseCommand(runtime, message, context);
    });

    runtime.on('TELEGRAM_CALLBACK_EXPENSES', async (data: any) => {
      const message = data.memory || data;
      const callbackData = message.content?.callback_data;
      const chatId = message.content?.channelId || message.content?.chatId;

      if (!chatId) return;

      if (callbackData === 'expenses_suggestions') {
        await handleExpenseSuggestions(runtime, chatId);
      }
    });

    logger.info('✅ ExpenseAnalysisService initialized');
  }
}

/**
 * Создание Expense Analysis Command Plugin
 */
export function createExpenseAnalysisCommand(): Plugin {
  return {
    name: 'expense-analysis-command',
    description: 'Команда для анализа расходов и бюджета',
    version: '1.0.0',
    services: [ExpenseAnalysisService],
    actions: []
  };
}
