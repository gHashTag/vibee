/**
 * Digital Avatar Scene Plugin
 * Create digital avatar from photos
 */

import { Plugin } from '@elizaos/core';
import { createDigitalAvatarAction } from './actions/createAvatar.action';
import { createDigitalAvatarScene } from './Scene';

export const digitalAvatarPlugin: Plugin = {
  name: 'digital-avatar-scene',
  description: '🤖 Создание цифрового аватара из фотографий',
  version: '1.0.0',
  type: 'scene',

  actions: [createDigitalAvatarAction],
  sceneId: 'digitalAvatarWizard',
  createScene: () => createDigitalAvatarScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default digitalAvatarPlugin;
