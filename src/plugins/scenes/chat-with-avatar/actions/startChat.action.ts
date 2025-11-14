/**
 * Start Chat with Avatar Action
 * Initiates the chat interface
 */

import {
  Action,
  ActionExample,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  logger,
} from '@elizaos/core';

export const chatWithAvatarAction: Action = {
  name: 'CHAT_WITH_AVATAR',
  description: 'Начинает чат с AI-аватаром',
  similes: [
    'ЧАТ_С_АВАТАРОМ',
    'ПОГОВОРИТЬ',
    'ОБЩЕНИЕ',
    'CHAT',
    '/chat',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Поговорим с аватаром',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю чат...',
        },
      },
    ],
  ] as ActionExample[],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return (
      text.includes('поговорим') ||
      text.includes('чат') ||
      text.includes('общение') ||
      text.includes('/chat')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('💬 Chat with Avatar action triggered');

      await callback({
        text: `💬 <b>Чат с Аватаром</b>\n\n` +
              `Выберите аватара для общения:\n\n` +
              `🤖 <b>Доступные аватары:</b>\n` +
              `• MyAssistant - Универсальный помощник\n` +
              `• CreativeBot - Креативный советчик\n` +
              `• TechGuru - Технический эксперт\n` +
              `• FriendBot - Друг для общения\n\n` +
              `Или введите ID вашего аватара:`,
      });

    } catch (error) {
      logger.error('❌ Chat action error:', error);
      callback({
        text: '❌ Ошибка при запуске чата',
      });
    }
  },
};
