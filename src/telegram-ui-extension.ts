/**
 * Расширение для @elizaos/plugin-telegram
 * Интегрирует Generative UI элементы в существующий Telegram plugin
 */

import { logger } from '@elizaos/core';
import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import type { UIElement, GenerativeUIContent } from './telegram-ui-plugin';

/**
 * Хелпер для отправки сообщений с расширенным UI
 */
export class TelegramUIHelper {
  /**
   * Отправляет сообщение с генеративными UI элементами
   */
  static async sendMessageWithUI(
    ctx: Context,
    content: GenerativeUIContent,
    replyToMessageId?: number
  ): Promise<void> {
    try {
      const text = content.text || '';
      const uiElements = content.ui_elements || [];

      if (uiElements.length === 0) {
        // Нет UI элементов - отправляем обычное сообщение
        await ctx.reply(text, replyToMessageId ? { reply_to_message_id: replyToMessageId } : {});
        return;
      }

      // Конвертируем UI элементы в Telegram markup
      const markup = this.buildTelegramMarkup(uiElements);

      // Отправляем сообщение с markup
      await ctx.reply(text, {
        reply_markup: markup,
        parse_mode: 'Markdown',
        ...(replyToMessageId && { reply_to_message_id: replyToMessageId }),
      });

      logger.info(`✅ Отправлено сообщение с ${uiElements.length} UI элементами`);
    } catch (error) {
      logger.error('❌ Ошибка отправки сообщения с UI:', error);
      // Fallback - отправляем без UI
      await ctx.reply(content.text || 'Ошибка отправки сообщения');
    }
  }

  /**
   * Строит Telegram markup из UI элементов
   */
  private static buildTelegramMarkup(elements: UIElement[]): any {
    const inlineKeyboard: any[] = [];
    let replyKeyboard: any = null;

    for (const element of elements) {
      try {
        switch (element.type) {
          case 'inline_callback':
            inlineKeyboard.push([
              Markup.button.callback(element.text, element.callback_data),
            ]);
            break;

          case 'inline_url':
            inlineKeyboard.push([Markup.button.url(element.text, element.url)]);
            break;

          case 'web_app':
            inlineKeyboard.push([Markup.button.webApp(element.text, element.url)]);
            break;

          case 'reply_keyboard':
            replyKeyboard = Markup.keyboard(element.buttons)
              .resize(element.resize_keyboard ?? true)
              .oneTime(element.one_time_keyboard ?? false)
              .selective(element.selective ?? false);
            break;

          case 'menu':
            // Меню как inline кнопки
            for (const option of element.options) {
              inlineKeyboard.push([
                Markup.button.callback(option.text, option.callback_data),
              ]);
            }
            break;
        }
      } catch (error) {
        logger.error(`❌ Ошибка обработки UI элемента ${element.type}:`, error);
      }
    }

    // Приоритет: сначала inline keyboard, затем reply keyboard
    if (inlineKeyboard.length > 0) {
      return Markup.inlineKeyboard(inlineKeyboard).reply_markup;
    } else if (replyKeyboard) {
      return replyKeyboard.reply_markup;
    }

    return {};
  }

  /**
   * Обрабатывает callback query от inline кнопки
   */
  static async handleCallbackQuery(ctx: Context): Promise<void> {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      logger.info(`📞 Получен callback: ${callbackData}`);

      // Подтверждаем получение callback (убирает "загрузку" на кнопке)
      await ctx.answerCbQuery();

      // Callback будет обработан action'ом HANDLE_TELEGRAM_CALLBACK
      // из telegram-ui-plugin.ts
    } catch (error) {
      logger.error('❌ Ошибка обработки callback query:', error);
      await ctx.answerCbQuery('Произошла ошибка');
    }
  }
}

/**
 * Регистрирует обработчики для расширенного UI
 */
export function setupTelegramUIHandlers(bot: any): void {
  // Обработчик callback queries
  bot.on('callback_query', async (ctx: Context) => {
    await TelegramUIHelper.handleCallbackQuery(ctx);
  });

  logger.info('✅ Зарегистрированы обработчики Telegram UI');
}
