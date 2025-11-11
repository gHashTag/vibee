#!/usr/bin/env bun
/**
 * Реальный интеграционный тест Fal.ai + LoRA NEURO_SAGE
 * Проверяет фактический формат ответа от API
 */

import { fal } from '@fal-ai/client';
import { config } from 'dotenv';

// Загружаем environment
config({ path: '.env' });
config({ path: '.env.local' });

// Загружаем Infisical секреты
async function loadInfisicalSecrets() {
  const { InfisicalSDK } = await import('@infisical/sdk');

  const client = new InfisicalSDK({
    siteUrl: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
  });

  await client.auth().universalAuth.login({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  });

  const result = await client.secrets().listSecrets({
    projectId: process.env.INFISICAL_PROJECT_ID!,
    environment: process.env.INFISICAL_ENVIRONMENT || 'dev',
    secretPath: '/',
  });

  const secrets: Record<string, string> = {};
  for (const secret of result.secrets) {
    secrets[secret.secretKey] = secret.secretValue;
    process.env[secret.secretKey] = secret.secretValue;
  }

  return secrets;
}

async function testNeurophoto() {
  console.log('🧪 Тестирование Neurophoto с реальным Fal.ai API...\n');

  try {
    // Загружаем секреты из Infisical
    console.log('🔐 Загрузка секретов из Infisical...');
    await loadInfisicalSecrets();

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      console.error('❌ FAL_KEY не найден в Infisical');
      process.exit(1);
    }

    console.log(`✅ FAL_KEY загружен: ${FAL_KEY.substring(0, 10)}...\n`);

    // Configure fal client
    fal.config({
      credentials: FAL_KEY,
    });

    // LoRA configuration
    const FAL_LORA_PATH =
      process.env.FAL_DEFAULT_LORA_PATH ||
      'https://v3b.fal.media/files/b/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors';
    const FAL_LORA_TRIGGER = process.env.FAL_LORA_TRIGGER || 'NEURO_SAGE';
    const FAL_LORA_SCALE = Number(process.env.FAL_DEFAULT_LORA_SCALE) || 1.0;

    const testPrompt = 'test portrait';
    const enhancedPrompt = `${FAL_LORA_TRIGGER} ${testPrompt}`;

    console.log('📝 Тестовый промпт:', testPrompt);
    console.log('🎭 Enhanced промпт:', enhancedPrompt);
    console.log('🔗 LoRA path:', FAL_LORA_PATH.substring(0, 50) + '...');
    console.log('⚖️  LoRA scale:', FAL_LORA_SCALE);
    console.log('\n⏳ Генерация изображения...\n');

    // Generate image with Fal.ai + LoRA
    const startTime = Date.now();
    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: {
        prompt: enhancedPrompt,
        image_size: {
          width: 768,
          height: 1365,
        },
        num_images: 1,
        loras: [
          {
            path: FAL_LORA_PATH,
            scale: FAL_LORA_SCALE,
          },
        ],
        num_inference_steps: 28,
        guidance_scale: 3.5,
        output_format: 'jpeg',
      },
      logs: false,
    });

    const generationTime = Date.now() - startTime;

    console.log('✅ Генерация завершена за', Math.round(generationTime / 1000), 'сек\n');

    // Показываем структуру ответа
    console.log('📊 Структура ответа от Fal.ai:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');

    // Проверяем извлечение URL
    const output = result as any;
    let imageUrl: string | undefined;

    console.log('🔍 Проверка форматов извлечения URL:\n');

    // Формат 1: output.data.images
    if (output.data?.images && Array.isArray(output.data.images) && output.data.images[0]) {
      imageUrl = output.data.images[0].url;
      console.log('✅ Формат 1 (output.data.images): НАЙДЕН');
      console.log('   URL:', imageUrl);
    } else {
      console.log('❌ Формат 1 (output.data.images): НЕ найден');
    }

    // Формат 2: output.images
    if (output.images && Array.isArray(output.images) && output.images[0]) {
      const url2 = output.images[0].url;
      console.log('✅ Формат 2 (output.images): НАЙДЕН');
      console.log('   URL:', url2);
      if (!imageUrl) imageUrl = url2;
    } else {
      console.log('❌ Формат 2 (output.images): НЕ найден');
    }

    // Формат 3: output.image_url
    if (output.image_url) {
      console.log('✅ Формат 3 (output.image_url): НАЙДЕН');
      console.log('   URL:', output.image_url);
      if (!imageUrl) imageUrl = output.image_url;
    } else {
      console.log('❌ Формат 3 (output.image_url): НЕ найден');
    }

    // Формат 4: output.url
    if (output.url) {
      console.log('✅ Формат 4 (output.url): НАЙДЕН');
      console.log('   URL:', output.url);
      if (!imageUrl) imageUrl = output.url;
    } else {
      console.log('❌ Формат 4 (output.url): НЕ найден');
    }

    console.log('\n');

    if (imageUrl) {
      console.log('✅ Итоговый URL изображения:', imageUrl);
      console.log('\n🎉 Тест пройден успешно!\n');
      process.exit(0);
    } else {
      console.log('❌ Не удалось извлечь URL из ответа');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Ошибка во время теста:', error);
    process.exit(1);
  }
}

testNeurophoto();
