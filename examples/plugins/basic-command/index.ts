/**
 * Basic Command Example
 *
 * Этот плагин демонстрирует создание простых команд бота.
 * Команды - это простые действия, которые реагируют на конкретные сообщения
 * или команды пользователя (например, /help, /stats, /time).
 */

import { Plugin, Action, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Команда /help - показывает справку по командам
 */
const helpCommand: Action = {
  name: 'HELP_COMMAND',
  similes: ['ПОМОЩЬ', 'СПРАВКА', 'ХЕЛП'],
  description: 'Показывает справку по доступным командам',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'help' ||
      text === '/help' ||
      text === 'помощь' ||
      text === '/help@bot'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const helpText =
        '📚 Справка по командам\n\n' +
        'Доступные команды:\n' +
        '• /help - показать эту справку\n' +
        '• /time - текущее время\n' +
        '• /stats - статистика пользователя\n' +
        '• /about - информация о боте\n\n' +
        'Можете также писать без слэша:\n' +
        '• помощь\n' +
        '• время\n' +
        '• статистика\n' +
        '• о боте';

      await callback({
        text: helpText
      });

      logger.info('[HELP_COMMAND] Help requested', { userId: message.userId });

      return {
        success: true,
        text: 'Help displayed',
        data: { command: 'help' }
      };
    } catch (error) {
      logger.error('[HELP_COMMAND] Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/help' }
      },
      {
        user: '{{agent}}',
        content: {
          text: '📚 Справка по командам\n\nДоступные команды:\n• /help - показать эту справку\n...',
          action: 'HELP_COMMAND'
        }
      }
    ]
  ]
};

/**
 * Команда /time - показывает текущее время
 */
const timeCommand: Action = {
  name: 'TIME_COMMAND',
  similes: ['ВРЕМЯ', 'ЧАСЫ', 'СЕЙЧАС'],
  description: 'Показывает текущее время и дату',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'time' ||
      text === '/time' ||
      text === 'время' ||
      text === '/time@bot'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const dateString = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timezone = 'UTC+3';

      const timeText =
        `🕐 Текущее время\n\n` +
        `Время: ${timeString}\n` +
        `Дата: ${dateString}\n` +
        `Часовой пояс: ${timezone}`;

      await callback({
        text: timeText
      });

      logger.debug('[TIME_COMMAND] Time shown', {
        userId: message.userId,
        time: now.getTime()
      });

      return {
        success: true,
        text: 'Time displayed',
        data: {
          command: 'time',
          timestamp: now.getTime(),
          timezone
        }
      };
    } catch (error) {
      logger.error('[TIME_COMMAND] Error:', error);

      await callback({
        text: 'Произошла ошибка при получении времени 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/time' }
      },
      {
        user: '{{agent}}',
        content: {
          text: '🕐 Текущее время\n\nВремя: 14:30:45\nДата: четверг, 13 ноября 2025\nЧасовой пояс: UTC+3',
          action: 'TIME_COMMAND'
        }
      }
    ]
  ]
};

/**
 * Команда /stats - показывает статистику пользователя
 */
const statsCommand: Action = {
  name: 'STATS_COMMAND',
  similes: ['СТАТИСТИКА', 'ДАННЫЕ', 'МЕТРИКА'],
  description: 'Показывает статистику пользователя',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'stats' ||
      text === '/stats' ||
      text === 'статистика' ||
      text === '/stats@bot'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const userId = message.userId;
      const db = runtime.db;

      // Получаем или создаем статистику пользователя
      const statsKey = `user:${userId}:stats`;
      const stats = await db.get(statsKey);

      const currentStats = stats || {
        messageCount: 0,
        lastSeen: null,
        firstSeen: new Date().toISOString(),
        commandsUsed: {},
        totalUptime: 0
      };

      // Обновляем статистику
      currentStats.messageCount = (currentStats.messageCount || 0) + 1;
      currentStats.lastSeen = new Date().toISOString();

      // Увеличиваем счетчик использования команды stats
      currentStats.commandsUsed['stats'] = (currentStats.commandsUsed['stats'] || 0) + 1;

      await db.set(statsKey, currentStats);

      const statsText =
        `📊 Ваша статистика\n\n` +
        `📝 Сообщений: ${currentStats.messageCount}\n` +
        `🕐 Первое сообщение: ${formatDate(currentStats.firstSeen)}\n` +
        `🕓 Последняя активность: ${formatDate(currentStats.lastSeen)}\n` +
        `🎯 Использовано команд: ${Object.values(currentStats.commandsUsed).reduce((a, b) => a + b, 0)}`;

      await callback({
        text: statsText
      });

      logger.info('[STATS_COMMAND] Stats shown', {
        userId,
        messageCount: currentStats.messageCount
      });

      return {
        success: true,
        text: 'Stats displayed',
        data: {
          command: 'stats',
          userId,
          stats: currentStats
        }
      };
    } catch (error) {
      logger.error('[STATS_COMMAND] Error:', error);

      await callback({
        text: 'Произошла ошибка при получении статистики 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/stats' }
      },
      {
        user: '{{agent}}',
        content: {
          text: '📊 Ваша статистика\n\n📝 Сообщений: 5\n🕐 Первое сообщение: 13.11.2025\n...',
          action: 'STATS_COMMAND'
        }
      }
    ]
  ]
};

/**
 * Команда /about - информация о боте
 */
