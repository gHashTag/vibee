import { Service, logger, type IAgentRuntime } from '@elizaos/core';

/**
 * Service that handles /start command using TELEGRAM_SLASH_START event
 */
class TelegramStartService extends Service {
  static serviceType = 'telegram-start-handler';

  static async start(runtime: IAgentRuntime): Promise<TelegramStartService> {
    const service = new TelegramStartService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🎯 TelegramStartService initializing - listening for TELEGRAM_SLASH_START');

    // Listen for /start command event (emitted by TelegramService)
    runtime.on('TELEGRAM_SLASH_START', async (data: any) => {
      logger.info('🚀 /start command received!');

      const ctx = data.ctx;
      if (!ctx) {
        logger.error('❌ No ctx in TELEGRAM_SLASH_START event');
        return;
      }

      const userName = ctx.from?.first_name || ctx.from?.username || 'друг';

      const welcomeText = `👋 Привет, ${userName}!

Я **Vibee** - твой AI-наставник по vibe-coding и современной разработке!

🚀 **Что я умею:**
• Обучать современным технологиям
• Показывать примеры кода
• Помогать с ошибками
• Делиться best practices
• Рекомендовать инструменты

💡 **Как со мной работать:**
Просто пиши свои вопросы, и я буду отвечать с интерактивными кнопками для удобства!

Попробуй команды:
/menu - главное меню
/help - помощь`;

      try {
        // Show typing indicator
        await ctx.sendChatAction('typing');

        // Send welcome message
        await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
        logger.info('✅ Sent /start response');
      } catch (error) {
        logger.error('❌ Failed to send /start:', error);
      }
    });

    logger.info('✅ Listening for /start events');
  }
}

export default {
  name: 'telegram-start-handler',
  description: 'Handles /start command for Telegram bot',
  services: [TelegramStartService],
};
