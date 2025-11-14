/**
 * Configure Avatar Voice Action
 * Starts the voice configuration wizard
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

export const configureAvatarVoiceAction: Action = {
  name: 'CONFIGURE_AVATAR_VOICE',
  description: 'Настраивает голос для аватара',
  similes: [
    'ГОЛОС_АВАТАРА',
    'ГОЛОС',
    'TTS',
    '/voice',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Настрой голос для аватара',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю настройку голоса...',
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
      text.includes('голос') ||
      text.includes('настрой') ||
      text.includes('/voice')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('🎤 Configure Avatar Voice action triggered');

      await callback({
        text: `🎤 <b>Настройка Голоса Аватара</b>\n\n` +
              `Выберите голос для вашего аватара:\n\n` +
              `🎭 <b>6 голосов на выбор:</b>\n` +
              `• Alloy - нейтральный\n` +
              `• Echo - глубокий мужской\n` +
              `• Fable - британский акцент\n` +
              `• Onyx - громкий и четкий\n` +
              `• Nova - мягкий женский\n` +
              `• Shimmer - звонкий женский\n\n` +
              `💬 Поддерживаемые языки: Русский, English`,
      });

    } catch (error) {
      logger.error('❌ Configure Avatar Voice action error:', error);
      callback({
        text: '❌ Ошибка при настройке голоса',
      });
    }
  },
};
