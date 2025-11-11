/**
 * Telegram Photo Handler
 * Обрабатывает входящие фото для обучения LoRA
 */

import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { PhotoCollectorService } from './PhotoCollectorService';
import { KeyboardBuilder } from '../telegram-keyboards';

/**
 * Создать кнопки для управления обучением
 */
function createTrainingButtons(photoCount: number): any {
  if (photoCount < 10) {
    // До 10 фото - только кнопка отмены
    return new KeyboardBuilder()
      .callback(photoCount === 1 ? '❌ Отменить сбор фото' : '❌ Отменить', 'train_cancel')
      .buildInline();
  } else {
    // 10+ фото - кнопки подтверждения и отмены
    return new KeyboardBuilder()
      .callback('✅ Начать обучение', 'train_confirm', 0)
      .callback('❌ Отменить', 'train_cancel', 0)
      .buildInline();
  }
}

/**
 * Обработать фото из Telegram
 * Вызывается когда пользователь отправляет фото
 */
export async function handleTelegramPhoto(
  runtime: IAgentRuntime,
  userId: string,
  photo: any, // Telegram Photo object
  ctx: any // Telegraf context
): Promise<void> {
  try {
    const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);

    if (!photoCollector) {
      logger.warn('[TelegramPhotoHandler] PhotoCollectorService not available');
      return;
    }

    // Проверяем есть ли активная сессия
    const activeSession = photoCollector.getActiveSession(userId);

    if (!activeSession) {
      // Нет активной сессии - игнорируем фото
      return;
    }

    // Берём самое большое фото
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;

    // Получаем информацию о файле через Bot API
    const file = await ctx.telegram.getFile(fileId);

    // Добавляем фото к сессии
    const photoCount = photoCollector.addPhoto(userId, fileId, file.file_path, file.file_size);

    // Геймифицированные сообщения для разных этапов
    let message = '';
    let progressBar = '';

    // Прогресс-бар
    const filled = Math.floor((photoCount / 20) * 10);
    progressBar = '▓'.repeat(filled) + '░'.repeat(10 - filled);

    // Формируем сообщение в зависимости от количества фото
    if (photoCount === 1) {
      message = `🎉 **Первое фото загружено!**\n\n` +
                `📊 Прогресс: ${progressBar} ${photoCount}/20\n\n` +
                `💪 Продолжай! Загрузи ещё ${9} фото для минимума`;
    } else if (photoCount < 5) {
      message = `✨ **Фото ${photoCount} добавлено!**\n\n` +
                `📊 ${progressBar} ${photoCount}/20\n\n` +
                `🔥 Отлично! Ещё ${10 - photoCount} до минимума`;
    } else if (photoCount < 10) {
      message = `🚀 **Фото ${photoCount} загружено!**\n\n` +
                `📊 ${progressBar} ${photoCount}/20\n\n` +
                `💎 Супер! Ещё ${10 - photoCount} до готовности`;
    } else if (photoCount === 10) {
      message = `🎊 **Минимум достигнут! (${photoCount}/20)**\n\n` +
                `📊 ${progressBar}\n\n` +
                `✅ Уже можно начинать обучение!\n` +
                `💡 Но можешь добавить ещё (до 20) для лучшего качества`;
    } else if (photoCount < 15) {
      message = `💎 **${photoCount} фото загружено!**\n\n` +
                `📊 ${progressBar} ${photoCount}/20\n\n` +
                `🔥 Отличная коллекция! Чем больше - тем лучше результат`;
    } else if (photoCount < 20) {
      message = `🌟 **${photoCount} фото! Почти максимум!**\n\n` +
                `📊 ${progressBar} ${photoCount}/20\n\n` +
                `👑 Профессиональный подход! Модель будет огонь`;
    } else {
      message = `👑 **МАКСИМУМ! ${photoCount} фото загружено!**\n\n` +
                `📊 ${progressBar} ${photoCount}/20\n\n` +
                `🏆 Идеальная коллекция! Модель будет топовой`;
    }

    // Создаём кнопки через KeyboardBuilder
    const replyMarkup = createTrainingButtons(photoCount);

    await ctx.reply(message, { reply_markup: replyMarkup });

    logger.info(`[TelegramPhotoHandler] Photo ${photoCount} added for user ${userId}`);
  } catch (error) {
    logger.error('[TelegramPhotoHandler] Error:', error);
  }
}
