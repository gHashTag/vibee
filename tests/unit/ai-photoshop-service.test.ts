/**
 * Unit Tests for AI Photoshop Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIPhotoshopService } from '../../src/ai-photoshop/service';
import type { AIPhotoshopRequest } from '../../src/ai-photoshop/types';

describe('AIPhotoshopService', () => {
  let service: AIPhotoshopService;
  let mockRuntime: any;

  beforeEach(() => {
    service = new AIPhotoshopService();

    // Mock runtime with API key
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        if (key === 'REPLICATE_API_KEY') {
          return 'test_api_key_123';
        }
        return undefined;
      }),
    };
  });

  describe('Initialization', () => {
    it('should initialize with API key', async () => {
      await service.initialize(mockRuntime);
      expect(mockRuntime.getSetting).toHaveBeenCalledWith('REPLICATE_API_KEY');
    });

    it('should warn if API key is missing', async () => {
      const noKeyRuntime = {
        getSetting: vi.fn(() => undefined),
      };

      await service.initialize(noKeyRuntime);
      expect(noKeyRuntime.getSetting).toHaveBeenCalledWith('REPLICATE_API_KEY');
    });

    it('should have correct service type', () => {
      expect(AIPhotoshopService.serviceType).toBe('ai-photoshop');
    });
  });

  describe('Model Management', () => {
    it('should return all available models', () => {
      const models = service.getAvailableModels();

      expect(models).toContain('seedream');
      expect(models).toContain('nano_banana');
      expect(models).toContain('flux_multi_kontext');
      expect(models).toContain('qwen_edit_plus');
      expect(models).toContain('flux_kontext_pro');
      expect(models).toContain('seededit_3');
      expect(models).toContain('qwen_image_edit');
      expect(models).toHaveLength(7);
    });

    it('should return model costs', () => {
      expect(service.getModelCost('seedream')).toBe(0.03);
      expect(service.getModelCost('nano_banana')).toBe(0.039);
      expect(service.getModelCost('flux_kontext_pro')).toBe(0.05);
      expect(service.getModelCost('qwen_image_edit')).toBe(0.025);
    });

    it('should return default cost for unknown model', () => {
      const cost = service.getModelCost('unknown_model' as any);
      expect(cost).toBe(0.03);
    });
  });

  describe('Request Validation', () => {
    it('should fail without API key', async () => {
      // Don't initialize, so no API key
      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Make it dramatic',
        model: 'seedream',
      };

      const result = await service.processImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('REPLICATE_API_KEY');
    });

    it('should fail with unknown model', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Make it dramatic',
        model: 'unknown_model' as any,
      };

      const result = await service.processImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown model');
    });
  });

  describe('Enhanced Prompt Building', () => {
    it('should build prompt with camera angle', async () => {
      await service.initialize(mockRuntime);

      // We'll test via the private method indirectly through processImage
      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance colors',
        model: 'seedream',
        cameraAngle: 'close_up',
      };

      // Mock fetch to see what prompt is sent
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should build prompt with lighting', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance colors',
        model: 'seedream',
        lighting: 'golden_hour',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should build prompt with composition', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance colors',
        model: 'seedream',
        composition: 'rule_thirds',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should build prompt with all enhancements', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance colors',
        model: 'seedream',
        cameraAngle: 'close_up',
        lighting: 'golden_hour',
        composition: 'rule_thirds',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Quality Settings', () => {
    it('should handle 1K quality', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
        quality: '1K',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle 2K quality', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
        quality: '2K',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle 4K quality', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
        quality: '4K',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
      };

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.processImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle API errors', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await service.processImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Replicate API error');
    });
  });

  describe('Aspect Ratios', () => {
    it('should use default aspect ratio', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.input.aspect_ratio).toBe('9:16');
    });

    it('should use custom aspect ratio', async () => {
      await service.initialize(mockRuntime);

      const request: AIPhotoshopRequest = {
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'Enhance',
        model: 'seedream',
        aspectRatio: '16:9',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await service.processImage(request);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.input.aspect_ratio).toBe('16:9');
    });
  });
});
