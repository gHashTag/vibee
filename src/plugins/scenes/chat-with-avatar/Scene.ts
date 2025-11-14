/**
 * Chat with Avatar Wizard Scene
 * Multi-step setup and interactive chat
 */

import { Markup, Scenes } from 'telegraf';
import type { Context } from 'telegraf';
import { logger } from '@elizaos/core';
import { ChatService } from './services/chatService';
import {
  CHAT_MODES,
  TEMPERATURE_OPTIONS,
  QUICK_QUESTIONS,
  type ChatContext,
} from './types';

interface MyContext extends Context {
  scene: any;
  wizard: any;
  session: any;
  reply: any;
}

export const createChatWithAvatarScene = () => {
  const chatService = new ChatService();

  return new Scenes.WizardScene<MyContext>(
    'chatWithAvatarWizard',

    // Step 1: Avatar Selection
    async (ctx: MyContext) => {
      logger.info('💬 Chat with Avatar Scene: Avatar Selection');

      ctx.session.wizardData = {
        step: 'avatar',
        avatarId: '',
        conversation: {
          messages: [],
          settings: {
            avatarName: '',
            personality: '',
            mode: 'friendly',
            temperature: 0.5,
          },
        },
        active: false,
      } as ChatContext;

      const avatarButtons = [
        [Markup.button.callback('🤖 MyAssistant', 'avatar_MyAssistant')],
        [Markup.button.callback('🎨 CreativeBot', 'avatar_CreativeBot')],
        [Markup.button.callback('💻 TechGuru', 'avatar_TechGuru')],
        [Markup.button.callback('😊 FriendBot', 'avatar_FriendBot')],
        [Markup.button.callback('✏️ Свой ID', 'avatar_custom')],
      ];

      await ctx.reply(
        `💬 <b>Чат с Аватаром</b>\n\n` +
        `🤖 <b>Шаг 1: Выбор аватара</b>\n\n` +
        `Выберите аватара для общения:`,
        Markup.inlineKeyboard(avatarButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 2: Chat Mode
    async (ctx: MyContext) => {
      logger.info('💬 Chat with Avatar Scene: Mode');

      if (ctx.update?.callback_query?.data?.startsWith('avatar_')) {
        const avatarId = ctx.update.callback_query.data.replace('avatar_', '');
        if (avatarId === 'custom') {
          await ctx.reply('Введите ID вашего аватара:');
          return ctx.wizard.next();
        }
        ctx.session.wizardData.avatarId = avatarId;
      } else if (ctx.message?.text) {
        ctx.session.wizardData.avatarId = ctx.message.text.trim();
      }

      if (!ctx.session.wizardData.avatarId) {
        // Try to get from callback
        const queryData = ctx.update?.callback_query?.data || '';
        const match = queryData.match(/avatar_(.+)/);
        if (match) {
          ctx.session.wizardData.avatarId = match[1];
        }
      }

      const modeButtons = CHAT_MODES.map((mode) => [
        Markup.button.callback(
          `${mode.emoji} ${mode.name}`,
          `mode_${mode.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Аватар: <b>${ctx.session.wizardData.avatarId}</b>\n\n` +
        `🎭 <b>Шаг 2: Режим общения</b>\n\n` +
        `Выберите стиль беседы:`,
        Markup.inlineKeyboard(modeButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 3: Temperature
    async (ctx: MyContext) => {
      logger.info('💬 Chat with Avatar Scene: Temperature');

      if (ctx.update?.callback_query?.data?.startsWith('mode_')) {
        const modeId = ctx.update.callback_query.data.replace('mode_', '');
        ctx.session.wizardData.conversation.settings.mode = modeId;
      }

      const tempButtons = TEMPERATURE_OPTIONS.map((temp) => [
        Markup.button.callback(
          `${temp.emoji} ${temp.name}`,
          `temp_${temp.id}`
        ),
      ]);

      await ctx.reply(
        `✅ Аватар: <b>${ctx.session.wizardData.avatarId}</b>\n` +
        `🎭 Режим: <b>${CHAT_MODES.find(m => m.id === ctx.session.wizardData.conversation.settings.mode)?.name}</b>\n\n` +
        `🌡️ <b>Шаг 3: Творчество</b>\n\n` +
        `Выберите уровень креативности:\n` +
        `• Точный - последовательные ответы\n` +
        `• Сбалансированный - золотая середина\n` +
        `• Креативный - нестандартные идеи\n` +
        `• Хаотичный - максимальная свобода`,
        Markup.inlineKeyboard(tempButtons).parseMarkup()
      );

      return ctx.wizard.next();
    },

    // Step 4: Start Chat
    async (ctx: MyContext) => {
      logger.info('💬 Chat with Avatar Scene: Start');

      if (ctx.update?.callback_query?.data?.startsWith('temp_')) {
        const tempId = ctx.update.callback_query.data.replace('temp_', '');
        const tempOption = TEMPERATURE_OPTIONS.find((t) => t.id === tempId);
        if (tempOption) {
          ctx.session.wizardData.conversation.settings.temperature = tempOption.value;
        }
      }

      // Load brain config
      const brainResult = await chatService.loadBrainConfig(
        ctx.bot.context.runtime,
        ctx.session.wizardData.avatarId
      );

      if (brainResult.success && brainResult.config) {
        try {
          const config = JSON.parse(brainResult.config);
          ctx.session.wizardData.conversation.settings.avatarName = config.name || ctx.session.wizardData.avatarId;
          ctx.session.wizardData.conversation.settings.personality = config.personality || 'Дружелюбный';
          ctx.session.wizardData.brainConfig = brainResult.config;
        } catch (e) {
          // Use defaults
          ctx.session.wizardData.conversation.settings.avatarName = ctx.session.wizardData.avatarId;
          ctx.session.wizardData.conversation.settings.personality = 'Дружелюбный';
        }
      }

      ctx.session.wizardData.active = true;

      const quickButtons = QUICK_QUESTIONS.map((q, i) => [
        Markup.button.callback(`${i + 1}. ${q}`, `quick_${i}`),
      ]);
      quickButtons.push([
        Markup.button.callback('❌ Выйти', 'exit'),
      ]);

      await ctx.reply(
        `✨ <b>Чат начат!</b>\n\n` +
        `🤖 <b>${ctx.session.wizardData.conversation.settings.avatarName}</b>\n` +
        `🎭 Режим: <b>${CHAT_MODES.find(m => m.id === ctx.session.wizardData.conversation.settings.mode)?.name}</b>\n` +
        `🌡️ Креативность: <b>${TEMPERATURE_OPTIONS.find(t => t.value === ctx.session.wizardData.conversation.settings.temperature)?.name}</b>\n\n` +
        `💬 <b>Напишите сообщение или выберите вопрос:</b>`,
        Markup.inlineKeyboard(quickButtons).parseMarkup()
      );

      // Stay in this step for ongoing chat
      return;
    },

    // Handle chat messages
    async (ctx: MyContext) => {
      logger.info('💬 Chat with Avatar: Message');

      if (!ctx.session.wizardData.active) {
        return;
      }

      // Handle quick questions
      if (ctx.update?.callback_query?.data?.startsWith('quick_')) {
        const index = parseInt(ctx.update.callback_query.data.replace('quick_', ''));
        const question = QUICK_QUESTIONS[index];

        // Add user message
        ctx.session.wizardData.conversation.messages.push({
          role: 'user',
          content: question,
          timestamp: Date.now(),
        });

        // Get response
        await ctx.reply('⏳ Аватар печатает...');

        const response = await chatService.sendMessage(
          ctx.bot.context.runtime,
          ctx.session.wizardData.avatarId,
          question,
          ctx.session.wizardData.conversation.messages,
          ctx.session.wizardData.conversation.settings
        );

        if (response.success && response.response) {
          // Add assistant response
          ctx.session.wizardData.conversation.messages.push({
            role: 'assistant',
            content: response.response,
            timestamp: Date.now(),
          });

          // Show response
          await ctx.reply(
            `🤖 <b>${ctx.session.wizardData.conversation.settings.avatarName}:</b>\n\n${response.response}`
          );

          // Re-show keyboard
          const quickButtons = QUICK_QUESTIONS.map((q, i) => [
            Markup.button.callback(`${i + 1}. ${q}`, `quick_${i}`),
          ]);
          quickButtons.push([
            Markup.button.callback('❌ Выйти', 'exit'),
          ]);

          await ctx.reply(
            `💬 <b>Продолжайте диалог:</b>`,
            Markup.inlineKeyboard(quickButtons).parseMarkup()
          );
        } else {
          await ctx.reply(
            `❌ Ошибка: ${response.error || 'Не удалось получить ответ'}\nПопробуйте еще раз.`
          );
        }

        return;
      }

      // Handle exit
      if (ctx.update?.callback_query?.data === 'exit') {
        await ctx.reply('👋 До свидания!');
        return ctx.scene.leave();
      }

      // Handle text message
      if (ctx.message?.text) {
        const userMessage = ctx.message.text;

        // Add user message
        ctx.session.wizardData.conversation.messages.push({
          role: 'user',
          content: userMessage,
          timestamp: Date.now(),
        });

        await ctx.reply('⏳ Аватар печатает...');

        const response = await chatService.sendMessage(
          ctx.bot.context.runtime,
          ctx.session.wizardData.avatarId,
          userMessage,
          ctx.session.wizardData.conversation.messages,
          ctx.session.wizardData.conversation.settings
        );

        if (response.success && response.response) {
          // Add assistant response
          ctx.session.wizardData.conversation.messages.push({
            role: 'assistant',
            content: response.response,
            timestamp: Date.now(),
          });

          // Show response
          await ctx.reply(
            `🤖 <b>${ctx.session.wizardData.conversation.settings.avatarName}:</b>\n\n${response.response}`
          );

          // Re-show keyboard
          const quickButtons = QUICK_QUESTIONS.map((q, i) => [
            Markup.button.callback(`${i + 1}. ${q}`, `quick_${i}`),
          ]);
          quickButtons.push([
            Markup.button.callback('❌ Выйти', 'exit'),
          ]);

          await ctx.reply(
            `💬 <b>Продолжайте диалог:</b>`,
            Markup.inlineKeyboard(quickButtons).parseMarkup()
          );
        } else {
          await ctx.reply(
            `❌ Ошибка: ${response.error || 'Не удалось получить ответ'}\nПопробуйте еще раз.`
          );
        }

        return;
      }
    }
  );
};
