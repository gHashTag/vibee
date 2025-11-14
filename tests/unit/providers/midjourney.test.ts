import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMidjourneyProvider } from '../../../src/plugins/providers/midjourney/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/midjourney/generate', () => ({
  generateImage: vi.fn(),
  upscaleImage: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/midjourney/healthCheck', () => ({
  checkMidjourneyHealth: vi.fn(),
}));

describe('Midjourney Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-midjourney-key',
      baseUrl: 'https://api.midjourney.com/v1',
    };

    const generateModule = require('../../../src/plugins/providers/midjourney/generate');
    generateModule.generateImage.mockResolvedValue({
      success: true,
      data: { imageUrl: 'https://midjourney.com/image.png' },
    });

    const healthModule = require('../../../src/plugins/providers/midjourney/healthCheck');
    healthModule.checkMidjourneyHealth.mockResolvedValue({
      healthy: true,
      latency: 160,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createMidjourneyProvider(config);

    expect(provider.id).toBe('provider-midjourney');
    expect(provider.name).toBe('Midjourney Provider');
    expect(provider.providerName).toBe('midjourney');
    expect(provider.supportedTypes).toContain('image');
  });

  it('should generate image successfully', async () => {
    const provider = createMidjourneyProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'A beautiful sunset',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('imageUrl');
  });

  it('should perform health check', async () => {
    const provider = createMidjourneyProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });
});
