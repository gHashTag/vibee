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

        // Создаём ZIP
        const zipPath = await zipService.createZipFromTelegramPhotos(photosToUse, sessionId);
        logger.info(`[TelegramCallbackHandler] ZIP created: ${zipPath}`);

        await ctx.reply('📤 **Загружаю архив на file.io...**');

        // Загружаем на file.io
        const zipUrl = await zipService.uploadToFileIo(zipPath);
        logger.info(`[TelegramCallbackHandler] ZIP uploaded: ${zipUrl}`);

        await ctx.reply('🚀 **Отправляю на обучение в fal.ai...**');

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

        await ctx.reply(
          `❌ **Ошибка при обучении**\n\n` +
          `Причина: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}\n\n` +
          `Попробуй снова через несколько минут`
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
