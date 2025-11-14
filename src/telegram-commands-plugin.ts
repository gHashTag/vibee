/**
 * Telegram Commands Plugin для Vibee
 * Добавляет стандартные команды: /start, /menu, /help
 * Использует события Telegram вместо action'ов для корректной обработки команд
 */

import {
  Plugin,
  Action,
  ActionResult,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  logger,
  Service,
  EventType,
} from '@elizaos/core';
import type { UIElement } from './telegram-ui-plugin';

// ========================================
// SERVICE ДЛЯ ОБРАБОТКИ КОМАНД
// ========================================

class TelegramCommandsService extends Service {
  static serviceType = 'telegram-commands';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramCommandsService> {
    const service = new TelegramCommandsService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🎯 TelegramCommandsService initializing...');

    // Ждём Telegram Service чтобы установить команды бота
    const maxAttempts = 20;
    let telegramService = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService && telegramService.bot) {
        logger.info('[TelegramCommandsService] ✅ Found TelegramService with bot');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Устанавливаем команды бота
    if (telegramService && telegramService.bot) {
      try {
        await telegramService.bot.telegram.setMyCommands([
          { command: 'start', description: '🚀 Начать работу с ботом' },
          { command: 'menu', description: '📋 Главное меню' },
          { command: 'help', description: '❓ Помощь и справка' },
          { command: 'quickstart', description: '⚡ Быстрый старт в разработке' },
          { command: 'tools', description: '🔧 Топ инструменты 2025' },
          { command: 'ai', description: '🤖 AI в разработке' },
          { command: 'tts', description: '🎤 Создать голосовое' },
          { command: 'news', description: '📰 Проверить новости сейчас' },
          { command: 'chat', description: '💬 Чат VibeMates' },
          { command: 'mate', description: '🤖 Выбрать VibeMate' },
        ]);
        logger.info('✅ Bot commands set successfully');
      } catch (error) {
        logger.error('❌ Failed to set bot commands:', error);
      }
    }

    // Слушаем событие /start от Telegram
    runtime.on('TELEGRAM_SLASH_START', async (data: any) => {
      logger.info('🚀 TELEGRAM_SLASH_START event received!', data);
      await this.handleStartCommand(runtime, data);
    });

    // Слушаем входящие сообщения для /menu, /help, /train
    runtime.on('TELEGRAM_MESSAGE_RECEIVED', async (data: any) => {
      console.log('🔥 TELEGRAM_MESSAGE_RECEIVED CALLED! data =', data);
      const message = data.memory || data.message || data;
      console.log('🔥 message =', message);
      if (!message?.content) {
        console.log('❌ No content in message');
        return;
      }

      const text = (message.content.text || '').trim().toLowerCase();
      console.log('🔥 Message text =', text);
      logger.info(`📨 Telegram message: "${text}"`);

      if (text === '/menu' || text === 'menu' || text === 'меню') {
        logger.info('✅ /menu command');
        await this.handleMenuCommand(runtime, message);
      } else if (text === '/help' || text === 'help' || text === 'помощь') {
        logger.info('✅ /help command');
        await this.handleHelpCommand(runtime, message);
      } else if (text === 'покажи новости' || text === 'новости' || text === 'пришли новости') {
        logger.info('✅ Show news command');
        await this.handleShowNewsCommand(runtime, message);
      } else if (text.startsWith('/quickstart') || text === 'быстрый старт' || text === 'quickstart') {
        logger.info('✅ /quickstart command');
        await this.handleQuickstartCommand(runtime, message);
      } else if (text.startsWith('/tools') || text === 'инструменты' || text === 'tools' || text === 'топ инструменты') {
        logger.info('✅ /tools command');
        await this.handleToolsCommand(runtime, message);
      } else if (text.startsWith('/ai') || text === 'ai' || text.includes('искусственный интеллект') || text.includes('ai в разработке')) {
        logger.info('✅ /ai command');
        await this.handleAICommand(runtime, message);
      } else if (text.startsWith('/tts') || text === 'tts' || text === 'голосовое' || text.startsWith('озвучь')) {
        logger.info('✅ /tts command');
        await this.handleTTSCommand(runtime, message);
      } else if (text.startsWith('/news') || text === 'news' || text === 'новости' || text === 'проверить новости') {
        logger.info('✅ /news command');
        await this.handleNewsCommand(runtime, message);
      } else if (text.startsWith('/chat') || text === 'chat' || text === 'чат' || text === 'чат вибимейтс') {
        logger.info('✅ /chat command');
        await this.handleChatCommand(runtime, message);
      } else if (text.startsWith('/mate') || text === 'mate' || text === 'вибимейт' || text === 'выбрать учителя') {
        logger.info('✅ /mate command');
        await this.handleMateCommand(runtime, message);
      }
    });

    logger.info('✅ TelegramCommandsService initialized - listening for TELEGRAM_SLASH_START and TELEGRAM_MESSAGE_RECEIVED');
  }

