import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  IPlugin,
  PluginContext,
  PluginRegistry,
  PluginCommand,
  PluginMiddleware,
  EventHandler,
  PluginScene,
  PluginAction,
  PluginProvider,
  PluginObserver,
  PluginFactory,
  PluginLoader,
  IPluginManager,
  PluginLoadingStrategy,
  DependencyResolutionStrategy,
} from '../../../src/plugins/core/plugin.interface.js';
import { PluginType, PluginState, PluginHealthStatus } from '../../../src/plugins/core/types.js';

describe('Plugin Interface', () => {
  describe('IPlugin', () => {
    let mockPlugin: IPlugin;

    beforeEach(() => {
      mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        type: PluginType.SCENE,
        register: vi.fn(),
      };
    });

    it('should have required properties', () => {
      expect(mockPlugin.id).toBe('test-plugin');
      expect(mockPlugin.name).toBe('Test Plugin');
      expect(mockPlugin.version).toBe('1.0.0');
      expect(mockPlugin.description).toBe('A test plugin');
      expect(mockPlugin.author).toBe('Test Author');
      expect(mockPlugin.type).toBe(PluginType.SCENE);
      expect(typeof mockPlugin.register).toBe('function');
    });

    it('should support optional properties', () => {
      const pluginWithOptional: IPlugin = {
        ...mockPlugin,
        dependencies: ['dep1', 'dep2'],
        configSchema: { type: 'object' },
        state: PluginState.ACTIVE,
        init: vi.fn(),
        healthCheck: vi.fn().mockResolvedValue({ healthy: true, message: 'OK', lastChecked: new Date() }),
        start: vi.fn(),
        stop: vi.fn(),
        destroy: vi.fn(),
      };

      expect(pluginWithOptional.dependencies).toEqual(['dep1', 'dep2']);
      expect(pluginWithOptional.configSchema).toEqual({ type: 'object' });
      expect(pluginWithOptional.state).toBe(PluginState.ACTIVE);
      expect(typeof pluginWithOptional.init).toBe('function');
      expect(typeof pluginWithOptional.healthCheck).toBe('function');
      expect(typeof pluginWithOptional.start).toBe('function');
      expect(typeof pluginWithOptional.stop).toBe('function');
      expect(typeof pluginWithOptional.destroy).toBe('function');
    });

    it('should call register method', () => {
      const mockRegistry = {} as PluginRegistry;
      mockPlugin.register(mockRegistry);
      expect(mockPlugin.register).toHaveBeenCalledWith(mockRegistry);
    });
  });

  describe('PluginContext', () => {
    it('should have all required properties', () => {
      const runtime = {} as any;
      const bot = {} as any;
      const registry = {} as PluginRegistry;
      const logger = {} as any;

      const context: PluginContext = {
        runtime,
        bot,
        registry,
        logger,
        config: { key: 'value' },
        services: { service1: {} },
      };

      expect(context.runtime).toBe(runtime);
      expect(context.bot).toBe(bot);
      expect(context.registry).toBe(registry);
      expect(context.logger).toBe(logger);
      expect(context.config).toEqual({ key: 'value' });
      expect(context.services).toEqual({ service1: {} });
    });

    it('should have optional services property', () => {
      const context: PluginContext = {
        runtime: {} as any,
        bot: {} as any,
        registry: {} as PluginRegistry,
        logger: {} as any,
        config: {},
      };

      expect(context.services).toBeUndefined();
    });
  });

  describe('PluginRegistry', () => {
    let registry: PluginRegistry;

    beforeEach(() => {
      registry = {
        registerCommand: vi.fn(),
        registerMiddleware: vi.fn(),
        registerEventHandler: vi.fn(),
        registerScene: vi.fn(),
        registerAction: vi.fn(),
        registerProvider: vi.fn(),
        getDependency: vi.fn(),
        hasDependency: vi.fn(),
        getConfig: vi.fn(),
        createChild: vi.fn(),
      };
    });

    it('should have all registration methods', () => {
      expect(typeof registry.registerCommand).toBe('function');
      expect(typeof registry.registerMiddleware).toBe('function');
      expect(typeof registry.registerEventHandler).toBe('function');
      expect(typeof registry.registerScene).toBe('function');
      expect(typeof registry.registerAction).toBe('function');
      expect(typeof registry.registerProvider).toBe('function');
    });

    it('should have dependency methods', () => {
      expect(typeof registry.getDependency).toBe('function');
      expect(typeof registry.hasDependency).toBe('function');
    });

    it('should have config methods', () => {
      expect(typeof registry.getConfig).toBe('function');
    });

    it('should have child registry method', () => {
      expect(typeof registry.createChild).toBe('function');
    });
  });

  describe('PluginCommand', () => {
    it('should have required properties', () => {
      const command: PluginCommand = {
        name: 'test',
        description: 'Test command',
        handler: vi.fn(),
      };

      expect(command.name).toBe('test');
      expect(command.description).toBe('Test command');
      expect(typeof command.handler).toBe('function');
    });

    it('should support optional properties', () => {
      const command: PluginCommand = {
        name: 'test',
        description: 'Test command',
        usage: '/test [arg]',
        handler: vi.fn(),
        aliases: ['t', 'cmd'],
        adminOnly: true,
        hidden: false,
      };

      expect(command.usage).toBe('/test [arg]');
      expect(command.aliases).toEqual(['t', 'cmd']);
      expect(command.adminOnly).toBe(true);
      expect(command.hidden).toBe(false);
    });
  });

  describe('PluginMiddleware', () => {
    it('should have required handler', () => {
      const middleware: PluginMiddleware = {
        handler: vi.fn(),
      };

      expect(typeof middleware.handler).toBe('function');
    });

    it('should support optional properties', () => {
      const middleware: PluginMiddleware = {
        name: 'auth-middleware',
        handler: vi.fn(),
        priority: 10,
      };

      expect(middleware.name).toBe('auth-middleware');
      expect(middleware.priority).toBe(10);
    });
  });

  describe('EventHandler', () => {
    it('should have required properties', () => {
      const handler: EventHandler = {
        event: 'message',
        handler: vi.fn(),
      };

      expect(handler.event).toBe('message');
      expect(typeof handler.handler).toBe('function');
    });

    it('should support optional priority', () => {
      const handler: EventHandler = {
        event: 'message',
        handler: vi.fn(),
        priority: 5,
      };

      expect(handler.priority).toBe(5);
    });
  });

  describe('PluginScene', () => {
    it('should have required properties', () => {
      const scene: PluginScene = {
        id: 'test-scene',
        enterHandler: vi.fn(),
      };

      expect(scene.id).toBe('test-scene');
      expect(typeof scene.enterHandler).toBe('function');
    });

    it('should support optional handlers', () => {
      const scene: PluginScene = {
        id: 'test-scene',
        enterHandler: vi.fn(),
        leaveHandler: vi.fn(),
        commandHandlers: { start: vi.fn() },
        actionHandlers: { click_button: vi.fn() },
      };

      expect(typeof scene.leaveHandler).toBe('function');
      expect(scene.commandHandlers).toEqual({ start: expect.any(Function) });
      expect(scene.actionHandlers).toEqual({ click_button: expect.any(Function) });
    });
  });

  describe('PluginAction', () => {
    it('should have required properties', () => {
      const action: PluginAction = {
        name: 'test-action',
        validate: vi.fn().mockResolvedValue(true),
        handler: vi.fn().mockResolvedValue('result'),
      };

      expect(action.name).toBe('test-action');
      expect(typeof action.validate).toBe('function');
      expect(typeof action.handler).toBe('function');
    });
  });

  describe('PluginProvider', () => {
    it('should have required properties', () => {
      const provider: PluginProvider = {
        name: 'test-provider',
        type: 'test',
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
      };

      expect(provider.name).toBe('test-provider');
      expect(provider.type).toBe('test');
      expect(typeof provider.init).toBe('function');
      expect(typeof provider.get).toBe('function');
      expect(typeof provider.set).toBe('function');
    });

    it('should support optional destroy', () => {
      const provider: PluginProvider = {
        name: 'test-provider',
        type: 'test',
        init: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        destroy: vi.fn(),
      };

      expect(typeof provider.destroy).toBe('function');
    });
  });

  describe('PluginObserver', () => {
    it('should support all observer methods', () => {
      const observer: PluginObserver = {
        onPluginRegistered: vi.fn(),
        onPluginLoaded: vi.fn(),
        onPluginInitialized: vi.fn(),
        onPluginStarted: vi.fn(),
        onPluginStopped: vi.fn(),
        onPluginError: vi.fn(),
        onPluginDestroyed: vi.fn(),
      };

      expect(typeof observer.onPluginRegistered).toBe('function');
      expect(typeof observer.onPluginLoaded).toBe('function');
      expect(typeof observer.onPluginInitialized).toBe('function');
      expect(typeof observer.onPluginStarted).toBe('function');
      expect(typeof observer.onPluginStopped).toBe('function');
      expect(typeof observer.onPluginError).toBe('function');
      expect(typeof observer.onPluginDestroyed).toBe('function');
    });
  });

  describe('PluginFactory', () => {
    it('should have required properties', () => {
      const factory: PluginFactory = {
        name: 'test-factory',
        version: '1.0.0',
        create: vi.fn(),
      };

      expect(factory.name).toBe('test-factory');
      expect(factory.version).toBe('1.0.0');
      expect(typeof factory.create).toBe('function');
    });

    it('should support optional validate', () => {
      const factory: PluginFactory = {
        name: 'test-factory',
        version: '1.0.0',
        create: vi.fn(),
        validate: vi.fn().mockReturnValue(true),
      };

      expect(typeof factory.validate).toBe('function');
    });
  });

  describe('PluginLoader', () => {
    it('should have required methods', () => {
      const loader: PluginLoader = {
        load: vi.fn(),
        validate: vi.fn(),
        getInfo: vi.fn(),
      };

      expect(typeof loader.load).toBe('function');
      expect(typeof loader.validate).toBe('function');
      expect(typeof loader.getInfo).toBe('function');
    });
  });

  describe('IPluginManager', () => {
    let manager: IPluginManager;

    beforeEach(() => {
      manager = {
        state: PluginState.UNLOADED,
        plugins: new Map(),
        register: vi.fn(),
        load: vi.fn(),
        init: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        unload: vi.fn(),
        get: vi.fn(),
        checkHealth: vi.fn(),
        getByType: vi.fn(),
        addObserver: vi.fn(),
        removeObserver: vi.fn(),
        getRegistry: vi.fn(),
      };
    });

    it('should have state and plugins properties', () => {
      expect(manager.state).toBe(PluginState.UNLOADED);
      expect(manager.plugins).toBeInstanceOf(Map);
    });

    it('should have lifecycle methods', () => {
      expect(typeof manager.register).toBe('function');
      expect(typeof manager.load).toBe('function');
      expect(typeof manager.init).toBe('function');
      expect(typeof manager.start).toBe('function');
      expect(typeof manager.stop).toBe('function');
      expect(typeof manager.unload).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof manager.get).toBe('function');
      expect(typeof manager.checkHealth).toBe('function');
      expect(typeof manager.getByType).toBe('function');
    });

    it('should have observer methods', () => {
      expect(typeof manager.addObserver).toBe('function');
      expect(typeof manager.removeObserver).toBe('function');
    });

    it('should have registry method', () => {
      expect(typeof manager.getRegistry).toBe('function');
    });
  });

  describe('PluginLoadingStrategy', () => {
    it('should support all optional properties', () => {
      const strategy: PluginLoadingStrategy = {
        sequential: true,
        maxConcurrent: 5,
        timeout: 30000,
        retries: 3,
      };

      expect(strategy.sequential).toBe(true);
      expect(strategy.maxConcurrent).toBe(5);
      expect(strategy.timeout).toBe(30000);
      expect(strategy.retries).toBe(3);
    });

    it('should have optional properties', () => {
      const strategy: PluginLoadingStrategy = {};

      expect(strategy.sequential).toBeUndefined();
      expect(strategy.maxConcurrent).toBeUndefined();
      expect(strategy.timeout).toBeUndefined();
      expect(strategy.retries).toBeUndefined();
    });
  });

  describe('DependencyResolutionStrategy', () => {
    it('should have required algorithm property', () => {
      const strategy: DependencyResolutionStrategy = {
        algorithm: 'depth-first',
      };

      expect(strategy.algorithm).toBe('depth-first');
    });

    it('should support breadth-first algorithm', () => {
      const strategy: DependencyResolutionStrategy = {
        algorithm: 'breadth-first',
        ignoreMissing: true,
        maxDepth: 10,
      };

      expect(strategy.algorithm).toBe('breadth-first');
      expect(strategy.ignoreMissing).toBe(true);
      expect(strategy.maxDepth).toBe(10);
    });
  });
});