const aboutCommand: Action = {
  name: 'ABOUT_COMMAND',
  similes: ['О БОТЕ', 'ИНФОРМАЦИЯ', 'ВЕРСИЯ'],
  description: 'Показывает информацию о боте и его возможностях',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'about' ||
      text === '/about' ||
      text === 'о боте' ||
      text === '/about@bot' ||
      text === 'информация' ||
      text === 'версия'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const version = '1.0.0';
      const uptime = process.uptime();

      const aboutText =
        `ℹ️ О боте\n\n` +
        `🤖 Название: Vibee\n` +
        `📦 Версия: ${version}\n` +
        `⏱️ Время работы: ${formatUptime(uptime)}\n` +
        `⚡ Основа: ElizaOS\n` +
        `🔧 Пример плагина: Basic Command Plugin\n\n` +
        `📝 Этот плагин демонстрирует создание простых команд бота.\n` +
        `Используйте /help для списка команд.`;

      await callback({
        text: aboutText
      });

      logger.info('[ABOUT_COMMAND] About shown', {
        userId: message.userId,
        version
      });

      return {
        success: true,
        text: 'About displayed',
        data: {
          command: 'about',
          version,
          uptime
        }
      };
    } catch (error) {
      logger.error('[ABOUT_COMMAND] Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/about' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'ℹ️ О боте\n\n🤖 Название: Vibee\n📦 Версия: 1.0.0\n...',
          action: 'ABOUT_COMMAND'
        }
      }
    ]
  ]
};

/**
 * Команда /echo - повторяет сообщение пользователя
 */
const echoCommand: Action = {
  name: 'ECHO_COMMAND',
  similes: ['ПОВТОРИТЬ', 'ЭХО', 'СКАЗАТЬ'],
  description: 'Повторяет сообщение пользователя',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return text.startsWith('echo ') || text.startsWith('/echo') || text.startsWith('повтори ');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const text = message.content.text || '';

      // Извлекаем текст после команды
      let echoText = text;
      if (echoText.startsWith('echo ')) {
        echoText = echoText.substring(5);
      } else if (echoText.startsWith('/echo')) {
        echoText = echoText.substring(5).trim();
      } else if (echoText.startsWith('повтори ')) {
        echoText = echoText.substring(8);
      }

      if (!echoText.trim()) {
        await callback({
          text: 'Нечего повторять 😄 Укажите текст после команды.'
        });
        return {
          success: true,
          text: 'No text to echo',
          data: { command: 'echo', empty: true }
        };
      }

      const echoResponse = `🔊 Вы сказали: "${echoText}"`;

      await callback({
        text: echoResponse
      });

      logger.debug('[ECHO_COMMAND] Echo response', {
        userId: message.userId,
        text: echoText.substring(0, 100)
      });

      return {
        success: true,
        text: 'Echo displayed',
        data: {
          command: 'echo',
          echoedText: echoText
        }
      };
    } catch (error) {
      logger.error('[ECHO_COMMAND] Error:', error);

      await callback({
        text: 'Произошла ошибка 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'echo Привет!' }
      },
      {
        user: '{{agent}}',
        content: {
          text: '🔊 Вы сказали: "Привет!"',
          action: 'ECHO_COMMAND'
        }
      }
    ]
  ]
};

/**
 * Утилита для форматирования даты
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Неизвестно';

  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Утилита для форматирования времени работы
 */
function formatUptime(uptime: number): string {
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds}с`;
  } else {
    return `${seconds}с`;
  }
}

/**
 * Основной плагин
 */
export const basicCommandPlugin: Plugin = {
  name: 'basic-command-plugin',
  description: 'Пример плагина команд для демонстрации обработки команд бота',

  // Регистрируем действия
  actions: [helpCommand, timeCommand, statsCommand, aboutCommand, echoCommand],

  // Инициализация
  async init(config, runtime) {
    logger.info('[BasicCommandPlugin] Инициализация...');
    logger.info('[BasicCommandPlugin] Зарегистрированные команды:', [
      'HELP_COMMAND',
      'TIME_COMMAND',
      'STATS_COMMAND',
      'ABOUT_COMMAND',
      'ECHO_COMMAND'
    ]);
  }
};

export default basicCommandPlugin;

/**
 * ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
 *
 * Команды - это простые действия, которые реагируют на конкретные сообщения.
 * Они идеально подходят для:
 *
 * • Справки (/help)
 * • Системной информации (/stats, /about)
 * • Быстрых действий (/time)
 * • Развлекательных функций (/echo)
 *
 * ОСОБЕННОСТИ:
 *
 * 1. Валидация - проверка, что сообщение является командой
 * 2. Обработка - логика выполнения команды
 * 3. Ответ - отправка результата пользователю
 * 4. Логирование - отслеживание использования
 *
 * ИСПОЛЬЗОВАНИЕ:
 *
 * 1. В персонаже:
 *    import { basicCommandPlugin } from './examples/plugins/basic-command';
 *
 * 2. Пользователь отправляет команду:
 *    /help
 *    /time
 *    статистика
 *
 * 3. Action срабатывает, если валидация прошла
 *
 * ЛУЧШИЕ ПРАКТИКИ:
 *
 * 1. Используйте понятные синонимы (similes)
 * 2. Поддерживайте команды с @bot
 * 3. Логируйте использование команд
 * 4. Обрабатывайте ошибки gracefully
 * 5. Предоставляйте полезную информацию
 * 6. Делайте команды быстрыми
 *
 * СОВЕТЫ:
 *
 * • Не усложняйте команды - они должны быть простыми
 * • Добавляйте эмодзи для визуального улучшения
 * • Используйте однообразное форматирование ответов
 * • Тестируйте команды с разными входными данными
 */
