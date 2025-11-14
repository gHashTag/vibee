/**
 * @fileoverview Менеджер плагинов для управления жизненным циклом
 * @author Vibee Core Team
 * @version 1.0.0
 */

import type { IAgentRuntime } from '@elizaos/core'
import type { Logger } from '@elizaos/core'
import type { PluginContext } from './plugin.interface.js'
import type {
  IPlugin,
  IPluginManager,
  PluginState,
  PluginHealthStatus,
  PluginObserver,
} from './plugin.interface.js'
import {
  PluginState as State,
  PluginRegistrationOptions,
  PluginManagerEvent,
  PluginManagerEventListener,
  PluginLoadingStrategy,
  DependencyResolutionStrategy,
} from './types.js'
import { PluginRegistryImpl, createRegistry } from './plugin-registry.js'
import { PluginUtils } from './types.js'

/**
 * Менеджер плагинов - центральный компонент системы
 */
export class PluginManager implements IPluginManager {
  private plugins: Map<string, IPlugin>
  private registry: PluginRegistryImpl
  private context: PluginContext | null = null
  private observers: Set<PluginObserver>
  private eventListeners: Set<PluginManagerEventListener>
  private state: State
  private dependencies: Map<string, Set<string>>
  private loadingQueue: string[]
  private isInitialized: boolean

  constructor() {
    this.plugins = new Map()
    this.registry = createRegistry('core')
    this.observers = new Set()
    this.eventListeners = new Set()
    this.state = State.UNLOADED
    this.dependencies = new Map()
    this.loadingQueue = []
    this.isInitialized = false
  }

  /**
   * Проверка состояния
   */
  private isInState(...states: State[]): boolean {
    return states.includes(this.state)
  }

  /**
   * Переход в состояние
   */
  private setState(newState: State): void {
    if (this.state !== newState) {
      const oldState = this.state
      this.state = newState
      this.emitEvent({ type: 'plugin:state:changed', pluginId: 'manager', oldState, newState })
    }
  }

  /**
   * Инициализация менеджера
   */
  async init(runtime: IAgentRuntime, bot: any, logger: Logger, config: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      logger.warn('PluginManager is already initialized')
      return
    }

    this.context = {
      runtime,
      bot,
      registry: this.registry,
      logger,
      config,
      services: {},
    }

    this.setState(State.LOADING)

    // Регистрация системных плагинов
    await this.registerSystemPlugins()

    this.setState(State.LOADED)
    this.isInitialized = true

