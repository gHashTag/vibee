/**
 * Basic Provider Example
 *
 * Этот плагин демонстрирует создание простого провайдера данных.
 * Провайдер предоставляет дополнительную информацию агенту при обработке сообщений.
 */

import { Plugin, Provider, ProviderResult } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Пример провайдера данных
 * Предоставляет информацию о текущем времени и статусе сервиса
 */
const timeProvider: Provider = {
  name: 'TIME_PROVIDER',
  description: 'Предоставляет текущее время и информацию о сервисе',

  /**
   * Получение данных провайдера
   * Вызывается при каждом сообщении пользователя
   */
  get: async (runtime, message, state): Promise<ProviderResult> => {
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ru-RU');
      const dateString = now.toLocaleDateString('ru-RU');

      // Дополнительная информация
      const values = {
        currentTime: timeString,
        currentDate: dateString,
        timestamp: now.getTime(),
        timezone: 'UTC+3',
        serviceStatus: 'operational'
      };

      logger.debug('[TIME_PROVIDER] Providing data', values);

      return {
        text: `Текущее время: ${timeString}, ${dateString}`,
        values,
        data: {
          provider: 'TIME_PROVIDER',
          updatedAt: now.toISOString(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      logger.error('[TIME_PROVIDER] Error:', error);

      return {
        text: 'Не удалось получить информацию о времени',
        values: {
          serviceStatus: 'error'
        },
        data: {
          provider: 'TIME_PROVIDER',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};

/**
 * Провайдер пользовательских данных
 * Демонстрирует работу с пользовательскими данными
 */
const userStatsProvider: Provider = {
  name: 'USER_STATS_PROVIDER',
  description: 'Предоставляет статистику пользователя',

  get: async (runtime, message, state): Promise<ProviderResult> => {
    try {
      const userId = message.userId;

      // Получаем статистику пользователя из базы данных
      const stats = await getUserStats(runtime, userId);

      const values = {
        messageCount: stats.messageCount || 0,
        lastSeen: stats.lastSeen || 'никогда',
        isPremium: stats.isPremium || false,
        joinDate: stats.joinDate
      };

      return {
        text: `Статистика пользователя: ${values.messageCount} сообщений`,
        values,
        data: {
          provider: 'USER_STATS_PROVIDER',
          userId,
          cached: true
        }
      };
    } catch (error) {
      logger.error('[USER_STATS_PROVIDER] Error:', error);

      return {
        text: 'Не удалось получить статистику пользователя',
        values: {},
        data: {
          provider: 'USER_STATS_PROVIDER',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};

/**
 * Вспомогательная функция для получения статистики пользователя
 */
async function getUserStats(runtime: any, userId: string) {
  const db = runtime.db;

  const statsKey = `user:${userId}:stats`;
  const stats = await db.get(statsKey);

  if (!stats) {
    // Создаем новую статистику
    const newStats = {
      messageCount: 0,
      lastSeen: new Date().toISOString(),
      isPremium: false,
      joinDate: new Date().toISOString()
    };

    await db.set(statsKey, newStats);
    return newStats;
  }

  return stats;
}

/**
 * Схема валидации конфигурации
 */
const configSchema = {
  enabled: process.env.TIME_PROVIDER_ENABLED === 'true',
  cacheTTL: parseInt(process.env.TIME_PROVIDER_CACHE_TTL || '60')
};

/**
 * Основной плагин
 */
export const basicProviderPlugin: Plugin = {
  name: 'basic-provider-plugin',
  description: 'Пример плагина-провайдера данных для демонстрации возможностей',

  // Регистрируем провайдеры
  providers: [timeProvider, userStatsProvider],

  // Инициализация плагина
  async init(config, runtime) {
    logger.info('[BasicProviderPlugin] Инициализация...');

    // Проверяем конфигурацию
    if (!configSchema.enabled) {
      logger.warn('[BasicProviderPlugin] Плагин отключен в настройках');
      return;
    }

    logger.info('[BasicProviderPlugin] Инициализация завершена', {
      providers: ['TIME_PROVIDER', 'USER_STATS_PROVIDER'],
      cacheTTL: configSchema.cacheTTL
    });
  }
};

export default basicProviderPlugin;

/**
 * ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
 *
 * Провайдеры используются для предоставления контекстных данных агенту.
 * Они вызываются при каждом сообщении пользователя и могут:
 *
 * 1. Предоставить дополнительную информацию для ответов
 * 2. Добавить структурированные данные в контекст
 * 3. Кэшировать данные для улучшения производительности
 *
 * Использование провайдеров:
 *
 * 1. В персонаже (character.ts):
 *    import { basicProviderPlugin } from './examples/plugins/basic-provider';
 *
 *    export const character: Character = {
 *      plugins: [basicProviderPlugin]
 *    };
 *
 * 2. Провайдеры автоматически регистрируются и доступны для всех действий
 *
 * 3. Доступ к данным провайдера в действии:
 *
 *    const myAction: Action = {
 *      name: 'SHOW_TIME',
 *      handler: async (runtime, message, state) => {
 *        // Данные провайдера доступны в state.values
 *        const time = state.values.currentTime;
 *        const messageCount = state.values.messageCount;
 *
 *        return {
 *          success: true,
 *          text: `Сейчас ${time}. У вас ${messageCount} сообщений.`
 *        };
 *      }
 *    };
 *
 * ЛУЧШИЕ ПРАКТИКИ:
 *
 * 1. Обрабатывайте ошибки всегда
 * 2. Логируйте важные операции
 * 3. Кэшируйте данные если возможно
 * 4. Возвращайте meaningful текст
 * 5. Структурируйте данные в values
 * 6. Добавляйте метаданные в data
 */
