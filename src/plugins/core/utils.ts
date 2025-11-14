import { ConfigManager } from './config-manager';
import { ValidationResult } from './validation';

/**
 * Получить список плагинов, готовых к загрузке (все зависимости удовлетворены)
 */
export function getLoadablePlugins(
  configManager: ConfigManager,
  enabledOnly: boolean = true
): string[] {
  const plugins = enabledOnly
    ? configManager.getEnabledPlugins()
    : configManager.getAllPlugins();

  const loadable: string[] = [];
  const loading: Set<string> = new Set();

  function canLoad(pluginName: string): boolean {
    if (loading.has(pluginName)) {
      return false;
    }

    const dependencies = configManager.resolveDependencies(pluginName);
    return dependencies.every(dep => loadable.includes(dep));
  }

  const sorted = configManager.getTopologicalOrder();

  for (const pluginName of sorted) {
    if (enabledOnly && !configManager.isPluginEnabled(pluginName)) {
      continue;
    }

    if (canLoad(pluginName)) {
      loadable.push(pluginName);
      loading.add(pluginName);
    }
  }

  return loadable;
}

/**
 * Проверить совместимость версий плагинов
 */
export function checkVersionCompatibility(
  pluginName: string,
  version: string,
  requiredVersion?: string
): boolean {
  if (!requiredVersion) {
    return true;
  }

  // Простая проверка семантического версионирования
  const clean = (v: string) => v.replace(/^v/, '').split('-')[0];
  const parseVersion = (v: string) =>
    clean(v).split('.').map(n => parseInt(n, 10));

  const current = parseVersion(version);
  const required = parseVersion(requiredVersion);

  for (let i = 0; i < 3; i++) {
    if (current[i] < required[i]) {
      return false;
    }
    if (current[i] > required[i]) {
      return true;
    }
  }

  return true;
}

/**
 * Создать отчет о конфигурации системы
 */
export async function generateConfigReport(
  configManager: ConfigManager
): Promise<string> {
  const info = configManager.getConfigInfo();
  const validationResults = await configManager.validateAll();
  const loadablePlugins = getLoadablePlugins(configManager);

  const enabledPlugins = validationResults.filter(r => r.valid);
  const failedPlugins = validationResults.filter(r => !r.valid);

  let report = '\n=== ОТЧЕТ О КОНФИГУРАЦИИ СИСТЕМЫ ===\n\n';
  report += `Общая информация:\n`;
  report += `  Всего плагинов: ${info.totalPlugins}\n`;
  report += `  Включено: ${info.enabledPlugins}\n`;
  report += `  Отключено: ${info.disabledPlugins}\n`;
  report += `  Режим разработки: ${info.devMode ? 'ВКЛ' : 'ВЫКЛ'}\n`;
  report += `  Уровень логирования: ${info.logLevel}\n\n`;

  report += `Загружаемые плагины (${loadablePlugins.length}):\n`;
  loadablePlugins.forEach(plugin => {
    report += `  ✓ ${plugin}\n`;
  });
  report += '\n';

  report += `Валидация плагинов:\n`;
  report += `  Успешно: ${enabledPlugins.length}\n`;
  report += `  Ошибок: ${failedPlugins.length}\n\n`;

  if (failedPlugins.length > 0) {
    report += `Найденные ошибки:\n`;
    failedPlugins.forEach(plugin => {
      report += `  ✗ ${plugin.pluginName}:\n`;
      plugin.errors?.forEach(error => {
        report += `    - ${error}\n`;
      });
      if (plugin.warnings && plugin.warnings.length > 0) {
        plugin.warnings.forEach(warning => {
          report += `    ⚠ ${warning}\n`;
        });
      }
    });
  }

  report += '\n=== КОНЕЦ ОТЧЕТА ===\n';

  return report;
}

/**
 * Экспортировать конфигурацию в JSON
 */
export function exportConfigToJSON(configManager: ConfigManager): any {
  const plugins = configManager.getAllPlugins().map(plugin => ({
    name: plugin.name,
    path: plugin.path,
    enabled: plugin.enabled,
    dependencies: plugin.dependencies,
    config: plugin.config
  }));

  return {
    exportDate: new Date().toISOString(),
    settings: configManager.getSettings(),
    plugins,
    statistics: {
      total: plugins.length,
      enabled: plugins.filter(p => p.enabled).length,
      disabled: plugins.filter(p => !p.enabled).length
    }
  };
}

/**
 * Импортировать конфигурацию из JSON
 */
export function importConfigFromJSON(config: any): {
  success: boolean;
  imported: number;
  errors: string[];
} {
  const errors: string[] = [];
  let imported = 0;

  try {
    // Валидируем структуру конфигурации
    if (!config || typeof config !== 'object') {
      errors.push('Некорректная структура конфигурации');
      return { success: false, imported, errors };
    }

    if (!Array.isArray(config.plugins)) {
      errors.push('Отсутствует массив плагинов');
    }

    if (config.plugins) {
      config.plugins.forEach((plugin: any, index: number) => {
        if (!plugin.name || !plugin.config) {
          errors.push(`Плагин ${index}: отсутствуют обязательные поля`);
        }
      });
    }

    if (errors.length > 0) {
      return { success: false, imported, errors };
    }

    imported = config.plugins.length;

    return {
      success: true,
      imported,
      errors: []
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Неизвестная ошибка');
    return { success: false, imported, errors };
  }
}

/**
 * Создать diff между двумя конфигурациями
 */
export function diffConfigs(
  config1: any,
  config2: any
): {
  added: string[];
  removed: string[];
  modified: string[];
} {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  if (!config1 || !config2 || !Array.isArray(config1.plugins) || !Array.isArray(config2.plugins)) {
    return { added, removed, modified };
  }

  const names1 = new Set(config1.plugins.map((p: any) => p.name));
  const names2 = new Set(config2.plugins.map((p: any) => p.name));

  // Найденные плагины
  config2.plugins.forEach((plugin: any) => {
    if (!names1.has(plugin.name)) {
      added.push(plugin.name);
    }
  });

  // Удаленные плагины
  config1.plugins.forEach((plugin: any) => {
    if (!names2.has(plugin.name)) {
      removed.push(plugin.name);
    }
  });

  // Измененные плагины
  config1.plugins.forEach((plugin1: any) => {
    const plugin2 = config2.plugins.find((p: any) => p.name === plugin1.name);
    if (plugin2 && JSON.stringify(plugin1) !== JSON.stringify(plugin2)) {
      modified.push(plugin1.name);
    }
  });

  return { added, removed, modified };
}

/**
 * Валидация окружения
 */
export function validateEnvironment(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Проверяем Node.js версию
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
  if (majorVersion < 18) {
    errors.push(`Требуется Node.js 18+, текущая версия: ${nodeVersion}`);
  }

  // Проверяем доступную память
  const totalMem = process.memoryUsage().heapTotal / 1024 / 1024;
  if (totalMem < 100) {
    warnings.push(`Мало доступной памяти: ${totalMem.toFixed(2)}MB`);
  }

  // Проверяем переменные окружения
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY'];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Отсутствует обязательная переменная окружения: ${envVar}`);
    }
  });

  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}
