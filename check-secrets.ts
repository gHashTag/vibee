#!/usr/bin/env bun
/**
 * Проверка загруженных секретов
 */

import { loadInfisicalSecrets } from './src/infisical';

async function checkSecrets() {
    console.log('🔐 Проверка секретов...\n');

    const secrets = await loadInfisicalSecrets();

    console.log(`📊 Всего загружено секретов: ${Object.keys(secrets).length}`);

    console.log('\n🔍 Поиск FAL переменных:');
    Object.keys(secrets).forEach(key => {
        if (key.toLowerCase().includes('fal')) {
            console.log(`  ✅ ${key}: ${secrets[key] ? 'ЕСТЬ' : 'НЕТ'}`);
        }
    });

    console.log('\n📝 Все секреты:');
    Object.keys(secrets).sort().forEach(key => {
        const value = secrets[key];
        const masked = value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'НЕТ';
        console.log(`  • ${key}: ${masked}`);
    });
}

checkSecrets().catch(console.error);