  async handleStartCommand(runtime: IAgentRuntime, data: any): Promise<void> {
    logger.info('🎯 handleStartCommand called with data:', data);

    // Получаем ctx из события
    const ctx = data.ctx;
    if (!ctx) {
      logger.error('❌ No ctx in TELEGRAM_SLASH_START event');
      return;
    }

    const userName = ctx.from?.first_name || ctx.from?.username || 'друг';

    const welcomeText = `👋 Привет, ${userName}!

Я **Vibee** - твой AI-наставник по vibe-coding и современной разработке!

🚀 **Что я умею:**
• Обучать современным технологиям
• Показывать примеры кода
• Помогать с ошибками
• Делиться best practices
• Рекомендовать инструменты

💡 **Выбери раздел:**`;

    const buttons = {
      inline_keyboard: [
        [{ text: '🎨 Обучение модели', callback_data: 'menu_training' }],
        [{ text: '📚 Обучение', callback_data: 'menu_learning' }],
        [{ text: '🔧 Инструменты', callback_data: 'menu_tools' }],
        [{ text: '💻 Примеры кода', callback_data: 'menu_examples' }],
        [{ text: '❓ Помощь', callback_data: 'menu_help' }],
      ],
    };

    try {
      // Отправляем напрямую через Telegram API с кнопками
      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
      logger.info('✅ Sent /start response with buttons successfully');
    } catch (error) {
      logger.error('❌ Failed to send /start response:', error);
    }
  }

  async handleMenuCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('📋 Handling menu command');

