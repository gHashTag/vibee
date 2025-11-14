/**
 * @fileoverview Базовый класс плагина для Vibee
 * @author Vibee Core Team
 * @version 1.0.0
 */

import type { IPlugin, PluginContext } from './plugin.interface.js'
import type { PluginType, PluginState } from './types.js'

/**
 * Конфигурация базового плагина
 */
export interface BasePluginConfig {
  id: string
  name: string
  version: string
  description: string
  author: string
  type: PluginType
  dependencies?: string[]
  configSchema?: Record<string, any>
  priority?: number
  enabled?: boolean
  timeout?: number
}

/**
 * Базовый класс плагина
 */
export abstract class BasePlugin implements IPlugin {
  /** Уникальный идентификатор плагина */
  readonly id: string

  /** Имя плагина */
  readonly name: string

  /** Версия плагина */
  readonly version: string

  /** Описание плагина */
  readonly description: string

  /** Автор плагина */
  readonly author: string

  /** Тип плагина */
  readonly type: PluginType

  /** Зависимости от других плагинов */
  readonly dependencies?: string[]

  /** Схема конфигурации */
  readonly configSchema?: Record<string, any>

  /** Текущее состояние плагина */
  state: PluginState

  /** Конфигурация плагина */
  protected config: Record<string, any>

  /** Контекст выполнения */
  protected context: PluginContext | null = null

  /** Логгер */
  protected logger: any = null

  /** Приоритет плагина */
  readonly priority: number

  /** Флаг включенности */
  readonly enabled: boolean

  /** Таймаут операций */
  readonly timeout: number

  /** Время последней активности */
  protected lastActivity: Date

  /**
   * Конструктор базового плагина
   */
  constructor(config: BasePluginConfig) {
    this.id = config.id
    this.name = config.name
    this.version = config.version
    this.description = config.description
    this.author = config.author
    this.type = config.type
    this.dependencies = config.dependencies || []
    this.configSchema = config.configSchema || {}
    this.priority = config.priority || 0
    this.enabled = config.enabled !== false
    this.timeout = config.timeout || 30000
    this.state = PluginState.UNLOADED
    this.config = {}
    this.lastActivity = new Date()

    this.validateConfig()
  }

  /**
   * Инициализация плагина
   */
  async init(context: PluginContext): Promise<void> {
    if (!this.enabled) {
      throw new Error(`Plugin ${this.name} is disabled`)
    }

    this.context = context
    this.logger = context.logger

    this.log('Initializing plugin', { id: this.id, version: this.version })

    // Проверка зависимостей
    await this.checkDependencies(context)

    // Применение конфигурации
    this.applyConfig(context.config)

    // Инициализация плагина
    await this.onInit()

    this.state = PluginState.LOADED
    this.log('Plugin initialized successfully')
  }

