/**
 * @fileoverview Основные интерфейсы для плагинной системы Vibee
 * @author Vibee Core Team
 * @version 1.0.0
 */

import type { Telegraf } from 'telegraf'
import type { IAgentRuntime } from '@elizaos/core'
import type { Logger } from '@elizaos/core'
import type { PluginType, PluginState, PluginHealthStatus } from './types.js'

/**
 * Основной интерфейс плагина
 */
export interface IPlugin {
  /** Уникальный идентификатор плагина */
  readonly id: string

  /** Имя плагина */
  readonly name: string

  /** Версия плагина (semver) */
  readonly version: string

  /** Описание плагина */
  readonly description: string

  /** Автор плагина */
  readonly author: string

  /** Тип плагина */
  readonly type: PluginType

  /** Зависимости от других плагинов */
  readonly dependencies?: string[]

  /** Схема конфигурации (JSON Schema) */
  readonly configSchema?: Record<string, any>

  /** Текущее состояние плагина */
  state?: PluginState

  /** Инициализация плагина */
  init?: (context: PluginContext) => Promise<void>

  /** Регистрация плагина в системе */
  register: (registry: PluginRegistry) => void | Promise<void>

  /** Проверка здоровья плагина */
  healthCheck?: () => Promise<PluginHealthStatus>

  /** Запуск плагина */
  start?: (context: PluginContext) => Promise<void>

  /** Остановка плагина */
  stop?: (context: PluginContext) => Promise<void>

  /** Очистка ресурсов */
  destroy?: () => Promise<void> | void
}

/**
 * Контекст выполнения плагина
 */
export interface PluginContext {
  /** Рантайм ElizaOS */
  runtime: IAgentRuntime

  /** Инстанс Telegram бота */
  bot: Telegraf<any>

  /** Реестр плагинов */
  registry: PluginRegistry

  /** Логгер */
  logger: Logger

  /** Конфигурация */
  config: Record<string, any>

  /** Глобальные сервисы */
  services?: Record<string, any>
}

/**
 * Регистратор плагинов
 */
export interface PluginRegistry {
  /** Зарегистрировать команду */
  registerCommand: (command: PluginCommand) => void

  /** Зарегистрировать middleware */
  registerMiddleware: (middleware: PluginMiddleware) => void

  /** Зарегистрировать обработчик событий */
  registerEventHandler: (handler: EventHandler) => void

  /** Зарегистрировать сцену */
  registerScene: (scene: PluginScene) => void

  /** Зарегистрировать action */
  registerAction: (action: PluginAction) => void

  /** Зарегистрировать провайдер */
  registerProvider: (provider: PluginProvider) => void

  /** Получить зависимость */
  getDependency: <T = any>(name: string) => T | undefined

  /** Проверить наличие зависимости */
  hasDependency: (name: string) => boolean

  /** Получить конфигурацию */
  getConfig: (key?: string) => any

  /** Создать дочерний реестр */
  createChild: (namespace: string) => PluginRegistry
}

/**
 * Команда плагина
 */
export interface PluginCommand {
  name: string
  description: string
  usage?: string
  handler: (ctx: any, ...args: string[]) => Promise<void> | void
  aliases?: string[]
  adminOnly?: boolean
  hidden?: boolean
}

/**
 * Middleware плагина
 */
export interface PluginMiddleware {
  name?: string
  handler: (ctx: any, next: () => Promise<void>) => Promise<void>
  priority?: number
}

/**
 * Обработчик событий
 */
export interface EventHandler {
  event: string
  handler: (data: any, context?: PluginContext) => Promise<void> | void
  priority?: number
}

/**
 * Сцена плагина
 */
export interface PluginScene {
  id: string
  enterHandler: (ctx: any) => Promise<void> | void
  leaveHandler?: (ctx: any) => Promise<void> | void
  commandHandlers?: Record<string, (ctx: any) => Promise<void> | void>
  actionHandlers?: Record<string, (ctx: any) => Promise<void> | void>
}

/**
 * Action плагина
 */
export interface PluginAction {
  name: string
  validate: (runtime: IAgentRuntime, message: string) => Promise<boolean>
  handler: (runtime: IAgentRuntime, message: string, state?: any) => Promise<any>
}

/**
 * Провайдер плагина
 */
export interface PluginProvider {
  name: string
  type: string
  init: (config: Record<string, any>) => Promise<void>
  get: (key: string) => any
  set: (key: string, value: any) => void
  destroy?: () => Promise<void> | void
}

/**
 * Интерфейс для наблюдателей плагинной системы
 */
export interface PluginObserver {
  onPluginRegistered?: (plugin: IPlugin) => void
  onPluginLoaded?: (plugin: IPlugin) => void
  onPluginInitialized?: (plugin: IPlugin) => void
  onPluginStarted?: (plugin: IPlugin) => void
  onPluginStopped?: (plugin: IPlugin) => void
  onPluginError?: (plugin: IPlugin, error: Error) => void
  onPluginDestroyed?: (plugin: IPlugin) => void
}

/**
 * Фабрика создания плагинов
 */
export interface PluginFactory<T extends IPlugin = IPlugin> {
  create: (config?: Record<string, any>) => T
  validate?: (plugin: T) => boolean
  name: string
  version: string
}

/**
 * Загрузчик плагинов
 */
export interface PluginLoader {
  load: (path: string) => Promise<IPlugin>
  validate: (pluginPath: string) => Promise<boolean>
  getInfo: (pluginPath: string) => Promise<Partial<IPlugin>>
}

/**
 * Менеджер плагинов
 */
export interface IPluginManager {
  /** Текущее состояние */
  readonly state: PluginState

  /** Список зарегистрированных плагинов */
  readonly plugins: Map<string, IPlugin>

  /** Зарегистрировать плагин */
  register: (plugin: IPlugin, options?: any) => Promise<void>

  /** Загрузить плагин из файла */
  load: (path: string) => Promise<IPlugin>

  /** Инициализировать плагин */
  init: (pluginId: string) => Promise<void>

  /** Запустить плагин */
  start: (pluginId: string) => Promise<void>

  /** Остановить плагин */
  stop: (pluginId: string) => Promise<void>

  /** Выгрузить плагин */
  unload: (pluginId: string) => Promise<void>

  /** Получить плагин по ID */
  get: (pluginId: string) => IPlugin | undefined

  /** Проверить здоровье плагина */
  checkHealth: (pluginId: string) => Promise<PluginHealthStatus>

  /** Получить всех плагинов определенного типа */
  getByType: (type: PluginType) => IPlugin[]

  /** Добавить наблюдателя */
  addObserver: (observer: PluginObserver) => void

  /** Удалить наблюдателя */
  removeObserver: (observer: PluginObserver) => void

  /** Получить реестр */
  getRegistry: () => PluginRegistry
}

/**
 * Стратегия загрузки плагинов
 */
export interface PluginLoadingStrategy {
  /** Последовательная загрузка */
  sequential?: boolean

  /** Максимальное количество одновременных загрузок */
  maxConcurrent?: number

  /** Таймаут загрузки (мс) */
  timeout?: number

  /** Количество попыток при ошибке */
  retries?: number
}

/**
 * Стратегия разрешения зависимостей
 */
export interface DependencyResolutionStrategy {
  /** Алгоритм разрешения: 'depth-first' | 'breadth-first' */
  algorithm: 'depth-first' | 'breadth-first'

  /** Игнорировать отсутствующие зависимости */
  ignoreMissing?: boolean

  /** Максимальная глубина зависимостей */
  maxDepth?: number
}
