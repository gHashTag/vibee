import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BasePlugin,
  createBasePlugin,
  BasePluginUtils,
  type BasePluginConfig,
} from '../../../src/plugins/core/base-plugin.js';
import { PluginState, PluginType } from '../../../src/plugins/core/types.js';
import type { PluginContext } from '../../../src/plugins/core/plugin.interface.js';

// Создаем тестовый плагин наследник
class TestPlugin extends BasePlugin {
  protected async onInit(): Promise<void> {
    // Mock init logic
  }

  protected async onRegister(registry: any): Promise<void> {
    // Mock register logic
  }

  protected async onStart(): Promise<void> {
    // Mock start logic
  }

  protected async onStop(): Promise<void> {
    // Mock stop logic
  }

  protected async onDestroy(): Promise<void> {
    // Mock destroy logic
  }

  protected async onHealthCheck(): Promise<Record<string, any>> {
    return {
      status: 'ok',
      checks: ['basic'],
    };
  }
}

describe('BasePlugin', () => {
  let config: BasePluginConfig;
  let mockContext: PluginContext;
  let mockLogger: any;

  beforeEach(() => {
    config = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test description',
      author: 'Test Author',
      type: PluginType.SCENE,
      dependencies: [],
      priority: 10,
      enabled: true,
      timeout: 30000,
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockContext = {
      runtime: {} as any,
      bot: {} as any,
      registry: {
        hasDependency: vi.fn().mockReturnValue(true),
        setDependency: vi.fn(),
        getDependency: vi.fn(),
      },
      logger: mockLogger,
      config: { test: 'value' },
      services: {},
    };
  });

  describe('constructor', () => {
    it('should create plugin with valid config', () => {
      const plugin = new TestPlugin(config);

      expect(plugin.id).toBe('test-plugin');
      expect(plugin.name).toBe('Test Plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Test description');
      expect(plugin.author).toBe('Test Author');
      expect(plugin.type).toBe(PluginType.SCENE);
      expect(plugin.state).toBe(PluginState.UNLOADED);
      expect(plugin.priority).toBe(10);
      expect(plugin.enabled).toBe(true);
      expect(plugin.timeout).toBe(30000);
    });

    it('should set default values', () => {
      const minimalConfig: BasePluginConfig = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
      };

      const plugin = new TestPlugin(minimalConfig);

      expect(plugin.dependencies).toEqual([]);
      expect(plugin.priority).toBe(0);
      expect(plugin.enabled).toBe(true);
      expect(plugin.timeout).toBe(30000);
    });

    it('should disable plugin when enabled is false', () => {
      const configWithDisabled = { ...config, enabled: false };
      const plugin = new TestPlugin(configWithDisabled);

      expect(plugin.enabled).toBe(false);
    });

    it('should throw error for invalid id', () => {
      const invalidConfig = { ...config, id: '' };

      expect(() => new TestPlugin(invalidConfig)).toThrow('Invalid plugin id');
    });

    it('should throw error for invalid name', () => {
      const invalidConfig = { ...config, name: '' };

      expect(() => new TestPlugin(invalidConfig)).toThrow('Invalid plugin name');
    });

    it('should throw error for invalid version', () => {
      const invalidConfig = { ...config, version: '' };

      expect(() => new TestPlugin(invalidConfig)).toThrow('Invalid plugin version');
    });

    it('should throw error for invalid type', () => {
      const invalidConfig = { ...config, type: '' as any };

      expect(() => new TestPlugin(invalidConfig)).toThrow('Invalid plugin type');
    });
  });

  describe('init', () => {
    it('should initialize plugin successfully', async () => {
      const plugin = new TestPlugin(config);
      const onInitSpy = vi.spyOn(plugin, 'onInit' as any);

      await plugin.init(mockContext);

      expect(plugin.state).toBe(PluginState.LOADED);
      expect(plugin['context']).toBe(mockContext);
      expect(plugin['logger']).toBe(mockLogger);
      expect(onInitSpy).toHaveBeenCalled();
    });

    it('should throw error if plugin is disabled', async () => {
      const disabledConfig = { ...config, enabled: false };
      const plugin = new TestPlugin(disabledConfig);

      await expect(plugin.init(mockContext)).rejects.toThrow('is disabled');
    });

    it('should check dependencies', async () => {
      const configWithDeps = {
        ...config,
        dependencies: ['dep1', 'dep2'],
      };
      mockContext.registry.hasDependency
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const plugin = new TestPlugin(configWithDeps);

      await expect(plugin.init(mockContext)).rejects.toThrow('Missing dependency: dep1');
    });

    it('should apply config from context', async () => {
      const plugin = new TestPlugin(config);
      const applyConfigSpy = vi.spyOn(plugin as any, 'applyConfig');

      await plugin.init(mockContext);

      expect(applyConfigSpy).toHaveBeenCalledWith(mockContext.config);
    });

    it('should log initialization', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle init errors', async () => {
      const plugin = new TestPlugin(config);
      vi.spyOn(plugin, 'onInit' as any).mockRejectedValue(new Error('Init failed'));

      await expect(plugin.init(mockContext)).rejects.toThrow('Init failed');
      expect(plugin.state).toBe(PluginState.UNLOADED);
    });
  });

  describe('register', () => {
    it('should register plugin successfully', async () => {
      const plugin = new TestPlugin(config);
      const mockRegistry = { test: 'registry' };
      const onRegisterSpy = vi.spyOn(plugin, 'onRegister' as any);

      await plugin.init(mockContext);
      await plugin.register(mockRegistry as any);

      expect(onRegisterSpy).toHaveBeenCalledWith(mockRegistry);
    });

    it('should throw error if not initialized', async () => {
      const plugin = new TestPlugin(config);
      const mockRegistry = {};

      await expect(plugin.register(mockRegistry as any)).rejects.toThrow('not initialized');
    });
  });

  describe('start', () => {
    it('should start plugin successfully', async () => {
      const plugin = new TestPlugin(config);
      const onStartSpy = vi.spyOn(plugin, 'onStart' as any);

      await plugin.init(mockContext);
      await plugin.start(mockContext);

      expect(plugin.state).toBe(PluginState.ACTIVE);
      expect(onStartSpy).toHaveBeenCalled();
      expect(plugin['lastActivity']).toBeInstanceOf(Date);
    });

    it('should throw error if plugin is disabled', async () => {
      const disabledConfig = { ...config, enabled: false };
      const plugin = new TestPlugin(disabledConfig);

      await plugin.init(mockContext);

      await expect(plugin.start(mockContext)).rejects.toThrow('is disabled');
    });

    it('should throw error for invalid state', async () => {
      const plugin = new TestPlugin(config);

      await expect(plugin.start(mockContext)).rejects.toThrow('Cannot start plugin');
    });

    it('should resume from SUSPENDED state', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);
      plugin['state'] = PluginState.SUSPENDED;
      const onStartSpy = vi.spyOn(plugin, 'onStart' as any);

      await plugin.start(mockContext);

      expect(plugin.state).toBe(PluginState.ACTIVE);
      expect(onStartSpy).toHaveBeenCalled();
    });

    it('should update context and logger', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);
      await plugin.start(mockContext);

      expect(plugin['context']).toBe(mockContext);
      expect(plugin['logger']).toBe(mockLogger);
    });
  });

  describe('stop', () => {
    it('should stop plugin successfully', async () => {
      const plugin = new TestPlugin(config);
      const onStopSpy = vi.spyOn(plugin, 'onStop' as any);

      await plugin.init(mockContext);
      await plugin.start(mockContext);
      await plugin.stop(mockContext);

      expect(plugin.state).toBe(PluginState.SUSPENDED);
      expect(onStopSpy).toHaveBeenCalled();
    });

    it('should throw error for invalid state', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);

      await expect(plugin.stop(mockContext)).rejects.toThrow('Cannot stop plugin');
    });

    it('should update context and logger', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);
      await plugin.start(mockContext);
      await plugin.stop(mockContext);

      expect(plugin['context']).toBe(mockContext);
      expect(plugin['logger']).toBe(mockLogger);
    });
  });

  describe('destroy', () => {
    it('should destroy plugin successfully', async () => {
      const plugin = new TestPlugin(config);
      const onDestroySpy = vi.spyOn(plugin, 'onDestroy' as any);

      await plugin.init(mockContext);
      await plugin.destroy();

      expect(plugin.state).toBe(PluginState.UNLOADED);
      expect(plugin['context']).toBeNull();
      expect(plugin['logger']).toBeNull();
      expect(onDestroySpy).toHaveBeenCalled();
    });

    it('should call onDestroy even when not initialized', async () => {
      const plugin = new TestPlugin(config);
      const onDestroySpy = vi.spyOn(plugin, 'onDestroy' as any);

      await plugin.destroy();

      expect(onDestroySpy).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const plugin = new TestPlugin(config);

      const health = await plugin.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.message).toBe('Plugin is healthy');
      expect(health.details).toBeDefined();
    });

    it('should handle health check errors', async () => {
      const plugin = new TestPlugin(config);
      vi.spyOn(plugin, 'onHealthCheck' as any).mockRejectedValue(new Error('Health check failed'));

      const health = await plugin.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.message).toContain('Health check failed');
      expect(health.details).toBeDefined();
      expect(health.details.state).toBe(PluginState.UNLOADED);
    });

    it('should update last activity', async () => {
      const plugin = new TestPlugin(config);
      const lastActivity = plugin['lastActivity'];

      vi.advanceTimersByTime(100);
      await plugin.healthCheck();

      expect(plugin['lastActivity']).not.toBe(lastActivity);
    });
  });

  describe('getMetrics', () => {
    it('should return plugin metrics', async () => {
      const plugin = new TestPlugin(config);

      const metrics = plugin.getMetrics();

      expect(metrics).toHaveProperty('id');
      expect(metrics).toHaveProperty('name');
      expect(metrics).toHaveProperty('version');
      expect(metrics).toHaveProperty('type');
      expect(metrics).toHaveProperty('state');
      expect(metrics).toHaveProperty('enabled');
      expect(metrics).toHaveProperty('priority');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('lastActivity');
      expect(metrics).toHaveProperty('config');
    });

    it('should include config in metrics', async () => {
      const plugin = new TestPlugin(config);

      plugin.updateConfig({ testKey: 'testValue' });

      const metrics = plugin.getMetrics();

      expect(metrics.config).toHaveProperty('testKey', 'testValue');
    });
  });

  describe('getUptime', () => {
    it('should return 0 for non-active plugin', () => {
      const plugin = new TestPlugin(config);

      expect(plugin.getUptime()).toBe(0);
    });

    it('should return uptime for active plugin', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);
      await plugin.start(mockContext);

      vi.advanceTimersByTime(100);

      const uptime = plugin.getUptime();

      expect(uptime).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const plugin = new TestPlugin(config);

      plugin.updateConfig({ newKey: 'newValue' });

      expect(plugin.getConfig('newKey')).toBe('newValue');
    });

    it('should merge with existing config', () => {
      const plugin = new TestPlugin(config);

      plugin.updateConfig({ key1: 'value1' });
      plugin.updateConfig({ key2: 'value2' });

      expect(plugin.getConfig()).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should apply updated config', () => {
      const plugin = new TestPlugin(config);
      const applyConfigSpy = vi.spyOn(plugin as any, 'applyConfig');

      plugin.updateConfig({ test: 'value' });

      expect(applyConfigSpy).toHaveBeenCalledWith({ test: 'value' });
    });
  });

  describe('getConfig', () => {
    it('should return full config when no key specified', () => {
      const plugin = new TestPlugin(config);

      plugin.updateConfig({ key1: 'value1' });

      const config = plugin.getConfig();

      expect(config).toHaveProperty('key1', 'value1');
    });

    it('should return config value for specific key', () => {
      const plugin = new TestPlugin(config);

      plugin.updateConfig({ key1: 'value1' });

      expect(plugin.getConfig('key1')).toBe('value1');
      expect(plugin.getConfig('non-existent')).toBeUndefined();
    });
  });

  describe('isEnabled', () => {
    it('should return true for enabled plugin', () => {
      const plugin = new TestPlugin(config);

      expect(plugin.isEnabled()).toBe(true);
    });

    it('should return false for disabled plugin', () => {
      const disabledConfig = { ...config, enabled: false };
      const plugin = new TestPlugin(disabledConfig);

      expect(plugin.isEnabled()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for active plugin', async () => {
      const plugin = new TestPlugin(config);

      await plugin.init(mockContext);
      await plugin.start(mockContext);

      expect(plugin.isActive()).toBe(true);
    });

    it('should return false for non-active plugin', () => {
      const plugin = new TestPlugin(config);

      expect(plugin.isActive()).toBe(false);
    });
  });

  describe('logging methods', () => {
    let plugin: TestPlugin;

    beforeEach(async () => {
      plugin = new TestPlugin(config);
      await plugin.init(mockContext);
    });

    it('should log info messages', () => {
      plugin['log']('Test info message', { data: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          plugin: 'Test Plugin',
          pluginId: 'test-plugin',
          data: 'test',
        }),
        'Test info message'
      );
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      plugin['error']('Test error message', error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          plugin: 'Test Plugin',
          pluginId: 'test-plugin',
          error: 'Test error',
        }),
        'Test error message'
      );
    });

    it('should log warning messages', () => {
      plugin['warn']('Test warning', { data: 'test' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          plugin: 'Test Plugin',
          pluginId: 'test-plugin',
          data: 'test',
        }),
        'Test warning'
      );
    });

    it('should log debug messages', () => {
      plugin['debug']('Test debug', { data: 'test' });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          plugin: 'Test Plugin',
          pluginId: 'test-plugin',
          data: 'test',
        }),
        'Test debug'
      );
    });

    it('should not log if logger is not available', () => {
      plugin['logger'] = null;

      plugin['log']('Test message');
      plugin['error']('Test error');
      plugin['warn']('Test warning');
      plugin['debug']('Test debug');

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });
});

