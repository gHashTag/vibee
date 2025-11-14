/**
 * Balance Command Handler
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { UserBalance, Transaction, BalanceContext, BalanceResult } from './types';
import { logger } from '@elizaos/core';

export async function getUserBalance(userId: string): Promise<UserBalance> {
  return {
    userId,
    balance: 15430.50,
    currency: 'RUB',
    lastTransaction: '2025-11-13T15:30:00Z',
    frozen: false
  };
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  return [
    { id: '1', type: 'credit', amount: 5000, description: 'Пополнение баланса', date: '2025-11-13T10:00:00Z', balanceAfter: 15430.50 },
    { id: '2', type: 'debit', amount: 299, description: 'Подписка Pro', date: '2025-11-12T14:30:00Z', balanceAfter: 10430.50 },
    { id: '3', type: 'debit', amount: 1500, description: 'API запросы', date: '2025-11-11T09:15:00Z', balanceAfter: 10729.50 }
  ];
}

export async function handleBalanceCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: BalanceContext
): Promise<BalanceResult> {
  try {
    logger.info('💰 Handling balance command');

    const balance = await getUserBalance(context.userId);
    const transactions = await getTransactions(context.userId);

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      throw new Error('Telegram service not available');
    }

    const balanceText = `💰 **Ваш баланс**

**Текущий баланс:** ${balance.balance.toLocaleString('ru-RU')} ₽

**Последние операции:**
${transactions.slice(0, 3).map(t => {
  const icon = t.type === 'credit' ? '➕' : '➖';
  return `${icon} ${t.description}\n   ${t.type === 'credit' ? '+' : '-'}${t.amount.toLocaleString('ru-RU')} ₽ • ${new Date(t.date).toLocaleDateString('ru-RU')}`;
}).join('\n\n')}`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '💳 Пополнить', callback_data: 'balance_recharge' },
          { text: '📊 История', callback_data: 'balance_history' }
        ],
        [
          { text: '💸 Списания', callback_data: 'balance_debits' },
          { text: '🎁 Бонусы', callback_data: 'balance_bonuses' }
        ],
        [
          { text: '🔄 Обновить', callback_data: 'balance_refresh' },
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, balanceText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: balance };
  } catch (error) {
    logger.error('❌ Balance command failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function handleAddBalance(
  runtime: IAgentRuntime,
  message: Memory,
  context: BalanceContext
): Promise<BalanceResult> {
  try {
    logger.info('💳 Handling add balance command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) {
      throw new Error('Telegram service not available');
    }

    const addText = `💳 **Пополнение баланса**

Введите сумму для пополнения:`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '500 ₽', callback_data: 'balance_add_500' },
          { text: '1000 ₽', callback_data: 'balance_add_1000' },
          { text: '2000 ₽', callback_data: 'balance_add_2000' }
        ],
        [
          { text: '5000 ₽', callback_data: 'balance_add_5000' },
          { text: 'Другая сумма', callback_data: 'balance_add_custom' }
        ],
        [
          { text: '🔙 Отмена', callback_data: 'balance_back' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, addText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true };
  } catch (error) {
    logger.error('❌ Add balance failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
