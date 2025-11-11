# Neurophoto Multi-Provider - Quick Start Guide

Quick start guide for Vibee's multi-provider image generation system.

## Installation

The system is already integrated into Vibee. Just configure your provider API keys.

## Configuration

### 1. Set Up API Keys

Add to your `.env` file:

```bash
# Fal.ai (Recommended - supports LoRA training)
FAL_KEY=your-fal-api-key

# Replicate (Optional - 100+ models)
REPLICATE_API_TOKEN=your-replicate-token

# Stability AI (Optional - official SD)
STABILITY_API_KEY=your-stability-key

# OpenAI (Optional - DALL-E 3)
OPENAI_API_KEY=your-openai-key
```

**Minimum Required**: One provider API key (FAL_KEY recommended)

### 2. Get API Keys

**Fal.ai** (Recommended):
- Visit: https://fal.ai/dashboard/keys
- Sign up and create API key
- Supports: LoRA, training, fast inference

**Replicate**:
- Visit: https://replicate.com/account/api-tokens
- Get token
- Access to 100+ models

**Stability AI**:
- Visit: https://platform.stability.ai/account/keys
- Create API key
- Official Stable Diffusion

**OpenAI**:
- Visit: https://platform.openai.com/api-keys
- Create API key
- DALL-E 3 access

## Basic Usage

### Generate Image

```bash
# Simple generation (uses active provider)
/neurophoto a beautiful sunset over the ocean

# With specific provider
/neurophoto prompt:cyberpunk city provider:fal

# With specific model
/neurophoto prompt:portrait model:flux-pro
```

### Provider Management

```bash
# List all providers
/provider list

# Switch active provider
/provider use replicate

# View models for provider
/provider models fal

# Check health status
/provider status
```

### Face Management with LoRA

```bash
# Train new face (Fal.ai only)
/trainlora name:MyFace images:https://example.com/photos.zip trigger:MYFACE

# List faces
/face list

# Generate with face
/neurophoto portrait of MYFACE as astronaut

# Use specific provider for face
/face use MyFace provider:fal
```

## Provider Comparison

| Provider | LoRA | Training | Models | Cost/img | Speed | Best For |
|----------|------|----------|--------|----------|-------|----------|
| **Fal.ai** | ✅ | ✅ | 5+ | $0.025-0.10 | 8-15s | LoRA, custom faces |
| **Replicate** | ✅* | ❌ | 100+ | $0.03+ | 15s | Model variety |
| **Stability AI** | ❌ | ❌ | 3 | $0.04 | 12s | Official SD |
| **OpenAI** | ❌ | ❌ | 2 | $0.08-0.12 | 20s | Quality, safety |

*Model-dependent

## Quick Examples

### 1. First Generation

```bash
# 1. Set up Fal.ai (easiest)
FAL_KEY=your-key

# 2. Start Vibee
elizaos start

# 3. Generate
/neurophoto a majestic dragon in the clouds
```

### 2. Train Your Face

```bash
# 1. Prepare 10-20 photos (ZIP file)
# 2. Upload to accessible URL
# 3. Train
/trainlora name:Me images:https://example.com/my-photos.zip trigger:MYFACE

# 4. Wait 10-15 minutes
# 5. Generate
/neurophoto MYFACE at the beach
```

### 3. Use Multiple Providers

```bash
# 1. Configure multiple keys in .env
FAL_KEY=xxx
REPLICATE_API_TOKEN=yyy
OPENAI_API_KEY=zzz

# 2. List available
/provider list

# 3. Compare results
/neurophoto sunset provider:fal
/neurophoto sunset provider:openai
/neurophoto sunset provider:replicate
```

## Common Commands

### Image Generation
```bash
/neurophoto <prompt>                    # Basic generation
/neurophoto prompt:<text> provider:<id> # With specific provider
/neurophoto prompt:<text> model:<name>  # With specific model
/neurophoto prompt:<text> face:<name>   # With face/LoRA
```

