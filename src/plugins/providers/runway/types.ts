/**
 * Runway Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';

/**
 * Runway model
 */
export interface RunwayModel {
  id: string;
  name: string;
  description: string;
  input: string;
  output: string;
}

/**
 * Generation parameters
 */
export interface RunwayGenerationParams extends ProviderGenerationParams {
  model?: string;
  duration?: number;
  ratio?: '16:9' | '9:16' | '1:1';
  seed?: number;
}
