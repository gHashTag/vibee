/**
 * Avatar Brain Wizard Scene
 * Multi-step wizard for creating AI personality
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { AvatarBrainService } from './services/brainService';
import {
  PERSONALITY_TRAITS,
  SPEAKING_STYLES,
  EXPERTISE_AREAS,
  INTERESTS,
  type AvatarBrainContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createAvatarBrainScene = () => {
  const brainService = new AvatarBrainService();

  return new Scenes.WizardScene<MyContext>(
    'avatarBrainWizard',

    // Step 1: Avatar ID
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Avatar ID');

      ctx.session.wizardData = {
        step: 'id',
        avatarId: '',
        personality: {
          traits: [],
          background: '',
          speakingStyle: '',
          expertise: [],
        },
        knowledge: {
          interests: [],
          specialties: [],
          experiences: [],
        },
      } as AvatarBrainContext;

      await ctx.reply(
        `🧠 <b>Создание Мозга Аватара</b>\n\n` +
        `📝 <b>Шаг 1: ID аватара</b>\n\n` +
        `Введите уникальный идентификатор аватара:\n` +
        `(например: my_avatar, assistant_01, alice_bot)`,
      );

      return ctx.wizard.next();
    },

    // Step 2: Personality Traits
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Personality Traits');

      if (ctx.message?.text) {
        ctx.session.wizardData.avatarId = ctx.message.text.trim();
      }

      const traitButtons = PERSONALITY_TRAITS.map((trait, index) => [
        Markup.button.callback(
          `${trait.emoji} ${trait.name}`,
          `trait_${trait.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Avatar ID: <b>${ctx.session.wizardData.avatarId}</b>\n\n` +
        `🎭 <b>Шаг 2: Черты характера</b>\n\n` +
        `Выберите до 5 черт личности (нажмите несколько кнопок):\n\n` +
        `${PERSONALITY_TRAITS.map(t => `• ${t.emoji} <b>${t.name}</b>: ${t.description}`).join('\n')}\n\n` +
        `Нажмите "Далее" когда выберете черты`,
        Markup.inlineKeyboard([
          ...traitButtons,
          [Markup.button.callback('➡️ Далее', 'next')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Background
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Background');

      if (ctx.update?.callback_query?.data?.startsWith('trait_')) {
        const traitId = ctx.update.callback_query.data.replace('trait_', '');
        const selectedTraits = ctx.session.wizardData.personality.traits || [];

        if (selectedTraits.includes(traitId)) {
          // Remove trait
          ctx.session.wizardData.personality.traits = selectedTraits.filter(
            (t: string) => t !== traitId
          );
        } else {
          // Add trait
          if (selectedTraits.length < 5) {
            ctx.session.wizardData.personality.traits = [...selectedTraits, traitId];
          }
        }

        // Re-render traits
        const selectedCount = ctx.session.wizardData.personality.traits.length;
        const selectedList = ctx.session.wizardData.personality.traits
          .map((t: string) => PERSONALITY_TRAITS.find(p => p.id === t)?.name)
          .join(', ');

        await ctx.editMessageText(
          `✅ Avatar ID: <b>${ctx.session.wizardData.avatarId}</b>\n\n` +
          `🎭 <b>Шаг 2: Черты характера</b>\n\n` +
          `Выбрано: <b>${selectedCount}/5</b>\n` +
          `${selectedList || 'Ничего не выбрано'}\n\n` +
          `Выберите до 5 черт личности:`,
          Markup.inlineKeyboard([
            ...PERSONALITY_TRAITS.map((trait) => [
              Markup.button.callback(
                `${trait.emoji} ${trait.name}`,
                `trait_${trait.id}`
              ),
            ]),
            [Markup.button.callback('➡️ Далее', 'next')],
          ]).parseMarkup()
        );

        return;
      }

      if (ctx.update?.callback_query?.data === 'next') {
        // Move to next step
      }

      return ctx.wizard.next();
    },

    // Step 4: Speaking Style
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Speaking Style');

      const styleButtons = SPEAKING_STYLES.map((style) => [
        Markup.button.callback(
          `${style.emoji} ${style.name}`,
          `style_${style.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Черты: <b>${ctx.session.wizardData.personality.traits
          .map((t: string) => PERSONALITY_TRAITS.find(p => p.id === t)?.name)
          .join(', ')}</b>\n\n` +
        `💬 <b>Шаг 3: Стиль общения</b>\n\n` +
        `Выберите, как аватар будет общаться:`,
        Markup.inlineKeyboard(styleButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 5: Expertise
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Expertise');

      if (ctx.update?.callback_query?.data) {
        const styleId = ctx.update.callback_query.data.replace('style_', '');
        ctx.session.wizardData.personality.speakingStyle = styleId;
      }

      const expertiseButtons = EXPERTISE_AREAS.map((area) => [
        Markup.button.callback(
          `${area.emoji} ${area.name}`,
          `expertise_${area.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Стиль: <b>${SPEAKING_STYLES.find(s => s.id === ctx.session.wizardData.personality.speakingStyle)?.name}</b>\n\n` +
        `🎓 <b>Шаг 4: Экспертиза</b>\n\n` +
        `Выберите области знаний (до 5):\n\n` +
        `${EXPERTISE_AREAS.map(e => `• ${e.emoji} ${e.name}`).join('\n')}\n\n` +
        `Нажмите "Далее" когда выберете`,
        Markup.inlineKeyboard([
          ...expertiseButtons,
          [Markup.button.callback('➡️ Далее', 'next')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 6: Interests
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Interests');

      if (ctx.update?.callback_query?.data?.startsWith('expertise_')) {
        const expertiseId = ctx.update.callback_query.data.replace('expertise_', '');
        const selectedExpertise = ctx.session.wizardData.personality.expertise || [];

        if (selectedExpertise.includes(expertiseId)) {
          ctx.session.wizardData.personality.expertise = selectedExpertise.filter(
            (e: string) => e !== expertiseId
          );
        } else {
          if (selectedExpertise.length < 5) {
            ctx.session.wizardData.personality.expertise = [...selectedExpertise, expertiseId];
          }
        }

        const count = ctx.session.wizardData.personality.expertise.length;
        await ctx.editMessageText(
          `✅ Стиль: <b>${SPEAKING_STYLES.find(s => s.id === ctx.session.wizardData.personality.speakingStyle)?.name}</b>\n\n` +
          `🎓 <b>Шаг 4: Экспертиза</b>\n\n` +
          `Выбрано: <b>${count}/5</b>\n\n` +
          `Выберите области знаний:`,
          Markup.inlineKeyboard([
            ...EXPERTISE_AREAS.map((area) => [
              Markup.button.callback(
                `${area.emoji} ${area.name}`,
                `expertise_${area.id}`
              ),
            ]),
            [Markup.button.callback('➡️ Далее', 'next')],
          ]).parseMarkup()
        );

        return;
      }

      const interestButtons = INTERESTS.map((interest) => [
        Markup.button.callback(
          `${interest.emoji} ${interest.name}`,
          `interest_${interest.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Экспертиза: <b>${ctx.session.wizardData.personality.expertise
          .map((e: string) => EXPERTISE_AREAS.find(p => p.id === e)?.name)
          .join(', ')}</b>\n\n` +
        `❤️ <b>Шаг 5: Интересы</b>\n\n` +
        `Выберите интересы (до 7):\n\n` +
        `${INTERESTS.map(i => `• ${i.emoji} ${i.name}`).join('\n')}\n\n` +
        `Нажмите "Создать" когда выберете`,
        Markup.inlineKeyboard([
          ...interestButtons,
          [Markup.button.callback('⚙️ Создать мозг', 'create')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 7: Create Brain
    async (ctx: MyContext) => {
      logger.info('🧠 Avatar Brain Scene: Create');

      if (ctx.update?.callback_query?.data?.startsWith('interest_')) {
        const interestId = ctx.update.callback_query.data.replace('interest_', '');
        const selectedInterests = ctx.session.wizardData.knowledge.interests || [];

        if (selectedInterests.includes(interestId)) {
          ctx.session.wizardData.knowledge.interests = selectedInterests.filter(
            (i: string) => i !== interestId
          );
        } else {
          if (selectedInterests.length < 7) {
            ctx.session.wizardData.knowledge.interests = [...selectedInterests, interestId];
          }
        }

        const count = ctx.session.wizardData.knowledge.interests.length;
        await ctx.editMessageText(
          `✅ Экспертиза: <b>${ctx.session.wizardData.personality.expertise
            .map((e: string) => EXPERTISE_AREAS.find(p => p.id === e)?.name)
            .join(', ')}</b>\n\n` +
          `❤️ <b>Шаг 5: Интересы</b>\n\n` +
          `Выбрано: <b>${count}/7</b>\n\n` +
          `Выберите интересы:`,
          Markup.inlineKeyboard([
            ...INTERESTS.map((interest) => [
              Markup.button.callback(
                `${interest.emoji} ${interest.name}`,
                `interest_${interest.id}`
              ),
            ]),
            [Markup.button.callback('⚙️ Создать мозг', 'create')],
          ]).parseMarkup()
        );

        return;
      }

      await ctx.reply('⏳ Создаю мозг аватара...');

      try {
        const result = await brainService.createBrain(
          ctx.bot.context.runtime,
          ctx.session.wizardData.avatarId,
          ctx.session.wizardData.personality,
          ctx.session.wizardData.knowledge
        );

        if (result.success && result.brainConfig) {
          ctx.session.wizardData.brainConfig = result.brainConfig;

          await ctx.reply(
            `✨ <b>Мозг аватара создан!</b>\n\n` +
            `🆔 ID: <b>${ctx.session.wizardData.avatarId}</b>\n` +
            `🎭 Черты: <b>${ctx.session.wizardData.personality.traits.length}</b>\n` +
            `💬 Стиль: <b>${SPEAKING_STYLES.find(s => s.id === ctx.session.wizardData.personality.speakingStyle)?.name}</b>\n` +
            `🎓 Экспертиза: <b>${ctx.session.wizardData.personality.expertise.length}</b>\n` +
            `❤️ Интересы: <b>${ctx.session.wizardData.knowledge.interests.length}</b>\n\n` +
            `📝 <b>Конфигурация:</b>\n` +
            `<code>${result.brainConfig}</code>\n\n` +
            `🚀 Сохраните конфигурацию для использования с аватаром!`
          );
        } else {
          throw new Error(result.error || 'Brain creation failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Brain creation error:', error);
        await ctx.reply(
          `❌ Ошибка создания мозга: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте еще раз.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
