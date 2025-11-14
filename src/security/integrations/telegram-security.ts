/**
 * Интеграция системы безопасности с Telegram ботами
 * Middleware и валидация для телеграм-сообщений
 */

import { Context } from 'telegraf';
import { RateLimiter, RateLimitPresets, KeyGenerators, createRateLimitMiddleware } from '../RateLimiter';
import {
  validateTelegramMessage,
  validateBotCommand,
  sanitizeText,
  TextInputSchema,
} from '../ValidationUtils';
import { securityLogger, SecurityEventType, SecuritySeverity } from '../SecurityLogger';

export interface TelegramSecurityConfig {
  enableRateLimit: boolean;
  rateLimitConfig?: {
    limit: number;
    window: number;
  };
  enableMessageValidation: boolean;
  enableCommandValidation: boolean;
  maxMessageLength: number;
}

/**
 * Middleware для rate limiting Telegram команд
 */
export const createTelegramRateLimitMiddleware = (
  config: TelegramSecurityConfig = defaultTelegramSecurityConfig
) => {
  if (!config.enableRateLimit) {
    return (ctx: Context, next: () => Promise<any>) => next();
  }

  const limiter = new RateLimiter(
    config.rateLimitConfig || RateLimitPresets.botCommands,
    KeyGenerators.userId
  );

  return createRateLimitMiddleware(
    limiter,
    KeyGenerators.userId,
    config.rateLimitConfig
  );
};

/**
 * Middleware для валидации сообщений
 */
export const createMessageValidationMiddleware = (
  config: TelegramSecurityConfig = defaultTelegramSecurityConfig
) => {
  if (!config.enableMessageValidation) {
    return (ctx: Context, next: () => Promise<any>) => next();
  }

  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      // Проверяем, что есть сообщение
      if (!ctx.message) {
        return next();
      }

      // Валидируем сообщение
      const validated = validateTelegramMessage(ctx.message);

      // Санитизируем текст если есть
      if (validated.text) {
        const sanitized = sanitizeText(validated.text);

        // Проверяем длину
        if (sanitized.length > config.maxMessageLength) {
          securityLogger.log({
            type: SecurityEventType.VALIDATION_FAILED,
            severity: SecuritySeverity.MEDIUM,
            userId: ctx.from?.id,
            details: {
              field: 'message_length',
              value: sanitized.length.toString(),
              reason: `exceeded_max_length_${config.maxMessageLength}`,
              context: 'telegram_message',
            },
            action: 'message_validation_failed',
          });

          await ctx.reply(
            `⚠️ Слишком длинное сообщение (максимум ${config.maxMessageLength} символов)`
          );
          return;
        }
      }

      return next();

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.VALIDATION_FAILED,
        severity: SecuritySeverity.HIGH,
        userId: ctx.from?.id,
        details: {
          error: error.message,
          context: 'telegram_message_validation',
        },
        action: 'message_validation_error',
      });

      await ctx.reply('❌ Ошибка валидации сообщения');
    }
  };
};

/**
 * Middleware для валидации команд бота
 */
export const createCommandValidationMiddleware = (
  config: TelegramSecurityConfig = defaultTelegramSecurityConfig
) => {
  if (!config.enableCommandValidation) {
    return (ctx: Context, next: () => Promise<any>) => next();
  }

  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) {
        return next();
      }

      // Валидируем команду
      const validated = validateBotCommand(ctx.message.text);

      // Проверяем подозрительные паттерны
      if (/<script|javascript:|on\w+=/i.test(ctx.message.text)) {
        securityLogger.logXssAttempt(
          ctx.from?.id || 0,
          ctx.message.text,
          'telegram_command'
        );

        await ctx.reply('❌ Недопустимая команда');
        return;
      }

      // Ограничиваем длину команды
      if (validated.length > 100) {
        await ctx.reply('⚠️ Слишком длинная команда (максимум 100 символов)');
        return;
      }

      return next();

    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.VALIDATION_FAILED,
        severity: SecuritySeverity.HIGH,
        userId: ctx.from?.id,
        details: {
          error: error.message,
          context: 'telegram_command_validation',
        },
        action: 'command_validation_error',
      });

      await ctx.reply('❌ Ошибка валидации команды');
    }
  };
};

/**
 * Хендлер для обработки ошибок безопасности
 */
export const createSecurityErrorHandler = () => {
  return async (ctx: Context, error: any) => {
    securityLogger.log({
      type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
      severity: SecuritySeverity.MEDIUM,
      userId: ctx.from?.id,
      details: {
        error: error.message,
        updateType: ctx.updateType,
        context: 'error_handler',
      },
      action: 'security_error',
    });

    logger.error('[SECURITY] Telegram security error:', error);
  };
};

/**
 * Функция для безопасного ответа пользователю
 */
export const secureReply = async (
  ctx: Context,
  text: string,
  options?: any
): Promise<void> => {
  // Санитизируем ответ
  const sanitizedText = sanitizeText(text);

  // Ограничиваем длину
  if (sanitizedText.length > 4096) {
    logger.warn('[SECURITY] Reply truncated due to length', {
      originalLength: sanitizedText.length,
      maxLength: 4096,
      userId: ctx.from?.id,
    });
  }

  try {
    await ctx.reply(sanitizedText.substring(0, 4096), options);
  } catch (error) {
    securityLogger.log({
      type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
      severity: SecuritySeverity.LOW,
      userId: ctx.from?.id,
      details: {
        error: error.message,
        context: 'secure_reply',
      },
      action: 'reply_error',
    });
  }
};

/**
 * Конфигурация по умолчанию
 */
export const defaultTelegramSecurityConfig: TelegramSecurityConfig = {
  enableRateLimit: true,
  rateLimitConfig: RateLimitPresets.botCommands,
  enableMessageValidation: true,
  enableCommandValidation: true,
  maxMessageLength: 4096,
};

/**
 * Объединенный middleware для всей безопасности
 */
export const createTelegramSecurityMiddleware = (
  config: TelegramSecurityConfig = defaultTelegramSecurityConfig
) => {
  return async (ctx: Context, next: () => Promise<any>) => {
    // Логируем начало обработки
    if (ctx.from) {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.LOW,
        userId: ctx.from.id,
        username: ctx.from.username,
        details: {
          updateType: ctx.updateType,
          chatType: ctx.chat?.type,
        },
        action: 'telegram_update_received',
      });
    }

    // Применяем middleware
    const middlewares = [
      createMessageValidationMiddleware(config),
      createCommandValidationMiddleware(config),
      createTelegramRateLimitMiddleware(config),
    ];

    // Выполняем middleware последовательно
    for (const middleware of middlewares) {
      await new Promise((resolve) => {
        middleware(ctx, resolve as any);
      });
    }

    return next();
  };
};
