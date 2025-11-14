/**
 * Text to Speech Scene Plugin
 * Convert text to speech audio
 */

import { Plugin } from '@elizaos/core';
import { textToSpeechAction } from './actions/textToSpeech.action';
import { createTextToSpeechScene } from './Scene';

export const textToSpeechPlugin: Plugin = {
  name: 'text-to-speech-scene',
  description: '🎙️ Преобразование текста в речь',
  version: '1.0.0',
  type: 'scene',

  actions: [textToSpeechAction],
  sceneId: 'textToSpeechWizard',
  createScene: () => createTextToSpeechScene(),

  register: async (runtime) => {
    const telegramService = runtime.getService('telegram');
    if (telegramService?.bot) {
      // Scene registration logic
    }
  },
};

export default textToSpeechPlugin;
