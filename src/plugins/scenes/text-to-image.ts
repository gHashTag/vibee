/**
 * Text to Image Scene Plugin
 * Генерация изображений из текстового описания
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  prompt?: string;
  style?: string;
  size?: string;
  count?: number;
  aspectRatio?: string;
}

export const createTextToImageScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'textToImageWizard',

    // Шаг 1: Запрос описания
    async (ctx) => {
      await ctx.reply(
        '🖼️ **Генератор Текст → Изображение**\n\n' +
        'Опишите изображение, которое хотите создать:\n\n' +
        '📝 **Примеры:**\n' +
        '• "Красивый закат над океаном, акварель"\n' +
        '• "Футуристический робот, киберпанк стиль"\n' +
        '• "Портрет девушки в стиле импрессионизм"\n\n' +
        '💡 **Добавьте стиль в описание для лучшего результата!**',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Получение промпта и выбор стиля
    async (ctx) => {
      if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) {
        await ctx.reply('❌ Пожалуйста, введите описание текстом');
        return;
      }

      const wizardData = ctx.wizard.state as WizardData;
      wizardData.prompt = ctx.message.text;

      await ctx.reply(
        '🎨 **Выберите художественный стиль:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📸 Фотореализм', 'style_photo')],
          [Markup.button.callback('🖌️ Акварель', 'style_watercolor')],
          [Markup.button.callback('🎨 Импрессионизм', 'style_impressionist')],
          [Markup.button.callback('🎭 Киберпанк', 'style_cyberpunk')],
          [Markup.button.callback('🖼️ Минимализм', 'style_minimalist')],
          [Markup.button.callback('🎪 Аниме', 'style_anime')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Выбор формата
    async (ctx) => {
      const style = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const styleMap: Record<string, string> = {
        style_photo: 'photorealistic, high quality',
        style_watercolor: 'watercolor painting',
        style_impressionist: 'impressionist style',
        style_cyberpunk: 'cyberpunk, neon lights',
        style_minimalist: 'minimalist art',
        style_anime: 'anime style, manga',
      };

      wizardData.style = styleMap[style] || 'high quality';

      await ctx.reply(
        '📐 **Выберите формат изображения:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📱 Квадрат (1024x1024)', 'size_square')],
          [Markup.button.callback('📺 Пейзаж (1792x1024)', 'size_landscape')],
          [Markup.button.callback('📱 Портрет (1024x1792)', 'size_portrait')],
          [Markup.button.callback('🖼️ Широкоформат (2048x512)', 'size_wide')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Количество вариантов
    async (ctx) => {
      const size = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const sizeMap: Record<string, string> = {
        size_square: '1024x1024',
        size_landscape: '1792x1024',
        size_portrait: '1024x1792',
        size_wide: '2048x512',
      };

      wizardData.size = sizeMap[size] || '1024x1024';

      await ctx.reply(
        '🔢 **Сколько вариантов создать?**',
        Markup.inlineKeyboard([
          [Markup.button.callback('1 изображение', 'count_1')],
          [Markup.button.callback('2 изображения', 'count_2')],
          [Markup.button.callback('4 изображения', 'count_4')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Подтверждение
    async (ctx) => {
      const count = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const countMap: Record<string, number> = {
        count_1: 1,
        count_2: 2,
        count_4: 4,
      };

      wizardData.count = countMap[count] || 1;

      const costPerImage = 0.02;
      const totalCost = wizardData.count * costPerImage;

      await ctx.reply(
        `📊 **Готово к генерации:**\n\n` +
        `📝 **Описание:** ${wizardData.prompt}\n\n` +
        `🎨 **Стиль:** ${wizardData.style}\n` +
        `📐 **Размер:** ${wizardData.size}\n` +
        `🔢 **Количество:** ${wizardData.count} изображение(й)\n\n` +
        `💰 **Стоимость:** $${totalCost.toFixed(2)}\n\n` +
        `Создаем?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Генерировать!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Генерация изображений
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Генерация отменена', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;
      await ctx.reply('🖼️ Генерирую изображения...', Markup.removeKeyboard());

      // Прогресс
      const progressMessage = await ctx.reply('⏳ **Прогресс:** 0%');

      for (let i = 10; i <= 100; i += 20) {
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const fullPrompt = `${wizardData.prompt}, ${wizardData.style}, ${wizardData.size}`;
          const images: string[] = [];

          for (let i = 0; i < wizardData.count; i++) {
            const result = await provider.generate({
              model: 'fal-ai/flux/schnell',
              input: {
                prompt: fullPrompt,
                image_size: wizardData.size,
              },
            });

            if (result.success && result.data.url) {
              images.push(result.data.url);
            }
          }

          if (images.length > 0) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              `✅ **Готово!** ${images.length} изображение(й)`
            );

            // Отправляем изображения по одному
            for (let i = 0; i < images.length; i++) {
              await ctx.replyWithPhoto(images[i], {
                caption: `🖼️ **Изображение ${i + 1}**\n${wizardData.prompt}\n${wizardData.style}`,
              });
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            await ctx.reply(
              '🎉 **Отличная работа!** Создать еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🖼️ Создать еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error('Не удалось создать изображения');
          }
        } else {
          // Демо
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Изображения готовы! (Демо)**'
          );

          // Отправляем демо изображения
          await ctx.replyWithPhoto(
            'https://picsum.photos/1024/1024',
            { caption: `🖼️ **Демо изображение 1**\n${wizardData.prompt}` }
          );

          if (wizardData.count > 1) {
            await ctx.replyWithPhoto(
              'https://picsum.photos/1024/1024',
              { caption: `🖼️ **Демо изображение 2**\n${wizardData.prompt}` }
            );
          }

          await ctx.reply(
            '⚠️ Для полной функциональности подключите FAL или Replicate API.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Text to image generation error:', error);
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

export default createTextToImageScene;
