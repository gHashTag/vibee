/**
 * Content Callback Handler Plugin
 *
 * Обрабатывает inline кнопки из RSS постов и управляет workflow создания контента
 */

import { Service, Plugin, type IAgentRuntime, logger } from '@elizaos/core';
import { keyboard } from './telegram-keyboards';

/**
 * Сервис для обработки callback'ов от inline кнопок
 */
class ContentCallbackHandlerService extends Service {
  static serviceType = 'content-callback-handler';

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new ContentCallbackHandlerService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[CallbackHandler] Stopped');
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[CallbackHandler] 🎛️ Initializing callback handler...');

    // Ждем Telegram сервис
    await this.waitForTelegramService(runtime);

    logger.info('[CallbackHandler] ✅ Callback handler ready');
  }

  /**
   * Ждем, пока Telegram сервис станет доступен
   */
  private async waitForTelegramService(runtime: IAgentRuntime): Promise<void> {
    for (let i = 0; i < 20; i++) {
      const telegramService = runtime.getService('telegram');
      if (telegramService) {
        await this.setupCallbackHandlers(runtime, telegramService);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logger.warn('[CallbackHandler] ⚠️ Telegram service not available after 10s');
  }

  /**
   * Настроить обработчики callback'ов
   */
  private async setupCallbackHandlers(runtime: IAgentRuntime, telegramService: any): Promise<void> {
    const bot = telegramService.bot;
    if (!bot) {
      logger.warn('[CallbackHandler] ⚠️ Telegram bot not available');
      return;
    }

    // Обработчик callback_query
    bot.on('callback_query', async (ctx: any) => {
      try {
        const callbackRaw = ctx.callbackQuery.data;
        const userId = ctx.from.id.toString();
        const chatId = ctx.chat.id;
        const messageId = ctx.callbackQuery.message.message_id;

        logger.info(`[CallbackHandler] Received callback: ${callbackRaw}`);

        // Обрабатываем короткие callback'и для создания Reels
        if (callbackRaw.startsWith('reels:')) {
          const newsId = callbackRaw.split(':')[1];
          await this.handleCreateReels(runtime, ctx, newsId, userId, chatId, messageId);
          return;
        }

        // Обработка перегенерации поста новости
        if (callbackRaw.startsWith('regen_post:')) {
          const newsId = callbackRaw.split(':')[1];
          await this.handleRegeneratePost(runtime, ctx, newsId, chatId, messageId);
          return;
        }

        if (callbackRaw === 'skip') {
          await ctx.answerCbQuery('Новость пропущена');
          await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
          return;
        }

        // Обработка хуков для контента
        if (callbackRaw.startsWith('hook_')) {
          const hookType = callbackRaw.split('_')[1];
          await this.handleSelectHook(runtime, ctx, userId, chatId, hookType);
          return;
        }

        // Обработка голосов
        if (callbackRaw.startsWith('voice_')) {
          const voice = callbackRaw.split('_')[1];
          await this.handleSelectVoice(runtime, ctx, userId, chatId, voice);
          return;
        }

        // Навигация
        if (callbackRaw.startsWith('back_')) {
          const target = callbackRaw.split('_')[1];
          await this.handleGoBack(runtime, ctx, userId, chatId, target);
          return;
        }

        // Остальные callback'и - короткие строки
        switch (callbackRaw) {
          // Обработка текста
          case 'approve_text':
            await this.handleApproveText(runtime, ctx, userId, chatId, messageId);
            break;

          case 'regen_text':
            await this.handleRegenerateText(runtime, ctx, userId, chatId, messageId);
            break;

          case 'regen_hook':
            await this.handleRegenerateHooks(runtime, ctx, userId, chatId);
            break;

          // Обработка аудио
          case 'approve_audio':
            await this.handleApproveAudio(runtime, ctx, userId, chatId, messageId);
            break;

          case 'regen_audio':
            await this.handleRegenerateAudio(runtime, ctx, userId, chatId, messageId);
            break;

          // Обработка изображений
          case 'approve_prompt':
            await this.handleApproveImagePrompt(runtime, ctx, userId, chatId, messageId);
            break;

          case 'edit_prompt':
            await this.handleEditImagePrompt(runtime, ctx, userId, chatId);
            break;

          case 'approve_image':
            await this.handleApproveImage(runtime, ctx, userId, chatId, messageId);
            break;

          case 'regen_image':
            await this.handleRegenerateImage(runtime, ctx, userId, chatId, messageId);
            break;

          // Финальные действия
          case 'content_publish':
          case 'content_save':
          case 'regen_video':
          case 'content_finish':
            await this.handleFinalAction(runtime, ctx, userId, chatId, callbackRaw);
            break;

          case 'cancel':
            await this.handleCancelWorkflow(runtime, ctx, userId, chatId);
            break;

          // Простые кнопки для запуска диалога
          case 'show_commands':
            await this.handleShowCommands(runtime, ctx, chatId);
            break;

          case 'show_news':
            await this.handleShowNews(runtime, ctx, chatId);
            break;

          default:
            logger.warn(`[CallbackHandler] Unknown callback: ${callbackRaw}`);
        }
      } catch (error) {
        logger.error('[CallbackHandler] Error handling callback:', error);
        try {
          await ctx.answerCbQuery('Произошла ошибка. Попробуйте еще раз.');
        } catch (e) {
          // Ignore answerCbQuery errors
        }
      }
    });

    logger.info('[CallbackHandler] ✅ Callback handlers registered');
  }

  /**
   * Обработать "Создать Reels"
   */
  private async handleCreateReels(
    runtime: IAgentRuntime,
    ctx: any,
    newsId: string,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую текст для Reels...');

    // Убираем кнопки из исходного сообщения
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    // Получаем Content Creation сервис
    const contentService = runtime.getService('content-creation');
    if (!contentService) {
      await ctx.reply('❌ Content Creation сервис недоступен');
      return;
    }

    // Получаем данные новости из кэша
    const newsCache = (global as any).newsCache;
    if (!newsCache || !newsCache.has(newsId)) {
      await ctx.reply('❌ Данные новости не найдены. Попробуйте еще раз.');
      return;
    }

    const newsData = newsCache.get(newsId);
    contentService.createSession(userId, newsData);

    // Показываем выбор хуков
    await ctx.reply(
      '🎯 **Шаг 1: Выбери стиль хука для текста**\n\n' +
      'Выбери, как будет начинаться твой Reels:\n\n' +
      '1️⃣ **Агрессивный/Хайповый** - цепляет внимание сразу\n' +
      '   Пример: "Стоп! Скролл. Это изменит ВСЁ!"\n\n' +
      '2️⃣ **Профессиональный** - экспертный подход\n' +
      '   Пример: "Важное обновление для AI-разработчиков"\n\n' +
      '3️⃣ **Сторителлинг** - эмоциональная подача\n' +
      '   Пример: "Я ждал этого 5 лет. И вот оно случилось"',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.pattern('content_hooks'),
      }
    );
  }

  /**
   * Перегенерировать пост новости
   */
  private async handleRegeneratePost(
    runtime: IAgentRuntime,
    ctx: any,
    newsId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Перегенерирую пост...');

    // Получаем RSS Monitor сервис для перегенерации
    const rssService = runtime.getService('rss-monitor');
    if (!rssService) {
      await ctx.reply('❌ RSS Monitor сервис недоступен');
      return;
    }

    // Получаем данные новости из кэша
    const newsCache = (global as any).newsCache;
    if (!newsCache || !newsCache.has(newsId)) {
      await ctx.reply('❌ Данные новости не найдены. Попробуйте еще раз.');
      return;
    }

    const newsData = newsCache.get(newsId);

    // Генерируем новый пост
    const newContent = await rssService.generateSocialContent(runtime, { name: 'RSS Feed', topics: [] }, newsData);

    // Создаем кнопки заново
    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Создать сценарий для Reels', callback_data: `reels:${newsId}` }],
        [{ text: '🔄 Перегенерировать пост', callback_data: `regen_post:${newsId}` }],
      ],
    };

    // Заменяем старое сообщение на новое
    try {
      await ctx.telegram.editMessageText(chatId, messageId, null, newContent, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      // Если не удалось отредактировать, отправляем новое сообщение
      await ctx.reply(newContent, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  /**
   * Выбрать тип хука
   */
  private async handleSelectHook(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    hookType: string
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую текст с выбранным хуком...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    const newsData = {
      title: session.newsTitle,
      link: session.newsLink,
      contentSnippet: session.newsContent || '',
    };

    const reelsText = await contentService.generateReelsTextWithHook(runtime, newsData, hookType);
    contentService.updateSession(userId, {
      reelsText,
      hookType: hookType as any,
      step: 'text'
    });

    const hookEmoji = hookType === 'aggressive' ? '🔥' : hookType === 'professional' ? '💼' : '📖';

    await ctx.reply(
      `${hookEmoji} **ТЕКСТ С ХУКОМ "${hookType.toUpperCase()}":**\n\n${reelsText}\n\n⏱️ Длина: ~${Math.ceil(reelsText.split(' ').length / 3)} секунд`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.pattern('confirm_cancel'),
      }
    );
  }

  /**
   * Выбрать голос
   */
  private async handleSelectVoice(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    voice: string
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую аудио с выбранным голосом...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.reelsText) {
      await ctx.reply('❌ Текст не найден');
      return;
    }

    try {
      const audioPath = await contentService.generateFullAudio(runtime, session.reelsText, voice as any);
      contentService.updateSession(userId, {
        audioUrl: audioPath,
        selectedVoice: voice as any,
        step: 'audio'
      });

      const voiceEmoji = voice === 'nova' ? '👩' : voice === 'alloy' ? '🎤' : '🎭';
      await ctx.replyWithAudio(
        { source: audioPath },
        {
          caption: `${voiceEmoji} Аудио с голосом "${voice.toUpperCase()}" готово!`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Одобрить аудио', callback_data: 'approve_audio' },
                { text: '🔄 Перегенерировать', callback_data: 'regen_audio' },
              ],
              [
                { text: '⏮️ К выбору голоса', callback_data: 'back_to_text' },
                { text: '❌ Отменить', callback_data: 'cancel' },
              ],
            ],
          },
        }
      );
    } catch (error) {
      logger.error('[CallbackHandler] Failed to generate full audio:', error);
      await ctx.reply('❌ Ошибка генерации аудио. Попробуйте еще раз.');
    }
  }

  /**
   * Вернуться к предыдущему шагу
   */
  private async handleGoBack(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    target: string
  ): Promise<void> {
    await ctx.answerCbQuery('Возвращаюсь...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    switch (target) {
      case 'text': {
        // К тексту - показываем выбор хуков
        const newsData = {
          title: session.newsTitle,
          link: session.newsLink,
          contentSnippet: session.newsContent || '',
        };

        await ctx.reply(
          '🎯 **Выбери стиль хука для текста:**\n\n' +
          '1️⃣ **Агрессивный/Хайповый** - цепляет внимание сразу\n' +
          '2️⃣ **Профессиональный** - экспертный подход\n' +
          '3️⃣ **Сторителлинг** - эмоциональная подача',
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard.pattern('content_hooks'),
          }
        );
        break;
      }

      case 'image': {
        // К изображению - показываем промпт
        if (!session.imagePrompt) {
          await ctx.reply('❌ Промпт не найден');
          return;
        }

        await ctx.reply(`🎨 **ПРОМПТ ДЛЯ ИЗОБРАЖЕНИЯ:**\n\n\`${session.imagePrompt}\``, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Генерировать изображение', callback_data: 'approve_prompt' },
                { text: '✏️ Редактировать промпт', callback_data: 'edit_prompt' },
              ],
              [{ text: '⏮️ Назад к аудио', callback_data: 'back_to_text' }],
            ],
          },
        });
        break;
      }
    }
  }

  /**
   * Перегенерировать хуки
   */
  private async handleRegenerateHooks(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую новые варианты хуков...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    await ctx.reply(
      '🎯 **Выбери стиль хука для текста:**\n\n' +
      '1️⃣ **Агрессивный/Хайповый** - цепляет внимание сразу\n' +
      '2️⃣ **Профессиональный** - экспертный подход\n' +
      '3️⃣ **Сторителлинг** - эмоциональная подача',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.pattern('content_hooks'),
      }
    );
  }

  /**
   * Финальные действия
   */
  private async handleFinalAction(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    action: string
  ): Promise<void> {
    await ctx.answerCbQuery('Выполняю действие...');

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.videoUrl) {
      await ctx.reply('❌ Видео не найдено');
      return;
    }

    switch (action) {
      case 'content_publish':
        await ctx.reply('📤 **Публикация:**\n\nФункция публикации в Instagram/TikTok будет доступна в следующей версии!\n\nПока можно:\n1. Скачать видео из сообщения\n2. Загрузить вручную в соцсети');
        break;

      case 'content_save':
        await ctx.reply('💾 **Сохранение:**\n\nВидео сохранено в базе данных!\n\nID: `' + session.videoUrl.slice(-10) + '`\nДата: ' + new Date().toLocaleDateString('ru-RU'));
        break;

      case 'regen_video':
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await this.handleApproveImage(runtime, ctx, userId, chatId, ctx.callbackQuery.message.message_id);
        return;

      case 'content_finish':
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        contentService.deleteSession(userId);
        await ctx.reply('🎉 **Готово!** Создание контента завершено. Можете создавать новый!');
        return;
    }
  }

  /**
   * Одобрить текст → Выбор голоса
   */
  private async handleApproveText(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Показываю выбор голосов...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.reelsText) {
      await ctx.reply('❌ Сессия не найдена. Начните заново.');
      return;
    }

    // Показываем выбор голосов
    await ctx.reply(
      '🎧 **Шаг 2: Выбери голос для озвучки**\n\n' +
      'Выбери, каким голосом будет рассказан твой Reels:\n\n' +
      '👩 **Nova - Энергичный** (женский голос, рекомендуется)\n' +
      '   Характеристика: Яркий, энергичный, идеально для Reels\n\n' +
      '🎤 **Alloy - Нейтральный** (универсальный)\n' +
      '   Характеристика: Чистый, понятный, подходит для любого контента\n\n' +
      '🎭 **Fable - Британский** (экспрессивный)\n' +
      '   Характеристика: Акцент, выразительный, запоминающийся',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.pattern('content_voices'),
      }
    );
  }

  /**
   * Перегенерировать текст
   */
  private async handleRegenerateText(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую новый текст...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    const newsData = {
      title: session.newsTitle,
      link: session.newsLink,
      contentSnippet: session.newsContent || '',
    };

    const reelsText = await contentService.generateReelsText(runtime, newsData);
    contentService.updateSession(userId, { reelsText });

    await ctx.reply(
      `📝 **НОВЫЙ ТЕКСТ:**\n\n${reelsText}\n\n⏱️ Длина: ~${Math.ceil(reelsText.split(' ').length / 3)} секунд`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Одобрить', callback_data: 'approve_text' },
              { text: '🔄 Перегенерировать еще раз', callback_data: 'regen_text' },
            ],
            [{ text: '❌ Отменить', callback_data: 'cancel' }],
          ],
        },
      }
    );
  }

  /**
   * Одобрить аудио → Генерировать промпт для изображения
   */
  private async handleApproveAudio(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую промпт для изображения...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.reelsText) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    const newsData = {
      title: session.newsTitle,
      link: session.newsLink,
      contentSnippet: session.newsContent || '',
    };

    const imagePrompt = await contentService.generateImagePrompt(runtime, session.reelsText, newsData);
    contentService.updateSession(userId, { imagePrompt, step: 'image_prompt' });

    await ctx.reply(`🎨 **ПРОМПТ ДЛЯ ИЗОБРАЖЕНИЯ:**\n\n\`${imagePrompt}\``, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Генерировать изображение', callback_data: 'approve_prompt' },
            { text: '✏️ Редактировать промпт', callback_data: 'edit_prompt' },
          ],
          [{ text: '❌ Отменить', callback_data: 'cancel' }],
        ],
      },
    });
  }

  /**
   * Перегенерировать аудио
   */
  private async handleRegenerateAudio(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую новое аудио...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.reelsText) {
      await ctx.reply('❌ Сессия не найдена');
      return;
    }

    try {
      const audioPath = await contentService.generateAudio(runtime, session.reelsText);
      contentService.updateSession(userId, { audioUrl: audioPath });

      await ctx.replyWithAudio(
        { source: audioPath },
        {
          caption: '🎧 Новое аудио сгенерировано.',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Одобрить', callback_data: 'approve_audio' },
                { text: '🔄 Перегенерировать еще раз', callback_data: 'regen_audio' },
              ],
              [{ text: '❌ Отменить', callback_data: 'cancel' }],
            ],
          },
        }
      );
    } catch (error) {
      await ctx.reply('❌ Ошибка генерации аудио');
    }
  }

  /**
   * Одобрить промпт → Генерировать изображение
   */
  private async handleApproveImagePrompt(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую изображение... Это может занять ~30 секунд');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.imagePrompt) {
      await ctx.reply('❌ Промпт не найден');
      return;
    }

    try {
      const imageUrl = await contentService.generateImage(session.imagePrompt);
      contentService.updateSession(userId, { imageUrl, step: 'image' });

      await ctx.replyWithPhoto(imageUrl, {
        caption: '🖼️ Изображение готово!',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Создать видео', callback_data: 'approve_image' },
              { text: '🔄 Перегенерировать', callback_data: 'regen_image' },
            ],
            [{ text: '❌ Отменить', callback_data: 'cancel' }],
          ],
        },
      });
    } catch (error) {
      logger.error('[CallbackHandler] Failed to generate image:', error);
      await ctx.reply('❌ Ошибка генерации изображения. Проверьте FAL_KEY в переменных окружения.');
    }
  }

  /**
   * Редактировать промпт для изображения
   */
  private async handleEditImagePrompt(runtime: IAgentRuntime, ctx: any, userId: string, chatId: number): Promise<void> {
    await ctx.answerCbQuery('Отправьте новый промпт сообщением');
    await ctx.reply('✏️ Отправьте новый промпт для изображения (на английском):');

    // TODO: Добавить обработчик текстовых сообщений для редактирования промпта
  }

  /**
   * Одобрить изображение → Генерировать lip sync видео
   */
  private async handleApproveImage(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Создаю видео с lip sync... Это займет ~60 секунд');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.imageUrl || !session.audioUrl) {
      await ctx.reply('❌ Не хватает данных для создания видео');
      return;
    }

    try {
      const videoUrl = await contentService.generateLipSyncVideo(session.imageUrl, session.audioUrl);
      contentService.updateSession(userId, { videoUrl, step: 'lipsync' });

      await ctx.replyWithVideo(videoUrl, {
        caption: `🎬 **REELS ГОТОВ!**\n\n✅ Видео с lip sync создано\n📊 Формат: 720x1280 (9:16)\n🔗 Новость: ${session.newsLink}`,
        parse_mode: 'Markdown',
      });

      // Показываем финальное меню
      await ctx.reply(
        '🎉 **Видео готово! Что дальше?**\n\n' +
        'Выбери, что хочешь сделать с готовым Reels:',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard.pattern('content_final'),
        }
      );
    } catch (error) {
      logger.error('[CallbackHandler] Failed to generate lip sync video:', error);
      await ctx.reply('❌ Ошибка генерации видео. Проверьте настройки Fal.ai.');
    }
  }

  /**
   * Перегенерировать изображение
   */
  private async handleRegenerateImage(
    runtime: IAgentRuntime,
    ctx: any,
    userId: string,
    chatId: number,
    messageId: number
  ): Promise<void> {
    await ctx.answerCbQuery('Генерирую новое изображение...');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const contentService = runtime.getService('content-creation');
    const session = contentService.getSession(userId);
    if (!session || !session.imagePrompt) {
      await ctx.reply('❌ Промпт не найден');
      return;
    }

    try {
      const imageUrl = await contentService.generateImage(session.imagePrompt);
      contentService.updateSession(userId, { imageUrl });

      await ctx.replyWithPhoto(imageUrl, {
        caption: '🖼️ Новое изображение готово!',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Создать видео', callback_data: 'approve_image' },
              { text: '🔄 Перегенерировать еще раз', callback_data: 'regen_image' },
            ],
            [{ text: '❌ Отменить', callback_data: 'cancel' }],
          ],
        },
      });
    } catch (error) {
      await ctx.reply('❌ Ошибка генерации изображения');
    }
  }

  /**
   * Отменить workflow
   */
  private async handleCancelWorkflow(runtime: IAgentRuntime, ctx: any, userId: string, chatId: number): Promise<void> {
    await ctx.answerCbQuery('Workflow отменен');

    const contentService = runtime.getService('content-creation');
    contentService?.deleteSession(userId);

    await ctx.reply('❌ Создание контента отменено');
  }

  /**
   * Показать список команд
   */
  private async handleShowCommands(runtime: IAgentRuntime, ctx: any, chatId: number): Promise<void> {
    await ctx.answerCbQuery('Показываю команды...');

    await ctx.reply(
      '📋 <b>Доступные команды:</b>\n\n' +
      '🚀 <b>Основные:</b>\n' +
      '/start - Начать работу с ботом\n' +
      '/menu - Главное меню\n' +
      '/help - Помощь и справка\n\n' +
      '💬 <b>Общение:</b>\n' +
      'Просто напиши свой вопрос на русском!\n' +
      'Я умею общаться как человек и помогу с:\n' +
      '• Вопросами по разработке\n' +
      '• Примерами кода\n' +
      '• Решением ошибок\n' +
      '• Обучением технологиям\n\n' +
      '📰 <b>Новости:</b>\n' +
      '• "покажи новости" - последние новости из мира разработки\n' +
      '• "создай рилз" - создам контент для Reels\n\n' +
      '💡 <b>Совет:</b> Просто общайся со мной как с коллегой!',
      {
        parse_mode: 'HTML',
      }
    );
  }

  /**
   * Показать новости
   */
  private async handleShowNews(runtime: IAgentRuntime, ctx: any, chatId: number): Promise<void> {
    await ctx.answerCbQuery('Показываю новости...');

    // Получаем кэш новостей
    const newsCache = (global as any).newsCache;
    if (!newsCache || newsCache.size === 0) {
      await ctx.reply(
        '📭 Пока нет новостей в кэше.\n\n' +
        'RSS-монитор ищет интересные новости из мира разработки. ' +
        'Попробуй через минуту!'
      );
      return;
    }

    // Берем последние 2 новости
    const newsEntries = Array.from(newsCache.entries()).slice(-2);

    for (const [newsId, newsData] of newsEntries) {
      const newsText = `📰 <b>${newsData.title}</b>\n\n${newsData.contentSnippet || ''}\n\n🔗 ${newsData.link}`;

      await ctx.reply(newsText, {
        parse_mode: 'HTML',
      });
    }

    await ctx.reply(
      '💬 Хочешь создать контент из этих новостей? Просто напиши "создай рилз" или "создай пост"!'
    );
  }
}

export const contentCallbackHandlerPlugin: Plugin = {
  name: 'content-callback-handler',
  description: 'Handles inline button callbacks for content creation workflow',
  services: [ContentCallbackHandlerService],
  actions: [],
};

export default contentCallbackHandlerPlugin;
