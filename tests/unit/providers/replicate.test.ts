/**
 * Unit Tests for Replicate Provider
 * Test image generation with Replicate API
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ReplicateProvider', () => {
  let ReplicateProvider: any;
  let mockRuntime: IAgentRuntime;

  beforeAll(async () => {
    const module = await import('../../../src/neurophoto/providers/implementations/ReplicateProvider');
    ReplicateProvider = module.ReplicateProvider;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        if (key === 'REPLICATE_API_TOKEN') {
          return 'test-replicate-token-12345';
        }
        return undefined;
      }),
    } as any;
  });

  describe('Initialization', () => {
    it('should initialize with API token', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      expect(provider).toBeDefined();
      expect(provider.getApiToken()).toBe('test-replicate-token-12345');
    });

    it('should handle missing API token', async () => {
      const mockRuntimeNoToken = {
        getSetting: vi.fn(() => undefined),
      } as any;

      const provider = new ReplicateProvider(mockRuntimeNoToken);
      expect(provider.getApiToken()).toBeUndefined();
    });
  });

  describe('Image Generation', () => {
    it('should generate image with valid parameters', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-12345',
          status: 'starting',
          input: {},
          output: null,
        }),
      });

      // Mock status check response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-12345',
          status: 'succeeded',
          output: ['https://example.com/image.jpg'],
        }),
      });

      const result = await provider.generateImage({
        prompt: 'A beautiful sunset over mountains',
        model: 'flux-dev',
        width: 1024,
        height: 768,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url');
      expect(result.data?.url).toBe('https://example.com/image.jpg');
      expect(result.provider).toBe('replicate');
    });

    it('should handle flux-schnell model', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-fast',
          status: 'starting',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-fast',
          status: 'succeeded',
          output: ['https://example.com/fast-image.jpg'],
        }),
      });

      const result = await provider.generateImage({
        prompt: 'Quick generation test',
        model: 'flux-schnell',
      });

      expect(result.success).toBe(true);
      expect(result.model).toBe('flux-schnell');
    });

    it('should handle multiple outputs', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-multi',
          status: 'starting',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-multi',
          status: 'succeeded',
          output: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
            'https://example.com/image3.jpg',
          ],
        }),
      });

      const result = await provider.generateImage({
        prompt: 'Multiple variations',
        model: 'flux-dev',
        numOutputs: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data?.urls).toHaveLength(3);
    });

    it('should fail without API token', async () => {
      const mockRuntimeNoToken = {
        getSetting: vi.fn(() => undefined),
      } as any;

      const provider = new ReplicateProvider(mockRuntimeNoToken);

      const result = await provider.generateImage({
        prompt: 'A cat',
        model: 'flux-dev',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API token not configured');
    });

    it('should fail with invalid model', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      });

      const result = await provider.generateImage({
        prompt: 'A cat',
        model: 'invalid-model' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Model not found');
    });

    it('should handle failed prediction', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-failed',
          status: 'starting',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-failed',
          status: 'failed',
          error: 'Generation failed',
        }),
      });

      const result = await provider.generateImage({
        prompt: 'A cat',
        model: 'flux-dev',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generation failed');
    });

    it('should handle network error during generation', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.generateImage({
        prompt: 'A cat',
        model: 'flux-dev',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      // Mock prediction that never completes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-timeout',
          status: 'starting',
        }),
      });

      // Mock status check that always returns starting
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-timeout',
          status: 'starting',
        }),
      });

      const result = await provider.generateImage({
        prompt: 'A cat',
        model: 'flux-dev',
      }, 1000); // 1 second timeout

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Supported Models', () => {
    it('should return list of supported models', () => {
      const provider = new ReplicateProvider(mockRuntime);
      const models = provider.getSupportedModels();

      expect(models).toContain('flux-dev');
      expect(models).toContain('flux-schnell');
      expect(models).toContain('flux-pro');
    });

    it('should validate model support', () => {
      const provider = new ReplicateProvider(mockRuntime);

      expect(provider.isModelSupported('flux-dev')).toBe(true);
      expect(provider.isModelSupported('flux-schnell')).toBe(true);
      expect(provider.isModelSupported('invalid')).toBe(false);
    });
  });

  describe('Model Pricing', () => {
    it('should return correct pricing for flux-dev', () => {
      const provider = new ReplicateProvider(mockRuntime);

      const pricing = provider.getModelPricing('flux-dev');
      expect(pricing).toBeGreaterThan(0);
      expect(pricing).toBeLessThan(1);
    });

    it('should return higher pricing for flux-pro', () => {
      const provider = new ReplicateProvider(mockRuntime);

      const devPricing = provider.getModelPricing('flux-dev');
      const proPricing = provider.getModelPricing('flux-pro');

      expect(proPricing).toBeGreaterThanOrEqual(devPricing);
    });

    it('should return zero for unknown model', () => {
      const provider = new ReplicateProvider(mockRuntime);

      const pricing = provider.getModelPricing('unknown-model' as any);
      expect(pricing).toBe(0);
    });
  });

  describe('Async Generation', () => {
    it('should start async generation', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'prediction-async',
          status: 'starting',
          urls: {
            get: 'https://api.replicate.com/v1/predictions/prediction-async',
            cancel: 'https://api.replicate.com/v1/predictions/prediction-async/cancel',
          },
        }),
      });

      const result = await provider.startAsyncGeneration({
        prompt: 'A cat',
        model: 'flux-dev',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('predictionId');
      expect(result.data?.predictionId).toBe('prediction-async');
    });

    it('should cancel async generation', async () => {
      const provider = new ReplicateProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'prediction-async',
          status: 'canceled',
        }),
      });

      const result = await provider.cancelAsyncGeneration('prediction-async');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('canceled');
    });
  });
});
