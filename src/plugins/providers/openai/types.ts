/**
 * OpenAI Provider Types
 */

import type { ProviderGenerationParams, ProviderResult } from '../base/types';
import type { ContentType } from '../base/types';

/**
 * Chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: string;
  }>;
  name?: string;
  tool_call_id?: string;
}

/**
 * Tool definition
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * Chat completion parameters
 */
export interface OpenAIChatParams extends ProviderGenerationParams {
  contentType: ContentType;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  n?: number;
  stop?: string | string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: Record<string, number>;
  user?: string;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  responseFormat?: { type: 'text' | 'json_object' | 'json_schema' };
  jsonSchema?: Record<string, any>;
}

/**
 * Vision parameters
 */
export interface OpenAIVisionParams extends ProviderGenerationParams {
  contentType: ContentType;
  imageUrl: string;
  model?: string;
  maxTokens?: number;
  detail?: 'low' | 'high' | 'auto';
}

/**
 * TTS parameters
 */
export interface OpenAITTSParams extends ProviderGenerationParams {
  contentType: ContentType;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: string;
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac';
  speed?: number;
}

/**
 * Chat completion response
 */
export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    logprobs?: any;
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

/**
 * Embedding response
 */
export interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * File upload
 */
export interface FileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  createdAt: number;
  filename: string;
  purpose: string;
}
