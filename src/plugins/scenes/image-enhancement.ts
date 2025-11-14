/**
 * Image Enhancement Scene Plugin
 * Улучшение качества изображений с ИИ
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  photo?: string;
  enhancementType?: string;
  strength?: number;
  targetResolution?: string;
  format?: string;
}

export const createImageEnhancementScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'imageEnhancementWizard',

    // Шаг 1: Запрос изображения
    async (ctx) => {
      await ctx.reply(
        '✨ **Улучшение Изображений**\n\n' +
        'Отправьте изображение для улучшения:\n' +
        '• Поддержка: JPG, PNG, WEBP\n' +
        '• Максимум: 10 МБ\n' +
        '• Подходит для: фото, портреты, пейзажи, арт\n\n' +
        '💡 **Что улучшаем:**\n' +
        '• Резкость и четкость\n' +
        '• Цвета и контраст\n' +
        '• Разрешение (апскейл)\n' +
        '• Шумоподавление\n' +
        '• HDR эффект',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Получение фото и выбор типа улучшения
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте фотографию');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.photo = photo.file_id;

      await ctx.reply(
        '🎯 **Выберите тип улучшения:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔆 Общее улучшение', 'enhance_general')],
          [Markup.button.callback('🌈 Цвета и контраст', 'enhance_colors')],
          [Markup.button.callback('🔍 Повышение резкости', 'enhance_sharpness')],
          [Markup.button.callback('✨ HDR эффект', 'enhance_hdr')],
          [Markup.button.callback('🧹 Удаление шума', 'enhance_denoise')],
          [Markup.button.callback('📈 Апскейл x2', 'enhance_upscale_2x')],
          [Markup.button.callback('📈 Апскейл x4', 'enhance_upscale_4x')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Интенсивность улучшения
    async (ctx) => {
      const type = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const typeMap: Record<string, string> = {
        enhance_general: 'general enhancement',
        enhance_colors: 'color correction',
        enhance_sharpness: 'sharpness enhancement',
        enhance_hdr: 'HDR effect',
        enhance_denoise: 'denoising',
        enhance_upscale_2x: 'upscale 2x',
        enhance_upscale_4x: 'upscale 4x',
      };

      wizardData.enhancementType = typeMap[type] || 'general';

      await ctx.reply(
        '🎚️ **Интенсивность улучшения:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🌱 Легкое (30%)', 'strength_low')],
          [Markup.button.callback('🔆 Среднее (60%)', 'strength_medium')],
          [Markup.button.callback('⚡ Максимальное (90%)', 'strength_high')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Целевое разрешение (для апскейла)
    async (ctx) => {
      const strength = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const strengthMap: Record<string, number> = {
        strength_low: 30,
        strength_medium: 60,
        strength_high: 90,
      };

      wizardData.strength = strengthMap[strength] || 60;

      // Если это апскейл, спрашиваем разрешение
      if (wizardData.enhancementType.includes('upscale')) {
        await ctx.reply(
          '📏 **Целевое разрешение:**',
          Markup.inlineKeyboard([
            [Markup.button.callback('📐 2048x2048', 'resolution_2k')],
            [Markup.button.callback('📐 4096x4096', 'resolution_4k')],
            [Markup.button.callback('📐 6144x6144', 'resolution_6k')],
          ])
        );
      } else {
        await ctx.reply(
          '📁 **Формат сохранения:**',
          Markup.inlineKeyboard([
            [Markup.button.callback('🖼️ PNG (без потерь)', 'format_png')],
            [Markup.button.callback('📷 JPG (сжатый)', 'format_jpg')],
            [Markup.button.callback('🎨 WEBP (универсальный)', 'format_webp')],
          ])
        );
        return ctx.wizard.next();
      }

      return ctx.wizard.next();
    },

    // Шаг 5: Формат сохранения
    async (ctx) => {
      const resolution = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const resMap: Record<string, string> = {
        resolution_2k: '2048x2048',
        resolution_4k: '4096x4096',
        resolution_6k: '6144x6144',
      };

      wizardData.targetResolution = resMap[resolution] || '2048x2048';

      await ctx.reply(
        '📁 **Формат сохранения:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🖼️ PNG (без потерь)', 'format_png')],
          [Markup.button.callback('📷 JPG (сжатый)', 'format_jpg')],
          [Markup.button.callback('🎨 WEBP (универсальный)', 'format_webp')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Подтверждение
    async (ctx) => {
      const format = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      wizardData.format = format || 'png';

      const costs: Record<string, number> = {
        general: 0.15,
        color: 0.10,
        sharpness: 0.12,
        hdr: 0.20,
        denoise: 0.18,
        'upscale 2x': 0.25,
        'upscale 4x': 0.40,
      };

      let baseCost = costs[wizardData.enhancementType as keyof typeof costs] || 0.15;

      // Доплата за высокое разрешение
      if (wizardData.enhancementType.includes('upscale')) {
        if (wizardData.targetResolution === '6144x6146') baseCost += 0.15;
        else if (wizardData.targetResolution === '4096x4096') baseCost += 0.10;
      }

      await ctx.reply(
        `📊 **Настройки улучшения:**\n\n` +
        `✨ **Тип:** ${wizardData.enhancementType}\n` +
        `🎚️ **Интенсивность:** ${wizardData.strength}%\n` +
        `📏 **Разрешение:** ${wizardData.targetResolution || 'Не меняется'}\n` +
        `📁 **Формат:** ${wizardData.format.toUpperCase()}\n\n` +
        `💰 **Стоимость:** $${baseCost.toFixed(2)}\n\n` +
        `✨ Улучшаем изображение?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, улучшить!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 7: Улучшение изображения
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Улучшение отменено', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;

      // Показываем оригинал
      await ctx.reply('📸 **Оригинал:**', Markup.removeKeyboard());
      await ctx.replyWithPhoto(wizardData.photo);

      await ctx.reply('✨ Начинаю улучшение...');

      const progressMessage = await ctx.reply('⏳ **Прогресс улучшения:** 0%');

      const stages = [
        '📥 Загружаю изображение...',
        '🔍 Анализирую качество...',
        '⚙️ Применяю фильтры...',
        '🎨 Улучшаю цвета...',
        '✨ Добавляю детализацию...',
        '📤 Подготавливаю результат...'
      ];

      for (let i = 10; i <= 100; i += 10) {
        const stageIndex = Math.floor(i / 16);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${stages[stageIndex]}\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.enhance({
            model: 'fal-ai/real-esrgan',
            input: {
              image_url: wizardData.photo,
              enhancement_type: wizardData.enhancementType,
              strength: wizardData.strength / 100,
              target_resolution: wizardData.targetResolution,
              output_format: wizardData.format,
            },
          });

          if (result.success && result.data.url) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Улучшение завершено!** ✨'
            );

            await ctx.reply('📸 **Результат:**');
            await ctx.replyWithPhoto(result.data.url, {
              caption: `✨ **Улучшенное изображение**\n` +
                `🎯 ${wizardData.enhancementType}\n` +
                `💰 Стоимость: $${wizardData.enhancementType.includes('upscale') ? wizardData.targetResolution === '6144x6146' ? '0.55' : wizardData.targetResolution === '4096x4096' ? '0.50' : '0.25' : '0.15'}`
            });

            // Показываем сравнение
            await ctx.reply(
              '🔍 **Хотите сравнить до и после?**',
              Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Показать сравнение', 'show_comparison')],
                [Markup.button.callback('💾 Скачать результат', 'download_result')],
              ])
            );

            await ctx.reply(
              '🎉 **Готово!** Изображение улучшено! Улучшить еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('✨ Улучшить еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка улучшения');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Улучшение завершено! (Демо)**'
          );

          await ctx.reply('📸 **Результат (Демо):**');
          await ctx.replyWithPhoto(
            'https://picsum.photos/1024/1024',
            { caption: `✨ **Улучшенное изображение - Демо**\n${wizardData.enhancementType}` }
          );

          await ctx.reply(
            '⚠️ Подключите Real-ESRGAN или аналогичный API для настоящего улучшения.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Image enhancement error:', error);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          '❌ Ошибка: ' + (error as Error).message
        );
      }

      return ctx.scene.leave();
    }
  );

  return scene;
};

export default createImageEnhancementScene;
