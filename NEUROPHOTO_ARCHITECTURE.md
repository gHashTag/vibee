# Neurophoto Multi-Provider Architecture

Complete architecture documentation for Vibee's multi-provider image generation system.

## Overview

The Neurophoto system provides a flexible, extensible architecture for image generation across multiple AI providers. It supports automatic provider selection, fallback mechanisms, LoRA training, and comprehensive face management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Commands                            │
│  /neurophoto, /face, /provider, /trainlora                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Action Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │ Neurophoto   │  │ Manage       │  │ Manage          │      │
│  │ Action       │  │ Faces Action │  │ Providers Action│      │
│  └──────────────┘  └──────────────┘  └─────────────────┘      │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Service Layer                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ImageGenerationService                                   │   │
│  │  - Provider selection                                    │   │
│  │  - Fallback logic                                        │   │
│  │  - Cost optimization                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │ FaceManager      │  │ LoraTraining                      │   │
│  │ Service          │  │ Service                           │   │
│  └──────────────────┘  └──────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Provider Registry                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ProviderRegistry                                         │   │
│  │  - Registration & lifecycle                              │   │
│  │  - Health monitoring                                     │   │
│  │  - Smart provider selection                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ProviderFactory                                          │   │
│  │  - Provider instantiation                                │   │
│  │  - Environment-based configuration                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Provider Implementations                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ FalAi    │  │Replicate │  │Stability │  │ OpenAI   │       │
│  │ Provider │  │ Provider │  │   AI     │  │ Provider │       │
│  │          │  │          │  │ Provider │  │          │       │
│  │ ✓ LoRA   │  │ ✓ LoRA   │  │ ✗ LoRA   │  │ ✗ LoRA   │       │
│  │ ✓ Train  │  │ ✗ Train  │  │ ✗ Train  │  │ ✗ Train  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Database Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │ providers    │  │ avatar_faces │  │ generation_     │      │
│  │              │  │              │  │ history         │      │
│  └──────────────┘  └──────────────┘  └─────────────────┘      │
│  ┌──────────────┐  ┌──────────────────────────────────────┐   │
│  │ provider_    │  │ provider_health_log                   │   │
│  │ stats        │  │                                       │   │
│  └──────────────┘  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/neurophoto/
├── types.ts                                  # Core type definitions
├── database/
│   └── schema.ts                            # Database schema & migrations
├── providers/
│   ├── base/
│   │   ├── IImageProvider.ts               # Provider interface
│   │   └── BaseProvider.ts                 # Abstract base class
│   ├── implementations/
│   │   ├── FalAiProvider.ts               # Fal.ai implementation
│   │   ├── ReplicateProvider.ts           # Replicate implementation
│   │   ├── StabilityAiProvider.ts         # Stability AI implementation
│   │   └── OpenAiProvider.ts              # OpenAI DALL-E implementation
│   └── registry/
│       ├── ProviderRegistry.ts            # Provider management
│       └── ProviderFactory.ts             # Provider instantiation
├── services/
│   └── ImageGenerationService.ts          # High-level generation service
└── actions/
    ├── NeurophotoAction.ts                # Image generation command
    ├── ManageFacesAction.ts               # Face management commands
    └── ManageProvidersAction.ts           # Provider management commands
```

## Core Components

### 1. Provider Interface (`IImageProvider`)

All providers implement this interface:

```typescript
interface IImageProvider {
  // Metadata
  readonly name: string;
  readonly type: ProviderType;
  readonly description: string;

  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Capabilities
  getCapabilities(): ProviderCapabilities;
  listModels(): Promise<ModelInfo[]>;

  // Core functionality
  generate(options: GenerationOptions): Promise<ImageResult>;

  // Optional LoRA support
  supportsLora(): boolean;
  trainLora?(options: TrainingOptions): Promise<TrainingResult>;
  checkTrainingStatus?(jobId: string): Promise<TrainingProgressInfo>;

  // Cost estimation
  estimateCost(options: GenerationOptions): number;
}
```

### 2. Provider Registry

Manages all registered providers:

```typescript
class ProviderRegistry {
  // Registration
  register(provider: IImageProvider, config: ProviderConfig): void;
  unregister(providerId: string): void;

