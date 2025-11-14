/**
 * Unit Tests for Plugin Core System
 * Test plugin registry and core plugin management
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

// Mock the Plugin interface
interface TestPlugin {
  name: string;
  version: string;
  initialize: (runtime: IAgentRuntime) => Promise<void>;
  actions: any[];
  providers: any[];
}

describe('PluginRegistry', () => {
  let PluginRegistry: any;
  let mockRuntime: IAgentRuntime;

  beforeAll(async () => {
    const module = await import('../../../src/plugins/core/PluginRegistry');
    PluginRegistry = module.PluginRegistry;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = {
      registerPlugin: vi.fn(),
      unregisterPlugin: vi.fn(),
      getPlugin: vi.fn(),
      getPlugins: vi.fn(),
    } as any;
  });

  describe('Registry Initialization', () => {
    it('should create plugin registry', () => {
      const registry = new PluginRegistry(mockRuntime);

      expect(registry).toBeDefined();
      expect(registry.runtime).toBe(mockRuntime);
    });

    it('should auto-discover plugins', () => {
      const registry = new PluginRegistry(mockRuntime);

      expect(registry.getDiscoveredPlugins()).toBeDefined();
    });
  });

  describe('Plugin Registration', () => {
    it('should register valid plugin', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const testPlugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        actions: [],
        providers: [],
      };

      await registry.register(testPlugin);

      expect(mockRuntime.registerPlugin).toHaveBeenCalledWith('test-plugin', testPlugin);
    });

    it('should reject plugin without name', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const invalidPlugin = {
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      } as any;

      await expect(registry.register(invalidPlugin)).rejects.toThrow('Plugin must have a name');
    });

    it('should reject duplicate plugin', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'duplicate-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      await registry.register(plugin);

      await expect(registry.register(plugin)).rejects.toThrow('already registered');
    });

    it('should call plugin initialize method', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const initializeSpy = vi.fn().mockResolvedValue(undefined);
      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: initializeSpy,
        actions: [],
        providers: [],
      };

      await registry.register(plugin);

      expect(initializeSpy).toHaveBeenCalledWith(mockRuntime);
    });
  });

  describe('Plugin Unregistration', () => {
    it('should unregister existing plugin', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      await registry.register(plugin);
      await registry.unregister('test-plugin');

      expect(mockRuntime.unregisterPlugin).toHaveBeenCalledWith('test-plugin');
    });

    it('should handle unregistering non-existent plugin', async () => {
      const registry = new PluginRegistry(mockRuntime);

      await expect(registry.unregister('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('Plugin Retrieval', () => {
    it('should get registered plugin by name', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      await registry.register(plugin);

      const retrieved = await registry.getPlugin('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const retrieved = await registry.getPlugin('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all registered plugins', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin1: TestPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };
      const plugin2: TestPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      await registry.register(plugin1);
      await registry.register(plugin2);

      const plugins = await registry.getAllPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(plugin1);
      expect(plugins).toContain(plugin2);
    });
  });

  describe('Plugin Discovery', () => {
    it('should discover plugins from directory', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const plugins = await registry.discoverPlugins('./src/plugins');

      expect(plugins).toBeDefined();
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should filter discovered plugins', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const plugins = await registry.discoverPlugins('./src/plugins', {
        onlyEnabled: true,
        matchingPattern: /^ai-photoshop/,
      });

      expect(plugins).toBeDefined();
    });
  });

  describe('Plugin Dependencies', () => {
    it('should validate plugin dependencies', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'dependent-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      // Mock dependencies
      (plugin as any).dependencies = ['required-plugin'];

      await expect(registry.register(plugin, { skipDependencyCheck: false }))
        .rejects.toThrow('Dependencies not satisfied');
    });

    it('should auto-install missing dependencies', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      const result = await registry.register(plugin, {
        autoInstallDependencies: true,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should start all plugins', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin1 = {
        name: 'plugin-1',
        version: '1.0.0',
        initialize: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        actions: [],
        providers: [],
      };
      const plugin2 = {
        name: 'plugin-2',
        version: '1.0.0',
        initialize: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        actions: [],
        providers: [],
      };

      await registry.register(plugin1);
      await registry.register(plugin2);

      await registry.startAll();

      expect(plugin1.start).toHaveBeenCalled();
      expect(plugin2.start).toHaveBeenCalled();
    });

    it('should stop all plugins', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin1 = {
        name: 'plugin-1',
        version: '1.0.0',
        initialize: vi.fn(),
        start: vi.fn(),
        stop: vi.fn().mockResolvedValue(undefined),
        actions: [],
        providers: [],
      };

      await registry.register(plugin1);
      await registry.startAll();
      await registry.stopAll();

      expect(plugin1.stop).toHaveBeenCalled();
    });

    it('should handle errors during plugin lifecycle', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const pluginWithError = {
        name: 'error-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        start: vi.fn().mockRejectedValue(new Error('Start failed')),
        actions: [],
        providers: [],
      };

      await registry.register(pluginWithError);

      await expect(registry.startAll()).rejects.toThrow('Start failed');
    });
  });

  describe('Plugin Health Check', () => {
    it('should check plugin health', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' }),
        actions: [],
        providers: [],
      };

      await registry.register(plugin);

      const health = await registry.checkPluginHealth('test-plugin');
      expect(health.status).toBe('healthy');
    });

    it('should handle missing health check', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const plugin: TestPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        actions: [],
        providers: [],
      };

      await registry.register(plugin);

      const health = await registry.checkPluginHealth('test-plugin');
      expect(health.status).toBe('unknown');
    });

    it('should aggregate health of all plugins', async () => {
      const registry = new PluginRegistry(mockRuntime);
      const healthyPlugin = {
        name: 'healthy',
        version: '1.0.0',
        initialize: vi.fn(),
        healthCheck: vi.fn().mockResolvedValue({ status: 'healthy' }),
        actions: [],
        providers: [],
      };
      const unhealthyPlugin = {
        name: 'unhealthy',
        version: '1.0.0',
        initialize: vi.fn(),
        healthCheck: vi.fn().mockResolvedValue({ status: 'unhealthy', error: 'Test error' }),
        actions: [],
        providers: [],
      };

      await registry.register(healthyPlugin);
      await registry.register(unhealthyPlugin);

      const health = await registry.checkAllPluginsHealth();

      expect(health.healthy).toBe(1);
      expect(health.unhealthy).toBe(1);
      expect(health.details.unhealthy.error).toBe('Test error');
    });
  });

  describe('Plugin Configuration', () => {
    it('should load plugin configuration', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const config = await registry.loadPluginConfig('test-plugin');

      expect(config).toBeDefined();
    });

    it('should save plugin configuration', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const testConfig = { key: 'value' };
      await registry.savePluginConfig('test-plugin', testConfig);

      expect(mockRuntime.setSetting).toHaveBeenCalled();
    });

    it('should validate configuration', async () => {
      const registry = new PluginRegistry(mockRuntime);

      const validConfig = {
        apiKey: 'test-key',
        enabled: true,
        timeout: 5000,
      };

      expect(registry.validateConfig(validConfig)).toBe(true);

      const invalidConfig = {
        apiKey: '', // Empty
        enabled: 'yes', // Wrong type
      };

      expect(registry.validateConfig(invalidConfig)).toBe(false);
    });
  });
});
