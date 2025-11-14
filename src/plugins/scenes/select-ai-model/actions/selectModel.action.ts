/**
 * Select AI Model Action
 * Starts the model selection wizard
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

export const selectAIModelAction: Action = {
  name: 'SELECT_AI_MODEL',
  description: 'Выбирает AI модель для задач',
  similes: [
    'ВЫБРАТЬ_МОДЕЛЬ',
    'МОДЕЛЬ_ИИ',
    'SELECT_MODEL',
    '/models',
  ],

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Выбери мне AI модель',
        },
      },
      {
        user: 'assistant',
        content: {
          text: 'Запускаю подбор модели...',
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
      text.includes('модель') ||
      text.includes('выбери') ||
      text.includes('/models')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    callback: HandlerCallback
  ): Promise<void> => {
    try {
      logger.info('⚙️ Select AI Model action triggered');

      await callback({
        text: `⚙️ <b>Выбор AI Модели</b>\n\n` +
              `Подберу лучшую модель для ваших задач:\n\n` +
              `🎨 <b>Категории:</b>\n` +
              `• Изображения - генерация и редактирование\n` +
              `• Текст - создание и анализ\n` +
              `• Голос - синтез речи\n` +
              `• Видео - создание видео\n` +
              `• Мультимодальные - понимание`,
      });

    } catch (error) {
      logger.error('❌ Select AI Model action error:', error);
      callback({
        text: '❌ Ошибка при выборе модели',
      });
    }
  },
};
