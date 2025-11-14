/**
 * Analyze Image to Prompt Action
 * Starts the image analysis wizard
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

export const imageToPromptAction: Action = {
  name: 'IMAGE_TO_PROMPT',
  description: 'Анализирует изображение и создает промпт',
  similes: [
    'АНАЛИЗ_ИЗОБРАЖЕНИЯ',
    'ПРОМПТ_ИЗ_КАРТИНКИ',
    'ЧТО_НА_КАРТИНКЕ',
    'IMAGE_ANALYSIS',
    'IMAGE_TO_PROMPT',
    '/analyze',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Что на этой картинке?',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Анализирую изображение...',
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
      text.includes('что на') ||
      text.includes('анализируй') ||
      text.includes('опиши') ||
      text.includes('промпт') ||
      text.includes('/analyze')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('🔍 Image to Prompt action triggered');

      await callback({
        text: `🔍 <b>Анализ Изображения</b>\n\n` +
              `Отправьте изображение для анализа и создания промпта:\n\n` +
              `📷 <b>Что я умею:</b>\n` +
              `• Описать содержимое картинки\n` +
              `• Определить стиль и настроение\n` +
              `• Создать промпт для AI\n` +
              `• Проанализировать композицию`,
      });

    } catch (error) {
      logger.error('❌ Image to Prompt action error:', error);
      callback({
        text: '❌ Ошибка при анализе изображения',
      });
    }
  },
};
