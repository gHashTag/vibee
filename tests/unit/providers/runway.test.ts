import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRunwayProvider } from '../../../src/plugins/providers/runway/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/runway/generate', () => ({
  generateVideo: vi.fn(),
  editVideo: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/runway/healthCheck', () => ({
  checkRunwayHealth: vi.fn(),
}));

describe('Runway Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-runway-key',
      baseUrl: 'https://api.runwayml.com/v1',
    };

    const generateModule = require('../../../src/plugins/providers/runway/generate');
    generateModule.generateVideo.mockResolvedValue({
      success: true,
      data: { videoUrl: 'https://runwayml.com/video.mp4' },
    });

    const healthModule = require('../../../src/plugins/providers/runway/healthCheck');
    healthModule.checkRunwayHealth.mockResolvedValue({
      healthy: true,
      latency: 200,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createRunwayProvider(config);

    expect(provider.id).toBe('provider-runway');
    expect(provider.name).toBe('Runway Provider');
    expect(provider.providerName).toBe('runway');
    expect(provider.supportedTypes).toContain('video');
  });

  it('should generate video successfully', async () => {
    const provider = createRunwayProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'A cat playing piano',
      model: 'gen3a_turbo',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('videoUrl');
  });

  it('should perform health check', async () => {
    const provider = createRunwayProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });
});
