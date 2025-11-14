/**
 * Apify Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';

/**
 * Instagram post information
 */
export interface InstagramPost {
  id: string;
  shortcode: string;
  text: string;
  timestamp: number;
  ownerId: string;
  ownerUsername: string;
  displayUrl: string;
  isVideo: boolean;
  videoUrl?: string;
  likes: number;
  comments: number;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
}

/**
 * Download parameters
 */
export interface ApifyDownloadParams extends ProviderGenerationParams {
  url: string;
  resultsType?: 'posts' | 'user' | 'hashtag';
  resultsLimit?: number;
  enhanceSearch?: boolean;
}
