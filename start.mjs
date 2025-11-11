#!/usr/bin/env node
/**
 * ElizaOS Startup Wrapper with Infisical Preload
 * Загружает секреты из Infisical перед запуском ElizaOS CLI
 */

import { config } from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { InfisicalSDK } from '@infisical/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env
config({ path: join(__dirname, '.env') });

/**
 * Загружает секреты из Infisical используя SDK
 */
async function loadInfisicalSecrets() {
  try {
    const clientId = process.env.INFISICAL_CLIENT_ID;
    const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
    const projectId = process.env.INFISICAL_PROJECT_ID;
    const environment = process.env.INFISICAL_ENVIRONMENT || 'dev';

    if (!clientId || !clientSecret || !projectId) {
      console.log('⚠️  Infisical credentials not found, skipping cloud secrets loading');
      return;
    }

    console.log('🔐 Loading secrets from Infisical Cloud...');
    console.log(`📁 Project ID: ${projectId}`);
    console.log(`🌍 Environment: ${environment}`);

    // Создаем клиент Infisical SDK
    const client = new InfisicalSDK({
      siteUrl: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
    });

    // Авторизация через Universal Auth
    await client.auth().universalAuth.login({
      clientId,
      clientSecret,
    });

    console.log('✅ Successfully authenticated with Infisical');

    // Получаем все секреты
    const result = await client.secrets().listSecrets({
      projectId,
      environment,
      secretPath: '/',
    });

    // Применяем секреты к process.env
    let appliedCount = 0;
    for (const secret of result.secrets) {
      if (secret.secretKey && secret.secretValue) {
        process.env[secret.secretKey] = secret.secretValue;
        appliedCount++;
      }
    }

    console.log(`✅ Applied ${appliedCount} secrets to environment`);

    // Проверяем критичные ключи
    if (process.env.OPENROUTER_API_KEY) {
      const keyPreview =
        process.env.OPENROUTER_API_KEY.substring(0, 10) +
        '...' +
        process.env.OPENROUTER_API_KEY.slice(-4);
      console.log(`🔑 OPENROUTER_API_KEY is set: ${keyPreview}`);
    }
  } catch (error) {
    console.error('❌ Failed to load secrets from Infisical:', error.message);
    console.log('⚠️  Continuing without cloud secrets...');
  }
}

/**
 * Запускает ElizaOS CLI с загруженными секретами
 */
async function startElizaOS() {
  // Сначала загружаем секреты
  await loadInfisicalSecrets();

  console.log('🚀 Starting ElizaOS...\n');

  // Получаем команду из аргументов
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';

  // Запускаем ElizaOS CLI
  const elizaCli = spawn(
    join(__dirname, 'node_modules/.bin/elizaos'),
    [command, ...args.slice(1)],
    {
      stdio: 'inherit',
      env: process.env,
    },
  );

  elizaCli.on('close', (code) => {
    process.exit(code);
  });
}

// Запускаем
startElizaOS().catch((error) => {
  console.error('Failed to start ElizaOS:', error);
  process.exit(1);
});
