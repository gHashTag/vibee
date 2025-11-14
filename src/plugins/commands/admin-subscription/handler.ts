/**
 * Admin Subscription Command Handler
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { SubscriptionPlan, UserSubscription, SubscriptionStats, AdminSubContext, AdminSubResult } from './types';
import { logger } from '@elizaos/core';

const mockPlans: SubscriptionPlan[] = [
  { id: 'basic', name: 'Базовый', price: 299, duration: 30, features: ['Основные функции', 'Поддержка'], active: true },
  { id: 'pro', name: 'Профессиональный', price: 999, duration: 30, features: ['Все функции', 'Приоритетная поддержка', 'API доступ'], active: true },
  { id: 'enterprise', name: 'Корпоративный', price: 4999, duration: 30, features: ['Все функции', 'Персональный менеджер', 'Кастомизация'], active: true }
];

export async function getSubscriptionsList(): Promise<UserSubscription[]> {
  return [
    { userId: '123', userName: 'Алексей', planId: 'pro', status: 'active', startDate: '2025-10-13', endDate: '2025-12-13', autoRenew: true },
    { userId: '456', userName: 'Мария', planId: 'basic', status: 'active', startDate: '2025-11-01', endDate: '2025-12-01', autoRenew: false },
    { userId: '789', userName: 'Дмитрий', planId: 'pro', status: 'expired', startDate: '2025-09-13', endDate: '2025-11-13', autoRenew: false }
  ];
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  return {
    totalUsers: 156,
    activeSubscriptions: 123,
    expiredSubscriptions: 33,
    revenue: 123456,
    plans: { basic: 45, pro: 67, enterprise: 11 }
  };
}

export async function handleAdminSubCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: AdminSubContext
): Promise<AdminSubResult> {
  try {
    logger.info('💳 Handling admin subscription command');

    const stats = await getSubscriptionStats();

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      throw new Error('Telegram service not available');
    }

    const adminText = `💳 **Управление подписками**

📊 **Статистика:**
• Всего пользователей: ${stats.totalUsers}
• Активных: ${stats.activeSubscriptions}
• Истекших: ${stats.expiredSubscriptions}
• Доход: ${stats.revenue.toLocaleString()} ₽

📦 **Планы:**
• Базовый: ${stats.plans.basic} пользователей
• Профессиональный: ${stats.plans.pro} пользователей
• Корпоративный: ${stats.plans.enterprise} пользователей

💡 **Быстрые действия:**`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '📋 Список', callback_data: 'admin_sub_list' },
          { text: '➕ Создать', callback_data: 'admin_sub_create' }
        ],
        [
          { text: '💰 Доходы', callback_data: 'admin_sub_revenue' },
          { text: '⚙️ Планы', callback_data: 'admin_sub_plans' }
        ],
        [
          { text: '📊 Отчет', callback_data: 'admin_sub_report' },
          { text: '🔙 Назад', callback_data: 'back_to_menu' }
        ]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, adminText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: stats };
  } catch (error) {
    logger.error('❌ Admin subscription failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function handleSubList(
  runtime: IAgentRuntime,
  chatId: string
): Promise<void> {
  try {
    const subs = await getSubscriptionsList();

    const listText = `📋 **Список подписок**

${subs.map(sub => {
  const statusIcon = sub.status === 'active' ? '✅' : sub.status === 'expired' ? '❌' : '⏳';
  const planName = mockPlans.find(p => p.id === sub.planId)?.name || sub.planId;
  return `${statusIcon} **${sub.userName}**\n   План: ${planName}\n   До: ${new Date(sub.endDate).toLocaleDateString('ru-RU')}\n   Автопродление: ${sub.autoRenew ? '✅' : '❌'}\n`;
}).join('\n')}`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '➕ Добавить', callback_data: 'admin_sub_add_user' },
          { text: '🔄 Обновить', callback_data: 'admin_sub_refresh' }
        ],
        [
          { text: '🔙 Назад', callback_data: 'admin_sub_back' }
        ]
      ]
    };

    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      await telegramService.bot.telegram.sendMessage(chatId, listText, {
        parse_mode: 'Markdown',
        reply_markup: buttons
      });
    }
  } catch (error) {
    logger.error('❌ Sub list failed:', error);
  }
}
