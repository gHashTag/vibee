/**
 * @fileoverview Управление жизненным циклом плагинов
 * @author Vibee Core Team
 * @version 1.0.0
 */

import type { IPlugin } from './plugin.interface.js'
import type {
  PluginState,
  PluginLifecycleEvent,
  PluginLifecycleHooks,
  PluginHealthStatus,
} from './types.js'

/**
 * Конфигурация жизненного цикла
 */
export interface LifecycleConfig {
  /** Таймаут инициализации (мс) */
  initTimeout?: number

  /** Таймаут запуска (мс) */
  startTimeout?: number

  /** Таймаут остановки (мс) */
  stopTimeout?: number

  /** Таймаут выгрузки (мс) */
  unloadTimeout?: number

  /** Периодичность проверки здоровья (мс) */
  healthCheckInterval?: number

  /** Количество попыток при ошибке */
  maxRetries?: number

  /** Задержка между попытками (мс) */
  retryDelay?: number

  /** Автоматическая проверка здоровья */
  autoHealthCheck?: boolean

  /** Останавливать зависимые плагины */
  stopDependents?: boolean
}

/**
 * Результат выполнения операции жизненного цикла
 */
export interface LifecycleOperationResult {
  success: boolean
  state: PluginState
  duration: number
  error?: string
  details?: Record<string, any>
}

/**
 * Таймер операции
 */
class OperationTimer {
  private startTime: number = 0
  private timeoutId?: NodeJS.Timeout

  start(timeout?: number): void {
    this.startTime = Date.now()

    if (timeout) {
      this.timeoutId = setTimeout(() => {
        throw new Error(`Operation timed out after ${timeout}ms`)
      }, timeout)
    }
  }

  stop(): number {
    const duration = Date.now() - this.startTime

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }

