# Avatar Faces System - Architecture Documentation

## 1. System Overview

Avatar Faces is a comprehensive LoRA-based personalization system for AI image generation in Vibee bot.

```
┌─────────────────────────────────────────────────────────────┐
│                     Avatar Faces System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Actions   │  │   Services   │  │   Database   │       │
│  │             │  │              │  │              │       │
│  │ • Manage    │─▶│ Face Manager │─▶│ SQLite/PG    │       │
│  │ • Train     │  │ LoRA Trainer │  │              │       │
│  │ • Generate  │  │ FAL MCP      │  └──────────────┘       │
│  └─────────────┘  └──────────────┘                          │
│                          │                                   │
│                          ▼                                   │
│                   ┌─────────────┐                           │
│                   │  FAL.AI API │                           │
│                   │  (MCP)      │                           │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## 2. Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐
│   accounts       │         │  avatar_faces    │
│                  │         │                  │
│ • id (PK)        │◀────────│ • id (PK)        │
│ • username       │   1:N   │ • user_id (FK)   │
│ • ...            │         │ • name           │
└──────────────────┘         │ • trigger_word   │
                              │ • lora_url       │
                              │ • training_status│
                              │ • is_default     │
                              │ • ...            │
                              └──────────────────┘
                                       │
                                       │ 1:N
                                       ▼
                              ┌──────────────────┐
                              │ face_generations │
                              │                  │
                              │ • id (PK)        │
                              │ • face_id (FK)   │
                              │ • user_id (FK)   │
                              │ • prompt         │
                              │ • image_url      │
                              │ • ...            │
                              └──────────────────┘
```

### Table: avatar_faces

| Column                 | Type    | Description                     |
| ---------------------- | ------- | ------------------------------- |
| id                     | TEXT    | Primary key (UUID)              |
| user_id                | TEXT    | Foreign key to accounts         |
| name                   | TEXT    | Face name (unique per user)     |
| trigger_word           | TEXT    | LoRA trigger word               |
| lora_url               | TEXT    | URL to trained LoRA model       |
| training_status        | TEXT    | pending/training/ready/failed   |
| training_job_id        | TEXT    | FAL.AI job ID                   |
| training_started_at    | INTEGER | Training start timestamp        |
| training_completed_at  | INTEGER | Training completion timestamp   |
| training_error         | TEXT    | Error message if failed         |
| source_images_url      | TEXT    | URL to source photos ZIP        |
| source_images_count    | INTEGER | Number of training images       |
| is_default             | INTEGER | Is this the default face? (0/1) |
| usage_count            | INTEGER | Times used for generation       |
| last_used_at           | INTEGER | Last usage timestamp            |
| description            | TEXT    | Optional description            |
| tags                   | TEXT    | JSON array of tags              |
| model_version          | TEXT    | LoRA model version              |
| created_at             | INTEGER | Record creation timestamp       |
| updated_at             | INTEGER | Last update timestamp           |

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_avatar_faces_user_id ON avatar_faces(user_id);
CREATE INDEX idx_avatar_faces_training_status ON avatar_faces(training_status);
CREATE INDEX idx_avatar_faces_is_default ON avatar_faces(user_id, is_default);

-- Generation history indexes
CREATE INDEX idx_face_generations_face_id ON face_generations(face_id);
CREATE INDEX idx_face_generations_user_id ON face_generations(user_id);
```

## 3. Service Layer Architecture

### Class Diagram

```
┌──────────────────────────────────────────┐
│         FaceManagerService               │
├──────────────────────────────────────────┤
│ + createFace(input)                      │
│ + getFaceById(id)                        │
│ + getFaceByName(userId, name)            │
│ + getDefaultFace(userId)                 │
│ + listFaces(options)                     │
│ + updateFace(id, updates)                │
│ + deleteFace(id)                         │
│ + setDefaultFace(userId, faceId)         │
│ + recordUsage(faceId)                    │
│ + getTrainingStats(userId)               │
└──────────────────────────────────────────┘
                    ▲
                    │ uses
                    │
┌──────────────────────────────────────────┐
│        LoraTrainingService               │
├──────────────────────────────────────────┤
│ + startTraining(input)                   │
│ + getTrainingProgress(faceId)            │
│ + cancelTraining(faceId)                 │
│ + retryTraining(faceId)                  │
│ - submitTrainingJob(config)              │
│ - checkTrainingStatus(jobId)             │
│ - startPollingJob(faceId, jobId)         │
└──────────────────────────────────────────┘
                    │
                    │ uses
                    ▼
