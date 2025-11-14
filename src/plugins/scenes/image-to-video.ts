/**
 * Image to Video Scene Plugin
 * Преобразование фотографии в видео с эффектами движения
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  photo?: string;
  effect?: string;
  quality?: string;
  duration?: number;
  fps?: number;
}

export const createImageToVideoScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'imageToVideoWizard',

    // Шаг 1: Запрос загрузки изображения
    async (ctx) => {
      await ctx.reply(
        '🎥 **Конвертер Фото → Видео**\n\n' +
        'Загрузи изображение, которое хочешь превратить в видео:\n' +
        '• Поддерживаемые форматы: JPG, PNG, WEBP\n' +
        '• Максимальный размер: 10 МБ',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Получение фото и выбор качества
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте фотографию');
        return;
      }

      const photo = ctx.message.photo[2]; // High resolution
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.photo = photo.file_id;

      await ctx.reply(
        '🎬 **Выберите качество видео:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📹 720p (Быстро)', 'quality_720p')],
          [Markup.button.callback('🔆 1080p (Стандарт)', 'quality_1080p')],
          [Markup.button.callback('✨ 4K (Максимум)', 'quality_4k')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Выбор эффекта движения
    async (ctx) => {
      const quality = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      switch (quality) {
        case 'quality_720p':
          wizardData.quality = '720p';
          wizardData.duration = 3;
          wizardData.fps = 24;
          break;
        case 'quality_1080p':
          wizardData.quality = '1080p';
          wizardData.duration = 5;
          wizardData.fps = 30;
          break;
        case 'quality_4k':
          wizardData.quality = '4k';
          wizardData.duration = 8;
          wizardData.fps = 60;
          break;
      }

      await ctx.reply(
        '🎨 **Выберите эффект движения:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📸 Статичное видео (без движения)', 'effect_static')],
          [Markup.button.callback('🌊 Объекты плавно двигаются', 'effect_objects')],
          [Markup.button.callback('📹 Камера движется (zoom, pan)', 'effect_camera')],
          [Markup.button.callback('✨ Частицы и магия', 'effect_magic')],
          [Markup.button.callback('🌙 Эффект дрожания', 'effect_shake')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Подтверждение и генерация
    async (ctx) => {
      const effect = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      switch (effect) {
        case 'effect_static':
          wizardData.effect = 'static';
          break;
        case 'effect_objects':
          wizardData.effect = 'objects moving smoothly';
          break;
        case 'effect_camera':
          wizardData.effect = 'camera movement with zoom and pan';
          break;
        case 'effect_magic':
          wizardData.effect = 'magical particles and sparkles';
          break;
        case 'effect_shake':
          wizardData.effect = 'subtle shake effect';
          break;
      }

      // Показываем итоговую стоимость
      const costs = {
        '720p': 0.1,
        '1080p': 0.3,
        '4k': 1.0,
      };
      const cost = costs[wizardData.quality as keyof typeof costs] || 0.1;

      await ctx.reply(
        `📊 **Итоговая информация:**\n\n` +
        `📹 Качество: ${wizardData.quality}\n` +
        `🎬 Длительность: ${wizardData.duration} сек\n` +
        `⚡ FPS: ${wizardData.fps}\n` +
        `🎨 Эффект: ${wizardData.effect}\n` +
        `💰 Стоимость: $${cost}\n\n` +
        `Продолжить генерацию?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, генерировать!', 'confirm')],
          [Markup.button.callback('🔄 Изменить настройки', 'back')],
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
        await ctx.reply('Переходим к выбору эффекта...');
        return ctx.wizard.selectStep(2);
      }

      const wizardData = ctx.wizard.state as WizardData;
      await ctx.reply('🎬 Начинаю генерацию видео...', Markup.removeKeyboard());

      // Отправляем прогресс-бар
      const progressMessage = await ctx.reply('⏳ **Прогресс:** 0%');

      // Симуляция прогресса
      for (let i = 10; i <= 100; i += 10) {
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        // Получаем провайдер (FAL или Replicate)
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.generate({
            model: 'fal-ai/haiper',
            input: {
              image_url: wizardData.photo,
              motion_prompt: wizardData.effect,
              duration: wizardData.duration,
              fps: wizardData.fps,
            },
          });

          if (result.success) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Генерация завершена!**'
            );

            await ctx.replyWithVideo(result.data.url, {
              caption: `🎬 **Ваше видео готово!**\n` +
                `📹 Качество: ${wizardData.quality}\n` +
                `⏱️ Длительность: ${wizardData.duration} сек\n` +
                `💰 Стоимость: $${wizardData.quality === '4k' ? '1.0' : wizardData.quality === '1080p' ? '0.3' : '0.1'}`,
            });

            await ctx.reply(
              '🎉 **Готово!** Хотите создать еще видео?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🎬 Создать еще', 'create_more')],
                [Markup.button.callback('🏠 В главное меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Неизвестная ошибка');
          }
        } else {
          // Заглушка для демонстрации
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Генерация завершена!**'
          );

          await ctx.replyWithVideo(
            'https://sample-videos.com/zip/10/mp4/720/mp4-SampleVideo_720x480_1mb.mp4',
            {
              caption: `🎬 **Демо видео (заглушка)**\n📹 Качество: ${wizardData.quality}`,
            }
          );

          await ctx.reply(
            '⚠️ **Демо-режим:** Используйте ваш FAL/REPLICATE API ключ для полноценной работы.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Image to video generation error:', error);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          '❌ **Ошибка генерации:** ' + (error as Error).message
        );
        await ctx.reply('Попробуйте еще раз позже.');
      }

      return ctx.scene.leave();
    }
  );

  return scene;
};

export default createImageToVideoScene;
