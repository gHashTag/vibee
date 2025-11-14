/**
 * Face Swap Scene Plugin
 * Замена лица на изображении
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  sourceImage?: string;
  targetImage?: string;
  quality?: string;
  preserveOriginal?: boolean;
}

export const createFaceSwapScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'faceSwapWizard',

    // Шаг 1: Запрос изображения с лицом-донором
    async (ctx) => {
      await ctx.reply(
        '🎭 **Замена Лица**\n\n' +
        'Отправьте изображение с лицом, **которое** хотите использовать:\n' +
        '• Лицо должно быть четко видно\n' +
        '• Хорошее освещение\n' +
        '• Анфас или 3/4\n\n' +
        '💡 **Это будет лицо-донор** для замены',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Запрос изображения-цели
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте фотографию');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.sourceImage = photo.file_id;

      await ctx.reply(
        '✅ Лицо-донор получено!\n\n' +
        'Теперь отправьте **целевое изображение**:\n' +
        '• Куда нужно поместить лицо\n' +
        '• Может быть фото, картина, скульптура\n' +
        '• Желательно тоже с лицом для лучшего результата',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 3: Получение целевого изображения и выбор качества
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте целевое изображение');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.targetImage = photo.file_id;

      await ctx.reply(
        '🎯 **Выберите качество замены:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Быстрое', 'quality_fast')],
          [Markup.button.callback('🔆 Стандарт', 'quality_standard')],
          [Markup.button.callback('✨ Максимум', 'quality_max')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Настройки сохранения
    async (ctx) => {
      const quality = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const qualityMap: Record<string, string> = {
        quality_fast: 'fast',
        quality_standard: 'standard',
        quality_max: 'maximum',
      };

      wizardData.quality = qualityMap[quality] || 'standard';

      await ctx.reply(
        '💾 **Дополнительные настройки:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Только результат', 'save_result_only')],
          [Markup.button.callback('📸 + оригинал для сравнения', 'save_with_original')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Подтверждение
    async (ctx) => {
      const saveMode = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.preserveOriginal = saveMode === 'save_with_original';

      const costs: Record<string, number> = {
        fast: 0.25,
        standard: 0.40,
        maximum: 0.60,
      };

      const cost = costs[wizardData.quality as keyof typeof costs] || 0.40;

      await ctx.reply(
        `📊 **Настройки замены лица:**\n\n` +
        `📹 **Качество:** ${wizardData.quality}\n` +
        `💾 **Режим:** ${wizardData.preserveOriginal ? 'С оригиналом' : 'Только результат'}\n\n` +
        `💰 **Стоимость:** $${cost}\n\n` +
        `🎭 Заменяем лицо?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, заменить!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Замена лица
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Замена лица отменена', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;

      // Показываем исходные изображения
      await ctx.reply('🖼️ **Исходные изображения:**', Markup.removeKeyboard());
      await ctx.replyWithPhoto(wizardData.sourceImage, { caption: '🎭 Лицо-донор' });
      await ctx.replyWithPhoto(wizardData.targetImage, { caption: '🎯 Целевое изображение' });

      await ctx.reply('🎭 Начинаю замену лица...');

      const progressMessage = await ctx.reply('⏳ **Прогресс замены:** 0%');

      const stages = [
        '🔍 Детектирую лица...',
        '📐 Анализирую черты...',
        '🎨 Адаптирую к целевому изображению...',
        '✨ Накладываю лицо...',
        '🔧 Исправляю детали...',
        '🎯 Финализирую...'
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
            model: 'fal-ai/face-swap',
            input: {
              source_image: wizardData.sourceImage,
              target_image: wizardData.targetImage,
              quality: wizardData.quality,
            },
          });

          if (result.success && result.data.url) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Замена лица завершена!** 🎭'
            );

            if (wizardData.preserveOriginal) {
              await ctx.reply('📸 **Оригинал:**');
              await ctx.replyWithPhoto(wizardData.targetImage);
            }

            await ctx.reply('✨ **Результат:**');
            await ctx.replyWithPhoto(result.data.url, {
              caption: `🎭 **Замена лица**\n` +
                `📹 Качество: ${wizardData.quality}\n` +
                `💰 Стоимость: $${wizardData.quality === 'maximum' ? '0.60' : wizardData.quality === 'standard' ? '0.40' : '0.25'}`,
            });

            await ctx.reply(
              '🎉 **Готово!** Результат получился убедительным! Создать еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('🎭 Заменить еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка замены лица');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Замена лица завершена! (Демо)**'
          );

          await ctx.reply('✨ **Результат (Демо):**');
          await ctx.replyWithPhoto(
            'https://picsum.photos/1024/1024',
            { caption: `🎭 **Face Swap - Демо**` }
          );

          await ctx.reply(
            '⚠️ Подключите FAL API для настоящей замены лиц.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Face swap error:', error);
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

export default createFaceSwapScene;
