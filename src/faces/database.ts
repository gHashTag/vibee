/**
 * Avatar Faces - Database Layer
 * SQL queries and database utilities for face management
 */

import { IAgentRuntime, IDatabaseAdapter } from '@elizaos/core';
import { AvatarFaceEntity, FaceGenerationEntity, AvatarFace } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Database Schema Initialization
// ============================================================================

export const AVATAR_FACES_SCHEMA = `
CREATE TABLE IF NOT EXISTS avatar_faces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    lora_url TEXT NOT NULL,

    training_status TEXT CHECK(training_status IN ('pending', 'training', 'ready', 'failed')) DEFAULT 'ready',
    training_job_id TEXT,
    training_started_at INTEGER,
    training_completed_at INTEGER,
    training_error TEXT,

    source_images_url TEXT,
    source_images_count INTEGER,

    is_default INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_used_at INTEGER,

    description TEXT,
    tags TEXT,
    model_version TEXT DEFAULT 'flux-lora-v1',

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_avatar_faces_user_id ON avatar_faces(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_faces_training_status ON avatar_faces(training_status);
CREATE INDEX IF NOT EXISTS idx_avatar_faces_is_default ON avatar_faces(user_id, is_default);

CREATE TABLE IF NOT EXISTS face_generations (
    id TEXT PRIMARY KEY,
    face_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    model_used TEXT NOT NULL,
    generation_time_ms INTEGER,
    created_at INTEGER NOT NULL,

    FOREIGN KEY (face_id) REFERENCES avatar_faces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_face_generations_face_id ON face_generations(face_id);
CREATE INDEX IF NOT EXISTS idx_face_generations_user_id ON face_generations(user_id);
`;

// ============================================================================
// Database Adapter Interface
// ============================================================================

export interface FaceDatabase {
  // Face CRUD operations
  createFace(face: Omit<AvatarFaceEntity, 'created_at' | 'updated_at'>): Promise<AvatarFaceEntity>;
  getFaceById(id: string): Promise<AvatarFaceEntity | null>;
  getFaceByName(userId: string, name: string): Promise<AvatarFaceEntity | null>;
  getDefaultFace(userId: string): Promise<AvatarFaceEntity | null>;
  listFaces(userId: string, options?: ListFacesQueryOptions): Promise<AvatarFaceEntity[]>;
  updateFace(id: string, updates: Partial<AvatarFaceEntity>): Promise<boolean>;
  deleteFace(id: string): Promise<boolean>;
  setDefaultFace(userId: string, faceId: string): Promise<boolean>;
  incrementUsageCount(faceId: string): Promise<void>;

  // Generation history
  recordGeneration(generation: Omit<FaceGenerationEntity, 'created_at'>): Promise<FaceGenerationEntity>;
  getGenerationHistory(faceId: string, limit?: number): Promise<FaceGenerationEntity[]>;

  // Statistics
  getTotalFacesCount(userId: string): Promise<number>;
  getTrainingStats(userId: string): Promise<TrainingStats>;
}

export interface ListFacesQueryOptions {
  status?: string;
  includeTraining?: boolean;
  limit?: number;
  offset?: number;
}

export interface TrainingStats {
  total: number;
  pending: number;
  training: number;
  ready: number;
  failed: number;
}

// ============================================================================
// SQL Database Implementation
// ============================================================================

export class FaceDatabaseAdapter implements FaceDatabase {
  constructor(private db: IDatabaseAdapter) {}

