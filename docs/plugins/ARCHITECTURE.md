# Архитектура плагинов Vibee

## Обзор

Архитектура плагинов Vibee построена на базе **ElizaOS Plugin System** и следует принципам модульности, расширяемости и переиспользования.

## Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Vibee Agent                              │
├─────────────────────────────────────────────────────────────┤
│  Character (Personality, Settings, Knowledge)               │
├─────────────────────────────────────────────────────────────┤
│  Plugins Layer                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Training    │ │ AI-Photoshop │ │ Keyboards    │        │
│  │  Plugin      │ │   Plugin     │ │   Plugin     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Telegram    │ │  Commands    │ │  Providers   │        │
│  │  Plugin      │ │   Plugin     │ │   Plugin     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ElizaOS Core                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Runtime    │ │   Actions    │ │   Services   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Memory     │ │   Providers  │ │   Database   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Platform Adapters                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Telegram   │ │   Discord    │ │   Slack      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### 1. Character (Персонаж)

Основная конфигурация агента, включающая:
- **Personality**: характер, поведение
- **System Prompt**: инструкции для ИИ
- **Bio**: биография персонажа
- **Topics**: темы для обсуждения
- **Plugins**: список подключенных плагинов
- **Settings**: настройки и секреты

```typescript
interface Character {
  name: string;
  system: string;
  bio: string[];
  topics: string[];
  plugins: Plugin[];
  settings: {
    secrets: Record<string, string>;
    voice?: string;
    model?: string;
  };
  messageExamples: MessageExample[][];
}
```

### 2. Plugin (Плагин)

Модульная единица функциональности:

```
┌─────────────────────────────────────────┐
│              Plugin                     │
├─────────────────────────────────────────┤
│  Metadata                               │
│  - name: string                         │
│  - description: string                  │
│  - priority: number                     │
├─────────────────────────────────────────┤
│  Components                             │
│  - actions: Action[]                    │
│  - providers: Provider[]                │
│  - services: Service[]                  │
│  - models: Record<string, ModelHandler> │
│  - routes: Route[]                      │
│  - events: EventHandlers                │
├─────────────────────────────────────────┤
│  Lifecycle                              │
│  - init(config, runtime)                │
└─────────────────────────────────────────┘
```

### 3. Runtime (Исполнитель)

Среда выполнения агента:

```
┌─────────────────────────────────────────┐
│        IAgentRuntime                    │
├─────────────────────────────────────────┤
│  Core                                   │
│  - character: Character                 │
│  - plugins: Plugin[]                    │
│  - state: State                         │
├─────────────────────────────────────────┤
│  Components                             │
│  - actions: Map<string, Action>         │
│  - evaluators: Map<string, Evaluator>   │
│  - providers: Map<string, Provider>     │
│  - services: Map<string, Service>       │
│  - models: Record<string, ModelHandler> │
├─────────────────────────────────────────┤
│  Database                               │
│  - db: DatabaseAdapter                  │
│  - get, set, delete, update             │
├─────────────────────────────────────────┤
│  Platforms                              │
│  - telegram: TelegramService            │
│  - discord: DiscordService              │
│  - slack: SlackService                  │
└─────────────────────────────────────────┘
```

### 4. Memory (Память)

Система хранения контекста:

```
┌─────────────────────────────────────────┐
│              Memory                     │
├─────────────────────────────────────────┤
│  Identity                               │
│  - id: string                           │
│  - userId: string                       │
│  - roomId: string                       │
│  - createdAt: timestamp                 │
├─────────────────────────────────────────┤
│  Content                                │
│  - text?: string                        │
│  - action?: string                      │
│  - image?: string                       │
│  - attachments?: Attachment[]           │
├─────────────────────────────────────────┤
│  Metadata                               │
│  - uniqueKey?: string                   │
│  - metadata?: Record<string, any>       │
└─────────────────────────────────────────┘
```

### 5. State (Состояние)

Контекст диалога:

```
┌─────────────────────────────────────────┐
│               State                     │
├─────────────────────────────────────────┤
│  Data                                   │
│  - values: Record<string, any>          │
│  - data: Record<string, any>            │
│  - context: string                      │
├─────────────────────────────────────────┤
│  Temporary Data                         │
│  - current page                         │
│  - wizard step                          │
│  - user preferences                     │
└─────────────────────────────────────────┘
```

## Типы плагинов

### 1. Provider Plugin

```
┌─────────────────────────────────────────┐
│         Provider Plugin                 │
├─────────────────────────────────────────┤
│  Purpose                                │
│  External API Integration               │
│  Data retrieval                         │
│  Cache management                       │
├─────────────────────────────────────────┤
│  Components                             │
│  - Provider[]                           │
│  - Service (for caching)                │
├─────────────────────────────────────────┤
│  Example                                │
│  - Replicate API                        │
│  - OpenAI API                           │
│  - Database connectors                  │
└─────────────────────────────────────────┘
```

