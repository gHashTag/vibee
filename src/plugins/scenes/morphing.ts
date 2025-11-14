/**
 * Infinite Morphing Scene Plugin
 * Бесконечные морфинги между изображениями
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  image1?: string;
  image2?: string;
  mode?: string;
  duration?: number;
  frames?: number;
}

export const createMorphingScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'morphingWizard',

    // Шаг 1: Запрос первого изображения
    async (ctx) => {
      await ctx.reply(
        '🌀 **Бесконечный Морфинг**\n\n' +
        'Отправьте **первое изображение** для морфинга:\n' +
        '• Лица, объекты, любые изображения\n' +
        '• Форматы: JPG, PNG, WEBP\n' +
        '• Максимум: 10 МБ\n\n' +
        '💡 **Идея:** Превратим ваше изображение в магическое шоу!',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Запрос второго изображения
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте фотографию');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.image1 = photo.file_id;

      await ctx.reply(
        '✅ Первое изображение получено!\n\n' +
        'Теперь отправьте **второе изображение** для морфинга:\n' +
        '• Может быть любым объектом\n' +
        '• Для лучшего результата - похожий размер\n' +
        '• Лица трансформируются лучше всего',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 3: Выбор режима морфинга
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте второе изображение');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.image2 = photo.file_id;

      await ctx.reply(
        '🎭 **Выберите режим морфинга:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🌊 Плавная трансформация', 'mode_smooth')],
          [Markup.button.callback('⚡ Быстрый переход', 'mode_fast')],
          [Markup.button.callback('🌈 Цветовой взрыв', 'mode_color')],
          [Markup.button.callback('✨ Магический эффект', 'mode_magic')],
          [Markup.button.callback('🔄 Зеркальный', 'mode_mirror')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Настройка длительности
    async (ctx) => {
      const mode = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const modeMap: Record<string, string> = {
        mode_smooth: 'smooth transition',
        mode_fast: 'fast morphing',
        mode_color: 'color explosion',
        mode_magic: 'magical effect',
        mode_mirror: 'mirror effect',
      };

      wizardData.mode = modeMap[mode] || 'smooth';

      await ctx.reply(
        '⏱️ **Длительность морфинга:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Короткий (3 сек)', 'duration_short')],
          [Markup.button.callback('🔆 Средний (5 сек)', 'duration_medium')],
          [Markup.button.callback('🕰️ Длинный (8 сек)', 'duration_long')],
          [Markup.button.callback('♾️ Бесконечный цикл', 'duration_infinite')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Подтверждение
    async (ctx) => {
      const duration = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      switch (duration) {
        case 'duration_short':
          wizardData.duration = 3;
          wizardData.frames = 30;
          break;
        case 'duration_medium':
          wizardData.duration = 5;
          wizardData.frames = 50;
          break;
        case 'duration_long':
          wizardData.duration = 8;
          wizardData.frames = 80;
          break;
        case 'duration_infinite':
          wizardData.duration = 10;
          wizardData.frames = 100;
          break;
      }

      const costs: Record<string, number> = {
        smooth: 0.30,
        fast: 0.20,
        color: 0.40,
        magic: 0.50,
        mirror: 0.35,
      };

      const cost = costs[wizardData.mode as keyof typeof costs] || 0.30;

      await ctx.reply(
        `📊 **Настройки морфинга:**\n\n` +
        `🌊 **Эффект:** ${wizardData.mode}\n` +
        `⏱️ **Длительность:** ${wizardData.duration} сек\n` +
        `🎬 **Кадров:** ${wizardData.frames}\n\n` +
        `💰 **Стоимость:** $${cost}\n\n` +
        `🌀 Начинаем магический морфинг?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, морфить!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Генерация морфинга
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Морфинг отменен', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;

      // Показываем исходные изображения
      await ctx.reply('🖼️ **Исходные изображения:**', Markup.removeKeyboard());
      await ctx.replyWithPhoto(wizardData.image1, { caption: '🖼️ Изображение 1' });
      await ctx.replyWithPhoto(wizardData.image2, { caption: '🖼️ Изображение 2' });

      await ctx.reply('🌀 Начинаю магический морфинг...');

      const progressMessage = await ctx.reply('⏳ **Прогресс морфинга:** 0%');

      const stages = [
        '🎨 Анализирую изображения...',
        '🔍 Определяю ключевые точки...',
        '⚡ Создаю промежуточные кадры...',
        '🌈 Накладываю эффекты...',
        '✨ Добавляю магию...',
        '🎬 Собираю видео...'
      ];

      for (let i = 10; i <= 100; i += 10) {
        const stageIndex = Math.floor(i / 16);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${stages[stageIndex]}\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.generate({
            model: 'fal-ai/morph',
            input: {
              image1_url: wizardData.image1,
              image2_url: wizardData.image2,
              mode: wizardData.mode,
              duration: wizardData.duration,
              frames: wizardData.frames,
            },
          });

          if (result.success && result.data.url) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Морфинг завершен!** 🌀'
            );

            await ctx.replyWithVideo(result.data.url, {
              caption: `🌀 **Бесконечный морфинг!**\n` +
                `🌊 Эффект: ${wizardData.mode}\n` +
                `⏱️ ${wizardData.duration} сек магии\n` +
                `🎬 ${wizardData.frames} кадров`,
            });

            await ctx.reply(
              '🎉 **Готово!** Морфинг получился волшебным! Создать еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🌀 Создать еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка морфинга');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Морфинг завершен! (Демо)**'
          );

          await ctx.replyWithVideo(
            'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            {
              caption: `🌀 **Демо морфинг**\n${wizardData.mode} эффект`,
            }
          );

          await ctx.reply(
            '⚠️ Подключите FAL API для полноценного морфинга.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Morphing generation error:', error);
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

export default createMorphingScene;
