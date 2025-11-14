/**
 * Create Avatar Brain Action
 * Starts the brain creation wizard
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

export const createAvatarBrainAction: Action = {
  name: 'CREATE_AVATAR_BRAIN',
  description: 'Создает "мозг" аватара с личностью и знаниями',
  similes: [
    'СОЗДАТЬ_МОЗГ',
    'ЛИЧНОСТЬ_АВАТАРА',
    'ИИ_МОЗГ',
    'CREATE_BRAIN',
    'AVATAR_BRAIN',
    '/brain',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Создай мозг для моего аватара',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю создание мозга аватара...',
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
      text.includes('создать мозг') ||
      text.includes('личность') ||
      text.includes('мозг аватара') ||
      text.includes('/brain')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('🧠 Avatar Brain action triggered');

      await callback({
        text: `🧠 <b>Создание Мозга Аватара</b>\n\n` +
              `Запускаю настройку личности и знаний:\n\n` +
              `🎭 <b>Что настроим:</b>\n` +
              `• Черты характера\n` +
              `• Стиль общения\n` +
              `• Области экспертизы\n` +
              `• Интересы и знания\n` +
              `• Паттерны поведения`,
      });

    } catch (error) {
      logger.error('❌ Avatar Brain action error:', error);
      callback({
        text: '❌ Ошибка при создании мозга',
      });
    }
  },
};
