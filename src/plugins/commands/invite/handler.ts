import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { InviteContext, InviteResult, InviteLink, InviteStats } from './types';
import { logger } from '@elizaos/core';

export async function createInviteLink(context: InviteContext): Promise<InviteLink> {
  return {
    id: '1',
    code: 'INVITE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    creatorId: context.userId,
    creatorName: context.userName,
    uses: 0,
    maxUses: 10,
    rewards: { inviterBonus: 500, inviteeBonus: 200 },
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export async function getInviteStats(userId: string): Promise<InviteStats> {
  return {
    totalInvites: 15,
    successfulInvites: 12,
    pendingInvites: 3,
    totalRewards: 6000
  };
}

export async function handleInviteCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: InviteContext
): Promise<InviteResult> {
  try {
    logger.info('👥 Handling invite command');
    const stats = await getInviteStats(context.userId);

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) throw new Error('Telegram service not available');

    const inviteText = `👥 **Реферальная программа**

**Ваша статистика:**
• Всего приглашено: ${stats.totalInvites}
• Успешно: ${stats.successfulInvites}
• В ожидании: ${stats.pendingInvites}
• Заработано: ${stats.totalRewards} ₽

**Награды:**
• За приглашенного: +500 ₽ вам
• Приглашенному: +200 ₽ бонус`;

    const buttons = {
      inline_keyboard: [
        [{ text: '🔗 Получить ссылку', callback_data: 'invite_get_link' }],
        [{ text: '📊 Подробная статистика', callback_data: 'invite_detailed_stats' }],
        [{ text: '🎁 Мои награды', callback_data: 'invite_rewards' }],
        [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, inviteText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: stats };
  } catch (error) {
    logger.error('❌ Invite failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
