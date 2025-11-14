# Ядро плагинной системы Vibee

Фундаментальная архитектура для модульной плагинной системы Telegram бота Vibee.

## 🚀 Обзор

Этот модуль предоставляет полноценную плагинную архитектуру с автоматическим обнаружением, управлением жизненным циклом и централизованным реестром плагинов.

## 📁 Структура модуля

```
src/plugins/core/
├── plugin.interface.ts      # Основные интерфейсы и типы
├── types.ts                 # Вспомогательные типы и утилиты
├── plugin-registry.ts       # Реестр плагинов
├── plugin-manager.ts        # Менеджер плагинов
├── plugin-discovery.ts      # Автообнаружение плагинов
├── plugin-lifecycle.ts      # Управление жизненным циклом
├── base-plugin.ts           # Базовый класс плагина
├── index.ts                 # Главный экспорт
└── README.md                # Эта документация
```

## ✨ Возможности

### 🎯 Основные функции

- ✅ **Автоматическое обнаружение** - плагины находятся автоматически
- ✅ **Управление жизненным циклом** - init, start, stop, unload
- ✅ **Централизованный реестр** - все плагины в одном месте
- ✅ **Система зависимостей** - автоматическое разрешение зависимостей
- ✅ **Проверка здоровья** - мониторинг состояния плагинов
- ✅ **События и уведомления** - система наблюдателей
- ✅ **Таймауты и повторы** - надежность работы
- ✅ **Типизация TypeScript** - строгая типизация everywhere

### 🏗️ Архитектурные принципы

- **Модульность** - каждый плагин независим
- **Расширяемость** - легко добавлять новые плагины
- **Надежность** - обработка ошибок и восстановление
- **Производительность** - асинхронная загрузка и кэширование
- **Наблюдаемость** - логирование и метрики

## 🎮 Типы плагинов

```typescript
enum PluginType {
  PROVIDER = 'provider',      // Провайдер данных/сервисов
  SCENE = 'scene',            // Telegram сцена
  COMMAND = 'command',        // Команда бота
  MIDDLEWARE = 'middleware',  // Промежуточное ПО
  ACTION = 'action',          // Действие в ElizaOS
  EVENT = 'event',            // Обработчик событий
  TEMPLATE = 'template',      // Система шаблонов
}
```

## 🚀 Быстрый старт

### Создание простого плагина

```typescript
import { BasePlugin, type BasePluginConfig } from './plugins/core'

class MyPlugin extends BasePlugin {
  protected async onInit(): Promise<void> {
    this.log('Initializing MyPlugin')
    // Логика инициализации
  }

  protected async onRegister(registry: any): Promise<void> {
    registry.registerCommand({
      name: 'hello',
      description: 'Say hello',
      handler: async (ctx) => {
        await ctx.reply('Hello from Vibee!')
      }
    })
  }

  protected async onStart(): Promise<void> {
    this.log('MyPlugin started')
  }

  protected async onStop(): Promise<void> {
    this.log('MyPlugin stopped')
  }

  protected async onDestroy(): Promise<void> {
    this.log('MyPlugin destroyed')
  }

  protected async onHealthCheck(): Promise<Record<string, any>> {
    return {
      status: 'ok',
      uptime: this.getUptime()
    }
  }
}

// Регистрация плагина
export default new MyPlugin({
  id: 'my-awesome-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  description: 'A demonstration plugin',
  author: 'Vibee Team',
  type: 'command' as any,
  enabled: true
})
```

### Использование фабрики

```typescript
import { PluginFactories } from './plugins/core'

const plugin = PluginFactories.createCommandPlugin({
  id: 'greet-plugin',
  name: 'Greet Plugin',
  version: '1.0.0',
  description: 'Greeting plugin',
  author: 'Vibee Team',
  type: 'command' as any,
  command: 'greet',
  handler: async (ctx, name) => {
    const target = name || 'World'
    await ctx.reply(`Hello, ${target}!`)
  }
})
```

