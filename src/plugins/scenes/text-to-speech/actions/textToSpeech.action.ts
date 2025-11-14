/**
 * Text to Speech Action
 * Starts the TTS conversion wizard
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

export const textToSpeechAction: Action = {
  name: 'TEXT_TO_SPEECH',
  description: 'Преобразует текст в речь',
  similes: [
    'ТЕКСТ_В_РЕЧЬ',
    'ОЗВУЧИТЬ',
    'TTS',
    '/tts',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Озвучь этот текст',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Преобразую в речь...',
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
      text.includes('озвучь') ||
      text.includes('текст в речь') ||
      text.includes('озвучить') ||
      text.includes('/tts')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('🎙️ Text to Speech action triggered');

      await callback({
        text: `🎙️ <b>Текст в Речь</b>\n\n` +
              `Преобразую ваш текст в аудио:\n\n` +
              `📝 <b>6 голосов:</b>\n` +
              `• Alloy - нейтральный\n` +
              `• Echo - глубокий мужской\n` +
              `• Fable - британский\n` +
              `• Onyx - громкий\n` +
              `• Nova - мягкий женский\n` +
              `• Shimmer - звонкий\n\n` +
              `🎵 <b>Отправьте текст для озвучивания</b>`,
      });

    } catch (error) {
      logger.error('❌ Text to Speech action error:', error);
      callback({
        text: '❌ Ошибка при запуске TTS',
      });
    }
  },
};
