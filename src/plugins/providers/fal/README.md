# Fal Provider Plugin

Fal.ai provider for fast AI inference on images, video, and audio generation with Flux models and more.

## Features

- **17+ Pre-configured Models**: Flux Pro/Dev/Schnell, Stable Video Diffusion, and more
- **Multi-modal Support**: Image, video, and audio generation
- **LoRA Integration**: Support for custom LoRA models
- **Fast Inference**: Optimized for speed
- **Safety Checker**: Built-in NSFW detection
- **Subscription Management**: Track usage and credits

## Available Models

### Image Generation
- **Flux LoRA**: Personalization with LoRA models
- **Flux Pro**: Professional quality (highest quality)
- **Flux Dev**: Development model (balanced)
- **Flux Realism**: Photorealistic generation
- **Flux Schnell**: Ultra-fast generation (fastest)
- **Stable Diffusion V3**: High-quality diffusion

### Video Generation
- **Stable Video Diffusion**: Text-to-video generation
- **Stable Video Diffusion Img2Vid**: Image-to-video conversion
- **Hunyuan Video**: Tencent's video generation
- **CogVideo 1.5**: Large-scale video generation

### Audio Generation
- **Voice Clone**: Clone voices from samples
- **Fish Speech 1.5**: High-quality TTS
- **XTTS**: Multilingual text-to-speech

### Image Processing
- **ESRGAN**: AI upscaling
- **Real-ESRGAN**: Real-world upscaling
- **GFPGAN**: Face restoration
- **Remove BG**: Background removal
- **Segment Anything**: Automatic segmentation

## Usage

```typescript
import { createFalProvider } from '@/plugins/providers/fal';
import type { ProviderConfig } from '@/plugins/providers/base';

// Basic configuration
const config: ProviderConfig = {
  apiKey: 'your-fal-api-key',
  baseUrl: 'https://fal.run',
  timeout: 30000,
};

// Create provider
const falProvider = createFalProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});

// Generate image with Flux Pro
const result = await falProvider.generate({
  prompt: 'A beautiful landscape with mountains and a lake',
  contentType: 'image',
  model: 'fal-ai/flux-pro',
  imageSize: 'landscape_4_3',
  numImages: 2,
  guidanceScale: 7.5,
  safetyChecker: true,
});

// Generate video
const videoResult = await falProvider.generate({
  prompt: 'A cat walking through a garden',
  contentType: 'video',
  model: 'fal-ai/stable-video-diffusion',
});

// Generate audio
const audioResult = await falProvider.generate({
  prompt: 'Hello, this is a test of the text-to-speech system',
  contentType: 'audio',
  model: 'fal-ai/fish-speech-1.5',
});
```

## Specialized Providers

```typescript
import {
  createFalImageProvider,
  createFalVideoProvider,
  createFalAudioProvider,
  createFluxLoRAProvider,
  createFluxProProvider,
} from '@/plugins/providers/fal';

// Image only
const imageProvider = createFalImageProvider(config);

// Video only
const videoProvider = createFalVideoProvider(config);

// Audio only
const audioProvider = createFalAudioProvider(config);

// Flux LoRA specific
const loraProvider = createFluxLoRAProvider(config);

// Flux Pro specific
const fluxProProvider = createFluxProProvider(config);
```

## Model Management

```typescript
// List all models
const models = await falProvider.getModels();
console.log(models.map(m => `${m.name} (${m.id})`));

// Get specific model
const fluxModel = await falProvider.getModel('fal-ai/flux-pro');
console.log(fluxModel?.description);

// Check model health
const health = await falProvider.checkModel('fal-ai/flux-pro');
console.log(health.healthy ? 'Model is healthy' : `Error: ${health.error}`);

// Estimate cost
const cost = await falProvider.estimate('fal-ai/flux-pro', {
  prompt: 'Beautiful sunset',
  contentType: 'image',
});
console.log(`Estimated cost: $${cost}`);
```

## Configuration

### ProviderConfig

- `apiKey` (required): Your Fal API key
- `baseUrl` (optional): API base URL (default: `https://fal.run`)
- `timeout` (optional): Request timeout in ms (default: 30000)
- `retryAttempts` (optional): Number of retry attempts (default: 3)

### Image Generation Options

