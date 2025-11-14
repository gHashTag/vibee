/**
 * Train LoRA Action - Минимальная версия для теста
 * Команды: /train start, /train confirm, /train cancel
 */

import type { Action, ActionResult, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { PhotoCollectorService } from './PhotoCollectorService';
import { ZipService } from './ZipService';
import { fal } from '@fal-ai/client';
import type { UIElement } from '../telegram-ui-plugin';
import { TelegramUIGenerator } from '../telegram-ui-plugin';

/**
 * Отправить сообщение с кнопками через Telegram
 */
async function sendTelegramMessageWithButtons(
  runtime: IAgentRuntime,
  userId: string,
  text: string,
  uiElements?: UIElement[]
): Promise<void> {
  try {
    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      logger.warn('[TrainAction] Telegram service not available');
      return;
    }

    // Конвертируем ui_elements в reply_markup
    let replyMarkup: any = undefined;
    if (uiElements && uiElements.length > 0) {
      const markup = TelegramUIGenerator.convertToTelegramMarkup(uiElements);
      replyMarkup = markup.inline_keyboard.length > 0 ? { inline_keyboard: markup.inline_keyboard } : undefined;
    }

    // Отправляем сообщение напрямую через Telegram bot
    // Используем MarkdownV2 для лучшей совместимости или отключаем parse_mode
    await telegramService.bot.telegram.sendMessage(userId, text, {
      // parse_mode: 'Markdown', // Отключаем Markdown чтобы избежать ошибок парсинга
      reply_markup: replyMarkup,
    });

    logger.info(`[TrainAction] 📤 Sent message with ${uiElements?.length || 0} buttons to ${userId}`);
  } catch (error) {
    logger.error('[TrainAction] ❌ Error sending message with buttons:', error);
    throw error;
  }
}

