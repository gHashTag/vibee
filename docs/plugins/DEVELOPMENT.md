# Руководство по разработке плагинов

## Создание нового плагина

### Быстрый старт

```bash
# Создать плагин с нуля
npm run create:plugin -- --name=my-feature --type=command

# Или вручную создать файл
touch src/my-feature-plugin.ts
```

### Генератор плагинов

Проект включает генератор плагинов для быстрого старта:

```bash
npm run create:plugin -- --name=my-plugin --type=scene
```

**Типы плагинов**:
- `command` - обработка команд бота
- `scene` - многошаговые workflow
- `provider` - интеграция с внешними API
- `middleware` - перехват запросов

## Пошаговое создание плагина

### Шаг 1: Базовая структура

Создайте файл плагина в папке `src/`:
文件名: `src/my-awesome-plugin.ts`

```typescript
import { Plugin } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Мой крутой плагин
 * Описание функциональности
 */
export const myAwesomePlugin: Plugin = {
  name: 'my-awesome-plugin',
  description: 'Крутой плагин для Vibee',

  // Инициализация
  async init(config, runtime) {
    logger.info('[MyAwesomePlugin] Инициализация...');
    // Логика инициализации
  },

  // Компоненты плагина
  actions: [],
  providers: [],
  services: [],
  models: {},
  routes: [],
  events: {}
};

export default myAwesomePlugin;
```

### Шаг 2: Добавление Action

```typescript
import type { Action, IAgentRuntime, Memory, State } from '@elizaos/core';

/**
 * Пример действия
 */
const myAction: Action = {
  name: 'MY_COOL_ACTION',
  similes: ['COOL', 'AWESOME', 'КРУТО'],
  description: 'Выполняет крутое действие',

  // Валидация - когда срабатывает
  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('круто') || text.includes('awesome');
  },

  // Обработка действия
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ) => {
    try {
      logger.info('[MY_COOL_ACTION] Выполнение...');

      // Получаем пользователя
      const userId = message.userId;

      // Основная логика
      await doSomethingCool(userId);

      // Ответ пользователю
      await callback({
        text: 'Это было очень круто! 🎉',
        actions: ['MY_COOL_ACTION']
      });

      return {
        success: true,
        text: 'Действие выполнено успешно',
        data: {
          userId,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      logger.error('[MY_COOL_ACTION] Ошибка:', error);

      await callback({
        text: 'Произошла ошибка 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // Примеры для обучения
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Это очень круто!' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Это было очень круто! 🎉',
          actions: ['MY_COOL_ACTION']
        }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Awesome!' }
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Это было очень круто! 🎉',
          actions: ['MY_COOL_ACTION']
        }
      }
    ]
  ]
};

// Добавляем в плагин
export const myAwesomePlugin: Plugin = {
  // ... другие поля
  actions: [myAction]
};
```

### Шаг 3: Добавление Service

```typescript
export class MyCoolService extends Service {
  static serviceType = 'my-cool-service';
  capabilityDescription = 'Сервис для крутых операций';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async someOperation() {
    // Реализация операции
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('[MyCoolService] Запуск...');
    const service = new MyCoolService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    const service = runtime.getService(MyCoolService.serviceType);
    if (service) {
      service.stop();
    }
  }

  async stop() {
    logger.info('[MyCoolService] Остановка...');
  }
}

// Добавляем в плагин
export const myAwesomePlugin: Plugin = {
  // ... другие поля
  services: [MyCoolService]
};
```

### Шаг 4: Добавление Provider

```typescript
import type { Provider, ProviderResult } from '@elizaos/core';

const myDataProvider: Provider = {
  name: 'MY_DATA_PROVIDER',
  description: 'Предоставляет данные для агента',

  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    // Получаем данные
    const data = await fetchData();

    return {
      text: 'Дополнительная информация от провайдера',
      values: {
        myData: data
      },
      data: {
        provider: 'MY_DATA_PROVIDER',
        timestamp: Date.now()
      }
    };
  }
};

// Добавляем в плагин
export const myAwesomePlugin: Plugin = {
  // ... другие поля
  providers: [myDataProvider]
};
```

### Шаг 5: HTTP Routes

