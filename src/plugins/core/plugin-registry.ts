/**
 * @fileoverview Реестр плагинов для централизованного управления
 * @author Vibee Core Team
 * @version 1.0.0
 */

import type {
  PluginRegistry,
  PluginCommand,
  PluginMiddleware,
  EventHandler,
  PluginScene,
  PluginAction,
  PluginProvider,
} from './plugin.interface.js'

/**
 * Внутренние коллекции реестра
 */
interface RegistryCollections {
  commands: Map<string, PluginCommand>
  middleware: Map<string, PluginMiddleware>
  eventHandlers: Map<string, EventHandler[]>
  scenes: Map<string, PluginScene>
  actions: Map<string, PluginAction>
  providers: Map<string, PluginProvider>
  dependencies: Map<string, any>
  configs: Map<string, any>
}

/**
 * Реализация реестра плагинов
 */
export class PluginRegistryImpl implements PluginRegistry {
  private collections: RegistryCollections
  private namespace: string
  private parent: PluginRegistryImpl | null

  constructor(namespace: string = 'root', parent: PluginRegistryImpl | null = null) {
    this.namespace = namespace
    this.parent = parent
    this.collections = {
      commands: new Map(),
      middleware: new Map(),
      eventHandlers: new Map(),
      scenes: new Map(),
      actions: new Map(),
      providers: new Map(),
      dependencies: new Map(),
      configs: new Map(),
    }
  }

  /**
   * Регистрация команды
   */
  registerCommand(command: PluginCommand): void {
    if (!command.name || typeof command.name !== 'string') {
      throw new Error('Invalid command name')
    }

    const key = this.getKey('command', command.name)
    this.collections.commands.set(key, command)
  }