┌──────────────────────────────────────────┐
│          FalMcpService                   │
├──────────────────────────────────────────┤
│ + generateWithFace(input)                │
│ + generateRaw(prompt, model, config)     │
│ + getAvailableModels()                   │
│ + isLoraSupported(model)                 │
│ + getGenerationHistory(faceId, limit)    │
│ - callFalModel(endpoint, config)         │
│ - injectTriggerWord(prompt, trigger)     │
└──────────────────────────────────────────┘
```

### Service Responsibilities

#### FaceManagerService

**Purpose:** CRUD operations for avatar faces

**Responsibilities:**

- Create, read, update, delete faces
- Manage default face selection
- Track face usage statistics
- Query face by name or ID

**Dependencies:**

- FaceDatabaseAdapter

#### LoraTrainingService

**Purpose:** Asynchronous LoRA model training

**Responsibilities:**

- Submit training jobs to FAL.AI
- Poll training status
- Handle training failures
- Support training retry

**Dependencies:**

- FaceManagerService
- FaceDatabaseAdapter
- FAL.AI API

#### FalMcpService

**Purpose:** Image generation through Model Context Protocol

**Responsibilities:**

- Generate images with LoRA faces
- Support raw generation (no LoRA)
- Inject trigger words into prompts
- Record generation history
- Flexible model selection

**Dependencies:**

- FaceManagerService
- FaceDatabaseAdapter
- FAL.AI API (MCP)

## 4. Action Flow Diagrams

### Face Management Flow

```
User                  Action                Service               Database
 │                      │                      │                      │
 │──/faces─────────────▶│                      │                      │
 │                      │──listFaces──────────▶│                      │
 │                      │                      │──SELECT *────────────▶│
 │                      │                      │◀─────faces───────────│
 │                      │◀─────faces───────────│                      │
 │◀─face list───────────│                      │                      │
 │                      │                      │                      │
 │──/face add ─────────▶│                      │                      │
 │                      │──createFace─────────▶│                      │
 │                      │                      │──INSERT──────────────▶│
 │                      │◀─────face────────────│                      │
 │◀─success─────────────│                      │                      │
 │                      │                      │                      │
 │──/face use ─────────▶│                      │                      │
 │                      │──setDefaultFace─────▶│                      │
 │                      │                      │──UPDATE──────────────▶│
 │                      │◀─────ok──────────────│                      │
 │◀─success─────────────│                      │                      │
```

### Training Flow

```
User            TrainAction      TrainingService      FaceManager      FAL.AI        Database
 │                  │                  │                  │              │               │
 │──/face train────▶│                  │                  │              │               │
 │                  │──startTraining──▶│                  │              │               │
 │                  │                  │──submitJob──────────────────────▶│               │
 │                  │                  │◀─────jobId──────────────────────│               │
 │                  │                  │──createFace──────▶│              │               │
 │                  │                  │                  │──INSERT──────────────────────▶│
 │                  │◀─────face────────│                  │              │               │
 │◀─training started│                  │                  │              │               │
 │                  │                  │                  │              │               │
 │                  │                  │──startPolling────│              │               │
 │                  │                  │    (background)  │              │               │
 │                  │                  │                  │              │               │
 │                  │                  │──checkStatus─────────────────────▶│              │
 │                  │                  │◀─────status──────────────────────│               │
 │                  │                  │                  │              │               │
 │                  │                  │  [10s interval]  │              │               │
 │                  │                  │                  │              │               │
 │                  │                  │──checkStatus─────────────────────▶│              │
 │                  │                  │◀─COMPLETED + URL─────────────────│               │
 │                  │                  │──updateFace──────▶│              │               │
 │                  │                  │                  │──UPDATE──────────────────────▶│
 │◀─[notification]──│◀─────────────────│                  │              │               │
```

### Generation Flow

```
User          NeurophotoAction    FalMcpService    FaceManager    FAL.AI    Database
 │                  │                  │                │            │           │
 │──/neurophoto────▶│                  │                │            │           │
 │                  │──parseCommand────│                │            │           │
 │                  │──generateWithFace▶│                │            │           │
 │                  │                  │──getFace───────▶│            │           │
 │                  │                  │                │──SELECT────────────────▶│
 │                  │                  │◀─────face──────│            │           │
 │                  │                  │──injectTrigger─│            │           │
 │                  │                  │──callFalModel──────────────▶│           │
 │                  │                  │◀─────image─────────────────│           │
 │                  │                  │──recordGeneration───────────────────────▶│
 │                  │                  │──recordUsage────▶│            │           │
 │                  │◀─image + metadata│                │            │           │
 │◀─image───────────│                  │                │            │           │
```

## 5. Command Reference

### Face Management Commands

| Command                                   | Description                  | Example                                       |
| ----------------------------------------- | ---------------------------- | --------------------------------------------- |
| `/faces`                                  | List all faces               | `/faces`                                      |
| `/face add <name> <url> <trigger>`        | Add pre-trained LoRA         | `/face add Pro https://... prof_me`           |
| `/face train <name> <zip> <trigger>`      | Train new LoRA               | `/face train Casual https://photos.zip me`    |
| `/face use <name>`                        | Set default face             | `/face use Professional`                      |
| `/face delete <name>`                     | Delete face                  | `/face delete OldFace`                        |
| `/face status [name]`                     | Check training status        | `/face status Professional`                   |
| `/neurophoto <prompt>`                    | Generate with default face   | `/neurophoto sunset over ocean`               |
| `/neurophoto face:<name> <prompt>`        | Generate with specific face  | `/neurophoto face:Pro in suit`                |
| `/neurophoto raw <prompt>`                | Generate without LoRA        | `/neurophoto raw beautiful landscape`         |
| `/neurophoto size:portrait_16_9 <prompt>` | Generate with custom size    | `/neurophoto size:square_hd at coffee shop`   |

