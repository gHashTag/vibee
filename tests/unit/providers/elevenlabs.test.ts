import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElevenLabsProvider } from '../../../src/plugins/providers/elevenlabs/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/elevenlabs/generate', () => ({
  synthesize: vi.fn(),
  listVoices: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/elevenlabs/healthCheck', () => ({
  checkElevenLabsHealth: vi.fn(),
}));

describe('ElevenLabs Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-elevenlabs-key',
      baseUrl: 'https://api.elevenlabs.io/v1',
    };

    const generateModule = require('../../../src/plugins/providers/elevenlabs/generate');
    generateModule.synthesize.mockResolvedValue({
      success: true,
      data: { audioUrl: 'https://elevenlabs.io/audio.mp3' },
    });

    const healthModule = require('../../../src/plugins/providers/elevenlabs/healthCheck');
    healthModule.checkElevenLabsHealth.mockResolvedValue({
      healthy: true,
      latency: 100,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createElevenLabsProvider(config);

    expect(provider.id).toBe('provider-elevenlabs');
    expect(provider.name).toBe('ElevenLabs Provider');
    expect(provider.providerName).toBe('elevenlabs');
    expect(provider.supportedTypes).toContain('voice');
    expect(provider.supportedTypes).toContain('audio');
  });

  it('should synthesize voice successfully', async () => {
    const provider = createElevenLabsProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'Hello world',
      voiceId: 'voice-1',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('audioUrl');
  });

  it('should perform health check', async () => {
    const provider = createElevenLabsProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });
});
