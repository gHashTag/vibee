/**
 * Training Plugin - Обучение LoRA через Telegram
 * Добавляет обработку фото для системы обучения
 */

import { Plugin, IAgentRuntime, Service, logger } from '@elizaos/core';
import { PhotoCollectorService, ZipService, trainLoraAction } from './training';
import { handleTelegramPhoto } from './training/telegram-photo-handler';
import { handleTelegramCallback } from './training/telegram-callback-handler';

/**
 * Сервис для обработки фото из Telegram
 */
class TelegramPhotoService extends Service {
  static serviceType = 'telegram-photo-handler';
  capabilityDescription = 'Handles incoming photos from Telegram for LoRA training';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramPhotoService] 🔍 Initializing...');

    // Слушаем входящие сообщения
    runtime.on('TELEGRAM_MESSAGE_RECEIVED', async (data: any) => {
      try {
        logger.info('[TelegramPhotoService] 📨 TELEGRAM_MESSAGE_RECEIVED event fired!');
        logger.info('[TelegramPhotoService] 📦 Event data structure:', JSON.stringify({
          hasCtx: !!data.ctx,
          hasMessage: !!data.message,
          hasMemory: !!data.memory,
          ctxKeys: data.ctx ? Object.keys(data.ctx).slice(0, 10) : [],
          messageKeys: data.message ? Object.keys(data.message) : [],
          memoryKeys: data.memory ? Object.keys(data.memory) : [],
        }));

        const ctx = data.ctx;
        const message = data.memory || data.message || data;

        logger.info('[TelegramPhotoService] 🔍 Checking for photo:', {
          hasPhoto: !!ctx?.message?.photo,
          hasEntityId: !!message?.entityId,
          entityId: message?.entityId,
          messageType: ctx?.message?.photo ? 'photo' : ctx?.message?.text ? 'text' : 'other',
        });

        // Проверяем есть ли фото
        if (ctx?.message?.photo && message?.entityId) {
          logger.info('[TelegramPhotoService] 📸 Photo received from user:', message.entityId);

          await handleTelegramPhoto(
            runtime,
            message.entityId,
            ctx.message.photo,
            ctx
          );
        } else {
          logger.info('[TelegramPhotoService] ℹ️ Message is not a photo or has no entityId, ignoring');
        }
      } catch (error) {
        logger.error('[TelegramPhotoService] ❌ Error handling photo:', error);
      }
    });

    logger.info('[TelegramPhotoService] ✅ Initialized - listening for TELEGRAM_MESSAGE_RECEIVED events');
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramPhotoService> {
    const service = new TelegramPhotoService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TelegramPhotoService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}

/**
 * Сервис для обработки callback от inline кнопок
 */
class TelegramCallbackService extends Service {
  static serviceType = 'telegram-callback-handler';
  capabilityDescription = 'Handles inline keyboard button callbacks for LoRA training';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramCallbackService] 🔍 Initializing...');

    // Слушаем callback_query события
    runtime.on('TELEGRAM_CALLBACK_QUERY', async (data: any) => {
      try {
        logger.info('[TelegramCallbackService] 🔘 TELEGRAM_CALLBACK_QUERY event fired!');

        const ctx = data.ctx;
        const callbackQuery = ctx?.callbackQuery;

        if (!callbackQuery) {
          logger.warn('[TelegramCallbackService] No callback_query in event data');
          return;
        }

        const userId = callbackQuery.from?.id?.toString() || data.message?.entityId;
        const callbackData = callbackQuery.data;

        logger.info('[TelegramCallbackService] 🔘 Callback received:', {
          userId,
          callbackData,
          fromUser: callbackQuery.from?.username,
        });

        // Обрабатываем только callback для обучения
        if (callbackData?.startsWith('train_')) {
          await handleTelegramCallback(runtime, userId, callbackData, ctx);
        }
      } catch (error) {
        logger.error('[TelegramCallbackService] ❌ Error handling callback:', error);
      }
    });

    logger.info('[TelegramCallbackService] ✅ Initialized - listening for TELEGRAM_CALLBACK_QUERY events');
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramCallbackService> {
    const service = new TelegramCallbackService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TelegramCallbackService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}

/**
 * Плагин обучения
 */
export const trainingPlugin: Plugin = {
  name: 'training',
  description: 'LoRA training through Telegram photos',

  services: [
    PhotoCollectorService,
    ZipService,
    TelegramPhotoService, // Обработка входящих фото
    TelegramCallbackService, // Обработка кнопок
  ],

  actions: [
    trainLoraAction,
  ],
};

logger.info('🎨 [TRAINING PLUGIN] Module loaded - plugin exported');
logger.info('🎨 [TRAINING PLUGIN] Plugin name:', trainingPlugin.name);
logger.info('🎨 [TRAINING PLUGIN] Services:', trainingPlugin.services.map((s: any) => s.serviceType || s.name));
logger.info('🎨 [TRAINING PLUGIN] Actions:', trainingPlugin.actions.map((a: any) => a.name));
logger.info('🎨 [TRAINING PLUGIN] Features: Photos with callbacks + inline buttons');

export default trainingPlugin;
