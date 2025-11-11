#!/usr/bin/env node
/**
 * Infisical Preload Script
 * Загружает секреты из Infisical Cloud ДО запуска ElizaOS
 * Этот скрипт выполняется перед загрузкой любых модулей проекта
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env файл
config({ path: join(__dirname, '.env') });

const INFISICAL_API_URL = 'https://app.infisical.com/api';

/**
 * Получает access token от Infisical
 */
async function getInfisicalAccessToken(clientId, clientSecret) {
  const params = new URLSearchParams();
  params.append('clientId', clientId);
  params.append('clientSecret', clientSecret);

  const response = await fetch(`${INFISICAL_API_URL}/v1/auth/universal-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate with Infisical: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.accessToken;
}

/**
 * Получает список секретов из Infisical
 */
async function fetchInfisicalSecrets(accessToken, projectId, environment) {
  const url = new URL(`${INFISICAL_API_URL}/v4/secrets`);
  url.searchParams.append('projectId', projectId);
  url.searchParams.append('environment', environment);
  url.searchParams.append('secretPath', '/');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch secrets from Infisical: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.secrets || [];
}

/**
 * Загружает секреты из Infisical и устанавливает их в process.env
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

    console.log('🔐 [Preload] Connecting to Infisical Cloud...');
    console.log(`📁 [Preload] Project ID: ${projectId}`);
    console.log(`🌍 [Preload] Environment: ${environment}`);

    // Получаем access token
    const accessToken = await getInfisicalAccessToken(clientId, clientSecret);
    console.log('✅ [Preload] Successfully authenticated with Infisical');

    // Получаем секреты
    const secrets = await fetchInfisicalSecrets(accessToken, projectId, environment);

    // Применяем секреты к process.env
    let appliedCount = 0;
    for (const secret of secrets) {
      if (secret.secretKey && secret.secretValue) {
        process.env[secret.secretKey] = secret.secretValue;
        appliedCount++;
      }
    }

    console.log(`✅ [Preload] Applied ${appliedCount} secrets to environment`);

    // Проверяем критичные ключи
    if (process.env.OPENROUTER_API_KEY) {
      const keyPreview =
        process.env.OPENROUTER_API_KEY.substring(0, 10) +
        '...' +
        process.env.OPENROUTER_API_KEY.slice(-4);
      console.log(`🔑 [Preload] OPENROUTER_API_KEY is set: ${keyPreview}`);
    } else {
      console.log('⚠️  [Preload] OPENROUTER_API_KEY not found in secrets');
    }
  } catch (error) {
    console.error('❌ [Preload] Failed to load secrets from Infisical:', error.message);
    console.log('⚠️  [Preload] Continuing without cloud secrets...');
  }
}

// Загружаем секреты синхронно через top-level await
await loadInfisicalSecrets();

console.log('✅ [Preload] Infisical preload completed, starting ElizaOS...\n');
