import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { HelpContext, HelpResult, HelpSection } from './types';
import { logger } from '@elizaos/core';

export async function getHelpSections(): Promise<HelpSection[]> {
  return [
    { id: 'basic', title: 'Основы', description: 'Базовые команды для начала работы', commands: ['/start', '/menu', '/help'], category: 'Основы' },
    { id: 'balance', title: 'Баланс', description: 'Управление балансом и платежами', commands: ['/balance', '/add-balance'], category: 'Финансы' },
    { id: 'subscriptions', title: 'Подписки', description: 'Управление подписками', commands: ['/subscription', '/admin sub'], category: 'Финансы' },
    { id: 'analytics', title: 'Аналитика', description: 'Статистика и анализ', commands: ['/stats', '/expenses', '/monitor'], category: 'Аналитика' }
  ];
}

export async function handleHelpCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: HelpContext
): Promise<HelpResult> {
  try {
    logger.info('❓ Handling help command');
    const sections = await getHelpSections();

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) throw new Error('Telegram service not available');

    const helpText = `❓ **Помощь и документация**

**Доступные команды:**
• /start - Начать работу
• /menu - Главное меню
• /help - Эта справка
• /balance - Баланс и платежи
• /stats - Статистика бота
• /expenses - Анализ расходов
• /subscription - Статус подписки

**Категории:**
${sections.map(s => `• ${s.category}: ${s.title}`).join('\n')}

**Как использовать:**
Просто введите команду или опишите, что вам нужно!`;

    const buttons = {
      inline_keyboard: sections.map(s => [{ text: s.title, callback_data: `help_${s.id}` }])
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, helpText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: sections };
  } catch (error) {
    logger.error('❌ Help failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