```typescript
export const myAwesomePlugin: Plugin = {
  // ... другие поля
  routes: [
    {
      name: 'my-route',
      path: '/my-awesome-endpoint',
      type: 'GET',
      handler: async (req: any, res: any) => {
        try {
          const data = await getSomeData();

          res.json({
            success: true,
            data
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    },
    {
      name: 'post-route',
      path: '/submit',
      type: 'POST',
      handler: async (req: any, res: any) => {
        const { input } = req.body;

        const result = await processInput(input);

        res.json({
          success: true,
          result
        });
      }
    }
  ]
};
```

### Шаг 6: События

```typescript
export const myAwesomePlugin: Plugin = {
  // ... другие поля
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('[EVENT] MESSAGE_RECEIVED', params);
        // Обработка сообщения
      }
    ],

    USER_JOINED: [
      async (params) => {
        logger.info('[EVENT] USER_JOINED', params);
        // Обработка присоединения пользователя
      }
    ]
  }
};
```

### Шаг 7: Конфигурация

```typescript
import { z } from 'zod';

// Схема валидации конфигурации
const configSchema = z.object({
  MY_API_KEY: z.string().min(1, 'MY_API_KEY required'),
  TIMEOUT: z.number().default(30000),
  DEBUG: z.boolean().default(false)
});

export const myAwesomePlugin: Plugin = {
  name: 'my-awesome-plugin',
  description: 'Крутой плагин',

  // Конфигурация из environment
  config: {
    MY_API_KEY: process.env.MY_API_KEY,
    TIMEOUT: parseInt(process.env.TIMEOUT || '30000'),
    DEBUG: process.env.DEBUG === 'true'
  },

  async init(config, runtime) {
    try {
      // Валидация конфигурации
      const validatedConfig = await configSchema.parseAsync(config);

      // Сохранение в environment для использования
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value !== undefined) {
          process.env[key] = String(value);
        }
      }

      logger.info('[MyAwesomePlugin] Инициализация завершена');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(i => i.message).join(', ');
        throw new Error(`Invalid config: ${messages}`);
      }
      throw error;
    }
  }
};
```

## Работа с Telegram

### Обработка фото

```typescript
import type { Service } from '@elizaos/core';

class TelegramPhotoHandler extends Service {
  static serviceType = 'telegram-photo-handler';

  async initialize(runtime: IAgentRuntime) {
    const telegramService = runtime.getService('telegram');

    if (telegramService?.bot) {
      telegramService.bot.on('photo', async (ctx) => {
        try {
          const userId = ctx.from.id.toString();
          const photos = ctx.message.photo;

          logger.info('[PhotoHandler] Получено фото', { userId, count: photos.length });

          // Обработка фото
          await handleUserPhoto(runtime, userId, photos, ctx);
        } catch (error) {
          logger.error('[PhotoHandler] Ошибка:', error);
        }
      });
    }
  }

  static async start(runtime: IAgentRuntime) {
    const service = new TelegramPhotoHandler(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop() {
    // Очистка ресурсов
  }
}
```

### Обработка callback кнопок

```typescript
class TelegramCallbackHandler extends Service {
  static serviceType = 'telegram-callback-handler';

  async initialize(runtime: IAgentRuntime) {
    const telegramService = runtime.getService('telegram');

    if (telegramService?.bot) {
      telegramService.bot.on('callback_query', async (ctx) => {
        try {
          const userId = ctx.callbackQuery.from.id.toString();
          const callbackData = ctx.callbackQuery.data;

          logger.info('[CallbackHandler] Callback', { userId, data: callbackData });

          // Обработка callback
          await handleCallback(runtime, userId, callbackData, ctx);
        } catch (error) {
          logger.error('[CallbackHandler] Ошибка:', error);
          // Подтверждаем callback чтобы убрать loading
          try {
            await ctx.answerCbQuery('Ошибка', { show_alert: true });
          } catch {}
        }
      });
    }
  }
}
```

### Отправка клавиатур

