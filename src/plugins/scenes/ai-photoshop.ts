/**
 * AI Photoshop Scene Plugin
 * Профессиональная обработка изображений с ИИ
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  photo?: string;
  model?: string;
  instruction?: string;
  intensity?: number;
  beforeImage?: string;
}

export const createAiPhotoshopScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'aiPhotoshopWizard',

    // Шаг 1: Запрос загрузки фото
    async (ctx) => {
      await ctx.reply(
        '🎨 **AI Фотошоп**\n\n' +
        'Загрузите изображение для обработки:\n' +
        '• Поддержка: JPG, PNG, WEBP\n' +
        '• Максимум: 10 МБ\n' +
        '• Рекомендуем: высокое разрешение\n\n' +
        '💡 **Что можно сделать:**\n' +
        '• Изменить фон\n' +
        '• Добавить объекты\n' +
        '• Изменить стиль\n' +
        '• Убрать/добавить объекты',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Получение фото и выбор модели
    async (ctx) => {
      if (!ctx.message || !('photo' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте фотографию');
        return;
      }

      const photo = ctx.message.photo[2];
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.photo = photo.file_id;

      await ctx.reply(
        '🎯 **Выберите режим обработки:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🖼️ Замена фона', 'model_background_replace')],
          [Markup.button.callback('✨ Изменение объектов', 'model_object_edit')],
          [Markup.button.callback('🎨 Художественный стиль', 'model_style_transfer')],
          [Markup.button.callback('🧹 Удаление объектов', 'model_object_remove')],
          [Markup.button.callback('🌟 Улучшение качества', 'model_enhance')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Ввод инструкций
    async (ctx) => {
      const model = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const modelMap: Record<string, string> = {
        model_background_replace: 'replace_background',
        model_object_edit: 'edit_objects',
        model_style_transfer: 'style_transfer',
        model_object_remove: 'remove_objects',
        model_enhance: 'enhance_quality',
      };

      wizardData.model = modelMap[model] || 'edit_objects';

      // Показываем подсказки для каждой модели
      const hints: Record<string, string> = {
        replace_background: 'Примеры: "Замени на пляж", "Новый фон: горы"',
        edit_objects: 'Примеры: "Сделай небо красным", "Добавь цветы"',
        style_transfer: 'Примеры: "Стиль импрессионизм", "Акварель эффект"',
        remove_objects: 'Примеры: "Убери машину", "Удали лишние объекты"',
        enhance_quality: 'Автоматическое улучшение качества',
      };

      await ctx.reply(
        `📝 **Опишите, что нужно сделать:**\n\n` +
        `💡 ${hints[wizardData.model] || 'Опишите желаемый результат'}\n\n` +
        `Введите подробное описание:`,
        Markup.removeKeyboard()
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Интенсивность обработки
    async (ctx) => {
      if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) {
        await ctx.reply('❌ Пожалуйста, введите инструкцию');
        return;
      }

      const wizardData = ctx.wizard.state as WizardData;
      wizardData.instruction = ctx.message.text;

      await ctx.reply(
        '🎚️ **Интенсивность обработки:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🌱 Легкая обработка (30%)', 'intensity_low')],
          [Markup.button.callback('🔆 Средняя (60%)', 'intensity_medium')],
          [Markup.button.callback('⚡ Максимальная (90%)', 'intensity_high')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Подтверждение
    async (ctx) => {
      const intensity = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const intensityMap: Record<string, number> = {
        intensity_low: 30,
        intensity_medium: 60,
        intensity_high: 90,
      };

      wizardData.intensity = intensityMap[intensity] || 60;

      const costs: Record<string, number> = {
        replace_background: 0.15,
        edit_objects: 0.20,
        style_transfer: 0.25,
        remove_objects: 0.18,
        enhance_quality: 0.10,
      };

      const cost = costs[wizardData.model as keyof typeof costs] || 0.20;

      await ctx.reply(
        `📊 **Настройки обработки:**\n\n` +
        `🎯 **Режим:** ${wizardData.model}\n` +
        `📝 **Инструкция:** ${wizardData.instruction}\n` +
        `🎚️ **Интенсивность:** ${wizardData.intensity}%\n\n` +
        `💰 **Стоимость:** $${cost}\n\n` +
        `Начать обработку?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, обработать!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Обработка с предпросмотром
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Обработка отменена', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;

      // Отправляем оригинал для сравнения
      await ctx.reply('📸 **Оригинал:**');
      await ctx.replyWithPhoto(wizardData.photo);

      await ctx.reply('🎨 Начинаю обработку...', Markup.removeKeyboard());

      const progressMessage = await ctx.reply('⏳ **Прогресс:** 0%');

      for (let i = 10; i <= 100; i += 10) {
        const stages = [
          '🎨 Анализ изображения...',
          '✨ Применение модели...',
          '🔧 Обработка объектов...',
          '✨ Добавление деталей...',
          '🎯 Финальная обработка...'
        ];

        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${stages[Math.floor(i / 20)]}\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.generate({
            model: 'fal-ai/sam',
            input: {
              image_url: wizardData.photo,
              prompt: wizardData.instruction,
              mode: wizardData.model,
              strength: wizardData.intensity / 100,
            },
          });

          if (result.success && result.data.url) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Обработка завершена!**'
            );

            await ctx.reply('📸 **Результат:**');
            await ctx.replyWithPhoto(result.data.url, {
              caption: `🎨 **AI Фотошоп**\n` +
                `🎯 ${wizardData.model}\n` +
                `🎚️ Интенсивность: ${wizardData.intensity}%`,
            });

            // Спрашиваем о сохранении результата
            await ctx.reply(
              '💾 Сохранить обработанное изображение?',
              Markup.inlineKeyboard([
                [Markup.button.callback('💾 Сохранить', 'save_result')],
                [Markup.button.callback('🔄 Обработать еще раз', 'retry')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка обработки');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Обработка завершена! (Демо)**'
          );

          await ctx.reply('📸 **Результат (Демо):**');
          await ctx.replyWithPhoto(
            'https://picsum.photos/1024/1024',
            { caption: `🎨 **AI Фотошоп - Демо**\n${wizardData.instruction}` }
          );

          await ctx.reply(
            '⚠️ Для полной функциональности подключите FAL API.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('AI Photoshop error:', error);
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

export default createAiPhotoshopScene;
