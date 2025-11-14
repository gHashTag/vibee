/**
 * Provider Interaction Integration Tests
 *
 * Tests provider interactions across the system:
 * 1. Provider initialization and configuration
 * 2. Provider selection and routing
 * 3. Provider failover mechanisms
 * 4. Provider health monitoring
 * 5. Concurrent provider access
 * 6. Provider-specific feature handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { ProviderRegistry } from '../../src/neurophoto/providers/registry/ProviderRegistry';
import { ProviderFactory } from '../../src/neurophoto/providers/registry/ProviderFactory';
import type { IImageProvider, ProviderConfig, ProviderSelectionCriteria } from '../../src/neurophoto/types';

// Mock IImageProvider
class MockProvider implements IImageProvider {
  public name: string;
  public type: string;
  private healthy: boolean = true;
  private initialized: boolean = false;
  private callCount: number = 0;

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }

  async initialize(config: ProviderConfig): Promise<void> {
    this.initialized = true;
    console.log(`MockProvider ${this.name} initialized with config:`, config.id);
  }

  async generateImage(prompt: string, options?: any): Promise<any> {
    this.callCount++;
    if (!this.healthy) {
      throw new Error(`Provider ${this.name} is unhealthy`);
    }
    return {
      success: true,
      provider: this.name,
      prompt,
      imageUrl: `https://example.com/image-${this.callCount}.jpg`,
    };
  }

  async healthCheck(): Promise<boolean> {
    return this.healthy;
  }

  getCapabilities(): any {
    return {
      loraSupport: true,
      loraTraining: true,
      pricing: {
        generation: 0.05,
      },
      averageGenerationTime: 3,
      availableModels: ['flux-lora', 'sdxl', 'stable-diffusion'],
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Test Suite
describe('Provider Interaction Integration', () => {
  let registry: ProviderRegistry;

  beforeAll(() => {
    registry = new ProviderRegistry();
  });

  afterAll(() => {
    registry.destroy();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Provider Registration
  describe('Provider Registration', () => {
    it('should register a single provider successfully', async () => {
      const mockProvider = new MockProvider('mock-fal', 'fal');
      const config: ProviderConfig = {
        id: 'test-provider',
        type: 'fal',
        name: 'Test Provider',
        enabled: true,
        priority: 100,
        apiKey: 'test-key',
        defaultModel: 'flux-lora',
      };

      registry.register(mockProvider, config);

      const provider = registry.getProvider('test-provider');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('mock-fal');
    });

    it('should handle provider re-registration', async () => {
      const provider1 = new MockProvider('provider-1', 'fal');
      const provider2 = new MockProvider('provider-2', 'fal');

      const config: ProviderConfig = {
        id: 'reregister-test',
        type: 'fal',
        name: 'Re-register Test',
        enabled: true,
        priority: 100,
        apiKey: 'test-key',
        defaultModel: 'flux-lora',
      };

      registry.register(provider1, config);
      registry.register(provider2, config);

      const provider = registry.getProvider('reregister-test');
      expect(provider?.name).toBe('provider-2'); // Should be overwritten
    });

    it('should track multiple providers', async () => {
      const providers = [
        { provider: new MockProvider('fal-1', 'fal'), config: { id: 'fal-1', type: 'fal', name: 'Fal 1', enabled: true, priority: 100, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('fal-2', 'fal'), config: { id: 'fal-2', type: 'fal', name: 'Fal 2', enabled: true, priority: 90, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('replicate-1', 'replicate'), config: { id: 'replicate-1', type: 'replicate', name: 'Replicate 1', enabled: true, priority: 80, apiKey: 'key', defaultModel: 'sdxl' } as ProviderConfig },
      ];

      providers.forEach(({ provider, config }) => {
        registry.register(provider, config);
      });

      const allProviders = registry.listProviders();
      expect(allProviders).toHaveLength(3);
    });
  });

  // Test 2: Provider Selection
  describe('Provider Selection', () => {
    beforeEach(async () => {
      const providers = [
        { provider: new MockProvider('high-priority', 'fal'), config: { id: 'high', type: 'fal', name: 'High Priority', enabled: true, priority: 100, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('mid-priority', 'replicate'), config: { id: 'mid', type: 'replicate', name: 'Mid Priority', enabled: true, priority: 80, apiKey: 'key', defaultModel: 'sdxl' } as ProviderConfig },
        { provider: new MockProvider('low-priority', 'stability'), config: { id: 'low', type: 'stability', name: 'Low Priority', enabled: true, priority: 60, apiKey: 'key', defaultModel: 'sd' } as ProviderConfig },
      ];

      providers.forEach(({ provider, config }) => {
        registry.register(provider, config);
      });
    });

    it('should select highest priority provider by default', async () => {
      const activeProvider = registry.getActiveProvider();
      expect(activeProvider).toBeDefined();
      expect(activeProvider?.name).toBe('high-priority');
    });

    it('should manually set active provider', async () => {
      registry.setActiveProvider('mid');

      const activeProvider = registry.getActiveProvider();
      expect(activeProvider?.name).toBe('mid-priority');
    });

    it('should select best provider based on criteria', async () => {
      const criteria: ProviderSelectionCriteria = {
        requiresLora: true,
        maxCost: 0.06,
        maxGenerationTime: 5,
      };

      const provider = registry.selectBestProvider(criteria);
      expect(provider).toBeDefined();
    });

    it('should handle empty provider list', async () => {
      registry.destroy();
      registry = new ProviderRegistry();

      const provider = registry.selectBestProvider({ requiresLora: true });
      expect(provider).toBeNull();
    });
  });

  // Test 3: Provider Health Monitoring
  describe('Provider Health Monitoring', () => {
    it('should perform health checks on all providers', async () => {
      const provider = new MockProvider('health-check-test', 'fal');
      const config: ProviderConfig = {
        id: 'health-test',
        type: 'fal',
        name: 'Health Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);

      const isHealthy = await registry.checkHealth('health-test');
      expect(isHealthy).toBe(true);
    });

    it('should detect unhealthy providers', async () => {
      const provider = new MockProvider('unhealthy-test', 'fal');
      const config: ProviderConfig = {
        id: 'unhealthy',
        type: 'fal',
        name: 'Unhealthy Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);
      provider.setHealthy(false);

      const isHealthy = await registry.checkHealth('unhealthy');
      expect(isHealthy).toBe(false);
    });

    it('should handle health check for non-existent provider', async () => {
      const isHealthy = await registry.checkHealth('non-existent-provider');
      expect(isHealthy).toBe(false);
    });
  });

  // Test 4: Provider Configuration
  describe('Provider Configuration', () => {
    it('should update provider configuration', async () => {
      const provider = new MockProvider('config-test', 'fal');
      const config: ProviderConfig = {
        id: 'config-update-test',
        type: 'fal',
        name: 'Config Update Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);

      registry.updateProviderConfig('config-update-test', { enabled: false, priority: 50 });

      const updatedConfig = registry.getProviderConfig('config-update-test');
      expect(updatedConfig?.enabled).toBe(false);
      expect(updatedConfig?.priority).toBe(50);
    });

    it('should retrieve provider configuration', async () => {
      const provider = new MockProvider('config-retrieve', 'fal');
      const config: ProviderConfig = {
        id: 'retrieve-test',
        type: 'fal',
        name: 'Retrieve Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);

      const retrievedConfig = registry.getProviderConfig('retrieve-test');
      expect(retrievedConfig).toBeDefined();
      expect(retrievedConfig?.name).toBe('Retrieve Test');
    });

    it('should return null for non-existent configuration', () => {
      const config = registry.getProviderConfig('non-existent-config');
      expect(config).toBeNull();
    });
  });

  // Test 5: Provider Unregistration
  describe('Provider Unregistration', () => {
    it('should unregister a provider', async () => {
      const provider = new MockProvider('unregister-test', 'fal');
      const config: ProviderConfig = {
        id: 'unregister',
        type: 'fal',
        name: 'Unregister Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);
      expect(registry.getProvider('unregister')).toBeDefined();

      registry.unregister('unregister');
      expect(registry.getProvider('unregister')).toBeNull();
    });

    it('should handle unregistering non-existent provider', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow();
    });

    it('should select new active provider when current is unregistered', async () => {
      const provider1 = new MockProvider('active-provider', 'fal');
      const provider2 = new MockProvider('backup-provider', 'replicate');

      registry.register(provider1, {
        id: 'active',
        type: 'fal',
        name: 'Active',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      });

      registry.register(provider2, {
        id: 'backup',
        type: 'replicate',
        name: 'Backup',
        enabled: true,
        priority: 80,
        apiKey: 'key',
        defaultModel: 'sdxl',
      });

      expect(registry.getActiveProvider()?.name).toBe('active-provider');

      registry.unregister('active');

      // Should switch to backup provider
      const newActive = registry.getActiveProvider();
      expect(newActive?.name).toBe('backup-provider');
    });
  });

  // Test 6: Concurrent Provider Access
  describe('Concurrent Provider Access', () => {
    it('should handle concurrent generation requests', async () => {
      const provider = new MockProvider('concurrent-test', 'fal');
      const config: ProviderConfig = {
        id: 'concurrent',
        type: 'fal',
        name: 'Concurrent Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);

      const requests = Array.from({ length: 10 }, (_, i) =>
        provider.generateImage(`prompt-${i}`)
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      expect(provider.getCallCount()).toBe(10);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle concurrent provider selection', async () => {
      const selections = Array.from({ length: 50 }, () => registry.getActiveProvider());
      const providers = new Set(selections.map(p => p?.name));

      expect(providers.size).toBeGreaterThan(0);
    });
  });

  // Test 7: Provider Factory
  describe('Provider Factory', () => {
    it('should create providers by type', () => {
      const falProvider = ProviderFactory.createProvider('fal');
      const replicateProvider = ProviderFactory.createProvider('replicate');
      const stabilityProvider = ProviderFactory.createProvider('stability');

      expect(falProvider).toBeDefined();
      expect(replicateProvider).toBeDefined();
      expect(stabilityProvider).toBeDefined();
    });

    it('should create default providers when configured', () => {
      const providers = ProviderFactory.createDefaultProviders();

      // Will be empty in test environment without API keys
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should check provider configuration', () => {
      const isConfigured = ProviderFactory.isProviderConfigured('fal');
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should get configured provider types', () => {
      const configured = ProviderFactory.getConfiguredProviders();
      expect(Array.isArray(configured)).toBe(true);
    });

    it('should throw error for unknown provider type', () => {
      expect(() => ProviderFactory.createProvider('unknown' as any)).toThrow();
    });

    it('should get environment variables for provider', () => {
      const envVars = ProviderFactory.getProviderEnvVars('fal');
      expect(envVars).toContain('FAL_KEY');
      expect(envVars).toContain('FAL_API_KEY');
    });
  });

  // Test 8: Provider Capabilities
  describe('Provider Capabilities', () => {
    it('should expose provider capabilities', () => {
      const provider = new MockProvider('capabilities-test', 'fal');
      const capabilities = provider.getCapabilities();

      expect(capabilities).toHaveProperty('loraSupport');
      expect(capabilities).toHaveProperty('loraTraining');
      expect(capabilities).toHaveProperty('pricing');
      expect(capabilities).toHaveProperty('averageGenerationTime');
      expect(capabilities).toHaveProperty('availableModels');
    });

    it('should compare provider capabilities', () => {
      const provider1 = new MockProvider('provider-1', 'fal');
      const provider2 = new MockProvider('provider-2', 'replicate');

      const cap1 = provider1.getCapabilities();
      const cap2 = provider2.getCapabilities();

      expect(cap1.loraSupport).toBeDefined();
      expect(cap2.loraSupport).toBeDefined();
    });
  });

  // Test 9: Error Recovery
  describe('Error Recovery', () => {
    it('should recover from provider initialization failure', async () => {
      const provider = new MockProvider('recovery-test', 'fal');
      const config: ProviderConfig = {
        id: 'recovery',
        type: 'fal',
        name: 'Recovery Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      // Initialize successfully
      await registry.register(provider, config);

      // Set unhealthy
      provider.setHealthy(false);

      // Check health
      const isHealthy = await registry.checkHealth('recovery');
      expect(isHealthy).toBe(false);

      // Set healthy again
      provider.setHealthy(true);

      // Check health again
      const isHealthyAgain = await registry.checkHealth('recovery');
      expect(isHealthyAgain).toBe(true);
    });

    it('should handle provider generation errors', async () => {
      const provider = new MockProvider('error-test', 'fal');
      const config: ProviderConfig = {
        id: 'error-handling',
        type: 'fal',
        name: 'Error Handling Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);
      provider.setHealthy(false);

      await expect(provider.generateImage('test prompt')).rejects.toThrow();
    });
  });

  // Test 10: System Integration
  describe('System Integration', () () => {
    it('should integrate all provider operations', async () => {
      // Register providers
      const providers = [
        { provider: new MockProvider('sys-fal', 'fal'), config: { id: 'sys-fal', type: 'fal', name: 'System Fal', enabled: true, priority: 100, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('sys-replicate', 'replicate'), config: { id: 'sys-rep', type: 'replicate', name: 'System Rep', enabled: true, priority: 80, apiKey: 'key', defaultModel: 'sdxl' } as ProviderConfig },
      ];

      providers.forEach(({ provider, config }) => {
        registry.register(provider, config);
      });

      // Verify registration
      expect(registry.listProviders()).toHaveLength(2);

      // Get active provider
      const active = registry.getActiveProvider();
      expect(active).toBeDefined();

      // Update configuration
      registry.updateProviderConfig('sys-fal', { priority: 90 });

      // Check health
      const isHealthy = await registry.checkHealth('sys-fal');
      expect(isHealthy).toBe(true);

      // Unregister one provider
      registry.unregister('sys-rep');

      // Verify state
      expect(registry.listProviders()).toHaveLength(1);
    });

    it('should maintain provider state across operations', async () => {
      const provider = new MockProvider('state-test', 'fal');
      const config: ProviderConfig = {
        id: 'state',
        type: 'fal',
        name: 'State Test',
        enabled: true,
        priority: 100,
        apiKey: 'key',
        defaultModel: 'flux',
      };

      registry.register(provider, config);

      // Generate image
      await provider.generateImage('state test prompt');

      // Update config
      registry.updateProviderConfig('state', { priority: 50 });

      // Check state is maintained
      expect(registry.getProvider('state')).toBeDefined();
      expect(registry.getProviderConfig('state')?.priority).toBe(50);
    });

    it('should handle provider list sorting by priority', async () => {
      const providers = [
        { provider: new MockProvider('low', 'fal'), config: { id: 'low', type: 'fal', name: 'Low', enabled: true, priority: 60, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('high', 'fal'), config: { id: 'high', type: 'fal', name: 'High', enabled: true, priority: 100, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
        { provider: new MockProvider('mid', 'fal'), config: { id: 'mid', type: 'fal', name: 'Mid', enabled: true, priority: 80, apiKey: 'key', defaultModel: 'flux' } as ProviderConfig },
      ];

      providers.forEach(({ provider, config }) => {
        registry.register(provider, config);
      });

      const sortedProviders = registry.listProviders();

      expect(sortedProviders[0].priority).toBe(100);
      expect(sortedProviders[1].priority).toBe(80);
      expect(sortedProviders[2].priority).toBe(60);
    });
  });
});
