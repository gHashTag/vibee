import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginManager } from '../../../src/plugins/core/plugin-manager.js';
import { PluginState, PluginType } from '../../../src/plugins/core/types.js';
import type { IPlugin, PluginObserver, PluginManagerEvent } from '../../../src/plugins/core/plugin.interface.js';

describe('PluginManager', () => {
  let manager: PluginManager;
  let mockRuntime: any;
  let mockBot: any;
  let mockLogger: any;
  let mockConfig: Record<string, any>;

  beforeEach(() => {
    manager = new PluginManager();
    mockRuntime = {};
    mockBot = {};
    mockLogger = {
      warn: vi.fn(),
      error: vi.fn(),
    };
    mockConfig = { test: 'config' };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);

      expect(manager.state).toBe(PluginState.LOADED);
    });

    it('should warn if already initialized', async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);

      expect(mockLogger.warn).toHaveBeenCalledWith('PluginManager is already initialized');
    });

    it('should throw error if calling lifecycle methods before init', async () => {
      await expect(manager.register({
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      } as IPlugin)).rejects.toThrow('PluginManager is not initialized');
    });
  });

  describe('register', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should register a plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin);

      const registered = manager.get('test-plugin');
      expect(registered).toBe(plugin);
    });

    it('should throw error if plugin already registered', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin);
      await expect(manager.register(plugin)).rejects.toThrow('Plugin with id \'test-plugin\' is already registered');
    });

    it('should throw error for invalid plugin', async () => {
      const invalidPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await expect(manager.register(invalidPlugin as any)).rejects.toThrow('Invalid plugin');
    });

    it('should register dependencies', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        dependencies: ['dep1', 'dep2'],
        register: vi.fn(),
      };

      await manager.register(plugin);

      // Dependencies should be registered internally
      expect(manager.get('test-plugin')).toBe(plugin);
    });

    it('should auto-init if autoInit option is true', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin, { autoInit: true });

      // Plugin should be initialized
      expect(plugin.state).toBe(PluginState.LOADED);
    });

    it('should notify observers when plugin is registered', async () => {
      const observer: PluginObserver = {
        onPluginRegistered: vi.fn(),
      };

      manager.addObserver(observer);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin);

      expect(observer.onPluginRegistered).toHaveBeenCalledWith(plugin);
    });
  });

  describe('init', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should initialize a plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');

      expect(plugin.init).toHaveBeenCalled();
      expect(plugin.register).toHaveBeenCalled();
      expect(plugin.state).toBe(PluginState.LOADED);
    });

    it('should throw error if plugin not found', async () => {
      await expect(manager.init('non-existent')).rejects.toThrow('Plugin not found');
    });

    it('should throw error if context is not initialized', async () => {
      const newManager = new PluginManager();
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await newManager.register(plugin);
      await expect(newManager.init('test-plugin')).rejects.toThrow('PluginManager context is not initialized');
    });

    it('should check dependencies before init', async () => {
      const depPlugin: IPlugin = {
        id: 'dep-plugin',
        name: 'Dep Plugin',
        version: '1.0.0',
        description: 'Dep description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        dependencies: ['dep-plugin'],
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(depPlugin);
      await manager.register(plugin);

      await expect(manager.init('test-plugin')).rejects.toThrow('Missing dependency');
    });

    it('should notify observers on error', async () => {
      const observer: PluginObserver = {
        onPluginError: vi.fn(),
      };

      manager.addObserver(observer);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockRejectedValue(new Error('Init error')),
        register: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);

      await expect(manager.init('test-plugin')).rejects.toThrow('Init error');
      expect(observer.onPluginError).toHaveBeenCalled();
      expect(plugin.state).toBe(PluginState.ERROR);
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should start a plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');
      await manager.start('test-plugin');

      expect(plugin.start).toHaveBeenCalled();
      expect(plugin.state).toBe(PluginState.ACTIVE);
    });

    it('should notify observers when started', async () => {
      const observer: PluginObserver = {
        onPluginStarted: vi.fn(),
      };

      manager.addObserver(observer);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');
      await manager.start('test-plugin');

      expect(observer.onPluginStarted).toHaveBeenCalledWith(plugin);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should stop a plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');
      await manager.start('test-plugin');
      await manager.stop('test-plugin');

      expect(plugin.stop).toHaveBeenCalled();
      expect(plugin.state).toBe(PluginState.SUSPENDED);
    });

    it('should notify observers when stopped', async () => {
      const observer: PluginObserver = {
        onPluginStopped: vi.fn(),
      };

      manager.addObserver(observer);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');
      await manager.start('test-plugin');
      await manager.stop('test-plugin');

      expect(observer.onPluginStopped).toHaveBeenCalledWith(plugin);
    });
  });

  describe('unload', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should unload a plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.init('test-plugin');
      await manager.start('test-plugin');
      await manager.unload('test-plugin');

      expect(plugin.destroy).toHaveBeenCalled();
      expect(manager.get('test-plugin')).toBeUndefined();
      expect(plugin.state).toBe(PluginState.UNLOADED);
    });

    it('should notify observers when destroyed', async () => {
      const observer: PluginObserver = {
        onPluginDestroyed: vi.fn(),
      };

      manager.addObserver(observer);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin);
      await manager.unload('test-plugin');

      expect(observer.onPluginDestroyed).toHaveBeenCalledWith(plugin);
    });
  });

  describe('checkHealth', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should return healthy status for healthy plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin);

      const health = await manager.checkHealth('test-plugin');
      expect(health.healthy).toBe(true);
      expect(health.message).toBe('Plugin is healthy');
    });

    it('should use plugin healthCheck method if available', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
        healthCheck: vi.fn().mockResolvedValue({
          healthy: true,
          message: 'Custom health check',
          lastChecked: new Date(),
        }),
      };

      await manager.register(plugin);

      const health = await manager.checkHealth('test-plugin');
      expect(health.healthy).toBe(true);
      expect(health.message).toBe('Custom health check');
    });

    it('should return unhealthy for non-existent plugin', async () => {
      const health = await manager.checkHealth('non-existent');
      expect(health.healthy).toBe(false);
      expect(health.message).toContain('Plugin not found');
    });
  });

  describe('getByType', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should return plugins of specified type', async () => {
      const scenePlugin: IPlugin = {
        id: 'scene-plugin',
        name: 'Scene Plugin',
        version: '1.0.0',
        description: 'Scene',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      const commandPlugin: IPlugin = {
        id: 'command-plugin',
        name: 'Command Plugin',
        version: '1.0.0',
        description: 'Command',
        author: 'Test',
        type: PluginType.COMMAND,
        register: vi.fn(),
      };

      await manager.register(scenePlugin);
      await manager.register(commandPlugin);

      const scenes = manager.getByType(PluginType.SCENE);
      const commands = manager.getByType(PluginType.COMMAND);

      expect(scenes).toHaveLength(1);
      expect(scenes[0]).toBe(scenePlugin);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toBe(commandPlugin);
    });
  });

  describe('observers', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should add and remove observers', async () => {
      const observer: PluginObserver = {
        onPluginRegistered: vi.fn(),
      };

      manager.addObserver(observer);
      expect(manager['observers'].has(observer)).toBe(true);

      manager.removeObserver(observer);
      expect(manager['observers'].has(observer)).toBe(false);
    });
  });

  describe('startAll, stopAll, unloadAll', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should start all plugins', async () => {
      const plugin1: IPlugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        version: '1.0.0',
        description: 'Plugin 1',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
      };

      const plugin2: IPlugin = {
        id: 'plugin2',
        name: 'Plugin 2',
        version: '1.0.0',
        description: 'Plugin 2',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.init('plugin1');
      await manager.init('plugin2');

      await manager.startAll();

      expect(plugin1.start).toHaveBeenCalled();
      expect(plugin2.start).toHaveBeenCalled();
    });

    it('should stop all plugins', async () => {
      const plugin1: IPlugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        version: '1.0.0',
        description: 'Plugin 1',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin1);
      await manager.init('plugin1');
      await manager.start('plugin1');

      await manager.stopAll();

      expect(plugin1.stop).toHaveBeenCalled();
    });

    it('should unload all plugins', async () => {
      const plugin1: IPlugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        version: '1.0.0',
        description: 'Plugin 1',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
        destroy: vi.fn().mockResolvedValue(undefined),
      };

      await manager.register(plugin1);

      await manager.unloadAll();

      expect(plugin1.destroy).toHaveBeenCalled();
      expect(manager.get('plugin1')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should return correct statistics', async () => {
      const plugin1: IPlugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        version: '1.0.0',
        description: 'Plugin 1',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      const plugin2: IPlugin = {
        id: 'plugin2',
        name: 'Plugin 2',
        version: '1.0.0',
        description: 'Plugin 2',
        author: 'Test',
        type: PluginType.COMMAND,
        register: vi.fn(),
      };

      await manager.register(plugin1);
      await manager.register(plugin2);

      const stats = manager.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byType).toEqual({
        [PluginType.SCENE]: 1,
        [PluginType.COMMAND]: 1,
      });
      expect(stats.registrySize).toEqual({
        commands: 0,
        middleware: 0,
        scenes: 0,
        actions: 0,
        providers: 0,
      });
    });
  });

  describe('event listeners', () => {
    beforeEach(async () => {
      await manager.init(mockRuntime, mockBot, mockLogger, mockConfig);
    });

    it('should add and remove event listeners', async () => {
      const events: PluginManagerEvent[] = [];
      const listener: PluginManagerEventListener = (event) => {
        events.push(event);
      };

      manager.addEventListener(listener);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      await manager.register(plugin);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('plugin:registered');

      manager.removeEventListener(listener);

      await manager.register({
        id: 'plugin2',
        name: 'Plugin 2',
        version: '1.0.0',
        description: 'Plugin 2',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      });

      expect(events).toHaveLength(1);
    });

    it('should handle errors in event listeners', async () => {
      const errorListener: PluginManagerEventListener = () => {
        throw new Error('Listener error');
      };

      manager.addEventListener(errorListener);

      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      // Should not throw, just log error
      await manager.register(plugin);
      expect(manager.get('test-plugin')).toBeDefined();
    });
  });
});
