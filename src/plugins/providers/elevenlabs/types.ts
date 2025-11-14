/**
 * ElevenLabs Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';
import type { ContentType } from '../base/types';

/**
 * Voice information
 */
export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  category?: 'premade' | 'cloned' | 'generated';
  description?: string;
  previewUrl?: string;
  availableForTiers?: string[];
  settings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

/**
 * Voice clone request
 */
export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: string[]; // URLs or base64 encoded audio files
  labels?: Record<string, string>;
}

/**
 * Voice clone response
 */
export interface VoiceCloneResponse {
  voiceId: string;
  name: string;
  category: 'cloned';
  status: 'processing' | 'ready' | 'failed';
  createdDate: string;
  description?: string;
}

/**
 * Speech generation parameters
 */
export interface ElevenLabsGenerationParams extends ProviderGenerationParams {
  contentType: ContentType;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  pronunciationDictionaryLocators?: Array<{
    characterSpan: {
      from: number;
      to: number;
    };
    pronunciation: string;
  }>;
}

/**
 * Speech response
 */
export interface ElevenLabsSpeechResponse {
  audioBase64: string;
  alignment: {
    characters: string[];
    characterStartTimes: number[];
    characterEndTimes: number[];
  };
  phonemes: Array<{
    phoneme: string;
    startTime: number;
    endTime: number;
  }>;
}

/**
 * Audio information
 */
export interface AudioInfo {
  audioId: string;
  size: number;
  duration: number;
  category?: 'system' | 'user_uploaded' | 'generated';
  createdDate: string;
}
