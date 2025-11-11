/**
 * Neurophoto Database Schema
 * Multi-provider support schema
 */

import { IAgentRuntime } from '@elizaos/core';

export const NEUROPHOTO_SCHEMA = `
-- ============================================================================
-- Providers Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('fal', 'replicate', 'stability', 'openai', 'midjourney')),
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1 CHECK(enabled IN (0, 1)),
    priority INTEGER DEFAULT 0,
    config TEXT NOT NULL, -- JSON string with provider configuration
    status TEXT CHECK(status IN ('active', 'disabled', 'error', 'rate_limited')) DEFAULT 'active',
    last_health_check INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    UNIQUE(type, name)
);

CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(enabled);
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);

-- ============================================================================
-- Avatar Faces Table (Extended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS avatar_faces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    lora_url TEXT NOT NULL,

    -- Provider association
    provider_id TEXT,
    preferred_provider TEXT CHECK(preferred_provider IN ('fal', 'replicate', 'stability', 'openai', 'midjourney')),

    -- Training metadata
    training_status TEXT CHECK(training_status IN ('pending', 'training', 'ready', 'failed')) DEFAULT 'ready',
    training_job_id TEXT,
    training_provider TEXT CHECK(training_provider IN ('fal', 'replicate', 'stability', 'openai', 'midjourney')),
    training_started_at INTEGER,
    training_completed_at INTEGER,
    training_error TEXT,

    -- Source data
    source_images_url TEXT,
    source_images_count INTEGER,

    -- Usage tracking
    is_default INTEGER DEFAULT 0 CHECK(is_default IN (0, 1)),
    usage_count INTEGER DEFAULT 0,
    last_used_at INTEGER,

    -- Metadata
    description TEXT,
    tags TEXT, -- JSON array
    model_version TEXT DEFAULT 'flux-lora-v1',

    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    UNIQUE(user_id, name),
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_avatar_faces_user_id ON avatar_faces(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_faces_training_status ON avatar_faces(training_status);
CREATE INDEX IF NOT EXISTS idx_avatar_faces_is_default ON avatar_faces(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_avatar_faces_provider_id ON avatar_faces(provider_id);

-- ============================================================================
-- Generation History Table (Extended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS generation_history (
    id TEXT PRIMARY KEY,
    face_id TEXT,
    user_id TEXT NOT NULL,

    -- Generation details
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    negative_prompt TEXT,
    image_url TEXT NOT NULL,

    -- Provider info
    provider_id TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK(provider_type IN ('fal', 'replicate', 'stability', 'openai', 'midjourney')),
    model_used TEXT NOT NULL,

    -- Performance metrics
    generation_time_ms INTEGER,
    cost REAL,

    -- Generation parameters (JSON)
    config TEXT, -- Full generation config as JSON

    -- Metadata
    seed INTEGER,
    width INTEGER,
    height INTEGER,
    content_type TEXT,

    -- Safety
    has_nsfw_concepts INTEGER,
    safety_score REAL,

    -- Timestamps
    created_at INTEGER NOT NULL,

    FOREIGN KEY (face_id) REFERENCES avatar_faces(id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_generation_history_face_id ON generation_history(face_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_provider_id ON generation_history(provider_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at DESC);

-- ============================================================================
-- Provider Statistics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_stats (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,

    -- Usage statistics
    total_generations INTEGER DEFAULT 0,
    successful_generations INTEGER DEFAULT 0,
    failed_generations INTEGER DEFAULT 0,

    -- Performance metrics
    avg_generation_time_ms INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0.0,

    -- Period
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,

    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_provider_stats_provider_id ON provider_stats(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_stats_period ON provider_stats(period_start, period_end);

-- ============================================================================
-- Provider Health Log Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_health_log (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('healthy', 'unhealthy', 'rate_limited', 'error')) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at INTEGER NOT NULL,

    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_provider_health_log_provider_id ON provider_health_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_health_log_checked_at ON provider_health_log(checked_at DESC);
`;

/**
 * Initialize database schema
 */
export async function initializeNeurophotoSchema(runtime: IAgentRuntime): Promise<void> {
  console.log('[Neurophoto] Initializing database schema...');

  // Execute schema creation
  const statements = NEUROPHOTO_SCHEMA.split(';').filter((s) => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await runtime.run(statement);
      } catch (error) {
        console.error('[Neurophoto] Failed to execute statement:', error);
        console.error('Statement:', statement.substring(0, 100));
        throw error;
      }
    }
  }

  console.log('[Neurophoto] Database schema initialized successfully');
}

/**
 * Migrate from old schema to new schema
 */
export async function migrateNeurophotoSchema(runtime: IAgentRuntime): Promise<void> {
  console.log('[Neurophoto] Checking for schema migrations...');

  // Check if old face_generations table exists
  const oldTableExists = await runtime.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='face_generations'"
  );

  if (oldTableExists && oldTableExists.count > 0) {
    console.log('[Neurophoto] Migrating from old schema...');

    // Create new generation_history table if doesn't exist
    await runtime.run(
      NEUROPHOTO_SCHEMA.split(';').find((s) => s.includes('CREATE TABLE IF NOT EXISTS generation_history')) || ''
    );

    // Migrate data
    await runtime.run(`
      INSERT OR IGNORE INTO generation_history (
        id, face_id, user_id, prompt, enhanced_prompt, image_url,
        provider_id, provider_type, model_used, generation_time_ms,
        created_at
      )
      SELECT
        id, face_id, user_id, prompt, prompt as enhanced_prompt, image_url,
        'fal-default' as provider_id, 'fal' as provider_type, model_used, generation_time_ms,
        created_at
      FROM face_generations
    `);

    console.log('[Neurophoto] Migration completed');
  }
}
