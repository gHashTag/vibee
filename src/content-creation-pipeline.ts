/**
 * Content Creation Pipeline Plugin
 *
 * Автоматизированный workflow для создания Reels из новостей:
 * 1. Новость → 2. Текст для Reels → 3. Аудио → 4. Изображение → 5. Lip Sync видео
 *
 * Каждый шаг требует подтверждения пользователя через inline кнопки
 */

import { Service, Plugin, type IAgentRuntime, logger } from '@elizaos/core';
import * as fal from '@fal-ai/serverless-client';

interface ContentSession {
  newsTitle: string;
  newsLink: string;
  newsContent?: string;
  step: 'text' | 'hooks' | 'voice' | 'audio' | 'image_prompt' | 'image' | 'lipsync' | 'final';
  reelsText?: string;
  hookType?: 'aggressive' | 'professional' | 'storytelling';
  selectedVoice?: 'nova' | 'alloy' | 'fable';
  audioUrl?: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * Сервис для управления workflow создания контента
 */
class ContentCreationService extends Service {
  static serviceType = 'content-creation';

  // Храним сессии создания контента
  private sessions: Map<string, ContentSession> = new Map();

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new ContentCreationService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    // Cleanup if needed
    logger.info('[ContentCreation] Stopped');
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[ContentCreation] 🎬 Initializing content creation pipeline...');

    // Инициализируем Fal.ai клиент
    const falApiKey = runtime.getSetting('FAL_KEY');
    if (falApiKey) {
      fal.config({
        credentials: falApiKey,
      });
      logger.info('[ContentCreation] ✅ Fal.ai configured');
    } else {
      logger.warn('[ContentCreation] ⚠️ FAL_KEY not set, video generation will be disabled');
    }

    logger.info('[ContentCreation] ✅ Content creation pipeline ready');
  }

