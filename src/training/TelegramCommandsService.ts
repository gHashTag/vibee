/**
 * Telegram Commands Service
 * Показывает красивые меню через кнопки для обучения LoRA
 */

import { Service, logger, type IAgentRuntime } from '@elizaos/core';
import type { PhotoCollectorService } from './PhotoCollectorService';
import { keyboard } from '../telegram-keyboards';

export class TelegramCommandsService extends Service {
  static serviceType = 'telegram-commands-handler';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramCommandsService] 🔍 Initializing...');

    // Ждём появления TelegramService
    const maxAttempts = 20;
    let telegramService = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService && telegramService.bot) {
        logger.info('[TelegramCommandsService] ✅ Found TelegramService with active bot');
        break;
      }
      logger.info(`[TelegramCommandsService] Waiting for TelegramService... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!telegramService || !telegramService.bot) {
      logger.warn('[TelegramCommandsService] ⚠️ TelegramService not found after waiting');
      return;
    }

    // Обрабатываем callback от кнопок обучения
    telegramService.bot.on('callback_query', async (ctx: any) => {
      try {
        const query = ctx.callbackQuery;
        const data = query.data;
        const chatId = ctx.callbackQuery.message.chat.id;
        const userId = ctx.from.id.toString();

        logger.info(`[TelegramCommandsService] 📱 Callback received: ${data}`);

        // Обрабатываем callback
        await this.handleTrainingCallback(runtime, userId, chatId, data, telegramService.bot, ctx);

        // Отвечаем на callback
        await ctx.answerCallbackQuery();

      } catch (error) {
        logger.error('[TelegramCommandsService] ❌ Error handling callback:', error);
      }
    });

    // MIDDLEWARE: Прямая обработка /train команды (как в TelegramStartService)
    const originalHandleUpdate = telegramService.bot.handleUpdate.bind(telegramService.bot);

    telegramService.bot.handleUpdate = async function (update: any, webhookReply?: any) {
      const text = update.message?.text || update.channel_post?.text;

      // Check if this is a /train command - but let it pass through for normal processing
      if (text && text.toLowerCase().trim() === '/train') {
        try {
          logger.info('[TelegramCommandsService] 🎨 /train command intercepted - letting it pass through for conversational handling!');

          // Don't intercept - let the normal flow handle it conversationally
          // The bot will respond naturally to /train as a conversation topic
        } catch (error) {
          logger.error('[TelegramCommandsService] ❌ Error:', error);
        }
      }

      // Always pass through to original handler for normal processing
      return originalHandleUpdate(update, webhookReply);
    }.bind(this);

    logger.info('[TelegramCommandsService] ✅ Middleware registered for /train command');
    logger.info('[TelegramCommandsService] ✅ Callback handler registered for training menu');
  }

  /**
   * Показывает главное меню обучения
   */
  async showTrainingMenu(runtime: IAgentRuntime, chatId: number, bot: any): Promise<void> {
    const menuText = `🎨 **Обучение персональной ИИ-модели**

Создай свою собственную AI-модель для генерации изображений!

🚀 **Что это даёт:**
• Генерация изображений с твоим лицом
• Крутые арты и аватары
• Уникальный контент для соцсетей

📸 **Что нужно:**
• 10-20 фото своего лица
• Разные ракурсы и освещение
• Хорошее качество

**Выбери качество обучения:**`;

    const keyboardMarkup = keyboard.pattern('training_quality');

    await bot.telegram.sendMessage(chatId, menuText, {
      parse_mode: 'Markdown',
      reply_markup: keyboardMarkup,
    });

    logger.info('[TelegramCommandsService] 🎨 Training menu sent');
  }

  /**
   * Показывает меню выбора количества шагов
   */
  async showStepsMenu(runtime: IAgentRuntime, chatId: number, quality: string, bot: any): Promise<void> {
    const emoji = quality === 'quick' ? '⚡' : quality === 'standard' ? '🔥' : '💎';
    const qualityText = quality === 'quick' ? 'Быстро' : quality === 'standard' ? 'Стандартно' : 'Качественно';

    const menuText = `${emoji} **${qualityText}** - Выбери количество шагов обучения:

📊 **Больше шагов = выше качество модели**
⏱️ **Больше шагов = больше времени**

**Рекомендуемое количество:**`;

    const keyboardMarkup = keyboard.pattern('training_steps');

    await bot.telegram.sendMessage(chatId, menuText, {
      parse_mode: 'Markdown',
      reply_markup: keyboardMarkup,
    });

    logger.info(`[TelegramCommandsService] 📊 Steps menu sent for quality: ${quality}`);
  }

  /**
   * Показывает финальное меню подтверждения
   */
  async showConfirmMenu(runtime: IAgentRuntime, chatId: number, steps: number, quality: string, bot: any): Promise<void> {
    const emoji = quality === 'quick' ? '⚡' : quality === 'standard' ? '🔥' : '💎';
    const qualityText = quality === 'quick' ? 'Быстро' : quality === 'standard' ? 'Стандартно' : 'Качественно';

    // Считаем время (примерно 30 секунд на шаг)
    const estimatedTime = steps * 30;
    const minutes = Math.floor(estimatedTime / 60);
    const seconds = estimatedTime % 60;
    const timeText = minutes > 0 ? `${minutes} мин ${seconds} сек` : `${seconds} сек`;

    const menuText = `${emoji} **Подтверждение обучения**

📋 **Параметры:**
• Качество: ${qualityText}
• Шаги: ${steps}
• Время: ~${timeText}

📸 **Следующий шаг:**
Отправь 10-20 фото своего лица для обучения`;

    const keyboardMarkup = keyboard.pattern('training_start');

    await bot.telegram.sendMessage(chatId, menuText, {
      parse_mode: 'Markdown',
      reply_markup: keyboardMarkup,
    });

    logger.info(`[TelegramCommandsService] ✅ Confirm menu sent for ${steps} steps, ${quality} quality`);
  }

  /**
   * Обрабатывает callback от кнопок
   */
  private async handleTrainingCallback(
    runtime: IAgentRuntime,
    userId: string,
    chatId: number,
    data: string,
    bot: any,
    ctx: any
  ): Promise<void> {
    // Получаем или создаём сессию пользователя
    const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);
    if (!photoCollector) {
      await bot.telegram.sendMessage(chatId, '❌ Сервис обучения не инициализирован');
      return;
    }

    const session = photoCollector.getOrCreateSession(userId);

    switch (data) {
      case 'train_quick':
      case 'train_standard':
      case 'train_quality': {
        const quality = data.split('_')[1];
        session.quality = quality;
        session.steps = quality === 'quick' ? 3 : quality === 'standard' ? 12 : 25;
        await this.showStepsMenu(runtime, chatId, quality, bot);
        break;
      }

      case 'steps_1':
      case 'steps_5':
      case 'steps_10':
      case 'steps_20':
      case 'steps_30':
      case 'steps_50': {
        const steps = parseInt(data.split('_')[1]);
        session.steps = steps;
        session.quality = session.quality || 'standard';
        await this.showConfirmMenu(runtime, chatId, steps, session.quality, bot);
        break;
      }

      case 'train_confirm': {
        // Создаём сессию
        const faceName = `User_${userId}`;
        const triggerWord = `face_${userId}`;
        photoCollector.createSession(userId, faceName, triggerWord);

        const startText = `🎉 **Отлично! Обучение "${session.faceName || faceName}"**

🎯 Триггерное слово: ${triggerWord}
📸 ШАГ 1: Отправь фотографии (прямо сейчас!)

**Что нужно:**
✅ 10-20 фото своего лица
✅ Разные ракурсы (анфас, профиль, 3/4)
✅ Разное освещение и фон
✅ Разные эмоции

**Что НЕ нужно:**
❌ Групповые фото (только ты!)
❌ Солнечные очки/маски
❌ Размытые или тёмные фото

💡 **После загрузки фото нажми кнопку "Подтвердить"**`;

        const keyboardMarkup = keyboard.pattern('confirm_cancel');

        await bot.telegram.sendMessage(chatId, startText, {
          parse_mode: 'Markdown',
          reply_markup: keyboardMarkup,
        });
        break;
      }

      case 'train_list': {
        const sessions = photoCollector.getUserSessions(userId);
        if (sessions.length === 0) {
          await bot.telegram.sendMessage(chatId, '📭 У тебя пока нет обученных моделей.');
        } else {
          const listText = '📋 **Твои модели:**\n\n' +
            sessions.map((s, i) => `${i + 1}. ${s.faceName} (${s.status})`).join('\n');
          await bot.telegram.sendMessage(chatId, listText, { parse_mode: 'Markdown' });
        }
        break;
      }

      case 'train_cancel':
      case 'back': {
        await bot.telegram.sendMessage(chatId, '✅ Отменено. Для нового обучения нажми /train');
        break;
      }

      case 'action_confirm': {
        // Подтверждаем обучение
        const activeSession = photoCollector.getActiveSession(userId);
        if (activeSession) {
          await bot.telegram.sendMessage(chatId, '🚀 **Запускаю обучение!**\n' +
            '⏳ Это может занять несколько минут...\n\n' +
            'Я пришлю уведомление когда модель будет готова! ✅');
          // TODO: Запустить процесс обучения
        }
        break;
      }

      case 'action_cancel': {
        photoCollector.cancelSession(userId);
        await bot.telegram.sendMessage(chatId, '❌ Обучение отменено');
        break;
      }
    }
  }

  private async handleTrainHelp(runtime: IAgentRuntime, chatId: number, bot: any): Promise<void> {
    const helpText = `🎨 Обучение персональной ИИ-модели\n\n` +
      `Что это?\n` +
      `Создай свою собственную ИИ-модель для генерации изображений! 🚀\n` +
      `Загрузи фото своего лица → Получи модель → Генерируй крутые арты с собой!\n\n` +
      `Как использовать:\n\n` +
      `1️⃣ Начни обучение:\n` +
      `/train start ИмяМодели trigger_word\n` +
      `Например: /train start Максим max_portrait\n\n` +
      `2️⃣ Загрузи 10-20 фото:\n` +
      `📸 Разные ракурсы (анфас, профиль, 3/4)\n` +
      `💡 Хорошее освещение\n` +
      `👤 Только твоё лицо\n` +
      `✨ Качественные фото\n\n` +
      `3️⃣ Подтверди обучение:\n` +
      `Нажми кнопку "✅ Подтвердить" после загрузки фото\n\n` +
      `4️⃣ Жди 2-5 минут ⚡️\n` +
      `Тестовый режим: 1 шаг обучения\n\n` +
      `5️⃣ Проверь что всё работает! ✅\n\n` +
      `Другие команды:\n` +
      `• /train cancel - отменить сбор\n\n` +
      `💡 Это тест: Модель не будет идеальной, но покажет что пайплайн работает!`;

    const buttons: UIElement[] = [
      { type: 'inline_callback', text: '🚀 Начать сейчас', callback_data: 'quick_train_start' },
      { type: 'inline_url', text: '📖 Документация', url: 'https://docs.fal.ai/flux/lora-training' },
    ];

    await this.sendMessageWithButtons(chatId, helpText, buttons, bot);
  }

  private async handleTrainStart(runtime: IAgentRuntime, userId: string, chatId: number, text: string, bot: any): Promise<void> {
    const parts = text.split(' ').filter(p => p.trim());

    if (parts.length < 4) {
      await bot.telegram.sendMessage(chatId,
        `❌ Неправильный формат!\n\n` +
        `Использование:\n` +
        `/train start <название> <триггер>\n\n` +
        `Пример:\n` +
        `/train start МоёЛицо my_face\n\n` +
        `⚡️ Тестовый режим: 1 шаг (~2-5 мин)\n` +
        `Для быстрой проверки что всё работает`
      );
      return;
    }

    const faceName = parts[2];
    const triggerWord = parts[3];
    const steps = 1; // Тестовый режим
    const qualityEmoji = '⚡️';
    const qualityText = 'Тест (1 шаг)';
    const timeEstimate = '2-5 минут';

    // Создаём сессию
    const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);
    if (!photoCollector) {
      await bot.telegram.sendMessage(chatId, '❌ Сервис обучения не инициализирован');
      return;
    }

    const session = photoCollector.createSession(userId, faceName, triggerWord);
    (session as any).steps = steps;

    const startText = `🎉 Отлично! Начинаем обучение модели "${faceName}"\n\n` +
      `🎯 Триггерное слово: ${triggerWord}\n` +
      `Его нужно будет использовать при генерации: "a photo of ${triggerWord}"\n\n` +
      `${qualityEmoji} Качество: ${qualityText} (${steps} шагов)\n` +
      `⏱️ Время обучения: ~${timeEstimate}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📸 ШАГ 1: Отправь фотографии (прямо сейчас!)\n\n` +
      `Что нужно:\n` +
      `✅ 10-20 фото своего лица\n` +
      `✅ Разные ракурсы (анфас, профиль, 3/4)\n` +
      `✅ Разное освещение и фон\n` +
      `✅ Разные эмоции\n\n` +
      `Что НЕ нужно:\n` +
      `❌ Групповые фото (только ты!)\n` +
      `❌ Солнечные очки/маски\n` +
      `❌ Размытые или тёмные фото\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📤 ШАГ 2: После загрузки фото нажми кнопку:\n\n` +
      `💡 Бот будет показывать прогресс после каждого фото`;

    const startButtons: UIElement[] = [
      { type: 'inline_callback', text: '✅ Подтвердить и начать обучение', callback_data: 'train_confirm' },
      { type: 'inline_callback', text: '❌ Отменить', callback_data: 'train_cancel' },
    ];

    await this.sendMessageWithButtons(chatId, startText, startButtons, bot);
    logger.info(`[TelegramCommandsService] Started session for ${userId}: ${faceName}`);
  }

  private async handleTrainCancel(runtime: IAgentRuntime, userId: string, chatId: number, bot: any): Promise<void> {
    const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector' as any);
    if (!photoCollector) {
      await bot.telegram.sendMessage(chatId, '❌ Сервис обучения не инициализирован');
      return;
    }

    const session = photoCollector.getActiveSession(userId);
    if (!session) {
      await bot.telegram.sendMessage(chatId, '❌ Нет активной сессии обучения.');
      return;
    }

    photoCollector.cancelSession(userId);
    await bot.telegram.sendMessage(chatId,
      `✅ Сессия обучения "${session.faceName}" отменена.\n\n` +
      `Собрано было: ${session.photos.length} фото`
    );
  }

  private async sendMessageWithButtons(chatId: number, text: string, uiElements: UIElement[], bot: any): Promise<void> {
    try {
      // Конвертируем ui_elements в reply_markup
      let replyMarkup: any = undefined;
      if (uiElements && uiElements.length > 0) {
        const markup = TelegramUIGenerator.convertToTelegramMarkup(uiElements);
        replyMarkup = markup.inline_keyboard.length > 0 ? { inline_keyboard: markup.inline_keyboard } : undefined;
      }

      // Отправляем сообщение
      await bot.telegram.sendMessage(chatId, text, {
        reply_markup: replyMarkup,
      });

      logger.info(`[TelegramCommandsService] 📤 Sent message with ${uiElements?.length || 0} buttons`);
    } catch (error) {
      logger.error('[TelegramCommandsService] ❌ Error sending message:', error);
      throw error;
    }
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramCommandsService> {
    const service = new TelegramCommandsService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TelegramCommandsService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
