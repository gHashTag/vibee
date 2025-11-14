import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createOpenAIProvider } from '../../../src/plugins/providers/openai/Provider.js';
import type { ProviderConfig, ProviderGenerationParams } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/openai/generate', () => ({
  generateText: vi.fn(),
  transcribeAudio: vi.fn(),
  listModels: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/openai/healthCheck', () => ({
  checkOpenAIHealth: vi.fn(),
}));

describe('OpenAI Provider', () => {
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-openai-key',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 30000,
    };

    const generateModule = require('../../../src/plugins/providers/openai/generate');
    generateModule.generateText.mockResolvedValue({
      success: true,
      data: { text: 'Generated text', usage: { totalTokens: 100 } },
    });

    const healthModule = require('../../../src/plugins/providers/openai/healthCheck');
    healthModule.checkOpenAIHealth.mockResolvedValue({
      healthy: true,
      latency: 120,
      lastChecked: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with correct structure', () => {
    const provider = createOpenAIProvider(config);

    expect(provider.id).toBe('provider-openai');
    expect(provider.name).toBe('OpenAI Provider');
    expect(provider.providerName).toBe('openai');
    expect(provider.type).toBe('provider');
    expect(provider.supportedTypes).toContain('text');
  });

  it('should generate text successfully', async () => {
    const provider = createOpenAIProvider(config);

    const params: ProviderGenerationParams = {
      prompt: 'Generate text',
      model: 'gpt-4',
    };

    const result = await provider.generate(params);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('text');
    expect(result.data).toHaveProperty('usage');
  });

  it('should perform health check', async () => {
    const provider = createOpenAIProvider(config);
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
  });

  it('should handle API errors', async () => {
    const generateModule = require('../../../src/plugins/providers/openai/generate');
    generateModule.generateText.mockRejectedValue(new Error('OpenAI API error'));

    const provider = createOpenAIProvider(config);

    await expect(provider.generate({ prompt: 'test' })).rejects.toThrow('OpenAI API error');
  });
});
