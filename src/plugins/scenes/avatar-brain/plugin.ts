/**
 * Avatar Brain Scene Plugin
 * Create AI personality for avatars
 */

import { Plugin } from '@elizaos/core';
import { createAvatarBrainAction } from './actions/createBrain.action';
import { createAvatarBrainScene } from './Scene';

export const avatarBrainPlugin: Plugin = {
  name: 'avatar-brain-scene',
  description: '🧠 Создание "мозга" аватара с личностью',
  version: '1.0.0',
  type: 'scene',

  actions: [createAvatarBrainAction],
  sceneId: 'avatarBrainWizard',
  createScene: () => createAvatarBrainScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default avatarBrainPlugin;
