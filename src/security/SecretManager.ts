/**
 * Secret Manager - Безопасное управление API ключами
 * Обеспечивает централизованное управление секретами без захардкоженных значений
 */

import { logger } from '@elizaos/core';

export class SecretManager {
  private static instance: SecretManager;
  private cache = new Map<string, string>();
  private validationRules = new Map<string, (value: string) => boolean>();

  private constructor() {
    this.initializeValidationRules();
  }

  static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  /**
   * Инициализация правил валидации для различных ключей
   */
  private initializeValidationRules(): void {
    this.validationRules.set('TELEGRAM_BOT_TOKEN', (value: string) => {
      // Telegram Bot Token формат: digits:hash
      return /^\d+:[A-Za-z0-9_-]{35}$/.test(value);
    });

    this.validationRules.set('FAL_KEY', (value: string) => {
      // FAL API Key обычно длинная строка
      return value.length > 20 && !/\s/.test(value);
    });

    this.validationRules.set('OPENAI_API_KEY', (value: string) => {
      // OpenAI ключ начинается с sk-
      return /^sk-[a-zA-Z0-9]{48}$/.test(value);
    });

    this.validationRules.set('ANTHROPIC_API_KEY', (value: string) => {
      // Anthropic ключ начинается с sk-ant-
      return /^sk-ant-[a-zA-Z0-9_-]{95}$/.test(value);
    });

    this.validationRules.set('OPENROUTER_API_KEY', (value: string) => {
      // OpenRouter ключ
      return /^sk-or-[a-zA-Z0-9_-]{40,}$/.test(value);
    });
  }

  /**
   * Получение секрета с валидацией
   */
  getSecret(key: string, required: boolean = true): string | null {
    // Проверяем кэш
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Получаем из переменных окружения
    const value = process.env[key];

    if (!value) {
      if (required) {
        logger.error(`❌ [SECURITY] Secret ${key} not found in environment`);
        throw new Error(`Secret ${key} not configured`);
      }
      return null;
    }

    // Валидируем значение
    if (!this.validateSecretValue(key, value)) {
      logger.error(`❌ [SECURITY] Invalid format for secret ${key}`);
      throw new Error(`Secret ${key} has invalid format`);
    }

    // Кэшируем только в памяти (никогда не логируем полное значение)
    this.cache.set(key, value);
    this.logSecretAccess(key, true);

    return value;
  }

  /**
   * Валидация значения секрета
   */
  private validateSecretValue(key: string, value: string): boolean {
    const validator = this.validationRules.get(key);
    if (!validator) {
      // Если нет валидатора, просто проверяем что значение не пустое
      return value.length > 0;
    }
    return validator(value);
  }

  /**
   * Проверка наличия всех необходимых секретов
   */
  validateSecrets(requiredKeys: string[]): { valid: boolean; missing: string[]; invalid: string[] } {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const key of requiredKeys) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
        continue;
      }

      if (!this.validateSecretValue(key, value)) {
        invalid.push(key);
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  /**
   * Безопасное получение нескольких секретов
   */
  getSecrets(keys: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      try {
        result[key] = this.getSecret(key, false);
      } catch (error) {
        result[key] = null;
      }
    }
    return result;
  }

  /**
   * Очистка кэша секретов (для безопасности)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🔐 [SECURITY] Secret cache cleared');
  }

  /**
   * Логирование доступа к секретам
   */
  private logSecretAccess(key: string, success: boolean): void {
    const preview = key.substring(0, 4) + '***' + key.substring(key.length - 2);
    logger.info(`🔑 [SECURITY] Secret access: ${key} (${success ? 'success' : 'failed'})`);
  }

  /**
   * Получение статистики по секретам
   */
  getStats(): {
    totalSecrets: number;
    cachedSecrets: number;
    validationRules: number;
  } {
    return {
      totalSecrets: Object.keys(process.env).filter(k =>
        k.includes('API_KEY') ||
        k.includes('TOKEN') ||
        k.includes('SECRET')
      ).length,
      cachedSecrets: this.cache.size,
      validationRules: this.validationRules.size,
    };
  }
}

// Экспорт singleton instance
export const secretManager = SecretManager.getInstance();