### Создание системы плагинов

```typescript
import { createPluginSystem } from './plugins/core'

const pluginSystem = createPluginSystem({
  pluginPaths: ['./src/plugins'],
  autoDiscovery: true,
  lifecycleConfig: {
    initTimeout: 30000,
    startTimeout: 10000,
    autoHealthCheck: true
  }
})

// Инициализация
await pluginSystem.init(runtime, bot, logger, globalConfig)

// Запуск всех плагинов
await pluginSystem.startAll()
```

## 📋 API Reference

### IPlugin (Интерфейс плагина)

```typescript
interface IPlugin {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly type: PluginType
  readonly dependencies?: string[]
  state?: PluginState

  init?: (context: PluginContext) => Promise<void>
  register: (registry: PluginRegistry) => void | Promise<void>
  start?: (context: PluginContext) => Promise<void>
  stop?: (context: PluginContext) => Promise<void>
  destroy?: () => Promise<void> | void
  healthCheck?: () => Promise<PluginHealthStatus>
}
```

### PluginContext (Контекст выполнения)

```typescript
interface PluginContext {
  runtime: IAgentRuntime
  bot: Telegraf<any>
  registry: PluginRegistry
  logger: Logger
  config: Record<string, any>
  services?: Record<string, any>
}
```

### PluginRegistry (Реестр плагинов)

```typescript
interface PluginRegistry {
  registerCommand: (command: PluginCommand) => void
  registerMiddleware: (middleware: PluginMiddleware) => void
  registerEventHandler: (handler: EventHandler) => void
  registerScene: (scene: PluginScene) => void
  registerAction: (action: PluginAction) => void
  registerProvider: (provider: PluginProvider) => void
  getDependency: <T = any>(name: string) => T | undefined
  hasDependency: (name: string) => boolean
  createChild: (namespace: string) => PluginRegistry
}
```

### IPluginManager (Менеджер плагинов)

```typescript
interface IPluginManager {
  readonly state: PluginState
  readonly plugins: Map<string, IPlugin>

  register: (plugin: IPlugin, options?: any) => Promise<void>
  load: (path: string) => Promise<IPlugin>
  init: (pluginId: string) => Promise<void>
  start: (pluginId: string) => Promise<void>
  stop: (pluginId: string) => Promise<void>
  unload: (pluginId: string) => Promise<void>
  get: (pluginId: string) => IPlugin | undefined
  getByType: (type: PluginType) => IPlugin[]
  checkHealth: (pluginId: string) => Promise<PluginHealthStatus>
  startAll: () => Promise<void>
  stopAll: () => Promise<void>
}
```

## 🔄 Жизненный цикл плагина

```
UNLOADED → LOADING → LOADED → INITIALIZING → LOADED → ACTIVE
                ↓           ↓                    ↓
              ERROR    SUSPENDED ← STOP ← UNLOADING
```

### Состояния:

- **UNLOADED** - плагин не загружен
- **LOADING** - плагин загружается
- **LOADED** - плагин загружен
- **INITIALIZING** - плагин инициализируется
- **ACTIVE** - плагин активен и работает
- **SUSPENDED** - плагин приостановлен
- **ERROR** - ошибка в плагине
- **UNLOADING** - плагин выгружается

### Автоматическая проверка здоровья

```typescript
const lifecycleManager = new PluginLifecycleManager({
  autoHealthCheck: true,
  healthCheckInterval: 60000, // каждые 60 секунд
  maxRetries: 3
})

// Принудительная проверка с автоперезапуском
const health = await lifecycleManager.forceHealthCheckAndRestart(
  plugin,
  true // перезапускать если нездоров
)
```

## 🔍 Обнаружение плагинов

```typescript
const discoverer = new PluginDiscoverer({
  pluginFiles: ['**/plugin*.ts', '**/plugin*.js'],
  pluginDirs: ['**/plugins/**'],
  exclude: ['**/node_modules/**', '**/tests/**']
})

const { found, errors } = await discoverer.discover(['./src/plugins'])

console.log(`Найдено ${found.length} плагинов`)
console.log(`Ошибок: ${errors.length}`)
```

