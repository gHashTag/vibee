/**
 * Chat with Avatar Scene Plugin
 * Interactive chat with AI avatars
 */

import { Plugin } from '@elizaos/core';
import { chatWithAvatarAction } from './actions/startChat.action';
import { createChatWithAvatarScene } from './Scene';

export const chatWithAvatarPlugin: Plugin = {
  name: 'chat-with-avatar-scene',
  description: '💬 Интерактивный чат с AI-аватарами',
  version: '1.0.0',
  type: 'scene',

  actions: [chatWithAvatarAction],
  sceneId: 'chatWithAvatarWizard',
  createScene: () => createChatWithAvatarScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default chatWithAvatarPlugin;
