/**
 * Neurophoto Multi-Provider System - Type Definitions
 * Complete type system for image generation with multiple providers
 */

import { UUID } from '@elizaos/core';

// ============================================================================
// Provider Core Types
// ============================================================================

export type ProviderType = 'fal' | 'replicate' | 'stability' | 'openai' | 'midjourney';

export type ProviderStatus = 'active' | 'disabled' | 'error' | 'rate_limited';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TrainingStatus = 'pending' | 'training' | 'ready' | 'failed';

// ============================================================================
// Provider Capabilities
// ============================================================================

export interface ProviderCapabilities {
  // Core features
  imageGeneration: boolean;
  loraSupport: boolean;
  loraTraining: boolean;

  // Model capabilities
  availableModels: string[];
  defaultModel: string;

  // Image capabilities
  supportedSizes: string[] | 'custom';
  maxResolution: { width: number; height: number };
  supportedFormats: string[];

  // Performance
  averageGenerationTime: number; // seconds
  maxConcurrentRequests: number;

  // Pricing (cost per generation in USD)
  pricing: {
    generation: number;
    training?: number;
    perStep?: number;
  };

  // Rate limits
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

// ============================================================================
// Generation Options
// ============================================================================

export interface GenerationOptions {
  prompt: string;
  negativePrompt?: string;

  // Model selection
  model?: string;

  // LoRA configuration
  loras?: LoraConfig[];

  // Image parameters
  imageSize?: ImageSize;
  width?: number;
  height?: number;

  // Generation parameters
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  numImages?: number;

  // Quality & format
  outputFormat?: 'jpeg' | 'png' | 'webp';
  quality?: number;

  // Safety
  enableSafetyChecker?: boolean;

  // Provider-specific options
  providerOptions?: Record<string, any>;
}

export interface LoraConfig {
  path: string;
  scale: number;
  triggerWord?: string;
}

export type ImageSize =
  | 'square'
  | 'square_hd'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9'
  | { width: number; height: number };

// ============================================================================
// Generation Results
// ============================================================================

export interface ImageResult {
  id: UUID;
  url: string;
  width: number;
  height: number;
  contentType: string;

  // Generation metadata
  prompt: string;
  enhancedPrompt?: string;
  seed?: number;

  // Provider info
  provider: ProviderType;
  model: string;

  // Performance
  generationTimeMs: number;
  cost?: number;

  // Safety
  hasNsfwConcepts?: boolean;
  safetyScore?: number;
}

export interface TrainingResult {
  id: UUID;
  loraUrl: string;
  triggerWord: string;

  // Training metadata
  model: string;
  provider: ProviderType;

  // Configuration
  steps: number;
  learningRate: number;
  rank: number;

  // Performance
  trainingTimeMs: number;
  cost?: number;
}

// ============================================================================
// Training Options
// ============================================================================

export interface TrainingOptions {
  imagesZipUrl: string;
  triggerWord: string;

  // Training parameters
  steps?: number;
  learningRate?: number;
  rank?: number;

  // Model selection
  baseModel?: string;

  // Provider-specific options
  providerOptions?: Record<string, any>;
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  priority: number;

  // API credentials
  apiKey?: string;
  apiSecret?: string;
  apiEndpoint?: string;

  // Configuration
  defaultModel?: string;
  defaultSettings?: Partial<GenerationOptions>;

  // Limits
  maxRetries?: number;
  timeout?: number;

  // Custom config
  customConfig?: Record<string, any>;
}

// ============================================================================
// Provider Interface
// ============================================================================

export interface IImageProvider {
  // Provider metadata
  readonly name: string;
  readonly type: ProviderType;
  readonly description: string;

  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Capabilities
  getCapabilities(): ProviderCapabilities;
  listModels(): Promise<ModelInfo[]>;

  // Image generation
  generate(options: GenerationOptions): Promise<ImageResult>;

  // LoRA support (optional)
  supportsLora(): boolean;
  trainLora?(options: TrainingOptions): Promise<TrainingResult>;
  checkTrainingStatus?(jobId: string): Promise<TrainingProgressInfo>;

  // Cost estimation
  estimateCost(options: GenerationOptions): number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  type: 'base' | 'lora' | 'controlnet';
  version: string;

  // Capabilities
  supportsLora: boolean;
  supportedSizes: string[];

  // Performance
  averageGenerationTime: number;

  // Pricing
  costPerGeneration: number;
}

export interface TrainingProgressInfo {
  status: TrainingStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: number;
  totalSteps?: number;
  error?: string;
}

// ============================================================================
// Provider Registry
// ============================================================================

export interface IProviderRegistry {
  // Registration
  register(provider: IImageProvider, config: ProviderConfig): void;
  unregister(providerId: string): void;

