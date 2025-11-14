/**
 * Unit Tests for KieAI Provider
 * Test video generation with Kie.ai API
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('KieAIProvider', () => {
  let KieAIProvider: any;
  let mockRuntime: IAgentRuntime;

  beforeAll(async () => {
    // Dynamically import to avoid ESM issues
    const module = await import('../../../src/neurophoto/providers/implementations/KieAiProvider');
    KieAIProvider = module.KieAIProvider;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        if (key === 'KIE_AI_API_KEY') {
          return 'test-api-key-12345';
        }
        if (key === 'KIE_AI_BASE_URL') {
          return 'https://test-api.kie.ai/v1';
        }
        return undefined;
      }),
    } as any;
  });

  describe('Initialization', () => {
    it('should initialize with API key and base URL', async () => {
      const provider = new KieAIProvider(mockRuntime);

      expect(provider).toBeDefined();
      expect(provider.getApiKey()).toBe('test-api-key-12345');
      expect(provider.getBaseUrl()).toBe('https://test-api.kie.ai/v1');
    });

    it('should use default base URL if not configured', async () => {
      const mockRuntimeNoBase = {
        getSetting: vi.fn((key: string) => {
          if (key === 'KIE_AI_API_KEY') {
            return 'test-key';
          }
          return undefined;
        }),
      } as any;

      const provider = new KieAIProvider(mockRuntimeNoBase);
      expect(provider.getBaseUrl()).toBe('https://api.kie.ai/v1');
    });

    it('should handle missing API key gracefully', async () => {
      const mockRuntimeNoKey = {
        getSetting: vi.fn(() => undefined),
      } as any;

      const provider = new KieAIProvider(mockRuntimeNoKey);
      expect(provider.getApiKey()).toBeUndefined();
    });
  });

  describe('Video Generation', () => {
    it('should generate video with valid parameters', async () => {
      const provider = new KieAIProvider(mockRuntime);

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'video-12345',
          status: 'completed',
          result: {
            url: 'https://example.com/video.mp4',
            duration: 5,
          },
        }),
      });

      const result = await provider.generateVideo({
        model: 'veo3',
        prompt: 'A cat playing piano',
        duration: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url');
      expect(result.data?.url).toBe('https://example.com/video.mp4');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.kie.ai/v1/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key-12345',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle veo2 model', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'video-67890',
          status: 'completed',
          result: { url: 'https://example.com/video2.mp4' },
        }),
      });

      const result = await provider.generateVideo({
        model: 'veo2',
        prompt: 'A dog dancing',
        duration: 3,
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('kie-ai');
      expect(result.model).toBe('veo2');
    });

    it('should fail without API key', async () => {
      const mockRuntimeNoKey = {
        getSetting: vi.fn(() => undefined),
      } as any;

      const provider = new KieAIProvider(mockRuntimeNoKey);

      const result = await provider.generateVideo({
        model: 'veo3',
        prompt: 'A cat playing piano',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });

    it('should fail with invalid model', async () => {
      const provider = new KieAIProvider(mockRuntime);

      const result = await provider.generateVideo({
        model: 'invalid-model' as any,
        prompt: 'A cat playing piano',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported model');
    });

    it('should handle API error', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await provider.generateVideo({
        model: 'veo3',
        prompt: 'A cat playing piano',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API error');
    });

    it('should handle network error', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.generateVideo({
        model: 'veo3',
        prompt: 'A cat playing piano',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Supported Models', () => {
    it('should return list of supported models', () => {
      const provider = new KieAIProvider(mockRuntime);
      const models = provider.getSupportedModels();

      expect(models).toContain('veo3');
      expect(models).toContain('veo2');
    });

    it('should validate model support', () => {
      const provider = new KieAIProvider(mockRuntime);

      expect(provider.isModelSupported('veo3')).toBe(true);
      expect(provider.isModelSupported('veo2')).toBe(true);
      expect(provider.isModelSupported('invalid')).toBe(false);
    });
  });

  describe('Pricing', () => {
    it('should return correct pricing for veo3', () => {
      const provider = new KieAIProvider(mockRuntime);

      const pricing = provider.getModelPricing('veo3');
      expect(pricing).toBeGreaterThan(0);
    });

    it('should return default pricing for unknown model', () => {
      const provider = new KieAIProvider(mockRuntime);

      const pricing = provider.getModelPricing('unknown-model' as any);
      expect(pricing).toBe(0);
    });
  });

  describe('Async Generation', () => {
    it('should start async generation', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({
          id: 'generation-12345',
          status: 'processing',
        }),
      });

      const result = await provider.startAsyncGeneration({
        model: 'veo3',
        prompt: 'A cat playing piano',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('generationId');
      expect(result.data?.generationId).toBe('generation-12345');
    });

    it('should check generation status', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'generation-12345',
          status: 'completed',
          result: { url: 'https://example.com/video.mp4' },
        }),
      });

      const result = await provider.checkGenerationStatus('generation-12345');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });

    it('should handle failed generation', async () => {
      const provider = new KieAIProvider(mockRuntime);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'generation-12345',
          status: 'failed',
          error: 'Generation failed',
        }),
      });

      const result = await provider.checkGenerationStatus('generation-12345');

      expect(result.success).toBe(false);
      expect(result.error).toContain('failed');
    });
  });
});
