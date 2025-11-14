/**
 * Digital Avatar Service
 * Creates avatar from photos using AI
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class DigitalAvatarService {
  async createAvatar(
    runtime: IAgentRuntime,
    photos: string[],
    settings: {
      gender?: string;
      age?: string;
      style?: string;
      background?: string;
    }
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      logger.info(`🤖 Creating avatar from ${photos.length} photos`);

      const falKey = runtime.getSetting('FAL_KEY');
      if (!falKey) {
        throw new Error('FAL_KEY not configured');
      }

      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: falKey });

      // Use Flux model for avatar creation
      const result = await fal.run('fal-ai/flux/dev', {
        input_text: `digital avatar, ${settings.style || 'realistic'} style, ${settings.background || 'white'} background`,
        image_url: photos[0], // Primary reference photo
        num_inference_steps: 28,
        guidance_scale: 3.5,
      });

      if (result.success && result.data?.images?.[0]?.url) {
        logger.info('✅ Avatar created successfully');
        return {
          success: true,
          avatarUrl: result.data.images[0].url,
        };
      }

      throw new Error('No avatar in response');
    } catch (error) {
      logger.error('❌ Avatar creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processPhoto(
    runtime: IAgentRuntime,
    photoUrl: string
  ): Promise<{ success: boolean; processedUrl?: string; error?: string }> {
    try {
      logger.info('📸 Processing photo for avatar...');

      const falKey = runtime.getSetting('FAL_KEY');
      if (!falKey) {
        throw new Error('FAL_KEY not configured');
      }

      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: falKey });

      // Enhance photo for avatar creation
      const result = await fal.run('fal-ai/resr', {
        image_url: photoUrl,
        enhance: 'face',
      });

      if (result.success && result.data?.enhanced?.url) {
        return {
          success: true,
          processedUrl: result.data.enhanced.url,
        };
      }

      return {
        success: false,
        error: 'Photo enhancement failed',
      };
    } catch (error) {
      logger.error('❌ Photo processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