    // Получаем Telegram service
    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      logger.error('❌ TelegramService not available');
      return;
    }

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) {
      logger.error('❌ No chatId in message');
      return;
    }

    const menuText = `📋 **Главное меню Vibee**

Выбери раздел, который тебя интересует:`;

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

    try {
      await telegramService.bot.telegram.sendMessage(chatId, menuText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
      logger.info('✅ Menu sent successfully with buttons');
    } catch (error) {
      logger.error('❌ Failed to send menu:', error);
    }
  }

  async handleShowNewsCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('📰 Handling show news command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      logger.error('❌ TelegramService not available');
      return;
    }

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) {
      logger.error('❌ No chatId in message');
      return;
    }

    // Получаем кэш новостей
    const newsCache = (global as any).newsCache;
    if (!newsCache || newsCache.size === 0) {
      await telegramService.bot.telegram.sendMessage(
        chatId,
        '📭 Пока нет новостей в кэше. Подождите немного, RSS-монитор найдет интересные новости!',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Берем последние 3 новости
    const newsEntries = Array.from(newsCache.entries()).slice(-3);

    for (const [newsId, newsData] of newsEntries) {
      const newsText = `📰 **${newsData.title}**\n\n${newsData.contentSnippet || ''}\n\n🔗 ${newsData.link}`;

      const keyboardMarkup = {
        inline_keyboard: [
          [
            { text: '📝 Создать сценарий для Reels', callback_data: `reels:${newsId}` },
          ],
        ],
      };

      await telegramService.bot.telegram.sendMessage(chatId, newsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboardMarkup,
      });
    }
  }

  async handleHelpCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('❓ Handling help command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      logger.error('❌ TelegramService not available');
      return;
    }

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) {
      logger.error('❌ No chatId in message');
      return;
    }

    const helpText = `🆘 **Справка по Vibee**

**Доступные команды:**
/start - Начать работу с ботом
/menu - Показать главное меню
/help - Эта справка

**Как использовать:**
Просто пиши свои вопросы на русском языке! Я отвечу и добавлю интерактивные кнопки для удобства.

**Примеры вопросов:**
• "Как начать с vibe-coding?"
• "Покажи пример TypeScript кода"
• "Какие инструменты мне нужны?"
• "Помоги настроить Bun"

**Интерактивные элементы:**
Я автоматически добавляю кнопки, меню и клавиатуры в зависимости от контекста разговора!

**Нужна помощь?**
Просто спроси - я здесь, чтобы помочь! 💪`;

    const buttons = {
      inline_keyboard: [
        [{ text: '📖 Документация ElizaOS', url: 'https://docs.elizaos.ai' }],
        [{ text: '🚀 Vibe-coding гайд', url: 'https://bun.sh/docs' }],
        [{ text: '🔙 Назад в меню', callback_data: 'back_to_menu' }],
      ],
    };

    try {
      await telegramService.bot.telegram.sendMessage(chatId, helpText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
      logger.info('✅ Help sent successfully with buttons');
    } catch (error) {
      logger.error('❌ Failed to send help:', error);
    }
  }

  async handleQuickstartCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('⚡ Handling quickstart command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) {
      logger.error('❌ TelegramService not available');
      return;
    }

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) return;

    const quickstartText = `⚡ **Быстрый старт в разработке**

🚀 **3 шага к успеху:**

**1️⃣ Установи Bun** (быстрее Node.js)
\`\`\`bash
curl -fsSL https://bun.sh | bash
bun create next-app my-app
\`\`\`

**2️⃣ Добавь TypeScript**
\`\`\`bash
bun add typescript @types/node --save-dev
npx tsc --init
\`\`\`

**3️⃣ Подключи AI-помощника**
\`\`\`bash
npm install claude-api
\`\`\`

**Результат:** Готовая среда за 5 минут! 🎯

**Дальше:** изучай React, Next.js, AI-инструменты.

Что выбрать первым? 🤔`;

    const buttons = {
      inline_keyboard: [
        [{ text: '🎨 Начать с React', callback_data: 'learn_react' }],
        [{ text: '🤖 Изучить AI-инструменты', callback_data: 'learn_ai' }],
        [{ text: '📚 План развития', callback_data: 'learning_plan' }],
      ],
    };

    try {
      await telegramService.bot.telegram.sendMessage(chatId, quickstartText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
    } catch (error) {
      logger.error('❌ Failed to send quickstart:', error);
    }
  }

  async handleToolsCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('🔧 Handling tools command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) return;

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) return;

    const toolsText = `🔧 **ТОП-инструменты 2025**

**🚀 Основные:**
• **Bun** - замена Node.js (в 3 раза быстрее!)
• **TypeScript** - type safety по умолчанию
• **Next.js 15** - React король

**🤖 AI Coding:**
• **Cursor** / **Windsurf** - IDE с AI внутри
• **Claude 3.5 Sonnet** - лучший для кода
• **GitHub Copilot** - быстрые подсказки

**☁️ Cloud & БД:**
• **Supabase** - Postgres + Auth + Storage
• **Vercel** - деплой без боли
• **Drizzle ORM** - TypeScript-first

**🎨 UI & Стили:**
• **Tailwind CSS** - utility-first
• **Framer Motion** - анимации
• **Zustand** - простое состояние

**Какой инструмент изучить первым?** 💪`;

    const buttons = {
      inline_keyboard: [
        [{ text: '⚡ Bun', callback_data: 'tool_bun' }],
        [{ text: '🤖 Cursor', callback_data: 'tool_cursor' }],
        [{ text: '☁️ Supabase', callback_data: 'tool_supabase' }],
        [{ text: '🎨 Tailwind', callback_data: 'tool_tailwind' }],
      ],
    };

    try {
      await telegramService.bot.telegram.sendMessage(chatId, toolsText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
    } catch (error) {
      logger.error('❌ Failed to send tools:', error);
    }
  }

  async handleAICommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('🤖 Handling AI command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) return;

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) return;

    const aiText = `🤖 **AI в разработке - Полный гид**

**🎯 Что AI может делать:**
✅ Генерировать код по описанию
✅ Находить и исправлять баги
✅ Писать тесты и документацию
✅ Code review и предложения
✅ Объяснять сложный код
✅ Оптимизировать производительность

**🔥 Лучшие AI-инструменты:**

**1. Claude 3.5 Sonnet**
\`\`\`
Лучший для сложной логики
Понимает архитектуру
Супер для код-ревью
\`\`\`

**2. Cursor IDE**
\`\`\`
AI прямо в редакторе
Chat с кодом
Автодополнение
\`\`\`

**3. GitHub Copilot**
\`\`\`
Быстрые подсказки
Контекстные предложения
Inline suggestions
\`\`\`

**💡 Правила работы с AI:**
• Всегда проверяй код
• Понимай что делаешь
• Используй как напарника, не замену
• Задавай правильные вопросы

**Готов начать использовать AI? 🚀**`;

    const buttons = {
      inline_keyboard: [
        [{ text: '💻 Показать пример кода', callback_data: 'ai_example' }],
        [{ text: '🛠️ Настроить Cursor', callback_data: 'ai_setup' }],
        [{ text: '📚 Изучить промптинг', callback_data: 'ai_prompting' }],
      ],
    };

    try {
      await telegramService.bot.telegram.sendMessage(chatId, aiText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
    } catch (error) {
      logger.error('❌ Failed to send AI info:', error);
    }
  }

  async handleTTSCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('🎤 Handling TTS command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) return;

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) return;

    const ttsText = `🎤 **Генерация голоса (TTS)**

Умею превращать текст в речь! 🎧

**Как использовать:**
• Просто напишите любой текст
• Я автоматически создам аудио
• Поддерживаю разные голоса

**Примеры команд:**
\`Create TTS Привет, мир!\`
\`TEXT_TO_SPEECH Vibe coding - это круто!\`
\`Озвучь этот текст для подкаста\`

**Что можно озвучить:**
🎙️ Подкасты и аудиокниги
🎓 Обучающие материалы
🤖 Голосовые ассистенты
📱 Уведомления
🎮 Игровые персонажи

**Напишите текст для озвучивания:** ✨`;

    const buttons = {
      inline_keyboard: [
        [{ text: '🎤 Озвучить пример', callback_data: 'tts_demo' }],
        [{ text: '🔧 Настройки голоса', callback_data: 'tts_settings' }],
      ],
    };

    try {
      await telegramService.bot.telegram.sendMessage(chatId, ttsText, {
        parse_mode: 'Markdown',
        reply_markup: buttons,
      });
    } catch (error) {
      logger.error('❌ Failed to send TTS info:', error);
    }
  }

  async handleNewsCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('📰 Handling news command');

    const telegramService = runtime.getService('telegram');
    if (!telegramService || !telegramService.bot) return;

    const chatId = message.content.channelId || message.content.chatId;
    if (!chatId) return;

    try {
      // Получаем News Monitor Service
      const newsService = runtime.getService('news-monitor');
      if (!newsService) {
        await telegramService.bot.telegram.sendMessage(
          chatId,
          '❌ News Monitor сервис не запущен. Попробуйте позже.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Запускаем проверку новостей
      await telegramService.bot.telegram.sendMessage(
        chatId,
        '🔍 Проверяю новости по всем источникам...\n\nЭто займет 30-60 секунд ⏳',
        { parse_mode: 'Markdown' }
      );

      // Вызываем проверку новостей напрямую
      await newsService.checkNews(runtime);

      await telegramService.bot.telegram.sendMessage(
        chatId,
        '✅ Проверка новостей завершена!\n\nНовые новости отправлены в ваш чат автоматически.\n\nСледующая проверка через час ⏰',
        { parse_mode: 'Markdown' }
      );

      logger.info('✅ Manual news check completed');
    } catch (error) {
      logger.error('❌ Failed to check news:', error);
      await telegramService.bot.telegram.sendMessage(
        chatId,
        '❌ Ошибка при проверке новостей. Попробуйте позже.',
        { parse_mode: 'Markdown' }
      );
    }
  }

  async handleChatCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('💬 Handling chat command');

    const userId = message.content?.userId || message.userId || 'unknown';
    if (!userId) return;

    try {
      // Получаем VibeMates Chat Service
      const chatService = runtime.getService('vibemates-chat');
      if (!chatService) {
        await runtime.messageManager.create({
          userId,
          content: { text: '❌ VibeMates Chat сервис не запущен. Попробуйте позже.' },
          roomId: `direct-${userId}`,
        });
        return;
      }

      // Показываем чат
      await chatService.handleChatCommand(runtime, userId);

      logger.info('✅ VibeMates chat displayed');
    } catch (error) {
      logger.error('❌ Failed to show chat:', error);
      await runtime.messageManager.create({
        userId,
        content: { text: '❌ Ошибка при загрузке чата. Попробуйте позже.' },
        roomId: `direct-${userId}`,
      });
    }
  }

  async handleMateCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    logger.info('🤖 Handling mate command');

    const userId = message.content?.userId || message.userId || 'unknown';
    if (!userId) return;

    try {
      // Получаем VibeMates Commands Service
      const matesService = runtime.getService('vibemates-commands');
      if (!matesService) {
        await runtime.messageManager.create({
          userId,
          content: { text: '❌ VibeMates сервис не запущен. Попробуйте позже.' },
          roomId: `direct-${userId}`,
        });
        return;
      }

      // Показываем список VibeMates
      await matesService.handleMateCommand(runtime, message, {} as State);

      logger.info('✅ VibeMates list displayed');
    } catch (error) {
      logger.error('❌ Failed to show mates:', error);
      await runtime.messageManager.create({
        userId,
        content: { text: '❌ Ошибка при загрузке VibeMates. Попробуйте позже.' },
        roomId: `direct-${userId}`,
      });
    }
  }
}

