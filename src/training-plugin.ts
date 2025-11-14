/**
 * Training Plugin - Обучение LoRA через Telegram
 * Добавляет обработку фото для системы обучения
 * ОПТИМИЗИРОВАН: убрано ожидание, добавлена параллельная обработка, мониторинг
 */

import { Plugin, IAgentRuntime, Service, logger } from '@elizaos/core';
import { PhotoCollectorService, ZipService, trainLoraAction } from './training';
import { handleTelegramPhoto } from './training/telegram-photo-handler';
import { handleTelegramCallback } from './training/telegram-callback-handler';
import { TelegramCommandsService } from './training/TelegramCommandsService';
import { SelfTestService } from './services/self-test';
import { selfTestAction } from './actions/selftest-action';
import { performanceMonitor } from './performance/PerformanceMonitor';
import { cachedProviderFactory } from './performance/CachedProvider';

/**
 * Оптимизированный сервис для обработки фото из Telegram
 * ОПТИМИЗАЦИИ: вместо polling - callback через события, параллельная обработка
 */
class TelegramPhotoService extends Service {
  static serviceType = 'telegram-photo-handler';
  capabilityDescription = 'Handles incoming photos from Telegram for LoRA training';
  private telegramService: any = null;
  private isInitialized = false;
  private photoQueue: Array<{
    ctx: any;
    userId: string;
    timestamp: number;
  }> = [];
  private processingBatch = false;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramPhotoService] 🔍 Initializing...');

    // LAZY LOADING: Подписываемся на события ElizaOS вместо polling
    this.subscribeToEvents(runtime);

    // Параллельно пытаемся найти TelegramService (но не ждём его)
    this.findTelegramServiceAsync(runtime);
  }

  /**
   * Подписываемся на события ElizaOS для получения Telegram сервиса
   */
  private subscribeToEvents(runtime: IAgentRuntime): void {
    // Используем событийную систему ElizaOS
    runtime.on('service:started', (service: any) => {
      if (service.serviceType === 'telegram' || service.name === 'telegram') {
        logger.info('[TelegramPhotoService] 🎯 Telegram service detected via event');
        this.setupPhotoHandler(runtime, service);
      }
    });
  }

  /**
   * Асинхронно ищем TelegramService (не блокируем инициализацию)
   */
  private async findTelegramServiceAsync(runtime: IAgentRuntime): Promise<void> {
    try {
      const telegramService = await this.waitForTelegramService(runtime, 5000);
      if (telegramService) {
        this.setupPhotoHandler(runtime, telegramService);
      }
    } catch (error) {
      logger.warn('[TelegramPhotoService] Telegram service not found, will wait for event');
    }
  }

  /**
   * Ждём TelegramService не дольше заданного времени (быстрое завершение)
   */
  private async waitForTelegramService(runtime: IAgentRuntime, timeoutMs: number): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 100; // Быстрый polling
    const maxAttempts = Math.floor(timeoutMs / pollInterval);

    for (let i = 0; i < maxAttempts; i++) {
      const service = runtime.getService('telegram');
      if (service && service.bot) {
        return service;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    return null;
  }

  /**
   * Настраиваем обработчик фотографий
   */
  private setupPhotoHandler(runtime: IAgentRuntime, telegramService: any): void {
    if (this.isInitialized) return;

    this.telegramService = telegramService;
    this.isInitialized = true;

    logger.info('[TelegramPhotoService] ✅ Setting up photo handler...');

    // Регистрируем обработчик фото напрямую через bot.on()
    telegramService.bot.on('photo', async (ctx: any) => {
      const userId = ctx.from.id.toString();

      // Добавляем в очередь для параллельной обработки
      this.photoQueue.push({
        ctx,
        userId,
        timestamp: Date.now(),
      });

      // Запускаем обработку если ещё не идёт
      if (!this.processingBatch) {
        this.processPhotoBatch(runtime);
      }
    });

    logger.info('[TelegramPhotoService] ✅ Photo handler registered and ready');

    // Обрабатываем накопленные фото если есть
    if (this.photoQueue.length > 0) {
      this.processPhotoBatch(runtime);
    }
  }

  /**
   * Обрабатываем фотографии батчами для параллельной обработки
   */
  private async processPhotoBatch(runtime: IAgentRuntime): Promise<void> {
    this.processingBatch = true;

    while (this.photoQueue.length > 0) {
      // Берём пачку до 5 фото для обработки
      const batch = this.photoQueue.splice(0, 5);

      // Обрабатываем параллельно
      await Promise.all(
        batch.map(async (item) => {
          try {
            await performanceMonitor.measure(
              `photo_handler_${item.userId}`,
              async () => {
                logger.info('[TelegramPhotoService] 📸 Processing photo from user:', item.userId);

                await handleTelegramPhoto(
                  runtime,
                  item.userId,
                  item.ctx.message.photo,
                  item.ctx
                );
              }
            );
          } catch (error) {
            logger.error('[TelegramPhotoService] ❌ Error handling photo:', error);
          }
        })
      );
    }

    this.processingBatch = false;
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
 * Оптимизированный сервис для обработки callback от inline кнопок
 * ОПТИМИЗАЦИИ: убрано ожидание, добавлено кэширование callback
 */
class TelegramCallbackService extends Service {
  static serviceType = 'telegram-callback-handler';
  capabilityDescription = 'Handles inline keyboard button callbacks for LoRA training';
  private telegramService: any = null;
  private isInitialized = false;
  private callbackQueue: Array<{
    ctx: any;
    userId: string;
    callbackData: string;
    timestamp: number;
  }> = [];
  private processingBatch = false;

  // Кэшируем результаты обработки callback для быстрых повторных запросов
  private callbackCache = cachedProviderFactory.getProvider(
    'training_callback',
    { ttl: 2 * 60 * 1000, maxSize: 500 } // 2 минуты TTL
  );

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramCallbackService] 🔍 Initializing...');

    // Подписываемся на события
    this.subscribeToEvents(runtime);

    // Параллельно ищем TelegramService
    this.findTelegramServiceAsync(runtime);
  }

  /**
   * Подписываемся на события ElizaOS
   */
  private subscribeToEvents(runtime: IAgentRuntime): void {
    runtime.on('service:started', (service: any) => {
      if (service.serviceType === 'telegram' || service.name === 'telegram') {
        logger.info('[TelegramCallbackService] 🎯 Telegram service detected via event');
        this.setupCallbackHandler(runtime, service);
      }
    });
  }

  /**
   * Асинхронно ищем TelegramService
   */
  private async findTelegramServiceAsync(runtime: IAgentRuntime): Promise<void> {
    try {
      const telegramService = await this.waitForTelegramService(runtime, 5000);
      if (telegramService) {
        this.setupCallbackHandler(runtime, telegramService);
      }
    } catch (error) {
      logger.warn('[TelegramCallbackService] Telegram service not found, will wait for event');
    }
  }

  /**
   * Ждём TelegramService не дольше 5 секунд
   */
  private async waitForTelegramService(runtime: IAgentRuntime, timeoutMs: number): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 100;
    const maxAttempts = Math.floor(timeoutMs / pollInterval);

    for (let i = 0; i < maxAttempts; i++) {
      const service = runtime.getService('telegram');
      if (service && service.bot) {
        return service;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    return null;
  }

  /**
   * Настраиваем обработчик callback
   */
  private setupCallbackHandler(runtime: IAgentRuntime, telegramService: any): void {
    if (this.isInitialized) return;

    this.telegramService = telegramService;
    this.isInitialized = true;

    logger.info('[TelegramCallbackService] ✅ Setting up callback handler...');

    // Регистрируем обработчик callback_query
    telegramService.bot.on('callback_query', async (ctx: any) => {
      const userId = ctx.callbackQuery.from.id.toString();
      const callbackData = ctx.callbackQuery.data;

      // Добавляем в очередь для батчинга
      this.callbackQueue.push({
        ctx,
        userId,
        callbackData,
        timestamp: Date.now(),
      });

      // Запускаем обработку если ещё не идёт
      if (!this.processingBatch) {
        this.processCallbackBatch(runtime);
      }
    });

    logger.info('[TelegramCallbackService] ✅ Callback handler registered and ready');

    // Обрабатываем накопленные callback если есть
    if (this.callbackQueue.length > 0) {
      this.processCallbackBatch(runtime);
    }
  }

  /**
   * Обрабатываем callback батчами
   */
  private async processCallbackBatch(runtime: IAgentRuntime): Promise<void> {
    this.processingBatch = true;

    while (this.callbackQueue.length > 0) {
      // Берём пачку до 10 callback для обработки
      const batch = this.callbackQueue.splice(0, 10);

      // Обрабатываем параллельно
      await Promise.all(
        batch.map(async (item) => {
          try {
            await performanceMonitor.measure(
              `callback_handler_${item.userId}`,
              async () => {
                logger.info('[TelegramCallbackService] 🔘 Processing callback:', {
                  userId: item.userId,
                  callbackData: item.callbackData,
                });

                // Проверяем кэш для быстрых повторных callback
                const cacheKey = {
                  userId: item.userId,
                  callbackData: item.callbackData,
                };

                await this.callbackCache.get(cacheKey, async () => {
                  const isTrainingCallback =
                    item.callbackData?.startsWith('train_') ||
                    item.callbackData?.startsWith('training_') ||
                    item.callbackData?.startsWith('menu_training') ||
                    item.callbackData?.startsWith('quick_train') ||
                    item.callbackData === 'back_to_menu';

                  if (isTrainingCallback) {
                    await handleTelegramCallback(runtime, item.userId, item.callbackData, item.ctx);
                  }
                });
              }
            );
          } catch (error) {
            logger.error('[TelegramCallbackService] ❌ Error handling callback:', error);
            try {
              await item.ctx.answerCbQuery('❌ Ошибка обработки', { show_alert: true });
            } catch {}
          }
        })
      );
    }

    this.processingBatch = false;
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
    TelegramCommandsService, // Обработка /train команд с кнопками
  ],

  actions: [
    // trainLoraAction,  // Отключён - используем только кнопки
  ],
};

logger.info('🎨 [TRAINING PLUGIN] Module loaded - plugin exported');
logger.info('🎨 [TRAINING PLUGIN] Plugin name:', trainingPlugin.name);
logger.info('🎨 [TRAINING PLUGIN] Services:', trainingPlugin.services.map((s: any) => s.serviceType || s.name));
logger.info('🎨 [TRAINING PLUGIN] Actions:', trainingPlugin.actions.map((a: any) => a.name));
logger.info('🎨 [TRAINING PLUGIN] Features: Photos with callbacks + inline buttons');

export default trainingPlugin;
