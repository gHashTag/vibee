import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHeyGenProvider } from '../../../src/plugins/providers/heygen/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/heygen/generate', () => ({
  createAvatar: vi.fn(),
  generateVideo: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/heygen/healthCheck', () => ({
  checkHeyGenHealth: vi.fn(),
}));

describe('HeyGen Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-heygen-key',
      baseUrl: 'https://api.heygen.com/v2',
    };

    const generateModule = require('../../../src/plugins/providers/heygen/generate');
    generateModule.createAvatar.mockResolvedValue({
      success: true,
      data: { avatarId: 'avatar-123' },
    });

    const healthModule = require('../../../src/plugins/providers/heygen/healthCheck');
    healthModule.checkHeyGenHealth.mockResolvedValue({
      healthy: true,
      latency: 140,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createHeyGenProvider(config);

    expect(provider.id).toBe('provider-heygen');
    expect(provider.name).toBe('HeyGen Provider');
    expect(provider.providerName).toBe('heygen');
    expect(provider.supportedTypes).toContain('avatar');
    expect(provider.supportedTypes).toContain('video');
  });

  it('should create avatar successfully', async () => {
    const provider = createHeyGenProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'Create an avatar',
      avatarId: 'avatar-123',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('avatarId');
  });

  it('should perform health check', async () => {
    const provider = createHeyGenProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });
});