// ========================================
// СТАРЫЙ КОД - оставляем для справки
// ========================================

const startCommandAction_DEPRECATED: Action = {
  name: 'TELEGRAM_START_COMMAND',
  description: 'Обрабатывает команду /start в Telegram',
  similes: ['/start', 'start', 'начать'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Проверяем что сообщение именно из Telegram
    if (message.content.source !== 'telegram') return false;

    const text = (message.content.text || '').trim().toLowerCase();
    const isCommand = text === '/start' || text === 'start';

    logger.info(`🔍 START validate: text="${text}", isCommand=${isCommand}`);
    return isCommand;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const userName = message.content.userName || 'друг';

      const welcomeText = `👋 Привет, ${userName}!

Я **Vibee** - твой AI-наставник по vibe-coding и современной разработке!

🚀 **Что я умею:**
• Обучать современным технологиям
• Показывать примеры кода
• Помогать с ошибками
• Делиться best practices
• Рекомендовать инструменты

💡 **Как со мной работать:**
Просто пиши свои вопросы, и я буду отвечать с интерактивными кнопками для удобства!

📚 **Начнём?**`;

      const uiElements: UIElement[] = [
        {
          type: 'menu',
          title: 'Выбери действие:',
          options: [
            { text: '⚡️ Что такое vibe-coding?', callback_data: 'what_is_vibe' },
            { text: '📚 Начать обучение', callback_data: 'start_learning' },
            { text: '🔧 Выбрать инструменты', callback_data: 'choose_tools' },
            { text: '💬 Задать вопрос', callback_data: 'ask_question' },
          ],
        },
      ];

      await callback({
        text: welcomeText,
        // @ts-ignore
        ui_elements: uiElements,
      });

      logger.info(`✅ Отправлено приветствие для ${userName}`);

      return {
        success: true,
        text: welcomeText,
        data: { command: 'start', uiElements },
      };
    } catch (error) {
      logger.error('❌ Ошибка в /start команде:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/start' },
      },
      {
        user: 'Vibee',
        content: {
          text: 'Привет! Я Vibee - твой AI-наставник по vibe-coding!',
        },
      },
    ],
  ],
};

