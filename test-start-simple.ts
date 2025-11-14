#!/usr/bin/env bun
/**
 * Simple E2E Test - sends /start via HTTP API
 */

// Load secrets from Infisical first
const { initializeInfisical } = await import('./src/infisical.ts');
await initializeInfisical();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TEST_CHAT_ID = process.env.ADMIN_TELEGRAM_ID;

if (!BOT_TOKEN || !TEST_CHAT_ID) {
  console.error('❌ Missing BOT_TOKEN or TEST_CHAT_ID');
  process.exit(1);
}

console.log('🧪 Sending /start command via HTTP API');
console.log(`👤 Chat ID: ${TEST_CHAT_ID}`);

const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: TEST_CHAT_ID,
    text: '/start',
  }),
});

const result = await response.json();

if (result.ok) {
  console.log('✅ Command sent successfully!');
  console.log('💡 Check bot logs at /tmp/bot-middleware.log for response');
  console.log('💡 Run: tail -f /tmp/bot-middleware.log | grep -E "start|START|intercepted"');
} else {
  console.error('❌ Failed to send command:', result);
}
