import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { LanguageContext, LanguageResult, Language } from './types';
import { logger } from '@elizaos/core';

export async function getAvailableLanguages(): Promise<Language[]> {
  return [
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', available: true },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', available: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', available: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', available: false }
  ];
}

export async function handleLanguageCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: LanguageContext
): Promise<LanguageResult> {
  try {
    logger.info('🌐 Handling language command');
    const languages = await getAvailableLanguages();

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) throw new Error('Telegram service not available');

    const langText = `🌐 **Выбор языка / Language**

Текущий язык: 🇷🇺 Русский

Доступные языки:
${languages.filter(l => l.available).map(l => `• ${l.flag} ${l.nativeName}`).join('\n')}

Скоро появятся:
• 🇪🇸 Español
• 🇫🇷 Français
• 🇩🇪 Deutsch`;

    const buttons = {
      inline_keyboard: [
        [
          { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
          { text: '🇺🇸 English', callback_data: 'lang_en' }
        ],
        [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, langText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: languages };
  } catch (error) {
    logger.error('❌ Language failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
