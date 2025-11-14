/**
 * @fileoverview Система автообнаружения и загрузки плагинов
 * @author Vibee Core Team
 * @version 1.0.0
 */

import { readdir, stat, readFile } from 'fs/promises'
import { join, resolve, relative } from 'path'
import { glob } from 'glob'
import type { IPlugin } from './plugin.interface.js'
import type { PluginInfo, PluginDiscoveryEvent } from './types.js'

/**
 * Результат поиска плагинов
 */
export interface DiscoveryResult {
  found: PluginInfo[]
  errors: { path: string; error: string }[]
}

/**
 * Паттерны для обнаружения плагинов
 */
export interface DiscoveryPatterns {
  /** Файлы плагинов */
  pluginFiles?: string[]

  /** Директории плагинов */
  pluginDirs?: string[]

  /** Исключаемые пути */
  exclude?: string[]

  /** Максимальная глубина поиска */
  maxDepth?: number
}

/**
 * Опции обнаружения плагинов
 */
export interface DiscoveryOptions {
  patterns?: DiscoveryPatterns
  validateOnDiscovery?: boolean
  includeMetadata?: boolean
  recursive?: boolean
}

/**
 * Загрузчик плагинов по умолчанию
 */
export interface DefaultPluginLoader {
  load: (path: string) => Promise<IPlugin>
  validate: (pluginPath: string) => Promise<boolean>
  getInfo: (pluginPath: string) => Promise<Partial<IPlugin>>
}

/**
 * Базовый загрузчик плагинов
 */
class BasePluginLoader implements DefaultPluginLoader {
  /**
   * Загрузка плагина из файла
   */
  async load(path: string): Promise<IPlugin> {
    const resolvedPath = resolve(path)

    // Динамический импорт
    const module = await import(resolvedPath + '?t=' + Date.now())

    // Извлечение экспортов
    const plugin = module.default || module.plugin || module

    if (!plugin) {
      throw new Error(`No plugin exported from ${path}`)
    }

    return plugin as IPlugin
  }

  /**
   * Валидация файла плагина
   */
  async validate(pluginPath: string): Promise<boolean> {
    try {
      const plugin = await this.load(pluginPath)
      return this.isValid(plugin)
    } catch (error) {
      return false
    }
  }

  /**
   * Получение информации о плагине
   */
  async getInfo(pluginPath: string): Promise<Partial<IPlugin>> {
    try {
      const plugin = await this.load(pluginPath)
      return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        type: plugin.type,
        dependencies: plugin.dependencies,
      }
    } catch (error) {
      return {}
    }
  }

  /**
   * Проверка валидности плагина
   */
  private isValid(plugin: any): plugin is IPlugin {
    return (
      plugin &&
      typeof plugin.id === 'string' &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.type === 'string' &&
      typeof plugin.register === 'function'
    )
  }
}

/**
 * Обнаружитель плагинов
 */
export class PluginDiscoverer {
  private loader: DefaultPluginLoader
  private patterns: DiscoveryPatterns
  private logger?: (message: string) => void

  constructor(
    patterns: DiscoveryPatterns = {},
    loader: DefaultPluginLoader = new BasePluginLoader(),
    logger?: (message: string) => void
  ) {
    this.loader = loader
    this.patterns = {
      pluginFiles: patterns.pluginFiles || ['**/plugin*.ts', '**/plugin*.js'],
      pluginDirs: patterns.pluginDirs || ['**/plugins/**', '**/pluggins/**'],
      exclude: patterns.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      maxDepth: patterns.maxDepth || 5,
    }
    this.logger = logger
  }

