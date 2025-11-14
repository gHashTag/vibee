/**
 * Тесты системы безопасности
 * Проверяет все компоненты безопасности
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecretManager } from '../../security/SecretManager';
import { RateLimiter, RateLimitPresets, KeyGenerators } from '../../security/RateLimiter';
import { SecurityLogger, SecurityEventType, SecuritySeverity } from '../../security/SecurityLogger';
import {
  validateWithSchema,
  sanitizeText,
  safeJsonParse,
  TextInputSchema,
  UrlSchema,
  UsernameSchema,
} from '../../security/ValidationUtils';
import { z } from 'zod';

// Мокируем переменные окружения
const mockEnv = {
  TELEGRAM_BOT_TOKEN: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890',
  FAL_KEY: 'mock_fal_key_1234567890123456789012',
  OPENAI_API_KEY: 'sk-1234567890abcdef1234567890abcdef1234567890abcdef',
};

describe('🔐 Security System Tests', () => {
  beforeEach(() => {
    // Очищаем переменные окружения
    vi.clearAllMocks();

    // Устанавливаем моки
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubGlobal('process', {
        ...process,
        env: {
          ...process.env,
          [key]: value,
        },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🗝️ SecretManager', () => {
    it('должен успешно получить валидный секрет', () => {
      const manager = SecretManager.getInstance();

      expect(() => {
        const token = manager.getSecret('TELEGRAM_BOT_TOKEN');
        expect(token).toBe(mockEnv.TELEGRAM_BOT_TOKEN);
      }).not.toThrow();
    });

    it('должен выбросить ошибку для отсутствующего секрета', () => {
      const manager = SecretManager.getInstance();

      expect(() => {
        manager.getSecret('NONEXISTENT_SECRET');
      }).toThrow('Secret NONEXISTENT_SECRET not configured');
    });

    it('должен валидировать формат Telegram токена', () => {
      const manager = SecretManager.getInstance();

      vi.stubGlobal('process', {
        ...process,
        env: {
          ...process.env,
          TELEGRAM_BOT_TOKEN: 'invalid_token',
        },
      });

      expect(() => {
        manager.getSecret('TELEGRAM_BOT_TOKEN');
      }).toThrow('Secret TELEGRAM_BOT_TOKEN has invalid format');
    });

    it('должен проверить несколько секретов', () => {
      const manager = SecretManager.getInstance();

      const result = manager.validateSecrets([
        'TELEGRAM_BOT_TOKEN',
        'FAL_KEY',
        'NONEXISTENT_SECRET',
      ]);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('NONEXISTENT_SECRET');
    });

    it('должен получить статистику секретов', () => {
      const manager = SecretManager.getInstance();
      const stats = manager.getStats();

      expect(stats).toHaveProperty('totalSecrets');
      expect(stats).toHaveProperty('cachedSecrets');
      expect(stats).toHaveProperty('validationRules');
    });
  });

  describe('⏱️ RateLimiter', () => {
    it('должен разрешить запросы в пределах лимита', () => {
      const limiter = new RateLimiter(RateLimitPresets.botCommands, KeyGenerators.userId);

      // Первый запрос должен пройти
      const result1 = limiter.check('user:123');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Второй запрос должен пройти
      const result2 = limiter.check('user:123');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('должен блокировать после превышения лимита', () => {
      const limiter = new RateLimiter(RateLimitPresets.botCommands, KeyGenerators.userId);

      // Исчерпываем все токены
      for (let i = 0; i < 5; i++) {
        limiter.check('user:123');
      }

      // Следующий запрос должен быть заблокирован
      const result = limiter.check('user:123');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('должен использовать разные ключи для разных пользователей', () => {
      const limiter = new RateLimiter(RateLimitPresets.botCommands, KeyGenerators.userId);

      const user1 = limiter.check('user:123');
      const user2 = limiter.check('user:456');

      expect(user1.allowed).toBe(true);
      expect(user2.allowed).toBe(true);
      expect(user1.remaining).toBe(user2.remaining);
    });

    it('должен получить статистику по ключу', () => {
      const limiter = new RateLimiter(RateLimitPresets.botCommands, KeyGenerators.userId);

      limiter.check('user:123');
      const stats = limiter.getStats('user:123');

      expect(stats.exists).toBe(true);
      expect(stats.violations).toBe(0);
    });
  });

  describe('📝 SecurityLogger', () => {
    it('должен логировать события безопасности', () => {
      const logger = SecurityLogger.getInstance();

      const event = {
        type: SecurityEventType.AUTH_SUCCESS,
        severity: SecuritySeverity.LOW,
        userId: '123',
        details: { test: true },
        action: 'test',
      };

      expect(() => {
        logger.log(event);
      }).not.toThrow();
    });

    it('должен логировать успешную аутентификацию', () => {
      const logger = SecurityLogger.getInstance();

      expect(() => {
        logger.logAuthSuccess('123', { method: 'telegram' });
      }).not.toThrow();
    });

    it('должен логировать превышение rate limit', () => {
      const logger = SecurityLogger.getInstance();

      expect(() => {
        logger.logRateLimitExceeded('123', 'user:123', 5, 60000, 1);
      }).not.toThrow();
    });

    it('должен логировать попытки XSS атак', () => {
      const logger = SecurityLogger.getInstance();

      expect(() => {
        logger.logXssAttempt('123', '<script>alert(1)</script>', 'telegram_command');
      }).not.toThrow();
    });

    it('должен генерировать отчет по безопасности', () => {
      const logger = SecurityLogger.getInstance();

      // Логируем несколько событий
      logger.logAuthSuccess('123');
      logger.logAuthSuccess('456');

      const report = logger.getReport();

      expect(report.totalEvents).toBeGreaterThanOrEqual(2);
      expect(report.eventsByType).toHaveProperty(SecurityEventType.AUTH_SUCCESS);
    });
  });

  describe('✅ ValidationUtils', () => {
    it('должен валидировать корректный текстовый ввод', () => {
      const result = validateWithSchema(
        TextInputSchema,
        { text: 'Привет мир!' },
        'test'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('Привет мир!');
      }
    });

    it('должен отклонять текст с HTML тегами', () => {
      const result = validateWithSchema(
        TextInputSchema,
        { text: 'Hello <script>alert(1)</script>' },
        'test'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Недопустимые символы');
      }
    });

    it('должен санитизировать опасный текст', () => {
      const unsafe = '<script>alert(1)</script>Hello';
      const safe = sanitizeText(unsafe);

      expect(safe).not.toContain('<script>');
      expect(safe).not.toContain('</script>');
      expect(safe).toContain('Hello');
    });

    it('должен валидировать корректный username', () => {
      const result = validateWithSchema(
        UsernameSchema,
        'user123',
        'test'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user123');
      }
    });

    it('должен отклонять некорректный username', () => {
      const result = validateWithSchema(
        UsernameSchema,
        'user@#$%',
        'test'
      );

      expect(result.success).toBe(false);
    });

    it('должен безопасно парсить JSON', () => {
      const validJson = '{"name": "test", "value": 123}';
      const invalidJson = '{"name": "test", "value": }';

      const ValidSchema = z.object({
        name: z.string(),
        value: z.number(),
      });

      // Валидный JSON
      const result1 = safeJsonParse(validJson, ValidSchema, {}, 'test');
      expect(result1).toEqual({ name: 'test', value: 123 });

      // Невалидный JSON (возвращается fallback)
      const result2 = safeJsonParse(invalidJson, ValidSchema, { fallback: true }, 'test');
      expect(result2).toEqual({ fallback: true });
    });

    it('должен валидировать URL', () => {
      const result = validateWithSchema(
        UrlSchema,
        'https://example.com/path',
        'test'
      );

      expect(result.success).toBe(true);
    });

    it('должен отклонять небезопасные URL', () => {
      const result = validateWithSchema(
        UrlSchema,
        'javascript:alert(1)',
        'test'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('🔒 Integration Tests', () => {
    it('должен работать полный цикл валидации и логирования', () => {
      const secretManager = SecretManager.getInstance();
      const securityLogger = SecurityLogger.getInstance();
      const limiter = new RateLimiter(RateLimitPresets.botCommands, KeyGenerators.userId);

      // 1. Проверяем секрет
      const token = secretManager.getSecret('TELEGRAM_BOT_TOKEN');
      expect(token).toBeDefined();

      // 2. Проверяем rate limit
      const rateLimitResult = limiter.check('user:123');
      expect(rateLimitResult.allowed).toBe(true);

      // 3. Валидируем входные данные
      const validationResult = validateWithSchema(
        TextInputSchema,
        { text: 'Test message' },
        'integration_test'
      );
      expect(validationResult.success).toBe(true);

      // 4. Логируем событие
      securityLogger.log({
        type: SecurityEventType.AUTH_SUCCESS,
        severity: SecuritySeverity.LOW,
        userId: '123',
        details: { integrationTest: true },
        action: 'integration_test',
      });

      // Все проверки прошли успешно
      expect(true).toBe(true);
    });
  });
});

/**
 * Запуск тестов безопасности:
 * npm test src/__tests__/security/security-system.test.ts
 */
