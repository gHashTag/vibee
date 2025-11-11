/**
 * 🔐 INFISICAL CLOUD-FIRST SECRET MANAGER
 * Интеграция Infisical SDK для ElizaOS проекта
 */

import { InfisicalSDK } from '@infisical/sdk';
import { logger } from '@elizaos/core';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Загружаем .env файл
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Загружаем .env.local для локальных переопределений
try {
  config({ path: join(__dirname, '..', '.env.local') });
  logger.info('📁 Loaded .env.local for local overrides');
} catch (e) {
  // .env.local необязателен
}

// Singleton instance клиента
let infisicalClient: InfisicalSDK | null = null;
let isAuthenticated = false;
let secretCache: Record<string, string> = {};

// Environment detection
const environment = (process.env.INFISICAL_ENVIRONMENT || 'dev') as 'dev' | 'staging' | 'prod';

/**
 * 🚀 Инициализация Infisical и загрузка ВСЕХ секретов
 */
export async function loadInfisicalSecrets(): Promise<Record<string, string>> {
  try {
    // Проверяем наличие credentials
    const clientId = process.env.INFISICAL_CLIENT_ID;
    const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
    const projectId = process.env.INFISICAL_PROJECT_ID;

    if (!clientId || !clientSecret || !projectId) {
      logger.warn('⚠️  Infisical credentials not found, skipping cloud secrets loading');
      return {};
    }

    logger.info('🔐 Connecting to Infisical Cloud...');
    logger.info(`📁 Project ID: ${projectId}`);
    logger.info(`🌍 Environment: ${environment}`);

    // Создаем клиент Infisical SDK
    infisicalClient = new InfisicalSDK({
      siteUrl: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
    });

    // Авторизация через Universal Auth
    await infisicalClient.auth().universalAuth.login({
      clientId,
      clientSecret,
    });

    isAuthenticated = true;
    logger.info('✅ Successfully authenticated with Infisical');

    // Получаем ВСЕ секреты из root path
    const result = await infisicalClient.secrets().listSecrets({
      projectId,
      environment,
      secretPath: '/',
    });

    // Сохраняем в кэш
    secretCache = {};
    for (const secret of result.secrets) {
      secretCache[secret.secretKey] = secret.secretValue;

      // DEBUG: Логируем TELEGRAM_BOT_TOKEN
      if (secret.secretKey === 'TELEGRAM_BOT_TOKEN') {
        logger.info(`🔍 TELEGRAM_BOT_TOKEN from Infisical: ${secret.secretValue.substring(0, 10)}...`);
      }
    }

    logger.info(`✅ Successfully loaded ${result.secrets.length} secrets from Infisical Cloud`);

    if (result.secrets.length > 0) {
      const keys = Object.keys(secretCache);
      logger.info(`📋 Loaded ${keys.length} secret keys from Infisical`);

      // Показываем первые несколько символов каждого ключа
      const keyPreview = keys
        .slice(0, 10)
        .map((k) => `${k.substring(0, Math.min(20, k.length))}...`)
        .join(', ');
      logger.info(`🔑 Secret keys preview: ${keyPreview}`);
    }

    return secretCache;
  } catch (error) {
    logger.error('❌ Failed to load secrets from Infisical:', error);
    logger.warn('⚠️  Continuing without cloud secrets...');
    return {};
  }
}

/**
 * Применяет загруженные секреты к process.env
 * ВАЖНО: Перезаписывает существующие переменные из Infisical (они имеют приоритет)
 */
export function applySecretsToEnv(secrets: Record<string, string>): void {
  let appliedCount = 0;
  let overwrittenCount = 0;

  for (const [key, value] of Object.entries(secrets)) {
    if (process.env[key]) {
      // Infisical секреты имеют приоритет над локальными .env
      logger.debug(`🔄 Overwriting ${key} with Infisical value`);
      overwrittenCount++;
    }

    process.env[key] = value;
    appliedCount++;
  }

  logger.info(`✅ Applied ${appliedCount} secrets to environment`);
  if (overwrittenCount > 0) {
    logger.info(`🔄 Overwritten ${overwrittenCount} local secrets with Infisical values`);
  }
}

/**
 * Основная функция инициализации Infisical
 * Загружает секреты и применяет их к process.env
 */
export async function initializeInfisical(): Promise<void> {
  logger.info('🚀 Initializing Infisical Cloud integration...');

  const secrets = await loadInfisicalSecrets();

  if (Object.keys(secrets).length > 0) {
    applySecretsToEnv(secrets);
    logger.info('✅ Infisical initialization completed');

    // Проверяем, что ключ OpenRouter действительно установлен
    if (process.env.OPENROUTER_API_KEY) {
      const keyPreview =
        process.env.OPENROUTER_API_KEY.substring(0, 10) + '...' + process.env.OPENROUTER_API_KEY.slice(-4);
      logger.info(`🔑 OPENROUTER_API_KEY is set: ${keyPreview}`);
    } else {
      logger.warn('⚠️  OPENROUTER_API_KEY not found in loaded secrets');
    }
  } else {
    logger.warn('⚠️  No secrets loaded from Infisical, using local .env only');
  }
}
