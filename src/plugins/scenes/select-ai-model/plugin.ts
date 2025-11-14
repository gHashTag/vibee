/**
 * Select AI Model Scene Plugin
 * Choose AI models for different tasks
 */

import { Plugin } from '@elizaos/core';
import { selectAIModelAction } from './actions/selectModel.action';
import { createSelectAIModelScene } from './Scene';

export const selectAIModelPlugin: Plugin = {
  name: 'select-ai-model-scene',
  description: '⚙️ Выбор AI моделей для разных задач',
  version: '1.0.0',
  type: 'scene',

  actions: [selectAIModelAction],
  sceneId: 'selectAIModelWizard',
  createScene: () => createSelectAIModelScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default selectAIModelPlugin;
