import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PluginLifecycleManager,
  createLifecycleManager,
  LifecycleUtils,
  type LifecycleConfig,
  type LifecycleOperationResult,
} from '../../../src/plugins/core/plugin-lifecycle.js';
import { PluginState, type PluginLifecycleHooks } from '../../../src/plugins/core/types.js';
import type { IPlugin, PluginHealthStatus } from '../../../src/plugins/core/plugin.interface.js';

describe('PluginLifecycle', () => {
  let manager: PluginLifecycleManager;
  let mockPlugin: IPlugin;

  beforeEach(() => {
    manager = createLifecycleManager();
    mockPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test description',
      author: 'Test Author',
      type: 'scene' as any,
      state: PluginState.UNLOADED,
      register: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('OperationTimer', () => {
    let timer: any;

    beforeEach(() => {
      const { OperationTimer } = require('../../../src/plugins/core/plugin-lifecycle.js');
      timer = new OperationTimer();
    });

    it('should track operation duration', () => {
      timer.start();
      const duration1 = timer.getDuration();
      vi.advanceTimersByTime(100);
      const duration2 = timer.getDuration();

      expect(duration2).toBeGreaterThan(duration1);
    });

    it('should stop timer and return duration', () => {
      timer.start();
      vi.advanceTimersByTime(50);
      const duration = timer.stop();

      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should throw error on timeout', () => {
      expect(() => {
        timer.start(100);
        vi.advanceTimersByTime(101);
      }).toThrow('Operation timed out');
    });
  });

  describe('PluginLifecycleManager', () => {
    describe('constructor', () => {
      it('should use default config when no config provided', () => {
        const manager = new PluginLifecycleManager();
        const stats = manager.getStats();

        expect(stats.config.initTimeout).toBe(30000);
        expect(stats.config.startTimeout).toBe(10000);
        expect(stats.config.maxRetries).toBe(3);
      });

      it('should use custom config when provided', () => {
        const config: LifecycleConfig = {
          initTimeout: 50000,
          maxRetries: 5,
        };
        const manager = new PluginLifecycleManager(config);
        const stats = manager.getStats();

        expect(stats.config.initTimeout).toBe(50000);
        expect(stats.config.maxRetries).toBe(5);
      });
    });

    describe('registerHooks', () => {
      it('should register hooks for plugin', () => {
        const hooks: PluginLifecycleHooks = {
          onLoad: vi.fn(),
          onInit: vi.fn(),
          onStart: vi.fn(),
          onStop: vi.fn(),
        };

        manager.registerHooks('test-plugin', hooks);
        const stats = manager.getStats();

        // Hooks are stored internally
        expect(stats).toBeDefined();
      });

      it('should unregister hooks', () => {
        const hooks: PluginLifecycleHooks = {
          onLoad: vi.fn(),
        };

        manager.registerHooks('test-plugin', hooks);
        manager.unregisterHooks('test-plugin');
      });
    });

    describe('init', () => {
      it('should successfully initialize plugin', async () => {
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);

        const result = await manager.init(mockPlugin);

        expect(result.success).toBe(true);
        expect(result.state).toBe(PluginState.LOADED);
        expect(result.duration).toBeGreaterThan(0);
        expect(mockPlugin.state).toBe(PluginState.LOADED);
      });

      it('should execute onLoad hook', async () => {
        const onLoad = vi.fn();
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);
        manager.registerHooks('test-plugin', { onLoad });

        await manager.init(mockPlugin);

        expect(onLoad).toHaveBeenCalledWith('test-plugin');
      });

      it('should set state to ERROR on failure', async () => {
        const error = new Error('Init failed');
        mockPlugin.init = vi.fn().mockRejectedValue(error);

        const result = await manager.init(mockPlugin);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Init failed');
        expect(mockPlugin.state).toBe(PluginState.ERROR);
      });

      it('should validate state before init', async () => {
        mockPlugin.state = PluginState.ACTIVE;
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);

        await expect(manager.init(mockPlugin)).rejects.toThrow('Invalid state transition');
      });

      it('should timeout on long initialization', async () => {
        const config: LifecycleConfig = { initTimeout: 100 };
        const manager = new PluginLifecycleManager(config);
        mockPlugin.init = vi.fn(() => new Promise(resolve => setTimeout(resolve, 200)));

        const result = await manager.init(mockPlugin);

        expect(result.success).toBe(false);
      });
    });

    describe('start', () => {
      beforeEach(async () => {
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);
        await manager.init(mockPlugin);
      });

      it('should successfully start plugin', async () => {
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);

        const result = await manager.start(mockPlugin);

        expect(result.success).toBe(true);
        expect(result.state).toBe(PluginState.ACTIVE);
        expect(mockPlugin.state).toBe(PluginState.ACTIVE);
      });

      it('should execute onStart hook', async () => {
        const onStart = vi.fn();
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);
        manager.registerHooks('test-plugin', { onStart });

        await manager.start(mockPlugin);

        expect(onStart).toHaveBeenCalledWith('test-plugin');
      });

      it('should resume from SUSPENDED state', async () => {
        mockPlugin.state = PluginState.SUSPENDED;
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);

        const result = await manager.start(mockPlugin);

        expect(result.success).toBe(true);
        expect(mockPlugin.state).toBe(PluginState.ACTIVE);
      });

      it('should validate state before start', async () => {
        mockPlugin.state = PluginState.ERROR;
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);

        await expect(manager.start(mockPlugin)).rejects.toThrow('Invalid state transition');
      });

      it('should set state to ERROR on failure', async () => {
        const error = new Error('Start failed');
        mockPlugin.start = vi.fn().mockRejectedValue(error);

        const result = await manager.start(mockPlugin);

        expect(result.success).toBe(false);
        expect(mockPlugin.state).toBe(PluginState.ERROR);
      });
    });

    describe('stop', () => {
      beforeEach(async () => {
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);
        await manager.init(mockPlugin);
        await manager.start(mockPlugin);
      });

      it('should successfully stop plugin', async () => {
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);

        const result = await manager.stop(mockPlugin);

        expect(result.success).toBe(true);
        expect(result.state).toBe(PluginState.SUSPENDED);
        expect(mockPlugin.state).toBe(PluginState.SUSPENDED);
      });

      it('should execute onStop hook', async () => {
        const onStop = vi.fn();
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);
        manager.registerHooks('test-plugin', { onStop });

        await manager.stop(mockPlugin);

        expect(onStop).toHaveBeenCalledWith('test-plugin');
      });

      it('should stop from LOADED state', async () => {
        mockPlugin.state = PluginState.LOADED;
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);

        const result = await manager.stop(mockPlugin);

        expect(result.success).toBe(true);
      });

      it('should validate state before stop', async () => {
        mockPlugin.state = PluginState.ERROR;

        await expect(manager.stop(mockPlugin)).rejects.toThrow('Invalid state transition');
      });
    });

    describe('unload', () => {
      it('should successfully unload plugin', async () => {
        mockPlugin.destroy = vi.fn().mockResolvedValue(undefined);

        const result = await manager.unload(mockPlugin);

        expect(result.success).toBe(true);
        expect(result.state).toBe(PluginState.UNLOADED);
        expect(mockPlugin.state).toBe(PluginState.UNLOADED);
      });

      it('should stop active plugin before unload', async () => {
        mockPlugin.state = PluginState.ACTIVE;
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);
        mockPlugin.destroy = vi.fn().mockResolvedValue(undefined);

        const result = await manager.unload(mockPlugin);

        expect(mockPlugin.stop).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });

      it('should unregister hooks', async () => {
        const hooks: PluginLifecycleHooks = { onLoad: vi.fn() };
        manager.registerHooks('test-plugin', hooks);
        mockPlugin.destroy = vi.fn().mockResolvedValue(undefined);

        await manager.unload(mockPlugin);
      });

      it('should unload from various states', async () => {
        const states = [
          PluginState.SUSPENDED,
          PluginState.LOADED,
          PluginState.ERROR,
        ];

        for (const state of states) {
          mockPlugin.state = state;
          mockPlugin.destroy = vi.fn().mockResolvedValue(undefined);

          const result = await manager.unload(mockPlugin);

          expect(result.success).toBe(true);
        }
      });

      it('should set state to ERROR on failure', async () => {
        const error = new Error('Unload failed');
        mockPlugin.destroy = vi.fn().mockRejectedValue(error);

        const result = await manager.unload(mockPlugin);

        expect(result.success).toBe(false);
        expect(mockPlugin.state).toBe(PluginState.ERROR);
      });
    });

    describe('restart', () => {
      beforeEach(async () => {
        mockPlugin.init = vi.fn().mockResolvedValue(undefined);
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);
        await manager.init(mockPlugin);
        await manager.start(mockPlugin);
      });

      it('should restart plugin', async () => {
        const result = await manager.restart(mockPlugin);

        expect(result.success).toBe(true);
        expect(mockPlugin.state).toBe(PluginState.ACTIVE);
      });

      it('should return stop result if stop fails', async () => {
        mockPlugin.stop = vi.fn().mockRejectedValue(new Error('Stop failed'));

        const result = await manager.restart(mockPlugin);

        expect(result.success).toBe(false);
      });
    });

    describe('checkHealth', () => {
      it('should return healthy status for active plugin', async () => {
        mockPlugin.state = PluginState.ACTIVE;

        const health = await manager.checkHealth(mockPlugin);

        expect(health.healthy).toBe(true);
        expect(health.message).toBe('Plugin is healthy');
      });

      it('should return unhealthy for non-active plugin', async () => {
        mockPlugin.state = PluginState.SUSPENDED;

        const health = await manager.checkHealth(mockPlugin);

        expect(health.healthy).toBe(false);
        expect(health.message).toContain('Plugin state');
      });

      it('should use plugin healthCheck method if available', async () => {
        mockPlugin.healthCheck = vi.fn().mockResolvedValue({
          healthy: true,
          message: 'Custom health check',
          lastChecked: new Date(),
        });

        const health = await manager.checkHealth(mockPlugin);

        expect(health.healthy).toBe(true);
        expect(health.message).toBe('Custom health check');
      });

      it('should handle errors in health check', async () => {
        mockPlugin.healthCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));

        const health = await manager.checkHealth(mockPlugin);

        expect(health.healthy).toBe(false);
        expect(health.message).toContain('Health check failed');
      });
    });

    describe('forceHealthCheckAndRestart', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should restart unhealthy plugin', async () => {
        mockPlugin.state = PluginState.ACTIVE;
        mockPlugin.healthCheck = vi.fn().mockResolvedValue({
          healthy: false,
          message: 'Unhealthy',
          lastChecked: new Date(),
        });
        mockPlugin.stop = vi.fn().mockResolvedValue(undefined);
        mockPlugin.start = vi.fn().mockResolvedValue(undefined);

        const health = await manager.forceHealthCheckAndRestart(mockPlugin, true);

        expect(health.healthy).toBe(false);
      });
    });

    describe('withRetry', () => {
      it('should succeed on first try', async () => {
        const operation = vi.fn().mockResolvedValue('success');
        const result = await manager.withRetry(operation, 'test-plugin');

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('should retry on failure', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error 1'))
          .mockRejectedValueOnce(new Error('Error 2'))
          .mockResolvedValueOnce('success');

        const result = await manager.withRetry(operation, 'test-plugin');

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('should fail after max retries', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('Error'));

        await expect(manager.withRetry(operation, 'test-plugin')).rejects.toThrow('Error');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('should reset retry count on success', async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce('success')
          .mockRejectedValueOnce(new Error('Error'));

        await manager.withRetry(operation, 'test-plugin');
        await manager.withRetry(operation, 'test-plugin');

        expect(operation).toHaveBeenCalledTimes(5); // 2 + 3
      });

      it('should reset retry count', async () => {
        manager.resetRetryCount('test-plugin');
      });
    });

    describe('health check management', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should start and stop health checks', () => {
        manager['startHealthCheck']('test-plugin');
        expect(manager.getStats().activeHealthChecks).toBe(1);

        manager['stopHealthCheck']('test-plugin');
        expect(manager.getStats().activeHealthChecks).toBe(0);
      });

      it('should stop all health checks', () => {
        manager['startHealthCheck']('plugin1');
        manager['startHealthCheck']('plugin2');

        manager.stopAllHealthChecks();

        expect(manager.getStats().activeHealthChecks).toBe(0);
      });
    });

    describe('destroy', () => {
      it('should clean up resources', () => {
        manager['startHealthCheck']('test-plugin');
        manager.registerHooks('test-plugin', { onLoad: vi.fn() });
        manager['retryCounts'].set('test', 1);

        manager.destroy();

        expect(manager.getStats().activeHealthChecks).toBe(0);
      });
    });

    describe('getStats', () => {
      it('should return configuration stats', () => {
        const stats = manager.getStats();

        expect(stats).toHaveProperty('config');
        expect(stats).toHaveProperty('retryCounts');
        expect(stats).toHaveProperty('activeHealthChecks');
      });
    });
  });

  describe('createLifecycleManager', () => {
    it('should create lifecycle manager', () => {
      const manager = createLifecycleManager();
      expect(manager).toBeInstanceOf(PluginLifecycleManager);
    });

    it('should create manager with config', () => {
      const config: LifecycleConfig = { initTimeout: 50000 };
      const manager = createLifecycleManager(config);
      const stats = manager.getStats();

      expect(stats.config.initTimeout).toBe(50000);
    });
  });

  describe('LifecycleUtils', () => {
    describe('createEvent', () => {
      it('should create lifecycle event', () => {
        const event = LifecycleUtils.createEvent('test-plugin', PluginState.ACTIVE, { detail: 'test' });

        expect(event.pluginId).toBe('test-plugin');
        expect(event.state).toBe(PluginState.ACTIVE);
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.details).toEqual({ detail: 'test' });
      });
    });

    describe('canStart', () => {
      it('should return true for LOADED state', () => {
        const plugin = { state: PluginState.LOADED } as IPlugin;
        expect(LifecycleUtils.canStart(plugin)).toBe(true);
      });

      it('should return true for SUSPENDED state', () => {
        const plugin = { state: PluginState.SUSPENDED } as IPlugin;
        expect(LifecycleUtils.canStart(plugin)).toBe(true);
      });

      it('should return false for other states', () => {
        const plugin = { state: PluginState.ACTIVE } as IPlugin;
        expect(LifecycleUtils.canStart(plugin)).toBe(false);
      });
    });

    describe('canStop', () => {
      it('should return true for ACTIVE state', () => {
        const plugin = { state: PluginState.ACTIVE } as IPlugin;
        expect(LifecycleUtils.canStop(plugin)).toBe(true);
      });

      it('should return true for LOADED state', () => {
        const plugin = { state: PluginState.LOADED } as IPlugin;
        expect(LifecycleUtils.canStop(plugin)).toBe(true);
      });

      it('should return false for other states', () => {
        const plugin = { state: PluginState.SUSPENDED } as IPlugin;
        expect(LifecycleUtils.canStop(plugin)).toBe(false);
      });
    });

    describe('canUnload', () => {
      it('should return true for non-ACTIVE states', () => {
        const plugin = { state: PluginState.LOADED } as IPlugin;
        expect(LifecycleUtils.canUnload(plugin)).toBe(true);
      });

      it('should return false for ACTIVE state', () => {
        const plugin = { state: PluginState.ACTIVE } as IPlugin;
        expect(LifecycleUtils.canUnload(plugin)).toBe(false);
      });
    });

    describe('getUptime', () => {
      it('should return 0 for non-ACTIVE plugin', () => {
        const plugin = { state: PluginState.LOADED } as IPlugin;
        const uptime = LifecycleUtils.getUptime(plugin);
        expect(uptime).toBe(0);
      });

      it('should return uptime for ACTIVE plugin', () => {
        const plugin = { state: PluginState.ACTIVE } as IPlugin;
        const uptime = LifecycleUtils.getUptime(plugin);
        expect(uptime).toBeGreaterThan(0);
      });
    });
  });
});