  // Access
  getProvider(providerId: string): IImageProvider | null;
  getActiveProvider(): IImageProvider | null;
  listProviders(): ProviderInfo[];

  // Selection
  setActiveProvider(providerId: string): void;
  selectBestProvider(criteria: ProviderSelectionCriteria): IImageProvider | null;
}
```

### 3. Image Generation Service

High-level service with smart provider selection and fallback:

```typescript
class ImageGenerationService {
  // Generation with automatic provider selection
  generate(options: GenerationOptions, userId: UUID): Promise<ServiceResult<ImageResult>>;

  // Generation with specific provider
  generateWithSpecificProvider(
    providerId: string,
    options: GenerationOptions,
    userId: UUID
  ): Promise<ServiceResult<ImageResult>>;

  // Generation with best provider based on criteria
  generateWithBestProvider(
    options: GenerationOptions,
    criteria: ProviderSelectionCriteria,
    userId: UUID
  ): Promise<ServiceResult<ImageResult>>;
}
```

## Provider Capabilities

### Fal.ai Provider

**Status**: ✅ Fully Implemented

```typescript
Capabilities:
- Image generation: ✓
- LoRA support: ✓
- LoRA training: ✓
- Models: flux-lora, flux-pro, flux-dev, flux-realism
- Cost: $0.025 - $0.10 per image
- Training: $2.50 per training
- Avg time: 8-15 seconds
```

**Environment Variables**:
```bash
FAL_KEY=your-fal-api-key
```

### Replicate Provider

**Status**: ✅ Implemented

```typescript
Capabilities:
- Image generation: ✓
- LoRA support: ✓ (model-dependent)
- LoRA training: ✗
- Models: SDXL, Flux Schnell, Flux Dev, and 100+ more
- Cost: $0.03 per image (varies by model)
- Avg time: 15 seconds
```

**Environment Variables**:
```bash
REPLICATE_API_TOKEN=your-replicate-token
```

### Stability AI Provider

**Status**: ✅ Implemented

```typescript
Capabilities:
- Image generation: ✓
- LoRA support: ✗
- LoRA training: ✗
- Models: SDXL 1.0, SD 1.6, SD 3
- Cost: $0.04 per image
- Avg time: 12 seconds
```

**Environment Variables**:
```bash
STABILITY_API_KEY=your-stability-key
```

### OpenAI Provider

**Status**: ✅ Implemented

```typescript
Capabilities:
- Image generation: ✓
- LoRA support: ✗
- LoRA training: ✗
- Models: DALL-E 3, DALL-E 2
- Cost: $0.08 - $0.12 per image
- Avg time: 20 seconds
```

**Environment Variables**:
```bash
OPENAI_API_KEY=your-openai-key
```

## Database Schema

### Providers Table

```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,  -- 'fal' | 'replicate' | 'stability' | 'openai'
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    config TEXT NOT NULL,  -- JSON configuration
    status TEXT DEFAULT 'active',
    last_health_check INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### Avatar Faces Table (Extended)

```sql
CREATE TABLE avatar_faces (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    lora_url TEXT NOT NULL,

    -- Provider association
    provider_id TEXT,
    preferred_provider TEXT,

    -- Training metadata
    training_status TEXT DEFAULT 'ready',
    training_job_id TEXT,
    training_provider TEXT,
    training_started_at INTEGER,
    training_completed_at INTEGER,
    training_error TEXT,

    -- ... other fields
);
```

### Generation History Table

```sql
CREATE TABLE generation_history (
    id TEXT PRIMARY KEY,
    face_id TEXT,
    user_id TEXT NOT NULL,

    -- Generation details
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    image_url TEXT NOT NULL,

    -- Provider info
    provider_id TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    model_used TEXT NOT NULL,

    -- Performance
    generation_time_ms INTEGER,
    cost REAL,

    -- Metadata
    config TEXT,  -- Full generation config
    created_at INTEGER NOT NULL
);
```

## Usage Examples

### 1. Basic Image Generation

