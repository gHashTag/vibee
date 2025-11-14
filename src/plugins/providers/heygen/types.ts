/**
 * HeyGen Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';

/**
 * Avatar information
 */
export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  caption?: string;
  gender?: string;
  age?: string;
  language?: string[];
  category?: string;
}

/**
 * Video generation parameters
 */
export interface HeyGenVideoParams extends ProviderGenerationParams {
  avatar_id: string;
  voice_id?: string;
  script: string;
  test?: boolean;
  caption?: boolean;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
}

/**
 * Video response
 */
export interface HeyGenVideoResponse {
  video_id: string;
  status: 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
}

/**
 * Streaming parameters
 */
export interface HeyGenStreamingParams extends ProviderGenerationParams {
  avatar_id: string;
  voice_id?: string;
  script: string;
}

/**
 * Streaming response
 */
export interface HeyGenStreamingResponse {
  session_id: string;
  rtmp_url: string;
  stream_key: string;
  status: 'connected' | 'disconnected';
}