    return duration
  }

  getDuration(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Менеджер жизненного цикла плагинов
 */
export class PluginLifecycleManager {
  private config: Required<LifecycleConfig>
  private hooks: Map<string, PluginLifecycleHooks>
  private healthChecks: Map<string, NodeJS.Timeout>
  private retryCounts: Map<string, number>

  constructor(config: LifecycleConfig = {}) {
    this.config = {
      initTimeout: config.initTimeout || 30000,
      startTimeout: config.startTimeout || 10000,
      stopTimeout: config.stopTimeout || 10000,
      unloadTimeout: config.unloadTimeout || 5000,
      healthCheckInterval: config.healthCheckInterval || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      autoHealthCheck: config.autoHealthCheck || false,
      stopDependents: config.stopDependents || true,
    }

    this.hooks = new Map()
    this.healthChecks = new Map()
    this.retryCounts = new Map()
  }

  /**
   * Регистрация хуков для плагина
   */
  registerHooks(pluginId: string, hooks: PluginLifecycleHooks): void {
    this.hooks.set(pluginId, hooks)
  }

  /**
   * Удаление хуков плагина
   */
  unregisterHooks(pluginId: string): void {
    this.hooks.delete(pluginId)
  }

  /**
   * Инициализация плагина
   */
  async init(plugin: IPlugin): Promise<LifecycleOperationResult> {
    const timer = new OperationTimer()
    timer.start(this.config.initTimeout)

    try {
      this.validateState(plugin, [PluginState.UNLOADED, PluginState.ERROR])

      plugin.state = PluginState.INITIALIZING

      // Выполнение хука
      await this.executeHook('onLoad', plugin.id)

      // Инициализация плагина
      if (plugin.init) {
        await plugin.init
      }

      await this.executeHook('onInit', plugin.id)

      plugin.state = PluginState.LOADED
      const duration = timer.stop()

      return {
        success: true,
        state: plugin.state,
        duration,
      }
    } catch (error) {
      plugin.state = PluginState.ERROR
      const duration = timer.stop()

      await this.executeHook('onError', plugin.id, error as Error)

      return {
        success: false,
        state: plugin.state,
        duration,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Запуск плагина
   */
  async start(plugin: IPlugin): Promise<LifecycleOperationResult> {
    const timer = new OperationTimer()
    timer.start(this.config.startTimeout)

    try {
      this.validateState(plugin, [PluginState.LOADED, PluginState.SUSPENDED])

      if (plugin.state === PluginState.SUSPENDED) {
        plugin.state = PluginState.LOADED
      } else {
        plugin.state = PluginState.LOADING
      }

      // Запуск плагина
      if (plugin.start) {
        await plugin.start
      }

      await this.executeHook('onStart', plugin.id)

      plugin.state = PluginState.ACTIVE
      const duration = timer.stop()

      // Запуск периодической проверки здоровья
      if (this.config.autoHealthCheck) {
        this.startHealthCheck(plugin.id)
      }

      return {
        success: true,
        state: plugin.state,
        duration,
      }
    } catch (error) {
      plugin.state = PluginState.ERROR
      const duration = timer.stop()

      await this.executeHook('onError', plugin.id, error as Error)

      return {
        success: false,
        state: plugin.state,
        duration,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Остановка плагина
   */
  async stop(plugin: IPlugin): Promise<LifecycleOperationResult> {
    const timer = new OperationTimer()
    timer.start(this.config.stopTimeout)

    try {
      this.validateState(plugin, [PluginState.ACTIVE, PluginState.LOADED])

      plugin.state = PluginState.LOADING

      // Остановка периодической проверки здоровья
      this.stopHealthCheck(plugin.id)

      // Остановка плагина
      if (plugin.stop) {
        await plugin.stop
      }

      await this.executeHook('onStop', plugin.id)

      plugin.state = PluginState.SUSPENDED
      const duration = timer.stop()

      return {
        success: true,
        state: plugin.state,
        duration,
      }
    } catch (error) {
      plugin.state = PluginState.ERROR
      const duration = timer.stop()

      await this.executeHook('onError', plugin.id, error as Error)

      return {
        success: false,
        state: plugin.state,
        duration,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Выгрузка плагина
   */
  async unload(plugin: IPlugin): Promise<LifecycleOperationResult> {
    const timer = new OperationTimer()
    timer.start(this.config.unloadTimeout)

    try {
      this.validateState(plugin, [
        PluginState.UNLOADED,
        PluginState.ERROR,
        PluginState.SUSPENDED,
        PluginState.LOADED,
      ])

      // Остановка плагина если активен
      if (plugin.state === PluginState.ACTIVE) {
        await this.stop(plugin)
      }

      // Очистка ресурсов
      if (plugin.destroy) {
        await plugin.destroy
      }

      // Удаление хуков
      this.unregisterHooks(plugin.id)

      plugin.state = PluginState.UNLOADED
      const duration = timer.stop()

      return {
        success: true,
        state: plugin.state,
        duration,
      }
    } catch (error) {
      plugin.state = PluginState.ERROR
      const duration = timer.stop()

      await this.executeHook('onError', plugin.id, error as Error)

      return {
        success: false,
        state: plugin.state,
        duration,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Перезапуск плагина
   */
  async restart(plugin: IPlugin): Promise<LifecycleOperationResult> {
    const stopResult = await this.stop(plugin)

    if (!stopResult.success) {
      return stopResult
    }

    return await this.start(plugin)
  }

  /**
   * Проверка здоровья плагина
   */
  async checkHealth(plugin: IPlugin): Promise<PluginHealthStatus> {
    try {
      if (plugin.healthCheck) {
        const result = await plugin.healthCheck()
        return result
      }

      // Базовая проверка здоровья
      const isHealthy = plugin.state === PluginState.ACTIVE

      return {
        healthy: isHealthy,
        message: isHealthy ? 'Plugin is healthy' : `Plugin state: ${plugin.state}`,
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
   * Принудительная проверка здоровья с автоперезапуском
   */
  async forceHealthCheckAndRestart(
    plugin: IPlugin,
    restartOnUnhealthy = true
  ): Promise<PluginHealthStatus> {
    const health = await this.checkHealth(plugin)

    if (!health.healthy && restartOnUnhealthy) {
      await this.restart(plugin)
    }

    return health
  }

  /**
   * Запуск периодической проверки здоровья
   */
  private startHealthCheck(pluginId: string): void {
    if (this.healthChecks.has(pluginId)) {
      clearInterval(this.healthChecks.get(pluginId)!)
    }

    const intervalId = setInterval(async () => {
      // Проверка будет выполнена внешним кодом
    }, this.config.healthCheckInterval)

    this.healthChecks.set(pluginId, intervalId)
  }

  /**
   * Остановка периодической проверки здоровья
   */
  private stopHealthCheck(pluginId: string): void {
    const intervalId = this.healthChecks.get(pluginId)
    if (intervalId) {
      clearInterval(intervalId)
      this.healthChecks.delete(pluginId)
    }
  }

  /**
   * Остановка всех проверок здоровья
   */
  stopAllHealthChecks(): void {
    for (const intervalId of this.healthChecks.values()) {
      clearInterval(intervalId)
    }
    this.healthChecks.clear()
  }

  /**
   * Выполнение операции с повторными попытками
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    pluginId: string
  ): Promise<T> {
    let lastError: Error | null = null
    const retryCount = this.retryCounts.get(pluginId) || 0

    for (let i = retryCount; i < this.config.maxRetries; i++) {
      try {
        const result = await operation()
        this.retryCounts.delete(pluginId)
        return result
      } catch (error) {
        lastError = error as Error

        if (i < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * (i + 1))
        }
      }
    }

    this.retryCounts.set(pluginId, retryCount + 1)
    throw lastError
  }

  /**
   * Сброс счетчика попыток
   */
  resetRetryCount(pluginId: string): void {
    this.retryCounts.delete(pluginId)
  }

  /**
   * Валидация состояния плагина
   */
  private validateState(plugin: IPlugin, allowedStates: PluginState[]): void {
    const currentState = plugin.state || PluginState.UNLOADED

    if (!allowedStates.includes(currentState)) {
      throw new Error(
        `Invalid state transition. Current: ${currentState}, Allowed: ${allowedStates.join(', ')}`
      )
    }
  }

  /**
   * Выполнение хука
   */
  private async executeHook(
    hookName: keyof PluginLifecycleHooks,
    pluginId: string,
    ...args: any[]
  ): Promise<void> {
    const hooks = this.hooks.get(pluginId)
    if (!hooks || !hooks[hookName]) {
      return
    }

    try {
      const hook = hooks[hookName] as any
      await hook(...args)
    } catch (error) {
      console.error(`Error executing hook ${hookName} for plugin ${pluginId}:`, error)
    }
  }

  /**
   * Задержка
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Получение статистики
   */
  getStats(): Record<string, any> {
    return {
      activeHealthChecks: this.healthChecks.size,
      retryCounts: Object.fromEntries(this.retryCounts),
      config: this.config,
    }
  }

  /**
   * Уничтожение менеджера
   */
  destroy(): void {
    this.stopAllHealthChecks()
    this.hooks.clear()
    this.retryCounts.clear()
  }
}

/**
 * Создание менеджера жизненного цикла с настройками по умолчанию
 */
export function createLifecycleManager(config: LifecycleConfig = {}): PluginLifecycleManager {
  return new PluginLifecycleManager(config)
}

/**
 * Утилиты для работы с жизненным циклом
 */
export const LifecycleUtils = {
  /**
   * Создание события жизненного цикла
   */
  createEvent(
    pluginId: string,
    state: PluginState,
    details?: Record<string, any>
  ): PluginLifecycleEvent {
    return {
      pluginId,
      state,
      timestamp: new Date(),
      details,
    }
  },

  /**
   * Проверка, может ли плагин быть запущен
   */
  canStart(plugin: IPlugin): boolean {
    return plugin.state === PluginState.LOADED || plugin.state === PluginState.SUSPENDED
  },

  /**
   * Проверка, может ли плагин быть остановлен
   */
  canStop(plugin: IPlugin): boolean {
    return plugin.state === PluginState.ACTIVE || plugin.state === PluginState.LOADED
  },

  /**
   * Проверка, может ли плагин быть выгружен
   */
  canUnload(plugin: IPlugin): boolean {
    return plugin.state !== PluginState.ACTIVE
  },

  /**
   * Получение времени работы плагина
   */
  getUptime(plugin: IPlugin): number {
    if (plugin.state !== PluginState.ACTIVE) {
      return 0
    }

    // В реальной реализации здесь должна быть дата старта
    return Date.now()
  },
}
