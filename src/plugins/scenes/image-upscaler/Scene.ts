/**
 * Image Upscaler Wizard Scene
 * Multi-step image enhancement wizard
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { UpscaleService } from './services/upscaleService';
import {
  UPSCALE_MODELS,
  SCALE_OPTIONS,
  ENHANCEMENT_TYPES,
  OUTPUT_FORMATS,
  type UpscalerContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createImageUpscalerScene = () => {
  const upscaleService = new UpscaleService();

  return new Scenes.WizardScene<MyContext>(
    'imageUpscalerWizard',

    // Step 1: Image Upload
    async (ctx: MyContext) => {
      logger.info('⬆️ Image Upscaler Scene: Upload');

      ctx.session.wizardData = {
        step: 'image',
        settings: {
          scale: 2,
          enhancement: 'none',
          outputFormat: 'png',
        },
      } as UpscalerContext;

      await ctx.reply(
        `⬆️ <b>Улучшение Изображений</b>\n\n` +
        `📷 <b>Шаг 1: Загрузка</b>\n\n` +
        `Отправьте изображение для улучшения:\n\n` +
        `• Поддерживаемые форматы: JPG, PNG, WebP\n` +
        `• Максимальный размер: 10MB\n` +
        `• Минимальное разрешение: 64x64`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Пропустить', 'skip')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Scale Selection
    async (ctx: MyContext) => {
      logger.info('⬆️ Image Upscaler Scene: Scale');

      if (ctx.message?.photo) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        ctx.session.wizardData.imageUrl =
          `https://api.telegram.org/file/bot${ctx.bot.bot.token}/${photo.file_id}`;
      }

      const scaleButtons = SCALE_OPTIONS.map((scale) => [
        Markup.button.callback(
          `${scale.emoji} ${scale.name}`,
          `scale_${scale.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Изображение загружено\n\n` +
        `⬆️ <b>Шаг 2: Увеличение</b>\n\n` +
        `Выберите коэффициент увеличения:`,
        Markup.inlineKeyboard(scaleButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Enhancement
    async (ctx: MyContext) => {
      logger.info('⬆️ Image Upscaler Scene: Enhancement');

      if (ctx.update?.callback_query?.data?.startsWith('scale_')) {
        const scaleId = ctx.update.callback_query.data.replace('scale_', '');
        const scaleOption = SCALE_OPTIONS.find((s) => s.id === scaleId);
        if (scaleOption) {
          ctx.session.wizardData.settings.scale = scaleOption.value;
        }
      }

      const enhancementButtons = ENHANCEMENT_TYPES.map((enh) => [
        Markup.button.callback(
          `${enh.emoji} ${enh.name}`,
          `enh_${enh.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Увеличение: <b>${ctx.session.wizardData.settings.scale}x</b>\n\n` +
        `✨ <b>Шаг 3: Улучшения</b>\n\n` +
        `${ENHANCEMENT_TYPES.map(e => `• ${e.emoji} <b>${e.name}</b>: ${e.description}`).join('\n')}`,
        Markup.inlineKeyboard(enhancementButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Model Selection
    async (ctx: MyContext) => {
      logger.info('⬆️ Image Upscaler Scene: Model');

      if (ctx.update?.callback_query?.data?.startsWith('enh_')) {
        const enhId = ctx.update.callback_query.data.replace('enh_', '');
        ctx.session.wizardData.settings.enhancement = enhId;
      }

      const modelButtons = UPSCALE_MODELS.map((model) => [
        Markup.button.callback(
          `${model.emoji} ${model.name}`,
          `model_${model.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Увеличение: <b>${ctx.session.wizardData.settings.scale}x</b>\n` +
        `✨ Улучшения: <b>${ENHANCEMENT_TYPES.find(e => e.id === ctx.session.wizardData.settings.enhancement)?.name}</b>\n\n` +
        `🤖 <b>Шаг 4: AI Модель</b>\n\n` +
        `Выберите модель для улучшения:\n\n` +
        `${UPSCALE_MODELS.map(m => `• ${m.emoji} <b>${m.name}</b>: ${m.description}`).join('\n')}`,
        Markup.inlineKeyboard(modelButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 5: Upscale
    async (ctx: MyContext) => {
      logger.info('⬆️ Image Upscaler Scene: Upscale');

      if (ctx.update?.callback_query?.data?.startsWith('model_')) {
        // Model selected, proceed with upscaling
      }

      await ctx.reply('⏳ Улучшаю изображение...');

      try {
        const result = await upscaleService.upscale(
          ctx.bot.context.runtime,
          ctx.session.wizardData.imageUrl!,
          ctx.session.wizardData.settings.scale,
          ctx.session.wizardData.settings.enhancement,
          ctx.session.wizardData.settings.outputFormat
        );

        if (result.success && result.upscaledUrl) {
          const selectedModel = UPSCALE_MODELS.find(m => m.id === ctx.update?.callback_query?.data?.replace('model_', ''));
          const selectedEnh = ENHANCEMENT_TYPES.find(e => e.id === ctx.session.wizardData.settings.enhancement);

          ctx.session.wizardData.result = {
            originalSize: '512x512',
            newSize: `${512 * ctx.session.wizardData.settings.scale}x${512 * ctx.session.wizardData.settings.scale}`,
            upscaledUrl: result.upscaledUrl,
          };

          await ctx.replyWithPhoto(result.upscaledUrl, {
            caption: `✨ <b>Изображение улучшено!</b>\n\n` +
                    `⬆️ Увеличение: <b>${ctx.session.wizardData.settings.scale}x</b>\n` +
                    `✨ Улучшения: <b>${selectedEnh?.name}</b>\n` +
                    `🤖 Модель: <b>${selectedModel?.name}</b>\n` +
                    `📐 Размер: ${ctx.session.wizardData.result.originalSize} → ${ctx.session.wizardData.result.newSize}`,
            parseMode: 'HTML',
          });
        } else {
          throw new Error(result.error || 'Upscaling failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Upscaling error:', error);
        await ctx.reply(
          `❌ Ошибка улучшения: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте с другими параметрами.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
