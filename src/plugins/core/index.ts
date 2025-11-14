/**
 * @fileoverview Главный экспорт ядра плагинной системы Vibee
 * @author Vibee Core Team
 * @version 1.0.0
 */

// Основные интерфейсы
export type {
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
  IPluginManager,
} from './plugin.interface.js'

// Типы и утилиты
export type {
  PluginType,
  PluginState,
  PluginOperationResult,
  PluginInfo,
  PluginConfig,
  PluginLifecycleEvent,
  PluginLifecycleHooks,
  PluginExecutionContext,
  PluginHealthStatus,
  PluginRegistrationOptions,
  PluginLoadResult,
  PluginDiscoveryEvent,
  PluginManagerEvent,
  PluginManagerEventListener,
} from './types.js'

export { PluginUtils } from './types.js'

// Реализации
export { PluginRegistryImpl, createRegistry } from './plugin-registry.js'
export { PluginManager } from './plugin-manager.js'
export { PluginDiscoverer, createDiscoverer, discoverVibeePlugins } from './plugin-discovery.js'
export {
  PluginLifecycleManager,
  createLifecycleManager,
  LifecycleUtils,
} from './plugin-lifecycle.js'
export { BasePlugin, createBasePlugin, BasePluginUtils, Plugin, type BasePluginConfig } from './base-plugin.js'

// REFACTORED: New base classes with strict typing and separated concerns
export * from './base-provider.js'
export * from './base-scene.js'
export * from './base-command.js'
export * from './errors.js'
export * from './retry.js'
export * from './cache.js'
export * from './rate-limiter.js'
export { ValidationResult } from './validation.js'
export { getLoadablePlugins, checkVersionCompatibility, generateConfigReport, exportConfigToJSON, importConfigFromJSON, diffConfigs, validateEnvironment } from './utils.js'

/**
 * Создание полноценной плагинной системы
 */
export interface PluginSystemConfig {
  /** Пути для поиска плагинов */
  pluginPaths?: string[]

  /** Конфигурация жизненного цикла */
  lifecycleConfig?: any

  /** Автоматическое обнаружение плагинов */
  autoDiscovery?: boolean

  /** Паттерны для обнаружения */
  discoveryPatterns?: any

  /** Логгер */
  logger?: (message: string) => void
}

/**
 * Полная плагинная система Vibee
 */
export class VibeePluginSystem {
  private manager: PluginManager
  private discoverer: PluginDiscoverer
  private lifecycleManager: PluginLifecycleManager
  private isInitialized: boolean = false

  constructor(private config: PluginSystemConfig = {}) {
    // Создание компонентов
    this.lifecycleManager = new PluginLifecycleManager(config.lifecycleConfig)

    this.discoverer = new PluginDiscoverer(
      config.discoveryPatterns || {},
      undefined,
      config.logger
    )

    this.manager = new PluginManager()
  }

  /**
   * Инициализация системы
   */
  async init(
    runtime: any,
    bot: any,
    logger: any,
    config: Record<string, any>
  ): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // Инициализация менеджера
    await this.manager.init(runtime, bot, logger, config)

    // Автоматическое обнаружение и загрузка плагинов
    if (this.config.autoDiscovery && this.config.pluginPaths) {
      await this.discoverAndLoadPlugins()
    }

