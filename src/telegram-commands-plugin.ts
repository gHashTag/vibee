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

    // Слушаем событие /start от Telegram
    runtime.on('TELEGRAM_SLASH_START', async (data: any) => {
      logger.info('🚀 TELEGRAM_SLASH_START event received!', data);
      await this.handleStartCommand(runtime, data);
    });

    // Слушаем входящие сообщения для /menu и /help
    runtime.on('TELEGRAM_MESSAGE_RECEIVED', async (data: any) => {
      const message = data.memory || data.message || data;
      if (!message?.content) return;

      const text = (message.content.text || '').trim().toLowerCase();
      logger.info(`📨 Telegram message: "${text}"`);

      if (text === '/menu' || text === 'menu' || text === 'меню') {
        logger.info('✅ /menu command');
        await this.handleMenuCommand(runtime, message);
      } else if (text === '/help' || text === 'help' || text === 'помощь') {
        logger.info('✅ /help command');
        await this.handleHelpCommand(runtime, message);
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

💡 **Как со мной работать:**
Просто пиши свои вопросы, и я буду отвечать с интерактивными кнопками для удобства!

Попробуй команды:
/menu - главное меню
/help - помощь`;

    try {
      // Отправляем напрямую через Telegram API
      await ctx.reply(welcomeText, { parse_mode: 'Markdown' });
      logger.info('✅ Sent /start response successfully');
    } catch (error) {
      logger.error('❌ Failed to send /start response:', error);
    }
  }

  async handleMenuCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    // TODO: Implement menu
    logger.info('📋 Menu command - to be implemented');
  }

  async handleHelpCommand(runtime: IAgentRuntime, message: Memory): Promise<void> {
    // TODO: Implement help
    logger.info('❓ Help command - to be implemented');
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
