import { PLUGIN_CONFIG } from './plugin.config';
import {
  ValidationResult,
  PluginValidationSchemas,
  SystemSettingsSchema,
  EnvironmentSchema
} from './validation';
import {
  getSecret,
  validateRequiredSecrets,
  resolveEnvVars,
  maskSecrets
} from './secrets';
import { z } from 'zod';

export interface ConfigManager {
  loadConfig(pluginName: string): Promise<any>;
  getPluginConfig(pluginName: string): any | undefined;
  validateAll(): Promise<ValidationResult[]>;
  getAllPlugins(): any[];
  isPluginEnabled(pluginName: string): boolean;
  getEnabledPlugins(): any[];
  resolveDependencies(pluginName: string): string[];
  checkCircularDependencies(): boolean;
  getSettings(): any;
  refresh(): Promise<void>;
}

export class ConfigManagerImpl implements ConfigManager {
  private configCache: Map<string, any> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Валидируем только основные части конфигурации
      SystemSettingsSchema.parse(PLUGIN_CONFIG.settings);
      EnvironmentSchema.parse(PLUGIN_CONFIG.environment);

      // Строим граф зависимостей
      this.buildDependencyGraph();

      // Проверяем циклические зависимости
      this.checkCircularDependencies();

      this.initialized = true;
      console.log('Система конфигурации инициализирована успешно');
    } catch (error) {
      console.error('Ошибка инициализации системы конфигурации:', error);
      throw error;
    }
  }

  /**
   * Загрузить конфигурацию плагина с валидацией и подстановкой переменных
   */
  async loadConfig(pluginName: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Система конфигурации не инициализирована');
    }

    // Проверяем кэш
    if (this.configCache.has(pluginName)) {
      return this.configCache.get(pluginName);
    }

    // Находим конфигурацию плагина
    const pluginConfig = PLUGIN_CONFIG.plugins.find(p => p.name === pluginName);

    if (!pluginConfig) {
      throw new Error(`Плагин "${pluginName}" не найден в конфигурации`);
    }

    // Проверяем, что плагин включен
    if (!pluginConfig.enabled) {
      throw new Error(`Плагин "${pluginName}" отключен`);
    }

    try {
      // Получаем схему валидации
      const schema = PluginValidationSchemas[pluginName];

      let validatedConfig;

      if (schema) {
        // Валидируем через Zod схему
        validatedConfig = schema.parse(pluginConfig.config);
      } else {
        // Если нет схемы, используем базовую валидацию
        validatedConfig = pluginConfig.config;
      }

      // Подставляем переменные окружения
      const resolvedConfig = resolveEnvVars(validatedConfig);

      // Проверяем зависимости
      this.checkDependencies(pluginName);

      // Кэшируем результат
      this.configCache.set(pluginName, resolvedConfig);

      return resolvedConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Ошибка валидации конфигурации плагина "${pluginName}":\n${errorMessages.join('\n')}`);
      }
      throw error;
    }
  }

  /**
   * Получить конфигурацию плагина без валидации
   */
  getPluginConfig(pluginName: string): any | undefined {
    return PLUGIN_CONFIG.plugins.find(p => p.name === pluginName);
  }

  /**
   * Валидировать все плагины
   */
  async validateAll(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const plugin of PLUGIN_CONFIG.plugins) {
      try {
        await this.loadConfig(plugin.name);
        results.push({
          pluginName: plugin.name,
          valid: true
        });
      } catch (error) {
        results.push({
          pluginName: plugin.name,
          valid: false,
          errors: [error instanceof Error ? error.message : 'Неизвестная ошибка']
        });
      }
    }

    return results;
  }

  /**
   * Получить список всех плагинов
   */
  getAllPlugins(): any[] {
    return PLUGIN_CONFIG.plugins;
  }

  /**
   * Проверить, включен ли плагин
   */
  isPluginEnabled(pluginName: string): boolean {
    const plugin = this.getPluginConfig(pluginName);
    return plugin ? plugin.enabled : false;
  }

  /**
   * Получить только включенные плагины
   */
  getEnabledPlugins(): any[] {
    return PLUGIN_CONFIG.plugins.filter(p => p.enabled);
  }

  /**
   * Получить зависимости плагина
   */
  resolveDependencies(pluginName: string): string[] {
    return this.dependencyGraph.get(pluginName) || [];
  }

  /**
   * Проверить циклические зависимости
   */
  checkCircularDependencies(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        console.error(`Циклическая зависимость обнаружена: ${node}`);
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.dependencyGraph.get(node) || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const plugin of PLUGIN_CONFIG.plugins) {
      if (hasCycle(plugin.name)) {
        throw new Error('Обнаружены циклические зависимости между плагинами');
      }
    }

    return false;
  }

  /**
   * Получить общие настройки
   */
  getSettings(): any {
    return PLUGIN_CONFIG.settings;
  }

  /**
   * Обновить кэш конфигурации
   */
  async refresh(): Promise<void> {
    this.configCache.clear();
    this.initialize();
  }

  /**
   * Построить граф зависимостей
   */
  private buildDependencyGraph(): void {
    for (const plugin of PLUGIN_CONFIG.plugins) {
      const deps = plugin.dependencies || [];
      this.dependencyGraph.set(plugin.name, deps);
    }
  }

  /**
   * Проверить зависимости плагина
   */
  private checkDependencies(pluginName: string): void {
    const dependencies = this.dependencyGraph.get(pluginName) || [];

    for (const dep of dependencies) {
      const depPlugin = this.getPluginConfig(dep);

      if (!depPlugin) {
        throw new Error(`Зависимость "${dep}" для плагина "${pluginName}" не найдена`);
      }

      if (!depPlugin.enabled) {
        throw new Error(`Зависимость "${dep}" для плагина "${pluginName}" отключена`);
      }

      try {
        // Пытаемся загрузить конфигурацию зависимости
        this.loadConfig(dep);
      } catch (error) {
        throw new Error(`Не удалось загрузить зависимость "${dep}" для плагина "${pluginName}": ${error}`);
      }
    }
  }

  /**
   * Получить топологическую сортировку плагинов
   */
  getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (pluginName: string) => {
      if (visiting.has(pluginName)) {
        throw new Error(`Циклическая зависимость обнаружена на плагине "${pluginName}"`);
      }

      if (visited.has(pluginName)) {
        return;
      }

      visiting.add(pluginName);

      const dependencies = this.dependencyGraph.get(pluginName) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      result.push(pluginName);
    };

    for (const plugin of PLUGIN_CONFIG.plugins) {
      if (plugin.enabled) {
        visit(plugin.name);
      }
    }

    return result;
  }

  /**
   * Получить информацию о конфигурации (для логирования)
   */
  getConfigInfo(): any {
    const enabledPlugins = this.getEnabledPlugins();
    const enabledCount = enabledPlugins.length;
    const totalCount = PLUGIN_CONFIG.plugins.length;

    return {
      totalPlugins: totalCount,
      enabledPlugins: enabledCount,
      disabledPlugins: totalCount - enabledCount,
      devMode: PLUGIN_CONFIG.settings.enableDevMode,
      logLevel: PLUGIN_CONFIG.settings.logLevel
    };
  }
}

// Экспортируем singleton экземпляр
export const configManager = new ConfigManagerImpl();

// Фабричная функция для создания экземпляра (для тестирования)
export function createConfigManager(): ConfigManager {
  return new ConfigManagerImpl();
}
