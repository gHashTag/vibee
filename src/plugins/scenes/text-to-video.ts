/**
 * Text to Video Scene Plugin
 * Генерация видео из текстового описания
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  prompt?: string;
  style?: string;
  duration?: number;
  quality?: string;
  fps?: number;
}

export const createTextToVideoScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'textToVideoWizard',

    // Шаг 1: Запрос описания
    async (ctx) => {
      await ctx.reply(
        '🎥 **Генератор Текст → Видео**\n\n' +
        'Опишите, какое видео вы хотите создать:\n\n' +
        '📝 **Примеры описаний:**\n' +
        '• "Кот играет в саду на закате"\n' +
        '• "Футуристический город с летающими машинами"\n' +
        '• "Волны океана на рассвете"\n\n' +
        '💡 **Совет:** Чем детальнее описание, тем лучше результат!',
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
        '🎨 **Выберите стиль видео:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🎬 Кино (реалистично)', 'style_cinema')],
          [Markup.button.callback('🖼️ Аниме (японский стиль)', 'style_anime')],
          [Markup.button.callback('🖌️ Арт (художественно)', 'style_art')],
          [Markup.button.callback('📸 Фотореализм', 'style_photoreal')],
          [Markup.button.callback('🎮 Пиксель-арт', 'style_pixel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Выбор качества и длительности
    async (ctx) => {
      const style = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const styleMap: Record<string, string> = {
        style_cinema: 'cinematic realistic',
        style_anime: 'anime style',
        style_art: 'artistic painting',
        style_photoreal: 'photorealistic',
        style_pixel: 'pixel art',
      };

      wizardData.style = styleMap[style] || 'realistic';

      await ctx.reply(
        '⚙️ **Настройки качества:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Быстро (3 сек, 720p)', 'quality_fast')],
          [Markup.button.callback('🔆 Стандарт (5 сек, 1080p)', 'quality_standard')],
          [Markup.button.callback('✨ Максимум (8 сек, 4K)', 'quality_max')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Подтверждение
    async (ctx) => {
      const quality = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      switch (quality) {
        case 'quality_fast':
          wizardData.quality = '720p';
          wizardData.duration = 3;
          wizardData.fps = 24;
          break;
        case 'quality_standard':
          wizardData.quality = '1080p';
          wizardData.duration = 5;
          wizardData.fps = 30;
          break;
        case 'quality_max':
          wizardData.quality = '4k';
          wizardData.duration = 8;
          wizardData.fps = 60;
          break;
      }

      const costs = {
        '720p': 0.2,
        '1080p': 0.5,
        '4k': 1.5,
      };
      const cost = costs[wizardData.quality as keyof typeof costs] || 0.2;

      await ctx.reply(
        `📊 **Готово к генерации:**\n\n` +
        `📝 **Промпт:** ${wizardData.prompt}\n\n` +
        `🎨 **Стиль:** ${wizardData.style}\n` +
        `📹 **Качество:** ${wizardData.quality}\n` +
        `⏱️ **Длительность:** ${wizardData.duration} сек\n` +
        `⚡ **FPS:** ${wizardData.fps}\n\n` +
        `💰 **Стоимость:** $${cost}\n\n` +
        `Генерируем?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, генерировать!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Генерация видео
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Генерация отменена', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(2);
      }

      const wizardData = ctx.wizard.state as WizardData;
      await ctx.reply('🎬 Генерирую видео...', Markup.removeKeyboard());

      // Отправляем прогресс
      const progressMessage = await ctx.reply('⏳ **Прогресс:** 0%');

      for (let i = 10; i <= 100; i += 10) {
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}\n\n` +
          `${i < 50 ? '🎨 Создаю визуал...' : i < 80 ? '🎬 Накладываю движение...' : '✨ Финализирую...' }`
        );
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.generate({
            model: 'fal-ai/stable-video-diffusion',
            input: {
              prompt: `${wizardData.prompt}, ${wizardData.style}`,
              duration: wizardData.duration,
              fps: wizardData.fps,
              quality: wizardData.quality,
            },
          });

          if (result.success) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Видео готово!**'
            );

            await ctx.replyWithVideo(result.data.url, {
              caption: `🎬 **Ваше видео!**\n` +
                `📝 ${wizardData.prompt}\n` +
                `🎨 ${wizardData.style}\n` +
                `📹 ${wizardData.quality}, ${wizardData.duration}сек`,
            });

            await ctx.reply(
              '🎉 **Отличный результат!** Создать еще видео?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🎬 Создать еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка генерации');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Видео готово! (Демо)**'
          );

          await ctx.replyWithVideo(
            'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            {
              caption: `🎬 **Демо видео**\n📝 ${wizardData.prompt}`,
            }
          );

          await ctx.reply(
            '⚠️ Подключите FAL или Replicate API для полной функциональности.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Text to video generation error:', error);
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

export default createTextToVideoScene;
