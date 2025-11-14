/**
 * Text to Speech Wizard Scene
 * Multi-step TTS conversion
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { TTSService } from './services/ttsService';
import {
  TTS_VOICES,
  SPEED_OPTIONS,
  AUDIO_FORMATS,
  type TTSContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createTextToSpeechScene = () => {
  const ttsService = new TTSService();

  return new Scenes.WizardScene<MyContext>(
    'textToSpeechWizard',

    // Step 1: Text Input
    async (ctx: MyContext) => {
      logger.info('🎙️ Text to Speech Scene: Text Input');

      ctx.session.wizardData = {
        step: 'text',
        text: '',
        settings: {
          voice: 'alloy',
          speed: 1.0,
          format: 'mp3',
        },
      } as TTSContext;

      await ctx.reply(
        `🎙️ <b>Текст в Речь</b>\n\n` +
        `📝 <b>Шаг 1: Введите текст</b>\n\n` +
        `Введите текст, который нужно озвучить:\n` +
        `(максимум 1000 символов)`,
      );

      return ctx.wizard.next();
    },

    // Step 2: Voice Selection
    async (ctx: MyContext) => {
      logger.info('🎙️ Text to Speech Scene: Voice Selection');

      if (ctx.message?.text) {
        ctx.session.wizardData.text = ctx.message.text.trim();
      }

      const voiceButtons = TTS_VOICES.map((voice) => [
        Markup.button.callback(
          `${voice.emoji} ${voice.name}`,
          `voice_${voice.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Текст получен (${ctx.session.wizardData.text.length} символов)\n\n` +
        `🎭 <b>Шаг 2: Выбор голоса</b>\n\n` +
        `Выберите голос для озвучивания:`,
        Markup.inlineKeyboard(voiceButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Speed Selection
    async (ctx: MyContext) => {
      logger.info('🎙️ Text to Speech Scene: Speed');

      if (ctx.update?.callback_query?.data?.startsWith('voice_')) {
        const voiceId = ctx.update.callback_query.data.replace('voice_', '');
        ctx.session.wizardData.settings.voice = voiceId;
      }

      const speedButtons = SPEED_OPTIONS.map((speed) => [
        Markup.button.callback(
          `${speed.emoji} ${speed.name}`,
          `speed_${speed.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Текст: "${ctx.session.wizardData.text.substring(0, 50)}..."\n` +
        `🎭 Голос: <b>${TTS_VOICES.find(v => v.id === ctx.session.wizardData.settings.voice)?.name}</b>\n\n` +
        `⚡ <b>Шаг 3: Скорость</b>\n\n` +
        `Выберите скорость речи:`,
        Markup.inlineKeyboard(speedButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Generate Audio
    async (ctx: MyContext) => {
      logger.info('🎙️ Text to Speech Scene: Generate');

      if (ctx.update?.callback_query?.data?.startsWith('speed_')) {
        const speedId = ctx.update.callback_query.data.replace('speed_', '');
        const speedOption = SPEED_OPTIONS.find((s) => s.id === speedId);
        if (speedOption) {
          ctx.session.wizardData.settings.speed = speedOption.value;
        }
      }

      await ctx.reply('⏳ Генерирую аудио...');

      try {
        const result = await ttsService.synthesize(
          ctx.bot.context.runtime,
          ctx.session.wizardData.text,
          ctx.session.wizardData.settings.voice,
          ctx.session.wizardData.settings.speed,
          ctx.session.wizardData.settings.format
        );

        if (result.success && result.audioUrl) {
          ctx.session.wizardData.audioUrl = result.audioUrl;

          const selectedVoice = TTS_VOICES.find(v => v.id === ctx.session.wizardData.settings.voice);
          const selectedSpeed = SPEED_OPTIONS.find(s => s.value === ctx.session.wizardData.settings.speed);

          await ctx.replyWithAudio(result.audioUrl, {
            caption: `✨ <b>Аудио готово!</b>\n\n` +
                    `🎭 Голос: <b>${selectedVoice?.name}</b>\n` +
                    `⚡ Скорость: <b>${selectedSpeed?.name}</b>\n` +
                    `📄 Текст: ${ctx.session.wizardData.text.length} символов`,
            parseMode: 'HTML',
          });
        } else {
          throw new Error(result.error || 'TTS generation failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ TTS generation error:', error);
        await ctx.reply(
          `❌ Ошибка генерации: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте с другим текстом или голосом.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
