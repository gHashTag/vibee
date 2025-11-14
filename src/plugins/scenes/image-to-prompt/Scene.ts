/**
 * Image to Prompt Wizard Scene
 * Multi-step wizard for analyzing images
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { ImageAnalysisService } from './services/imageAnalysisService';
import {
  ANALYSIS_TYPES,
  PROMPT_STYLES,
  COLOR_PALETTES,
  type ImagePromptContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createImageToPromptScene = () => {
  const analysisService = new ImageAnalysisService();

  return new Scenes.WizardScene<MyContext>(
    'imageToPromptWizard',

    // Step 1: Image Upload
    async (ctx: MyContext) => {
      logger.info('🔍 Image to Prompt Scene: Image Upload');

      ctx.session.wizardData = {
        step: 'image',
        analysis: {},
      } as ImagePromptContext;

      await ctx.reply(
        `📸 <b>Шаг 1: Загрузка изображения</b>\n\n` +
        `Отправьте изображение для анализа:\n\n` +
        `• Фото любого размера\n` +
        `• Картинки, рисунки\n` +
        `• Скриншоты, мемы\n\n` +
        `После загрузки выберите тип анализа`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Готово', 'image_done')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Analysis Type
    async (ctx: MyContext) => {
      logger.info('🔍 Image to Prompt Scene: Analysis Type');

      if (ctx.message?.photo) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        ctx.session.wizardData.imageUrl =
          `https://api.telegram.org/file/bot${ctx.bot.bot.token}/${photo.file_id}`;
      }

      const analysisButtons = ANALYSIS_TYPES.map((type) => [
        Markup.button.callback(
          `${type.emoji} ${type.name}`,
          `type_${type.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Изображение загружено\n\n` +
        `🔍 <b>Шаг 2: Тип анализа</b>\n\n` +
        `Выберите, как проанализировать изображение:\n\n` +
        `${ANALYSIS_TYPES.map(t => `• ${t.emoji} <b>${t.name}</b>: ${t.description}`).join('\n')}`,
        Markup.inlineKeyboard(analysisButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Prompt Style
    async (ctx: MyContext) => {
      logger.info('🔍 Image to Prompt Scene: Prompt Style');

      if (ctx.update?.callback_query?.data) {
        const typeId = ctx.update.callback_query.data.replace('type_', '');
        ctx.session.wizardData.step = typeId;
      }

      const styleButtons = PROMPT_STYLES.map((style) => [
        Markup.button.callback(
          `${style.emoji} ${style.name}`,
          `style_${style.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Тип анализа: <b>${ANALYSIS_TYPES.find(t => t.id === ctx.session.wizardData.step)?.name}</b>\n\n` +
        `📝 <b>Шаг 3: Стиль промпта</b>\n\n` +
        `Выберите стиль для создания промпта:`,
        Markup.inlineKeyboard(styleButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Color Palette
    async (ctx: MyContext) => {
      logger.info('🔍 Image to Prompt Scene: Color Palette');

      if (ctx.update?.callback_query?.data) {
        const styleId = ctx.update.callback_query.data.replace('style_', '');
        ctx.session.wizardData.analysis.style = styleId;
      }

      const colorButtons = COLOR_PALETTES.map((color) => [
        Markup.button.callback(
          `${color.emoji} ${color.name}`,
          `color_${color.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Стиль: <b>${PROMPT_STYLES.find(s => s.id === ctx.session.wizardData.analysis.style)?.name}</b>\n\n` +
        `🌈 <b>Шаг 4: Цветовая гамма</b>\n\n` +
        `Выберите цветовую схему:`,
        Markup.inlineKeyboard(colorButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 5: Generate
    async (ctx: MyContext) => {
      logger.info('🔍 Image to Prompt Scene: Generate');

      if (ctx.update?.callback_query?.data) {
        const colorId = ctx.update.callback_query.data.replace('color_', '');
        ctx.session.wizardData.analysis.colors = [colorId];
      }

      await ctx.reply('⏳ Анализирую изображение...');

      try {
        // Analyze image
        const analysisResult = await analysisService.analyzeImage(
          ctx.bot.context.runtime,
          ctx.session.wizardData.imageUrl!,
          ctx.session.wizardData.step
        );

        if (analysisResult.success && analysisResult.description) {
          ctx.session.wizardData.analysis.description = analysisResult.description;

          // Generate prompt
          const promptResult = await analysisService.generatePrompt(
            analysisResult.description,
            ctx.session.wizardData.analysis.style!,
            ctx.session.wizardData.analysis.colors![0]
          );

          if (promptResult.success && promptResult.prompt) {
            ctx.session.wizardData.generatedPrompt = promptResult.prompt;

            await ctx.reply(
              `📝 <b>Результат анализа</b>\n\n` +
              `<code>${analysisResult.description}</code>\n\n` +
              `✨ <b>Сгенерированный промпт:</b>\n\n` +
              `<code>${promptResult.prompt}</code>\n\n` +
              `🎯 Вы можете использовать этот промпт для создания изображений!`
            );
          } else {
            throw new Error('Prompt generation failed');
          }
        } else {
          throw new Error(analysisResult.error || 'Analysis failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Analysis error:', error);
        await ctx.reply(
          `❌ Ошибка анализа: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте еще раз.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
