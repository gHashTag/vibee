/**
 * NeuroPhoto Scene Plugin
 * AI image generation with step-by-step wizard
 */

import { Plugin } from '@elizaos/core';
import { generateImageAction } from './actions/generateImage.action';
import { createNeuroPhotoScene } from './Scene';

export const neuroPhotoPlugin: Plugin = {
  name: 'neuro-photo-scene',
  description: '🎨 AI генерация изображений с пошаговым мастером',
  version: '1.0.0',
  type: 'scene',

  // Register actions
  actions: [generateImageAction],

  // Scene configuration
  sceneId: 'neuroPhotoWizard',

  // Create scene instance
  createScene: () => createNeuroPhotoScene(),

  // Plugin lifecycle
  register: async (runtime) => {
    // Initialize scene in telegram bot
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      const bot = telegramService.bot;
      const scene = createNeuroPhotoScene();

      // Use bot's context (need to extend bot with scene support)
      if (bot.context?.registry) {
        // Scene registration would happen here
        // This requires bot.extension or similar
      }
    }
  },
};

export default neuroPhotoPlugin;
