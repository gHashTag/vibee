/**
 * Примеры безопасной интеграции в плагины
 * Демонстрирует как использовать систему безопасности
 */

import { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { neurophotoAction } from '../neurophoto-action';
import {
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
  TextInputSchema,
  validateWithSchema,
  safeJsonParse,
  httpClient,
  http,
} from '../security';

/**
 * Пример 1: Безопасная команда с валидацией
 */
export const secureNeurophotoAction: Action = {
  ...neurophotoAction,

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    try {
      // Базовая валидация команды
      const text = message.content?.text?.toLowerCase();
      if (!text) return false;

      // Проверяем команды
      const commands = ['/neurophoto', 'нейрофото', 'neurophoto'];
      if (commands.some((cmd) => text.includes(cmd))) {
        // Логируем валидную команду
        securityLogger.log({
          type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
          severity: SecuritySeverity.LOW,
          userId: message.userId,
          details: {
            command: 'neurophoto',
            context: 'validate',
          },
          action: 'valid_command',
        });

        return true;
      }

      return false;

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.VALIDATION_FAILED,
        severity: SecuritySeverity.MEDIUM,
        userId: message.userId,
        details: {
          error: error.message,
          context: 'neurophoto_validate',
        },
        action: 'validation_error',
      });

      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    memory: Memory,
    state: State,
    callback: HandlerCallback,
    ...args: any[]
  ) => {
    try {
      // Валидируем входные данные
      const validation = validateWithSchema(
        TextInputSchema,
        {
          text: memory.content?.text || '',
          metadata: {
            userId: memory.userId,
            messageId: memory.id,
          },
        },
        'neurophoto_handler'
      );

      if (!validation.success) {
        securityLogger.logValidationFailed(
          memory.userId || 'unknown',
          'text',
          memory.content?.text || '',
          validation.error,
          'neurophoto_handler'
        );

        await callback({
          text: `❌ Ошибка валидации: ${validation.error}`,
        });
        return;
      }

      // Санитизируем промпт
      const prompt = validation.data.text
        .replace(/нейрофото|neurophoto/gi, '')
        .trim();

      if (prompt.length < 5) {
        await callback({
          text: '⚠️ Опишите что нужно нарисовать (минимум 5 символов)',
        });
        return;
      }

      // Логируем успешное выполнение
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.LOW,
        userId: memory.userId,
        details: {
          promptLength: prompt.length,
          context: 'neurophoto_execute',
        },
        action: 'image_generation_requested',
      });

      // Выполняем оригинальный handler
      return neurophotoAction.handler?.(
        runtime,
        memory,
        state,
        callback,
        ...args
      );

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.HIGH,
        userId: memory.userId,
        details: {
          error: error.message,
          context: 'neurophoto_handler',
        },
        action: 'handler_error',
      });

      await callback({
        text: '❌ Произошла ошибка при обработке запроса',
      });
    }
  },
};

/**
 * Пример 2: Безопасный HTTP запрос
 */
export const secureApiCallExample = async (
  userId: string | number,
  apiKey: string
): Promise<any> => {
  try {
    // Валидация ключа
    if (!apiKey || apiKey.length < 20) {
      throw new Error('Invalid API key');
    }

    // Используем безопасный HTTP клиент
    const response = await http.request(
      'GET',
      'https://api.example.com/data',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        timeout: 10000,
        maxSize: 1024 * 1024, // 1MB
        allowedStatusCodes: [200, 201],
        validateJson: true,
      },
      userId
    );

    return response.data;

  } catch (error) {
    securityLogger.log({
      type: SecurityEventType.SUSPICIOUS_API_CALL,
      severity: SecuritySeverity.MEDIUM,
      userId,
      details: {
        error: error.message,
        context: 'secure_api_call',
      },
      action: 'api_error',
    });

    throw error;
  }
};

/**
 * Пример 3: Безопасное сохранение данных
 */
export const secureDataStorage = {
  save: async (userId: string | number, data: any): Promise<void> => {
    try {
      // Валидируем данные
      const validation = validateWithSchema(
        z.object({
          key: z.string().min(1).max(100),
          value: z.any(),
        }),
        data,
        'data_storage'
      );

      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error}`);
      }

      // Санитизируем ключ
      const sanitizedKey = validation.data.key.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Логируем операцию
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.LOW,
        userId,
        details: {
          key: sanitizedKey,
          valueType: typeof validation.data.value,
          context: 'data_storage_save',
        },
        action: 'data_saved',
      });

      // Сохраняем (пример)
      console.log(`Saving data for user ${userId}: ${sanitizedKey}`);

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.MEDIUM,
        userId,
        details: {
          error: error.message,
          context: 'data_storage_error',
        },
        action: 'storage_error',
      });

      throw error;
    }
  },

  load: async (userId: string | number, key: string): Promise<any> => {
    try {
      // Санитизируем ключ
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Логируем операцию
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.LOW,
        userId,
        details: {
          key: sanitizedKey,
          context: 'data_storage_load',
        },
        action: 'data_loaded',
      });

      // Загружаем (пример)
      console.log(`Loading data for user ${userId}: ${sanitizedKey}`);

      return null;

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.MEDIUM,
        userId,
        details: {
          error: error.message,
          context: 'data_storage_error',
        },
        action: 'load_error',
      });

      throw error;
    }
  },
};

/**
 * Пример 4: Middleware для плагинов
 */
export const createSecurePluginMiddleware = (options: {
  enableRateLimit?: boolean;
  enableValidation?: boolean;
  enableLogging?: boolean;
} = {}) => {
  return {
    beforeHandler: async (context: any) => {
      if (options.enableLogging && context.userId) {
        securityLogger.log({
          type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
          severity: SecuritySeverity.LOW,
          userId: context.userId,
          details: {
            plugin: context.pluginName,
            action: context.action,
          },
          action: 'plugin_before_handler',
        });
      }
    },

    afterHandler: async (context: any, result: any) => {
      if (options.enableLogging && context.userId) {
        securityLogger.log({
          type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
          severity: SecuritySeverity.LOW,
          userId: context.userId,
          details: {
            plugin: context.pluginName,
            action: context.action,
            success: !!result,
          },
          action: 'plugin_after_handler',
        });
      }
    },

    onError: async (context: any, error: any) => {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.HIGH,
        userId: context.userId,
        details: {
          plugin: context.pluginName,
          error: error.message,
        },
        action: 'plugin_error',
      });
    },
  };
};
