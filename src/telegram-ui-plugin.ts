/**
 * Расширенный Telegram Generative UI Plugin для ElizaOS
 *
 * Поддерживает:
 * - Inline Callback Buttons (кнопки с callback_data)
 * - Reply Keyboards (постоянная клавиатура внизу экрана)
 * - Web Apps (мини-приложения в Telegram)
 * - Dynamic UI Generation (генерация UI на основе контекста)
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
} from '@elizaos/core';

// ========================================
// ТИПЫ ДЛЯ РАСШИРЕННОГО UI
// ========================================

/**
 * Типы интерактивных элементов
 */
export type UIElementType =
  | 'inline_callback' // Inline кнопка с callback
  | 'inline_url' // Inline кнопка с URL
  | 'reply_keyboard' // Reply клавиатура
  | 'web_app' // Web App кнопка
  | 'menu'; // Меню с опциями

/**
 * Callback кнопка с данными
 */
export interface CallbackButton {
  type: 'inline_callback';
  text: string;
  callback_data: string; // Данные для обработки
}

/**
 * URL кнопка
 */
export interface URLButton {
  type: 'inline_url';
  text: string;
  url: string;
}

/**
 * Web App кнопка
 */
export interface WebAppButton {
  type: 'web_app';
  text: string;
  url: string; // URL веб-приложения
}

/**
 * Reply клавиатура
 */
export interface ReplyKeyboard {
  type: 'reply_keyboard';
  buttons: string[][]; // Массив строк с кнопками
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  selective?: boolean;
}

/**
 * Меню с опциями
 */
export interface Menu {
  type: 'menu';
  title: string;
  options: {
    text: string;
    callback_data: string;
    description?: string;
  }[];
}

/**
 * Объединенный тип UI элемента
 */
export type UIElement = CallbackButton | URLButton | WebAppButton | ReplyKeyboard | Menu;

/**
 * Расширенный контент с UI элементами
 */
export interface GenerativeUIContent {
  text: string;
  ui_elements?: UIElement[];
}

// ========================================
// ГЕНЕРАТОР ИНТЕРАКТИВНЫХ ЭЛЕМЕНТОВ
// ========================================

/**
 * Генератор UI на основе контекста разговора
 */
