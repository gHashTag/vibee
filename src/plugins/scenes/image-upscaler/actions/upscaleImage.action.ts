/**
 * Upscale Image Action
 * Starts the image upscaling wizard
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

export const upscaleImageAction: Action = {
  name: 'UPSCALE_IMAGE',
  description: 'Увеличивает разрешение изображений',
  similes: [
    'УВЕЛИЧИТЬ_КАРТИНКУ',
    'АПСКЕЙЛ',
    'УЛУЧШИТЬ',
    '/upscale',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Улучши качество этого изображения',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю улучшение...',
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
      text.includes('увеличить') ||
      text.includes('улучшить') ||
      text.includes('апскейл') ||
      text.includes('/upscale')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('⬆️ Upscale Image action triggered');

      await callback({
        text: `⬆️ <b>Улучшение Изображений</b>\n\n` +
              `Увеличу разрешение и качество:\n\n` +
              `📸 <b>Возможности:</b>\n` +
              `• Увеличение до 8x\n` +
              `• 4 AI модели\n` +
              `• Удаление шумов\n` +
              `• Повышение резкости\n` +
              `• Цветокоррекция\n\n` +
              `📷 <b>Отправьте изображение для улучшения</b>`,
      });

    } catch (error) {
      logger.error('❌ Upscale Image action error:', error);
      callback({
        text: '❌ Ошибка при запуске улучшения',
      });
    }
  },
};
