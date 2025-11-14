import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistryImpl, createRegistry } from '../../../src/plugins/core/plugin-registry.js';
import type {
  PluginCommand,
  PluginMiddleware,
  EventHandler,
  PluginScene,
  PluginAction,
  PluginProvider,
} from '../../../src/plugins/core/plugin.interface.js';

describe('PluginRegistry', () => {
  let registry: PluginRegistryImpl;

  beforeEach(() => {
    registry = new PluginRegistryImpl();
  });

  describe('PluginRegistryImpl', () => {
    it('should create registry with default namespace', () => {
      const reg = new PluginRegistryImpl();
      expect(reg).toBeInstanceOf(PluginRegistryImpl);
    });

    it('should create registry with custom namespace', () => {
      const reg = new PluginRegistryImpl('test');
      expect(reg).toBeInstanceOf(PluginRegistryImpl);
    });

    it('should create registry with parent', () => {
      const parent = new PluginRegistryImpl('parent');
      const child = new PluginRegistryImpl('child', parent);
      expect(child).toBeInstanceOf(PluginRegistryImpl);
    });
  });

  describe('registerCommand', () => {
    it('should register a command', () => {
      const command: PluginCommand = {
        name: 'test',
        description: 'Test command',
        handler: vi.fn(),
      };

      registry.registerCommand(command);
      const commands = registry.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]).toBe(command);
    });

    it('should throw error for invalid command name', () => {
      const command: PluginCommand = {
        name: '',
        description: 'Test command',
        handler: vi.fn(),
      };

      expect(() => registry.registerCommand(command)).toThrow('Invalid command name');
    });

    it('should allow overwriting command', () => {
      const command1: PluginCommand = {
        name: 'test',
        description: 'Command 1',
        handler: vi.fn(),
      };

      const command2: PluginCommand = {
        name: 'test',
        description: 'Command 2',
        handler: vi.fn(),
      };

      registry.registerCommand(command1);
      registry.registerCommand(command2);

      const commands = registry.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].description).toBe('Command 2');
    });
  });

  describe('registerMiddleware', () => {
    it('should register middleware', () => {
      const middleware: PluginMiddleware = {
        name: 'auth',
        handler: vi.fn(),
      };

      registry.registerMiddleware(middleware);
      const middlewareList = registry.getAllMiddleware();
      expect(middlewareList).toHaveLength(1);
      expect(middlewareList[0]).toBe(middleware);
    });

    it('should auto-generate name for unnamed middleware', () => {
      const middleware: PluginMiddleware = {
        handler: vi.fn(),
      };

      registry.registerMiddleware(middleware);
      const middlewareList = registry.getAllMiddleware();
      expect(middlewareList).toHaveLength(1);
      expect(middlewareList[0].name).toBeTruthy();
      expect(middlewareList[0].name).toMatch(/^middleware_\d+_[a-z0-9]+$/);
    });
  });

  describe('registerEventHandler', () => {
    it('should register event handler', () => {
      const handler: EventHandler = {
        event: 'message',
        handler: vi.fn(),
      };

      registry.registerEventHandler(handler);
      const handlers = registry.getAllEventHandlers('message');
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(handler);
    });

    it('should sort handlers by priority', () => {
      const handler1: EventHandler = {
        event: 'message',
        handler: vi.fn(),
        priority: 1,
      };

      const handler2: EventHandler = {
        event: 'message',
        handler: vi.fn(),
        priority: 10,
      };

      registry.registerEventHandler(handler1);
      registry.registerEventHandler(handler2);

      const handlers = registry.getAllEventHandlers('message');
      expect(handlers).toHaveLength(2);
      expect(handlers[0].priority).toBe(10);
      expect(handlers[1].priority).toBe(1);
    });

    it('should throw error for invalid event name', () => {
      const handler: EventHandler = {
        event: '',
        handler: vi.fn(),
      };

      expect(() => registry.registerEventHandler(handler)).toThrow('Invalid event name');
    });
  });

  describe('registerScene', () => {
    it('should register scene', () => {
      const scene: PluginScene = {
        id: 'test-scene',
        enterHandler: vi.fn(),
      };

      registry.registerScene(scene);
      const scenes = registry.getAllScenes();
      expect(scenes).toHaveLength(1);
      expect(scenes[0]).toBe(scene);
    });

    it('should throw error for invalid scene id', () => {
      const scene: PluginScene = {
        id: '',
        enterHandler: vi.fn(),
      };

      expect(() => registry.registerScene(scene)).toThrow('Invalid scene id');
    });
  });

  describe('registerAction', () => {
    it('should register action', () => {
      const action: PluginAction = {
        name: 'test-action',
        validate: vi.fn().mockResolvedValue(true),
        handler: vi.fn().mockResolvedValue('result'),
      };

      registry.registerAction(action);
      const actions = registry.getAllActions();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toBe(action);
    });

    it('should throw error for invalid action name', () => {
      const action: PluginAction = {
        name: '',
        validate: vi.fn().mockResolvedValue(true),
        handler: vi.fn().mockResolvedValue('result'),
      };

      expect(() => registry.registerAction(action)).toThrow('Invalid action name');
    });
  });

  describe('registerProvider', () => {
    it('should register provider', () => {
      const provider: PluginProvider = {
        name: 'test-provider',
        type: 'test',
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      };

      registry.registerProvider(provider);
      const providers = registry.getAllProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0]).toBe(provider);
    });

    it('should throw error for invalid provider name', () => {
      const provider: PluginProvider = {
        name: '',
        type: 'test',
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      };

      expect(() => registry.registerProvider(provider)).toThrow('Invalid provider name');
    });
  });

  describe('dependencies', () => {
    it('should set and get dependency', () => {
      const value = { test: 'value' };
      registry.setDependency('test-dep', value);
      const result = registry.getDependency('test-dep');
      expect(result).toBe(value);
    });

    it('should check if dependency exists', () => {
      registry.setDependency('test-dep', 'value');
      expect(registry.hasDependency('test-dep')).toBe(true);
      expect(registry.hasDependency('non-existent')).toBe(false);
    });

    it('should return undefined for non-existent dependency', () => {
      const result = registry.getDependency('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('configs', () => {
    it('should set and get config', () => {
      registry.setConfig('key1', 'value1');
      const result = registry.getConfig('key1');
      expect(result).toBe('value1');
    });

    it('should get all configs', () => {
      registry.setConfig('key1', 'value1');
      registry.setConfig('key2', 'value2');
      const configs = registry.getConfig();
      expect(configs).toEqual({
        'root:config:key1': 'value1',
        'root:config:key2': 'value2',
      });
    });
  });

  describe('createChild', () => {
    it('should create child registry', () => {
      const child = registry.createChild('child-namespace');
      expect(child).toBeInstanceOf(PluginRegistryImpl);
    });

    it('should create child with parent reference', () => {
      const child = registry.createChild('child');
      const dependency = 'test-value';
      registry.setDependency('parent-dep', dependency);

      // Child should be able to access parent dependencies
      expect(child.hasDependency('parent-dep')).toBe(false); // Initially not shared
    });
  });

  describe('getAll methods', () => {
    beforeEach(() => {
      registry.registerCommand({
        name: 'test-cmd',
        description: 'Test',
        handler: vi.fn(),
      });

      registry.registerMiddleware({
        name: 'test-mw',
        handler: vi.fn(),
      });

      registry.registerScene({
        id: 'test-scene',
        enterHandler: vi.fn(),
      });

      registry.registerAction({
        name: 'test-action',
        validate: vi.fn(),
        handler: vi.fn(),
      });

      registry.registerProvider({
        name: 'test-provider',
        type: 'test',
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      });
    });

    it('should return all commands', () => {
      expect(registry.getAllCommands()).toHaveLength(1);
    });

    it('should return all middleware', () => {
      expect(registry.getAllMiddleware()).toHaveLength(1);
    });

    it('should return all scenes', () => {
      expect(registry.getAllScenes()).toHaveLength(1);
    });

    it('should return all actions', () => {
      expect(registry.getAllActions()).toHaveLength(1);
    });

    it('should return all providers', () => {
      expect(registry.getAllProviders()).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all collections', () => {
      registry.registerCommand({
        name: 'test',
        description: 'Test',
        handler: vi.fn(),
      });

      registry.registerScene({
        id: 'test',
        enterHandler: vi.fn(),
      });

      registry.clear();

      expect(registry.size()).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove registered item', () => {
      registry.registerCommand({
        name: 'test',
        description: 'Test',
        handler: vi.fn(),
      });

      const removed = registry.remove('commands', 'test');
      expect(removed).toBe(true);
      expect(registry.size()).toBe(0);
    });

    it('should return false for non-existent item', () => {
      const removed = registry.remove('commands', 'non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing item', () => {
      registry.registerCommand({
        name: 'test',
        description: 'Test',
        handler: vi.fn(),
      });

      expect(registry.has('commands', 'test')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      expect(registry.has('commands', 'non-existent')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return total size when no type specified', () => {
      registry.registerCommand({
        name: 'cmd1',
        description: 'Test',
        handler: vi.fn(),
      });

      registry.registerCommand({
        name: 'cmd2',
        description: 'Test',
        handler: vi.fn(),
      });

      expect(registry.size()).toBe(2);
    });

    it('should return size of specific collection', () => {
      registry.registerCommand({
        name: 'cmd1',
        description: 'Test',
        handler: vi.fn(),
      });

      expect(registry.size('commands')).toBe(1);
      expect(registry.size('scenes')).toBe(0);
    });
  });

  describe('getKey', () => {
    it('should generate keys with namespace', () => {
      const reg = new PluginRegistryImpl('test-ns');
      // @ts-ignore - accessing private method for testing
      const key = reg.getKey('type', 'key');
      expect(key).toBe('test-ns:type:key');
    });
  });

  describe('exportConfig and importConfig', () => {
    it('should export and import config', () => {
      const command: PluginCommand = {
        name: 'test-cmd',
        description: 'Test',
        handler: vi.fn(),
      };

      const middleware: PluginMiddleware = {
        name: 'test-mw',
        handler: vi.fn(),
      };

      registry.registerCommand(command);
      registry.registerMiddleware(middleware);

      const exported = registry.exportConfig();

      const newRegistry = new PluginRegistryImpl();
      newRegistry.importConfig(exported);

      expect(newRegistry.getAllCommands()).toHaveLength(1);
      expect(newRegistry.getAllMiddleware()).toHaveLength(1);
    });
  });

  describe('createRegistry', () => {
    it('should create registry with default namespace', () => {
      const reg = createRegistry();
      expect(reg).toBeInstanceOf(PluginRegistryImpl);
    });

    it('should create registry with custom namespace', () => {
      const reg = createRegistry('custom');
      expect(reg).toBeInstanceOf(PluginRegistryImpl);
    });
  });
});
