/**
 * Expense Analysis Command Handler
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { Expense, ExpenseAnalysis, ExpenseContext, ExpenseResult } from './types';
import { logger } from '@elizaos/core';

/**
 * Получить анализ расходов
 */
export async function getExpenseAnalysis(
  period: 'week' | 'month' | 'year' = 'month'
): Promise<ExpenseAnalysis> {
  const mockExpenses: Expense[] = [
    { id: '1', amount: 1500, category: 'Питание', date: '2025-11-10', description: 'Ресторан', tags: ['еда'] },
    { id: '2', amount: 2500, category: 'Транспорт', date: '2025-11-09', description: 'Такси', tags: ['дорога'] },
    { id: '3', amount: 5000, category: 'Подписки', date: '2025-11-08', description: 'Netflix', tags: ['развлечения'] },
    { id: '4', amount: 12000, category: 'Покупки', date: '2025-11-07', description: 'Одежда', tags: ['шопинг'] },
    { id: '5', amount: 3000, category: 'Здоровье', date: '2025-11-06', description: 'Аптека', tags: ['медицина'] }
  ];

  const total = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryBreakdown: { [category: string]: number } = {};
  mockExpenses.forEach(exp => {
    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
  });

  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / total) * 100)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    totalAmount: total,
    categoryBreakdown,
    monthlyTotal: total,
    topCategories,
    trends: [
      { period: 'Прошлый месяц', amount: total * 0.85, change: -15 },
      { period: 'Этот месяц', amount: total, change: 0 },
      { period: 'Прогноз', amount: total * 1.1, change: 10 }
    ],
    suggestions: [
      '💡 Сократите траты на рестораны на 20%',
      '📊 Используйте больше общественного транспорта',
      '🎯 Отмените неиспользуемые подписки',
      '💰 Начните вести бюджет'
    ]
  };
}

/**
 * Обработчик команды /expenses
 */
export async function handleExpenseCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: ExpenseContext
): Promise<ExpenseResult> {
  try {
    logger.info('💰 Handling expense analysis command');

    const period = context.period || 'month';
    const analysis = await getExpenseAnalysis(period);

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      throw new Error('Telegram service not available');
    }

    const expensesText = `💰 **Анализ расходов** (${period})

📊 **Общая сумма:** ${analysis.totalAmount.toLocaleString()} ₽

🏆 **Топ категории:**
${analysis.topCategories.map(cat => `• ${cat.category}: ${cat.amount.toLocaleString()} ₽ (${cat.percentage}%)`).join('\n')}

📈 **Динамика:**
• Прошлый месяц: ${analysis.trends[0].amount.toLocaleString()} ₽ (${analysis.trends[0].change > 0 ? '+' : ''}${analysis.trends[0].change}%)
• Этот месяц: ${analysis.trends[1].amount.toLocaleString()} ₽
• Прогноз: ${analysis.trends[2].amount.toLocaleString()} ₽ (${analysis.trends[2].change > 0 ? '+' : ''}${analysis.trends[2].change}%)`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '📊 Детально', callback_data: 'expenses_detailed' },
          { text: '📅 Период', callback_data: 'expenses_period' }
        ],
        [
          { text: '💡 Совет', callback_data: 'expenses_suggestions' },
          { text: '📈 Тренды', callback_data: 'expenses_trends' }
        ],
        [
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, expensesText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    logger.info('✅ Expense analysis completed successfully');

    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    logger.error('❌ Expense analysis failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Обработчик советов по экономии
 */
export async function handleExpenseSuggestions(
  runtime: IAgentRuntime,
  chatId: string
): Promise<void> {
  try {
    const analysis = await getExpenseAnalysis();

    const suggestionsText = `💡 **Советы по экономии**

${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

🎯 **Персональные рекомендации:**
• Ведите бюджет в приложении
• Планируйте крупные покупки заранее
• Сравнивайте цены перед покупкой
• Используйте кэшбек и скидки`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '📊 Сводка', callback_data: 'expenses_back' },
          { text: '💾 Отчет', callback_data: 'expenses_report' }
        ],
        [
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      await telegramService.bot.telegram.sendMessage(chatId, suggestionsText, {
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    }
  } catch (error) {
    logger.error('❌ Expense suggestions failed:', error);
  }
}
