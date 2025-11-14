# API Reference плагинов

## Базовый интерфейс Plugin

```typescript
interface Plugin {
  // Обязательные поля
  name: string;
  description: string;

  // Необязательные компоненты
  actions?: Action[];
  evaluators?: Evaluator[];
  providers?: Provider[];
  services?: Service[];
  models?: Record<string, ModelHandler>;
  routes?: Route[];
  events?: Record<string, ((params: any) => Promise<any>)[]>;
  adapter?: IDatabaseAdapter;

  // Конфигурация
  config?: Record<string, any>;
  dependencies?: string[];
  testDependencies?: string[];
  priority?: number;

  // Инициализация
  init?: (config: Record<string, string>, runtime: IAgentRuntime) => Promise<void>;
}
```

## Action API

### Интерфейс Action

```typescript
interface Action {
  // Идентификация
  name: string;
  similes?: string[];
  description: string;

  // Логика
  validate: (runtime: IAgentRuntime, message: Memory, state: State) => Promise<boolean>;
  handler: (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback,
    responses: Memory[]
  ) => Promise<ActionResult>;

  // Обучающие данные
  examples: ActionExample[][];
}

type ActionExample = {
  user: string;
  content: {
    text: string;
    action?: string;
  };
};
```

### HandlerCallback

```typescript
type HandlerCallback = (content: Content) => Promise<void>;

interface Content {
  text?: string;
  action?: string;
  actions?: string[];
  source?: string;
  image?: string;
  attachments?: Attachment[];
  // Другие поля...
}
```

### ActionResult

```typescript
interface ActionResult {
  text?: string;
  success: boolean;
  values?: Record<string, any>;
  data?: Record<string, any>;
  error?: Error;
}
```

### Пример использования Action

```typescript
const myAction: Action = {
  name: 'MY_ACTION',
  similes: ['ALT', 'SYNONYM'],
  description: 'Моё действие',

  validate: async (runtime, message, state) => {
    // Возвращаем true чтобы action сработал
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('ключевое слово');
  },

  handler: async (runtime, message, state, options, callback, responses) => {
    // Логика обработки

    // Ответ пользователю
    await callback({
      text: 'Ответ пользователю',
      action: 'MY_ACTION'
    });

    return {
      success: true,
      text: 'Действие выполнено',
      data: {
        timestamp: Date.now()
      }
    };
  },

  examples: [
    [
      { user: '{{user1}}', content: { text: 'Сообщение пользователя' } },
      { user: '{{agent}}', content: { text: 'Ответ агента', action: 'MY_ACTION' } }
    ]
  ]
};
```

## Service API

### Базовый класс Service

```typescript
abstract class Service {
  static serviceType: string;
  capabilityDescription: string;

  constructor(protected runtime: IAgentRuntime) {}

  // Методы жизненного цикла
  async start(runtime: IAgentRuntime): Promise<this> {
    return this;
  }

  async stop(): Promise<void> {}

  async cleanup?(): Promise<void> {}
}
```

### Пример кастомного Service

```typescript
export class MyService extends Service {
  static serviceType = 'my-service';
  capabilityDescription = 'Описание возможностей сервиса';

  private cache = new Map<string, any>();

  async someOperation() {
    // Логика сервиса
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('[MyService] Starting...');
    const service = new MyService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    const service = runtime.getService(MyService.serviceType);
    if (service) {
      service.stop();
    }
  }

  async stop() {
    logger.info('[MyService] Stopping...');
    this.cache.clear();
  }
}
```

### Регистрация Service

```typescript
// В runtime доступны методы:
runtime.registerService(serviceType, service);  // Регистрация
runtime.getService(serviceType);               // Получение
runtime.getServices();                         // Все сервисы
```

## Provider API

### Интерфейс Provider

```typescript
interface Provider {
  name: string;
  description: string;

  get: (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ) => Promise<ProviderResult>;
}

interface ProviderResult {
  text?: string;
  values?: Record<string, any>;
  data?: Record<string, any>;
}
```

### Пример Provider

```typescript
const myProvider: Provider = {
  name: 'MY_PROVIDER',
  description: 'Предоставляет данные',

  get: async (runtime, message, state) => {
    const userId = message.userId;

    // Получаем данные
    const data = await fetchUserData(userId);

    return {
      text: 'Дополнительная информация',
      values: {
        userData: data
      },
      data: {
        provider: 'MY_PROVIDER',
        timestamp: Date.now()
      }
    };
  }
};
```

## Model API

### Типы моделей

```typescript
enum ModelType {
  TEXT_SMALL = 'TEXT_SMALL',
  TEXT_LARGE = 'TEXT_LARGE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  EMBEDDING = 'EMBEDDING'
}

type ModelHandler = (
  runtime: IAgentRuntime,
  params: ModelParams
) => Promise<any>;
```

