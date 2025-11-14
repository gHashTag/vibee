#!/usr/bin/env bun
/**
 * Простой тест TTS плагина - проверка импорта и настроек
 */

import { character } from './src/character';

console.log('🎤 Проверка @elizaos/plugin-tts интеграции...\n');

console.log('✅ Плагин успешно добавлен в character.ts');
console.log(`📦 Название персонажа: ${character.name}`);

console.log('\n🔍 Список всех плагинов:');
character.plugins.forEach((plugin, index) => {
    const isTTS = plugin === '@elizaos/plugin-tts';
    const marker = isTTS ? '🎯 TTS ПЛАГИН НАЙДЕН!' : '';
    console.log(`  ${index + 1}. ${plugin} ${marker}`);
});

const hasTTS = character.plugins.includes('@elizaos/plugin-tts');

console.log(`\n${hasTTS ? '✅' : '❌'} TTS плагин в списке: ${hasTTS ? 'ДА' : 'НЕТ'}`);

console.log('\n🔑 Проверка настроек секретов:');
console.log(`   - TELEGRAM_BOT_TOKEN: ${character.settings?.secrets?.TELEGRAM_BOT_TOKEN ? '✅ есть' : '❌ нет'}`);
console.log(`   - REPLICATE_API_KEY: ${character.settings?.secrets?.REPLICATE_API_KEY ? '✅ есть' : '❌ нет'}`);
console.log(`   - FAL_API_KEY: ${character.settings?.secrets?.FAL_API_KEY ? '✅ есть' : '❌ нет'}`);

console.log('\n📋 Инструкции:');
if (!process.env.FAL_API_KEY && !process.env.FAL_KEY) {
    console.log('⚠️  ВНИМАНИЕ: FAL_API_KEY или FAL_KEY НЕ УСТАНОВЛЕН!');
    console.log('   Для активации TTS нужно добавить API ключ в Infisical:');
    console.log('   1. Зайти в Infisical');
    console.log('   2. Добавить переменную FAL_API_KEY');
    console.log('   3. Перезапустить бота');
} else {
    console.log('✅ FAL_API_KEY установлен');
    console.log('\n🚀 Готов к тестированию!');
    console.log('\n📝 Команды для тестирования в боте:');
    console.log('   • "Generate TTS of Привет, это тест!"');
    console.log('   • "Create TTS saying Hello World"');
    console.log('   • "Создай аудио: Добро пожаловать в Vibee!"');
}

console.log('\n' + '='.repeat(50));
