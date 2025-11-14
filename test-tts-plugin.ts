#!/usr/bin/env bun
/**
 * Тест плагина @elizaos/plugin-tts
 * Проверяет работу Text-to-Speech генерации
 */

import { createRuntime } from '@elizaos/core';
import { character } from './src/character';
import fs from 'fs';
import path from 'path';

async function testTTSPlugin() {
    console.log('🎤 Тестирование @elizaos/plugin-tts...\n');

    try {
        // Создаем runtime с character
        const runtime = await createRuntime({
            character,
            autoStart: true,
        });

        console.log('✅ Runtime создан успешно');
        console.log('📦 Загруженные плагины:');

        // Проверяем какие плагины загружены
        const plugins = runtime.getEnabledPlugins();
        plugins.forEach((plugin, index) => {
            console.log(`  ${index + 1}. ${plugin}`);
        });

        // Проверяем TTS плагин
        const hasTTS = plugins.includes('@elizaos/plugin-tts');
        console.log(`\n🎯 TTS плагин загружен: ${hasTTS ? '✅ ДА' : '❌ НЕТ'}`);

        if (!hasTTS) {
            console.log('\n⚠️ ВНИМАНИЕ: TTS плагин не загружен!');
            console.log('Проверьте, что установлен FAL_API_KEY в Infisical или .env');

            // Проверяем переменные окружения
            console.log('\n🔍 Проверка переменных окружения:');
            console.log(`FAL_API_KEY: ${process.env.FAL_API_KEY ? '✅ УСТАНОВЛЕН' : '❌ НЕ УСТАНОВЛЕН'}`);
            console.log(`FAL_KEY: ${process.env.FAL_KEY ? '✅ УСТАНОВЛЕН' : '❌ НЕ УСТАНОВЛЕН'}`);

            return;
        }

        // Проверяем доступные сервисы
        console.log('\n🔧 Доступные сервисы:');
        const services = runtime.getServices();
        services.forEach(service => {
            console.log(`  - ${service.service.type}: ${service.service.name}`);
        });

        // Ищем TTS сервис
        const ttsService = services.find(s => s.service.type.includes('tts') || s.service.name.includes('tts'));

        if (ttsService) {
            console.log(`\n✅ TTS сервис найден: ${ttsService.service.name}`);
        } else {
            console.log('\n⚠️ TTS сервис не найден в списке сервисов');
        }

        console.log('\n🎉 Тестирование завершено!');
        console.log('\n📝 Для тестирования генерации TTS используйте команду в боте:');
        console.log('   "Generate TTS of Привет, это тест!"');

    } catch (error) {
        console.error('\n❌ Ошибка при тестировании:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Запускаем тест
testTTSPlugin();