export const trainLoraAction: Action = {
  name: 'TRAIN_LORA',
  similes: ['TRAIN_FACE', 'TRAIN_START', 'TRAIN_CONFIRM', 'TRAIN_CANCEL', 'TRAIN_HELP'],
  description: `Обучение LoRA модели через фото из Telegram.

Команды:
- /train start <название> <триггер> - начать сбор фото
- /train confirm - завершить и запустить обучение
- /train cancel - отменить сбор
- /train help - справка`,

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();
    logger.info(`[TrainAction] validate() called with text: "${text}"`);
    if (!text) {
      logger.info('[TrainAction] validate() - no text, returning false');
      return false;
    }
    // Точно проверяем что это команда /train, а не просто упоминание слова
    const result = text.startsWith('/train') || text.includes(' /train');
    logger.info(`[TrainAction] validate() result: ${result}`);
    return result;
  },

  // Не генерировать автоматический ответ через LLM
  suppressGeneratedResponse: true,

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    logger.info('[TrainAction] 🎯 HANDLER CALLED!');
    try {
      const text = message.content?.text || '';
      const userId = message.entityId;
      logger.info(`[TrainAction] Processing text: "${text}" from user: ${userId}`);

      const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);
      const zipService = runtime.getService<ZipService>('zip-service' as any);

      if (!photoCollector || !zipService) {
        await callback({
          text: '❌ Сервисы обучения не инициализированы. Перезапустите бота.',
        });
        return { success: false };
      }

      // ============================================================================
      // /train help - Помощь и объяснение
      // ============================================================================
      if (text.includes('/train help') || text === '/train') {
        const helpText = `🎨 **Обучение персональной ИИ-модели**\n\n` +
                `**Что это?**\n` +
                `Создай свою собственную ИИ-модель для генерации изображений! 🚀\n` +
                `Загрузи фото своего лица → Получи модель → Генерируй крутые арты с собой!\n\n` +
                `**Как использовать:**\n\n` +
                `1️⃣ **Начни обучение:**\n` +
                `\`/train start ИмяМодели trigger_word\`\n` +
                `Например: \`/train start Максим max_portrait\`\n\n` +
                `2️⃣ **Загрузи 10-20 фото:**\n` +
                `📸 Разные ракурсы (анфас, профиль, 3/4)\n` +
                `💡 Хорошее освещение\n` +
                `👤 Только твоё лицо\n` +
                `✨ Качественные фото\n\n` +
                `3️⃣ **Подтверди обучение:**\n` +
                `Нажми кнопку "✅ Подтвердить" после загрузки фото\n\n` +
                `4️⃣ **Жди 2-5 минут** ⚡️\n` +
                `_Тестовый режим: 1 шаг обучения_\n\n` +
                `5️⃣ **Проверь что всё работает!** ✅\n\n` +
                `**Другие команды:**\n` +
                `• \`/train cancel\` - отменить сбор\n\n` +
                `💡 **Это тест:** Модель не будет идеальной, но покажет что пайплайн работает!`;

        const buttons: UIElement[] = [
          { type: 'inline_callback', text: '🚀 Начать сейчас', callback_data: 'quick_train_start' },
          { type: 'inline_url', text: '📖 Документация', url: 'https://docs.fal.ai/flux/lora-training' },
        ];

        // Отправляем напрямую через Telegram с кнопками
        await sendTelegramMessageWithButtons(runtime, userId, helpText, buttons);

        // Вызываем callback чтобы ElizaOS знал что действие выполнено
        await callback({ text: '' }); // Пустой текст, так как уже отправили через Telegram

        return { success: true };
      }

      // ============================================================================
      // /train start <название> <триггер> [качество]
      // ============================================================================
      if (text.includes('/train start')) {
        const parts = text.split(' ').filter((p) => p.trim());

        if (parts.length < 4) {
          await callback({
            text: `❌ Неправильный формат!\n\n**Использование:**\n\`/train start <название> <триггер>\`\n\n**Пример:**\n` +
                  `\`/train start МоёЛицо my_face\`\n\n` +
                  `⚡️ **Тестовый режим**: 1 шаг (~2-5 мин)\n` +
                  `_Для быстрой проверки что всё работает_`,
          });
          return { success: false };
        }

        const faceName = parts[2];
        const triggerWord = parts[3];

        // ⚡️ ТЕСТОВЫЙ РЕЖИМ - 1 шаг для быстрой проверки
        const steps = 1;
        const qualityEmoji = '⚡️';
        const qualityText = 'Тест (1 шаг)';
        const timeEstimate = '2-5 минут';

        // Создаём сессию с параметрами
        const session = photoCollector.createSession(userId, faceName, triggerWord);
        // Сохраняем steps в сессии
        (session as any).steps = steps;

        const startText = `🎉 **Отлично! Начинаем обучение модели "${faceName}"**\n\n` +
                `🎯 Триггерное слово: \`${triggerWord}\`\n` +
                `_Его нужно будет использовать при генерации: "a photo of ${triggerWord}"_\n\n` +
                `${qualityEmoji} **Качество**: ${qualityText} (${steps} шагов)\n` +
                `⏱️ Время обучения: ~${timeEstimate}\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📸 **ШАГ 1: Отправь фотографии (прямо сейчас!)**\n\n` +
                `**Что нужно:**\n` +
                `✅ 10-20 фото своего лица\n` +
                `✅ Разные ракурсы (анфас, профиль, 3/4)\n` +
                `✅ Разное освещение и фон\n` +
                `✅ Разные эмоции\n\n` +
                `**Что НЕ нужно:**\n` +
                `❌ Групповые фото (только ты!)\n` +
                `❌ Солнечные очки/маски\n` +
                `❌ Размытые или тёмные фото\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📤 **ШАГ 2: После загрузки фото нажми кнопку:**\n\n` +
                `💡 _Бот будет показывать прогресс после каждого фото_`;

        const startButtons: UIElement[] = [
          { type: 'inline_callback', text: '✅ Подтвердить и начать обучение', callback_data: 'train_confirm' },
          { type: 'inline_callback', text: '❌ Отменить', callback_data: 'train_cancel' },
        ];

        // Отправляем напрямую через Telegram с кнопками
        await sendTelegramMessageWithButtons(runtime, userId, startText, startButtons);

        // Вызываем callback чтобы ElizaOS знал что действие выполнено
        await callback({ text: '' });

        logger.info(`[TrainAction] Started session for ${userId}: ${faceName}`);
        return { success: true };
      }

      // ============================================================================
      // /train cancel
      // ============================================================================
      if (text.includes('/train cancel')) {
        const session = photoCollector.getActiveSession(userId);

        if (!session) {
          await callback({
            text: '❌ Нет активной сессии обучения.',
          });
          return { success: false };
        }

        photoCollector.cancelSession(userId);

        await callback({
          text: `✅ Сессия обучения "${session.faceName}" отменена.\n\n` +
                `Собрано было: ${session.photos.length} фото`,
        });

        return { success: true };
      }

      // ============================================================================
      // /train confirm - Запустить обучение
      // ============================================================================
      if (text.includes('/train confirm')) {
        const session = photoCollector.getActiveSession(userId);

        if (!session) {
          await callback({
            text: '❌ Нет активной сессии обучения.\n\nНачни с: `/train start <название> <триггер>`',
          });
          return { success: false };
        }

        const photoCount = session.photos.length;

        if (photoCount < 10) {
          await callback({
            text: `⚠️ **Недостаточно фотографий**\n\n` +
                  `Собрано: ${photoCount}/10\n` +
                  `Нужно ещё: ${10 - photoCount} фото\n\n` +
                  `Отправь больше фото или используй \`/train cancel\``,
          });
          return { success: false };
        }

        if (photoCount > 30) {
          await callback({
            text: `⚠️ **Слишком много фотографий**\n\n` +
                  `Собрано: ${photoCount}\n` +
                  `Максимум: 30 фото\n\n` +
                  `Используй первые 20 фото или отмени: \`/train cancel\``,
          });
        }

        // Берём первые 20 фото
        const photosToUse = session.photos.slice(0, 20);

        await callback({
          text: `📦 **Создаю архив из ${photosToUse.length} фотографий...**\n\n` +
                `⏳ Это займёт 10-30 секунд`,
        });

        // Создаём ZIP
        const sessionId = `${userId}-${Date.now()}`;
        const zipPath = await zipService.createZipFromTelegramPhotos(photosToUse, sessionId);

        await callback({
          text: `📤 **Загружаю архив на временный хостинг...**`,
        });

        // Загружаем на file.io
        const zipUrl = await zipService.uploadToFileIo(zipPath);

        await callback({
          text: `🚀 **Отправляю на обучение в fal.ai...**\n\n` +
                `⏱️ Примерное время обучения: **15-30 минут**\n\n` +
                `Я уведомлю тебя когда обучение завершится!`,
        });

        // Отправляем на fal.ai для обучения
        const FAL_KEY = process.env.FAL_KEY;
        if (!FAL_KEY) {
          throw new Error('FAL_KEY not found');
        }

        fal.config({ credentials: FAL_KEY });

        // Получаем параметры обучения из сессии
        const steps = (session as any).steps || 1; // default 1 для теста
        const learningRate = 0.0004; // Единый LR для всех режимов

        logger.info(`[TrainAction] Starting training for ${session.faceName}`);
        logger.info(`[TrainAction] ZIP URL: ${zipUrl}`);
        logger.info(`[TrainAction] Trigger: ${session.triggerWord}`);
        logger.info(`[TrainAction] Steps: ${steps}, Learning Rate: ${learningRate}`);

        const trainingResult = await fal.queue.submit('fal-ai/flux-lora-portrait-trainer', {
          input: {
            images_data_url: zipUrl,
            trigger_phrase: session.triggerWord,
            steps,
            learning_rate: learningRate,
          },
        });

        const requestId = trainingResult.request_id;
        logger.info(`[TrainAction] Training started: ${requestId}`);

        // Завершаем сессию
        photoCollector.completeSession(userId);

        // Определяем эмоджи и текст качества для финального сообщения
        const qualityEmoji = '⚡️';
        const qualityText = 'Тест';
        const timeEstimate = '2-5 минут';

        await callback({
          text: `✅ **Обучение запущено!**\n\n` +
                `🎭 **Лицо:** ${session.faceName}\n` +
                `🎯 **Триггер:** \`${session.triggerWord}\`\n` +
                `📊 **Фотографий:** ${photosToUse.length}\n` +
                `${qualityEmoji} **Качество:** ${qualityText} (${steps} шагов)\n` +
                `🔑 **Job ID:** \`${requestId}\`\n\n` +
                `⏱️ **Время обучения:** ${timeEstimate}\n\n` +
                `Проверить статус:\n\`/train status ${requestId}\`\n\n` +
                `_Я уведомлю тебя когда обучение завершится_`,
        });

        // TODO: Сохранить requestId в БД для мониторинга
        // TODO: Настроить периодическую проверку статуса

        return {
          success: true,
          text: 'Training started',
          data: {
            requestId,
            faceName: session.faceName,
            triggerWord: session.triggerWord,
            photoCount: photosToUse.length,
          },
        };
      }

      // Неизвестная команда
      await callback({
        text: `❓ **Неизвестная команда**\n\n` +
              `**Доступные команды:**\n` +
              `• \`/train start <название> <триггер>\` - начать сбор фото\n` +
              `• \`/train confirm\` - завершить и запустить обучение\n` +
              `• \`/train cancel\` - отменить сбор`,
      });

      return { success: false };
    } catch (error) {
      logger.error('[TrainAction] Error:', error);

      await callback({
        text: `❌ **Произошла ошибка**\n\n${error instanceof Error ? error.message : String(error)}`,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: '/train start МоёЛицо my_face' },
      },
      {
        name: 'Vibee',
        content: {
          text: 'Начинаем обучение! Отправь 10-20 фотографий',
          actions: ['TRAIN_LORA'],
        },
      },
    ],
  ],
};