```bash
# Use active provider
/neurophoto a beautiful sunset over the ocean

# Use specific provider
/neurophoto prompt:sunset provider:openai

# Use specific model
/neurophoto prompt:sunset model:flux-pro
```

### 2. Provider Management

```bash
# List all providers
/provider list

# Set active provider
/provider use fal

# List models for a provider
/provider models replicate

# Check provider health
/provider status
```

### 3. Face Management with Providers

```bash
# List faces
/face list

# Use specific face with specific provider
/face use MyFace provider:fal

# Generate with face and specific provider
/neurophoto portrait of me as astronaut face:MyFace provider:flux-pro
```

### 4. LoRA Training

```bash
# Train new LoRA (only Fal.ai supports this)
/trainlora name:MyNewFace images:https://example.com/images.zip trigger:MYFACE

# Check training status
/face status MyNewFace
```

## Configuration

### Environment Variables

```bash
# Provider API Keys
FAL_KEY=your-fal-key                    # Fal.ai
REPLICATE_API_TOKEN=your-replicate-key  # Replicate
STABILITY_API_KEY=your-stability-key    # Stability AI
OPENAI_API_KEY=your-openai-key          # OpenAI

# Optional: Override default models
FAL_DEFAULT_MODEL=fal-ai/flux-pro
REPLICATE_DEFAULT_MODEL=stability-ai/sdxl
```

### Provider Priorities

Providers are automatically prioritized based on:

1. **Priority score** (configurable)
2. **Capabilities** (LoRA support, training)
3. **Cost** (lower is better)
4. **Performance** (faster is better)
5. **Health status** (active providers only)

Default priorities:
- Fal.ai: 100 (highest - LoRA + training)
- Replicate: 80 (good model variety)
- Stability AI: 70 (official SD)
- OpenAI: 60 (DALL-E 3 quality)

## Advanced Features

### 1. Smart Provider Selection

```typescript
// Select best provider based on requirements
const provider = registry.selectBestProvider({
  requiresLora: true,           // Must support LoRA
  maxCost: 0.05,                // Max $0.05 per image
  maxGenerationTime: 10,        // Max 10 seconds
  preferredModels: ['flux'],    // Prefer Flux models
});
```

### 2. Automatic Fallback

If primary provider fails, system automatically tries alternatives:

```typescript
// Automatic fallback enabled by default
const result = await imageService.generate(options, userId);
// If Fal.ai fails → tries Replicate → tries Stability → tries OpenAI
```

### 3. Cost Optimization

```typescript
// Get cost estimate before generation
const cost = provider.estimateCost(options);

// Select cheapest provider
const cheapestProvider = registry.selectBestProvider({
  maxCost: 0.03,  // Maximum acceptable cost
});
```

### 4. Health Monitoring

```typescript
// Automatic health checks every 5 minutes
// Providers marked as 'error' are automatically disabled
// Failed providers are retried on next health check
```

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  // Provider errors
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',

  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  INVALID_PROMPT = 'INVALID_PROMPT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',

  // Training errors
  TRAINING_FAILED = 'TRAINING_FAILED',
  TRAINING_NOT_SUPPORTED = 'TRAINING_NOT_SUPPORTED',
}
```

### Retry Logic

- **Retryable errors**: 5xx server errors, rate limits
- **Max retries**: 3 attempts with exponential backoff
- **Fallback**: Automatic switch to alternative provider

## Extending the System

### Adding a New Provider

1. **Create provider implementation**:

```typescript
// src/neurophoto/providers/implementations/NewProvider.ts
import { BaseProvider } from '../base/BaseProvider';

export class NewProvider extends BaseProvider {
  readonly name = 'New Provider';
  readonly type: ProviderType = 'newprovider';
  readonly description = 'Description...';

  protected async onInitialize(config: ProviderConfig): Promise<void> {
    // Initialize provider
  }

  async healthCheck(): Promise<boolean> {
    // Check health
  }

  getCapabilities(): ProviderCapabilities {
    // Return capabilities
  }

  async listModels(): Promise<ModelInfo[]> {
    // List available models
  }

  async generate(options: GenerationOptions): Promise<ImageResult> {
    // Generate image
  }