### ModelParams

```typescript
interface ModelParams {
  prompt: string;
  stopSequences?: string[];
  maxTokens?: number;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  topP?: number;
  topK?: number;
  // Другие параметры...
}
```

### Пример модели

```typescript
const plugin: Plugin = {
  models: {
    [ModelType.TEXT_LARGE]: async (runtime, params) => {
      const openai = runtime.getService('openai');

      if (!openai) {
        throw new Error('OpenAI service not available');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: params.prompt }],
        max_tokens: params.maxTokens || 8192,
        temperature: params.temperature || 0.7
      });

      return completion.choices[0].message.content;
    }
  }
};
```

## Routes API

### Интерфейс Route

```typescript
interface Route {
  name: string;
  path: string;
  type: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: Request, res: Response) => Promise<any>;
}
```

### Пример Routes

```typescript
const plugin: Plugin = {
  routes: [
    {
      name: 'health',
      path: '/health',
      type: 'GET',
      handler: async (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
      }
    },
    {
      name: 'submit',
      path: '/submit',
      type: 'POST',
      handler: async (req, res) => {
        const { data } = req.body;

        try {
          const result = await processData(data);

          res.json({
            success: true,
            result
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  ]
};
```

## Events API

### Поддерживаемые события

```typescript
interface EventMap {
  MESSAGE_RECEIVED: MessageReceivedEvent[];
  VOICE_MESSAGE_RECEIVED: VoiceMessageEvent[];
  WORLD_CONNECTED: WorldEvent[];
  WORLD_JOINED: WorldEvent[];
  USER_JOINED: UserEvent[];
  USER_LEFT: UserEvent[];
}
```

### Пример обработки событий

```typescript
const plugin: Plugin = {
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('[EVENT] MESSAGE_RECEIVED', {
          messageId: params.message?.id,
          userId: params.message?.userId
        });
      }
    ],

    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        const { message } = params;
        logger.info('[EVENT] VOICE_MESSAGE_RECEIVED', {
          userId: message.userId,
          duration: message.content?.duration
        });
      }
    ]
  }
};
```

## IAgentRuntime API

### Основные методы

```typescript
interface IAgentRuntime {
  // Характеристики
  character: Character;
  plugins: Plugin[];
  models: Record<string, ModelHandler>;

  // Настройки
  getSetting: (key: string) => any;
  getSecret: (key: string) => string | undefined;

  // База данных
  db: DatabaseAdapter;

  // Сервисы
  getService: (serviceType: string) => Service | null;
  registerService: (serviceType: string, service: Service) => void;
  getServices: () => Map<string, Service>;

  // Компоненты
  actions: Map<string, Action>;
  evaluators: Map<string, Evaluator>;
  providers: Map<string, Provider>;

  // Состояние
  state: State;

  // Платформы
  telegram?: TelegramService;
  discord?: DiscordService;
  // Другие платформы...
}
```

### DatabaseAdapter API

```typescript
interface DatabaseAdapter {
  // CRUD операции
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  update: (key: string, value: any) => Promise<boolean>;

  // Поиск
  getKeys: (pattern: string) => Promise<string[]>;
  getEntries: (pattern: string) => Promise<Array<[string, any]>>;

  // Утилиты
  count: (pattern?: string) => Promise<number>;
  clear: (pattern?: string) => Promise<void>;
}
```

## Memory API

### Интерфейс Memory

```typescript
interface Memory {
  id: string;
  userId: string;
  roomId: string;
  content: Content;
  createdAt: number;
  uniqueKey?: string;
  metadata?: Record<string, any>;
}
```

## State API

### Интерфейс State

```typescript
interface State {
  values: Record<string, any>;
  data: Record<string, any>;
  context: string;
}
```

## KeyboardBuilder API

### Базовые методы

```typescript
interface KeyboardBuilder {
  // Создание клавиатур
  inline(rows?: InlineKeyboardRow[]): InlineKeyboardMarkup;
  reply(rows?: ReplyKeyboardRow[]): ReplyKeyboardMarkup;

  // Builder pattern
  builder(): KeyboardBuilderInstance;
  usePattern(pattern: string, params?: any): KeyboardBuilderInstance;
  callback(text: string, callbackData: string, row?: number): KeyboardBuilderInstance;
  url(text: string, url: string): KeyboardBuilderInstance;
  requestContact(text: string, row?: number): KeyboardBuilderInstance;
  requestLocation(text: string, row?: number): KeyboardBuilderInstance;
  setOptions(options: any): KeyboardBuilderInstance;
  buildInline(): InlineKeyboardMarkup;
  buildReply(): ReplyKeyboardMarkup;
}
```

### Пример использования

