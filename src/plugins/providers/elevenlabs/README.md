# ElevenLabs Provider Plugin

ElevenLabs provider for high-quality text-to-speech synthesis and voice cloning.

## Features

- **8+ Premade Voices**: High-quality preset voices
- **Voice Cloning**: Create custom voices from audio samples
- **Multilingual Support**: 29+ languages
- **Voice Control**: Fine-tune stability, similarity, and style
- **Speech History**: View and retrieve generated audio
- **Subscription Management**: Track usage and limits

## Available Voices

### Premade Voices
1. **Rachel** - Young American female
2. **Drew** - Neutral male
3. **Adam** - Middle-aged American male
4. **Charlie** - Australian accent male
5. **Matilda** - Swedish female
6. **Josh** - Young American male
7. **Arnold** - Deep voice male
8. **Serena** - British female

### Voice Cloning
- Upload 1-10 audio samples
- Create custom voices
- Set custom names and descriptions
- Use labels for organization

## Usage

```typescript
import { createElevenLabsProvider } from '@/plugins/providers/elevenlabs';
import type { ProviderConfig } from '@/plugins/providers/base';

// Basic configuration
const config: ProviderConfig = {
  apiKey: 'your-elevenlabs-api-key',
  baseUrl: 'https://api.elevenlabs.io',
  timeout: 30000,
};

// Create provider
const elevenLabsProvider = createElevenLabsProvider(config, (context) => {
  console.log(`[${context.level}] ${context.message}`, context.data);
});

// Generate speech
const result = await elevenLabsProvider.generate({
  prompt: 'Hello, this is a test of the ElevenLabs text-to-speech system.',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  modelId: 'eleven_multilingual_v2',
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
  },
});

if (result.success && result.data?.audioBase64) {
  // Save or play audio
  const audio = Buffer.from(result.data.audioBase64, 'base64');
}
```

## Voice Management

```typescript
// List all voices
const voices = await elevenLabsProvider.getVoices();
console.log(voices.map(v => `${v.name} (${v.voiceId})`));

// Get specific voice
const voice = await elevenLabsProvider.getVoice('21m00Tcm4TlvDq8ikWAM');
console.log(voice.description);

// Clone a voice
const cloneResult = await elevenLabsProvider.cloneVoice({
  name: 'My Custom Voice',
  description: 'Custom voice for my project',
  files: [
    'https://example.com/sample1.mp3',
    'https://example.com/sample2.mp3',
  ],
});

// Check voice health
const voiceHealth = await elevenLabsProvider.checkVoice('custom-voice-id');
console.log(voiceHealth.healthy ? 'Voice is healthy' : voiceHealth.error);
```

## Subscription Management

```typescript
const subscription = await elevenLabsProvider.getSubscriptionInfo();
console.log({
  tier: subscription.subscription?.tier,
  characterLimit: subscription.subscription?.character_limit,
  characterCount: subscription.subscription?.character_count,
  canExtendCharacterLimit: subscription.subscription?.can_extend_character_limit,
});
```

## Audio History

```typescript
// Get generation history
const history = await elevenLabsProvider.getHistory(50);
console.log(`Found ${history.length} audio files`);

// Get specific audio
const audio = await elevenLabsProvider.getAudio('audio-id');
if (audio) {
  // Save to file or process
}
```

## Configuration

### ProviderConfig

- `apiKey` (required): Your ElevenLabs API key
- `baseUrl` (optional): API base URL (default: `https://api.elevenlabs.io`)
- `timeout` (optional): Request timeout in ms (default: 30000)

### Voice Settings

- `stability`: Voice stability (0-1, default: 0.5)
- `similarityBoost`: Boost voice clarity (0-1, default: 0.75)
- `style`: Add style variation (0-1, default: 0.0)
- `useSpeakerBoost`: Enhance speaker clarity (boolean)

### Models

- `eleven_monolingual_v1`: English only
- `eleven_multilingual_v2`: 29 languages
- `eleven_turbo_v2`: Faster generation
- `eleven_multilingual_v2_5`: Latest multilingual

## API Endpoints

The provider uses the following ElevenLabs endpoints:

- `POST /v1/text-to-speech/{voiceId}` - Generate speech
- `GET /v1/voices` - List voices
- `GET /v1/voices/{voiceId}` - Get voice info
- `POST /v1/voices/add` - Clone voice
- `DELETE /v1/voices/{voiceId}` - Delete voice
- `GET /v1/user` - Get subscription info
- `GET /v1/history` - Get audio history

## Examples

### Generate with Custom Voice Settings

```typescript
const result = await elevenLabsProvider.generate({
  prompt: 'This is a demonstration of custom voice settings.',
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
  voiceSettings: {
    stability: 0.8,
    similarityBoost: 0.9,
    style: 0.3,
    useSpeakerBoost: true,
  },
});
```

### Clone Voice from Files

```typescript
const result = await elevenLabsProvider.cloneVoice({
  name: 'CEO Voice',
  description: 'Voice clone of company CEO',
  files: [
    'https://storage.example.com/ceo-sample1.mp3',
    'https://storage.example.com/ceo-sample2.mp3',
    'https://storage.example.com/ceo-sample3.mp3',
  ],
  labels: {
    accent: 'american',
    gender: 'male',
    age: 'middle_aged',
  },
});
```

### Generate in Different Languages

```typescript
const result = await elevenLabsProvider.generate({
  prompt: 'Hola, ¿cómo estás?', // Spanish
  voiceId: 'XrExE9yKIg1WjnnlVkGX', // Matilda
  modelId: 'eleven_multilingual_v2',
});
```

## Health Checks

```typescript
// General health check
const health = await elevenLabsProvider.healthCheck();
console.log(health.healthy ? 'API is healthy' : health.error);

// Voice-specific check
const voiceHealth = await elevenLabsProvider.checkVoice('voice-id');
console.log(voiceHealth);
```

## Performance

- Average generation time: 1-5 seconds
- Character limit: Based on subscription tier
- Supported languages: 29
- Audio format: MP3
- Sample rate: 22.05 kHz

## Pricing

ElevenLabs pricing based on subscription tier:
- **Free**: 10,000 characters/month
- **Starter**: $5/month, 30,000 characters
- **Creator**: $22/month, 100,000 characters
- **Pro**: $99/month, 500,000 characters
- **Scale**: $330/month, 2,000,000 characters

Check current pricing on ElevenLabs website.

## Error Handling

Comprehensive error handling for:
- Invalid API key
- Voice not found
- Character limit exceeded
- Network issues
- Invalid audio files

All errors are logged with context.

## Troubleshooting

### Common Issues

1. **Invalid voice ID**: Check voice exists
2. **Character limit**: Check subscription tier
3. **Voice cloning fails**: Ensure audio quality and samples
4. **Slow generation**: Try turbo model

### Audio Quality Tips

- Use clear audio samples
- Avoid background noise
- Use consistent speaking style
- Minimum 1 minute of audio recommended

## License

MIT
