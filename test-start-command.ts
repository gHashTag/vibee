#!/usr/bin/env bun
/**
 * E2E Test for /start command
 */

import { Telegraf } from 'telegraf';

// Load secrets from Infisical first
const { initializeInfisical } = await import('./src/infisical.ts');
await initializeInfisical();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TEST_CHAT_ID = process.env.ADMIN_TELEGRAM_ID || process.env.TEST_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
  process.exit(1);
}

if (!TEST_CHAT_ID) {
  console.error('❌ TEST_CHAT_ID or ADMIN_TELEGRAM_ID not found in environment');
  process.exit(1);
}

console.log('🧪 Starting E2E test for /start command');
console.log(`📱 Bot Token: ${BOT_TOKEN.substring(0, 20)}...`);
console.log(`👤 Test Chat ID: ${TEST_CHAT_ID}`);

const bot = new Telegraf(BOT_TOKEN);

// Listen for responses
let receivedResponse = false;
let responseText = '';

bot.on('message', (ctx) => {
  console.log('📨 Received message:', ctx.message);
  if (ctx.message && 'text' in ctx.message) {
    responseText = ctx.message.text;
    receivedResponse = true;
  }
});

async function runTest() {
  try {
    console.log('\n🚀 Sending /start command...');

    // Send /start command to the bot
    await bot.telegram.sendMessage(TEST_CHAT_ID, '/start');

    console.log('✅ Command sent successfully');
    console.log('⏳ Waiting 3 seconds for response...');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (receivedResponse) {
      console.log('\n✅ Test PASSED - Received response:');
      console.log('---');
      console.log(responseText);
      console.log('---');

      // Check if response contains expected content
      if (responseText.includes('Vibee') || responseText.includes('Привет')) {
        console.log('\n🎉 Response contains expected greeting!');
      } else {
        console.log('\n⚠️  Response received but may not be the expected welcome message');
      }
    } else {
      console.log('\n❌ Test FAILED - No response received from bot');
      console.log('💡 This means the /start handler is not working');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    bot.stop();
    process.exit(receivedResponse ? 0 : 1);
  }
}

// Start bot and run test
bot.launch().then(() => {
  console.log('🤖 Test bot launched');
  runTest();
});