  /**
   * Initialize database schema
   */
  static async initialize(runtime: IAgentRuntime): Promise<void> {
    const db = runtime.databaseAdapter;

    // Execute schema creation
    const statements = AVATAR_FACES_SCHEMA.split(';').filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await db.run(statement);
      }
    }
  }

  // ============================================================================
  // Face CRUD Operations
  // ============================================================================

  async createFace(face: Omit<AvatarFaceEntity, 'created_at' | 'updated_at'>): Promise<AvatarFaceEntity> {
    const now = Date.now();
    const entity: AvatarFaceEntity = {
      ...face,
      created_at: now,
      updated_at: now,
    };

    await this.db.run(
      `INSERT INTO avatar_faces (
        id, user_id, name, trigger_word, lora_url,
        training_status, training_job_id, training_started_at, training_completed_at, training_error,
        source_images_url, source_images_count,
        is_default, usage_count, last_used_at,
        description, tags, model_version,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.id,
        entity.user_id,
        entity.name,
        entity.trigger_word,
        entity.lora_url,
        entity.training_status,
        entity.training_job_id,
        entity.training_started_at,
        entity.training_completed_at,
        entity.training_error,
        entity.source_images_url,
        entity.source_images_count,
        entity.is_default,
        entity.usage_count,
        entity.last_used_at,
        entity.description,
        entity.tags,
        entity.model_version,
        entity.created_at,
        entity.updated_at,
      ]
    );

    return entity;
  }

  async getFaceById(id: string): Promise<AvatarFaceEntity | null> {
    const result = await this.db.get<AvatarFaceEntity>('SELECT * FROM avatar_faces WHERE id = ?', [id]);

    return result || null;
  }

  async getFaceByName(userId: string, name: string): Promise<AvatarFaceEntity | null> {
    const result = await this.db.get<AvatarFaceEntity>('SELECT * FROM avatar_faces WHERE user_id = ? AND name = ?', [
      userId,
      name,
    ]);

    return result || null;
  }

  async getDefaultFace(userId: string): Promise<AvatarFaceEntity | null> {
    const result = await this.db.get<AvatarFaceEntity>(
      'SELECT * FROM avatar_faces WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [userId]
    );

    return result || null;
  }

  async listFaces(userId: string, options: ListFacesQueryOptions = {}): Promise<AvatarFaceEntity[]> {
    const { status, includeTraining = true, limit = 50, offset = 0 } = options;

    let query = 'SELECT * FROM avatar_faces WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND training_status = ?';
      params.push(status);
    }

    if (!includeTraining) {
      query += " AND training_status NOT IN ('pending', 'training')";
    }

    query += ' ORDER BY is_default DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await this.db.all<AvatarFaceEntity>(query, params);

    return results || [];
  }

  async updateFace(id: string, updates: Partial<AvatarFaceEntity>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic UPDATE query
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    const query = `UPDATE avatar_faces SET ${fields.join(', ')} WHERE id = ?`;
    await this.db.run(query, values);

    return true;
  }

  async deleteFace(id: string): Promise<boolean> {
    await this.db.run('DELETE FROM avatar_faces WHERE id = ?', [id]);
    return true;
  }

  async setDefaultFace(userId: string, faceId: string): Promise<boolean> {
    // First, unset all defaults for this user
    await this.db.run('UPDATE avatar_faces SET is_default = 0 WHERE user_id = ?', [userId]);

    // Then set the new default
    await this.db.run('UPDATE avatar_faces SET is_default = 1, updated_at = ? WHERE id = ?', [Date.now(), faceId]);

    return true;
  }

  async incrementUsageCount(faceId: string): Promise<void> {
    await this.db.run(
      'UPDATE avatar_faces SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?',
      [Date.now(), Date.now(), faceId]
    );
  }

  // ============================================================================
  // Generation History
  // ============================================================================

  async recordGeneration(generation: Omit<FaceGenerationEntity, 'created_at'>): Promise<FaceGenerationEntity> {
    const entity: FaceGenerationEntity = {
      ...generation,
      created_at: Date.now(),
    };

    await this.db.run(
      `INSERT INTO face_generations (
        id, face_id, user_id, prompt, image_url, model_used, generation_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.id,
        entity.face_id,
        entity.user_id,
        entity.prompt,
        entity.image_url,
        entity.model_used,
        entity.generation_time_ms,
        entity.created_at,
      ]
    );

    return entity;
  }

  async getGenerationHistory(faceId: string, limit: number = 10): Promise<FaceGenerationEntity[]> {
    const results = await this.db.all<FaceGenerationEntity>(
      'SELECT * FROM face_generations WHERE face_id = ? ORDER BY created_at DESC LIMIT ?',
      [faceId, limit]
    );

    return results || [];
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async getTotalFacesCount(userId: string): Promise<number> {
    const result = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM avatar_faces WHERE user_id = ?', [
      userId,
    ]);

    return result?.count || 0;
  }

  async getTrainingStats(userId: string): Promise<TrainingStats> {
    const results = await this.db.all<{ training_status: string; count: number }>(
      'SELECT training_status, COUNT(*) as count FROM avatar_faces WHERE user_id = ? GROUP BY training_status',
      [userId]
    );

    const stats: TrainingStats = {
      total: 0,
      pending: 0,
      training: 0,
      ready: 0,
      failed: 0,
    };

    for (const row of results || []) {
      stats.total += row.count;
      stats[row.training_status as keyof TrainingStats] = row.count;
    }

    return stats;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function entityToModel(entity: AvatarFaceEntity): AvatarFace {
  return {
    id: entity.id,
    userId: entity.user_id,
    name: entity.name,
    triggerWord: entity.trigger_word,
    loraUrl: entity.lora_url,

    trainingStatus: entity.training_status,
    trainingJobId: entity.training_job_id || undefined,
    trainingStartedAt: entity.training_started_at || undefined,
    trainingCompletedAt: entity.training_completed_at || undefined,
    trainingError: entity.training_error || undefined,

    sourceImagesUrl: entity.source_images_url || undefined,
    sourceImagesCount: entity.source_images_count || undefined,

    isDefault: entity.is_default === 1,
    usageCount: entity.usage_count,
    lastUsedAt: entity.last_used_at || undefined,

    description: entity.description || undefined,
    tags: entity.tags ? JSON.parse(entity.tags) : undefined,
    modelVersion: entity.model_version,

    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

export function modelToEntity(model: Partial<AvatarFace>): Partial<AvatarFaceEntity> {
  const entity: Partial<AvatarFaceEntity> = {};

  if (model.id) entity.id = model.id;
  if (model.userId) entity.user_id = model.userId;
  if (model.name) entity.name = model.name;
  if (model.triggerWord) entity.trigger_word = model.triggerWord;
  if (model.loraUrl) entity.lora_url = model.loraUrl;

  if (model.trainingStatus) entity.training_status = model.trainingStatus;
  if (model.trainingJobId) entity.training_job_id = model.trainingJobId;
  if (model.trainingStartedAt) entity.training_started_at = model.trainingStartedAt;
  if (model.trainingCompletedAt) entity.training_completed_at = model.trainingCompletedAt;
  if (model.trainingError) entity.training_error = model.trainingError;

  if (model.sourceImagesUrl) entity.source_images_url = model.sourceImagesUrl;
  if (model.sourceImagesCount) entity.source_images_count = model.sourceImagesCount;

  if (model.isDefault !== undefined) entity.is_default = model.isDefault ? 1 : 0;
  if (model.usageCount !== undefined) entity.usage_count = model.usageCount;
  if (model.lastUsedAt) entity.last_used_at = model.lastUsedAt;

  if (model.description) entity.description = model.description;
  if (model.tags) entity.tags = JSON.stringify(model.tags);
  if (model.modelVersion) entity.model_version = model.modelVersion;

  if (model.createdAt) entity.created_at = model.createdAt;
  if (model.updatedAt) entity.updated_at = model.updatedAt;

  return entity;
}