  // Provider access
  getProvider(providerId: string): IImageProvider | null;
  getActiveProvider(): IImageProvider | null;
  listProviders(): ProviderInfo[];

  // Provider selection
  setActiveProvider(providerId: string): void;
  selectBestProvider(criteria: ProviderSelectionCriteria): IImageProvider | null;

  // Configuration
  updateProviderConfig(providerId: string, config: Partial<ProviderConfig>): void;
  getProviderConfig(providerId: string): ProviderConfig | null;
}

export interface ProviderInfo {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  status: ProviderStatus;
  priority: number;
  capabilities: ProviderCapabilities;
}

export interface ProviderSelectionCriteria {
  requiresLora?: boolean;
  requiresTraining?: boolean;
  maxCost?: number;
  maxGenerationTime?: number;
  preferredModels?: string[];
}

// ============================================================================
// Database Entities
// ============================================================================

export interface ProviderEntity {
  id: string;
  type: ProviderType;
  name: string;
  enabled: number; // SQLite boolean
  priority: number;
  config: string; // JSON string
  status: ProviderStatus;
  last_health_check: number | null;
  created_at: number;
  updated_at: number;
}

export interface AvatarFaceEntity {
  id: string;
  user_id: string;
  name: string;
  trigger_word: string;
  lora_url: string;

  // Provider association
  provider_id: string | null;
  preferred_provider: ProviderType | null;

  // Training metadata
  training_status: TrainingStatus;
  training_job_id: string | null;
  training_provider: ProviderType | null;
  training_started_at: number | null;
  training_completed_at: number | null;
  training_error: string | null;

  // Source data
  source_images_url: string | null;
  source_images_count: number | null;

  // Usage tracking
  is_default: number; // SQLite boolean
  usage_count: number;
  last_used_at: number | null;

  // Metadata
  description: string | null;
  tags: string | null; // JSON string
  model_version: string;

  // Timestamps
  created_at: number;
  updated_at: number;
}

export interface GenerationHistoryEntity {
  id: string;
  face_id: string | null;
  user_id: string;

  // Generation details
  prompt: string;
  enhanced_prompt: string | null;
  image_url: string;

  // Provider info
  provider_id: string;
  provider_type: ProviderType;
  model_used: string;

  // Performance
  generation_time_ms: number;
  cost: number | null;

  // Metadata
  seed: number | null;
  config: string | null; // JSON string with full generation config

  // Timestamps
  created_at: number;
}

// ============================================================================
// Service Results
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  provider?: string;
  retryable?: boolean;
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // Provider errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',

  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',

  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  INVALID_PROMPT = 'INVALID_PROMPT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',

  // Training errors
  TRAINING_FAILED = 'TRAINING_FAILED',
  TRAINING_NOT_SUPPORTED = 'TRAINING_NOT_SUPPORTED',
  INVALID_TRAINING_DATA = 'INVALID_TRAINING_DATA',

  // Face errors
  FACE_NOT_FOUND = 'FACE_NOT_FOUND',
  FACE_ALREADY_EXISTS = 'FACE_ALREADY_EXISTS',
  NO_DEFAULT_FACE = 'NO_DEFAULT_FACE',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ProviderError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public provider?: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// ============================================================================
// Action Context Types
// ============================================================================

export interface NeurophotoContext {
  providerRegistry: IProviderRegistry;
  faceManager: any; // FaceManagerService
  imageService: any; // ImageGenerationService
  currentUserId: UUID;
}

export interface ParsedProviderCommand {
  action: 'list' | 'use' | 'models' | 'status' | 'config';
  providerId?: string;
  params?: Record<string, any>;
}

export interface ParsedGenerationCommand {
  action: 'generate';
  prompt: string;
  providerId?: string;
  faceName?: string;
  params?: Partial<GenerationOptions>;
}

// ============================================================================
// Provider-Specific Types
// ============================================================================

// Fal.ai
export interface FalConfig {
  images_data_url?: string;
  trigger_word?: string;
  prompt?: string;
  loras?: Array<{ path: string; scale: number }>;
  image_size?: any;
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: string;
}

// Replicate
export interface ReplicateConfig {
  version: string;
  input: Record<string, any>;
  webhook?: string;
}

// Stability AI
export interface StabilityConfig {
  text_prompts: Array<{ text: string; weight?: number }>;
  cfg_scale?: number;
  height?: number;
  width?: number;
  samples?: number;
  steps?: number;
  seed?: number;
}

// OpenAI
export interface OpenAIConfig {
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  response_format?: 'url' | 'b64_json';
  user?: string;
}
