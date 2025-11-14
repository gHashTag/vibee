import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { SubscriptionContext, SubscriptionResult, Subscription } from './types';
import { logger } from '@elizaos/core';

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  return {
    userId,
    planId: 'pro',
    planName: 'Профессиональный',
    status: 'active',
    startDate: '2025-10-13T00:00:00Z',
    endDate: '2025-12-13T00:00:00Z',
    autoRenew: true,
    remainingDays: 30,
    features: ['Все функции', 'Приоритетная поддержка', 'API доступ', 'Неограниченные запросы']
  };
}

export async function handleSubscriptionCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: SubscriptionContext
): Promise<SubscriptionResult> {
  try {
    logger.info('📋 Handling subscription command');
    const subscription = await getUserSubscription(context.userId);

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) throw new Error('Telegram service not available');

    if (!subscription) {
      await telegramService.bot.telegram.sendMessage(
        context.chatId,
        '❌ **У вас нет активной подписки**\n\nДля полного доступа к функциям бота необходимо оформить подписку.',
        { parse_mode: 'Markdown' }
      );
      return { success: true, data: null };
    }

    const statusIcon = subscription.status === 'active' ? '✅' : '❌';

    const subText = `${statusIcon} **Статус подписки**

**План:** ${subscription.planName}
**Статус:** ${subscription.status === 'active' ? 'Активна' : 'Неактивна'}
**Осталось дней:** ${subscription.remainingDays}
**Автопродление:** ${subscription.autoRenew ? '✅ Включено' : '❌ Отключено'}
**Действует до:** ${new Date(subscription.endDate).toLocaleDateString('ru-RU')}

**Доступные функции:**
${subscription.features.map(f => `✅ ${f}`).join('\n')}`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '💰 Продлить', callback_data: 'subscription_renew' },
          { text: '⚙️ Настройки', callback_data: 'subscription_settings' }
        ],
        [
          { text: '📊 Детали', callback_data: 'subscription_details' },
          { text: '🆘 Поддержка', callback_data: 'subscription_support' }
        ],
        [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, subText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: subscription };
  } catch (error) {
    logger.error('❌ Subscription failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