```typescript
import { keyboard } from '../telegram-keyboards/KeyboardBuilder';

// Простая inline клавиатура
const markup = keyboard.inline([
  [{ text: 'Да', callback_data: 'yes' }, { text: 'Нет', callback_data: 'no' }]
]);

// Builder pattern
const markup2 = keyboard
  .builder()
  .callback('Кнопка 1', 'action_1', 0)
  .callback('Кнопка 2', 'action_2', 0)
  .callback('Назад', 'back', 1)
  .buildInline();

// Паттерны
const markup3 = keyboard
  .builder()
  .usePattern('main_menu')
  .buildInline();
```

## Logger API

### Методы логирования

```typescript
class Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

const logger: Logger;
```

### Примеры логирования

```typescript
import { logger } from '@elizaos/core';

// Простое сообщение
logger.info('Плагин инициализирован');

// С метаданными
logger.info('[MyPlugin] Действие выполнено', {
  userId,
  action: 'my-action',
  duration: 150
});

// Ошибка
logger.error('[MyPlugin] Ошибка API', {
  error: error.message,
  stack: error.stack,
  endpoint: '/api/data'
});
```

## Utility API

### Типы утилит

```typescript
// UUID
function generateId(): string;

// Задержка
function sleep(ms: number): Promise<void>;

// Конвертация
function toString(value: any): string;
function toNumber(value: any): number;
function toBoolean(value: any): boolean;

// Валидация
function isValidUrl(string: string): boolean;
function isValidEmail(email: string): boolean;

// Сериализация
function safeStringify(obj: any): string;
```

### Примеры

```typescript
import { generateId, sleep, isValidUrl } from '@elizaos/core';

// Генерация ID
const id = generateId();

// Задержка
await sleep(1000); // 1 секунда

// Валидация URL
if (isValidUrl(url)) {
  // URL валиден
}
```

## Типы сообщений

### Content

```typescript
interface Content {
  text?: string;
  action?: string;
  actions?: string[];
  source?: string;
  image?: string;
  video?: string;
  audio?: string;
  attachments?: Attachment[];
  // Другие поля...
}
```

### Attachment

```typescript
interface Attachment {
  id: string;
  url: string;
  title?: string;
  description?: string;
  mimeType: string;
  size?: number;
}
```

## Хуки жизненного цикла

### Жизненный цикл плагина

1. **Регистрация**
   - Проверка имени
   - Проверка дубликатов
   - Добавление в список активных плагинов

2. **Инициализация**
   - Вызов `init()` если определен
   - Валидация конфигурации
   - Регистрация компонентов

3. **Регистрация компонентов**
   - Actions
   - Evaluators
   - Providers
   - Models
   - Routes
   - Events
   - Services

4. **Запуск**
   - Вызов `Service.start()` для всех сервисов
   - Подписка на события
   - Запуск HTTP сервера (если есть routes)

5. **Остановка**
   - Вызов `Service.stop()` для всех сервисов
   - Отписка от событий
   - Очистка ресурсов

### Жизненный цикл Service

```typescript
class MyService extends Service {
  async initialize(runtime: IAgentRuntime) {
    // Инициализация ресурсов
  }

  static async start(runtime: IAgentRuntime) {
    const service = new MyService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop() {
    // Очистка ресурсов
  }

  async cleanup() {
    // Полная очистка
  }
}
```

## Константы

### ModelType

```typescript
enum ModelType {
  TEXT_SMALL = 'TEXT_SMALL',
  TEXT_LARGE = 'TEXT_LARGE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  EMBEDDING = 'EMBEDDING'
}
```

### События

```typescript
const EVENTS = {
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  VOICE_MESSAGE_RECEIVED: 'VOICE_MESSAGE_RECEIVED',
  WORLD_CONNECTED: 'WORLD_CONNECTED',
  WORLD_JOINED: 'WORLD_JOINED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT'
} as const;
```

## Типы-помощники

```typescript
// Создание runtime
type RuntimeFactory = () => IAgentRuntime;

// Создание memory
type MemoryFactory = (params: Partial<Memory>) => Memory;

// Создание state
type StateFactory = (params: Partial<State>) => State;

// Результат действия
type ActionHandler = (
  runtime: IAgentRuntime,
  message: Memory,
  state: State,
  options: any,
  callback: HandlerCallback,
  responses: Memory[]
) => Promise<ActionResult>;
```

## Часто используемые типы

```typescript
// Пользователь
type UserId = string;

// Комната (чат)
type RoomId = string;

// Timestamp
type Timestamp = number;

// Результат операции
type Result<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Пагинация
type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
```

## Заключение

Этот API reference покрывает все основные интерфейсы и типы для разработки плагинов. Для более подробной информации см. исходный код в `@elizaos/core` и примеры плагинов в проекте.