```typescript
import { keyboard } from '../telegram-keyboards/KeyboardBuilder';

// Inline клавиатура
const inlineKeyboard = keyboard
  .builder()
  .callback('Да', 'yes', 0)
  .callback('Нет', 'no', 0)
  .buildInline();

// Reply клавиатура
const replyKeyboard = keyboard
  .builder()
  .requestContact('Поделиться контактом', 0)
  .requestLocation('Поделиться локацией', 0)
  .setOptions({ one_time: true })
  .buildReply();

// Отправка сообщения с клавиатурой
const telegramService = runtime.getService('telegram');
if (telegramService?.bot) {
  await telegramService.bot.sendMessage(chatId, 'Выберите действие:', {
    reply_markup: inlineKeyboard
  });
}
```

## Интеграция с внешними API

### Replicate

```typescript
import Replicate from 'replicate';

class ReplicateService {
  private client: Replicate;

  constructor(apiKey: string) {
    this.client = new Replicate({
      auth: apiKey
    });
  }

  async runModel(model: string, input: any) {
    const output = await this.client.run(model, { input });
    return output;
  }
}

// Использование в action
const myImageAction: Action = {
  name: 'GENERATE_IMAGE',
  // ...
  handler: async (runtime, message, state, options, callback) => {
    const replicate = runtime.getService('replicate');

    if (!replicate) {
      throw new Error('Replicate service not available');
    }

    const result = await replicate.runModel(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        prompt: message.content.text
      }
    );

    await callback({
      text: 'Изображение готово!',
      image: result
    });
  }
};
```

### OpenAI

```typescript
import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt: string) {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    return completion.choices[0].message.content;
  }
}
```

## Обработка ошибок

### Стратегии обработки

```typescript
// 1. Graceful degradation
handler: async (runtime, message, state, options, callback) => {
  try {
    const result = await riskyOperation();

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.warn('[MyAction] Risky operation failed:', error);

    // Возвращаем fallback результат
    return {
      success: true,
      text: 'Операция недоступна, но бот работает',
      data: { fallback: true }
    };
  }
};

// 2. Retry mechanism
handler: async (runtime, message, state, options, callback) => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await mightFail();
      return { success: true, data: result };
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// 3. Circuit breaker
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure < this.timeout) {
        throw new Error('Circuit breaker open');
      } else {
        this.failures = 0;
      }
    }

    try {
      const result = await operation();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      throw error;
    }
  }
}
```

## Кэширование

```typescript
// Простое кэширование в памяти
class CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 минут

  set(key: string, value: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
```

## Логирование

### Структурированное логирование

```typescript
import { logger } from '@elizaos/core';

// Хорошо: структурированные логи
logger.info('[MyPlugin] Операция выполнена', {
  userId,
  action: 'my-action',
  duration: Date.now() - startTime,
  success: true
});

// Плохо: простые логи
logger.info('User did something');

// Ошибки с контекстом
logger.error('[MyPlugin] Ошибка API', {
  error: error.message,
  stack: error.stack,
  userId,
  apiEndpoint
});

// Предупреждения
logger.warn('[MyPlugin] Ретрай', {
  attempt,
  maxAttempts,
  error: lastError?.message
});
```

## Тестирование

### Модульные тесты

```typescript
import { describe, expect, it } from 'bun:test';

describe('My Action', () => {
  it('should validate correctly', async () => {
    const message: Memory = {
      id: '1',
      userId: 'user1',
      roomId: 'room1',
      content: { text: 'круто' },
      createdAt: Date.now()
    };

    const result = await myAction.validate(runtime, message, state);

    expect(result).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Тест обработки ошибок
  });
});
```

### Интеграционные тесты

```typescript
describe('My Plugin Integration', () => {
  it('should work end-to-end', async () => {
    const runtime = createTestRuntime();
    await plugin.init(config, runtime);

    // Тестирование интеграции
  });
});
```

Подробности в [TESTING.md](./TESTING.md)

## Деплой и публикация

### Регистрация плагина

Добавьте плагин в основной файл персонажа:

```typescript
// src/character.ts
import { myAwesomePlugin } from './my-awesome-plugin';

export const vibeeCharacter: Character = {
  name: 'Vibee',
  plugins: [
    '@elizaos/plugin-bootstrap',
    myAwesomePlugin  // Ваш плагин
  ],
  // ...
};
```

### Проверка перед коммитом

```bash
# Проверка типов
npm run type-check

# Тесты
npm test

# Линтинг
npm run lint

# Сборка
npm run build
```

## Лучшие практики