### 2. Scene Plugin

```
┌─────────────────────────────────────────┐
│          Scene Plugin                   │
├─────────────────────────────────────────┤
│  Purpose                                │
│  Multi-step workflows                   │
│  User interaction flows                 │
│  Wizard experiences                     │
├─────────────────────────────────────────┤
│  Components                             │
│  - Service (state management)           │
│  - Actions (event handlers)             │
│  - Events (telegram callbacks)          │
├─────────────────────────────────────────┤
│  Example                                │
│  - LoRA Training Wizard                 │
│  - Photo Upload Flow                    │
│  - Settings Configuration               │
└─────────────────────────────────────────┘
```

### 3. Command Plugin

```
┌─────────────────────────────────────────┐
│         Command Plugin                  │
├─────────────────────────────────────────┤
│  Purpose                                │
│  Bot commands processing                │
│  User requests handling                 │
│  Simple interactions                    │
├─────────────────────────────────────────┤
│  Components                             │
│  - Actions[]                            │
│  - Providers (for context)              │
├─────────────────────────────────────────┤
│  Example                                │
│  - /start, /help                        │
│  - /stats, /status                      │
│  - Custom command handlers              │
└─────────────────────────────────────────┘
```

### 4. Middleware Plugin

```
┌─────────────────────────────────────────┐
│        Middleware Plugin                │
├─────────────────────────────────────────┤
│  Purpose                                │
│  Request/Response processing            │
│  Cross-cutting concerns                 │
│  Security and validation                │
├─────────────────────────────────────────┤
│  Components                             │
│  - Events (for interception)            │
│  - Service (for processing)             │
├─────────────────────────────────────────┤
│  Example                                │
│  - Authentication                       │
│  - Rate limiting                        │
│  - Logging                              │
│  - Validation                           │
└─────────────────────────────────────────┘
```

## Паттерны архитектуры

### 1. Plugin Registry Pattern

```typescript
class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private instances = new Map<string, any>();

  register(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  async initialize(plugin: Plugin, runtime: IAgentRuntime) {
    await plugin.init?.(plugin.config, runtime);

    // Register components
    plugin.actions?.forEach(action => runtime.actions.set(action.name, action));
    plugin.providers?.forEach(provider => runtime.providers.set(provider.name, provider));
    plugin.services?.forEach(ServiceClass => this.initializeService(ServiceClass, runtime));
  }
}
```

### 2. Service Locator Pattern

```typescript
class ServiceLocator {
  private services = new Map<string, Service>();

  register(serviceType: string, service: Service) {
    this.services.set(serviceType, service);
  }

  get<T extends Service>(serviceType: string): T | null {
    return this.services.get(serviceType) as T || null;
  }

  async start(serviceType: string, runtime: IAgentRuntime) {
    const ServiceClass = this.getServiceClass(serviceType);
    if (ServiceClass && ServiceClass.start) {
      const service = await ServiceClass.start(runtime);
      this.register(serviceType, service);
    }
  }
}
```

### 3. Event-Driven Architecture

```typescript
class EventBus {
  private handlers = new Map<string, Function[]>();

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: string, params: any) {
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map(handler => handler(params)));
  }
}

// Использование
const eventBus = new EventBus();

plugin.events = {
  MESSAGE_RECEIVED: [
    async (params) => eventBus.emit('custom_message', params)
  ]
};
```

### 4. Observer Pattern

```typescript
abstract class ObservableService extends Service {
  private observers: Function[] = [];

  subscribe(observer: Function) {
    this.observers.push(observer);
  }

  unsubscribe(observer: Function) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  protected notify(data: any) {
    this.observers.forEach(observer => observer(data));
  }
}
```

### 5. Strategy Pattern

```typescript
interface ProcessingStrategy {
  process(data: any): Promise<any>;
}

class FastStrategy implements ProcessingStrategy {
  async process(data: any) {
    // Быстрая обработка
    return data;
  }
}

class QualityStrategy implements ProcessingStrategy {
  async process(data: any) {
    // Качественная обработка
    return data;
  }
}

class ProcessingService extends Service {
  private strategy: ProcessingStrategy;

  setStrategy(strategy: ProcessingStrategy) {
    this.strategy = strategy;
  }

  async process(data: any) {
    return this.strategy.process(data);
  }
}
```

### 6. Factory Pattern

```typescript
abstract class PluginFactory {
  abstract create(): Plugin;

  static createPlugin(type: PluginType): Plugin {
    switch (type) {
      case 'command':
        return new CommandPluginFactory().create();
      case 'scene':
        return new ScenePluginFactory().create();
      case 'provider':
        return new ProviderPluginFactory().create();
      default:
        throw new Error(`Unknown plugin type: ${type}`);
    }
  }
}
```

