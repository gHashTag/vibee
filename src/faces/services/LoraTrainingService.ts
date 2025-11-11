/**
 * LoRA Training Service
 * Manages asynchronous training of LoRA models via fal.ai
 */

import { Service, IAgentRuntime, ServiceType } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import {
  TrainFaceInput,
  TrainingProgressResult,
  ServiceResult,
  FaceError,
  FaceErrorCode,
  FalTrainingConfig,
  FalTrainingResponse,
  AvatarFace,
} from '../types';
import { FaceDatabaseAdapter, entityToModel } from '../database';
import { FaceManagerService } from './FaceManagerService';

export class LoraTrainingService extends Service {
  static serviceType: ServiceType = 'lora-training' as ServiceType;

  private db: FaceDatabaseAdapter;
  private faceManager: FaceManagerService;
  private falApiKey: string;
  private trainingPollingInterval = 10000; // 10 seconds

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.db = new FaceDatabaseAdapter(runtime.databaseAdapter);
    this.faceManager = runtime.getService<FaceManagerService>('face-manager' as ServiceType);

    // Get FAL API key from environment
    this.falApiKey = runtime.getSetting('FAL_KEY') || process.env.FAL_KEY || '';

    if (!this.falApiKey) {
      console.warn('FAL_KEY not configured. LoRA training will not work.');
    }
  }

  // ============================================================================
  // Training Management
  // ============================================================================

  /**
   * Start training a new LoRA model
   */
  async startTraining(input: TrainFaceInput): Promise<ServiceResult<AvatarFace>> {
    try {
      // Validate API key
      if (!this.falApiKey) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.API_ERROR,
            message: 'FAL_KEY not configured',
          },
        };
      }

      // Check if face with same name already exists
      const existing = await this.db.getFaceByName(input.userId, input.name);
      if (existing) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.ALREADY_EXISTS,
            message: `Face with name "${input.name}" already exists`,
          },
        };
      }

      // Submit training job to fal.ai
      const trainingConfig: FalTrainingConfig = {
        images_data_url: input.imagesZipUrl,
        trigger_word: input.triggerWord,
        steps: 1000, // Default training steps
        learning_rate: 0.0004,
        rank: 16, // LoRA rank
      };

      const jobId = await this.submitTrainingJob(trainingConfig);

      // Create face entry with "pending" status
      const faceId = uuidv4();
      const entity = await this.db.createFace({
        id: faceId,
        user_id: input.userId,
        name: input.name,
        trigger_word: input.triggerWord,
        lora_url: '', // Will be filled when training completes

        training_status: 'training',
        training_job_id: jobId,
        training_started_at: Date.now(),
        training_completed_at: null,
        training_error: null,

        source_images_url: input.imagesZipUrl,
        source_images_count: null, // Could extract from ZIP

        is_default: input.setAsDefault ? 1 : 0,
        usage_count: 0,
        last_used_at: null,

        description: input.description || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        model_version: 'flux-lora-v1',
      });

      // Start background polling for this job
      this.startPollingJob(faceId, jobId);

      return {
        success: true,
        data: entityToModel(entity),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.TRAINING_FAILED,
          message: 'Failed to start training',
          details: error,
        },
      };
    }
  }

  /**
   * Check training progress for a face
   */
  async getTrainingProgress(faceId: string): Promise<ServiceResult<TrainingProgressResult>> {
    try {
      const entity = await this.db.getFaceById(faceId);

      if (!entity) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      // If training is in progress, fetch latest status
      if (entity.training_status === 'training' && entity.training_job_id) {
        const status = await this.checkTrainingStatus(entity.training_job_id);

        return {
          success: true,
          data: {
            faceId,
            status: this.mapFalStatusToTrainingStatus(status.status),
            progress: this.estimateProgress(status.status),
            error: status.error?.message,
          },
        };
      }

      // Return current status
      return {
        success: true,
        data: {
          faceId,
          status: entity.training_status,
          error: entity.training_error || undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.API_ERROR,
          message: 'Failed to check training progress',
          details: error,
        },
      };
    }
  }

  /**
   * Cancel an ongoing training job
   */
  async cancelTraining(faceId: string): Promise<ServiceResult<void>> {
    try {
      const entity = await this.db.getFaceById(faceId);

      if (!entity) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      if (entity.training_status !== 'training') {
        return {
          success: false,
          error: {
            code: FaceErrorCode.INVALID_INPUT,
            message: 'Face is not currently training',
          },
        };
      }

      // Update status to failed
      await this.db.updateFace(faceId, {
        training_status: 'failed',
        training_error: 'Training cancelled by user',
        training_completed_at: Date.now(),
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to cancel training',
          details: error,
        },
      };
    }
  }

  /**
   * Retry failed training
   */
  async retryTraining(faceId: string): Promise<ServiceResult<AvatarFace>> {
    try {
      const entity = await this.db.getFaceById(faceId);

      if (!entity) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      if (entity.training_status !== 'failed') {
        return {
          success: false,
          error: {
            code: FaceErrorCode.INVALID_INPUT,
            message: 'Can only retry failed training',
          },
        };
      }

      if (!entity.source_images_url) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.INVALID_INPUT,
            message: 'No source images URL found for retry',
          },
        };
      }

      // Resubmit training job
      const trainingConfig: FalTrainingConfig = {
        images_data_url: entity.source_images_url,
        trigger_word: entity.trigger_word,
        steps: 1000,
        learning_rate: 0.0004,
        rank: 16,
      };

      const jobId = await this.submitTrainingJob(trainingConfig);

      // Update face entry
      await this.db.updateFace(faceId, {
        training_status: 'training',
        training_job_id: jobId,
        training_started_at: Date.now(),
        training_completed_at: null,
        training_error: null,
      });

      // Start polling
      this.startPollingJob(faceId, jobId);

      const updated = await this.db.getFaceById(faceId);

      return {
        success: true,
        data: entityToModel(updated!),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.TRAINING_FAILED,
          message: 'Failed to retry training',
          details: error,
        },
      };
    }
  }

  // ============================================================================
  // FAL.AI Integration
  // ============================================================================

  /**
   * Submit training job to fal.ai
   */
  private async submitTrainingJob(config: FalTrainingConfig): Promise<string> {
    const response = await fetch('https://fal.run/fal-ai/flux-lora-portrait-trainer', {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FAL API error: ${error}`);
    }

    const data = await response.json();
    return data.request_id;
  }

  /**
   * Check training status from fal.ai
   */
  private async checkTrainingStatus(jobId: string): Promise<FalTrainingResponse> {
    const response = await fetch(`https://fal.run/fal-ai/flux-lora-portrait-trainer/requests/${jobId}`, {
      headers: {
        Authorization: `Key ${this.falApiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FAL API error: ${error}`);
    }

    return await response.json();
  }

  /**
   * Poll training job until completion
   */
  private async startPollingJob(faceId: string, jobId: string): Promise<void> {
    const poll = async () => {
      try {
        const status = await this.checkTrainingStatus(jobId);

        if (status.status === 'COMPLETED') {
          // Training completed successfully
          await this.db.updateFace(faceId, {
            training_status: 'ready',
            lora_url: status.diffusion_lora_url || '',
            training_completed_at: Date.now(),
            training_error: null,
          });
        } else if (status.status === 'FAILED') {
          // Training failed
          await this.db.updateFace(faceId, {
            training_status: 'failed',
            training_error: status.error?.message || 'Training failed',
            training_completed_at: Date.now(),
          });
        } else {
          // Still in progress, continue polling
          setTimeout(poll, this.trainingPollingInterval);
        }
      } catch (error) {
        console.error(`Failed to poll training job ${jobId}:`, error);
        // Continue polling despite errors
        setTimeout(poll, this.trainingPollingInterval);
      }
    };

    // Start polling
    setTimeout(poll, this.trainingPollingInterval);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private mapFalStatusToTrainingStatus(status: string): 'pending' | 'training' | 'ready' | 'failed' {
    switch (status) {
      case 'IN_QUEUE':
        return 'pending';
      case 'IN_PROGRESS':
        return 'training';
      case 'COMPLETED':
        return 'ready';
      case 'FAILED':
        return 'failed';
      default:
        return 'training';
    }
  }

  private estimateProgress(status: string): number {
    switch (status) {
      case 'IN_QUEUE':
        return 0;
      case 'IN_PROGRESS':
        return 50;
      case 'COMPLETED':
        return 100;
      case 'FAILED':
        return 0;
      default:
        return 0;
    }
  }
}