  estimateCost(options: GenerationOptions): number {
    // Estimate cost
  }
}
```

2. **Register in ProviderFactory**:

```typescript
// src/neurophoto/providers/registry/ProviderFactory.ts
case 'newprovider':
  return new NewProvider();
```

3. **Add to types**:

```typescript
// src/neurophoto/types.ts
export type ProviderType = 'fal' | 'replicate' | 'stability' | 'openai' | 'newprovider';
```

4. **Update schema**:

```sql
-- Add to CHECK constraint
type TEXT CHECK(type IN ('fal', 'replicate', 'stability', 'openai', 'newprovider'))
```

## Performance Optimization

### Caching

- Provider instances are cached in registry
- Health check results cached for 5 minutes
- Model lists cached per provider

### Connection Pooling

- Reuse HTTP connections where possible
- Keep-alive enabled for all providers

### Cost Optimization

- Automatic selection of cheapest provider
- Cost tracking per generation
- Budget alerts (optional)

## Monitoring & Analytics

### Provider Statistics

```sql
SELECT
  p.name,
  ps.total_generations,
  ps.successful_generations,
  ps.failed_generations,
  ps.avg_generation_time_ms,
  ps.total_cost
FROM providers p
JOIN provider_stats ps ON ps.provider_id = p.id;
```

### Health History

```sql
SELECT
  p.name,
  phl.status,
  phl.response_time_ms,
  phl.checked_at
FROM provider_health_log phl
JOIN providers p ON p.id = phl.provider_id
ORDER BY phl.checked_at DESC
LIMIT 100;
```

## Testing

### Unit Tests

```bash
# Test provider implementations
bun test providers/implementations/*.test.ts

# Test registry
bun test providers/registry/*.test.ts

# Test services
bun test services/*.test.ts
```

### Integration Tests

```bash
# Test end-to-end generation
bun test integration/generation.test.ts

# Test provider fallback
bun test integration/fallback.test.ts
```

## Migration Guide

### From Single Provider to Multi-Provider

1. **Update imports**:

```typescript
// Old
import { FalMcpService } from './faces/services/FalMcpService';

// New
import { ImageGenerationService } from './neurophoto/services/ImageGenerationService';
```

2. **Update service initialization**:

```typescript
// Old
const falService = runtime.getService<FalMcpService>('fal-mcp');

// New
const imageService = runtime.getService<ImageGenerationService>('image-generation');
const activeProvider = imageService.getActiveProvider();
```

3. **Update generation calls**:

```typescript
// Old
await falService.generateWithFace(input);

// New
await imageService.generate(options, userId);
```

## Security Considerations

1. **API Keys**: Store in environment variables, never commit
2. **Rate Limiting**: Respect provider rate limits
3. **Cost Controls**: Set maximum costs per generation
4. **Input Validation**: Validate all user inputs
5. **Content Safety**: Enable safety checkers where available

## Troubleshooting

### Provider Not Available

```bash
# Check health
/provider status

# Check configuration
echo $FAL_KEY
echo $REPLICATE_API_TOKEN

# Re-initialize provider
/provider use fal
```

### Generation Failures

```bash
# Check logs
tail -f logs/neurophoto.log

# Try different provider
/provider use replicate

# Check cost limits
/provider list  # View costs
```

### Training Failures

```bash
# Check training status
/face status MyFace

# Retry training
/trainlora name:MyFace images:url trigger:TRIGGER

# Only Fal.ai supports training
/provider use fal
```

## Future Enhancements

1. **Additional Providers**
   - Midjourney (via unofficial API)
   - Leonardo.ai
   - RunPod Serverless

2. **Advanced Features**
   - Image upscaling
   - Style transfer
   - Face swapping
   - Batch generation

3. **Cost Management**
   - Budget alerts
   - Cost analytics
   - Per-user quotas

4. **Performance**
   - Parallel generation
   - CDN integration
   - Image caching

## Support

For issues and questions:
- GitHub Issues: [project-repo/issues]
- Documentation: This file
- API Docs: Each provider's documentation

---

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Status**: Production Ready
