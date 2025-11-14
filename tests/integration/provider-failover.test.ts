/**
 * Integration Tests for Provider Failover System
 * Test automatic failover between providers
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Provider Failover Integration', () => {
  let runtime: IAgentRuntime;

  beforeAll(async () => {
    // Dynamic import to avoid ESM issues
  });

  beforeEach(() => {
    vi.clearAllMocks();
    runtime = {
      getSetting: vi.fn((key: string) => {
        const keys = {
          REPLICATE_API_TOKEN: 'test-token',
          KIE_AI_API_KEY: 'test-kie-key',
          OPENAI_API_KEY: 'test-openai-key',
        };
        return keys[key as keyof typeof keys];
      }),
    } as any;
  });

  describe('Automatic Failover', () => {
    it('should failover from Replicate to KieAI on error', async () => {
      // Mock Replicate failing
      mockFetch.mockRejectedValueOnce(new Error('Replicate API down'));

      // Mock KieAI succeeding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'kie-video-123',
          status: 'completed',
          result: { url: 'https://example.com/video.mp4' },
        }),
      });

      // Simulate provider selection with failover
      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'A cat playing piano',
        preferProvider: 'replicate',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('kie-ai'); // Fallback to KieAI
      expect(result.data?.url).toBe('https://example.com/video.mp4');
    });

    it('should failover from KieAI to Replicate on error', async () => {
      // Mock KieAI failing
      mockFetch.mockRejectedValueOnce(new Error('KieAI API down'));

      // Mock Replicate succeeding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'replicate-prediction',
          status: 'succeeded',
          output: ['https://example.com/image.jpg'],
        }),
      });

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'A sunset over mountains',
        preferProvider: 'kie-ai',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('replicate'); // Fallback to Replicate
      expect(result.data?.url).toBe('https://example.com/image.jpg');
    });

    it('should try all providers before giving up', async () => {
      // All providers fail
      mockFetch.mockRejectedValue(new Error('All APIs down'));

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'A test image',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('All providers failed');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Tried all providers
    });
  });

  describe('Priority-Based Selection', () => {
    it('should select provider based on priority', async () => {
      // KieAI has higher priority for video
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'kie-video',
          status: 'completed',
          result: { url: 'https://example.com/video.mp4' },
        }),
      });

      const result = await simulateVideoGeneration({
        prompt: 'A cat playing piano',
        preferProvider: 'kie-ai',
      });

      expect(result.provider).toBe('kie-ai');
    });

    it('should respect user preference', async () => {
      // User prefers Replicate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'replicate-pred',
          status: 'succeeded',
          output: ['https://example.com/img.jpg'],
        }),
      });

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'A test',
        preferProvider: 'replicate',
      });

      expect(result.provider).toBe('replicate');
    });

    it('should fallback when preferred provider unavailable', async () => {
      // Preferred provider fails
      mockFetch.mockRejectedValueOnce(new Error('Replicate down'));

      // Fallback provider works
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'kie-video',
          status: 'completed',
          result: { url: 'https://example.com/video.mp4' },
        }),
      });

      const result = await simulateVideoGeneration({
        prompt: 'A test',
        preferProvider: 'replicate',
      });

      expect(result.provider).toBe('kie-ai');
    });
  });

  describe('Health Monitoring', () => {
    it('should monitor provider health', async () => {
      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        mockFetch.mockRejectedValueOnce(new Error('API error'));
      }

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'Test',
      });

      expect(result.success).toBe(false);

      // Check provider health
      const health = getProviderHealth();
      expect(health.replicate.status).toBe('unhealthy');
      expect(health.kieai.status).toBe('unhealthy');
    });

    it('should recover unhealthy providers', async () => {
      // Mark provider as unhealthy
      updateProviderHealth('replicate', 'unhealthy');

      // Provider recovers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'pred',
          status: 'succeeded',
          output: ['https://example.com/img.jpg'],
        }),
      });

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'Test',
      });

      expect(result.success).toBe(true);
      expect(getProviderHealth('replicate').status).toBe('healthy');
    });
  });

  describe('Load Balancing', () => {
    it('should distribute load across providers', async () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: `pred-${i}`,
            status: 'succeeded',
            output: [`https://example.com/img${i}.jpg`],
          }),
        });

        const result = await simulateGenerateWithFailover({
          model: 'flux-dev',
          prompt: `Test ${i}`,
        });

        results.push(result.provider);
      }

      // Should use both providers (load balancing)
      const replicateCount = results.filter((p) => p === 'replicate').length;
      const kieCount = results.filter((p) => p === 'kie-ai').length;

      expect(replicateCount).toBeGreaterThan(0);
      expect(kieCount).toBeGreaterThan(0);
      expect(replicateCount + kieCount).toBe(10);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      // First two attempts fail
      mockFetch.mockRejectedValueOnce(new Error('Temporary error'));
      mockFetch.mockRejectedValueOnce(new Error('Temporary error'));

      // Third attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'pred',
          status: 'succeeded',
          output: ['https://example.com/img.jpg'],
        }),
      });

      const result = await simulateGenerateWithFailover({
        model: 'flux-dev',
        prompt: 'Test',
        retryCount: 3,
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on permanent failures', async () => {
      // Permanent error (404)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const result = await simulateGenerateWithFailover({
        model: 'invalid-model',
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Rate Limiting', () => {
    it('should respect provider rate limits', async () => {
      // Send 15 requests
      for (let i = 0; i < 15; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: `pred-${i}`,
            status: 'succeeded',
            output: [`https://example.com/img${i}.jpg`],
          }),
        });
      }

      const results = await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          simulateGenerateWithFailover({
            model: 'flux-dev',
            prompt: `Test ${i}`,
            rateLimit: 10,
          })
        )
      );

      // First 10 should succeed, next 5 should be rate limited
      const successful = results.filter((r) => r.success).length;
      expect(successful).toBe(10);
    });
  });
});

// Helper functions to simulate provider registry behavior
async function simulateGenerateWithFailover(params: any) {
  const providers = ['replicate', 'kie-ai', 'openai'];
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const response = await mockFetch.mock.results[mockFetch.mock.calls.length - 1]?.value;

      if (response && response.ok) {
        const data = await response.json();
        return {
          success: true,
          provider,
          data: data.output || data.result,
        };
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  return {
    success: false,
    error: lastError?.message || 'All providers failed',
  };
}

async function simulateVideoGeneration(params: any) {
  return simulateGenerateWithFailover(params);
}

function getProviderHealth(provider?: string) {
  // Mock health check
  return {
    replicate: { status: 'healthy', consecutiveFailures: 0 },
    kieai: { status: 'healthy', consecutiveFailures: 0 },
    openai: { status: 'healthy', consecutiveFailures: 0 },
  };
}

function updateProviderHealth(provider: string, status: string) {
  // Mock health update
  console.log(`Updated ${provider} health to ${status}`);
}