export class TelegramUIGenerator {
  /**
   * Генерирует UI элементы на основе текста агента
   */
  static generateUI(text: string, context: string): UIElement[] {
    const elements: UIElement[] = [];

    // Детектим контекст и генерируем соответствующий UI
    const lowerText = text.toLowerCase();
    const lowerContext = context.toLowerCase();

    // === ОБУЧАЮЩИЕ МАТЕРИАЛЫ ===
    if (
      lowerText.includes('обуч') ||
      lowerText.includes('курс') ||
      lowerContext.includes('обуч')
    ) {
      elements.push({
        type: 'menu',
        title: '📚 Выбери тему обучения:',
        options: [
          { text: '⚡️ Vibe-coding основы', callback_data: 'learn_vibe_basics' },
          { text: '🔥 TypeScript продвинутый', callback_data: 'learn_typescript' },
          { text: '🚀 Bun и современный runtime', callback_data: 'learn_bun' },
          { text: '🤖 ElizaOS и AI-агенты', callback_data: 'learn_elizaos' },
        ],
      });
    }

    // === ПРИМЕРЫ КОДА ===
    if (lowerText.includes('пример') || lowerText.includes('покажи код')) {
      elements.push(
        {
          type: 'inline_callback',
          text: '📝 Показать полный пример',
          callback_data: 'show_full_example',
        },
        {
          type: 'inline_callback',
          text: '🔍 Объяснить построчно',
          callback_data: 'explain_line_by_line',
        }
      );
    }

    // === ИНСТРУМЕНТЫ И ФРЕЙМВОРКИ ===
    if (
      lowerText.includes('инструмент') ||
      lowerText.includes('фреймворк') ||
      lowerText.includes('установ')
    ) {
      elements.push({
        type: 'reply_keyboard',
        buttons: [
          ['🔧 Bun', '⚙️ TypeScript', '⚡️ Vite'],
          ['🤖 ElizaOS', '🌐 Next.js', '📦 Drizzle ORM'],
          ['❓ Другое'],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      });
    }

    // === ПОМОЩЬ И ПОДДЕРЖКА ===
    if (
      lowerText.includes('помощь') ||
      lowerText.includes('не понял') ||
      lowerText.includes('ошибка')
    ) {
      elements.push(
        {
          type: 'inline_callback',
          text: '🆘 Подробная помощь',
          callback_data: 'detailed_help',
        },
        {
          type: 'inline_url',
          text: '📖 Документация',
          url: 'https://docs.elizaos.ai',
        },
        {
          type: 'inline_callback',
          text: '💬 Задать вопрос по-другому',
          callback_data: 'rephrase_question',
        }
      );
    }

    // === ИНТЕРАКТИВНЫЕ ДЕМО ===
    if (lowerText.includes('демо') || lowerText.includes('попробова')) {
      elements.push({
        type: 'web_app',
        text: '🎮 Запустить интерактивное демо',
        url: 'https://elizaos.ai/demo', // Заменить на реальный URL
      });
    }

    return elements;
  }

  /**
   * Конвертирует UI элементы в формат Telegram Markup
   */
  static convertToTelegramMarkup(elements: UIElement[]): any {
    const markup: any = { inline_keyboard: [], keyboard: [] };

    for (const element of elements) {
      switch (element.type) {
        case 'inline_callback':
          markup.inline_keyboard.push([
            { text: element.text, callback_data: element.callback_data },
          ]);
          break;

        case 'inline_url':
          markup.inline_keyboard.push([{ text: element.text, url: element.url }]);
          break;

        case 'web_app':
          markup.inline_keyboard.push([
            { text: element.text, web_app: { url: element.url } },
          ]);
          break;

        case 'reply_keyboard':
          markup.keyboard = element.buttons;
          markup.resize_keyboard = element.resize_keyboard ?? true;
          markup.one_time_keyboard = element.one_time_keyboard ?? false;
          break;

        case 'menu':
          // Меню превращается в inline кнопки с описанием
          for (const option of element.options) {
            markup.inline_keyboard.push([
              {
                text: option.text,
                callback_data: option.callback_data,
              },
            ]);
          }
          break;
      }
    }

    return markup;
  }
}

// ========================================
// ОБРАБОТЧИК CALLBACK ЗАПРОСОВ
// ========================================

/**
 * Action для обработки callback кнопок
 */
const handleCallbackAction: Action = {
  name: 'HANDLE_TELEGRAM_CALLBACK',
  description: 'Обрабатывает нажатия на inline кнопки в Telegram',
  similes: ['callback', 'button_click', 'inline_button'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Проверяем что это callback от Telegram
    return message.content?.callback_data !== undefined;
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

      logger.info(`📞 Получен callback: ${callbackData}`);

      let responseText = '';
      let uiElements: UIElement[] = [];

      // Обрабатываем различные callback'и
      switch (callbackData) {
        case 'learn_vibe_basics':
          responseText = `⚡️ **Vibe-coding основы**

Vibe-coding - это про:
• Скорость разработки
• Современные инструменты (Bun, TypeScript)
• AI-ассистенты (Claude, GPT)
• Живая обратная связь

Хочешь начать?`;
          uiElements = [
            { type: 'inline_callback', text: '🚀 Да, начнём!', callback_data: 'start_vibe_course' },
            { type: 'inline_callback', text: '📚 Покажи ресурсы', callback_data: 'show_resources' },
          ];
          break;

        case 'learn_typescript':
          responseText = `🔥 **TypeScript продвинутый уровень**

Темы для изучения:
• Generics и условные типы
• Type guards и narrowing
• Utility types и mapped types
• Template literal types
• Декораторы

Какую тему разберём?`;
          uiElements = [
            { type: 'inline_callback', text: 'Generics', callback_data: 'ts_generics' },
            { type: 'inline_callback', text: 'Type guards', callback_data: 'ts_guards' },
            { type: 'inline_callback', text: 'Utility types', callback_data: 'ts_utility' },
          ];
          break;

        case 'learn_bun':
          responseText = `🚀 **Bun - современный JavaScript runtime**

\`\`\`bash
# Установка Bun
curl -fsSL https://bun.sh/install | bash

# Создание проекта
bun init

# Запуск скрипта
bun run index.ts
\`\`\`

Bun быстрее Node.js в 3-4 раза! Попробуем?`;
          uiElements = [
            { type: 'inline_url', text: '📖 Документация Bun', url: 'https://bun.sh/docs' },
            { type: 'inline_callback', text: '💻 Показать примеры', callback_data: 'bun_examples' },
          ];
          break;

        case 'learn_elizaos':
          responseText = `🤖 **ElizaOS - фреймворк для AI-агентов**

ElizaOS позволяет создавать:
• Telegram/Discord ботов
• Twitter агентов
• AI-ассистентов с памятью
• Мультимодальных агентов

Ты как раз общаешься с таким агентом! 😊`;
          uiElements = [
            {
              type: 'inline_url',
              text: '📖 ElizaOS Docs',
              url: 'https://docs.elizaos.ai',
            },
            {
              type: 'inline_callback',
              text: '🛠 Создать своего агента',
              callback_data: 'create_agent',
            },
          ];
          break;

        case 'show_full_example':
          responseText = '📝 Показываю полный пример кода...';
          break;

        case 'explain_line_by_line':
          responseText = '🔍 Разбираю код построчно...';
          break;

        case 'detailed_help':
          responseText = `🆘 **Как я могу помочь?**

Я могу:
• Объяснить любую концепцию программирования
• Показать примеры кода
• Помочь с ошибками
• Порекомендовать инструменты
• Дать советы по архитектуре

Просто опиши свою задачу или вопрос!`;
          break;

        case 'rephrase_question':
          responseText =
            '💬 Попробуй переформулировать свой вопрос, я постараюсь понять лучше!';
          break;

        default:
          responseText = `Обработал callback: ${callbackData}`;
      }

      // Отправляем ответ через callback
      await callback({
        text: responseText,
        // @ts-ignore - добавляем UI элементы
        ui_elements: uiElements,
      });

      return {
        success: true,
        text: responseText,
        data: {
          callbackData,
          uiElements,
        },
      };
    } catch (error) {
      logger.error('❌ Ошибка обработки callback:', error);
      await callback({
        text: 'Произошла ошибка при обработке кнопки. Попробуй ещё раз!',
        error: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

// ========================================
// ACTION ДЛЯ ГЕНЕРАЦИИ UI
// ========================================

/**
 * Action для автоматической генерации UI к сообщениям
 */
const generateUIAction: Action = {
  name: 'GENERATE_TELEGRAM_UI',
  description: 'Автоматически генерирует интерактивные UI элементы для Telegram сообщений',
  similes: ['add_buttons', 'add_keyboard', 'make_interactive'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Генерируем UI для всех исходящих сообщений в Telegram
    return message.content?.source === 'telegram';
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const text = message.content.text || '';
      const context = state?.recentMessagesData?.[0]?.content?.text || '';

      // Генерируем UI элементы
      const uiElements = TelegramUIGenerator.generateUI(text, context);

      if (uiElements.length > 0) {
        logger.info(`✨ Сгенерировано ${uiElements.length} UI элементов`);

        // Добавляем UI элементы к сообщению
        await callback({
          text,
          // @ts-ignore
          ui_elements: uiElements,
        });
      }

      return {
        success: true,
        text: 'UI элементы добавлены',
        data: { uiElements },
      };
    } catch (error) {
      logger.error('❌ Ошибка генерации UI:', error);
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

export const telegramUIPlugin: Plugin = {
  name: 'telegram-ui',
  description: 'Расширенный Telegram Generative UI Plugin для интерактивных элементов',
  actions: [handleCallbackAction, generateUIAction],
  services: [],
};

export default telegramUIPlugin;
