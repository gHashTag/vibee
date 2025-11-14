# Документация по плагинам Vibee

## Описание

Vibee использует модульную архитектуру плагинов на базе **ElizaOS**. Каждый плагин добавляет новую функциональность к агенту - от обработки команд до интеграции с внешними API.

## Быстрый старт

```bash
# Посмотреть существующие плагины
ls src/*.ts | grep plugin

# Запустить тесты плагинов
npm test -- plugin

# Создать новый плагин
npm run create:plugin -- --name=my-plugin --type=command
```

## Типы плагинов

### 1. Provider (Поставщик)
Интеграции с внешними API (Replicate, Kie.ai, OpenAI и т.д.)
- Подключение к внешним сервисам
- Получение данных из сторонних источников
- Кэширование и обработка ответов

**Пример**: `src/ai-photoshop/plugin.ts` - работа с Replicate API

### 2. Scene (Сцена)
Многошаговые workflow с пользователем (мастера, визарды)
- Пошаговое взаимодействие
- Состояние диалога
- Обработка кнопок и callback'ов

**Пример**: `src/training-plugin.ts` - обучение LoRA через фото

### 3. Command (Команда)
Обработка команд бота (/start, /help, /stats и т.д.)
- Парсинг команд
- Валидация параметров
- Отправка ответов

**Пример**: `src/telegram-commands-plugin.ts` - обработка /train команд

### 4. Middleware (Посредник)
Перехват и обработка входящих запросов
- Авторизация
- Rate limiting
- Логирование
- Трансформация данных

## Структура плагина

```typescript
import { Plugin } from '@elizaos/core';

export const myPlugin: Plugin = {
  // Обязательные поля
  name: 'my-plugin',
  description: 'Описание плагина',

  // Необязательные компоненты
  actions: [...],      // Действия агента
  providers: [...],    // Поставщики данных
  services: [...],     // Сервисы
  models: {...},       // Модели ИИ
  routes: [...],       // HTTP роуты
  events: {...},       // Обработчики событий
  priority: 0,         // Приоритет загрузки

  // Инициализация
  async init(config, runtime) {
    // Логика инициализации
  }
};
```

## Основные компоненты

### Actions (Действия)
Действия агента - реакции на сообщения пользователя

```typescript
const myAction: Action = {
  name: 'MY_ACTION',
  similes: ['СИНОНИМ', 'АЛЬТЕРНАТИВА'],
  description: 'Что делает это действие',

  // Проверка условий
  validate: async (runtime, message, state) => {
    return message.content.text?.includes('ключевое слово');
  },

  // Выполнение
  handler: async (runtime, message, state, options, callback, responses) => {
    await callback({
      text: 'Ответ пользователю',
      action: 'MY_ACTION'
    });

    return {
      success: true,
      text: 'Действие выполнено',
      data: { /* дополнительные данные */ }
    };
  },

  // Примеры для обучения
  examples: [
    [
      { user: '{{user1}}', content: { text: 'Пример сообщения' } },
      { user: '{{agent}}', content: { text: 'Ожидаемый ответ' } }
    ]
  ]
};
```

### Services (Сервисы)
Долгоживущие компоненты с состоянием

```typescript
export class MyService extends Service {
  static serviceType = 'my-service';
  capabilityDescription = 'Описание сервиса';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('Starting MyService');
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
    logger.info('Stopping MyService');
  }
}
```

### Providers (Поставщики)
Поставщики данных для контекста

```typescript
const myProvider: Provider = {
  name: 'MY_PROVIDER',
  description: 'Поставляет данные для агента',

  get: async (runtime, message, state) => {
    return {
      text: 'Дополнительная информация',
      values: { /* структурированные данные */ },
      data: { /* метаданные */ }
    };
  }
};
```

## Интеграция с Telegram

### Обработка сообщений

```typescript
// Через Telegram Bot API
telegramService.bot.on('photo', async (ctx) => {
  const userId = ctx.from.id.toString();
  // Обработка фото
});

// Через события ElizaOS
plugin.events = {
  MESSAGE_RECEIVED: [
    async (params) => {
      // Обработка сообщения
    }
  ]
};
```

### Отправка клавиатур

```typescript
import { keyboard } from '../telegram-keyboards/KeyboardBuilder';

const markup = keyboard
  .builder()
  .callback('Кнопка 1', 'action_1', 0)
  .callback('Кнопка 2', 'action_2', 0)
  .buildInline();

await telegramService.bot.sendMessage(chatId, 'Выберите действие:', {
  reply_markup: markup
});
```

## Логирование

```typescript
import { logger } from '@elizaos/core';

// Разные уровни логирования
logger.info('Информация');
logger.warn('Предупреждение');
logger.error('Ошибка', { error });
logger.debug('Отладочная информация');

// Структурированное логирование
logger.info('[MY_PLUGIN] Выполняется действие', {
  userId,
  action: 'my-action',
  timestamp: Date.now()
});
```

## Обработка ошибок

```typescript
handler: async (runtime, message, state, options, callback) => {
  try {
    // Основная логика
    const result = await someOperation();

    return {
      success: true,
      text: 'Успех',
      data: result
    };
  } catch (error) {
    logger.error('[MY_PLUGIN] Ошибка:', error);

    // Сообщение пользователю
    await callback({
      text: 'Произошла ошибка. Попробуйте позже.'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

## Лучшие практики

### 1. Именование
- **Плагин**: kebab-case (`my-awesome-plugin`)
- **Действие**: UPPER_SNAKE_CASE (`MY_ACTION`)
- **Сервис**: PascalCase с суффиксом Service (`MyService`)
- **Провайдер**: UPPER_SNAKE_CASE с суффиксом PROVIDER (`MY_PROVIDER`)

### 2. Приоритеты
```typescript
// Приоритеты загрузки плагинов
priority: -1000  // Самый ранний (сервисы ядра)
priority: 0      // Обычные плагины
priority: 1000   // Поздние (плагины UI)
```

### 3. Зависимости
```typescript
const plugin: Plugin = {
  // Требуемые плагины
  dependencies: ['@elizaos/plugin-telegram', '@elizaos/plugin-sql'],

  // Зависимости для тестов
  testDependencies: ['@elizaos/plugin-bootstrap']
};
```

### 4. Конфигурация
```typescript
const configSchema = z.object({
  API_KEY: z.string().min(1, 'API_KEY required'),
  TIMEOUT: z.number().default(30000),
  DEBUG: z.boolean().default(false)
});

async init(config, runtime) {
  const validatedConfig = await configSchema.parseAsync(config);
  // Использование конфигурации
}
```

### 5. Типизация
```typescript
// Импортируйте типы из @elizaos/core
import type {
  IAgentRuntime,
  Memory,
  State,
  Action,
  Service,
  Provider
} from '@elizaos/core';
```

## Тестирование

См. [TESTING.md](./TESTING.md) для подробной информации о тестировании плагинов.

## Примеры

Смотрите папку `/examples/plugins/` для готовых примеров:
- `basic-provider` - простой провайдер
- `basic-scene` - простая сцена с визардом
- `basic-command` - простая команда
- `middleware` - пример middleware

## API Reference

См. [API.md](./API.md) для полного описания API плагинов.

## Архитектура

См. [ARCHITECTURE.md](./ARCHITECTURE.md) для понимания общей архитектуры.

## Конфигурация

См. [CONFIGURATION.md](./CONFIGURATION.md) для работы с конфигурацией.
