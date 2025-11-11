/**
 * AI Photoshop Action
 * Handles image editing commands in Telegram
 */

import { Action, IAgentRuntime, Memory, State, ActionResult } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { AIPhotoshopService } from './service';
import { keyboard } from '../telegram-keyboards';
import type { AIPhotoshopModel, AIPhotoshopRequest } from './types';

/**
 * AI Photoshop Action
 * Triggered when user wants to edit images with AI
 */
export const aiPhotoshopAction: Action = {
  name: 'AI_PHOTOSHOP',
  description: 'Edit and transform images using AI models',
  similes: [
    'edit photo',
    'edit image',
    'ai photoshop',
    'transform image',
    'редактировать фото',
    'обработать изображение',
    'фотошоп',
  ],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase();
    if (!text) return false;

    // Check if message contains trigger words
    const triggers = [
      'edit photo',
      'edit image',
      'ai photoshop',
      'transform',
      'редактировать',
      'обработать',
      'фотошоп',
    ];

    return triggers.some((trigger) => text.includes(trigger));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ): Promise<ActionResult> => {
    try {
      logger.info('[AIPhotoshop] Action triggered', {
        userId: message.userId,
        content: message.content.text,
      });

      // Get AI Photoshop service
      const photoshopService = runtime.getService<AIPhotoshopService>('ai-photoshop' as any);

      if (!photoshopService) {
        await callback({
          text: '❌ AI Photoshop service not available',
          error: true,
        });
        return { success: false, error: new Error('Service not available') };
      }

      // Show model selection menu
      const modelKeyboard = createModelSelectionKeyboard();

      await callback({
        text: '🎨 **AI Photoshop**\n\n' +
              'Choose an AI model to transform your image:\n\n' +
              '• **SeeDream** - ByteDance\'s advanced model\n' +
              '• **Nano Banana** - Google Gemini 2.5\n' +
              '• **FLUX Kontext** - Multi-context aware\n' +
              '• **Qwen Edit** - Alibaba\'s SOTA editor\n\n' +
              '📸 After selecting a model, send your image!',
        action: 'AI_PHOTOSHOP',
        attachments: [{ type: 'keyboard', content: modelKeyboard }],
      });

      return {
        success: true,
        text: 'AI Photoshop menu displayed',
        data: {
          action: 'AI_PHOTOSHOP',
          step: 'model_selection',
        },
      };
    } catch (error) {
      logger.error('[AIPhotoshop] Error in action handler', { error });

      await callback?.({
        text: '❌ Failed to start AI Photoshop',
        error: true,
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
        user: '{{user1}}',
        content: { text: 'I want to edit my photo with AI' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Great! Let me show you the available AI models for photo editing.',
          action: 'AI_PHOTOSHOP',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Хочу обработать изображение' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Отлично! Покажу доступные AI модели для обработки фото.',
          action: 'AI_PHOTOSHOP',
        },
      },
    ],
  ],
};

/**
 * Process image action
 * Triggered when user sends an image
 */
