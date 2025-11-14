/**
 * Telegram Callback Handler
 * Обрабатывает нажатия на inline кнопки
 */

import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { PhotoCollectorService } from './PhotoCollectorService';
import { ZipService } from './ZipService';
import * as fal from '@fal-ai/client';

/**
 * Обработать callback от inline кнопок
 */
export async function handleTelegramCallback(
  runtime: IAgentRuntime,
  userId: string,
  callbackData: string,
  ctx: any
): Promise<void> {
  try {
    logger.info(`[TelegramCallbackHandler] Received callback: ${callbackData} from user: ${userId}`);

    const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);
    const zipService = runtime.getService<ZipService>('zip-service' as any);

    if (!photoCollector || !zipService) {
      logger.error('[TelegramCallbackHandler] Required services not available');
      await ctx.answerCbQuery('❌ Ошибка сервиса', { show_alert: true });
      return;
    }

    // Подтверждаем получение callback (убирает "часики" на кнопке)
    await ctx.answerCbQuery();

    // Обработка menu callbacks
    if (callbackData === 'menu_training') {
      const buttons = {
        inline_keyboard: [
          [{ text: '🚀 Начать обучение', callback_data: 'training_start' }],
          [{ text: '❓ Как это работает?', callback_data: 'training_help' }],
          [{ text: '📋 Мои модели', callback_data: 'training_models' }],
          [{ text: '🔙 Назад в меню', callback_data: 'back_to_menu' }],
        ],
      };

      await ctx.reply(
        `🎨 **Обучение персональной ИИ-модели**\n\n` +
        `Создай свою собственную AI-модель для генерации изображений!\n\n` +
        `🚀 **Что это даёт:**\n` +
        `• Генерация изображений с твоим лицом\n` +
        `• Крутые арты и аватары\n` +
        `• Уникальный контент для соцсетей\n\n` +
        `⚡️ **Тестовый режим** (1 шаг, ~2-5 минут)\n` +
        `Быстрая проверка что весь пайплайн работает!\n\n` +
        `📸 **Что нужно:**\n` +
        `• 10-20 фото своего лица\n` +
        `• Разные ракурсы и освещение\n` +
        `• Хорошее качество\n\n` +
        `Что хочешь сделать?`,
        { reply_markup: buttons }
      );
      return;
    }

    // training_start - начать процесс обучения
    if (callbackData === 'training_start') {
      const buttons = {
        inline_keyboard: [
          [{ text: '✅ Понятно, начинаем!', callback_data: 'training_start_confirm' }],
          [{ text: '🔙 Назад', callback_data: 'menu_training' }],
        ],
      };

      await ctx.reply(
        `🚀 **Готов начать обучение!**\n\n` +
        `**Шаг 1: Введи данные**\n` +
        `Отправь мне сообщение в формате:\n` +
        `\`ИмяМодели триггерное_слово\`\n\n` +
        `**Пример:**\n` +
        `\`MyFace my_face\`\n\n` +
        `**Шаг 2: Загрузи фото**\n` +
        `📸 Отправь 10-20 фото своего лица\n\n` +
        `**Шаг 3: Подтверди**\n` +
        `Нажми кнопку "✅ Подтвердить" когда загрузишь все фото\n\n` +
        `Готов начать?`,
        { reply_markup: buttons }
      );
      return;
    }

    // training_help - справка по обучению
    if (callbackData === 'training_help') {
      const buttons = {
        inline_keyboard: [
          [{ text: '🚀 Начать обучение', callback_data: 'training_start' }],
          [{ text: '🔙 Назад', callback_data: 'menu_training' }],
        ],
      };

      await ctx.reply(
        `❓ **Как работает обучение модели**\n\n` +
        `**1. Что такое LoRA?**\n` +
        `Это метод дообучения AI-модели на твоих фото. Модель "запомнит" как ты выглядишь.\n\n` +
        `**2. Что нужно для обучения?**\n` +
        `• 10-20 качественных фото твоего лица\n` +
        `• Разные ракурсы (анфас, профиль, 3/4)\n` +
        `• Хорошее освещение\n` +
        `• Нейтральный фон\n\n` +
        `**3. Сколько времени?**\n` +
        `⚡️ Тестовый режим: ~2-5 минут (1 шаг)\n` +
        `🔥 Полное обучение: ~15-30 минут (100-200 шагов)\n\n` +
        `**4. Что дальше?**\n` +
        `После обучения ты сможешь генерировать изображения с собой в любом стиле!`,
        { reply_markup: buttons }
      );
      return;
    }

    // training_models - список моделей пользователя
    if (callbackData === 'training_models') {
      const session = photoCollector.getActiveSession(userId);
      const buttons = {
        inline_keyboard: [
          [{ text: '🚀 Начать новое обучение', callback_data: 'training_start' }],
          [{ text: '🔙 Назад', callback_data: 'menu_training' }],
        ],
      };

      let modelsText = `📋 **Твои модели**\n\n`;

      if (session) {
        modelsText += `**Активная сессия:**\n`;
        modelsText += `🎨 Модель: ${session.faceName}\n`;
        modelsText += `🎯 Триггер: ${session.triggerWord}\n`;
        modelsText += `📸 Загружено фото: ${session.photos.length}\n`;
        modelsText += `⏱️ Создана: ${new Date(session.createdAt).toLocaleString('ru-RU')}\n\n`;
      } else {
        modelsText += `У тебя пока нет активных сессий обучения.\n\n`;
      }

      modelsText += `💡 Создай свою первую модель и начни генерировать крутые изображения!`;

      await ctx.reply(modelsText, { reply_markup: buttons });
      return;
    }

    // back_to_menu - вернуться в главное меню
    if (callbackData === 'back_to_menu') {
      const buttons = {
        inline_keyboard: [
          [{ text: '🎨 Обучение модели', callback_data: 'menu_training' }],
          [{ text: '📚 Обучение', callback_data: 'menu_learning' }],
          [{ text: '🔧 Инструменты', callback_data: 'menu_tools' }],
          [{ text: '💻 Примеры кода', callback_data: 'menu_examples' }],
          [{ text: '❓ Помощь', callback_data: 'menu_help' }],
          [{ text: '📊 Мой прогресс', callback_data: 'menu_progress' }],
        ],
      };

      await ctx.reply(
        `📋 **Главное меню Vibee**\n\nВыбери раздел, который тебя интересует:`,
        { reply_markup: buttons }
      );
      return;
    }

    // quick_train_start - быстрый старт обучения (старый callback)
    if (callbackData === 'quick_train_start') {
      await ctx.reply(
        `🚀 **Готов начать обучение!**\n\n` +
        `Используй команду:\n` +
        `\`/train start ИмяМодели trigger_word\`\n\n` +
        `**Пример:**\n` +
        `\`/train start MyFace my_face\`\n\n` +
        `📸 Затем отправь 10-20 фото своего лица и нажми "✅ Подтвердить"`
      );
      return;
    }

    // train_confirm - начать обучение
    if (callbackData === 'train_confirm') {
      const session = photoCollector.getActiveSession(userId);

      if (!session) {
        await ctx.reply('❌ **Активная сессия не найдена**\n\nНачни заново с `/train start`');
        return;
      }

      const photoCount = session.photos.length;

      if (photoCount < 10) {
        await ctx.reply(
          `⚠️ **Недостаточно фотографий**\n\n` +
          `Собрано: ${photoCount}/10\n` +
          `Нужно ещё: ${10 - photoCount} фото\n\n` +
          `Отправь больше фото или используй кнопку "Отменить"`
        );
        return;
      }

      // Начинаем обучение
      await ctx.reply('⏳ **Начинаю обучение...**\n\nСоздаю ZIP архив из фотографий...');

      try {
        // Используем только первые 20 фото
        const photosToUse = session.photos.slice(0, 20);
        const sessionId = `${userId}_${Date.now()}`;

        // Показываем индикатор "загрузка документа" во время создания ZIP
        await ctx.replyWithChatAction('upload_document');

        // Создаём ZIP
        const zipPath = await zipService.createZipFromTelegramPhotos(photosToUse, sessionId);
        logger.info(`[TelegramCallbackHandler] ZIP created: ${zipPath}`);

        await ctx.reply('📤 **Загружаю архив на file.io...**');

        // Показываем индикатор "загрузка документа" во время upload
        await ctx.replyWithChatAction('upload_document');

        // Загружаем на file.io
        const zipUrl = await zipService.uploadToFileIo(zipPath);
        logger.info(`[TelegramCallbackHandler] ZIP uploaded: ${zipUrl}`);

        await ctx.reply('🚀 **Отправляю на обучение в fal.ai...**');

        // Показываем индикатор "печатает" во время отправки на fal.ai
        await ctx.replyWithChatAction('typing');

        // Параметры обучения (TEST MODE - 1 шаг)
        const steps = (session as any).steps || 1;
        const learningRate = 0.0004;

        // Инициализируем fal.ai
        if (process.env.FAL_KEY) {
          fal.config({ credentials: process.env.FAL_KEY });
        }

        // Отправляем на обучение
        const trainingResult = await fal.queue.submit('fal-ai/flux-lora-portrait-trainer', {
          input: {
            images_data_url: zipUrl,
            trigger_phrase: session.triggerWord,
            steps,
            learning_rate: learningRate,
          },
        });

        logger.info(`[TelegramCallbackHandler] Training submitted:`, trainingResult);

        // Завершаем сессию
        photoCollector.completeSession(userId);

        await ctx.reply(
          `✅ **Обучение запущено!**\n\n` +
          `🎨 Модель: **${session.faceName}**\n` +
          `🎯 Триггер: \`${session.triggerWord}\`\n` +
          `📸 Фото: ${photosToUse.length}\n` +
          `⚡️ Режим: Тест (${steps} шаг)\n` +
          `⏱️ Время: ~2-5 минут\n\n` +
          `🔑 **Job ID:** \`${trainingResult.request_id}\`\n\n` +
          `💡 Сохрани этот ID для отслеживания статуса`
        );
      } catch (error) {
        logger.error('[TelegramCallbackHandler] Training error:', error);

        // Создаём кнопку для повтора
        const { KeyboardBuilder } = await import('../telegram-keyboards');
        const retryKeyboard = new KeyboardBuilder()
          .callback('🔄 Попробовать снова', 'train_confirm', 0)
          .callback('❌ Отменить', 'train_cancel', 0)
          .buildInline();

        // Определяем тип ошибки для более понятного сообщения
        let errorMessage = 'Неизвестная ошибка';
        let errorHint = '';

        if (error instanceof Error) {
          errorMessage = error.message;

          // Даём подсказки по распространённым ошибкам
          if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
            errorHint = '\n\n💡 **Подсказка:** Проблема с сетью. Проверь интернет-соединение.';
          } else if (errorMessage.includes('file.io')) {
            errorHint = '\n\n💡 **Подсказка:** Не удалось загрузить архив. Попробуй снова.';
          } else if (errorMessage.includes('FAL_KEY')) {
            errorHint = '\n\n💡 **Подсказка:** Проблема с API ключом fal.ai.';
          } else if (errorMessage.includes('rate limit')) {
            errorHint = '\n\n💡 **Подсказка:** Слишком много запросов. Подожди 1-2 минуты.';
          }
        }

        await ctx.reply(
          `❌ **Ошибка при обучении**\n\n` +
          `**Причина:** ${errorMessage}${errorHint}\n\n` +
          `⚠️ **Твоя сессия НЕ потеряна!**\n` +
          `Фото (${session.photos.length} шт.) сохранены.\n\n` +
          `Выбери действие:`,
          { reply_markup: retryKeyboard }
        );
      }
    }

    // train_cancel - отменить обучение
    else if (callbackData === 'train_cancel') {
      const session = photoCollector.getActiveSession(userId);

      if (!session) {
        await ctx.reply('ℹ️ Активной сессии нет');
        return;
      }

      const photoCount = session.photos.length;
      photoCollector.cancelSession(userId);

      await ctx.reply(
        `❌ **Сессия отменена**\n\n` +
        `Было загружено: ${photoCount} фото\n` +
        `Модель: ${session.faceName}\n\n` +
        `Для новой сессии используй: \`/train start\``
      );

      logger.info(`[TelegramCallbackHandler] Session cancelled for user ${userId}`);
    }

    // Неизвестный callback
    else {
      logger.warn(`[TelegramCallbackHandler] Unknown callback: ${callbackData}`);
    }
  } catch (error) {
    logger.error('[TelegramCallbackHandler] Error:', error);
    await ctx.reply('❌ Произошла ошибка при обработке команды');
  }
}