## 🔗 Система зависимостей

```typescript
// В конфигурации плагина
const plugin = new MyPlugin({
  id: 'dependent-plugin',
  name: 'Dependent Plugin',
  type: 'command' as any,
  dependencies: ['provider-plugin', 'database-plugin']
})

// Автоматическая проверка
await manager.register(plugin)

// Зависимости проверяются перед инициализацией
await manager.init('dependent-plugin') // → ошибка если зависимости нет
```

## 📊 Мониторинг и метрики

```typescript
// Получение статистики
const stats = manager.getStats()
console.log(stats)
/*
{
  total: 15,
  byState: {
    active: 12,
    loaded: 2,
    error: 1
  },
  byType: {
    command: 5,
    middleware: 4,
    provider: 3,
    scene: 2,
    action: 1
  }
}
*/

// Метрики конкретного плагина
const metrics = plugin.getMetrics()
console.log(metrics)
/*
{
  id: 'my-plugin',
  name: 'My Plugin',
  state: 'active',
  uptime: 123456,
  lastActivity: 2025-11-13T20:30:00.000Z
}
*/
```

## 🛡️ Обработка ошибок

```typescript
// Добавление наблюдателя
manager.addObserver({
  onPluginError: (plugin, error) => {
    console.error(`Ошибка в плагине ${plugin.name}:`, error)
    // Отправка уведомления, логирование, etc.
  },

  onPluginStarted: (plugin) => {
    console.log(`Плагин ${plugin.name} запущен`)
  },

  onPluginStopped: (plugin) => {
    console.log(`Плагин ${plugin.name} остановлен`)
  }
})

// Повторные попытки при ошибках
await lifecycleManager.withRetry(
  () => plugin.start(),
  plugin.id
)
```

## 📝 Лучшие практики

### 1. Всегда используйте базовый класс

```typescript
// ✅ Хорошо
class MyPlugin extends BasePlugin {
  protected async onInit(): Promise<void> {
    // Реализация
  }
  // ...
}

// ❌ Плохо
class MyPlugin implements IPlugin {
  // Нужно реализовать все методы вручную
}
```

### 2. Правильно обрабатывайте ошибки

```typescript
protected async onStart(): Promise<void> {
  try {
    await this.initializeService()
  } catch (error) {
    this.error('Failed to initialize service', error)
    throw error // Перебрасываем для корректного изменения состояния
  }
}
```

### 3. Логируйте важные события

```typescript
protected async onInit(): Promise<void> {
  this.log('Initializing database connection', { host: 'localhost' })

  this.debug('Debug info', { debugData: true })

  this.warn('This is a warning message')

  this.error('This is an error message', error)
}
```

### 4. Проверяйте зависимости

```typescript
protected async onInit(): Promise<void> {
  const dbPlugin = this.context?.registry.getDependency('database-plugin')
  if (!dbPlugin) {
    throw new Error('Database plugin is required')
  }
}
```

### 5. Реализуйте проверку здоровья

```typescript
protected async onHealthCheck(): Promise<Record<string, any>> {
  return {
    status: 'healthy',
    connections: this.connectionCount,
    uptime: this.getUptime(),
    lastError: this.lastError
  }
}
```

### 6. Очищайте ресурсы

```typescript
protected async onDestroy(): Promise<void> {
  await this.database?.disconnect()
  await this.httpServer?.close()
  clearInterval(this.intervalId)
}
```

## 🧪 Тестирование