## Жизненный цикл системы

### 1. Инициализация

```
┌─────────────────────────────────────────┐
│         Boot Sequence                   │
├─────────────────────────────────────────┤
│                                         │
│  1. Load Character Config               │
│  2. Initialize Database                 │
│  3. Register Plugins                    │
│  4. Initialize Runtime                  │
│  5. Load Services                       │
│  6. Setup Event Handlers                │
│  7. Connect Platforms                   │
│  8. Start HTTP Server                   │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Обработка сообщения

```
┌─────────────────────────────────────────┐
│      Message Processing Flow            │
├─────────────────────────────────────────┤
│                                         │
│  1. Receive Message                     │
│  2. Validate & Sanitize                 │
│  3. Load Context (Memory + State)       │
│  4. Route to Platform Adapter           │
│  5. Trigger MESSAGE_RECEIVED Event      │
│  6. Run Action Validators               │
│  7. Execute Matching Actions            │
│  8. Update Memory                       │
│  9. Update State                        │
│  10. Send Response                      │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Остановка

```
┌─────────────────────────────────────────┐
│      Shutdown Sequence                  │
├─────────────────────────────────────────┤
│                                         │
│  1. Stop HTTP Server                    │
│  2. Stop Services                       │
│  3. Cleanup Resources                   │
│  4. Save State to Database              │
│  5. Close Connections                   │
│  6. Exit                                │
│                                         │
└─────────────────────────────────────────┘
```

## Архитектурные принципы

### 1. Single Responsibility Principle (SRP)

Каждый плагин отвечает за одну область функциональности:

```
❌ Плохо: MegaPlugin
├─ Commands
├─ Image Processing
├─ User Management
└─ Database Operations

✅ Хорошо: Разделенные плагины
├─ CommandsPlugin
├─ ImageProcessingPlugin
├─ UserManagementPlugin
└─ DatabasePlugin
```

### 2. Dependency Inversion (DIP)

```typescript
// ❌ Плохо: Зависимость от конкретной реализации
class MyService {
  private telegram = new TelegramBot(token);
}

// ✅ Хорошо: Зависимость от абстракции
class MyService {
  constructor(private platform: Platform) {}

  async sendMessage(chatId: string, text: string) {
    return this.platform.sendMessage(chatId, text);
  }
}
```

### 3. Open/Closed Principle (OCP)

```typescript
// ✅ Хорошо: Расширение через наследование
abstract class BasePlugin implements Plugin {
  abstract name: string;
  // Базовый функционал
}

class ExtendedPlugin extends BasePlugin {
  // Добавляем новый функционал без изменения BasePlugin
}
```

### 4. Interface Segregation (ISP)

```typescript
// ✅ Хорошо: Специализированные интерфейсы
interface ImageProcessor {
  processImage(input: Image): Promise<Image>;
}

interface AudioProcessor {
  processAudio(input: Audio): Promise<Audio>;
}

// ❌ Плохо: Могучий интерфейс
interface MediaProcessor {
  processImage(input: Image): Promise<Image>;
  processAudio(input: Audio): Promise<Audio>;
  processVideo(input: Video): Promise<Video>;
  // ...
}
```

### 5. Dependency Injection (DI)

```typescript
class MyService {
  constructor(
    private database: DatabaseAdapter,
    private logger: Logger,
    private config: Config
  ) {}
}

// Вместо создания зависимостей внутри
// Мы их получаем извне (Dependency Injection)
```

## Паттерны взаимодействия

### 1. Request-Response

```typescript
// Action выполняется -> возвращает результат
const result = await action.handler(runtime, message, state);
callback(result);
```

### 2. Pub-Sub

```typescript
// Событие публикуется -> все подписчики получают уведомление
eventBus.emit('MESSAGE_RECEIVED', { message, userId });

// Подписчики
eventBus.on('MESSAGE_RECEIVED', handler1);
eventBus.on('MESSAGE_RECEIVED', handler2);
```

### 3. Pipeline

```typescript
// Обработка через цепочку middleware
const pipeline = [
  authMiddleware,
  validationMiddleware,
  rateLimitMiddleware,
  processingMiddleware,
  responseMiddleware
];

for (const middleware of pipeline) {
  await middleware(context);
}
```

### 4. Chain of Responsibility

```typescript
// Actions проверяются по очереди
for (const action of actions) {
  const isValid = await action.validate(runtime, message, state);
  if (isValid) {
    await action.handler(runtime, message, state, options, callback);
    break;
  }
}
```

## Производительность

### 1. Кэширование

