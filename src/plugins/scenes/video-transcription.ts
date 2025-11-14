/**
 * Video Transcription Scene Plugin
 * Транскрипция видео с распознаванием речи
 */

import { Scenes, Markup } from 'telegraf';
import { logger } from '@elizaos/core';
import type { MyContext } from '../../telegram-commands-plugin';

interface WizardData {
  video?: string;
  language?: string;
  format?: string;
  includeTimestamps?: boolean;
  includeSpeakerDiarization?: boolean;
}

export const createVideoTranscriptionScene = (): Scenes.WizardScene<MyContext> => {
  const scene = new Scenes.WizardScene<MyContext>(
    'videoTranscriptionWizard',

    // Шаг 1: Запрос видео
    async (ctx) => {
      await ctx.reply(
        '📝 **Транскрипция Видео**\n\n' +
        'Отправьте видео для транскрипции:\n' +
        '• Поддержка: MP4, AVI, MOV, WebM\n' +
        '• Максимальный размер: 50 МБ\n' +
        '• Максимальная длительность: 30 минут\n\n' +
        '💡 **Что получите:**\n' +
        '• Текстовую расшифровку\n' +
        '• Временные метки\n' +
        '• Определение языка\n' +
        '• Возможность перевода',
        Markup.removeKeyboard()
      );
      return ctx.wizard.next();
    },

    // Шаг 2: Получение видео и выбор языка
    async (ctx) => {
      if (!ctx.message || !('video' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте видеофайл');
        return;
      }

      const video = ctx.message.video;
      const wizardData = ctx.wizard.state as WizardData;
      wizardData.video = video.file_id;

      // Проверяем размер видео
      if (video.file_size && video.file_size > 50 * 1024 * 1024) {
        await ctx.reply('❌ Размер видео превышает лимит (50 МБ)');
        return ctx.scene.leave();
      }

      await ctx.reply(
        '🌍 **Выберите язык аудио:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
          [Markup.button.callback('🇺🇸 English', 'lang_en')],
          [Markup.button.callback('🇩🇪 Deutsch', 'lang_de')],
          [Markup.button.callback('🇫🇷 Français', 'lang_fr')],
          [Markup.button.callback('🇪🇸 Español', 'lang_es')],
          [Markup.button.callback('🇨🇳 中文', 'lang_zh')],
          [Markup.button.callback('🔄 Автоопределение', 'lang_auto')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 3: Выбор формата вывода
    async (ctx) => {
      const language = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const langMap: Record<string, string> = {
        lang_ru: 'ru',
        lang_en: 'en',
        lang_de: 'de',
        lang_fr: 'fr',
        lang_es: 'es',
        lang_zh: 'zh',
        lang_auto: 'auto',
      };

      wizardData.language = langMap[language] || 'auto';

      await ctx.reply(
        '📋 **Формат результата:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('📝 Простой текст', 'format_plain')],
          [Markup.button.callback('📄 Формат SRT (субтитры)', 'format_srt')],
          [Markup.button.callback('📊 Структурированный', 'format_structured')],
          [Markup.button.callback('📋 Детальный с таймкодами', 'format_detailed')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 4: Дополнительные настройки
    async (ctx) => {
      const format = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      const formatMap: Record<string, string> = {
        format_plain: 'plain',
        format_srt: 'srt',
        format_structured: 'structured',
        format_detailed: 'detailed',
      };

      wizardData.format = formatMap[format] || 'plain';

      await ctx.reply(
        '⚙️ **Дополнительные опции:**',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Транскрипция', 'opt_basic')],
          [Markup.button.callback('📊 + Таймкоды', 'opt_timestamps')],
          [Markup.button.callback('👥 + Разделение говорящих', 'opt_speakers')],
          [Markup.button.callback('🌟 Все опции', 'opt_all')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 5: Подтверждение
    async (ctx) => {
      const options = ctx.match?.[1];
      const wizardData = ctx.wizard.state as WizardData;

      wizardData.includeTimestamps = options === 'opt_timestamps' || options === 'opt_all';
      wizardData.includeSpeakerDiarization = options === 'opt_speakers' || options === 'opt_all';

      const optionsText = [];
      if (wizardData.includeTimestamps) optionsText.push('📊 таймкоды');
      if (wizardData.includeSpeakerDiarization) optionsText.push('👥 разделение говорящих');
      if (optionsText.length === 0) optionsText.push('простая транскрипция');

      const costs = {
        plain: 0.15,
        srt: 0.20,
        structured: 0.25,
        detailed: 0.30,
      };

      const optionCost = (wizardData.includeTimestamps ? 0.05 : 0) + (wizardData.includeSpeakerDiarization ? 0.10 : 0);
      const totalCost = (costs[wizardData.format as keyof typeof costs] || 0.15) + optionCost;

      await ctx.reply(
        `📊 **Настройки транскрипции:**\n\n` +
        `🌍 **Язык:** ${wizardData.language}\n` +
        `📋 **Формат:** ${wizardData.format}\n` +
        `✨ **Опции:** ${optionsText.join(', ')}\n\n` +
        `💰 **Стоимость:** $${totalCost.toFixed(2)}\n\n` +
        `📝 Начинаем транскрипцию?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Да, транскрибировать!', 'confirm')],
          [Markup.button.callback('🔄 Изменить', 'back')],
          [Markup.button.callback('❌ Отменить', 'cancel')],
        ])
      );

      return ctx.wizard.next();
    },

    // Шаг 6: Транскрипция
    async (ctx) => {
      if (ctx.match?.[1] === 'cancel') {
        await ctx.reply('❌ Транскрипция отменена', Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      if (ctx.match?.[1] === 'back') {
        return ctx.wizard.selectStep(3);
      }

      const wizardData = ctx.wizard.state as WizardData;

      // Показываем видео
      await ctx.reply('📹 **Видео для транскрипции:**', Markup.removeKeyboard());
      await ctx.replyWithVideo(wizardData.video, { caption: 'Видеофайл' });

      await ctx.reply('📝 Начинаю транскрипцию...');

      const progressMessage = await ctx.reply('⏳ **Прогресс:** 0%');

      const stages = [
        '📥 Загружаю видео...',
        '🔍 Анализирую аудиодорожку...',
        '🎤 Извлекаю речь...',
        '🤖 Распознаю слова...',
        '📝 Формирую текст...',
        '✅ Готово!'
      ];

      for (let i = 10; i <= 100; i += 15) {
        const stageIndex = Math.floor(i / 16);
        await ctx.telegram.editMessageText(
          ctx.chat?.id,
          progressMessage.message_id,
          undefined,
          `⏳ **Прогресс:** ${i}%\n\n${stages[stageIndex]}\n${'█'.repeat(i / 5)}${'░'.repeat(20 - i / 5)}`
        );
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      try {
        const provider = ctx.bot.context.registry.getProvider('fal');

        if (provider) {
          const result = await provider.transcribe({
            model: 'whisper-large-v3',
            audio_url: wizardData.video,
            language: wizardData.language,
            timestamp_granularities: wizardData.includeTimestamps ? ['segment'] : [],
            response_format: wizardData.format,
          });

          if (result.success) {
            await ctx.telegram.editMessageText(
              ctx.chat?.id,
              progressMessage.message_id,
              undefined,
              '✅ **Транскрипция завершена!**'
            );

            // Отправляем результат
            await ctx.reply('📝 **Транскрипция:**', {
              reply_markup: { remove_keyboard: true }
            });

            const transcriptionText = result.data.text || 'Текст не получен';
            const chunks = transcriptionText.match(/.{1,4000}/gs) || [transcriptionText];

            for (const chunk of chunks) {
              await ctx.reply(chunk);
              await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Отправляем как файл, если текст большой
            if (transcriptionText.length > 4000) {
              await ctx.reply(
                '📄 **Сохранение в файл:**',
                Markup.inlineKeyboard([
                  [Markup.button.callback('💾 Скачать .txt', 'download_txt')],
                  [Markup.button.callback('📄 Скачать .srt', 'download_srt')],
                ])
              );
            }

            await ctx.reply(
              '🎉 **Готово!** Хотите транскрибировать еще?',
              Markup.inlineKeyboard([
                [Markup.button.callback('📝 Транскрибировать еще', 'create_more')],
                [Markup.button.callback('🏠 В меню', 'main_menu')],
              ])
            );
          } else {
            throw new Error(result.error || 'Ошибка транскрипции');
          }
        } else {
          // Демо режим
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            progressMessage.message_id,
            undefined,
            '✅ **Транскрипция завершена! (Демо)**'
          );

          await ctx.reply(
            '📝 **Демо транскрипция:**\n\n' +
            '00:00:00 - Добро пожаловать в демо режим транскрипции видео\n' +
            '00:00:05 - Здесь будет текст из вашего видео\n' +
            '00:00:10 - Подключите OpenAI Whisper API для полной функциональности\n' +
            '00:00:15 - Мы поддерживаем множество языков и форматов'
          );

          await ctx.reply(
            '⚠️ Подключите Whisper API для настоящей транскрипции.',
            Markup.inlineKeyboard([
              [Markup.button.callback('🔧 Настроить API', 'setup_api')],
            ])
          );
        }
      } catch (error) {
        logger.error('Video transcription error:', error);
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

export default createVideoTranscriptionScene;
