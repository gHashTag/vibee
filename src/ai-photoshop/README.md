# AI Photoshop Plugin

AI-powered image transformation using Replicate's advanced models.

## 🎨 Features

- **7 AI Models** for different image transformation needs
- **Camera Angles** - 12 professional photography angles
- **Lighting Setups** - 12 professional lighting styles
- **Frame Composition** - 6 composition techniques
- **Telegram Integration** - Interactive keyboard UI
- **Quality Options** - 1K, 2K, 4K output quality

## 📦 Installation

```bash
# Install dependencies
bun add replicate

# Add to your character
import { aiPhotoshopPlugin } from './ai-photoshop';

export const character: Character = {
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',
    aiPhotoshopPlugin,  // ✅ Add here
  ],
};
```

## 🔑 Configuration

Set your Replicate API key in `.env`:

```bash
REPLICATE_API_KEY=r8_your_api_key_here
```

Get your API key from: https://replicate.com/account/api-tokens

## 🤖 Available Models

| Model | Description | Cost (USD) |
|-------|-------------|------------|
| **SeeDream-4** | ByteDance's advanced model | $0.03 |
| **Nano Banana** | Google Gemini 2.5 | $0.039 |
| **FLUX Multi-Kontext** | Multi-context aware | $0.03 |
| **Qwen Edit Plus** | Alibaba SOTA editor | $0.03 |
| **FLUX Kontext Pro** | 8x faster, Adobe integrated | $0.05 |
| **SeedEdit 3** | 4K support, 56% usability | $0.05 |
| **Qwen Image Edit** | Bilingual, FREE tier | $0.025 |

## 🎬 Camera Angles

Choose from 12 professional camera angles:

- **Medium Shot** - Balanced composition
- **Close-Up** - Intimate detail
- **Extreme Close-Up** - Fine detail focus
- **Wide Shot** - Environmental context
- **High Angle** - Looking down perspective
- **Low Angle** - Empowering perspective
- **Dutch Angle** - Dynamic tilt
- **Over Shoulder** - Intimate perspective
- **Profile Shot** - Classic elegance
- **Three Quarter** - Dimensional depth
- **Bird's Eye** - Top-down view
- **Macro Beauty** - Luxury detail

## 💡 Lighting Setups

Choose from 12 professional lighting styles:

- **Soft Natural** - Gentle flattering glow
- **Dramatic** - High contrast shadows
- **Golden Hour** - Magical warm light
- **Studio** - Professional commercial quality
- **Rembrandt** - Classic portrait technique
- **Butterfly** - Glamour facial contouring
- **Split** - Dramatic artistic division
- **Rim** - Edge illumination
- **Candlelight** - Intimate cozy atmosphere
- **Neon Noir** - Cyberpunk urban vibe
- **Morning** - Fresh clean energy
- **Sunset** - Romantic warm glow

## 🖼️ Frame Composition

Choose from 6 professional composition techniques:

- **Center Weighted** - Professional stability
- **Rule of Thirds** - Dynamic balance
- **Golden Ratio** - Mathematical beauty
- **Symmetrical** - Luxury brand precision
- **Negative Space** - Minimalist sophistication
- **Leading Lines** - Premium visual journey

## 📖 Usage Example

### 1. Trigger AI Photoshop

User says:
```
I want to edit my photo with AI
```

Bot responds with model selection menu.

### 2. Select Model

User clicks: **SeeDream-4**

Bot asks for image.

### 3. Upload Image

User uploads photo.

Bot asks for editing instructions.

### 4. Choose Enhancements (Optional)

User clicks:
- **Add Camera Angle** → Select "Close-Up"
- **Add Lighting** → Select "Golden Hour"
- **Add Composition** → Select "Rule of Thirds"

Or write custom prompt:
```
Make the background bokeh, enhance colors, add warm glow
```

### 5. Get Result

Bot processes image and returns transformed result:

```
✅ Transformation complete!
🤖 Model: SeeDream-4
⏱️ Processing time: 45s
💰 Cost: $0.030
```

## 🔧 Programmatic Usage

```typescript
import { AIPhotoshopService } from './ai-photoshop';

// Get service from runtime
const photoshop = runtime.getService<AIPhotoshopService>('ai-photoshop');

// Process image
const result = await photoshop.processImage({
  imageUrl: 'https://example.com/photo.jpg',
  prompt: 'Make it more dramatic',
  model: 'seedream',
  cameraAngle: 'close_up',
  lighting: 'golden_hour',
  composition: 'rule_thirds',
  quality: '2K',
  aspectRatio: '9:16',
});

console.log('Result:', result.imageUrl);
```

## 🎯 Advanced Options

### Custom Aspect Ratios

```typescript
await photoshop.processImage({
  // ... other options
  aspectRatio: '16:9',  // Options: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 9:21
});
```

### Multiple Variations

```typescript
await photoshop.processImage({
  // ... other options
  variationsCount: 4,  // Generate 4 variations
});
```

### Reproducible Results

```typescript
await photoshop.processImage({
  // ... other options
  seed: 12345,  // Same seed = same result
});
```

### Control Prompt Adherence

```typescript
await photoshop.processImage({
  // ... other options
  guidanceScale: 15,  // Higher = more faithful to prompt (1-20)
});
```

## 💰 Pricing

All prices are in USD and charged by Replicate:

| Quality | Multiplier | Example Cost |
|---------|-----------|--------------|
| 1K | 1x | $0.03 |
| 2K | 4x | $0.12 |
| 4K | 6x | $0.18 |

## 🔍 Troubleshooting

### "Service not available"

Make sure the plugin is added to your character:

```typescript
plugins: [
  // ...
  aiPhotoshopPlugin,  // ✅ Must be here
]
```

### "REPLICATE_API_KEY not configured"

Add your API key to `.env`:

```bash
REPLICATE_API_KEY=r8_your_key_here
```

### "Prediction timed out"

Default timeout is 60 seconds. For slower models, images process in background.

### "No output generated"

Check:
1. Image URL is accessible
2. Prompt is not empty
3. Model is valid
4. Replicate API key is correct

## 📊 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Model initialization | < 1s | One-time setup |
| Image processing | 30-60s | Depends on model |
| API overhead | 1-2s | Network latency |

## 🛡️ Best Practices

1. **Always validate images** before processing
2. **Use descriptive prompts** for better results
3. **Combine enhancements** for professional look
4. **Cache results** to avoid duplicate processing
5. **Monitor API usage** to control costs

## 📚 API Reference

See [types.ts](./types.ts) for complete TypeScript definitions.

## 🤝 Contributing

Found a bug or want to add a feature? Please contribute!

## 📄 License

MIT

## 🔗 Resources

- [Replicate API Docs](https://replicate.com/docs)
- [Model Catalog](https://replicate.com/explore)
- [Pricing](https://replicate.com/pricing)
