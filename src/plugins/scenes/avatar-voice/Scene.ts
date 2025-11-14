/**
 * Avatar Voice Wizard Scene
 * Configure voice settings for avatars
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { AvatarVoiceService } from './services/voiceService';
import {
  VOICE_OPTIONS,
  LANGUAGES,
  EMOTIONS,
  type AvatarVoiceContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createAvatarVoiceScene = () => {
  const voiceService = new AvatarVoiceService();

  return new Scenes.WizardScene<MyContext>(
    'avatarVoiceWizard',

    // Step 1: Avatar ID
    async (ctx: MyContext) => {
      logger.info('🎤 Avatar Voice Scene: Avatar ID');

      ctx.session.wizardData = {
        step: 'id',
        avatarId: '',
        voiceSettings: {
          voiceId: '',
          language: 'ru',
          speed: 1.0,
          pitch: 1.0,
          emotion: 'neutral',
        },
      } as AvatarVoiceContext;

      await ctx.reply(
        `🎤 <b>Настройка Голоса Аватара</b>\n\n` +
        `📝 <b>Шаг 1: ID аватара</b>\n\n` +
        `Введите ID аватара для настройки голоса:`,
      );

      return ctx.wizard.next();
    },

    // Step 2: Voice Selection
    async (ctx: MyContext) => {
      logger.info('🎤 Avatar Voice Scene: Voice Selection');

      if (ctx.message?.text) {
        ctx.session.wizardData.avatarId = ctx.message.text.trim();
      }

      const voiceButtons = VOICE_OPTIONS.map((voice) => [
        Markup.button.callback(
          `${voice.emoji} ${voice.name} (${voice.gender})`,
          `voice_${voice.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Avatar ID: <b>${ctx.session.wizardData.avatarId}</b>\n\n` +
        `🎭 <b>Шаг 2: Выбор голоса</b>\n\n` +
        `Выберите голос для аватара:\n\n` +
        `${VOICE_OPTIONS.map(v => `• ${v.emoji} <b>${v.name}</b>: ${v.description}`).join('\n')}`,
        Markup.inlineKeyboard(voiceButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Language
    async (ctx: MyContext) => {
      logger.info('🎤 Avatar Voice Scene: Language');

      if (ctx.update?.callback_query?.data?.startsWith('voice_')) {
        const voiceId = ctx.update.callback_query.data.replace('voice_', '');
        ctx.session.wizardData.voiceSettings.voiceId = voiceId;
      }

      const langButtons = LANGUAGES.map((lang) => [
        Markup.button.callback(
          `${lang.flag} ${lang.name}`,
          `lang_${lang.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Голос: <b>${VOICE_OPTIONS.find(v => v.id === ctx.session.wizardData.voiceSettings.voiceId)?.name}</b>\n\n` +
        `🌍 <b>Шаг 3: Язык</b>\n\n` +
        `Выберите язык озвучивания:`,
        Markup.inlineKeyboard(langButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Emotion
    async (ctx: MyContext) => {
      logger.info('🎤 Avatar Voice Scene: Emotion');

      if (ctx.update?.callback_query?.data?.startsWith('lang_')) {
        const langId = ctx.update.callback_query.data.replace('lang_', '');
        ctx.session.wizardData.voiceSettings.language = langId;
      }

      const emotionButtons = EMOTIONS.map((emotion) => [
        Markup.button.callback(
          `${emotion.emoji} ${emotion.name}`,
          `emotion_${emotion.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Голос: <b>${VOICE_OPTIONS.find(v => v.id === ctx.session.wizardData.voiceSettings.voiceId)?.name}</b>\n` +
        `🌍 Язык: <b>${LANGUAGES.find(l => l.id === ctx.session.wizardData.voiceSettings.language)?.name}</b>\n\n` +
        `😊 <b>Шаг 4: Эмоция</b>\n\n` +
        `Выберите эмоциональный тон:`,
        Markup.inlineKeyboard(emotionButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 5: Sample and Save
    async (ctx: MyContext) => {
      logger.info('🎤 Avatar Voice Scene: Sample and Save');

      if (ctx.update?.callback_query?.data?.startsWith('emotion_')) {
        const emotionId = ctx.update.callback_query.data.replace('emotion_', '');
        ctx.session.wizardData.voiceSettings.emotion = emotionId;
      }

      await ctx.reply('⏳ Сохраняю настройки голоса...');

      try {
        const result = await voiceService.configureVoice(
          ctx.bot.context.runtime,
          ctx.session.wizardData.avatarId,
          ctx.session.wizardData.voiceSettings
        );

        if (result.success && result.config) {
          await ctx.reply(
            `✨ <b>Голос настроен!</b>\n\n` +
            `🤖 Аватар: <b>${ctx.session.wizardData.avatarId}</b>\n` +
            `🎭 Голос: <b>${VOICE_OPTIONS.find(v => v.id === ctx.session.wizardData.voiceSettings.voiceId)?.name}</b>\n` +
            `🌍 Язык: <b>${LANGUAGES.find(l => l.id === ctx.session.wizardData.voiceSettings.language)?.name}</b>\n` +
            `😊 Эмоция: <b>${EMOTIONS.find(e => e.id === ctx.session.wizardData.voiceSettings.emotion)?.name}</b>\n\n` +
            `📋 <b>Конфигурация:</b>\n` +
            `<code>${result.config}</code>\n\n` +
            `🎙️ Теперь аватар может говорить!`
          );
        } else {
          throw new Error(result.error || 'Voice configuration failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Voice configuration error:', error);
        await ctx.reply(
          `❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте еще раз.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
