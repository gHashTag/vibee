import * as dotenv from 'dotenv';

// Загрузка переменных окружения из .env файла
dotenv.config();

export interface SecretValue {
  value: string;
  required: boolean;
  description?: string;
}

export interface SecretsConfig {
  [key: string]: SecretValue;
}

// Карта секретов с метаданными
export const SECRETS_MAP: SecretsConfig = {
  TELEGRAM_BOT_TOKEN: {
    value: process.env.TELEGRAM_BOT_TOKEN || '',
    required: true,
    description: 'Токен Telegram бота для отправки сообщений'
  },
  OPENROUTER_API_KEY: {
    value: process.env.OPENROUTER_API_KEY || '',
    required: true,
    description: 'API ключ для OpenRouter (используется для AI моделей)'
  },
  KIE_AI_API_KEY: {
    value: process.env.KIE_AI_API_KEY || '',
    required: false,
    description: 'API ключ для KIE AI провайдера'
  },
  FAL_KEY: {
    value: process.env.FAL_KEY || '',
    required: false,
    description: 'API ключ для FAL (генерация изображений)'
  },
  TELEGRAM_API_ID: {
    value: process.env.TELEGRAM_API_ID || '',
    required: false,
    description: 'ID приложения Telegram для API'
  },
  TELEGRAM_API_HASH: {
    value: process.env.TELEGRAM_API_HASH || '',
    required: false,
    description: 'Хеш приложения Telegram для API'
  },
  DATABASE_URL: {
    value: process.env.DATABASE_URL || '',
    required: false,
    description: 'URL базы данных PostgreSQL'
  },
  REDIS_URL: {
    value: process.env.REDIS_URL || '',
    required: false,
    description: 'URL Redis для кэширования'
  },
  NODE_ENV: {
    value: process.env.NODE_ENV || 'development',
    required: false,
    description: 'Окружение приложения (development/production/test)'
  },
  DEBUG: {
    value: process.env.DEBUG || 'false',
    required: false,
    description: 'Включение режима отладки'
  },
  LOG_LEVEL: {
    value: process.env.LOG_LEVEL || 'info',
    required: false,
    description: 'Уровень логирования (error/warn/info/debug)'
  }
};

/**
 * Получить значение секрета с проверкой
 */
export function getSecret(key: string): string {
  const secret = SECRETS_MAP[key];

  if (!secret) {
    throw new Error(`Секрет с ключом "${key}" не найден в конфигурации`);
  }

  if (!secret.value && secret.required) {
    throw new Error(`Обязательный секрет "${key}" не установлен`);
  }

  return secret.value;
}

/**
 * Проверить, установлен ли секрет
 */
export function hasSecret(key: string): boolean {
  const secret = SECRETS_MAP[key];
  return secret ? Boolean(secret.value) : false;
}

/**
 * Получить все секреты как объект
 */
export function getAllSecrets(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, secret] of Object.entries(SECRETS_MAP)) {
    if (secret.value) {
      result[key] = secret.value;
    }
  }

  return result;
}

/**
 * Валидация обязательных секретов
 */
export function validateRequiredSecrets(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const [key, secret] of Object.entries(SECRETS_MAP)) {
    if (secret.required && !secret.value) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Подстановка переменных окружения в строки конфигурации
 * Формат: ${VAR_NAME}
 */
export function resolveEnvVars(config: any): any {
  if (typeof config === 'string') {
    return config.replace(/\$\{(\w+)\}/g, (match, varName) => {
      const value = SECRETS_MAP[varName]?.value;
      if (!value) {
        console.warn(`Переменная окружения "${varName}" не найдена, оставляем как есть: ${match}`);
        return match;
      }
      return value;
    });
  }

  if (Array.isArray(config)) {
    return config.map(item => resolveEnvVars(item));
  }

  if (config && typeof config === 'object') {
    const resolved: any = {};
    for (const [key, value] of Object.entries(config)) {
      resolved[key] = resolveEnvVars(value);
    }
    return resolved;
  }

  return config;
}

/**
 * Маскирование секретов для логирования
 */
export function maskSecrets(obj: any): any {
  if (typeof obj === 'string') {
    // Маскируем строки, похожие на токены (длинные строки с буквами и цифрами)
    if (obj.length > 20 && /^[A-Za-z0-9_-]+$/.test(obj)) {
      return obj.substring(0, 6) + '...' + obj.substring(obj.length - 4);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSecrets(item));
  }

  if (obj && typeof obj === 'object') {
    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')) {
        masked[key] = '***';
      } else {
        masked[key] = maskSecrets(value);
      }
    }
    return masked;
  }

  return obj;
}

/**
 * Проверка безопасности переменных окружения
 */
export function checkSecurity(): {
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Проверяем NODE_ENV
  const nodeEnv = getSecret('NODE_ENV');
  if (nodeEnv === 'development' && nodeEnv === 'production') {
    warnings.push('NODE_ENV не установлен корректно');
  }

  // Проверяем DEBUG в продакшене
  if (nodeEnv === 'production' && getSecret('DEBUG') === 'true') {
    errors.push('DEBUG не должен быть включен в production окружении');
  }

  // Проверяем наличие .env файла
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    warnings.push('.env файл не найден');
  }

  // Проверяем права доступа к .env файлу
  if (fs.existsSync(envPath)) {
    const stats = fs.statSync(envPath);
    const mode = stats.mode.toString(8);
    if (mode !== '100600' && mode !== '100400') {
      warnings.push('.env файл может быть доступен для чтения другим пользователям');
    }
  }

  return { warnings, errors };
}
