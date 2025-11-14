/**
 * Image Upscaler Scene Plugin
 * Enhance and upscale images
 */

import { Plugin } from '@elizaos/core';
import { upscaleImageAction } from './actions/upscaleImage.action';
import { createImageUpscalerScene } from './Scene';

export const imageUpscalerPlugin: Plugin = {
  name: 'image-upscaler-scene',
  description: '⬆️ Улучшение и увеличение изображений',
  version: '1.0.0',
  type: 'scene',

  actions: [upscaleImageAction],
  sceneId: 'imageUpscalerWizard',
  createScene: () => createImageUpscalerScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default imageUpscalerPlugin;
