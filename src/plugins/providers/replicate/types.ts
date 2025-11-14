/**
 * Replicate Provider Types
 */

import type { ProviderGenerationParams, ProviderResult, ContentType } from '../base/types';

/**
 * Replicate model information
 */
export interface ReplicateModel {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  version?: string;
  githubUrl?: string;
  paperUrl?: string;
  websiteUrl?: string;
  license?: string;
  runExamples?: any[];
}

/**
 * Replicate prediction job
 */
export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input?: Record<string, any>;
  output?: any;
  error?: string;
  logs?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metrics?: Record<string, number>;
}

/**
 * Replicate generation parameters
 */
export interface ReplicateGenerationParams extends ProviderGenerationParams {
  contentType: ContentType;
  modelVersion?: string;
  input?: Record<string, any>;
  webhook?: string;
  waitForCompletion?: boolean;
  pollInterval?: number;
}

/**
 * Replicate API response
 */
export interface ReplicateAPIResponse<T = any> {
  results?: T[];
  next?: string;
  previous?: string;
  count?: number;
}

/**
 * Replicate pagination
 */
export interface ReplicatePagination {
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
}
