/**
 * NeuroPhoto Wizard Scene
 * Multi-step wizard for AI image generation
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { NeuroPhotoService } from './services/imageService';
import {
  AVAILABLE_MODELS,
  IMAGE_STYLES,
  IMAGE_SIZES,
  type NeuroPhotoContext,
} from './types';

// Extend telegraf Context with wizard data
interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
  update: any;
}

export const createNeuroPhotoScene = () => {
  const imageService = new NeuroPhotoService();

  return new Scenes.WizardScene<MyContext>(
    'neuroPhotoWizard',

    // Step 1: Model Selection
    async (ctx: MyContext) => {
      logger.info('🎨 NeuroPhoto Scene: Model Selection');

      // Initialize session data
      ctx.session.wizardData = {
        step: 'model',
        model: '',
        prompt: '',
        settings: {},
      } as NeuroPhotoContext;

      // Get pending prompt from memory
      const userId = ctx.from?.id?.toString() || 'unknown';
      const memories = await ctx.bot.context.runtime.getMemories({
        where: [
          { userId },
          { type: 'text' },
        ],
        limit: 1,
      });

      if (memories.length > 0) {
        ctx.session.wizardData.prompt = memories[0].content?.text || '';
      }

      const modelButtons = AVAILABLE_MODELS.map((model) => [
        Markup.button.callback(
          `${model.emoji} ${model.name}`,
          `model_${model.id}`
        ),
      ]);

      await ctx.reply(
        `🎨 <b>Нейро-Фото Генератор</b>\n\n` +
        `Выберите модель для генерации изображения:`,
        Markup.inlineKeyboard(modelButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Style Selection
    async (ctx: MyContext) => {
      logger.info('🎨 NeuroPhoto Scene: Style Selection');

      // Handle model callback
      if (ctx.update?.callback_query?.data) {
        const modelId = ctx.update.callback_query.data.replace('model_', '');
        const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);

        if (selectedModel) {
          ctx.session.wizardData.model = modelId;
        }
      }

      const styleButtons = IMAGE_STYLES.map((style) => [
        Markup.button.callback(
          `${style.emoji} ${style.name}`,
          `style_${style.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Модель выбрана: <b>${AVAILABLE_MODELS.find(m => m.id === ctx.session.wizardData.model)?.name}</b>\n\n` +
        `Теперь выберите стиль изображения:`,
        Markup.inlineKeyboard(styleButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Size Selection
    async (ctx: MyContext) => {
      logger.info('🎨 NeuroPhoto Scene: Size Selection');

      // Handle style callback
      if (ctx.update?.callback_query?.data) {
        const styleId = ctx.update.callback_query.data.replace('style_', '');
        ctx.session.wizardData.settings.style = styleId;
      }

      const sizeButtons = IMAGE_SIZES.map((size) => [
        Markup.button.callback(
          `${size.emoji} ${size.name}`,
          `size_${size.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Стиль выбран: <b>${IMAGE_STYLES.find(s => s.id === ctx.session.wizardData.settings.style)?.name}</b>\n\n` +
        `Выберите размер изображения:`,
        Markup.inlineKeyboard(sizeButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Generation
    async (ctx: MyContext) => {
      logger.info('🎨 NeuroPhoto Scene: Generation');

      // Handle size callback
      if (ctx.update?.callback_query?.data) {
        const sizeId = ctx.update.callback_query.data.replace('size_', '');
        ctx.session.wizardData.settings.size = sizeId;
      }

      // Send progress indicator
      await ctx.reply('⏳ Генерирую изображение, пожалуйста подождите...');

      try {
        // Generate image
        const selectedModel = AVAILABLE_MODELS.find(
          (m) => m.id === ctx.session.wizardData.model
        );

        if (!selectedModel) {
          throw new Error('Model not selected');
        }

        const result = await imageService.generateImage(
          ctx.bot.context.runtime,
          selectedModel,
          ctx.session.wizardData.prompt,
          ctx.session.wizardData.settings
        );

        if (result.success && result.url) {
          // Send generated image
          await ctx.replyWithPhoto(result.url, {
            caption: `✨ <b>Готово!</b>\n\n` +
                    `Модель: ${selectedModel.name}\n` +
                    `Стиль: ${IMAGE_STYLES.find(s => s.id === ctx.session.wizardData.settings.style)?.name}\n` +
                    `Размер: ${IMAGE_SIZES.find(s => s.id === ctx.session.wizardData.settings.size)?.name}\n\n` +
                    `Промпт: ${ctx.session.wizardData.prompt}`,
            parseMode: 'HTML',
          });
        } else {
          throw new Error(result.error || 'Generation failed');
        }

        // Leave scene
        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Generation error:', error);
        await ctx.reply(
          `❌ Ошибка генерации: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте еще раз или измените параметры.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
