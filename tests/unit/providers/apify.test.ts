import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApifyProvider } from '../../../src/plugins/providers/apify/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/apify/generate', () => ({
  runActor: vi.fn(),
  runWorkflow: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/apify/healthCheck', () => ({
  checkApifyHealth: vi.fn(),
}));

describe('Apify Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-apify-key',
      baseUrl: 'https://api.apify.com/v2',
    };

    const generateModule = require('../../../src/plugins/providers/apify/generate');
    generateModule.runActor.mockResolvedValue({
      success: true,
      data: { result: 'Workflow completed' },
    });

    const healthModule = require('../../../src/plugins/providers/apify/healthCheck');
    healthModule.checkApifyHealth.mockResolvedValue({
      healthy: true,
      latency: 110,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createApifyProvider(config);

    expect(provider.id).toBe('provider-apify');
    expect(provider.name).toBe('Apify Provider');
    expect(provider.providerName).toBe('apify');
  });

  it('should run actor successfully', async () => {
    const provider = createApifyProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'Run web scraping',
      actorId: 'apify/actor-123',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('result');
  });

  it('should perform health check', async () => {
    const provider = createApifyProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });

  it('should handle API errors', async () => {
    const generateModule = require('../../../src/plugins/providers/apify/generate');
    generateModule.runActor.mockRejectedValue(new Error('Apify API error'));

    const provider = createApifyProvider(config);

    await expect(provider.generate({ prompt: 'test' })).rejects.toThrow('Apify API error');
  });
});