## 6. Integration Points

### Environment Variables

```bash
# Required for image generation and training
FAL_KEY=fal_key_...

# Optional: Default LoRA configuration (legacy support)
FAL_DEFAULT_LORA_PATH=https://storage.fal.ai/...
FAL_LORA_TRIGGER=NEURO_SAGE
FAL_DEFAULT_LORA_SCALE=1.0
```

### ElizaOS Plugin Registration

```typescript
// src/character.ts
import avatarFacesPlugin from './faces';

export const character: Character = {
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',

    // Avatar Faces System
    avatarFacesPlugin,
  ],
};
```

## 7. Migration Plan

### Phase 1: Database Setup

1. Run database migration to create tables
2. Initialize indexes
3. Test database connectivity

### Phase 2: Service Deployment

1. Deploy FaceManagerService
2. Deploy LoraTrainingService
3. Deploy FalMcpService
4. Verify service registration

### Phase 3: Action Integration

1. Add ManageFacesAction
2. Add TrainLoraAction
3. Update neurophoto-action to EnhancedNeurophotoAction
4. Test action validation

### Phase 4: Migration Strategy

**Option A: Gradual Migration (Recommended)**

```typescript
// Keep old neurophoto-action.ts active
// Add new EnhancedNeurophotoAction alongside
// Users can use both during transition

plugins: [
  // ... core plugins
  avatarFacesPlugin, // New system
];

actions: [
  neurophotoAction, // Legacy (still works)
  enhancedNeurophotoAction, // New (optional)
];
```

**Option B: Complete Migration**

```typescript
// Replace neurophoto-action.ts completely
// All users must have faces configured

plugins: [
  // ... core plugins
  avatarFacesPlugin, // New system only
];

actions: [
  enhancedNeurophotoAction, // New (required)
];
```

**Recommended Approach: Option A**

- Zero downtime
- Backward compatible
- Users can migrate at their own pace
- Test new system in production safely

### Phase 5: User Migration

1. Announce new feature
2. Guide users to add faces
3. Provide migration tools
4. Monitor adoption
5. Eventually deprecate legacy

## 8. Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- Efficient pagination for face lists
- Connection pooling for concurrent requests

### Training Optimization

- Background polling (non-blocking)
- Exponential backoff for API calls
- Queue system for multiple trainings

### Generation Optimization

- Cache frequently used faces
- Reuse LoRA URLs
- Batch generation requests

## 9. Security Considerations

### API Key Protection

- Store FAL_KEY in environment variables
- Never log API keys
- Rotate keys periodically

### User Data Protection

- Validate all user inputs
- Sanitize file URLs
- Prevent SQL injection
- Rate limiting on training

### Access Control

- Users can only access their own faces
- Cascade delete on user removal
- Audit trail for training

## 10. Error Handling

### Training Failures

```typescript
{
  code: 'TRAINING_FAILED',
  message: 'Failed to train LoRA model',
  details: {
    jobId: '...',
    error: '...',
    retryable: true
  }
}
```

### Generation Failures

```typescript
{
  code: 'GENERATION_FAILED',
  message: 'Failed to generate image',
  details: {
    faceId: '...',
    prompt: '...',
    error: '...'
  }
}
```

### Database Failures

```typescript
{
  code: 'DATABASE_ERROR',
  message: 'Database operation failed',
  details: {
    operation: 'INSERT',
    table: 'avatar_faces',
    error: '...'
  }
}
```

## 11. Testing Strategy

### Unit Tests

- Service methods
- Database queries
- Utility functions

### Integration Tests

- Action flow end-to-end
- Service interactions
- Database transactions

### E2E Tests

- User commands
- Image generation
- Training workflow

## 12. Monitoring & Observability

### Metrics to Track

- Training success rate
- Training duration
- Generation latency
- Face usage statistics
- Error rates

### Logging

- Structured logging with context
- Training job lifecycle
- Generation requests
- Error stack traces

### Alerts

- Training failures
- API quota exceeded
- Database errors
- High latency

## 13. Future Enhancements

### Planned Features

1. **Face Categories**
   - Organize faces by type (professional, casual, etc.)
   - Bulk operations

2. **Face Sharing**
   - Share LoRA models between users
   - Public face gallery

3. **Advanced Training**
   - Custom training parameters
   - Style transfer
   - Face mixing

4. **Generation Presets**
   - Save prompt templates
   - Style presets per face

5. **Analytics Dashboard**
   - Usage statistics
   - Popular faces
   - Cost tracking

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Maintainer:** Vibee Team
