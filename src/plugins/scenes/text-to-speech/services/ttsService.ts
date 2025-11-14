/**
 * Text to Speech Service
 * Converts text to audio
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class TTSService {
  async synthesize(
    runtime: IAgentRuntime,
    text: string,
    voice: string,
    speed: number,
    format: string = 'mp3'
  ): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      logger.info(`🎙️ Synthesizing text with voice: ${voice}`);

      const openaiKey = runtime.getSetting('OPENROUTER_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vibee.chat',
          'X-Title': 'Vibee AI Bot',
        },
        body: JSON.stringify({
          model: 'openai/tts-1',
          input: text,
          voice: voice,
          response_format: format,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      logger.info('✅ Audio synthesis completed');
      return {
        success: true,
        audioUrl: `data:audio/${format};base64,${base64Audio}`,
      };
    } catch (error) {
      logger.error('❌ Audio synthesis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getVoiceInfo(
    runtime: IAgentRuntime,
    voiceId: string
  ): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const voice = TTS_VOICES.find((v) => v.id === voiceId);

      if (!voice) {
        throw new Error('Voice not found');
      }

      return {
        success: true,
        info: voice,
      };
    } catch (error) {
      logger.error('❌ Voice info failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Import types
const TTS_VOICES = [
  {
    id: 'alloy',
    name: 'Alloy',
    provider: 'OpenAI',
    quality: 'standard',
    languages: ['ru', 'en'],
    emoji: '🎭',
  },
  {
    id: 'echo',
    name: 'Echo',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['ru', 'en'],
    emoji: '🎤',
  },
  {
    id: 'fable',
    name: 'Fable',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['en', 'fr', 'es'],
    emoji: '🗣️',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    provider: 'OpenAI',
    quality: 'premium',
    languages: ['ru', 'en', 'de'],
    emoji: '🔊',
  },
  {
    id: 'nova',
    name: 'Nova',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['ru', 'en', 'es'],
    emoji: '🎀',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['en', 'fr', 'de'],
    emoji: '✨',
  },
];
