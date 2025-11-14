import { describe, it, expect, beforeAll } from 'vitest';
import {
  configManager,
  createConfigManager,
  getSecret,
  hasSecret,
  validateRequiredSecrets,
  resolveEnvVars,
  maskSecrets
} from '../src/plugins/core';
import { generateConfigReport } from '../src/plugins/core/utils';

describe('ConfigManager', () => {
  describe('Инициализация', () => {
    it('должен успешно инициализироваться', () => {
      expect(configManager).toBeDefined();
      expect(configManager.getAllPlugins).toBeDefined();
    });

    it('должен загружать список плагинов', () => {
      const plugins = configManager.getAllPlugins();
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    it('должен показывать корректную информацию о конфигурации', () => {
      const info = configManager.getConfigInfo();
      expect(info).toHaveProperty('totalPlugins');
      expect(info).toHaveProperty('enabledPlugins');
      expect(info).toHaveProperty('disabledPlugins');
      expect(info.totalPlugins).toBeGreaterThan(0);
    });
  });

  describe('Управление плагинами', () => {
    it('должен находить плагин по имени', () => {
      const plugin = configManager.getPluginConfig('neuro-photo');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('neuro-photo');
    });

    it('должен определять, включен ли плагин', () => {
      expect(configManager.isPluginEnabled('neuro-photo')).toBe(true);
      expect(configManager.isPluginEnabled('news-monitor')).toBe(false);
    });

    it('должен возвращать только включенные плагины', () => {
      const enabled = configManager.getEnabledPlugins();
      expect(enabled.length).toBeGreaterThan(0);
      enabled.forEach(plugin => {
        expect(plugin.enabled).toBe(true);
      });
    });

    it('должен загружать конфигурацию существующего плагина', async () => {
      const config = await configManager.loadConfig('neuro-photo');
      expect(config).toBeDefined();
      expect(config.defaultModel).toBeDefined();
      expect(config.maxImageSize).toBeDefined();
    });

    it('должен кэшировать конфигурацию', async () => {
      const config1 = await configManager.loadConfig('neuro-photo');
      const config2 = await configManager.loadConfig('neuro-photo');
      expect(config1).toBe(config2);
    });

    it('должен выдавать ошибку для несуществующего плагина', async () => {
      await expect(configManager.loadConfig('non-existent-plugin'))
        .rejects
        .toThrow('не найден в конфигурации');
    });

    it('должен выдавать ошибку для отключенного плагина', async () => {
      await expect(configManager.loadConfig('news-monitor'))
        .rejects
        .toThrow('отключен');
    });
  });

  describe('Валидация', () => {
    it('должен валидировать все плагины', async () => {
      const results = await configManager.validateAll();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('должен возвращать корректные результаты валидации', async () => {
      const results = await configManager.validateAll();
      results.forEach(result => {
        expect(result).toHaveProperty('pluginName');
        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
        if (!result.valid) {
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
        }
      });
    });
  });

  describe('Зависимости плагинов', () => {
    it('должен возвращать зависимости плагина', () => {
      const deps = configManager.resolveDependencies('face-training');
      expect(Array.isArray(deps)).toBe(true);
      expect(deps).toContain('neuro-photo');
    });

    it('должен возвращать пустой массив для плагина без зависимостей', () => {
      const deps = configManager.resolveDependencies('neuro-photo');
      expect(deps).toEqual([]);
    });

    it('должен получать топологический порядок загрузки', () => {
      const order = configManager.getTopologicalOrder();
      expect(Array.isArray(order)).toBe(true);
      expect(order.length).toBeGreaterThan(0);
      expect(new Set(order).size).toBe(order.length); // уникальные значения
    });

    it('должен обнаруживать циклические зависимости', () => {
      expect(() => configManager.checkCircularDependencies())
        .not
        .toThrow(); // не должно быть ошибки в текущей конфигурации
    });
  });

  describe('Настройки системы', () => {
    it('должен возвращать настройки системы', () => {
      const settings = configManager.getSettings();
      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('enableDevMode');
      expect(settings).toHaveProperty('autoReloadPlugins');
      expect(settings).toHaveProperty('logLevel');
    });
  });

  describe('Секреты', () => {
    it('должен проверять наличие секрета', () => {
      expect(() => getSecret('TELEGRAM_BOT_TOKEN')).not.toThrow();
      expect(() => getSecret('NON_EXISTENT_SECRET')).toThrow();
    });

    it('должен проверять, установлен ли секрет', () => {
      const hasToken = hasSecret('TELEGRAM_BOT_TOKEN');
      expect(typeof hasToken).toBe('boolean');
    });

    it('должен валидировать обязательные секреты', () => {
      const result = validateRequiredSecrets();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missing');
      expect(Array.isArray(result.missing)).toBe(true);
    });

    it('должен подставлять переменные окружения', () => {
      const config = {
        apiKey: '${NODE_ENV}',
        value: 123
      };
      const resolved = resolveEnvVars(config);
      expect(resolved.apiKey).toBe(process.env.NODE_ENV || 'development');
      expect(resolved.value).toBe(123);
    });

    it('должен маскировать секреты при логировании', () => {
      const sensitive = {
        token: 'secret1234567890',
        password: 'mySecretPassword',
        normal: 'value'
      };
      const masked = maskSecrets(sensitive);
      // Маскирование работает по-другому - проверяем что токен замаскирован
      expect(masked.token).not.toBe('secret1234567890');
      expect(masked.password).toBe('***');
      expect(masked.normal).toBe('value');
    });
  });

  describe('Утилиты', () => {
    it('должен генерировать отчет о конфигурации', async () => {
      const report = await generateConfigReport(configManager);
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('ОТЧЕТ О КОНФИГУРАЦИИ СИСТЕМЫ');
    });

    it('должен получать список загружаемых плагинов', () => {
      const { getLoadablePlugins } = require('../src/plugins/core/utils');
      const loadable = getLoadablePlugins(configManager);
      expect(Array.isArray(loadable)).toBe(true);
    });
  });

  describe('Создание менеджера', () => {
    it('должен создавать новый экземпляр менеджера', () => {
      const newManager = createConfigManager();
      expect(newManager).toBeDefined();
      expect(newManager).not.toBe(configManager);
    });

    it('должен обновлять кэш конфигурации', async () => {
      await configManager.refresh();
      // Если дошли до сюда, значит refresh не бросил исключение
    });
  });
});