  /**
   * Генерация полного текста с выбранным типом хука
   */
  async generateReelsTextWithHook(runtime: IAgentRuntime, newsData: any, hookType: string): Promise<string> {
    const hookStyle = {
      aggressive: 'АГРЕССИВНЫЙ/ХАЙПОВЫЙ',
      professional: 'ПРОФЕССИОНАЛЬНЫЙ/ЭКСПЕРТНЫЙ',
      storytelling: 'СТОРИТЕЛЛИНГ/ЭМОЦИОНАЛЬНЫЙ'
    }[hookType] || 'ПРОФЕССИОНАЛЬНЫЙ';

    const prompt = `
Ты - эксперт по созданию вирусного контента для Reels/Shorts.

НОВОСТЬ:
${newsData.title}
${newsData.contentSnippet || ''}

ЗАДАЧА: Создай профессиональный текст для Reels на РУССКОМ языке (30-40 секунд чтения).

СТИЛЬ ХУКА: ${hookStyle}

СТРУКТУРА ТЕКСТА:
1. 🔥 ХУК (первые 3 секунды) - цепляющее начало
2. 💡 СУТЬ - главная информация коротко и ясно
3. ✨ ИНСАЙТ - почему это важно, что это дает
4. 🎯 CALL TO ACTION - призыв к действию

ТРЕБОВАНИЯ:
- Длина: 150-200 слов (30-40 секунд чтения)
- Стиль: энергичный, прямой разговор со зрителем
- Формат: короткие предложения, легко читаемо
- Эмодзи: умеренно, только для акцентов
- Обращение на "ты"

ПРИМЕР ХУКА СТИЛЯ ${hookStyle}:
${hookType === 'aggressive' ? '"Стоп! Скролл. Это изменит ВСЁ!" или "99% разработчиков не знают об этом..."' :
  hookType === 'professional' ? '"Важное обновление для AI-разработчиков" или "Прорыв, который меняет индустрию"' :
  '"Помнишь, как мы мечтали об этом? Ну вот..." или "Я ждал этого 5 лет. И вот оно случилось"'}

Создай текст ПРЯМО СЕЙЧАС:
`;

    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'LARGE',
      });
      return typeof response === 'string' ? response : (response as any).text || String(response);
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate reels text with hook:', error);
      return `🔥 Важная новость в мире AI!

${newsData.title}

💡 Это важно для каждого разработчика, работающего с AI.

✨ Используй эти знания уже сегодня в своих проектах!

🎯 Подписывайся на канал, чтобы не пропустить новые инсайты!`;
    }
  }

  /**
   * Шаг 1: Генерация текста для Reels (устаревший метод для обратной совместимости)
   */
  async generateReelsText(runtime: IAgentRuntime, newsData: any): Promise<string> {
    const prompt = `
Ты - эксперт по созданию вирусного контента для Reels/Shorts.

НОВОСТЬ:
${newsData.title}
${newsData.contentSnippet || ''}

ЗАДАЧА: Создай профессиональный текст для Reels на РУССКОМ языке (30-40 секунд чтения).

СТРУКТУРА ТЕКСТА ДЛЯ REELS:
1. 🔥 ХУК (первые 3 секунды) - цепляющее начало, которое останавливает скролл
2. 💡 СУТЬ - главная информация коротко и ясно
3. ✨ ИНСАЙТ - почему это важно, что это дает
4. 🎯 CALL TO ACTION - призыв к действию (подписка, комментарий, сохранение)

ТРЕБОВАНИЯ:
- Длина: 150-200 слов (30-40 секунд чтения)
- Стиль: энергичный, прямой разговор со зрителем
- Формат: короткие предложения, легко читаемо
- Эмодзи: умеренно, только для акцентов
- Обращение на "ты"

ПРИМЕР ХОРОШЕГО ХУКА:
❌ "Сегодня я расскажу о новости..."
✅ "Стоп! Это изменит твой подход к разработке!"

ПРИМЕР СТРУКТУРЫ:
"🔥 [ХУК - цепляющее начало]

[СУТЬ - главная информация в 2-3 предложениях]

💡 [ИНСАЙТ - почему это важно]

✨ [ПРАКТИЧЕСКАЯ ЦЕННОСТЬ - что это дает]

🎯 [CALL TO ACTION]"

Создай текст ПРЯМО СЕЙЧАС:
`;

    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'LARGE', // Используем большую модель для качественного контента
      });
      return typeof response === 'string' ? response : (response as any).text || String(response);
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate reels text:', error);
      // Fallback
      return `🔥 Важная новость в мире AI!

${newsData.title}

💡 Это важно для каждого разработчика, работающего с AI.

✨ Используй эти знания уже сегодня в своих проектах!

🎯 Подписывайся на канал, чтобы не пропустить новые инсайты!`;
    }
  }

  /**
   * Шаг 1.1: Генерация 3 вариантов хуков для выбора
   */
  async generateMultipleHooks(runtime: IAgentRuntime, newsData: any): Promise<string[]> {
    const prompt = `
Ты - эксперт по созданию вирусных хуков для Reels/Shorts.

НОВОСТЬ:
${newsData.title}
${newsData.contentSnippet || ''}

ЗАДАЧА: Создай 3 РАЗНЫХ варианта цепляющего хука (первые 3 секунды видео).

ТРЕБОВАНИЯ К ХУКАМ:
- Каждый хук должен быть УНИКАЛЬНЫМ по стилю
- Длина: 1-2 предложения (макс 15 слов)
- Цель: остановить скролл, вызвать любопытство
- Стиль: энергичный, прямой, провокационный

3 РАЗНЫХ СТИЛЯ:

ВАРИАНТ 1 - АГРЕССИВНЫЙ/ХАЙПОВЫЙ:
Примеры:
- "Стоп! Скролл. Это изменит ВСЁ!"
- "99% разработчиков не знают об этом..."
- "Ты серьёзно ещё не используешь это?!"

ВАРИАНТ 2 - ПРОФЕССИОНАЛЬНЫЙ/ЭКСПЕРТНЫЙ:
Примеры:
- "Важное обновление для AI-разработчиков"
- "Новый стандарт в разработке агентов"
- "Прорыв, который меняет индустрию"

ВАРИАНТ 3 - СТОРИТЕЛЛИНГ/ЭМОЦИОНАЛЬНЫЙ:
Примеры:
- "Помнишь, как мы мечтали об этом? Ну вот..."
- "Я ждал этого 5 лет. И вот оно случилось"
- "Сначала я не поверил. Но это реально работает"

Создай 3 варианта хука для этой новости (по одному в каждом стиле).
Верни ТОЛЬКО хуки, по одному на строке, без нумерации и пояснений:
`;

    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'LARGE',
      });
      const text = typeof response === 'string' ? response : (response as any).text || String(response);

      // Парсим хуки (ожидаем 3 строки)
      const hooks = text
        .split('\n')
        .map((h) => h.trim())
        .filter((h) => h.length > 0 && !h.match(/^(ВАРИАНТ|Примеры|---)/i))
        .slice(0, 3);

      if (hooks.length >= 3) {
        return hooks;
      }

      // Fallback если парсинг не удался
      return [
        `🔥 Стоп! ${newsData.title}`,
        `💡 Важное обновление: ${newsData.title}`,
        `✨ Это изменит твой подход к разработке`,
      ];
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate hooks:', error);
      return [
        `🔥 Стоп! ${newsData.title}`,
        `💡 Важное обновление: ${newsData.title}`,
        `✨ Это изменит твой подход к разработке`,
      ];
    }
  }

  /**
   * Шаг 2: Генерация аудио из текста (TTS)
   */
  async generateAudio(
    runtime: IAgentRuntime,
    text: string,
    voice: 'nova' | 'alloy' | 'fable' = 'nova'
  ): Promise<string> {
    try {
      // Используем OpenAI TTS
      const openaiKey = runtime.getSetting('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not set');
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: voice, // Выбранный голос
          input: text,
          speed: 1.1, // Чуть быстрее для Reels
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS failed: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      // Сохраняем аудио файл
      const fs = await import('fs/promises');
      const path = await import('path');
      const audioPath = path.join('/tmp', `audio_${voice}_${Date.now()}.mp3`);
      await fs.writeFile(audioPath, Buffer.from(audioBuffer));

      logger.info(`[ContentCreation] ✅ Audio generated with voice ${voice}: ${audioPath}`);
      return audioPath;
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate audio:', error);
      throw error;
    }
  }

  /**
   * Шаг 2.1: Генерация превью голосов для выбора
   */
  async generateVoicePreviews(runtime: IAgentRuntime, text: string): Promise<Map<string, string>> {
    const voices: ('nova' | 'alloy' | 'fable')[] = ['nova', 'alloy', 'fable'];
    const previews = new Map<string, string>();

    // Генерируем короткое превью для каждого голоса (первые 100 символов текста)
    const previewText = text.slice(0, 100) + '...';

    for (const voice of voices) {
      try {
        const audioPath = await this.generateAudio(runtime, previewText, voice);
        previews.set(voice, audioPath);
        logger.info(`[ContentCreation] ✅ Preview generated for voice: ${voice}`);
      } catch (error) {
        logger.error(`[ContentCreation] Failed to generate preview for ${voice}:`, error);
      }
    }

    return previews;
  }

  /**
   * Шаг 2.2: Генерация полного аудио с выбранным голосом
   */
  async generateFullAudio(runtime: IAgentRuntime, text: string, voice: 'nova' | 'alloy' | 'fable'): Promise<string> {
    logger.info(`[ContentCreation] 🎧 Generating full audio with voice: ${voice}`);

    try {
      // Используем OpenAI TTS
      const openaiKey = runtime.getSetting('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not set');
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: voice,
          input: text,
          speed: 1.1, // Чуть быстрее для Reels
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS failed: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      // Сохраняем аудио файл
      const fs = await import('fs/promises');
      const path = await import('path');
      const audioPath = path.join('/tmp', `audio_full_${voice}_${Date.now()}.mp3`);
      await fs.writeFile(audioPath, Buffer.from(audioBuffer));

      logger.info(`[ContentCreation] ✅ Full audio generated with voice ${voice}: ${audioPath}`);
      return audioPath;
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate full audio:', error);
      throw error;
    }
  }

  /**
   * Получить описание голоса
   */
  getVoiceDescription(voice: string): string {
    const descriptions: Record<string, string> = {
      nova: '👩 Nova - Энергичная, женский голос (рекомендуется)',
      alloy: '🎤 Alloy - Нейтральный, универсальный',
      fable: '🎭 Fable - Британский акцент, экспрессивный',
    };
    return descriptions[voice] || voice;
  }

  /**
   * Шаг 3: Генерация промпта для изображения
   */
  async generateImagePrompt(runtime: IAgentRuntime, reelsText: string, newsData: any): Promise<string> {
    const prompt = `
Ты - эксперт по созданию промптов для AI генерации изображений.

ТЕКСТ REELS:
${reelsText}

НОВОСТЬ:
${newsData.title}

ЗАДАЧА: Создай ПРОМПТ для генерации изображения в стиле professional tech content.

ТРЕБОВАНИЯ К ПРОМПТУ:
- Язык: АНГЛИЙСКИЙ
- Стиль: Modern, professional, tech-focused
- Композиция: Portrait orientation (9:16), подходит для Reels
- Цвета: Vibrant, eye-catching, tech colors (blues, purples, neons)
- Атмосфера: Dynamic, futuristic, inspiring

СТРУКТУРА ПРОМПТА:
1. Main subject (что изобразить)
2. Style & mood
3. Technical details (composition, lighting, colors)
4. Quality tags

ПРИМЕР ХОРОШЕГО ПРОМПТА:
"A futuristic AI developer workspace with holographic code displays, modern minimalist design, vibrant neon blue and purple lighting, portrait orientation, professional tech content style, highly detailed, trending on artstation, octane render, 8k quality"

Создай промпт ПРЯМО СЕЙЧАС (только промпт, без пояснений):
`;

    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'SMALL',
      });
      const text = typeof response === 'string' ? response : (response as any).text || String(response);
      return text.trim();
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate image prompt:', error);
      return 'A modern futuristic AI technology concept, vibrant colors, professional tech content, portrait orientation, highly detailed, 8k quality';
    }
  }

  /**
   * Шаг 4: Генерация изображения через Fal.ai
   */
  async generateImage(imagePrompt: string): Promise<string> {
    try {
      logger.info('[ContentCreation] 🎨 Generating image with Fal.ai...');

      const result: any = await fal.subscribe('fal-ai/flux-pro', {
        input: {
          prompt: imagePrompt,
          image_size: {
            width: 720,
            height: 1280, // 9:16 для Reels
          },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            logger.info(`[ContentCreation] Image generation: ${update.logs?.join(' ')}`);
          }
        },
      });

      if (result.images && result.images[0]) {
        logger.info(`[ContentCreation] ✅ Image generated: ${result.images[0].url}`);
        return result.images[0].url;
      }

      throw new Error('No image generated');
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate image:', error);
      throw error;
    }
  }

  /**
   * Шаг 5: Генерация lip sync видео через Fal.ai
   */
  async generateLipSyncVideo(imageUrl: string, audioUrl: string): Promise<string> {
    try {
      logger.info('[ContentCreation] 🎬 Generating lip sync video with Fal.ai...');

      // Загружаем аудио на CDN (Fal.ai требует URL)
      const audioFileUrl = await this.uploadAudioToFal(audioUrl);

      const result: any = await fal.subscribe('fal-ai/lipsync', {
        input: {
          video_url: imageUrl, // Fal.ai может использовать изображение как первый кадр
          audio_url: audioFileUrl,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            logger.info(`[ContentCreation] Lip sync: ${update.logs?.join(' ')}`);
          }
        },
      });

      if (result.video && result.video.url) {
        logger.info(`[ContentCreation] ✅ Video generated: ${result.video.url}`);
        return result.video.url;
      }

      throw new Error('No video generated');
    } catch (error) {
      logger.error('[ContentCreation] Failed to generate lip sync video:', error);
      throw error;
    }
  }

  /**
   * Загрузить аудио файл в Fal.ai CDN
   */
  private async uploadAudioToFal(audioPath: string): Promise<string> {
    const fs = await import('fs/promises');
    const audioBuffer = await fs.readFile(audioPath);
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

    const url = await fal.storage.upload(file);
    return url;
  }

  /**
   * Получить или создать сессию
   */
  getSession(userId: string): ContentSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Создать новую сессию
   */
  createSession(userId: string, newsData: any): void {
    this.sessions.set(userId, {
      newsTitle: newsData.title,
      newsLink: newsData.link,
      newsContent: newsData.contentSnippet,
      step: 'text',
    });
  }

  /**
   * Обновить сессию
   */
  updateSession(userId: string, updates: Partial<ContentSession>): void {
    const session = this.sessions.get(userId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  /**
   * Удалить сессию
   */
  deleteSession(userId: string): void {
    this.sessions.delete(userId);
  }
}

export const contentCreationPlugin: Plugin = {
  name: 'content-creation',
  description: 'Automated pipeline for creating Reels from news with step-by-step approval',
  services: [ContentCreationService],
  actions: [],
};

export default contentCreationPlugin;
