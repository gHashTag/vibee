# Kie.ai Provider Plugin

Kie.ai provider for AI video and audio generation with fail-over support.

## Features

- **Video Generation**: Generate videos from text prompts
- **Audio Generation**: Generate voice content from text
- **Fail-over Chain**: Automatic failover to backup providers
- **Job Status Tracking**: Monitor async generation jobs
- **Webhook Support**: Real-time notifications (optional)

## Usage

```typescript
import { createKieAIProvider } from '@/plugins/providers/kie-ai';
import type { ProviderConfig } from '@/plugins/providers/base';

// Basic configuration
const config: ProviderConfig = {
  apiKey: 'your-api-key',
  baseUrl: 'https://api.kie.ai',
  timeout: 60000, // Video generation can take time
};

// Create provider
const kieProvider = createKieAIProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});

// Register with registry
const registry = new SimplePluginRegistry();
kieProvider.register(registry);

// Generate video
const result = await kieProvider.generate({
  prompt: 'A beautiful sunset over the mountains',
  contentType: 'video',
  duration: 10,
  aspectRatio: '16:9',
  quality: 'high',
});

// With fail-over chain
import { createKieAIProviderWithFailover } from '@/plugins/providers/kie-ai';

const failoverProvider = createKieAIProviderWithFailover(
  config,
  [
    {
      name: 'replicate',
      generate: replicateProvider.generate,
    },
  ]
);
```

## Configuration

### ProviderConfig

- `apiKey` (required): Your Kie.ai API key
- `baseUrl` (optional): API base URL (default: `https://api.kie.ai`)
- `timeout` (optional): Request timeout in ms (default: 60000)
- `retryAttempts` (optional): Number of retry attempts (default: 3)

### KieAIConfig

- `projectId` (optional): Your Kie.ai project ID
- `webhookUrl` (optional): Webhook URL for notifications
- `region` (optional): API region ('us', 'eu', 'asia')

## API Endpoints

The provider uses the following Kie.ai endpoints:

- `POST /api/v1/video/generate` - Generate video from prompt
- `GET /api/v1/video/status/{jobId}` - Check video job status
- `POST /api/v1/audio/generate` - Generate audio from text
- `GET /api/v1/audio/status/{jobId}` - Check audio job status

## Supported Content Types

### Video

- Generate videos from text prompts
- Support for multiple aspect ratios (16:9, 9:16, 1:1)
- Configurable duration (1-60 seconds)
- Quality settings (low, medium, high)
- LoRA path for custom styles

### Audio

- Text-to-speech generation
- Multiple voice options
- Style customization
- Speed and pitch control

## Health Checks

The provider performs periodic health checks on the Kie.ai API:

```typescript
const health = await kieProvider.healthCheck();
console.log(health); // { healthy: true, latency: 123, lastChecked: Date }
```

## Error Handling

The provider includes comprehensive error handling:

- Network timeouts
- API rate limiting
- Invalid responses
- Job failures

All errors are logged and include context for debugging.

## Fail-over

When enabled, the provider can automatically switch to backup providers if Kie.ai is unavailable:

1. Primary provider (Kie.ai) is attempted first
2. If it fails, fallback providers are tried in order
3. First successful provider wins
4. All failures are logged with context

## Performance

- Average generation time: 30-60 seconds for video
- Concurrent requests: Limited by Kie.ai API
- Cost: Varies by content type and duration
- Rate limits: Respect Kie.ai API limits

## Examples

### Generate Short Video

```typescript
const result = await kieProvider.generate({
  prompt: 'A cat playing with a ball of yarn',
  contentType: 'video',
  duration: 5,
  aspectRatio: '1:1',
  quality: 'high',
});

if (result.success && result.data?.jobId) {
  // Poll for completion
  const status = await kieProvider.getJobStatus(result.data.jobId, 'video');
}
```

### Generate Audio

```typescript
const result = await kieProvider.generate({
  prompt: 'Hello, welcome to our presentation!',
  contentType: 'audio',
  voiceId: 'default',
  style: 'professional',
});

if (result.success && result.data?.url) {
  // Audio is ready
  console.log(`Audio URL: ${result.data.url}`);
}
```

## Troubleshooting

### Common Issues

1. **Long generation times**: Video generation can take 30+ seconds
2. **Job status tracking**: Remember to poll for async jobs
3. **Rate limiting**: Respect API rate limits
4. **Webhook setup**: Configure webhooks for real-time updates

### Debugging

Enable detailed logging to troubleshoot issues:

```typescript
const kieProvider = createKieAIProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});
```

## License

MIT
