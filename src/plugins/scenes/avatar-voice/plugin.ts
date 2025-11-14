/**
 * Avatar Voice Scene Plugin
 * Configure voice for avatars
 */

import { Plugin } from '@elizaos/core';
import { configureAvatarVoiceAction } from './actions/configureVoice.action';
import { createAvatarVoiceScene } from './Scene';

export const avatarVoicePlugin: Plugin = {
  name: 'avatar-voice-scene',
  description: '🎤 Настройка голоса для аватаров',
  version: '1.0.0',
  type: 'scene',

  actions: [configureAvatarVoiceAction],
  sceneId: 'avatarVoiceWizard',
  createScene: () => createAvatarVoiceScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default avatarVoicePlugin;