  /**
   * Регистрация middleware
   */
  registerMiddleware(middleware: PluginMiddleware): void {
    const name = middleware.name || `middleware_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const key = this.getKey('middleware', name)
    this.collections.middleware.set(key, middleware)
  }

  /**
   * Регистрация обработчика событий
   */
  registerEventHandler(handler: EventHandler): void {
    if (!handler.event || typeof handler.event !== 'string') {
      throw new Error('Invalid event name')
    }

    const key = this.getKey('event', handler.event)
    const handlers = this.collections.eventHandlers.get(key) || []
    handlers.push(handler)
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    this.collections.eventHandlers.set(key, handlers)
  }

  /**
   * Регистрация сцены
   */
  registerScene(scene: PluginScene): void {
    if (!scene.id || typeof scene.id !== 'string') {
      throw new Error('Invalid scene id')
    }

    const key = this.getKey('scene', scene.id)
    this.collections.scenes.set(key, scene)
  }

  /**
   * Регистрация action
   */
  registerAction(action: PluginAction): void {
    if (!action.name || typeof action.name !== 'string') {
      throw new Error('Invalid action name')
    }

    const key = this.getKey('action', action.name)
    this.collections.actions.set(key, action)
  }

  /**
   * Регистрация провайдера
   */
  registerProvider(provider: PluginProvider): void {
    if (!provider.name || typeof provider.name !== 'string') {
      throw new Error('Invalid provider name')
    }

    const key = this.getKey('provider', provider.name)
    this.collections.providers.set(key, provider)
  }

  /**
   * Получение зависимости
   */
  getDependency<T = any>(name: string): T | undefined {
    const key = this.getKey('dependency', name)
    return this.collections.dependencies.get(key)
  }

  /**
   * Проверка наличия зависимости
   */
  hasDependency(name: string): boolean {
    const key = this.getKey('dependency', name)
    return this.collections.dependencies.has(key)
  }

  /**
   * Получение конфигурации
   */
  getConfig(key?: string): any {
    if (!key) {
      const config: Record<string, any> = {}
      for (const [k, v] of this.collections.configs.entries()) {
        config[k] = v
      }
      return config
    }

    const fullKey = this.getKey('config', key)
    return this.collections.configs.get(fullKey)
  }

  /**
   * Установка зависимости
   */
  setDependency(name: string, value: any): void {
    const key = this.getKey('dependency', name)
    this.collections.dependencies.set(key, value)
  }

  /**
   * Установка конфигурации
   */
  setConfig(key: string, value: any): void {
    const fullKey = this.getKey('config', key)
    this.collections.configs.set(fullKey, value)
  }

  /**
   * Создание дочернего реестра
   */
  createChild(namespace: string): PluginRegistry {
    return new PluginRegistryImpl(`${this.namespace}.${namespace}`, this)
  }

  /**
   * Получение всех команд
   */
  getAllCommands(): PluginCommand[] {
    return Array.from(this.collections.commands.values())
  }

  /**
   * Получение всех middleware
   */
  getAllMiddleware(): PluginMiddleware[] {
    return Array.from(this.collections.middleware.values())
  }

  /**
   * Получение всех обработчиков событий
   */
  getAllEventHandlers(eventName?: string): EventHandler[] {
    if (!eventName) {
      return Array.from(this.collections.eventHandlers.values()).flat()
    }

    const key = this.getKey('event', eventName)
    return this.collections.eventHandlers.get(key) || []
  }

  /**
   * Получение всех сцен
   */
  getAllScenes(): PluginScene[] {
    return Array.from(this.collections.scenes.values())
  }

  /**
   * Получение всех actions
   */
  getAllActions(): PluginAction[] {
    return Array.from(this.collections.actions.values())
  }

  /**
   * Получение всех провайдеров
   */
  getAllProviders(): PluginProvider[] {
    return Array.from(this.collections.providers.values())
  }

  /**
   * Очистка реестра
   */
  clear(): void {
    for (const collection of Object.values(this.collections)) {
      collection.clear()
    }
  }

  /**
   * Удаление элемента из реестра
   */
  remove(type: keyof RegistryCollections, key: string): boolean {
    const collection = this.collections[type]
    if (!collection) return false

    const fullKey = this.getKey(type, key)
    return collection.delete(fullKey)
  }

  /**
   * Проверка наличия элемента
   */
  has(type: keyof RegistryCollections, key: string): boolean {
    const collection = this.collections[type]
    if (!collection) return false

    const fullKey = this.getKey(type, key)
    return collection.has(fullKey)
  }

  /**
   * Получение количества элементов
   */
  size(type?: keyof RegistryCollections): number {
    if (!type) {
      return Object.values(this.collections).reduce((sum, col) => sum + col.size, 0)
    }

    const collection = this.collections[type]
    return collection ? collection.size : 0
  }

  /**
   * Получение ключа с учетом namespace
   */
  private getKey(type: string, key: string): string {
    return `${this.namespace}:${type}:${key}`
  }

  /**
   * Экспорт конфигурации для сериализации
   */
  exportConfig(): Record<string, any> {
    const config: Record<string, any> = {
      namespace: this.namespace,
      commands: this.getAllCommands(),
      middleware: this.getAllMiddleware(),
      eventHandlers: this.getAllEventHandlers(),
      scenes: this.getAllScenes(),
      actions: this.getAllActions(),
      providers: this.getAllProviders(),
    }

    return config
  }

  /**
   * Импорт конфигурации
   */
  importConfig(config: Record<string, any>): void {
    if (config.commands) {
      for (const cmd of config.commands as PluginCommand[]) {
        this.registerCommand(cmd)
      }
    }

    if (config.middleware) {
      for (const mw of config.middleware as PluginMiddleware[]) {
        this.registerMiddleware(mw)
      }
    }

    if (config.eventHandlers) {
      for (const handler of config.eventHandlers as EventHandler[]) {
        this.registerEventHandler(handler)
      }
    }

    if (config.scenes) {
      for (const scene of config.scenes as PluginScene[]) {
        this.registerScene(scene)
      }
    }

    if (config.actions) {
      for (const action of config.actions as PluginAction[]) {
        this.registerAction(action)
      }
    }

    if (config.providers) {
      for (const provider of config.providers as PluginProvider[]) {
        this.registerProvider(provider)
      }
    }
  }
}

/**
 * Создание реестра плагинов
 */
export function createRegistry(namespace?: string): PluginRegistry {
  return new PluginRegistryImpl(namespace || 'root')
}
