import { describe, it, expect } from 'vitest';
import {
  PluginType,
  PluginState,
  PluginUtils,
  type PluginInfo,
  type PluginConfig,
  type PluginExecutionContext,
} from '../../../src/plugins/core/types.js';

describe('Core Types', () => {
  describe('PluginType', () => {
    it('should have correct enum values', () => {
      expect(PluginType.PROVIDER).toBe('provider');
      expect(PluginType.SCENE).toBe('scene');
      expect(PluginType.COMMAND).toBe('command');
      expect(PluginType.MIDDLEWARE).toBe('middleware');
      expect(PluginType.ACTION).toBe('action');
      expect(PluginType.EVENT).toBe('event');
      expect(PluginType.TEMPLATE).toBe('template');
    });
  });

  describe('PluginState', () => {
    it('should have correct enum values', () => {
      expect(PluginState.UNLOADED).toBe('unloaded');
      expect(PluginState.LOADING).toBe('loading');
      expect(PluginState.LOADED).toBe('loaded');
      expect(PluginState.INITIALIZING).toBe('initializing');
      expect(PluginState.ACTIVE).toBe('active');
      expect(PluginState.SUSPENDED).toBe('suspended');
      expect(PluginState.ERROR).toBe('error');
      expect(PluginState.UNLOADING).toBe('unloading');
    });
  });

  describe('PluginUtils', () => {
    describe('isValidPlugin', () => {
      it('should return true for valid plugin', () => {
        const validPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          type: PluginType.SCENE,
          register: () => {},
        };

        expect(PluginUtils.isValidPlugin(validPlugin)).toBe(true);
      });

      it('should return false for invalid plugin without id', () => {
        const invalidPlugin = {
          name: 'Test Plugin',
          version: '1.0.0',
          type: PluginType.SCENE,
          register: () => {},
        };

        expect(PluginUtils.isValidPlugin(invalidPlugin)).toBe(false);
      });

      it('should return false for invalid plugin without name', () => {
        const invalidPlugin = {
          id: 'test-plugin',
          version: '1.0.0',
          type: PluginType.SCENE,
          register: () => {},
        };

        expect(PluginUtils.isValidPlugin(invalidPlugin)).toBe(false);
      });

      it('should return false for invalid plugin without version', () => {
        const invalidPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          type: PluginType.SCENE,
          register: () => {},
        };

        expect(PluginUtils.isValidPlugin(invalidPlugin)).toBe(false);
      });

      it('should return false for invalid plugin without type', () => {
        const invalidPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          register: () => {},
        };

        expect(PluginUtils.isValidPlugin(invalidPlugin)).toBe(false);
      });

      it('should return false for invalid plugin without register function', () => {
        const invalidPlugin = {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          type: PluginType.SCENE,
        };

        expect(PluginUtils.isValidPlugin(invalidPlugin)).toBe(false);
      });

      it('should return false for null', () => {
        expect(PluginUtils.isValidPlugin(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(PluginUtils.isValidPlugin(undefined)).toBe(false);
      });
    });

    describe('isVersionCompatible', () => {
      it('should return true for same major and higher minor version', () => {
        expect(PluginUtils.isVersionCompatible('1.5.0', '1.0.0')).toBe(true);
        expect(PluginUtils.isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
      });

      it('should return false for different major version', () => {
        expect(PluginUtils.isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
        expect(PluginUtils.isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
      });

      it('should return false for lower minor version', () => {
        expect(PluginUtils.isVersionCompatible('1.0.0', '1.5.0')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(PluginUtils.isVersionCompatible('1.2.3', '1.2.0')).toBe(true);
        expect(PluginUtils.isVersionCompatible('2.1.0', '2.0.9')).toBe(false);
      });
    });

    describe('generateId', () => {
      it('should generate unique IDs', () => {
        const id1 = PluginUtils.generateId();
        const id2 = PluginUtils.generateId();

        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^plugin_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^plugin_\d+_[a-z0-9]+$/);
      });

      it('should generate IDs with correct prefix', () => {
        const id = PluginUtils.generateId();
        expect(id).toStartWith('plugin_');
      });

      it('should generate IDs with timestamp', () => {
        const before = Date.now();
        const id = PluginUtils.generateId();
        const after = Date.now();

        const timestamp = parseInt(id.split('_')[1]);
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      });
    });

    describe('createDependencyKey', () => {
      it('should create key without version', () => {
        const key = PluginUtils.createDependencyKey('test-plugin');
        expect(key).toBe('test-plugin');
      });

      it('should create key with version', () => {
        const key = PluginUtils.createDependencyKey('test-plugin', '1.0.0');
        expect(key).toBe('test-plugin@1.0.0');
      });

      it('should handle empty version', () => {
        const key = PluginUtils.createDependencyKey('test-plugin', '');
        expect(key).toBe('test-plugin');
      });
    });

    describe('getPluginPriority', () => {
      it('should return priority from config', () => {
        const config: PluginConfig = { priority: 10 };
        expect(PluginUtils.getPluginPriority(config)).toBe(10);
      });

      it('should return default priority when not specified', () => {
        expect(PluginUtils.getPluginPriority()).toBe(0);
      });

      it('should return default priority when priority is 0', () => {
        const config: PluginConfig = { priority: 0 };
        expect(PluginUtils.getPluginPriority(config)).toBe(0);
      });
    });

    describe('isPluginEnabled', () => {
      it('should return true when enabled is true', () => {
        const config: PluginConfig = { enabled: true };
        expect(PluginUtils.isPluginEnabled(config)).toBe(true);
      });

      it('should return true when enabled is not specified', () => {
        expect(PluginUtils.isPluginEnabled()).toBe(true);
      });

      it('should return false when enabled is false', () => {
        const config: PluginConfig = { enabled: false };
        expect(PluginUtils.isPluginEnabled(config)).toBe(false);
      });

      it('should return true for config without enabled property', () => {
        const config: PluginConfig = { timeout: 5000 };
        expect(PluginUtils.isPluginEnabled(config)).toBe(true);
      });
    });
  });

  describe('PluginInfo', () => {
    it('should have correct structure', () => {
      const pluginInfo: PluginInfo = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        state: PluginState.ACTIVE,
      };

      expect(pluginInfo.id).toBe('test-plugin');
      expect(pluginInfo.name).toBe('Test Plugin');
      expect(pluginInfo.version).toBe('1.0.0');
      expect(pluginInfo.type).toBe(PluginType.SCENE);
      expect(pluginInfo.state).toBe(PluginState.ACTIVE);
    });

    it('should support optional properties', () => {
      const pluginInfo: PluginInfo = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        state: PluginState.ACTIVE,
        dependencies: ['dep1', 'dep2'],
        loadedAt: new Date(),
        lastHealthCheck: new Date(),
      };

      expect(pluginInfo.dependencies).toEqual(['dep1', 'dep2']);
      expect(pluginInfo.loadedAt).toBeInstanceOf(Date);
      expect(pluginInfo.lastHealthCheck).toBeInstanceOf(Date);
    });
  });

  describe('PluginExecutionContext', () => {
    it('should have correct structure', () => {
      const runtime = {} as any;
      const logger = {} as any;

      const context: PluginExecutionContext = {
        runtime,
        logger,
        config: { test: 'value' },
        startTime: new Date(),
        requestId: 'req-123',
      };

      expect(context.runtime).toBe(runtime);
      expect(context.logger).toBe(logger);
      expect(context.config).toEqual({ test: 'value' });
      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.requestId).toBe('req-123');
    });
  });
});
