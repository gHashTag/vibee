/**
 * Avatar Voice Service
 * Configures and generates avatar voice
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class AvatarVoiceService {
  async configureVoice(
    runtime: IAgentRuntime,
    avatarId: string,
    settings: {
      voiceId: string;
      language: string;
      speed: number;
      pitch: number;
      emotion: string;
    }
  ): Promise<{ success: boolean; config?: string; error?: string }> {
    try {
      logger.info(`🎤 Configuring voice for avatar: ${avatarId}`);

      const openaiKey = runtime.getSetting('OPENROUTER_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      // Create voice configuration
      const config = {
        avatarId,
        voiceId: settings.voiceId,
        language: settings.language,
        speed: settings.speed,
        pitch: settings.pitch,
        emotion: settings.emotion,
        createdAt: new Date().toISOString(),
      };

      // Save to memory
      await runtime.setMemory({
        id: `voice-config-${avatarId}-${Date.now()}`,
        userId: 'system',
        content: {
          text: JSON.stringify(config, null, 2),
          type: 'voice_config',
          avatarId,
        },
        createdAt: Date.now(),
      });

      logger.info('✅ Voice configuration saved');
      return {
        success: true,
        config: JSON.stringify(config, null, 2),
      };
    } catch (error) {
      logger.error('❌ Voice configuration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateSample(
    runtime: IAgentRuntime,
    text: string,
    voiceId: string
  ): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      logger.info(`🎙️ Generating voice sample with voice: ${voiceId}`);

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
          voice: voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      logger.info('✅ Voice sample generated');
      return {
        success: true,
        audioUrl: `data:audio/mp3;base64,${base64Audio}`,
      };
    } catch (error) {
      logger.error('❌ Voice generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
