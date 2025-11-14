# Replicate Provider Plugin

Replicate provider for AI model hosting with 20+ pre-configured models for image, video, audio, and text generation.

## Features

- **20+ Pre-configured Models**: Flux, SD3, Llama, Mixtral, AudioLDM2, and more
- **Multiple Content Types**: Image, video, audio, and text generation
- **Async Processing**: Support for long-running jobs with polling
- **Webhook Support**: Real-time notifications for job completion
- **Prediction Management**: List, check, and cancel predictions
- **Model Discovery**: Browse and select from available models

## Available Models

### Image Generation
- **Flux Dev**: Fast, high-quality image generation
- **Flux Schnell**: Ultra-fast image generation
- **SD3**: Stability AI's latest diffusion model
- **Flux Realism**: Photorealistic image generation

### Video Generation
- **Minimax Video**: High-quality video generation
- **Generic Video**: Text-to-video generation

### Audio Generation
- **AudioLDM2**: Text-to-audio generation
- **Riffusion**: Music generation from text

### Text Generation
- **Llama 3 70B**: Large language model
- **WizardLM 2**: Advanced conversational AI
- **Mixtral 8x7B**: Mixture of experts model

### Image Processing
- **Instruct Pix2Pix**: Image editing and transformation
- **ControlNet**: Controllable image generation
- **RealESRGAN**: Image upscaling and enhancement
- **GFPGAN**: Face restoration and enhancement
- **Segment Anything**: Automated image segmentation
- **Background Removal**: Remove backgrounds from images
- **InstantID**: Identity-preserving generation
- **PhotoMaker**: Person image generation
- **Face to Many**: Convert faces to different styles
- **Face Detailer**: Enhance facial details

## Usage

```typescript
import { createReplicateProvider } from '@/plugins/providers/replicate';
import type { ProviderConfig } from '@/plugins/providers/base';

// Basic configuration
const config: ProviderConfig = {
  apiKey: 'your-replicate-api-key',
  baseUrl: 'https://api.replicate.com',
  timeout: 120000, // Some models take time
};

// Create provider
const replicateProvider = createReplicateProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});

// Generate image
const result = await replicateProvider.generate({
  prompt: 'A beautiful sunset over mountains',
  contentType: 'image',
  model: 'black-forest-labs/flux-dev',
  input: {
    num_outputs: 1,
    aspect_ratio: '16:9',
  },
});

// Async generation with polling
const asyncResult = await replicateProvider.generate({
  prompt: 'Create a video of waves',
  contentType: 'video',
  waitForCompletion: false, // Don't wait
});

// Check prediction status
if (asyncResult.success && asyncResult.data?.predictionId) {
  const status = await replicateProvider.checkPrediction(asyncResult.data.predictionId);
}
```

## Specialized Providers

```typescript
import {
  createReplicateImageProvider,
  createReplicateVideoProvider,
  createReplicateAudioProvider,
  createReplicateTextProvider,
} from '@/plugins/providers/replicate';

// Image only
const imageProvider = createReplicateImageProvider(config);

// Video only
const videoProvider = createReplicateVideoProvider(config);

// Audio only
const audioProvider = createReplicateAudioProvider(config);

// Text only
const textProvider = createReplicateTextProvider(config);
```

## Model Management

```typescript
// List all available models
const models = await replicateProvider.getModels();
console.log(models.map(m => `${m.id} - ${m.description}`));

// Get specific model
const model = await replicateProvider.getModel('black-forest-labs/flux-dev');
console.log(model);

// Check prediction status
const prediction = await replicateProvider.checkPrediction('prediction-id');
console.log(prediction.data);

// Cancel prediction
const cancelResult = await replicateProvider.cancelPrediction('prediction-id');
console.log(cancelResult);

// List user predictions
const { predictions, pagination } = await replicateProvider.getPredictions();
console.log(`Found ${predictions.length} predictions`);
```

## Configuration

### ProviderConfig

