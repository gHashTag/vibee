import type { Action, ActionResult, Content, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger, ContentType } from '@elizaos/core';
import { fal } from '@fal-ai/client';
import { NeurophotoService } from './neurophoto/NeurophotoService';
import { initializeNeurophotoSchema } from './neurophoto/database/schema';
import type { GenerationOptions } from './neurophoto/types';

// Track if database schema is initialized
let dbInitialized = false;

/**
 * Neurophoto Action - Генерация AI изображений с LoRA NEURO_SAGE
 *
 * Использует fal.ai/flux-lora для персонализированной генерации изображений
 * Автоматически добавляет триггер NEURO_SAGE к промпту
 * Формат: 9:16 (768×1365) для вертикальных фото
 */

export const neurophotoAction: Action = {
  name: 'GENERATE_NEUROPHOTO',
  similes: [
    'MAKE_IMAGE',
    'CREATE_PHOTO',
    'NEUROPHOTO',
    'GENERATE_IMAGE',
    'AI_IMAGE',
    'DRAW_IMAGE',
    'НАРИСУЙ',
    'СОЗДАЙ_ИЗОБРАЖЕНИЕ',
  ],
  description: `Генерирует AI-изображения с помощью Flux LoRA модели.

Используй когда пользователь:
- Просит нарисовать/создать/сгенерировать изображение
- Хочет увидеть как что-то выглядит
- Спрашивает "покажи...", "сделай фото...", "нарисуй..."
- Использует команду /neurophoto

Особенности:
- Автоматически добавляет триггер NEURO_SAGE
- Формат 9:16 (768×1365) для Instagram/TikTok
- Персонализированная генерация с LoRA`,

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase();
    if (!text) return false;

    // Direct command triggers
    const commands = ['/neurophoto', 'нейрофото', 'neurophoto'];
    if (commands.some((cmd) => text.includes(cmd))) {
      return true;
    }

    // Intent-based triggers (natural language)
    const intents = [
      // Русский
      'нарисуй',
      'создай изображение',
      'сгенерируй',
      'сделай картинк',
      'хочу фото',
      'покажи как выглядит',
      'сделай фото',
      // English
      'generate image',
      'create image',
      'draw',
      'make a picture',
      'show me how',
      'can you draw',
      'make an image',
    ];

    return intents.some((intent) => text.includes(intent));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      logger.info('🎨 [NEUROPHOTO] Starting image generation...');

      // Extract prompt from message
      const text = message.content?.text;
      if (!text) {
        await callback({
          text: '❌ Не удалось получить текст сообщения.',
        });
        return {
          success: false,
          error: new Error('No text in message'),
        };
      }

      // Clean prompt
      let prompt = text
        .replace(/\/neurophoto/gi, '')
        .replace(/нейрофото/gi, '')
        .replace(/создай изображение/gi, '')
        .replace(/нарисуй/gi, '')
        .replace(/generate image/gi, '')
        .trim();

      // Validate prompt
      if (!prompt || prompt.length < 3) {
        await callback({
          text: `❌ Пожалуйста, опишите какое изображение вы хотите создать.

**Примеры**:
• /neurophoto красивый закат над океаном
• /neurophoto футуристический город с летающими машинами
• /neurophoto портрет кота в космическом шлеме`,
        });
        return {
          success: false,
          error: new Error('Prompt too short'),
        };
      }

      logger.info(`📝 [NEUROPHOTO] Prompt: ${prompt}`);

      // LoRA configuration from environment
      const FAL_LORA_PATH =
        process.env.FAL_DEFAULT_LORA_PATH ||
        'https://v3b.fal.media/files/b/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors';
      const FAL_LORA_TRIGGER = process.env.FAL_LORA_TRIGGER || 'NEURO_SAGE';
      const FAL_LORA_SCALE = Number(process.env.FAL_DEFAULT_LORA_SCALE) || 1.0;

      // Send "generating" message
      await callback({
        text: '🎨 Генерирую изображение с твоей LoRA, это займёт 20-40 секунд...',
      });

      // Try to use multi-provider service
      let imageUrl: string;
      let generationTime: number;
      let enhancedPrompt: string;

      try {
        const neurophotoService = runtime.getService<NeurophotoService>('neurophoto' as any);

        if (neurophotoService) {
          logger.info('🔌 [NEUROPHOTO] Using multi-provider service');

          // Initialize database schema on first use
          if (!dbInitialized) {
            try {
              logger.info('[NEUROPHOTO] Initializing database schema...');
              await initializeNeurophotoSchema(runtime);
              dbInitialized = true;
              logger.info('[NEUROPHOTO] ✅ Database schema initialized');
            } catch (dbError) {
              logger.warn('[NEUROPHOTO] ⚠️ Database init failed (non-fatal):', dbError);
              // Continue without database - history won't be saved but generation will work
            }
          }

          const startTime = Date.now();

          const imageService = neurophotoService.getImageService();
          const options: GenerationOptions = {
            prompt,
            width: 768,
            height: 1365,
            numImages: 1,
            loras: [
              {
                path: FAL_LORA_PATH,
                scale: FAL_LORA_SCALE,
                triggerWord: FAL_LORA_TRIGGER,
              },
            ],
          };

          const result = await imageService.generate(options, message.entityId);
          generationTime = Date.now() - startTime;

          if (!result.success || !result.data) {
            throw new Error(result.error?.message || 'Generation failed');
          }

          imageUrl = result.data.url;
          enhancedPrompt = result.data.enhancedPrompt || `${FAL_LORA_TRIGGER} ${prompt}`;

          logger.info(`✅ [NEUROPHOTO] Generated via service in ${generationTime}ms`);
        } else {
          throw new Error('Service not available, using fallback');
        }
      } catch (serviceError) {
        // Fallback to direct Fal.ai call
        logger.warn('⚠️ [NEUROPHOTO] Service unavailable, using direct Fal.ai:', serviceError);

        const FAL_KEY = process.env.FAL_KEY;
        if (!FAL_KEY) {
          logger.error('❌ [NEUROPHOTO] FAL_KEY not found');
          await callback({
            text: '❌ Сервис генерации изображений недоступен. Проверьте настройки FAL_KEY.',
          });
          return {
            success: false,
            error: new Error('FAL_KEY not found'),
          };
        }

        fal.config({ credentials: FAL_KEY });
        enhancedPrompt = `${FAL_LORA_TRIGGER} ${prompt}`;

        logger.info(`🎭 [NEUROPHOTO] Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);

        const startTime = Date.now();
        const result = await fal.subscribe('fal-ai/flux-lora', {
          input: {
            prompt: enhancedPrompt,
            image_size: { width: 768, height: 1365 },
            num_images: 1,
            loras: [{ path: FAL_LORA_PATH, scale: FAL_LORA_SCALE }],
            num_inference_steps: 28,
            guidance_scale: 3.5,
            output_format: 'jpeg',
          },
          logs: false,
        });

        generationTime = Date.now() - startTime;

        // Extract image URL
        const output = result as any;
        if (output.data?.images && Array.isArray(output.data.images) && output.data.images[0]) {
          imageUrl = output.data.images[0].url;
        } else if (output.images && Array.isArray(output.images) && output.images[0]) {
          imageUrl = output.images[0].url;
        } else if (output.image_url) {
          imageUrl = output.image_url;
        } else if (output.url) {
          imageUrl = output.url;
        } else {
          throw new Error('Unexpected Fal.ai response format: ' + JSON.stringify(output));
        }

        logger.info(`✅ [NEUROPHOTO] Generated via fallback in ${generationTime}ms`);
      }

      // Format result message (Midjourney/DALL-E style)
      const resultText = `✨ **Изображение создано!**

━━━━━━━━━━━━━━━━━━━━
📝 **Промпт**
${prompt.slice(0, 150)}${prompt.length > 150 ? '...' : ''}

🎨 **Детали генерации**
├ 🎭 Персонализация: **${FAL_LORA_TRIGGER}**
├ 📐 Размер: **768×1365 (9:16)**
└ ⏱ Время: **${Math.round(generationTime / 1000)}с**

_Создано с помощью AI • Vibee_`;

      // Send result with image
      await callback({
        text: resultText,
        attachments: [
          {
            id: `neurophoto-${Date.now()}`,
            url: imageUrl,
            contentType: ContentType.IMAGE,
            title: prompt,
            description: `Generated by Flux LoRA with ${FAL_LORA_TRIGGER}`,
          },
        ],
      });

      return {
        success: true,
        text: 'Изображение успешно сгенерировано',
        data: {
          imageUrl,
          prompt,
          enhancedPrompt,
          model: 'fal-ai/flux-lora',
          loraUsed: FAL_LORA_PATH,
          triggerWord: FAL_LORA_TRIGGER,
          generationTime,
        },
      };
    } catch (error) {
      logger.error({ error }, '❌ [NEUROPHOTO] Unexpected error:');

      await callback({
        text: '❌ Произошла ошибка при генерации изображения. Попробуйте позже.',
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: '/neurophoto красивый закат над океаном' },
      },
      {
        name: 'Vibee',
        content: {
          text: '✨ Изображение готово! 🎭 Персонализация: NEURO_SAGE',
          actions: ['GENERATE_NEUROPHOTO'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'нарисуй меня на фоне города' },
      },
      {
        name: 'Vibee',
        content: {
          text: '🎨 Генерирую изображение с твоей LoRA...',
          actions: ['GENERATE_NEUROPHOTO'],
        },
      },
    ],
  ],
};
