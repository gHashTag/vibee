/**
 * NeuroPhoto Image Service
 * Handles AI image generation
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import type { NeuroPhotoModel } from '../types';

export class NeuroPhotoService {
  async generateImage(
    runtime: IAgentRuntime,
    model: NeuroPhotoModel,
    prompt: string,
    settings: {
      style?: string;
      size?: string;
    }
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      logger.info(`🎨 Generating image with model: ${model.id}`);

      // Get FAL API key
      const falKey = runtime.getSetting('FAL_KEY');
      if (!falKey) {
        throw new Error('FAL_KEY not configured');
      }

      // Import FAL client dynamically
      const { fal } = await import('@fal-ai/client');
      fal.config({
        credentials: falKey,
      });

      // Enhanced prompt with style and settings
      let enhancedPrompt = prompt;
      if (settings.style) {
        enhancedPrompt += `, style: ${settings.style}`;
      }

      // Generate image
      const result = await fal.run('fal-ai/flux/dev', {
        input_text: enhancedPrompt,
        image_size: settings.size || '1024x1024',
      });

      if (result.success && result.data?.images?.[0]?.url) {
        logger.info('✅ Image generated successfully');
        return {
          success: true,
          url: result.data.images[0].url,
        };
      }

      throw new Error('No image in response');
    } catch (error) {
      logger.error('❌ Image generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
