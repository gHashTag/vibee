/**
 * Kie.ai Provider Types
 */

import type { ContentType, ProviderGenerationParams, ProviderResult } from '../base/types';

/**
 * Kie.ai specific generation parameters
 */
export interface KieAIGenerationParams extends ProviderGenerationParams {
  contentType: ContentType;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  quality?: 'low' | 'medium' | 'high';
  voiceId?: string;
  style?: string;
  loraPath?: string;
}

/**
 * Video generation response
 */
export interface KieAIVideoResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

/**
 * Audio generation response
 */
export interface KieAIAudioResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
  duration?: number;
}

/**
 * Kie.ai provider configuration
 */
export interface KieAIConfig {
  projectId: string;
  webhookUrl?: string;
  region?: 'us' | 'eu' | 'asia';
}