  /**
   * Обнаружение плагинов в директории
   */
  async discover(
    searchPaths: string[],
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryResult> {
    const { validateOnDiscovery = true, includeMetadata = true, recursive = true } = options

    this.log(`Starting plugin discovery in: ${searchPaths.join(', ')}`)

    const found: PluginInfo[] = []
    const errors: { path: string; error: string }[] = []

    for (const searchPath of searchPaths) {
      const result = await this.discoverInPath(searchPath, recursive, options)
      found.push(...result.found)
      errors.push(...result.errors)
    }

    // Фильтрация дубликатов
    const unique = this.removeDuplicates(found)

    this.log(`Discovered ${unique.length} plugins with ${errors.length} errors`)

    return { found: unique, errors }
  }

  /**
   * Обнаружение плагинов в конкретной директории
   */
  private async discoverInPath(
    searchPath: string,
    recursive: boolean,
    options: DiscoveryOptions
  ): Promise<DiscoveryResult> {
    const found: PluginInfo[] = []
    const errors: { path: string; error: string }[] = []

    try {
      const stats = await stat(searchPath)

      if (stats.isDirectory()) {
        await this.scanDirectory(searchPath, found, errors, recursive, 0, options)
      } else if (stats.isFile()) {
        await this.processFile(searchPath, found, errors, options)
      }
    } catch (error) {
      errors.push({
        path: searchPath,
        error: (error as Error).message,
      })
    }

    return { found, errors }
  }

  /**
   * Сканирование директории
   */
  private async scanDirectory(
    dirPath: string,
    found: PluginInfo[],
    errors: { path: string; error: string }[],
    recursive: boolean,
    depth: number,
    options: DiscoveryOptions
  ): Promise<void> {
    if (depth > (this.patterns.maxDepth || 5)) {
      this.log(`Max depth reached: ${dirPath}`)
      return
    }

    try {
      const entries = await readdir(dirPath)

      for (const entry of entries) {
        const fullPath = join(dirPath, entry)
        const relativePath = fullPath

        // Проверка исключений
        if (this.shouldExclude(relativePath)) {
          continue
        }

        const stats = await stat(fullPath)

        if (stats.isDirectory() && recursive) {
          await this.scanDirectory(fullPath, found, errors, recursive, depth + 1, options)
        } else if (stats.isFile() && this.isPluginFile(entry)) {
          await this.processFile(fullPath, found, errors, options)
        }
      }
    } catch (error) {
      errors.push({
        path: dirPath,
        error: (error as Error).message,
      })
    }
  }

  /**
   * Обработка файла плагина
   */
  private async processFile(
    filePath: string,
    found: PluginInfo[],
    errors: { path: string; error: string }[],
    options: DiscoveryOptions
  ): Promise<void> {
    try {
      const pluginInfo = await this.loader.getInfo(filePath)

      if (!pluginInfo.id) {
        return
      }

      const info: PluginInfo = {
        id: pluginInfo.id,
        name: pluginInfo.name || 'Unknown',
        version: pluginInfo.version || '0.0.0',
        description: pluginInfo.description || '',
        author: pluginInfo.author || 'Unknown',
        type: pluginInfo.type || 'unknown',
        dependencies: pluginInfo.dependencies || [],
        state: 'unloaded' as any,
      }

      found.push(info)
      this.log(`Found plugin: ${info.name} (${info.id})`)
    } catch (error) {
      errors.push({
        path: filePath,
        error: (error as Error).message,
      })
    }
  }

  /**
   * Проверка, является ли файл файлом плагина
   */
  private isPluginFile(filename: string): boolean {
    return filename.match(/^plugin\.(ts|js)$/) !== null
  }

  /**
   * Проверка, должен ли путь быть исключен
   */
  private shouldExclude(path: string): boolean {
    for (const pattern of this.patterns.exclude || []) {
      if (this.matchPattern(path, pattern)) {
        return true
      }
    }
    return false
  }

  /**
   * Проверка соответствия паттерну
   */
  private matchPattern(path: string, pattern: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/')
    const normalizedPattern = pattern.replace(/\\/g, '/')

    if (normalizedPattern.includes('*')) {
      const regex = new RegExp(
        '^' + normalizedPattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      )
      return regex.test(normalizedPath)
    }

    return normalizedPath.includes(normalizedPattern)
  }

  /**
   * Удаление дубликатов
   */
  private removeDuplicates(plugins: PluginInfo[]): PluginInfo[] {
    const seen = new Set<string>()
    return plugins.filter(plugin => {
      if (seen.has(plugin.id)) {
        return false
      }
      seen.add(plugin.id)
      return true
    })
  }

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.logger) {
      this.logger(`[PluginDiscovery] ${message}`)
    }
  }

  /**
   * Создание обнаружителя с паттернами по умолчанию
   */
  static createDefault(
    logger?: (message: string) => void
  ): PluginDiscoverer {
    return new PluginDiscoverer({}, new BasePluginLoader(), logger)
  }

  /**
   * Быстрое обнаружение с предварительной фильтрацией
   */
  async quickDiscover(
    searchPaths: string[],
    pluginType?: string
  ): Promise<string[]> {
    const plugins: string[] = []

    for (const searchPath of searchPaths) {
      try {
        const matches = await glob('**/plugin.{ts,js}', {
          cwd: searchPath,
          absolute: true,
          ignore: this.patterns.exclude,
        })

        for (const match of matches) {
          const info = await this.loader.getInfo(match)
          if (!pluginType || info.type === pluginType) {
            plugins.push(match)
          }
        }
      } catch (error) {
        this.log(`Error in quickDiscover for ${searchPath}: ${(error as Error).message}`)
      }
    }

    return plugins
  }

  /**
   * Обнаружение плагинов с указанным тегом
   */
  async discoverByTag(
    searchPaths: string[],
    tag: string
  ): Promise<PluginInfo[]> {
    const result = await this.discover(searchPaths)
    return result.found.filter(plugin => {
      return plugin.description?.toLowerCase().includes(tag.toLowerCase()) ||
             plugin.name?.toLowerCase().includes(tag.toLowerCase())
    })
  }

  /**
   * Проверка совместимости версий
   */
  async checkCompatibility(
    pluginPath: string,
    supportedVersions: string[]
  ): Promise<boolean> {
    try {
      const info = await this.loader.getInfo(pluginPath)
      const pluginVersion = info.version

      if (!pluginVersion) {
        return false
      }

      return supportedVersions.some(supported => {
        return this.isVersionCompatible(pluginVersion, supported)
      })
    } catch (error) {
      return false
    }
  }

  /**
   * Проверка совместимости версий
   */
  private isVersionCompatible(current: string, required: string): boolean {
    const [cMajor, cMinor] = current.split('.').map(Number)
    const [rMajor, rMinor] = required.split('.').map(Number)

    if (cMajor !== rMajor) return false
    return cMinor >= rMinor
  }
}

/**
 * Создание обнаружителя плагинов
 */
export function createDiscoverer(
  patterns: DiscoveryPatterns,
  logger?: (message: string) => void
): PluginDiscoverer {
  return new PluginDiscoverer(patterns, new BasePluginLoader(), logger)
}

/**
 * Обнаружение плагинов в проекте Vibee
 */
export async function discoverVibeePlugins(
  projectRoot: string,
  logger?: (message: string) => void
): Promise<DiscoveryResult> {
  const discoverer = PluginDiscoverer.createDefault(logger)

  const searchPaths = [
    join(projectRoot, 'src/plugins'),
    join(projectRoot, 'plugins'),
    join(projectRoot, 'src'),
  ].filter(async path => {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  })

  return discoverer.discover(await Promise.all(searchPaths))
}