export const processImageAction: Action = {
  name: 'PROCESS_IMAGE',
  description: 'Process uploaded image with AI Photoshop',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if we're in AI Photoshop flow and have an image
    const hasImage = message.content.attachments?.some(
      (att) => att.type === 'image' || att.contentType?.startsWith('image/')
    );

    const inPhotoshopFlow = state?.aiPhotoshop?.active === true;

    return hasImage && inPhotoshopFlow;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ): Promise<ActionResult> => {
    try {
      // Get image from message
      const imageAttachment = message.content.attachments?.find(
        (att) => att.type === 'image' || att.contentType?.startsWith('image/')
      );

      if (!imageAttachment?.url) {
        await callback({
          text: '❌ No image found in message',
          error: true,
        });
        return { success: false, error: new Error('No image') };
      }

      // Ask for editing instructions
      const promptKeyboard = keyboard
        .builder()
        .callback('✨ Add Camera Angle', 'ai_photoshop_camera')
        .callback('💡 Add Lighting', 'ai_photoshop_lighting', 0)
        .callback('🖼️ Add Composition', 'ai_photoshop_composition')
        .callback('🎨 Custom Prompt', 'ai_photoshop_custom', 1)
        .callback('❌ Cancel', 'ai_photoshop_cancel', 2)
        .buildInline();

      await callback({
        text: '📸 **Image received!**\n\n' +
              '💬 How would you like to transform this image?\n\n' +
              'You can:\n' +
              '• Choose camera angle for better composition\n' +
              '• Select lighting style\n' +
              '• Pick frame composition\n' +
              '• Or write a custom editing prompt',
        attachments: [{ type: 'keyboard', content: promptKeyboard }],
      });

      return {
        success: true,
        text: 'Image received, awaiting instructions',
        values: {
          imageUrl: imageAttachment.url,
          step: 'awaiting_prompt',
        },
      };
    } catch (error) {
      logger.error('[AIPhotoshop] Error processing image', { error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

/**
 * Execute transformation action
 * Triggered when user provides editing instructions
 */
export const executeTransformAction: Action = {
  name: 'EXECUTE_TRANSFORM',
  description: 'Execute AI image transformation',

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // Check if we have image, model, and prompt ready
    const hasRequirements =
      state?.aiPhotoshop?.imageUrl &&
      state?.aiPhotoshop?.model &&
      state?.aiPhotoshop?.prompt;

    return !!hasRequirements;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: any
  ): Promise<ActionResult> => {
    try {
      const photoshopService = runtime.getService<AIPhotoshopService>('ai-photoshop' as any);

      if (!photoshopService) {
        return { success: false, error: new Error('Service not available') };
      }

      // Show processing message
      await callback({
        text: '⏳ **Processing your image...**\n\n' +
              'This may take 30-60 seconds depending on the model.\n\n' +
              '🎨 Creating magic with AI...',
      });

      // Build request
      const request: AIPhotoshopRequest = {
        imageUrl: state!.aiPhotoshop!.imageUrl!,
        prompt: state!.aiPhotoshop!.prompt!,
        model: state!.aiPhotoshop!.model! as AIPhotoshopModel,
        cameraAngle: state!.aiPhotoshop!.cameraAngle,
        lighting: state!.aiPhotoshop!.lighting,
        composition: state!.aiPhotoshop!.composition,
        quality: state!.aiPhotoshop!.quality || '2K',
        aspectRatio: '9:16',
      };

      logger.info('[AIPhotoshop] Executing transformation', {
        model: request.model,
        hasEnhancements: !!(request.cameraAngle || request.lighting || request.composition),
      });

      // Process image
      const result = await photoshopService.processImage(request);

      if (!result.success || !result.imageUrl) {
        await callback({
          text: `❌ **Transformation failed**\n\n${result.error || 'Unknown error'}`,
          error: true,
        });
        return { success: false, error: new Error(result.error) };
      }

      // Send result
      await callback({
        text: '✅ **Transformation complete!**\n\n' +
              `🤖 Model: ${request.model}\n` +
              `⏱️ Processing time: ${Math.round(result.processingTime! / 1000)}s\n` +
              `💰 Cost: $${result.cost?.toFixed(3) || '0.030'}`,
        attachments: [
          { type: 'image', url: result.imageUrl },
        ],
      });

      return {
        success: true,
        text: 'Image transformation completed',
        values: {
          resultUrl: result.imageUrl,
          model: request.model,
          processingTime: result.processingTime,
        },
      };
    } catch (error) {
      logger.error('[AIPhotoshop] Error executing transformation', { error });
      await callback?.({
        text: '❌ Transformation failed due to an error',
        error: true,
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [],
};

/**
 * Helper: Create model selection keyboard
 */
function createModelSelectionKeyboard() {
  return keyboard
    .builder()
    .callback('🌟 SeeDream-4', 'ai_model_seedream', 0)
    .callback('🍌 Nano Banana', 'ai_model_nano_banana', 0)
    .callback('⚡ FLUX Kontext', 'ai_model_flux_multi_kontext', 1)
    .callback('🎯 Qwen Edit+', 'ai_model_qwen_edit_plus', 1)
    .callback('🚀 FLUX Pro', 'ai_model_flux_kontext_pro', 2)
    .callback('✨ SeedEdit 3', 'ai_model_seededit_3', 2)
    .callback('🎨 Qwen Edit', 'ai_model_qwen_image_edit', 3)
    .callback('❌ Cancel', 'ai_photoshop_cancel', 4)
    .buildInline();
}
