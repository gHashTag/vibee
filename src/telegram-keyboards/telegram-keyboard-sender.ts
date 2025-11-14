/**
 * Telegram Keyboard Sender Service
 * Патчит TelegramService для поддержки отправки кнопок
 */

import { Service, logger, type IAgentRuntime } from '@elizaos/core';

export class TelegramKeyboardSenderService extends Service {
  static serviceType = 'telegram-keyboard-sender';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramKeyboardSender] 🔍 Initializing...');

    // Ждём появления TelegramService
    const maxAttempts = 20;
    let telegramService = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService && telegramService.bot) {
        logger.info('[TelegramKeyboardSender] ✅ Found TelegramService with active bot');
        break;
      }
      logger.info(`[TelegramKeyboardSender] Waiting for TelegramService... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!telegramService || !telegramService.bot) {
      logger.warn('[TelegramKeyboardSender] ⚠️ TelegramService not found after waiting');
      return;
    }

    // Регистрируем middleware который перехватывает callback вызовы
    // и добавляет reply_markup если есть keyboard attachment
    telegramService.bot.use(async (ctx: any, next: () => Promise<void>) => {
      const originalReply = ctx.reply.bind(ctx);

      ctx.reply = async function patchedReply(text: string, extra?: any): Promise<any> {
        try {
          // Если extra содержит reply_markup, используем его
          if (extra && extra.reply_markup) {
            logger.info('[TelegramKeyboardSender] 🎹 Using reply_markup from extra');
            return await originalReply(text, extra);
          }

          // Проверяем, есть ли в контексте данные о клавиатуре
          if (ctx.keyboardData) {
            logger.info('[TelegramKeyboardSender] 🎹 Found keyboard data in context');
            return await originalReply(text, {
              ...extra,
              reply_markup: ctx.keyboardData,
            });
          }

          return await originalReply(text, extra);
        } catch (error) {
          logger.error('[TelegramKeyboardSender] ❌ Error in patched reply:', error);
          throw error;
        }
      };

      await next();
    });

    logger.info('[TelegramKeyboardSender] ✅ Patched Telegraf context for keyboard support');
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramKeyboardSenderService> {
    const service = new TelegramKeyboardSenderService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TelegramKeyboardSender] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