```
┌─────────────────────────────────────────┐
│        Caching Strategy                 │
├─────────────────────────────────────────┤
│                                         │
│  L1: In-Memory Cache                    │
│      - Fast access                      │
│      - Limited size                     │
│      - Volatile                         │
│                                         │
│  L2: Database Cache                     │
│      - Persistent                       │
│      - Larger size                      │
│      - Slower access                    │
│                                         │
│  L3: External Cache (Redis)             │
│      - Shared across instances          │
│      - High availability                │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Параллелизм

```typescript
// Параллельное выполнение независимых задач
const results = await Promise.all([
  provider1.getData(),
  provider2.getData(),
  provider3.getData()
]);

// Параллельное выполнение с ограничением
const concurrency = 3;
const chunks = array.chunk(concurrency);

for (const chunk of chunks) {
  await Promise.all(chunk.map(processItem));
}
```

### 3. Lazy Loading

```typescript
// Загружаем сервис только когда нужно
async getOptionalService(serviceType: string) {
  if (!this.services.has(serviceType)) {
    const ServiceClass = await import(`./services/${serviceType}`);
    const service = await ServiceClass.start(this.runtime);
    this.services.set(serviceType, service);
  }
  return this.services.get(serviceType);
}
```

## Безопасность

### 1. Authentication

```
┌─────────────────────────────────────────┐
│         Security Layers                 │
├─────────────────────────────────────────┤
│                                         │
│  L1: API Key Authentication             │
│      - Bot Token                        │
│      - API Keys                         │
│                                         │
│  L2: Request Validation                 │
│      - Input Sanitization               │
│      - Rate Limiting                    │
│                                         │
│  L3: Action Authorization               │
│      - Permission Check                 │
│      - Scope Validation                 │
│                                         │
│  L4: Data Encryption                    │
│      - At Rest                          │
│      - In Transit                       │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Input Validation

```typescript
// Валидация входных данных
const schema = z.object({
  userId: z.string().min(1),
  action: z.string().regex(/^[a-z_]+$/),
  data: z.object({
    text: z.string().max(1000)
  })
});

const validated = schema.parse(input);
```

### 3. Error Handling

```typescript
// Не раскрываем внутренние детали
try {
  await riskyOperation();
} catch (error) {
  logger.error('[MyPlugin] Operation failed', {
    error: error.message,
    userId,
    action
  });

  return {
    success: false,
    error: 'Operation failed' // Generic message
  };
}
```

## Мониторинг и наблюдаемость

### 1. Metrics

```typescript
class MetricsCollector {
  private metrics = {
    actionsExecuted: new Map(),
    responseTime: new Map(),
    errors: new Map()
  };

  recordAction(actionName: string) {
    this.metrics.actionsExecuted.set(
      actionName,
      (this.metrics.actionsExecuted.get(actionName) || 0) + 1
    );
  }

  recordResponseTime(actionName: string, duration: number) {
    this.metrics.responseTime.set(actionName, duration);
  }
}
```

### 2. Health Checks

```typescript
class HealthCheckService extends Service {
  async check(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      checks: {
        database: await this.checkDatabase(),
        services: await this.checkServices(),
        memory: await this.checkMemory()
      }
    };
  }
}
```

## Масштабирование

### 1. Horizontal Scaling

```
┌─────────────────────────────────────────┐
│      Horizontal Scaling                 │
├─────────────────────────────────────────┤
│                                         │
│  Load Balancer                          │
│       │                                 │
│  ┌────┴────┐                            │
│  │ Instance 1                            │
│  │ Instance 2                            │
│  │ Instance 3                            │
│  └─────────┘                             │
│       │                                 │
│  ┌────┴────┐                            │
│  │  Shared Database                     │
│  │  (Redis/SQL)                         │
│  └─────────┘                             │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Vertical Scaling

```
┌─────────────────────────────────────────┐
│        Vertical Scaling                 │
├─────────────────────────────────────────┤
│                                         │
│  Before:                                │
│  ┌──────────┐                          │
│  │ CPU: 2 cores                        │
│  │ RAM: 4GB                            │
│  │ Storage: 50GB                       │
│  └──────────┘                          │
│                                         │
│  After:                                 │
│  ┌──────────┐                          │
│  │ CPU: 8 cores                        │
│  │ RAM: 16GB                           │
│  │ Storage: 200GB                      │
│  └──────────┘                          │
│                                         │
└─────────────────────────────────────────┘
```

## Заключение

Архитектура плагинов Vibee обеспечивает:
- **Модульность**: Каждый плагин независим и переиспользуем
- **Расширяемость**: Легко добавлять новую функциональность
- **Тестируемость**: Компоненты можно тестировать изолированно
- **Производительность**: Оптимизирована для работы в реальном времени
- **Безопасность**: Многоуровневая защита и валидация
- **Наблюдаемость**: Мониторинг и метрики на всех уровнях

Следуйте этим принципам при создании новых плагинов для максимальной эффективности и поддерживаемости.