- `apiKey` (required): Your Replicate API token
- `baseUrl` (optional): API base URL (default: `https://api.replicate.com`)
- `timeout` (optional): Request timeout in ms (default: 120000)
- `retryAttempts` (optional): Number of retry attempts (default: 3)

### Generation Options

- `contentType`: Type of content to generate ('image', 'video', 'audio', 'text')
- `model`: Specific model ID to use
- `input`: Model-specific input parameters
- `webhook`: URL for job completion notifications
- `waitForCompletion`: Wait for async job to complete (default: false)
- `pollInterval`: Polling interval in ms (default: 1000)

## API Endpoints

The provider uses the following Replicate endpoints:

- `GET /v1/models` - List available models
- `POST /v1/predictions` - Create prediction
- `GET /v1/predictions/{id}` - Get prediction status
- `POST /v1/predictions/{id}/cancel` - Cancel prediction
- `GET /v1/predictions` - List user predictions

## Supported Content Types

### Image

- Generate images from text prompts
- Image-to-image transformation
- Super resolution and enhancement
- Background removal
- Face restoration
- Style transfer

### Video

- Text-to-video generation
- Video from images

### Audio

- Text-to-speech generation
- Music generation

### Text

- Chat completions
- Text generation
- Code generation

## Health Checks

The provider performs periodic health checks:

```typescript
const health = await replicateProvider.healthCheck();
console.log(health); // { healthy: true, latency: 123, lastChecked: Date }
```

## Async Jobs

For long-running models, Replicate uses async predictions:

1. Create prediction (returns prediction ID immediately)
2. Poll prediction status until completion
3. Retrieve results

```typescript
// Create async prediction
const result = await provider.generate({
  prompt: 'Generate a complex image',
  waitForCompletion: false,
});

if (result.success && result.data?.predictionId) {
  // Poll for completion
  let prediction;
  do {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    const status = await provider.checkPrediction(result.data.predictionId);
    prediction = status.data;
  } while (prediction.status === 'processing' || prediction.status === 'starting');

  if (prediction.status === 'succeeded') {
    console.log('Results:', prediction.output);
  }
}
```

## Webhooks

For real-time updates, configure webhooks:

```typescript
const result = await provider.generate({
  prompt: 'Generate video',
  webhook: 'https://your-app.com/webhooks/replicate',
});

const { predictions, pagination } = await provider.getPredictions();
// pagination.hasMore for pagination
```

## Error Handling

The provider includes comprehensive error handling:

- Network timeouts
- API errors
- Model errors
- Invalid predictions

All errors are logged with context for debugging.

## Performance

- Average generation time: 5-60 seconds (model dependent)
- Concurrent requests: Limited by Replicate API
- Cost: Varies by model and usage
- Rate limits: Respect Replicate API limits

## Examples

### Generate Multiple Images

```typescript
const result = await replicateProvider.generate({
  prompt: 'A futuristic cityscape',
  contentType: 'image',
  model: 'black-forest-labs/flux-dev',
  input: {
    num_outputs: 4, // Generate 4 images
    aspect_ratio: '16:9',
  },
});
```

### Style Transfer

```typescript
const result = await replicateProvider.generate({
  prompt: 'Transform to watercolor style',
  contentType: 'image',
  model: 'instruct-pix2pix',
  input: {
    image: 'https://example.com/image.jpg',
    prompt_strength: 0.8,
  },
});
```

### Text Generation

```typescript
const result = await replicateProvider.generate({
  prompt: 'Explain quantum computing',
  contentType: 'text',
  model: 'meta/meta-llama-3-70b-instruct',
  input: {
    max_tokens: 500,
    temperature: 0.7,
  },
});
```

## Pricing

Replicate pricing varies by model:
- Some models are free
- Others charge per second of compute time
- Check model documentation for specific pricing

## Troubleshooting

### Common Issues

1. **Model not found**: Ensure model ID is correct
2. **Long wait times**: Some models take 30+ seconds
3. **Prediction failed**: Check model-specific input parameters
4. **Rate limiting**: Respect API rate limits

### Debugging

Enable detailed logging:

```typescript
const replicateProvider = createReplicateProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});
```

## License

MIT