    this.emitEvent({ type: 'plugin:started', pluginId: 'manager' })
  }

  /**
   * Регистрация плагина
   */
  async register(plugin: IPlugin, options: PluginRegistrationOptions = {}): Promise<void> {
    this.ensureInitialized()

    const pluginId = plugin.id
    const { autoInit = false, priority = 0 } = options

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin with id '${pluginId}' is already registered`)
    }

    // Проверка валидности плагина
    if (!PluginUtils.isValidPlugin(plugin)) {
      throw new Error(`Invalid plugin: ${pluginId}`)
    }

    // Добавление в реестр
    this.plugins.set(pluginId, plugin)
    this.setState(State.LOADING)

    // Регистрация зависимостей
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      this.registerDependencies(pluginId, plugin.dependencies)
    }

    // Уведомление наблюдателей
    this.observers.forEach(obs => obs.onPluginRegistered?.(plugin))
    this.emitEvent({ type: 'plugin:registered', pluginId, options })

    this.setState(State.LOADED)

    // Автоматическая инициализация
    if (autoInit) {
      await this.initializePlugin(pluginId)
    }
  }

  /**
   * Инициализация плагина
   */
  async initializePlugin(pluginId: string): Promise<void> {
    this.ensureInitialized()

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (!this.context) {
      throw new Error('PluginManager context is not initialized')
    }

    try {
      this.setState(State.INITIALIZING)
      plugin.state = State.INITIALIZING

      // Проверка зависимостей
      await this.checkDependencies(pluginId)

      // Инициализация плагина
      if (plugin.init) {
        await plugin.init(this.context)
      }

      // Регистрация в реестре
      await plugin.register(this.registry)

      plugin.state = State.LOADED
      this.observers.forEach(obs => obs.onPluginInitialized?.(plugin))
      this.emitEvent({ type: 'plugin:initialized', pluginId })
    } catch (error) {
      plugin.state = State.ERROR
      const err = error as Error
      this.observers.forEach(obs => obs.onPluginError?.(plugin, err))
      this.emitEvent({ type: 'plugin:error', pluginId, error: err })
      throw err
    }
  }

  /**
   * Запуск плагина
   */
  async start(pluginId: string): Promise<void> {
    this.ensureInitialized()

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (!this.context) {
      throw new Error('PluginManager context is not initialized')
    }

    try {
      if (plugin.start) {
        await plugin.start(this.context)
      }

      plugin.state = State.ACTIVE
      this.observers.forEach(obs => obs.onPluginStarted?.(plugin))
      this.emitEvent({ type: 'plugin:started', pluginId })
    } catch (error) {
      plugin.state = State.ERROR
      const err = error as Error
      this.observers.forEach(obs => obs.onPluginError?.(plugin, err))
      this.emitEvent({ type: 'plugin:error', pluginId, error: err })
      throw err
    }
  }

  /**
   * Остановка плагина
   */
  async stop(pluginId: string): Promise<void> {
    this.ensureInitialized()

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (!this.context) {
      throw new Error('PluginManager context is not initialized')
    }

    try {
      if (plugin.stop) {
        await plugin.stop(this.context)
      }

      plugin.state = State.SUSPENDED
      this.observers.forEach(obs => obs.onPluginStopped?.(plugin))
      this.emitEvent({ type: 'plugin:stopped', pluginId })
    } catch (error) {
      plugin.state = State.ERROR
      const err = error as Error
      this.observers.forEach(obs => obs.onPluginError?.(plugin, err))
      this.emitEvent({ type: 'plugin:error', pluginId, error: err })
      throw err
    }
  }

  /**
   * Выгрузка плагина
   */
  async unload(pluginId: string): Promise<void> {
    this.ensureInitialized()

    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    try {
      this.setState(State.UNLOADING)

      // Остановка плагина
      if (plugin.state === State.ACTIVE || plugin.state === State.LOADED) {
        await this.stop(pluginId)
      }

      // Очистка ресурсов
      if (plugin.destroy) {
        await plugin.destroy()
      }

      // Удаление из реестра
      this.plugins.delete(pluginId)
      this.dependencies.delete(pluginId)

      plugin.state = State.UNLOADED
      this.observers.forEach(obs => obs.onPluginDestroyed?.(plugin))
      this.emitEvent({ type: 'plugin:unloaded', pluginId })
    } catch (error) {
      this.emitEvent({ type: 'plugin:error', pluginId, error: error as Error })
      throw error
    }
  }

  /**
   * Получение плагина
   */
  get(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Проверка здоровья плагина
   */
  async checkHealth(pluginId: string): Promise<PluginHealthStatus> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return {
        healthy: false,
        message: `Plugin not found: ${pluginId}`,
        lastChecked: new Date(),
      }
    }

    try {
      if (plugin.healthCheck) {
        const result = await plugin.healthCheck()
        return result
      }

      return {
        healthy: true,
        message: 'Plugin is healthy',
        lastChecked: new Date(),
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${(error as Error).message}`,
        lastChecked: new Date(),
        details: { error: (error as Error).stack },
      }
    }
  }

  /**
   * Получение плагинов по типу
   */
  getByType(type: string): IPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type)
  }

  /**
   * Добавление наблюдателя
   */
  addObserver(observer: PluginObserver): void {
    this.observers.add(observer)
  }

  /**
   * Удаление наблюдателя
   */
  removeObserver(observer: PluginObserver): void {
    this.observers.delete(observer)
  }

  /**
   * Добавление слушателя событий
   */
  addEventListener(listener: PluginManagerEventListener): void {
    this.eventListeners.add(listener)
  }

  /**
   * Удаление слушателя событий
   */
  removeEventListener(listener: PluginManagerEventListener): void {
    this.eventListeners.delete(listener)
  }

  /**
   * Получение реестра
   */
  getRegistry(): PluginRegistryImpl {
    return this.registry
  }

  /**
   * Получение всех плагинов
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Запуск всех плагинов
   */
  async startAll(): Promise<void> {
    const plugins = Array.from(this.plugins.values())
    const promises = plugins.map(plugin => this.start(plugin.id))

    await Promise.allSettled(promises)
  }

  /**
   * Остановка всех плагинов
   */
  async stopAll(): Promise<void> {
    const plugins = Array.from(this.plugins.values())
    const promises = plugins.map(plugin => this.stop(plugin.id))

    await Promise.allSettled(promises)
  }

  /**
   * Выгрузка всех плагинов
   */
  async unloadAll(): Promise<void> {
    const plugins = Array.from(this.plugins.values())
    const promises = plugins.map(plugin => this.unload(plugin.id))

    await Promise.allSettled(promises)
  }

  /**
   * Проверка состояния инициализации
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.context) {
      throw new Error('PluginManager is not initialized. Call init() first.')
    }
  }

  /**
   * Регистрация зависимостей
   */
  private registerDependencies(pluginId: string, deps: string[]): void {
    const depSet = this.dependencies.get(pluginId) || new Set()
    deps.forEach(dep => depSet.add(dep))
    this.dependencies.set(pluginId, depSet)
  }

  /**
   * Проверка зависимостей
   */
  private async checkDependencies(pluginId: string): Promise<void> {
    const deps = this.dependencies.get(pluginId)
    if (!deps || deps.size === 0) return

    for (const dep of deps) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep} for plugin ${pluginId}`)
      }

      const depPlugin = this.plugins.get(dep)
      if (depPlugin?.state !== State.ACTIVE && depPlugin?.state !== State.LOADED) {
        throw new Error(`Dependency ${dep} is not ready for plugin ${pluginId}`)
      }
    }
  }

  /**
   * Регистрация системных плагинов
   */
  private async registerSystemPlugins(): Promise<void> {
    // Здесь можно зарегистрировать встроенные плагины системы
    // Например, плагин логирования, мониторинга и т.д.
  }

  /**
   * Уведомление слушателей событий
   */
  private emitEvent(event: PluginManagerEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        // Логируем ошибку, но не прерываем выполнение
        console.error('Error in event listener:', error)
      }
    })
  }

  /**
   * Получение статистики
   */
  getStats(): Record<string, any> {
    const pluginsByState = new Map<State, number>()
    const pluginsByType = new Map<string, number>()

    for (const plugin of this.plugins.values()) {
      // По состоянию
      const state = plugin.state || State.UNLOADED
      pluginsByState.set(state, (pluginsByState.get(state) || 0) + 1)

      // По типу
      pluginsByType.set(plugin.type, (pluginsByType.get(plugin.type) || 0) + 1)
    }

    return {
      total: this.plugins.size,
      byState: Object.fromEntries(pluginsByState),
      byType: Object.fromEntries(pluginsByType),
      registrySize: {
        commands: this.registry.size('commands'),
        middleware: this.registry.size('middleware'),
        scenes: this.registry.size('scenes'),
        actions: this.registry.size('actions'),
        providers: this.registry.size('providers'),
      },
    }
  }
}
