/**
 * Face Manager Service
 * CRUD operations for avatar faces management
 */

import { Service, IAgentRuntime, ServiceType } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import {
  AvatarFace,
  CreateFaceInput,
  UpdateFaceInput,
  ListFacesOptions,
  FaceListResult,
  ServiceResult,
  FaceError,
  FaceErrorCode,
} from '../types';
import { FaceDatabaseAdapter, entityToModel } from '../database';

export class FaceManagerService extends Service {
  static serviceType: ServiceType = 'face-manager' as ServiceType;

  private db: FaceDatabaseAdapter;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.db = new FaceDatabaseAdapter(runtime.databaseAdapter);
  }

  // ============================================================================
  // Face Management
  // ============================================================================

  /**
   * Create a new face with pre-trained LoRA
   */
  async createFace(input: CreateFaceInput): Promise<ServiceResult<AvatarFace>> {
    try {
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

      // If this should be default, unset current default
      if (input.setAsDefault) {
        await this.db.setDefaultFace(input.userId, ''); // Will unset all defaults
      }

      // Create face entity
      const entity = await this.db.createFace({
        id: uuidv4(),
        user_id: input.userId,
        name: input.name,
        trigger_word: input.triggerWord,
        lora_url: input.loraUrl,
        training_status: 'ready',
        training_job_id: null,
        training_started_at: null,
        training_completed_at: null,
        training_error: null,
        source_images_url: null,
        source_images_count: null,
        is_default: input.setAsDefault ? 1 : 0,
        usage_count: 0,
        last_used_at: null,
        description: input.description || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        model_version: 'flux-lora-v1',
      });

      return {
        success: true,
        data: entityToModel(entity),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to create face',
          details: error,
        },
      };
    }
  }

  /**
   * Get face by ID
   */
  async getFaceById(faceId: string): Promise<ServiceResult<AvatarFace>> {
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

      return {
        success: true,
        data: entityToModel(entity),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to get face',
          details: error,
        },
      };
    }
  }

  /**
   * Get face by name for a user
   */
  async getFaceByName(userId: string, name: string): Promise<ServiceResult<AvatarFace>> {
    try {
      const entity = await this.db.getFaceByName(userId, name);

      if (!entity) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with name "${name}" not found`,
          },
        };
      }

      return {
        success: true,
        data: entityToModel(entity),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to get face',
          details: error,
        },
      };
    }
  }

  /**
   * Get default face for a user
   */
  async getDefaultFace(userId: string): Promise<ServiceResult<AvatarFace>> {
    try {
      const entity = await this.db.getDefaultFace(userId);

      if (!entity) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NO_DEFAULT_FACE,
            message: 'No default face set. Use /face use <name> to set one.',
          },
        };
      }

      return {
        success: true,
        data: entityToModel(entity),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to get default face',
          details: error,
        },
      };
    }
  }

  /**
   * List all faces for a user
   */
  async listFaces(options: ListFacesOptions): Promise<ServiceResult<FaceListResult>> {
    try {
      const { userId, includeTraining = true, status, limit = 50, offset = 0 } = options;

      const entities = await this.db.listFaces(userId, {
        status,
        includeTraining,
        limit: limit + 1, // Get one extra to check if there are more
        offset,
      });

      const hasMore = entities.length > limit;
      const faces = entities.slice(0, limit).map(entityToModel);

      const total = await this.db.getTotalFacesCount(userId);

      return {
        success: true,
        data: {
          faces,
          total,
          hasMore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to list faces',
          details: error,
        },
      };
    }
  }

  /**
   * Update face properties
   */
  async updateFace(faceId: string, updates: UpdateFaceInput): Promise<ServiceResult<AvatarFace>> {
    try {
      // Check if face exists
      const existing = await this.db.getFaceById(faceId);
      if (!existing) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      // Handle default flag specially
      if (updates.isDefault) {
        await this.db.setDefaultFace(existing.user_id, faceId);
      }

      // Build update object
      const updateEntity: any = {};
      if (updates.name) updateEntity.name = updates.name;
      if (updates.triggerWord) updateEntity.trigger_word = updates.triggerWord;
      if (updates.loraUrl) updateEntity.lora_url = updates.loraUrl;
      if (updates.description !== undefined) updateEntity.description = updates.description;
      if (updates.tags) updateEntity.tags = JSON.stringify(updates.tags);

      // Apply updates
      await this.db.updateFace(faceId, updateEntity);

      // Fetch updated entity
      const updated = await this.db.getFaceById(faceId);

      return {
        success: true,
        data: entityToModel(updated!),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to update face',
          details: error,
        },
      };
    }
  }

  /**
   * Delete a face
   */
  async deleteFace(faceId: string): Promise<ServiceResult<void>> {
    try {
      // Check if face exists
      const existing = await this.db.getFaceById(faceId);
      if (!existing) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      await this.db.deleteFace(faceId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to delete face',
          details: error,
        },
      };
    }
  }

  /**
   * Set face as default
   */
  async setDefaultFace(userId: string, faceId: string): Promise<ServiceResult<AvatarFace>> {
    try {
      // Check if face exists and belongs to user
      const entity = await this.db.getFaceById(faceId);
      if (!entity || entity.user_id !== userId) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.NOT_FOUND,
            message: `Face with ID "${faceId}" not found`,
          },
        };
      }

      await this.db.setDefaultFace(userId, faceId);

      const updated = await this.db.getFaceById(faceId);

      return {
        success: true,
        data: entityToModel(updated!),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.DATABASE_ERROR,
          message: 'Failed to set default face',
          details: error,
        },
      };
    }
  }

  /**
   * Increment usage count for a face
   */
  async recordUsage(faceId: string): Promise<void> {
    await this.db.incrementUsageCount(faceId);
  }

  /**
   * Get training statistics for a user
   */
  async getTrainingStats(userId: string) {
    return await this.db.getTrainingStats(userId);
  }
}
