import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginManager } from '../../src/plugins/core/plugin-manager.js';
import { PluginRegistryImpl } from '../../src/plugins/core/plugin-registry.js';
import { PluginType, PluginState } from '../../src/plugins/core/types.js';
import type { IPlugin } from '../../src/plugins/core/plugin.interface.js';

describe('Plugin Integration Tests', () => {
  let manager: PluginManager;
  let registry: PluginRegistryImpl;
  let mockRuntime: any;
  let mockBot: any;
  let mockLogger: any;

  beforeEach(() => {
    manager = new PluginManager();
    registry = new PluginRegistryImpl();
    mockRuntime = {};
    mockBot = {};
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  describe('Plugin Manager + Registry Integration', () => {
    it('should register and initialize plugin', async () => {
      const plugin: IPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn().mockImplementation(async (reg: any) => {
          reg.registerCommand({
            name: 'test-cmd',
            description: 'Test command',
            handler: vi.fn(),
          });
        }),
      };

      await manager.init(mockRuntime, mockBot, mockLogger, {});
      await manager.register(plugin);

      const registered = manager.get('test-plugin');
      expect(registered).toBe(plugin);

      await manager.init('test-plugin');
      expect(plugin.state).toBe(PluginState.LOADED);

      const commands = registry.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('test-cmd');
    });

    it('should handle plugin dependencies', async () => {
      const depPlugin: IPlugin = {
        id: 'dep-plugin',
        name: 'Dependency Plugin',
        version: '1.0.0',
        description: 'Dep',
        author: 'Test',
        type: PluginType.COMMAND,
        register: vi.fn(),
      };

      const plugin: IPlugin = {
        id: 'main-plugin',
        name: 'Main Plugin',
        version: '1.0.0',
        description: 'Main',
        author: 'Test',
        type: PluginType.SCENE,
        dependencies: ['dep-plugin'],
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
      };

      await manager.init(mockRuntime, mockBot, mockLogger, {});
      await manager.register(depPlugin);
      await manager.register(plugin);

      await manager.init('main-plugin');

      expect(depPlugin.state).toBe(PluginState.LOADED);
      expect(plugin.state).toBe(PluginState.LOADED);
    });

    it('should propagate errors correctly', async () => {
      const plugin: IPlugin = {
        id: 'error-plugin',
        name: 'Error Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        init: vi.fn().mockRejectedValue(new Error('Init failed')),
        register: vi.fn(),
      };

      await manager.init(mockRuntime, mockBot, mockLogger, {});
      await manager.register(plugin);

      await expect(manager.init('error-plugin')).rejects.toThrow('Init failed');
      expect(plugin.state).toBe(PluginState.ERROR);
    });
  });

  describe('Plugin Lifecycle Integration', () => {
    it('should transition through all states', async () => {
      const plugin: IPlugin = {
        id: 'lifecycle-plugin',
        name: 'Lifecycle Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
      };

      await manager.init(mockRuntime, mockBot, mockLogger, {});
      await manager.register(plugin);

      expect(plugin.state).toBe(PluginState.UNLOADED);

      await manager.init('lifecycle-plugin');
      expect(plugin.state).toBe(PluginState.LOADED);

      await manager.start('lifecycle-plugin');
      expect(plugin.state).toBe(PluginState.ACTIVE);

      await manager.stop('lifecycle-plugin');
      expect(plugin.state).toBe(PluginState.SUSPENDED);

      await manager.unload('lifecycle-plugin');
      expect(plugin.state).toBe(PluginState.UNLOADED);
    });
  });

  describe('Multiple Plugins Integration', () => {
    it('should manage multiple plugins simultaneously', async () => {
      const plugins: IPlugin[] = Array.from({ length: 5 }, (_, i) => ({
        id: `plugin-${i}`,
        name: `Plugin ${i}`,
        version: '1.0.0',
        description: `Test ${i}`,
        author: 'Test',
        type: PluginType.SCENE,
        init: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
      }));

      await manager.init(mockRuntime, mockBot, mockLogger, {});

      for (const plugin of plugins) {
        await manager.register(plugin);
      }

      expect(manager.getAllPlugins()).toHaveLength(5);

      for (const plugin of plugins) {
        await manager.init(plugin.id);
        expect(plugin.state).toBe(PluginState.LOADED);
      }

      await manager.startAll();
      for (const plugin of plugins) {
        expect(plugin.state).toBe(PluginState.ACTIVE);
      }

      await manager.stopAll();
      for (const plugin of plugins) {
        expect(plugin.state).toBe(PluginState.SUSPENDED);
      }

      await manager.unloadAll();
      for (const plugin of plugins) {
        expect(plugin.state).toBe(PluginState.UNLOADED);
      }
    });
  });

  describe('Plugin Manager Statistics', () => {
    it('should track statistics correctly', async () => {
      const scenePlugin: IPlugin = {
        id: 'scene-plugin',
        name: 'Scene Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      const commandPlugin: IPlugin = {
        id: 'command-plugin',
        name: 'Command Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.COMMAND,
        register: vi.fn(),
      };

      await manager.init(mockRuntime, mockBot, mockLogger, {});
      await manager.register(scenePlugin);
      await manager.register(commandPlugin);

      const stats = manager.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byType).toEqual({
        [PluginType.SCENE]: 1,
        [PluginType.COMMAND]: 1,
      });
    });
  });
});
