/**
 * HuggingFace Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';

/**
 * Model information
 */
export interface HFModel {
  id: string;
  author: string;
  createdAt: string;
  private: boolean;
  downloads: number;
  gated: boolean;
  lastModified: string;
  library_name?: string;
  likes: number;
  pipeline_tag?: string;
  references?: Record<string, any>;
  replicas?: Record<string, any>;
  removed?: boolean;
  runtime?: Record<string, any>;
  securityStatus?: Record<string, any>;
  siblings?: Array<{
    rfilename: string;
  }>;
  solidmlHref?: string;
  spaCy?: Record<string, any>;
  summary: string;
  tags: string[];
  tasks: string[];
  transformersInfo?: Record<string, any>;
  widgetData?: any;
}

/**
 * Generation parameters
 */
export interface HFGenerationParams extends ProviderGenerationParams {
  model?: string;
  task?: string;
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  doSample?: boolean;
  returnFullText?: boolean;
  inputs?: string;
}

/**
 * Chat completion parameters
 */
export interface HFChatParams extends ProviderGenerationParams {
  model?: string;
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    return_full_text?: boolean;
  };
}
