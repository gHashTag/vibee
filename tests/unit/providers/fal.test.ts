import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createFalProvider,
  createFalImageProvider,
  createFalVideoProvider,
  createFalAudioProvider,
  createFluxLoRAProvider,
  createFluxProProvider,
  createVideoDiffusionProvider,
} from '../../../src/plugins/providers/fal/Provider.js';
import type { ProviderConfig, ProviderGenerationParams, ProviderPlugin } from '../../../src/plugins/providers/base/types.js';

vi.mock('../../../src/plugins/providers/fal/generate', () => ({
  generateContent: vi.fn(),
  listModels: vi.fn(),
  estimateCost: vi.fn(),
  getSubscription: vi.fn(),
}));

vi.mock('../../../src/plugins/providers/fal/healthCheck', () => ({
  checkFalHealth: vi.fn(),
  checkModelHealth: vi.fn(),
  checkSubscriptionHealth: vi.fn(),
}));

describe('Fal Provider', () => {
  let config: ProviderConfig;
  let mockLogger: any;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      baseUrl: 'https://fal.run',
      timeout: 30000,
      retryAttempts: 3,
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    const generateModule = require('../../../src/plugins/providers/fal/generate');
    generateModule.generateContent.mockResolvedValue({
      success: true,
      data: { url: 'https://fal.run/result' },
      metadata: { model: 'test-model' },
      cost: 0.01,
      executionTime: 1500,
    });

    const healthModule = require('../../../src/plugins/providers/fal/healthCheck');
    healthModule.checkFalHealth.mockResolvedValue({
      healthy: true,
      latency: 100,
      lastChecked: new Date(),
    });

    healthModule.checkModelHealth.mockResolvedValue({
      healthy: true,
      latency: 50,
      lastChecked: new Date(),
    });

    healthModule.checkSubscriptionHealth.mockResolvedValue({
      healthy: true,
      latency: 80,
      lastChecked: new Date(),
    });

    const mockModels = [
      { id: 'fal-ai/flux', name: 'Flux Model', type: 'image' },
      { id: 'fal-ai/video', name: 'Video Model', type: 'video' },
    ];
    generateModule.listModels.mockResolvedValue(mockModels);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createFalProvider', () => {
    it('should create provider with correct structure', () => {
      const provider = createFalProvider(config, mockLogger);

      expect(provider).toHaveProperty('id', 'provider-fal');
      expect(provider).toHaveProperty('name', 'Fal Provider');
      expect(provider).toHaveProperty('version', '1.0.0');
      expect(provider).toHaveProperty('type', 'provider');
      expect(provider).toHaveProperty('providerName', 'fal');
      expect(provider).toHaveProperty('supportedTypes');
      expect(Array.isArray(provider.supportedTypes)).toBe(true);
    });

    it('should support image, video, and audio', () => {
      const provider = createFalProvider(config, mockLogger);

      expect(provider.supportedTypes).toContain('image');
      expect(provider.supportedTypes).toContain('video');
      expect(provider.supportedTypes).toContain('audio');
    });

    it('should generate content successfully', async () => {
      const provider = createFalProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test prompt',
        model: 'test-model',
      };

      const result = await provider.generate(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ url: 'https://fal.run/result' });
      expect(result.metadata).toEqual({ model: 'test-model' });
      expect(result.cost).toBe(0.01);
      expect(result.executionTime).toBe(1500);
    });

    it('should pass correct parameters to generateContent', async () => {
      const provider = createFalProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test prompt',
        model: 'test-model',
        contentType: 'image',
        imageSize: '1024x1024',
        numImages: 2,
        numInferenceSteps: 50,
        guidanceScale: 7.5,
        seed: 12345,
        negativePrompt: 'bad quality',
        loras: ['style1'],
        safetyChecker: true,
        outputFormat: 'png',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
          model: 'test-model',
          contentType: 'image',
          imageSize: '1024x1024',
          numImages: 2,
          numInferenceSteps: 50,
          guidanceScale: 7.5,
          seed: 12345,
          negativePrompt: 'bad quality',
          loras: ['style1'],
          safetyChecker: true,
          outputFormat: 'png',
        }),
        'test-api-key',
        'https://fal.run'
      );
    });

    it('should perform health check', async () => {
      const provider = createFalProvider(config, mockLogger);

      const health = await provider.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBe(100);
      expect(health.lastChecked).toBeInstanceOf(Date);

      const healthModule = require('../../../src/plugins/providers/fal/healthCheck');
      expect(healthModule.checkFalHealth).toHaveBeenCalledWith('test-api-key', 'https://fal.run');
    });

    it('should register in registry', () => {
      const provider = createFalProvider(config, mockLogger);

      const mockRegistry = {
        registerProvider: vi.fn(),
      };

      provider.register(mockRegistry);

      expect(mockRegistry.registerProvider).toHaveBeenCalled();
    });

    it('should use custom base URL from config', () => {
      const customConfig = {
        ...config,
        baseUrl: 'https://custom.fal.run',
      };

      const provider = createFalProvider(customConfig, mockLogger);

      // The provider should use custom base URL
      expect(provider).toBeDefined();
    });
  });

  describe('createFalImageProvider', () => {
    it('should create image-specific provider', () => {
      const provider = createFalImageProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-image');
      expect(provider.name).toBe('Fal Image Provider');
      expect(provider.providerName).toBe('fal-image');
      expect(provider.supportedTypes).toEqual(['image']);
    });

    it('should set contentType to image', async () => {
      const provider = createFalImageProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test image',
        model: 'test-model',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('createFalVideoProvider', () => {
    it('should create video-specific provider', () => {
      const provider = createFalVideoProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-video');
      expect(provider.name).toBe('Fal Video Provider');
      expect(provider.providerName).toBe('fal-video');
      expect(provider.supportedTypes).toEqual(['video']);
    });

    it('should set contentType to video', async () => {
      const provider = createFalVideoProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test video',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'video',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('createFalAudioProvider', () => {
    it('should create audio-specific provider', () => {
      const provider = createFalAudioProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-audio');
      expect(provider.name).toBe('Fal Audio Provider');
      expect(provider.providerName).toBe('fal-audio');
      expect(provider.supportedTypes).toEqual(['audio']);
    });

    it('should set contentType to audio', async () => {
      const provider = createFalAudioProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test audio',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'audio',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('createFluxLoRAProvider', () => {
    it('should create Flux LoRA specific provider', () => {
      const provider = createFluxLoRAProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-flux-lora');
      expect(provider.name).toBe('Flux LoRA Provider');
      expect(provider.providerName).toBe('fal-flux-lora');
      expect(provider.supportedTypes).toEqual(['image']);
    });

    it('should use flux-lora model', async () => {
      const provider = createFluxLoRAProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test LoRA',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'fal-ai/flux-lora',
          contentType: 'image',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('createFluxProProvider', () => {
    it('should create Flux Pro specific provider', () => {
      const provider = createFluxProProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-flux-pro');
      expect(provider.name).toBe('Flux Pro Provider');
      expect(provider.providerName).toBe('fal-flux-pro');
      expect(provider.supportedTypes).toEqual(['image']);
    });

    it('should use flux-pro model', async () => {
      const provider = createFluxProProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test Pro',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'fal-ai/flux-pro',
          contentType: 'image',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('createVideoDiffusionProvider', () => {
    it('should create Video Diffusion specific provider', () => {
      const provider = createVideoDiffusionProvider(config, mockLogger);

      expect(provider.id).toBe('provider-fal-video-diffusion');
      expect(provider.name).toBe('Video Diffusion Provider');
      expect(provider.providerName).toBe('fal-video-diffusion');
      expect(provider.supportedTypes).toEqual(['video']);
    });

    it('should use stable-video-diffusion model', async () => {
      const provider = createVideoDiffusionProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test video diffusion',
      };

      await provider.generate(params);

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'fal-ai/stable-video-diffusion',
          contentType: 'video',
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('provider methods', () => {
    let provider: ProviderPlugin;

    beforeEach(() => {
      provider = createFalProvider(config, mockLogger);
    });

    it('should get models list', async () => {
      const models = await (provider as any).getModels();

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('id', 'fal-ai/flux');
      expect(models[0]).toHaveProperty('name', 'Flux Model');

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.listModels).toHaveBeenCalledWith('test-api-key', 'https://fal.run');
    });

    it('should get specific model by ID', async () => {
      const model = await (provider as any).getModel('fal-ai/flux');

      expect(model).toBeDefined();
      expect(model?.id).toBe('fal-ai/flux');
    });

    it('should return null for non-existent model', async () => {
      const model = await (provider as any).getModel('non-existent');

      expect(model).toBeNull();
    });

    it('should check model health', async () => {
      const health = await (provider as any).checkModel('fal-ai/flux');

      expect(health.healthy).toBe(true);

      const healthModule = require('../../../src/plugins/providers/fal/healthCheck');
      expect(healthModule.checkModelHealth).toHaveBeenCalledWith(
        'fal-ai/flux',
        'test-api-key',
        'https://fal.run'
      );
    });

    it('should estimate cost', async () => {
      const params: ProviderGenerationParams = {
        prompt: 'Test prompt',
        model: 'fal-ai/flux',
      };

      const cost = await (provider as any).estimate('fal-ai/flux', params);

      expect(cost).toBeDefined();

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.estimateCost).toHaveBeenCalledWith('fal-ai/flux', params);
    });

    it('should get subscription info', async () => {
      const subscriptionInfo = await (provider as any).getSubscriptionInfo();

      expect(subscriptionInfo).toBeDefined();

      const generateModule = require('../../../src/plugins/providers/fal/generate');
      expect(generateModule.getSubscription).toHaveBeenCalledWith('test-api-key', 'https://fal.run');
    });

    it('should check subscription health', async () => {
      const health = await (provider as any).checkSubscription();

      expect(health.healthy).toBe(true);

      const healthModule = require('../../../src/plugins/providers/fal/healthCheck');
      expect(healthModule.checkSubscriptionHealth).toHaveBeenCalledWith(
        'test-api-key',
        'https://fal.run'
      );
    });
  });

  describe('error handling', () => {
    it('should handle generation errors', async () => {
      const generateModule = require('../../../src/plugins/providers/fal/generate');
      generateModule.generateContent.mockRejectedValue(new Error('API Error'));

      const provider = createFalProvider(config, mockLogger);

      const params: ProviderGenerationParams = {
        prompt: 'Test prompt',
      };

      await expect(provider.generate(params)).rejects.toThrow('API Error');
    });

    it('should handle health check errors', async () => {
      const healthModule = require('../../../src/plugins/providers/fal/healthCheck');
      healthModule.checkFalHealth.mockRejectedValue(new Error('Health check failed'));

      const provider = createFalProvider(config, mockLogger);

      await expect(provider.healthCheck()).rejects.toThrow('Health check failed');
    });

    it('should handle missing API key', () => {
      const invalidConfig: ProviderConfig = {
        apiKey: '',
      };

      expect(() => createFalProvider(invalidConfig, mockLogger)).not.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use default base URL if not provided', () => {
      const configWithoutBaseUrl: ProviderConfig = {
        apiKey: 'test-key',
      };

      const provider = createFalProvider(configWithoutBaseUrl, mockLogger);

      expect(provider).toBeDefined();
    });

    it('should use custom timeout if provided', () => {
      const configWithTimeout: ProviderConfig = {
        apiKey: 'test-key',
        timeout: 60000,
      };

      const provider = createFalProvider(configWithTimeout, mockLogger);

      expect(provider).toBeDefined();
    });

    it('should use custom retry attempts if provided', () => {
      const configWithRetries: ProviderConfig = {
        apiKey: 'test-key',
        retryAttempts: 5,
      };

      const provider = createFalProvider(configWithRetries, mockLogger);

      expect(provider).toBeDefined();
    });
  });
});
