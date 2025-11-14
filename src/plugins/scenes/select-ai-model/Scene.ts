/**
 * Select AI Model Wizard Scene
 * Multi-step model selection and comparison
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { ModelService } from './services/modelService';
import {
  MODEL_CATEGORIES,
  SPEED_PRESETS,
  QUALITY_LEVELS,
  type AIModelContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createSelectAIModelScene = () => {
  const modelService = new ModelService();

  return new Scenes.WizardScene<MyContext>(
    'selectAIModelWizard',

    // Step 1: Category Selection
    async (ctx: MyContext) => {
      logger.info('⚙️ Select AI Model Scene: Category');

      ctx.session.wizardData = {
        step: 'category',
        category: '',
        preferences: {
          speed: 'balanced',
          quality: 'high',
          cost: 'balanced',
        },
      } as AIModelContext;

      const categoryButtons = MODEL_CATEGORIES.map((cat) => [
        Markup.button.callback(
          `${cat.emoji} ${cat.name}`,
          `category_${cat.id}`
        ),
      ]);

      await ctx.reply(
        `⚙️ <b>Выбор AI Модели</b>\n\n` +
        `🎯 <b>Шаг 1: Категория задач</b>\n\n` +
        `Выберите, для чего нужна модель:`,
        Markup.inlineKeyboard(categoryButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Preferences
    async (ctx: MyContext) => {
      logger.info('⚙️ Select AI Model Scene: Preferences');

      if (ctx.update?.callback_query?.data?.startsWith('category_')) {
        const categoryId = ctx.update.callback_query.data.replace('category_', '');
        ctx.session.wizardData.category = categoryId;
      }

      const speedButtons = SPEED_PRESETS.map((speed) => [
        Markup.button.callback(
          `${speed.emoji} ${speed.name}`,
          `speed_${speed.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Категория: <b>${MODEL_CATEGORIES.find(c => c.id === ctx.session.wizardData.category)?.name}</b>\n\n` +
        `⚡ <b>Шаг 2: Приоритеты</b>\n\n` +
        `Выберите важность скорости:`,
        Markup.inlineKeyboard(speedButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Quality
    async (ctx: MyContext) => {
      logger.info('⚙️ Select AI Model Scene: Quality');

      if (ctx.update?.callback_query?.data?.startsWith('speed_')) {
        const speedId = ctx.update.callback_query.data.replace('speed_', '');
        ctx.session.wizardData.preferences.speed = speedId;
      }

      const qualityButtons = QUALITY_LEVELS.map((quality) => [
        Markup.button.callback(
          `${quality.emoji} ${quality.name}`,
          `quality_${quality.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Скорость: <b>${SPEED_PRESETS.find(s => s.id === ctx.session.wizardData.preferences.speed)?.name}</b>\n\n` +
        `✨ <b>Шаг 3: Качество</b>\n\n` +
        `Выберите уровень качества:`,
        Markup.inlineKeyboard(qualityButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Recommendations
    async (ctx: MyContext) => {
      logger.info('⚙️ Select AI Model Scene: Recommendations');

      if (ctx.update?.callback_query?.data?.startsWith('quality_')) {
        const qualityId = ctx.update.callback_query.data.replace('quality_', '');
        ctx.session.wizardData.preferences.quality = qualityId;
      }

      await ctx.reply('⏳ Ищу подходящие модели...');

      try {
        const result = await modelService.getModel(
          ctx.bot.context.runtime,
          ctx.session.wizardData.category,
          ctx.session.wizardData.preferences
        );

        if (result.success && result.models && result.models.length > 0) {
          const topModel = result.models[0];

          ctx.session.wizardData.selectedModel = topModel;

          await ctx.reply(
            `✨ <b>Рекомендуемая модель</b>\n\n` +
            `${topModel.emoji} <b>${topModel.name}</b>\n` +
            `🏢 Провайдер: ${topModel.provider}\n` +
            `📊 Качество: ${'⭐'.repeat(topModel.quality)}\n` +
            `⚡ Скорость: ${'⚡'.repeat(topModel.speed)}\n` +
            `💰 Цена: ${topModel.pricing}\n\n` +
            `📝 Описание: ${topModel.description}\n\n` +
            `✅ Сильные стороны:\n${topModel.strengths.map(s => `• ${s}`).join('\n')}\n\n` +
            `⚠️ Особенности:\n${topModel.weaknesses.map(w => `• ${w}`).join('\n')}`,
            Markup.inlineKeyboard([
              [Markup.button.callback('✅ Использовать', 'use_model')],
              [Markup.button.callback('🔍 Показать все', 'show_all')],
              [Markup.button.callback('🔄 Пересмотреть', 'retry')],
            ]).parseMarkup()
          );
        } else {
          await ctx.reply(
            `❌ Не найдено моделей с такими параметрами\n` +
            `Попробуйте изменить настройки`,
            Markup.inlineKeyboard([
              [Markup.button.callback('🔄 Пересмотреть', 'retry')],
            ]).parseMarkup()
          );
        }
      } catch (error) {
        logger.error('❌ Model selection error:', error);
        await ctx.reply(
          `❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return ctx.scene.leave();
      }

      return;
    },

    // Handle model actions
    async (ctx: MyContext) => {
      logger.info('⚙️ Select AI Model: Action');

      if (ctx.update?.callback_query?.data === 'use_model') {
        const model = ctx.session.wizardData.selectedModel!;
        await ctx.reply(
          `✅ <b>Модель выбрана!</b>\n\n` +
          `🤖 ${model.name}\n` +
          `📋 ID: \`${model.id}\`\n` +
          `💾 Сохраните ID для использования в коде\n\n` +
          `🚀 Готово к работе!`
        );
        return ctx.scene.leave();
      }

      if (ctx.update?.callback_query?.data === 'show_all') {
        const category = ctx.session.wizardData.category;
        const models = AI_MODELS.filter(m => m.category === category);

        await ctx.reply(
          `📋 <b>Все модели: ${MODEL_CATEGORIES.find(c => c.id === category)?.name}</b>\n\n` +
          models.map((m, i) =>
            `${i + 1}. ${m.emoji} <b>${m.name}</b>\n` +
            `   ${m.provider} | ${m.pricing}\n`
          ).join('\n')
        );
        return;
      }

      if (ctx.update?.callback_query?.data === 'retry') {
        return ctx.scene.leave();
      }
    }
  );
};
