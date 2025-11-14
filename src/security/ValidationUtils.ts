/**
 * Валидация и санитизация данных
 * Предотвращает XSS, SQL injection и другие атаки
 */

import { z } from 'zod';
import { logger } from '@elizaos/core';

// ============================================================================
// СХЕМЫ ВАЛИДАЦИИ
// ============================================================================

/**
 * Схема для валидации текстового ввода пользователя
 */
export const TextInputSchema = z.object({
  text: z.string()
    .min(1, 'Текст не может быть пустым')
    .max(4096, 'Слишком длинный текст (максимум 4096 символов)')
    .refine(
      (text) => !/[<>]/.test(text),
      'Недопустимые символы < и >'
    )
    .refine(
      (text) => !/javascript:/i.test(text),
      'Недопустимый протокол'
    )
    .refine(
      (text) => !/on\w+=/i.test(text),
      'Недопустимые обработчики событий'
    ),
  metadata: z.object({
    userId: z.string().optional(),
    messageId: z.string().optional(),
  }).optional(),
});

/**
 * Схема для валидации username
 */
export const UsernameSchema = z.string()
  .min(3, 'Слишком короткий username (минимум 3 символа)')
  .max(32, 'Слишком длинный username (максимум 32 символа)')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Только латинские буквы, цифры и подчеркивание'
  )
  .refine(
    (username) => !username.match(/^(admin|root|system|god)$/i),
    'Зарезервированные имена'
  );

/**
 * Схема для валидации числового ввода
 */
export const NumberInputSchema = z.number()
  .finite('Число должно быть конечным')
  .min(0, 'Число не может быть отрицательным')
  .max(1000000, 'Слишком большое число');

/**
 * Схема для валидации URL
 */
export const UrlSchema = z.string()
  .url('Некорректный URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // Только безопасные протоколы
        return ['https:', 'http:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'Недопустимый протокол. Разрешены только http и https'
  )
  .refine(
    (url) => !url.includes('..'),
    'Недопустимые символы в URL'
  );

/**
 * Схема для валидации email
 */
export const EmailSchema = z.string()
  .email('Некорректный email')
  .max(254, 'Слишком длинный email');

/**
 * Схема для валидации ID пользователя Telegram
 */
export const TelegramUserIdSchema = z.string()
  .regex(/^\d+$/, 'ID пользователя должен содержать только цифры')
  .refine(
    (id) => {
      const numId = parseInt(id, 10);
      return numId > 0 && numId < 1000000000000;
    },
    'Некорректный ID пользователя'
  );

// ============================================================================
// САНИТИЗАЦИЯ
// ============================================================================

/**
 * Санитизация текста для предотвращения XSS
 */
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') {
    throw new Error('Текст должен быть строкой');
  }

  return text
    // Удаляем HTML теги
    .replace(/<[^>]*>/g, '')
    // Удаляем потенциально опасные протоколы
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Удаляем обработчики событий
    .replace(/on\w+=/gi, '')
    // Удаляем непечатаемые символы кроме \n, \r, \t
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    // Триммим
    .trim();
};

/**
 * Санитизация для использования в SQL (базовая)
 */
export const sanitizeForSql = (text: string): string => {
  return sanitizeText(text)
    .replace(/['";\\]/g, ''); // Экранируем спецсимволы SQL
};

/**
 * Санитизация filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\./, '_')
    .substring(0, 255);
};

/**
 * Санитизация для промптов
 */
export const sanitizePrompt = (prompt: string): string => {
  return sanitizeText(prompt)
    // Ограничиваем длину
    .substring(0, 1000)
    // Удаляем системные промпты
    .replace(/system|role|act as/gi, '');
};

// ============================================================================
// ВАЛИДАЦИЯ С ПЕРЕХВАТОМ ОШИБОК
// ============================================================================

/**
 * Валидация с безопасной обработкой ошибок
 */
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      logger.warn(`[SECURITY] Validation failed for ${context}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
    logger.error(`[SECURITY] Unexpected validation error for ${context}:`, error);
    return { success: false, error: 'Непредвиденная ошибка валидации' };
  }
};

/**
 * Безопасный JSON.parse с валидацией
 */
export const safeJsonParse = <T>(
  json: string,
  schema: z.ZodSchema<T>,
  fallback: T,
  context: string
): T => {
  try {
    const parsed = JSON.parse(json);
    const validated = validateWithSchema(schema, parsed, context);

    if (validated.success) {
      return validated.data;
    }

    logger.warn(`[SECURITY] JSON validation failed for ${context}:`, validated.error);
    return fallback;
  } catch (error) {
    logger.warn(`[SECURITY] JSON parse error for ${context}:`, error);
    return fallback;
  }
};

// ============================================================================
// СПЕЦИАЛИЗИРОВАННЫЕ ВАЛИДАТОРЫ
// ============================================================================

/**
 * Валидация Telegram сообщения
 */
export const validateTelegramMessage = (message: any) => {
  const validation = validateWithSchema(
    TextInputSchema,
    {
      text: message.text || '',
      metadata: {
        userId: message.from?.id?.toString(),
        messageId: message.message_id?.toString(),
      },
    },
    'telegram_message'
  );

  if (!validation.success) {
    throw new Error(`Invalid message: ${validation.error}`);
  }

  return validation.data;
};

/**
 * Валидация команд бота
 */
export const validateBotCommand = (command: string) => {
  const sanitized = sanitizeText(command);

  // Проверяем на подозрительные паттерны
  if (/<script|javascript:|on\w+=/i.test(command)) {
    logger.warn(`[SECURITY] Suspicious command pattern detected: ${command}`);
    throw new Error('Подозрительная команда');
  }

  return sanitized;
};

// ============================================================================
// ЭКСПОРТ ТИПОВ
// ============================================================================

export type TextInput = z.infer<typeof TextInputSchema>;
export type ValidatedUrl = z.infer<typeof UrlSchema>;
export type ValidatedUsername = z.infer<typeof UsernameSchema>;
