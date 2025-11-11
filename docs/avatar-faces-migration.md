# Avatar Faces System - Migration Guide

This guide provides step-by-step instructions for migrating from the legacy neurophoto system to the new Avatar Faces system.

## Migration Overview

```
┌──────────────────────┐         ┌──────────────────────┐
│   Legacy System      │         │  Avatar Faces System │
│                      │         │                      │
│ • Single LoRA        │   ───▶  │ • Multiple faces     │
│ • ENV config         │         │ • Database storage   │
│ • Manual trigger     │         │ • Auto management    │
│ • No training        │         │ • Built-in training  │
└──────────────────────┘         └──────────────────────┘
```

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Database Migration](#database-migration)
4. [Service Integration](#service-integration)
5. [Action Migration](#action-migration)
6. [Testing](#testing)
7. [Rollback Plan](#rollback-plan)
8. [FAQ](#faq)

---

## Prerequisites

### Required

- ✅ ElizaOS project with `@elizaos/plugin-sql`
- ✅ Existing neurophoto-action.ts (optional)
- ✅ FAL.AI API key (`FAL_KEY`)
- ✅ Node.js 18+ and bun package manager

### Optional (Legacy Compatibility)

- `FAL_DEFAULT_LORA_PATH` - Will be migrated to first face
- `FAL_LORA_TRIGGER` - Will be used as default trigger
- `FAL_DEFAULT_LORA_SCALE` - Will be ignored (always 1.0 in new system)

---

## Step-by-Step Migration

### Step 1: Install Avatar Faces System

The system is already structured as a self-contained module in `/src/faces/`.

**File Structure:**

```
src/
  faces/                          # ✨ NEW
    types.ts                      # Type definitions
    database.ts                   # Database layer
    services/
      FaceManagerService.ts       # CRUD operations
      LoraTrainingService.ts      # Training logic
      FalMcpService.ts            # Image generation
    actions/
      ManageFacesAction.ts        # /face commands
      TrainLoraAction.ts          # /face train
      EnhancedNeurophotoAction.ts # Enhanced /neurophoto
    index.ts                      # Plugin export

  neurophoto-action.ts            # 🔄 KEEP (legacy support)
```

### Step 2: Database Migration

**Run database initialization:**

```typescript
// This is handled automatically by the plugin
// But you can manually verify with:

import { FaceDatabaseAdapter } from './faces/database';

// In your initialization code:
await FaceDatabaseAdapter.initialize(runtime);
```

**Verify tables created:**

```bash
# If using SQLite
sqlite3 data/db.sqlite

sqlite> .tables
# Should show: avatar_faces, face_generations

sqlite> .schema avatar_faces
# Should show the full schema
```

### Step 3: Plugin Registration

**Update your character configuration:**

```typescript
// src/character.ts
import { Character } from '@elizaos/core';
import avatarFacesPlugin from './faces'; // ✨ NEW

export const character: Character = {
  name: 'Vibee',

  plugins: [
    // Core plugins (required)
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',

    // ✨ Avatar Faces System (NEW)
    avatarFacesPlugin,

    // Other plugins...
  ],

  // ... rest of character config
};
```

### Step 4: Migrate Legacy LoRA (Optional)

If you have an existing LoRA configured via environment variables, migrate it to a face:

**Option A: Manual Migration (Recommended)**

Users can add their existing LoRA as the first face:

```bash
# Example with legacy NEURO_SAGE LoRA
/face add "NEURO_SAGE" "https://v3b.fal.media/files/b/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors" "NEURO_SAGE" "Legacy default LoRA"

# Set as default
/face use "NEURO_SAGE"
```

**Option B: Automatic Migration Script**

Create a migration script to automatically convert legacy config:

```typescript
// scripts/migrate-legacy-lora.ts
import { FaceManagerService } from '../src/faces/services/FaceManagerService';

async function migrateLegacyLora(runtime: IAgentRuntime, userId: string) {
  const legacyLoraPath = process.env.FAL_DEFAULT_LORA_PATH;
  const legacyTrigger = process.env.FAL_LORA_TRIGGER || 'NEURO_SAGE';

  if (!legacyLoraPath) {
    console.log('No legacy LoRA found, skipping migration');
    return;
  }

  const faceManager = runtime.getService<FaceManagerService>('face-manager' as any);

  // Check if already migrated
  const existing = await faceManager.getFaceByName(userId, legacyTrigger);
  if (existing.success) {
    console.log('Legacy LoRA already migrated');
    return;
  }

  // Create face from legacy config
  const result = await faceManager.createFace({
    userId,
    name: legacyTrigger,
    triggerWord: legacyTrigger,
    loraUrl: legacyLoraPath,
    description: 'Migrated from legacy configuration',
    setAsDefault: true,
  });

  if (result.success) {
    console.log(`✅ Migrated legacy LoRA as "${legacyTrigger}" face`);
  } else {
    console.error('❌ Failed to migrate legacy LoRA:', result.error);
  }
}
```

### Step 5: Action Configuration

**Choose your migration strategy:**

#### Strategy A: Gradual Migration (Recommended)

Keep both old and new actions active:

```typescript
// src/character.ts - NO CHANGES NEEDED
// neurophoto-action.ts remains active
// New faces actions are added via plugin
// Users can use both systems
```

**User Experience:**

- `/neurophoto <prompt>` - Legacy (uses ENV LoRA)
- `/face add ...` - New (manage faces)
- After adding faces, legacy still works

#### Strategy B: Full Replacement

Replace neurophoto-action completely:

```typescript
// 1. Remove old neurophoto import
// src/character.ts
// import { neurophotoAction } from './neurophoto-action'; // ❌ REMOVE

// 2. Plugin provides all actions automatically
import avatarFacesPlugin from './faces'; // ✅ NEW

export const character: Character = {
  plugins: [
    // ...
    avatarFacesPlugin, // Includes all face actions
  ],
  // No need to manually add actions
};

// 3. Optionally rename old file
// mv src/neurophoto-action.ts src/neurophoto-action.legacy.ts
```

**User Experience:**

- `/neurophoto <prompt>` - New (requires face setup)
- Users MUST add faces first
- Better experience long-term

---

## Database Migration

### Schema Creation

The database schema is automatically created when the plugin initializes:

```sql
-- Automatically executed by FaceDatabaseAdapter.initialize()

CREATE TABLE IF NOT EXISTS avatar_faces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    lora_url TEXT NOT NULL,
    training_status TEXT DEFAULT 'ready',
    -- ... (see full schema in database.ts)
);

CREATE TABLE IF NOT EXISTS face_generations (
    id TEXT PRIMARY KEY,
    face_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    -- ... (see full schema in database.ts)
);
```

### Manual Migration (if needed)

If you need to manually run migrations:

```typescript
// scripts/run-migration.ts
import { FaceDatabaseAdapter } from '../src/faces/database';

async function runMigration(runtime: IAgentRuntime) {
  console.log('Running Avatar Faces migration...');

  await FaceDatabaseAdapter.initialize(runtime);

  console.log('✅ Migration complete');
}
```

### Verify Migration

```typescript
// scripts/verify-migration.ts
async function verifyMigration(db: IDatabaseAdapter) {
  // Check tables exist
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables);

  // Check indexes
  const indexes = await db.all("SELECT name FROM sqlite_master WHERE type='index'");
  console.log('Indexes:', indexes);

  // Test insert
  await db.run('INSERT INTO avatar_faces (...) VALUES (...)');
  console.log('✅ Database schema verified');
}
```

---

## Service Integration

### Service Registration

Services are automatically registered by the plugin. Verify with:

```typescript
// In any action or handler
const faceManager = runtime.getService<FaceManagerService>('face-manager' as any);
const loraTrainer = runtime.getService<LoraTrainingService>('lora-training' as any);
const falMcp = runtime.getService<FalMcpService>('fal-mcp' as any);

if (!faceManager) {
  throw new Error('FaceManagerService not registered');
}
```

### Service Dependencies

```
FaceManagerService
  └─ Requires: IDatabaseAdapter

LoraTrainingService
  ├─ Requires: IDatabaseAdapter
  ├─ Requires: FAL_KEY environment variable
  └─ Uses: FaceManagerService

FalMcpService
  ├─ Requires: IDatabaseAdapter
  ├─ Requires: FAL_KEY environment variable
  └─ Uses: FaceManagerService
```

---

## Action Migration

### Command Mapping

| Legacy Command           | New Command                        | Notes                   |
| ------------------------ | ---------------------------------- | ----------------------- |
| `/neurophoto <prompt>`   | `/neurophoto <prompt>`             | Uses default face       |
| N/A                      | `/neurophoto face:<name> <prompt>` | Use specific face       |
| N/A                      | `/neurophoto raw <prompt>`         | No LoRA                 |
| N/A                      | `/faces`                           | List faces              |
| N/A                      | `/face add ...`                    | Add face                |
| N/A                      | `/face train ...`                  | Train new face          |
| N/A                      | `/face use <name>`                 | Set default             |
| N/A                      | `/face delete <name>`              | Delete face             |

### Backward Compatibility

#### Keep Legacy neurophoto-action.ts

**Pros:**

- Zero breaking changes
- Users can migrate gradually
- Fallback if new system has issues

**Cons:**

- Two systems to maintain
- Potential confusion
- Legacy ENV variables still needed

#### Replace with EnhancedNeurophotoAction

**Pros:**

- Single unified system
- Better UX
- No legacy code

**Cons:**

- Breaking change for users
- Requires face setup first
- Migration effort

**Recommended:** Keep both during transition, deprecate legacy after 2-4 weeks.

---

## Testing

### Unit Tests

```typescript
// tests/faces/services/FaceManager.test.ts
import { FaceManagerService } from '../../../src/faces/services/FaceManagerService';

describe('FaceManagerService', () => {
  it('should create a face', async () => {
    const service = new FaceManagerService();
    const result = await service.createFace({
      userId: 'test-user',
      name: 'TestFace',
      triggerWord: 'test_trigger',
      loraUrl: 'https://example.com/lora.safetensors',
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('TestFace');
  });

  it('should prevent duplicate face names', async () => {
    // ... test implementation
  });
});
```

### Integration Tests

```typescript
// tests/faces/integration/full-workflow.test.ts
describe('Full Face Workflow', () => {
  it('should complete full lifecycle: add -> use -> generate -> delete', async () => {
    // 1. Add face
    const addResult = await manageFacesAction.handler(runtime, {
      content: { text: '/face add Test https://... test_trigger' },
      userId: 'test-user',
    });

    expect(addResult.success).toBe(true);

    // 2. Set as default
    const useResult = await manageFacesAction.handler(runtime, {
      content: { text: '/face use Test' },
      userId: 'test-user',
    });

    expect(useResult.success).toBe(true);

    // 3. Generate image
    const genResult = await enhancedNeurophotoAction.handler(runtime, {
      content: { text: '/neurophoto sunset' },
      userId: 'test-user',
    });

    expect(genResult.success).toBe(true);
    expect(genResult.data?.imageUrl).toBeDefined();

    // 4. Delete face
    const delResult = await manageFacesAction.handler(runtime, {
      content: { text: '/face delete Test' },
      userId: 'test-user',
    });

    expect(delResult.success).toBe(true);
  });
});
```

### E2E Tests

```bash
# Manual E2E test checklist

1. ✅ User can add a face
   /face add Professional https://example.com/lora.safetensors prof_me

2. ✅ User can list faces
   /faces

3. ✅ User can set default face
   /face use Professional

4. ✅ User can generate with default face
   /neurophoto sunset over ocean

5. ✅ User can generate with specific face
   /neurophoto face:Professional in a suit

6. ✅ User can start training
   /face train Casual https://example.com/photos.zip me

7. ✅ User can check training status
   /face status Casual

8. ✅ User can delete a face
   /face delete OldFace
```

---

## Rollback Plan

### If Issues Occur

**Step 1: Identify Issue**

- Check logs for errors
- Identify affected users
- Determine root cause

**Step 2: Quick Fix or Rollback**

**Option A: Quick Fix (Preferred)**

```typescript
// Fix the issue in the code
// Deploy hotfix
// No data loss
```

**Option B: Rollback Plugin**

```typescript
// src/character.ts
export const character: Character = {
  plugins: [
    // '@elizaos/plugin-bootstrap',
    // '@elizaos/plugin-sql',
    // avatarFacesPlugin,  // ❌ DISABLE
  ],
};

// Restart bot
```

**Option C: Full Rollback**

```bash
# 1. Remove faces directory
rm -rf src/faces

# 2. Remove plugin import
# Edit src/character.ts

# 3. Ensure legacy neurophoto-action.ts is active

# 4. Restart bot
elizaos start
```

### Data Preservation

**Database tables persist even if plugin disabled:**

```sql
-- Data is safe in database
SELECT COUNT(*) FROM avatar_faces;
SELECT COUNT(*) FROM face_generations;

-- Can re-enable plugin anytime
-- All data will be restored
```

---

## FAQ

### Q: Do I need to migrate immediately?

**A:** No, if you keep both systems active (Strategy A), users can migrate at their own pace.

### Q: What happens to my existing LoRA?

**A:** It continues to work via legacy neurophoto-action.ts. Users can manually add it as a face when ready.

### Q: Can I run both systems simultaneously?

**A:** Yes, this is the recommended approach for gradual migration.

### Q: How do I rollback if something goes wrong?

**A:** Disable the plugin in character.ts, restart bot. Database tables remain intact.

### Q: Will training cost money?

**A:** Yes, FAL.AI charges for training (typically $0.50-$1.00 per face). Generation costs remain the same.

### Q: How long does training take?

**A:** Typically 15-20 minutes per face.

### Q: Can users share faces?

**A:** Not in v1.0. This is a planned feature for v2.0.

### Q: What if FAL_KEY is missing?

**A:** Services will initialize but log warnings. Generation and training will fail with clear error messages.

### Q: Can I use PostgreSQL instead of SQLite?

**A:** Yes, the system works with any ElizaOS-supported database adapter.

### Q: How do I monitor training jobs?

**A:** Use `/face status <name>` or check logs for detailed training progress.

---

## Post-Migration Checklist

- [ ] Database tables created successfully
- [ ] Services registered and accessible
- [ ] Actions respond to commands
- [ ] Legacy system still works (if Strategy A)
- [ ] Users notified of new features
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback plan tested
- [ ] Team trained on new system

---

## Support

If you encounter issues during migration:

1. Check logs: `tail -f data/logs/latest.log`
2. Verify database: `sqlite3 data/db.sqlite .tables`
3. Test services: Use `/face status` command
4. Review this guide for troubleshooting

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Next Review:** After 30 days of production use
