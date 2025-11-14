/**
 * Generate Image Action
 * Starts the NeuroPhoto Scene wizard
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

export const generateImageAction: Action = {
  name: 'GENERATE_IMAGE',
  description: 'Запускает генерацию изображений с помощью AI',
  similes: [
    'СГЕНЕРИРОВАТЬ_ИЗОБРАЖЕНИЕ',
    'СОЗДАТЬ_КАРТИНКУ',
    'НАРИСУЙ',
    'GENERATE_IMAGE',
    'NEUROPHOTO',
    '/neurophoto',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Нарисуй кота в космосе',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю генерацию изображения...',
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
      text.includes('сгенерируй') ||
      text.includes('нарисуй') ||
      text.includes('создай картинку') ||
      text.includes('/neurophoto')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      const text = message.content?.text || '';
      logger.info(`🎨 NeuroPhoto action triggered with text: "${text}"`);

      // Get Telegram bot from context
      const bot = runtime.getService('telegram')?.bot;
      if (!bot) {
        logger.error('❌ Telegram bot not found');
        callback({
          text: '❌ Ошибка: Telegram бот не найден',
        });
        return;
      }

      // Generate unique scene ID based on user
      const userId = message.userId;
      const sceneId = `neurophoto-${userId}`;

      // Store pending generation request
      await runtime.setMemory({
        id: `neurophoto-${Date.now()}`,
        userId,
        content: {
          text: `Начало генерации изображения: "${text}"`,
          prompt: text,
        },
        createdAt: Date.now(),
      });

      // Send welcome message with instruction
      await callback({
        text: `🎨 <b>Нейро-Фото Генератор</b>\n\n` +
              `Начинаю создание изображения для запроса:\n` +
              `<i>"${text}"</i>\n\n` +
              `Пожалуйста, выберите модель для генерации:`,
      });

      // Scene will be handled by Scene plugin
      // User will be redirected to model selection

    } catch (error) {
      logger.error('❌ NeuroPhoto action error:', error);
      callback({
        text: '❌ Ошибка при запуске генерации изображения',
      });
    }
  },
};
