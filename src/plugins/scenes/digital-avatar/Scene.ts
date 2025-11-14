/**
 * Digital Avatar Wizard Scene
 * Multi-step wizard for creating digital avatar
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { DigitalAvatarService } from './services/avatarService';
import {
  GENDER_OPTIONS,
  AGE_RANGES,
  AVATAR_STYLES,
  BACKGROUND_OPTIONS,
  type DigitalAvatarContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
}

export const createDigitalAvatarScene = () => {
  const avatarService = new DigitalAvatarService();

  return new Scenes.WizardScene<MyContext>(
    'digitalAvatarWizard',

    // Step 1: Photo Upload
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Photo Upload');

      ctx.session.wizardData = {
        step: 'photos',
        photos: [],
        avatarSettings: {},
      } as DigitalAvatarContext;

      await ctx.reply(
        `📸 <b>Шаг 1: Загрузка фотографий</b>\n\n` +
        `Отправьте 1-5 фотографий себя для создания аватара:\n\n` +
        `• Фото в хорошем качестве\n` +
        `• Лицо должно быть четко видно\n` +
        `• Разные ракурсы приветствуются\n\n` +
        `После загрузки нажмите "Готово"`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Готово', 'photos_done')],
        ]).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Gender Selection
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Gender Selection');

      // Check if user clicked "Done" or sent photos
      if (ctx.update?.callback_query?.data === 'photos_done') {
        // User has uploaded photos
      } else if (ctx.message?.photo) {
        // Photo was sent - add to session
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        ctx.session.wizardData.photos.push(
          `https://api.telegram.org/file/bot${ctx.bot.bot.token}/${photo.file_id}`
        );
      }

      const genderButtons = GENDER_OPTIONS.map((option) => [
        Markup.button.callback(
          `${option.emoji} ${option.name}`,
          `gender_${option.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Фотографии загружены: <b>${ctx.session.wizardData.photos.length}</b>\n\n` +
        `👤 <b>Шаг 2: Выберите пол</b>\n\n` +
        `Это поможет создать более точный аватар`,
        Markup.inlineKeyboard(genderButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Age Selection
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Age Selection');

      if (ctx.update?.callback_query?.data) {
        const genderId = ctx.update.callback_query.data.replace('gender_', '');
        ctx.session.wizardData.avatarSettings.gender = genderId;
      }

      const ageButtons = AGE_RANGES.map((option) => [
        Markup.button.callback(
          `${option.emoji} ${option.name}`,
          `age_${option.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Пол выбран: <b>${GENDER_OPTIONS.find(g => g.id === ctx.session.wizardData.avatarSettings.gender)?.name}</b>\n\n` +
        `🧓 <b>Шаг 3: Возрастная категория</b>\n\n` +
        `Выберите подходящий возрастной диапазон`,
        Markup.inlineKeyboard(ageButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Style Selection
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Style Selection');

      if (ctx.update?.callback_query?.data) {
        const ageId = ctx.update.callback_query.data.replace('age_', '');
        ctx.session.wizardData.avatarSettings.age = ageId;
      }

      const styleButtons = AVATAR_STYLES.map((style) => [
        Markup.button.callback(
          `${style.emoji} ${style.name}`,
          `style_${style.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Возраст: <b>${AGE_RANGES.find(a => a.id === ctx.session.wizardData.avatarSettings.age)?.name}</b>\n\n` +
        `🎨 <b>Шаг 4: Стиль аватара</b>\n\n` +
        `Выберите визуальный стиль для вашего аватара:\n\n` +
        `${AVATAR_STYLES.map(s => `• ${s.emoji} ${s.name}: ${s.description}`).join('\n')}`,
        Markup.inlineKeyboard(styleButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 5: Background Selection
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Background Selection');

      if (ctx.update?.callback_query?.data) {
        const styleId = ctx.update.callback_query.data.replace('style_', '');
        ctx.session.wizardData.avatarSettings.style = styleId;
      }

      const backgroundButtons = BACKGROUND_OPTIONS.map((bg) => [
        Markup.button.callback(
          `${bg.emoji} ${bg.name}`,
          `bg_${bg.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Стиль: <b>${AVATAR_STYLES.find(s => s.id === ctx.session.wizardData.avatarSettings.style)?.name}</b>\n\n` +
        `🖼️ <b>Шаг 5: Фон</b>\n\n` +
        `Выберите фон для аватара`,
        Markup.inlineKeyboard(backgroundButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 6: Avatar Creation
    async (ctx: MyContext) => {
      logger.info('🤖 Digital Avatar Scene: Creation');

      if (ctx.update?.callback_query?.data) {
        const bgId = ctx.update.callback_query.data.replace('bg_', '');
        ctx.session.wizardData.avatarSettings.background = bgId;
      }

      // Send progress
      await ctx.reply(
        `⏳ <b>Создаю ваш цифровой аватар...</b>\n\n` +
        `Это может занять 30-60 секунд\n` +
        `Обрабатываю ${ctx.session.wizardData.photos.length} фотографий...`
      );

      try {
        const result = await avatarService.createAvatar(
          ctx.bot.context.runtime,
          ctx.session.wizardData.photos,
          ctx.session.wizardData.avatarSettings
        );

        if (result.success && result.avatarUrl) {
          const selectedStyle = AVATAR_STYLES.find(
            (s) => s.id === ctx.session.wizardData.avatarSettings.style
          );

          await ctx.replyWithPhoto(result.avatarUrl, {
            caption: `✨ <b>Ваш цифровой аватар готов!</b>\n\n` +
                    `🎨 Стиль: ${selectedStyle?.name}\n` +
                    `👤 Пол: ${GENDER_OPTIONS.find(g => g.id === ctx.session.wizardData.avatarSettings.gender)?.name}\n` +
                    `🧓 Возраст: ${AGE_RANGES.find(a => a.id === ctx.session.wizardData.avatarSettings.age)?.name}\n` +
                    `🖼️ Фон: ${BACKGROUND_OPTIONS.find(b => b.id === ctx.session.wizardData.avatarSettings.background)?.name}\n\n` +
                    `Используйте аватар в профиле, соцсетях или где угодно! 🚀`,
            parseMode: 'HTML',
          });
        } else {
          throw new Error(result.error || 'Avatar creation failed');
        }

        return ctx.scene.leave();
      } catch (error) {
        logger.error('❌ Avatar creation error:', error);
        await ctx.reply(
          `❌ Ошибка создания аватара: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `Попробуйте еще раз с другими параметрами.`
        );
        return ctx.scene.leave();
      }
    }
  );
};