### 1. Принцип единственной ответственности
- Каждый плагин делает одну вещь хорошо
- Разделяйте функциональность на несколько плагинов

### 2. Инверсия зависимостей
```typescript
// Хорошо: принимаем зависимости через конструктор
class MyService {
  constructor(
    private database: Database,
    private apiClient: ApiClient
  ) {}
}

// Плохо: создаем зависимости внутри
class MyService {
  constructor() {
    this.database = new Database(); // Tight coupling
  }
}
```

### 3. Асинхронность
```typescript
// Всегда используйте async/await
handler: async (runtime, message, state, options, callback) => {
  const data = await fetchData(); // Не блокируем event loop
  return { success: true, data };
};

// Избегайте sync операций
// НЕ ДЕЛАЙТЕ так:
handler: (runtime, message, state) => {
  const data = fs.readFileSync('file.txt'); // БЛОКИРУЕТ!
  return { data };
};
```

### 4. Graceful shutdown
```typescript
class MyService extends Service {
  private stopHandlers: (() => void)[] = [];

  async start() {
    // Регистрируем cleanup handlers
    process.on('SIGTERM', this.cleanup);
    process.on('SIGINT', this.cleanup);

    this.stopHandlers.push(() => {
      process.off('SIGTERM', this.cleanup);
      process.off('SIGINT', this.cleanup);
    });
  }

  private cleanup = async () => {
    logger.info('[MyService] Очистка ресурсов...');
    for (const handler of this.stopHandlers) {
      handler();
    }
  };

  async stop() {
    await this.cleanup();
  }
}
```

### 5. Мониторинг и метрики

```typescript
class MetricsService {
  private metrics = {
    actionsExecuted: new Map(),
    errors: new Map(),
    responseTime: new Map()
  };

  recordAction(actionName: string) {
    const current = this.metrics.actionsExecuted.get(actionName) || 0;
    this.metrics.actionsExecuted.set(actionName, current + 1);
  }

  recordError(actionName: string, error: Error) {
    const current = this.metrics.errors.get(actionName) || 0;
    this.metrics.errors.set(actionName, current + 1);
  }

  recordResponseTime(actionName: string, duration: number) {
    this.metrics.responseTime.set(actionName, duration);
  }

  getStats() {
    return {
      actionsExecuted: Object.fromEntries(this.metrics.actionsExecuted),
      errors: Object.fromEntries(this.metrics.errors),
      avgResponseTime: Object.fromEntries(this.metrics.responseTime)
    };
  }
}
```

## Отладка

### Включение debug логов

```bash
DEBUG=my-awesome-plugin:* npm run dev
```

### Профилирование

```typescript
import { performance } from 'perf_hooks';

handler: async (runtime, message, state, options, callback) => {
  const start = performance.now();

  try {
    await doSomething();

    const duration = performance.now() - start;
    logger.debug('[MyAction] Выполнено за', duration, 'ms');

    return { success: true };
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('[MyAction] Ошибка после', duration, 'ms:', error);
    throw error;
  }
};
```

## Документирование

### JSDoc

```typescript
/**
 * Выполняет крутое действие
 *
 * @param runtime - Runtime агента
 * @param message - Сообщение пользователя
 * @param state - Состояние диалога
 * @returns Результат выполнения
 * @throws {Error} При ошибке выполнения
 * @example
 * ```typescript
 * const result = await myAction.handler(runtime, message, state);
 * console.log(result.success); // true
 * ```
 */
const myAction: Action = {
  // ...
};
```

### README плагина

Создайте `PLUGIN_README.md` в папке плагина:

```markdown
# My Awesome Plugin

Описание плагина...

## Возможности

- Функция 1
- Функция 2

## Установка

```bash
npm install my-awesome-plugin
```

## Использование

```typescript
import { myAwesomePlugin } from './my-awesome-plugin';

const character: Character = {
  plugins: [myAwesomePlugin]
};
```

## Конфигурация

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| MY_API_KEY | API ключ | - |

## Примеры

См. examples/ папку
```

## Заключение

Создание хороших плагинов требует:
- Понимания архитектуры ElizaOS
- Следования best practices
- Тщательного тестирования
- Документирования кода

Если у вас есть вопросы, обращайтесь к существующим плагинам в проекте как к примерам.
