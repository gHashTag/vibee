/**
 * Fal Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';
import type { ContentType } from '../base/types';

/**
 * Fal API model information
 */
export interface FalModel {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  category: 'image' | 'video' | 'audio';
  tags: string[];
}

/**
 * Fal request payload
 */
export interface FalRequest {
  prompt: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  [key: string]: any;
}

/**
 * Fal response
 */
export interface FalResponse {
  images?: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  videos?: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
    duration?: number;
  }>;
  audios?: Array<{
    url: string;
    content_type: string;
    duration?: number;
  }>;
  timings?: {
    inference?: number;
  };
  seed?: number;
  has_nsfw_concepts?: boolean[];
  prompt: string;
}

/**
 * Fal generation parameters
 */
export interface FalGenerationParams extends ProviderGenerationParams {
  contentType: ContentType;
  imageSize?: string;
  numImages?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  negativePrompt?: string;
  loras?: Array<{
    path: string;
    scale: number;
  }>;
  safetyChecker?: boolean;
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

/**
 * Fal subscription info
 */
export interface FalSubscription {
  plan: 'free' | 'standard' | 'pro' | 'enterprise';
  credits: number;
  creditsUsed: number;
  nextBillingDate: Date;
}