    this.isInitialized = true
  }

  /**
   * Загрузка плагина вручную
   */
  async loadPlugin(plugin: IPlugin): Promise<void> {
    await this.manager.register(plugin, { autoInit: true })
  }

  /**
   * Запуск всех плагинов
   */
  async startAll(): Promise<void> {
    await this.manager.startAll()
  }

  /**
   * Остановка всех плагинов
   */
  async stopAll(): Promise<void> {
    await this.manager.stopAll()
  }

  /**
   * Получение менеджера плагинов
   */
  getManager(): PluginManager {
    return this.manager
  }

  /**
   * Получение реестра плагинов
   */
  getRegistry(): any {
    return this.manager.getRegistry()
  }

  /**
   * Обнаружение и загрузка плагинов
   */
  private async discoverAndLoadPlugins(): Promise<void> {
    const { found, errors } = await this.discoverer.discover(
      this.config.pluginPaths || []
    )

    if (errors.length > 0) {
      console.error('Plugin discovery errors:', errors)
    }

    for (const pluginInfo of found) {
      try {
        // Загрузка плагина по пути
        const pluginPath = this.findPluginPath(pluginInfo.id)
        if (pluginPath) {
          const plugin = await this.manager.load(pluginPath)
          await this.manager.register(plugin, { autoInit: true })
        }
      } catch (error) {
        console.error(`Failed to load plugin ${pluginInfo.id}:`, error)
      }
    }
  }

  /**
   * Поиск пути к плагину
   */
  private findPluginPath(pluginId: string): string | null {
    // Реализация поиска пути к плагину
    // В реальной системе здесь должна быть логика поиска по ID
    return null
  }

  /**
   * Получение статистики системы
   */
  getStats(): Record<string, any> {
    return {
      manager: this.manager.getStats(),
      lifecycle: this.lifecycleManager.getStats(),
      isInitialized: this.isInitialized,
    }
  }

  /**
   * Уничтожение системы
   */
  async destroy(): Promise<void> {
    await this.manager.unloadAll()
    this.lifecycleManager.destroy()
    this.isInitialized = false
  }
}

/**
 * Создание плагинной системы с настройками по умолчанию
 */
export function createPluginSystem(
  config: PluginSystemConfig = {}
): VibeePluginSystem {
  return new VibeePluginSystem(config)
}

/**
 * Экспорт фабричных функций
 */
export const PluginFactories = {
  /**
   * Создание плагина-команды
   */
  createCommandPlugin(config: BasePluginConfig & {
    command: string
    handler: (ctx: any, ...args: string[]) => Promise<void> | void
  }): BasePlugin {
    const pluginConfig: BasePluginConfig = {
      ...config,
      type: 'command' as any,
    }

    class CommandPlugin extends BasePlugin {
      protected async onInit(): Promise<void> {
        // Логика инициализации
      }

      protected async onRegister(registry: any): Promise<void> {
        registry.registerCommand({
          name: config.command,
          description: config.description,
          handler: config.handler,
        })
      }

      protected async onStart(): Promise<void> {
        // Логика запуска
      }

      protected async onStop(): Promise<void> {
        // Логика остановки
      }

      protected async onDestroy(): Promise<void> {
        // Логика очистки
      }

      protected async onHealthCheck(): Promise<Record<string, any>> {
        return {
          state: this.state,
          command: config.command,
        }
      }
    }

    return new CommandPlugin(pluginConfig)
  },

  /**
   * Создание плагина-middleware
   */
  createMiddlewarePlugin(config: BasePluginConfig & {
    handler: (ctx: any, next: () => Promise<void>) => Promise<void>
  }): BasePlugin {
    const pluginConfig: BasePluginConfig = {
      ...config,
      type: 'middleware' as any,
    }

    class MiddlewarePlugin extends BasePlugin {
      protected async onInit(): Promise<void> {}

      protected async onRegister(registry: any): Promise<void> {
        registry.registerMiddleware({
          name: config.name,
          handler: config.handler,
        })
      }

      protected async onStart(): Promise<void> {}

      protected async onStop(): Promise<void> {}

      protected async onDestroy(): Promise<void> {}

      protected async onHealthCheck(): Promise<Record<string, any>> {
        return { state: this.state }
      }
    }

    return new MiddlewarePlugin(pluginConfig)
  },
}

/**
 * Версия ядра плагинной системы
 */
export const VERSION = '1.0.0'

/**
 * Информация о системе
 */
export const SYSTEM_INFO = {
  name: 'Vibee Plugin Core',
  version: VERSION,
  description: 'Core plugin system for Vibee AI Telegram Bot',
  author: 'Vibee Core Team',
}
