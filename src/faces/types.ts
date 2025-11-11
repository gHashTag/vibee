/**
 * Avatar Faces System - Type Definitions
 * Complete type system for LoRA face management
 */

import { UUID } from '@elizaos/core';

// ============================================================================
// Core Types
// ============================================================================

export type TrainingStatus = 'pending' | 'training' | 'ready' | 'failed';

export interface AvatarFace {
  id: UUID;
  userId: UUID;
  name: string;
  triggerWord: string;
  loraUrl: string;

  // Training metadata
  trainingStatus: TrainingStatus;
  trainingJobId?: string;
  trainingStartedAt?: number;
  trainingCompletedAt?: number;
  trainingError?: string;

  // Source data
  sourceImagesUrl?: string;
  sourceImagesCount?: number;

  // Usage tracking
  isDefault: boolean;
  usageCount: number;
  lastUsedAt?: number;

  // Metadata
  description?: string;
  tags?: string[];
  modelVersion: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface FaceGeneration {
  id: UUID;
  faceId: UUID;
  userId: UUID;
  prompt: string;
  imageUrl: string;
  modelUsed: string;
  generationTimeMs: number;
  createdAt: number;
}

// ============================================================================
// Database Entities (Raw SQL format)
// ============================================================================

export interface AvatarFaceEntity {
  id: string;
  user_id: string;
  name: string;
  trigger_word: string;
  lora_url: string;

  training_status: TrainingStatus;
  training_job_id: string | null;
  training_started_at: number | null;
  training_completed_at: number | null;
  training_error: string | null;

  source_images_url: string | null;
  source_images_count: number | null;

  is_default: number; // SQLite boolean (0 or 1)
  usage_count: number;
  last_used_at: number | null;

  description: string | null;
  tags: string | null; // JSON string
  model_version: string;

  created_at: number;
  updated_at: number;
}

export interface FaceGenerationEntity {
  id: string;
  face_id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  generation_time_ms: number;
  created_at: number;
}

// ============================================================================
// Service DTOs
// ============================================================================

export interface CreateFaceInput {
  userId: UUID;
  name: string;
  triggerWord: string;
  loraUrl: string;
  description?: string;
  tags?: string[];
  setAsDefault?: boolean;
}

export interface TrainFaceInput {
  userId: UUID;
  name: string;
  imagesZipUrl: string;
  triggerWord: string;
  description?: string;
  tags?: string[];
  setAsDefault?: boolean;
}

export interface UpdateFaceInput {
  name?: string;
  triggerWord?: string;
  loraUrl?: string;
  description?: string;
  tags?: string[];
  isDefault?: boolean;
}

export interface ListFacesOptions {
  userId: UUID;
  includeTraining?: boolean;
  status?: TrainingStatus;
  limit?: number;
  offset?: number;
}

export interface GenerateWithFaceInput {
  userId: UUID;
  faceName?: string; // If not provided, use default
  prompt: string;
  model?: string;
  imageSize?: { width: number; height: number };
  numInferenceSteps?: number;
  guidanceScale?: number;
}

// ============================================================================
// FAL.AI API Types
// ============================================================================

export interface FalTrainingConfig {
  images_data_url: string; // ZIP file URL
  trigger_word: string;
  steps?: number;
  learning_rate?: number;
  rank?: number;
}

export interface FalTrainingResponse {
  request_id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  diffusion_lora_url?: string;
  config?: {
    trigger_word: string;
    rank: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface FalGenerationConfig {
  prompt: string;
  loras?: Array<{
    path: string;
    scale: number;
  }>;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9'
    | {
        width: number;
        height: number;
      };
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: 'jpeg' | 'png';
}

export interface FalGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// ============================================================================
// Service Results
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface FaceListResult {
  faces: AvatarFace[];
  total: number;
  hasMore: boolean;
}

export interface TrainingProgressResult {
  faceId: UUID;
  status: TrainingStatus;
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

export interface GenerationResult {
  imageUrl: string;
  faceName: string;
  triggerWord: string;
  generationTimeMs: number;
  generationId: UUID;
}

// ============================================================================
// Action Context Types
// ============================================================================

export interface FaceActionContext {
  faceManager: any; // FaceManagerService
  loraTrainer: any; // LoraTrainingService
  falMcp: any; // FalMcpService
  currentUserId: UUID;
}

export interface ParsedFaceCommand {
  action: 'list' | 'add' | 'train' | 'use' | 'delete' | 'status';
  name?: string;
  params?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

export enum FaceErrorCode {
  NOT_FOUND = 'FACE_NOT_FOUND',
  ALREADY_EXISTS = 'FACE_ALREADY_EXISTS',
  INVALID_INPUT = 'INVALID_INPUT',
  TRAINING_FAILED = 'TRAINING_FAILED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  NO_DEFAULT_FACE = 'NO_DEFAULT_FACE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
}

export class FaceError extends Error {
  constructor(
    public code: FaceErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FaceError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type FaceMapper = {
  toModel: (entity: AvatarFaceEntity) => AvatarFace;
  toEntity: (model: Partial<AvatarFace>) => Partial<AvatarFaceEntity>;
};
