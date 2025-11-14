/**
 * Create Digital Avatar Action
 * Starts the avatar creation wizard
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

export const createDigitalAvatarAction: Action = {
  name: 'CREATE_DIGITAL_AVATAR',
  description: 'Создает цифровой аватар из фотографий',
  similes: [
    'СОЗДАТЬ_АВАТАР',
    'ЦИФРОВОЙ_ДВОЙНИК',
    'СОЗДАЙ_МЕНЯ',
    'CREATE_AVATAR',
    'DIGITAL_AVATAR',
    '/avatar',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Создай мой цифровой аватар',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Отлично! Запускаю создание цифрового аватара...',
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
      text.includes('создать аватар') ||
      text.includes('цифровой') ||
      text.includes('аватар') ||
      text.includes('/avatar')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('🤖 Digital Avatar action triggered');

      const text = message.content?.text || '';
      await callback({
        text: `🤖 <b>Цифровой Аватар</b>\n\n` +
              `Запускаю создание вашего цифрового двойника!\n\n` +
              `📸 <b>Шаг 1: Загрузка фотографий</b>\n` +
              `Отправьте 1-5 фотографий себя (желательно в высоком качестве)`,
      });

    } catch (error) {
      logger.error('❌ Digital Avatar action error:', error);
      callback({
        text: '❌ Ошибка при запуске создания аватара',
      });
    }
  },
};
