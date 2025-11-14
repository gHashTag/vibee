import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHuggingFaceProvider } from '../../../src/plugins/providers/huggingface/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/huggingface/generate', () => ({
  generateText: vi.fn(),
  classifyText: vi.fn(),
  generateImage: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/huggingface/healthCheck', () => ({
  checkHuggingFaceHealth: vi.fn(),
}));

describe('HuggingFace Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-hf-key',
      baseUrl: 'https://api-inference.huggingface.co/models',
    };

    const generateModule = require('../../../src/plugins/providers/huggingface/generate');
    generateModule.generateText.mockResolvedValue({
      success: true,
      data: { text: 'Generated' },
    });

    const healthModule = require('../../../src/plugins/providers/huggingface/healthCheck');
    healthModule.checkHuggingFaceHealth.mockResolvedValue({
      healthy: true,
      latency: 180,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createHuggingFaceProvider(config);

    expect(provider.id).toBe('provider-huggingface');
    expect(provider.name).toBe('HuggingFace Provider');
    expect(provider.providerName).toBe('huggingface');
  });

  it('should generate text successfully', async () => {
    const provider = createHuggingFaceProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'Test prompt',
      model: 'gpt2',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
  });

  it('should perform health check', async () => {
    const provider = createHuggingFaceProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });
});