### Provider Management
```bash
/provider list           # List all providers
/provider use <type>     # Set active provider
/provider models <type>  # List models
/provider status         # Health check
```

### Face Management
```bash
/face list               # List all faces
/face use <name>         # Set default face
/face status <name>      # Check training status
/face delete <name>      # Delete face
```

### LoRA Training
```bash
/trainlora name:<name> images:<url> trigger:<word>
```

## Troubleshooting

### Provider Not Working

```bash
# 1. Check API key
echo $FAL_KEY

# 2. Check provider status
/provider status

# 3. Try health check
/provider list

# 4. Switch provider
/provider use replicate
```

### Generation Failed

```bash
# 1. Check active provider
/provider list

# 2. Try different provider
/neurophoto prompt:test provider:openai

# 3. Check logs
tail -f logs/neurophoto.log
```

### Training Failed

```bash
# 1. Verify only Fal.ai supports training
/provider use fal

# 2. Check image URL is accessible
curl -I https://your-images.zip

# 3. Retry training
/trainlora name:MyFace images:url trigger:WORD
```

## Advanced Usage

### Cost Optimization

```bash
# 1. Check costs
/provider list  # Shows cost per image

# 2. Use cheaper provider for testing
/provider use replicate  # Usually cheaper

# 3. Use premium for final results
/provider use fal model:flux-pro
```

### Quality Optimization

```bash
# For photorealism
/neurophoto portrait provider:fal model:flux-realism

# For creativity
/neurophoto abstract art provider:openai

# For variety
/neurophoto landscape provider:replicate model:sdxl
```

### Performance Optimization

```bash
# Fastest generation
/provider use fal model:flux-dev  # 8 seconds

# Best quality (slower)
/provider use openai quality:hd   # 20 seconds

# Balanced
/provider use fal model:flux-lora # 10 seconds
```

## Best Practices

1. **Start with Fal.ai**
   - Best balance of features, speed, and cost
   - Only provider with LoRA training
   - Good model variety

2. **Use Appropriate Provider for Task**
   - Custom faces → Fal.ai (LoRA)
   - Model variety → Replicate
   - Official SD → Stability AI
   - Creative quality → OpenAI

3. **Optimize Costs**
   - Test with cheap providers
   - Use premium for final results
   - Monitor usage with `/provider list`

4. **Handle Failures**
   - System auto-falls back to alternatives
   - Always have 2+ providers configured
   - Check health regularly

5. **Face Training Tips**
   - Use 10-20 varied photos
   - Good lighting and angles
   - Clear, high-quality images
   - Consistent subject

## Next Steps

1. **Configure Providers**
   - Add API keys to `.env`
   - Test each provider: `/provider status`

2. **Train First Face**
   - Prepare photos
   - Upload to accessible URL
   - Run `/trainlora`

3. **Explore Models**
   - List models: `/provider models fal`
   - Test different models
   - Find best for your use case

4. **Read Full Docs**
   - See: `NEUROPHOTO_ARCHITECTURE.md`
   - Complete API reference
   - Advanced features

## Support

- **Documentation**: `NEUROPHOTO_ARCHITECTURE.md`
- **Examples**: This file
- **Issues**: GitHub repository
- **Community**: Discord server

## Quick Reference Card

```
GENERATION
/neurophoto <prompt>              Generate with active provider
/neurophoto prompt:x provider:y   Generate with specific provider
/neurophoto prompt:x model:y      Generate with specific model

PROVIDERS
/provider list                    List all providers
/provider use <type>              Set active provider
/provider models <type>           List models
/provider status                  Check health

FACES
/face list                        List faces
/face use <name>                  Set default
/trainlora name:x images:y        Train new face

PROVIDER TYPES
fal         Fal.ai (LoRA + training)
replicate   Replicate (100+ models)
stability   Stability AI (official SD)
openai      OpenAI (DALL-E 3)
```

---

**Need Help?** See full documentation in `NEUROPHOTO_ARCHITECTURE.md`

**Version**: 1.0.0
**Status**: Production Ready
