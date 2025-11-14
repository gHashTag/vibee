/**
 * Image to Prompt Scene Plugin
 * Analyze images to generate prompts
 */

import { Plugin } from '@elizaos/core';
import { imageToPromptAction } from './actions/analyzeImage.action';
import { createImageToPromptScene } from './Scene';

export const imageToPromptPlugin: Plugin = {
  name: 'image-to-prompt-scene',
  description: '🔍 Анализ изображений и создание промптов',
  version: '1.0.0',
  type: 'scene',

  actions: [imageToPromptAction],
  sceneId: 'imageToPromptWizard',
  createScene: () => createImageToPromptScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default imageToPromptPlugin;