  /**
   * Регистрация плагина в системе
   */
  async register(registry: any): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin is not initialized')
    }

    this.log('Registering plugin')

    await this.onRegister(registry)

    this.log('Plugin registered successfully')
  }

  /**
   * Запуск плагина
   */
  async start(context: PluginContext): Promise<void> {
    if (!this.enabled) {
      throw new Error(`Plugin ${this.name} is disabled`)
    }

    if (this.state !== PluginState.LOADED && this.state !== PluginState.SUSPENDED) {
      throw new Error(`Cannot start plugin in state: ${this.state}`)
    }

    this.context = context
    this.logger = context.logger

    this.log('Starting plugin')

    await this.onStart()

    this.state = PluginState.ACTIVE
    this.lastActivity = new Date()

    this.log('Plugin started successfully')
  }

  /**
   * Остановка плагина
   */
  async stop(context: PluginContext): Promise<void> {
    if (this.state !== PluginState.ACTIVE && this.state !== PluginState.LOADED) {
      throw new Error(`Cannot stop plugin in state: ${this.state}`)
    }

    this.context = context
    this.logger = context.logger

    this.log('Stopping plugin')

    await this.onStop()

    this.state = PluginState.SUSPENDED

    this.log('Plugin stopped successfully')
  }

  /**
   * Очистка ресурсов
   */
  async destroy(): Promise<void> {
    this.log('Destroying plugin')

    await this.onDestroy()

    this.state = PluginState.UNLOADED
    this.context = null
    this.logger = null

    this.log('Plugin destroyed')
  }

  /**
   * Проверка здоровья плагина
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      const result = await this.onHealthCheck()

      this.lastActivity = new Date()

      return {
        healthy: true,
        message: 'Plugin is healthy',
        details: result,
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${(error as Error).message}`,
        details: {
          error: (error as Error).stack,
          state: this.state,
          lastActivity: this.lastActivity,
        },
      }
    }
  }

  /**
   * Получение метрик плагина
   */
  getMetrics(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      state: this.state,
      enabled: this.enabled,
      priority: this.priority,
      uptime: this.getUptime(),
      lastActivity: this.lastActivity,
      config: this.config,
    }
  }

  /**
   * Получение времени работы
   */
  getUptime(): number {
    if (this.state !== PluginState.ACTIVE) {
      return 0
    }

    return Date.now() - this.lastActivity.getTime()
  }

  /**
   * Обновление конфигурации
   */
  updateConfig(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig }
    this.applyConfig(this.config)
  }

  /**
   * Получение конфигурации
   */
  getConfig(key?: string): any {
    if (!key) {
      return this.config
    }

    return this.config[key]
  }

  /**
   * Проверка, включен ли плагин
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Проверка, активен ли плагин
   */
  isActive(): boolean {
    return this.state === PluginState.ACTIVE
  }

  /**
   * Логирование
   */
  protected log(message: string, data?: Record<string, any>): void {
    if (this.logger) {
      this.logger.info(
        { plugin: this.name, pluginId: this.id, ...data },
        message
      )
    }
  }

  /**
   * Логирование ошибки
   */
  protected error(message: string, error?: Error, data?: Record<string, any>): void {
    if (this.logger) {
      this.logger.error(
        { plugin: this.name, pluginId: this.id, error: error?.message, ...data },
        message
      )
    }
  }

  /**
   * Логирование предупреждения
   */
  protected warn(message: string, data?: Record<string, any>): void {
    if (this.logger) {
      this.logger.warn(
        { plugin: this.name, pluginId: this.id, ...data },
        message
      )
    }
  }

  /**
   * Логирование отладочной информации
   */
  protected debug(message: string, data?: Record<string, any>): void {
    if (this.logger) {
      this.logger.debug(
        { plugin: this.name, pluginId: this.id, ...data },
        message
      )
    }
  }

  /**
   * Проверка зависимостей
   */
  private async checkDependencies(context: PluginContext): Promise<void> {
    if (!this.dependencies || this.dependencies.length === 0) {
      return
    }

    for (const dep of this.dependencies) {
      if (!context.registry.hasDependency(dep)) {
        throw new Error(`Missing dependency: ${dep}`)
      }
    }
  }

  /**
   * Применение конфигурации
   */
  private applyConfig(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Валидация конфигурации
   */
  private validateConfig(): void {
    if (!this.id || typeof this.id !== 'string') {
      throw new Error('Invalid plugin id')
    }

    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Invalid plugin name')
    }

    if (!this.version || typeof this.version !== 'string') {
      throw new Error('Invalid plugin version')
    }

    if (!this.type || typeof this.type !== 'string') {
      throw new Error('Invalid plugin type')
    }
  }

  // Абстрактные методы для реализации в наследниках

  /**
   * Логика инициализации плагина
   */
  protected abstract onInit(): Promise<void> | void

  /**
   * Логика регистрации плагина
   */
  protected abstract onRegister(registry: any): Promise<void> | void

  /**
   * Логика запуска плагина
   */
  protected abstract onStart(): Promise<void> | void

  /**
   * Логика остановки плагина
   */
  protected abstract onStop(): Promise<void> | void

  /**
   * Логика очистки ресурсов
   */
  protected abstract onDestroy(): Promise<void> | void

  /**
   * Проверка здоровья плагина
   */
  protected abstract onHealthCheck(): Promise<Record<string, any>> | Record<string, any>
}

/**
 * Фабрика создания базового плагина
 */
export function createBasePlugin(config: BasePluginConfig): BasePlugin {
  const PluginClass = class extends BasePlugin {
    protected async onInit(): Promise<void> {
      // Реализация в наследнике
    }

    protected async onRegister(registry: any): Promise<void> {
      // Реализация в наследнике
    }

    protected async onStart(): Promise<void> {
      // Реализация в наследнике
    }

    protected async onStop(): Promise<void> {
      // Реализация в наследнике
    }

    protected async onDestroy(): Promise<void> {
      // Реализация в наследнике
    }

    protected async onHealthCheck(): Promise<Record<string, any>> {
      return {
        state: this.state,
        uptime: this.getUptime(),
      }
    }
  }

  return new PluginClass(config)
}

/**
 * Декоратор для создания плагина
 */
export function Plugin(config: BasePluginConfig) {
  return function <T extends { new(...args: any[]): BasePlugin }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(config)
      }
    }
  }
}

/**
 * Утилиты для базового плагина
 */
export const BasePluginUtils = {
  /**
   * Создание ID плагина из имени
   */
  createIdFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },

  /**
   * Проверка валидности версии
   */
  isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(version)
  },

  /**
   * Получение приоритета из состояния
   */
  getPriorityFromState(state: PluginState): number {
    switch (state) {
      case PluginState.ACTIVE:
        return 100
      case PluginState.LOADED:
        return 50
      case PluginState.SUSPENDED:
        return 25
      case PluginState.ERROR:
        return 0
      default:
        return 0
    }
  },
}