```typescript
import { BasePlugin } from './plugins/core'

// Создание мок-плагина для тестов
class TestPlugin extends BasePlugin {
  protected async onInit(): Promise<void> {}
  protected async onRegister(registry: any): Promise<void> {}
  protected async onStart(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDestroy(): Promise<void> {}
  protected async onHealthCheck(): Promise<Record<string, any>> {
    return { status: 'ok' }
  }
}

// Тест
test('plugin health check', async () => {
  const plugin = new TestPlugin({
    id: 'test',
    name: 'Test',
    version: '1.0.0',
    description: 'Test',
    author: 'Test',
    type: 'action' as any
  })

  const health = await plugin.healthCheck()
  expect(health.healthy).toBe(true)
})
```

## 🔧 Конфигурация

### Настройка менеджера плагинов

```typescript
const manager = new PluginManager()

await manager.init(runtime, bot, logger, {
  database: { url: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  plugins: {
    autoDiscovery: true,
    defaultTimeout: 30000
  }
})
```

### Настройка жизненного цикла

```typescript
const lifecycleManager = new PluginLifecycleManager({
  initTimeout: 30000,      // 30 сек на инициализацию
  startTimeout: 10000,     // 10 сек на запуск
  stopTimeout: 5000,       // 5 сек на остановку
  healthCheckInterval: 60000, // проверка каждую минуту
  maxRetries: 3,           // 3 попытки при ошибке
  retryDelay: 1000,        // задержка 1 сек между попытками
  autoHealthCheck: true
})
```

## 🎯 Примеры плагинов

### Плагин-команда

```typescript
export default new BasePlugin({
  id: 'echo-command',
  name: 'Echo Command',
  version: '1.0.0',
  description: 'Echoes user input',
  author: 'Vibee Team',
  type: 'command' as any
})({
  async onRegister(registry) {
    registry.registerCommand({
      name: 'echo',
      description: 'Echo your message',
      handler: async (ctx, ...args) => {
        const message = args.join(' ')
        await ctx.reply(`You said: ${message}`)
      }
    })
  }
})
```

### Плагин-middleware

```typescript
export default new BasePlugin({
  id: 'auth-middleware',
  name: 'Auth Middleware',
  version: '1.0.0',
  description: 'Authentication middleware',
  author: 'Vibee Team',
  type: 'middleware' as any
})({
  async onRegister(registry) {
    registry.registerMiddleware({
      name: 'auth',
      handler: async (ctx, next) => {
        if (!ctx.from) {
          await ctx.reply('Please start the bot first')
          return
        }

        // Проверяем авторизацию
        const isAuthorized = await checkUserAuthorization(ctx.from.id)
        if (!isAuthorized) {
          await ctx.reply('Access denied')
          return
        }

        await next()
      }
    })
  }
})
```

### Плагин-провайдер

```typescript
export default new BasePlugin({
  id: 'database-provider',
  name: 'Database Provider',
  version: '1.0.0',
  description: 'Database service provider',
  author: 'Vibee Team',
  type: 'provider' as any
})({
  async onInit() {
    this.db = new Database(this.config.url)
    await this.db.connect()
  },

  async onRegister(registry) {
    registry.registerProvider({
      name: 'database',
      type: 'postgres',
      init: async (config) => {
        await this.db.init(config)
      },
      get: (key) => this.db.get(key),
      set: (key, value) => this.db.set(key, value),
      destroy: async () => {
        await this.db.disconnect()
      }
    })
  }
})
```

## 🚦 Производительность

- **Асинхронная загрузка** - плагины загружаются параллельно
- **Кэширование** - конфигурация кэшируется
- **Ленивая инициализация** - плагин инициализируется при первом использовании
- **Отложенная загрузка** - тяжелые операции откладываются
- **Пул соединений** - переиспользование соединений

## 🔐 Безопасность

- **Изоляция** - плагины изолированы друг от друга
- **Контроль доступа** - проверка разрешений
- **Валидация** - проверка входных данных
- **Таймауты** - предотвращение зависаний
- **Ограничения** - лимиты на ресурсы

## 📚 Дополнительные ресурсы

- [Документация ElizaOS](https://docs.elizaos.ai/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 🤝 Вклад

1. Создайте fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT

---

**Vibee Plugin Core** - мощная плагинная архитектура для современных ботов ✨