describe('createBasePlugin', () => {
  it('should create a plugin instance', () => {
    const config: BasePluginConfig = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test',
      author: 'Test',
      type: PluginType.SCENE,
    };

    const plugin = createBasePlugin(config);

    expect(plugin).toBeInstanceOf(BasePlugin);
    expect(plugin.id).toBe('test-plugin');
  });
});

describe('BasePluginUtils', () => {
  describe('createIdFromName', () => {
    it('should create ID from name', () => {
      const id = BasePluginUtils.createIdFromName('My Test Plugin');

      expect(id).toBe('my-test-plugin');
    });

    it('should handle special characters', () => {
      const id = BasePluginUtils.createIdFromName('Test!@#$%Plugin');

      expect(id).toBe('test-plugin');
    });

    it('should handle edge cases', () => {
      expect(BasePluginUtils.createIdFromName('-test-')).toBe('test');
      expect(BasePluginUtils.createIdFromName('TEST')).toBe('test');
    });
  });

  describe('isValidVersion', () => {
    it('should validate correct versions', () => {
      expect(BasePluginUtils.isValidVersion('1.0.0')).toBe(true);
      expect(BasePluginUtils.isValidVersion('1.2.3')).toBe(true);
      expect(BasePluginUtils.isValidVersion('1.0.0-beta')).toBe(true);
      expect(BasePluginUtils.isValidVersion('2.1.3-alpha.1')).toBe(true);
    });

    it('should invalidate incorrect versions', () => {
      expect(BasePluginUtils.isValidVersion('1.0')).toBe(false);
      expect(BasePluginUtils.isValidVersion('1')).toBe(false);
      expect(BasePluginUtils.isValidVersion('v1.0.0')).toBe(false);
      expect(BasePluginUtils.isValidVersion('')).toBe(false);
    });
  });

  describe('getPriorityFromState', () => {
    it('should return correct priorities', () => {
      expect(BasePluginUtils.getPriorityFromState(PluginState.ACTIVE)).toBe(100);
      expect(BasePluginUtils.getPriorityFromState(PluginState.LOADED)).toBe(50);
      expect(BasePluginUtils.getPriorityFromState(PluginState.SUSPENDED)).toBe(25);
      expect(BasePluginUtils.getPriorityFromState(PluginState.ERROR)).toBe(0);
      expect(BasePluginUtils.getPriorityFromState(PluginState.UNLOADED)).toBe(0);
      expect(BasePluginUtils.getPriorityFromState(PluginState.LOADING)).toBe(0);
      expect(BasePluginUtils.getPriorityFromState(PluginState.INITIALIZING)).toBe(0);
      expect(BasePluginUtils.getPriorityFromState(PluginState.UNLOADING)).toBe(0);
    });
  });
});