- `imageSize`: Size preset ('square', 'portrait_4_3', 'landscape_16_9', etc.)
- `numImages`: Number of images to generate (1-4, default: 1)
- `numInferenceSteps`: Number of denoising steps (1-50, default: 28)
- `guidanceScale`: Prompt guidance (1-20, default: 7.5)
- `seed`: Random seed for reproducibility
- `negativePrompt`: Things to avoid in the image
- `loras`: Array of LoRA models to use
- `safetyChecker`: Enable/disable NSFW filter (default: true)
- `outputFormat`: Output format ('jpeg', 'png', 'webp')

### LoRA Usage

```typescript
const result = await falProvider.generate({
  prompt: 'A portrait of a person',
  contentType: 'image',
  loras: [
    {
      path: 'https://example.com/my-lora.safetensors',
      scale: 0.8,
    },
  ],
});
```

## API Endpoints

The provider uses the following Fal endpoints:

- `{modelId}` - Generate content with specified model
- `fal/subscription` - Get subscription and usage info

## Supported Content Types

### Image

- Text-to-image generation
- LoRA integration
- Multiple aspect ratios
- Safety checker
- Custom seeds

### Video

- Text-to-video
- Image-to-video
- Multiple durations

### Audio

- Text-to-speech
- Voice cloning
- Multiple voices

## Health Checks

```typescript
// General health check
const health = await falProvider.healthCheck();
console.log(health.healthy ? 'API is healthy' : health.error);

// Model-specific check
const modelHealth = await falProvider.checkModel('fal-ai/flux-pro');
console.log(modelHealth);

// Subscription check
const subHealth = await falProvider.checkSubscription();
console.log(subHealth);

// Get subscription details
const subscription = await falProvider.getSubscriptionInfo();
console.log(`Plan: ${subscription.plan}, Credits: ${subscription.credits}`);
```

## Pricing

Fal pricing is based on model complexity:

- **Flux Schnell**: $0.025/image (fastest)
- **Flux Dev**: $0.025/image (balanced)
- **Flux Pro**: $0.05/image (high quality)
- **Flux Realism**: $0.075/image (photorealistic)
- **Video Models**: $0.5/video
- **Audio Models**: $0.1/clip

Check your plan for credit availability.

## Performance

- Average generation time: 8-15 seconds (image)
- Concurrent requests: 5 (default plan)
- Rate limits: Based on subscription tier
- Cost: Varies by model

## Examples

### Generate Multiple Images

```typescript
const result = await falProvider.generate({
  prompt: 'A futuristic cityscape at sunset',
  contentType: 'image',
  model: 'fal-ai/flux-pro',
  imageSize: 'landscape_16_9',
  numImages: 4,
  guidanceScale: 8.0,
});

if (result.success && Array.isArray(result.data)) {
  result.data.forEach((image, index) => {
    console.log(`Image ${index + 1}: ${image.url}`);
  });
}
```

### Use LoRA for Custom Style

```typescript
const result = await falProvider.generate({
  prompt: 'A portrait in the style of a specific artist',
  contentType: 'image',
  model: 'fal-ai/flux-lora',
  loras: [
    {
      path: 'https://your-lora-model.safetensors',
      scale: 1.0,
    },
  ],
});
```

### Upscale Image

```typescript
const result = await falProvider.generate({
  prompt: '',
  contentType: 'image',
  model: 'fal-ai/real-esrgan',
  input_image_url: 'https://example.com/low-res.jpg',
});
```

### Video Generation

```typescript
const result = await falProvider.generate({
  prompt: 'Waves crashing on a beach',
  contentType: 'video',
  model: 'fal-ai/stable-video-diffusion',
  num_frames: 14,
});
```

## Error Handling

Comprehensive error handling for:

- Network issues
- API errors
- Model errors
- Credit exhaustion
- Invalid parameters

All errors are logged with context.

## Troubleshooting

### Common Issues

1. **Model not found**: Check model ID is correct
2. **Slow generation**: Try Flux Dev or Flux Schnell
3. **NSFW content**: Enable safety checker
4. **Credit limit**: Check subscription status

### Debugging

Enable logging:

```typescript
const falProvider = createFalProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});
```

## Subscription Management

```typescript
// Check subscription status
const subscription = await falProvider.getSubscriptionInfo();
console.log({
  plan: subscription.plan,
  creditsRemaining: subscription.credits - subscription.creditsUsed,
  nextBilling: subscription.nextBillingDate,
});

// Check if you have enough credits
const hasCredits = subscription.credits > subscription.creditsUsed;
```

## License

MIT