// ========================================
// КОМАНДА /menu
// ========================================

const menuCommandAction: Action = {
  name: 'TELEGRAM_MENU_COMMAND',
  description: 'Показывает главное меню в Telegram',
  similes: ['/menu', 'menu', 'меню'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    if (message.content.source !== 'telegram') return false;

    const text = (message.content.text || '').trim().toLowerCase();
    const isCommand = text === '/menu' || text === 'menu' || text === 'меню';

    logger.info(`🔍 MENU validate: text="${text}", isCommand=${isCommand}`);
    return isCommand;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const menuText = `📋 **Главное меню Vibee**

Выбери раздел, который тебя интересует:`;

      const uiElements: UIElement[] = [
        {
          type: 'menu',
          title: 'Разделы:',
          options: [
            { text: '🎨 Обучение модели', callback_data: 'menu_training' },
            { text: '📚 Обучение', callback_data: 'menu_learning' },
            { text: '🔧 Инструменты', callback_data: 'menu_tools' },
            { text: '💻 Примеры кода', callback_data: 'menu_examples' },
            { text: '❓ Помощь', callback_data: 'menu_help' },
            { text: '📊 Мой прогресс', callback_data: 'menu_progress' },
          ],
        },
      ];

      await callback({
        text: menuText,
        // @ts-ignore
        ui_elements: uiElements,
      });

      return {
        success: true,
        text: menuText,
        data: { command: 'menu', uiElements },
      };
    } catch (error) {
      logger.error('❌ Ошибка в /menu команде:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

// ========================================
// КОМАНДА /help
// ========================================

const helpCommandAction: Action = {
  name: 'TELEGRAM_HELP_COMMAND',
  description: 'Показывает справку и инструкции',
  similes: ['/help', 'help', 'помощь'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    if (message.content.source !== 'telegram') return false;

    const text = (message.content.text || '').trim().toLowerCase();
    const isCommand = text === '/help' || text === 'help' || text === 'помощь';

    logger.info(`🔍 HELP validate: text="${text}", isCommand=${isCommand}`);
    return isCommand;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const helpText = `🆘 **Справка по Vibee**

**Доступные команды:**
/start - Начать работу с ботом
/menu - Показать главное меню
/help - Эта справка

**Как использовать:**
Просто пиши свои вопросы на русском языке! Я отвечу и добавлю интерактивные кнопки для удобства.

**Примеры вопросов:**
• "Как начать с vibe-coding?"
• "Покажи пример TypeScript кода"
• "Какие инструменты мне нужны?"
• "Помоги настроить Bun"

**Интерактивные элементы:**
Я автоматически добавляю кнопки, меню и клавиатуры в зависимости от контекста разговора!

**Нужна помощь?**
Просто спроси - я здесь, чтобы помочь! 💪`;

      const uiElements: UIElement[] = [
        {
          type: 'inline_url',
          text: '📖 Документация ElizaOS',
          url: 'https://docs.elizaos.ai',
        },
        {
          type: 'inline_url',
          text: '🚀 Vibe-coding гайд',
          url: 'https://bun.sh/docs',
        },
        {
          type: 'inline_callback',
          text: '🔙 Назад в меню',
          callback_data: 'back_to_menu',
        },
      ];

      await callback({
        text: helpText,
        // @ts-ignore
        ui_elements: uiElements,
      });

      return {
        success: true,
        text: helpText,
        data: { command: 'help', uiElements },
      };
    } catch (error) {
      logger.error('❌ Ошибка в /help команде:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

// ========================================
// ОБРАБОТЧИКИ CALLBACK ОТ КОМАНД
// ========================================

const commandCallbacksAction: Action = {
  name: 'HANDLE_COMMAND_CALLBACKS',
  description: 'Обрабатывает callback от команд',
  similes: [],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    if (message.content.source !== 'telegram') return false;

    const callbackData = message.content?.callback_data as string;
    const isCallback =
      callbackData &&
      (callbackData.startsWith('menu_') ||
        callbackData.startsWith('what_is_') ||
        callbackData.startsWith('start_') ||
        callbackData.startsWith('choose_') ||
        callbackData.startsWith('ask_') ||
        callbackData === 'back_to_menu');

    logger.info(`🔍 CALLBACK validate: callback_data="${callbackData}", isCallback=${isCallback}`);
    return !!isCallback;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const callbackData = message.content.callback_data as string;
      let responseText = '';
      let uiElements: UIElement[] = [];

      switch (callbackData) {
        case 'what_is_vibe':
          responseText = `⚡️ **Vibe-coding - что это?**

Vibe-coding - это современный подход к разработке, который фокусируется на:

🚀 **Скорость** - используй самые быстрые инструменты (Bun, Vite)
💡 **AI-ассистенты** - Claude, GPT как твои напарники
🎨 **Developer Experience** - кайф от процесса разработки
⚡️ **Быстрая обратная связь** - instant reload, hot module replacement
🛠 **Современный стек** - TypeScript, React, ElizaOS

Хочешь узнать больше?`;
          uiElements = [
            { type: 'inline_callback', text: '📚 Начать обучение', callback_data: 'start_learning' },
            { type: 'inline_callback', text: '🔧 Выбрать инструменты', callback_data: 'choose_tools' },
          ];
          break;

        case 'start_learning':
          responseText = `📚 **Начинаем обучение!**

Выбери тему, с которой хочешь начать:`;
          uiElements = [
            {
              type: 'menu',
              title: 'Темы обучения:',
              options: [
                { text: '⚡️ Vibe-coding основы', callback_data: 'learn_vibe_basics' },
                { text: '🔥 TypeScript продвинутый', callback_data: 'learn_typescript' },
                { text: '🚀 Bun runtime', callback_data: 'learn_bun' },
                { text: '🤖 ElizaOS агенты', callback_data: 'learn_elizaos' },
              ],
            },
          ];
          break;

        case 'choose_tools':
          responseText = `🔧 **Инструменты для vibe-coding**

Выбери категорию инструментов:`;
          uiElements = [
            {
              type: 'reply_keyboard',
              buttons: [
                ['🔧 Runtimes', '⚙️ Build Tools', '📦 Package Managers'],
                ['🤖 AI Tools', '🌐 Frameworks', '💾 Databases'],
                ['🔙 Назад в меню'],
              ],
              resize_keyboard: true,
            },
          ];
          break;

        case 'ask_question':
          responseText = `💬 **Задай свой вопрос!**

Напиши мне любой вопрос по разработке, и я отвечу с подробными объяснениями и примерами кода!

Примеры вопросов:
• "Как настроить TypeScript проект?"
• "В чём разница между Bun и Node.js?"
• "Покажи пример async/await"
• "Как создать Telegram бота?"`;
          break;

        case 'menu_learning':
          responseText = `📚 **Раздел обучения**

Здесь ты найдёшь:
• Курсы по современным технологиям
• Интерактивные туториалы
• Примеры кода
• Best practices

Выбери тему:`;
          uiElements = [
            { text: '⚡️ Vibe-coding', callback_data: 'learn_vibe_basics' },
            { text: '🔥 TypeScript', callback_data: 'learn_typescript' },
            { text: '🚀 Bun', callback_data: 'learn_bun' },
            { text: '🤖 ElizaOS', callback_data: 'learn_elizaos' },
          ].map((item) => ({
            type: 'inline_callback' as const,
            text: item.text,
            callback_data: item.callback_data,
          }));
          break;

        case 'menu_tools':
          responseText = `🔧 **Инструменты разработки**

Топ инструменты для vibe-coding:`;
          uiElements = [
            {
              type: 'reply_keyboard',
              buttons: [
                ['🔧 Bun', '⚙️ TypeScript', '⚡️ Vite'],
                ['🤖 ElizaOS', '🌐 Next.js', '📦 Drizzle ORM'],
                ['🔙 Назад в меню'],
              ],
              resize_keyboard: true,
            },
          ];
          break;

        case 'menu_examples':
          responseText = `💻 **Примеры кода**

Что хочешь посмотреть?`;
          uiElements = [
            { type: 'inline_callback', text: '🚀 Быстрый старт', callback_data: 'examples_quickstart' },
            { type: 'inline_callback', text: '🤖 AI агенты', callback_data: 'examples_ai' },
            { type: 'inline_callback', text: '🌐 Web apps', callback_data: 'examples_web' },
          ];
          break;

        case 'menu_help':
          responseText = `❓ **Помощь**

Как я могу помочь тебе сегодня?`;
          uiElements = [
            { type: 'inline_callback', text: '🆘 Решить проблему', callback_data: 'detailed_help' },
            { type: 'inline_url', text: '📖 Документация', url: 'https://docs.elizaos.ai' },
            { type: 'inline_callback', text: '💬 Задать вопрос', callback_data: 'ask_question' },
          ];
          break;

        case 'menu_progress':
          responseText = `📊 **Твой прогресс**

Пока что это демо, но скоро здесь будет:
• Пройденные темы
• Выполненные задания
• Достижения
• Рекомендации по обучению

Продолжай учиться! 💪`;
          break;

        case 'menu_training':
          responseText = `🎨 **Обучение персональной ИИ-модели**

Создай свою собственную AI-модель для генерации изображений!

🚀 **Что это даёт:**
• Генерация изображений с твоим лицом
• Крутые арты и аватары
• Уникальный контент для соцсетей

⚡️ **Тестовый режим** (1 шаг, ~2-5 минут)
Быстрая проверка что весь пайплайн работает!

📸 **Что нужно:**
• 10-20 фото своего лица
• Разные ракурсы и освещение
• Хорошее качество

Что хочешь сделать?`;
          uiElements = [
            { type: 'inline_callback', text: '🚀 Начать обучение', callback_data: 'training_start' },
            { type: 'inline_callback', text: '❓ Как это работает?', callback_data: 'training_help' },
            { type: 'inline_callback', text: '📋 Мои модели', callback_data: 'training_models' },
            { type: 'inline_callback', text: '🔙 Назад в меню', callback_data: 'back_to_menu' },
          ];
          break;

        case 'back_to_menu':
          // Рекурсивно вызываем menu команду
          return menuCommandAction.handler(runtime, message, state, options, callback);

        default:
          responseText = `Обработка: ${callbackData}`;
      }

      await callback({
        text: responseText,
        // @ts-ignore
        ui_elements: uiElements,
      });

      return {
        success: true,
        text: responseText,
        data: { callbackData, uiElements },
      };
    } catch (error) {
      logger.error('❌ Ошибка обработки command callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

// ========================================
// ПЛАГИН
// ========================================

export const telegramCommandsPlugin: Plugin = {
  name: 'telegram-commands',
  description: 'Стандартные Telegram команды: /start, /menu, /help через Service',
  actions: [], // Используем Service вместо Action'ов
  services: [TelegramCommandsService],
};

export default telegramCommandsPlugin;
