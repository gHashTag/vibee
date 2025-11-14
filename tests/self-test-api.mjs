#!/usr/bin/env node
/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Testing через Telegram Bot API
 *
 * Этот скрипт позволяет боту тестировать сам себя:
 * 1. Загружает токен из Infisical
 * 2. Получает chat_id из getMe или последнего сообщения
 * 3. Отправляет команды боту
 * 4. Читает и проверяет ответы
 */

import { InfisicalSDK } from '@infisical/sdk';
import 'dotenv/config';

const INFISICAL_CLIENT_ID = process.env.INFISICAL_CLIENT_ID;
const INFISICAL_CLIENT_SECRET = process.env.INFISICAL_CLIENT_SECRET;
const INFISICAL_PROJECT_ID = process.env.INFISICAL_PROJECT_ID;
const INFISICAL_ENVIRONMENT = process.env.INFISICAL_ENVIRONMENT || 'dev';

console.log('🌈 РАДУЖНЫЙ МОСТ - Self-Testing System');
console.log('=' .repeat(60));

// Загружаем токен из Infisical
async function loadBotToken() {
  console.log('🔐 Loading bot token from Infisical...');

  const client = new InfisicalSDK({
    siteUrl: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
  });

  await client.auth().universalAuth.login({
    clientId: INFISICAL_CLIENT_ID,
    clientSecret: INFISICAL_CLIENT_SECRET,
  });

  const secrets = await client.secrets().listSecrets({
    projectId: INFISICAL_PROJECT_ID,
    environment: INFISICAL_ENVIRONMENT,
    path: '/',
  });

  // Ищем TELEGRAM_BOT_TOKEN или BOT_TOKEN_TEST_1
  const tokenSecret = secrets.secrets.find(
    s => s.secretKey === 'TELEGRAM_BOT_TOKEN' || s.secretKey === 'BOT_TOKEN_TEST_1'
  );

  if (!tokenSecret) {
    throw new Error('❌ Bot token not found in Infisical!');
  }

  console.log(`✅ Loaded token: ${tokenSecret.secretKey}`);
  return tokenSecret.secretValue;
}

// Отправить сообщение через Bot API
async function sendMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`❌ sendMessage failed: ${data.description}`);
  }

  return data.result;
}

// Получить обновления
async function getUpdates(token, offset = 0) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&limit=10`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`❌ getUpdates failed: ${data.description}`);
  }

  return data.result;
}

// Получить информацию о боте
async function getMe(token) {
  const url = `https://api.telegram.org/bot${token}/getMe`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`❌ getMe failed: ${data.description}`);
  }

  return data.result;
}

// Найти последний chat_id из updates
async function findChatId(token) {
  console.log('🔍 Looking for recent chat_id...');

  const updates = await getUpdates(token);

  if (updates.length === 0) {
    console.log('⚠️  No recent messages found.');
    console.log('📝 Please send any message to the bot first!');
    console.log('   Then run this script again.');
    return null;
  }

  // Берём последнее сообщение от пользователя (не от бота)
  for (let i = updates.length - 1; i >= 0; i--) {
    const update = updates[i];
    if (update.message && update.message.from && !update.message.from.is_bot) {
      const chatId = update.message.chat.id;
      const username = update.message.from.username || update.message.from.first_name;
      console.log(`✅ Found chat_id: ${chatId} (@${username})`);
      return chatId;
    }
  }

  return null;
}

// Ждать ответ бота
async function waitForBotResponse(token, timeoutMs = 10000) {
  const startTime = Date.now();
  let lastUpdateId = 0;

  console.log(`⏳ Waiting for bot response (timeout: ${timeoutMs}ms)...`);

  while (Date.now() - startTime < timeoutMs) {
    const updates = await getUpdates(token, lastUpdateId);

    for (const update of updates) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id + 1);

      if (update.message && update.message.from && update.message.from.is_bot) {
        console.log('✅ Got bot response!');
        console.log(`📨 ${update.message.text || '[non-text message]'}`);
        return update.message;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('❌ Timeout: no response from bot');
  return null;
}

// Тест: /train start
async function testTrainStart(token, chatId) {
  console.log('');
  console.log('=' .repeat(60));
  console.log('🧪 TEST: /train start');
  console.log('=' .repeat(60));

  const command = '/train start TestModel test_trigger';
  console.log(`📤 Sending: ${command}`);

  await sendMessage(token, chatId, command);

  await new Promise(resolve => setTimeout(resolve, 2000)); // Ждём 2 секунды

  const response = await waitForBotResponse(token);

  if (response && response.text && response.text.includes('Отлично')) {
    console.log('✅ PASS: Bot responded correctly');
    return true;
  } else {
    console.log('❌ FAIL: Unexpected response');
    return false;
  }
}

// Главная функция
async function main() {
  try {
    // 1. Загрузить токен
    const token = await loadBotToken();

    // 2. Получить информацию о боте
    const botInfo = await getMe(token);
    console.log(`🤖 Bot: @${botInfo.username} (${botInfo.first_name})`);
    console.log('');

    // 3. Найти chat_id
    const chatId = await findChatId(token);

    if (!chatId) {
      console.log('');
      console.log('❌ Cannot proceed without chat_id');
      console.log('💡 Solution: Send /start to the bot, then run this script again');
      process.exit(1);
    }

    // 4. Запустить тесты
    const results = [];

    results.push(await testTrainStart(token, chatId));

    // 5. Итоги
    console.log('');
    console.log('=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('');
      console.log('🎉 ALL TESTS PASSED!');
      console.log('🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️  SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
