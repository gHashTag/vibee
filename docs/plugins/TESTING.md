# Тестирование плагинов

## Введение

Тестирование плагинов Vibee критически важно для обеспечения надежности и стабильности. Документ описывает лучшие практики, инструменты и подходы к тестированию.

## Типы тестов

### 1. Модульные тесты (Unit Tests)
- Тестирование отдельных компонентов в изоляции
- Быстрое выполнение
- Покрытие функций, классов, утилит

### 2. Интеграционные тесты (Integration Tests)
- Тестирование взаимодействия между компонентами
- Тестирование плагинов в сборе
- Проверка интеграции с внешними сервисами

### 3. E2E тесты (End-to-End Tests)
- Тестирование полного пользовательского сценария
- Тестирование через реальный Telegram
- Использование Rainbow Bridge

## Структура тестов

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── my-plugin.test.ts
│   │   └── utils.test.ts
│   ├── integration/
│   │   ├── plugin-integration.test.ts
│   │   └── telegram-integration.test.ts
│   └── e2e/
│       ├── telegram-bot.test.ts
│       └── rainbow-bridge.test.ts
└── my-plugin.ts
```

## Инструменты тестирования

### Основные инструменты

```bash
# Bun (рекомендуется)
npm install -D bun

# Альтернативы
npm install -D jest @types/jest ts-jest
# или
npm install -D vitest
```

### Конфигурация bun test

```typescript
// bun.test.ts
import { expect, test } from 'bun:test';

export function expectToBeDefined<T>(value: T | undefined | null): asserts value is T {
  expect(value).toBeDefined();
}

export function expectToBeString(value: unknown): asserts value is string {
  expect(typeof value).toBe('string');
}
```

## Модульное тестирование

### Тестирование Action

```typescript
import { describe, expect, it, beforeEach, spyOn } from 'bun:test';
import { myAction } from '../my-plugin';

describe('MyAction', () => {
  let mockRuntime: any;
  let mockMessage: any;

  beforeEach(() => {
    // Создаем мок runtime
    mockRuntime = {
      getService: (serviceType: string) => null,
      getSetting: (key: string) => null
    };

    // Создаем тестовое сообщение
    mockMessage = {
      id: 'test-message-1',
      userId: 'user-123',
      roomId: 'room-456',
      content: {
        text: 'test keyword'
      },
      createdAt: Date.now()
    };
  });

  describe('validate', () => {
    it('should return true for matching keyword', async () => {
      const result = await myAction.validate(mockRuntime, mockMessage, {});

      expect(result).toBe(true);
    });

    it('should return false for non-matching text', async () => {
      mockMessage.content.text = 'different text';
      const result = await myAction.validate(mockRuntime, mockMessage, {});

      expect(result).toBe(false);
    });

    it('should handle missing text gracefully', async () => {
      mockMessage.content.text = undefined;
      const result = await myAction.validate(mockRuntime, mockMessage, {});

      expect(result).toBe(false);
    });
  });

  describe('handler', () => {
    it('should execute successfully', async () => {
      const callback = spyOn({} as any, 'call');

      const result = await myAction.handler(
        mockRuntime,
        mockMessage,
        {},
        {},
        callback,
        []
      );

      expect(callback).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.text).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const callback = spyOn({} as any, 'call');

      // Мокаем ошибку в обработчике
      spyOn(mockRuntime, 'getService').mockReturnValue({
        mightFail: () => Promise.reject(new Error('Test error'))
      });

      const result = await myAction.handler(
        mockRuntime,
        mockMessage,
        {},
        {},
        callback,
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Тестирование Service

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { MyService } from '../my-plugin';

describe('MyService', () => {
  let service: MyService;
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {
      getSetting: (key: string) => null,
      getService: (serviceType: string) => null
    };
    service = new MyService(mockRuntime);
  });

  afterEach(() => {
    // Очистка после теста
    service.stop();
  });

  describe('start', () => {
    it('should create service instance', async () => {
      const startedService = await MyService.start(mockRuntime);

      expect(startedService).toBeInstanceOf(MyService);
    });

    it('should initialize correctly', async () => {
      const startedService = await MyService.start(mockRuntime);

      // Проверяем, что сервис инициализирован
      expect(startedService).toBeDefined();
    });
  });

  describe('operation', () => {
    it('should perform operation successfully', async () => {
      const result = await service.someOperation();

      expect(result).toBeDefined();
    });

    it('should handle errors', async () => {
      // Мокаем ошибку
      spyOn(service, 'someOperation').mockRejectedValue(new Error('Test error'));

      await expect(service.someOperation()).rejects.toThrow('Test error');
    });
  });

  describe('stop', () => {
    it('should stop service', async () => {
      await service.stop();

      // Проверяем, что ресурсы очищены
      expect(service).toBeDefined();
    });
  });
});
```

### Тестирование Provider

```typescript
import { describe, expect, it } from 'bun:test';
import { myProvider } from '../my-plugin';

describe('MyProvider', () => {
  it('should return data correctly', async () => {
    const mockRuntime: any = {};
    const mockMessage: any = {
      userId: 'user-123',
      content: { text: 'test' }
    };

    const result = await myProvider.get(mockRuntime, mockMessage, {});

    expect(result.text).toBeDefined();
    expect(result.values).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it('should handle missing data gracefully', async () => {
    const mockRuntime: any = {
      getService: () => null
    };
    const mockMessage: any = {
      userId: 'user-123',
      content: { text: 'test' }
    };

    const result = await myProvider.get(mockRuntime, mockMessage, {});

    expect(result).toBeDefined();
  });
});
```

## Интеграционные тесты

### Тестирование плагина целиком

```typescript
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { myPlugin } from '../my-plugin';
import { createTestRuntime } from './test-utils';

describe('MyPlugin Integration', () => {
  let runtime: any;

  beforeAll(async () => {
    runtime = createTestRuntime();
    await myPlugin.init(myPlugin.config, runtime);
  });

  afterAll(async () => {
    // Очистка
    const service = runtime.getService('my-service');
    if (service) {
      await service.stop();
    }
  });

  it('should initialize plugin', async () => {
    expect(runtime.getService('my-service')).toBeDefined();
  });

  it('should register actions', async () => {
    const action = runtime.actions.get('MY_ACTION');
    expect(action).toBeDefined();
  });

  it('should register providers', async () => {
    const provider = runtime.providers.get('MY_PROVIDER');
    expect(provider).toBeDefined();
  });

  it('should handle full workflow', async () => {
    const message = {
      id: 'test-1',
      userId: 'user-1',
      roomId: 'room-1',
      content: { text: 'keyword' },
      createdAt: Date.now()
    };

    const state = {};
    const callback = {
      called: false,
      data: null,
      call: function (data: any) {
        this.called = true;
        this.data = data;
      }
    };

    const action = runtime.actions.get('MY_ACTION');
    if (action) {
      await action.handler(runtime, message, state, {}, callback, []);

      expect(callback.called).toBe(true);
      expect(callback.data.text).toBeDefined();
    }
  });
});
```

### Тест утилиты

```typescript
// src/__tests__/integration/test-utils.ts
import type { IAgentRuntime } from '@elizaos/core';

export const createTestRuntime = (): IAgentRuntime => {
  const services = new Map();
  const actions = new Map();
  const providers = new Map();

  const mockRuntime: IAgentRuntime = {
    character: {
      name: 'Test Character',
      system: 'Test system',
      bio: [],
      topics: [],
      plugins: [],
      settings: { secrets: {} }
    },
    plugins: [],
    models: {},
    state: { values: {}, data: {}, context: '' },

    getSetting: (key: string) => null,
    getSecret: (key: string) => undefined,
    db: {
      get: async () => null,
      set: async () => true,
      delete: async () => true,
      update: async () => true,
      getKeys: async () => [],
      getEntries: async () => [],
      count: async () => 0,
      clear: async () => {}
    },

    getService: (serviceType: string) => services.get(serviceType) || null,
    registerService: (serviceType: string, service: any) => {
      services.set(serviceType, service);
    },
    getServices: () => services,

    actions,
    evaluators: new Map(),
    providers,

    telegram: null,
    discord: null
  };

  return mockRuntime;
};

export const createTestMessage = (overrides: Partial<any> = {}) => ({
  id: 'test-' + Math.random().toString(36).substring(7),
  userId: 'user-123',
  roomId: 'room-456',
  content: {
    text: 'test message'
  },
  createdAt: Date.now(),
  ...overrides
});

export const createTestState = (overrides: Partial<any> = {}) => ({
  values: {},
  data: {},
  context: '',
  ...overrides
});
```

## Тестирование с моками

### Мок сервисов

```typescript
import { spyOn } from 'bun:test';

// Мок внешнего API
const mockExternalAPI = {
  getData: () => Promise.resolve({ status: 'ok' }),
  postData: (data: any) => Promise.resolve({ success: true })
};

// Использование в тесте
spyOn(mockExternalAPI, 'getData').mockReturnValue(Promise.resolve({ status: 'ok' }));

const result = await myService.getExternalData();
expect(result.status).toBe('ok');
```

### Мок Telegram

```typescript
import { spyOn } from 'bun:test';

const mockTelegram = {
  bot: {
    sendMessage: spyOn({} as any, 'sendMessage').mockResolvedValue({ message_id: 1 }),
    sendPhoto: spyOn({} as any, 'sendPhoto').mockResolvedValue({ message_id: 2 })
  }
};

// В тесте
const telegramService = runtime.getService('telegram');
if (telegramService) {
  telegramService.bot = mockTelegram.bot;

  await myAction.handler(runtime, message, state, {}, callback, []);

  expect(mockTelegram.bot.sendMessage).toHaveBeenCalled();
}
```

### Мок fetch

```typescript
// Тестирование API вызовов
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = spyOn({} as any, 'fetch').mockImplementation((url, options) => {
    if (url.includes('/api/test')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});
```

## E2E тестирование

### Rainbow Bridge

Rainbow Bridge позволяет тестировать бота через реальный Telegram:

```bash
# Запуск критичных тестов
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# Все тесты
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json
```

### Сценарий теста

```json
{
  "scenarios": [
    {
      "name": "Test Photo Upload",
      "critical": true,
      "steps": [
        {
          "action": "send_photo",
          "photo_path": "tests/fixtures/test-face.jpg",
          "expected_response": {
            "contains": "Фото получено"
          }
        },
        {
          "action": "wait_for_callback",
          "callback_data": "train_start",
          "timeout": 30000
        },
        {
          "action": "click_callback",
          "callback_data": "train_start",
          "expected_response": {
            "contains": "Обучение начато"
          }
        }
      ]
    }
  ]
}
```

### E2E тест с Jest/Puppeteer

```typescript
// e2e/telegram-bot.test.ts
import puppeteer from 'puppeteer';

describe('Telegram Bot E2E', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should respond to /start command', async () => {
    // Открываем Telegram Web
    await page.goto('https://web.telegram.org/k/#@your_bot_username');

    // Вводим /start
    await page.type('.composer textarea', '/start');
    await page.keyboard.press('Enter');

    // Проверяем ответ
    const response = await page.waitForSelector('.message', { timeout: 5000 });
    const text = await response?.evaluate(el => el.textContent);

    expect(text).toContain('Добро пожаловать');
  });
});
```

## Покрытие кода

### Istanbul/nyc

```bash
npm install -D nyc

# Запуск с покрытием
npm run test:coverage
```

### Конфигурация

```json
{
  "nyc": {
    "extends": "@istanbuljs/nyc-config-babel",
    "all": true,
    "check-coverage": true,
    "skip-full": false,
    "exclude": [
      "src/**/*.d.ts",
      "src/__tests__/**"
    ],
    "include": [
      "src/**/*.ts"
    ],
    "statements": 90,
    "branches": 85,
    "functions": 90,
    "lines": 90
  }
}
```

## Автоматизация тестов

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run type check
        run: bun run type-check

      - name: Run linter
        run: bun run lint

      - name: Run unit tests
        run: bun test

      - name: Run integration tests
        run: bun test src/__tests__/integration

      - name: Generate coverage report
        run: bun run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check && npm test"
    }
  },
  "lint-staged": {
    "*.ts": [
      "prettier --write",
      "eslint --fix",
      "git add"
    ]
  }
}
```

## Файксчиры

### Тестовые данные

```
tests/
├── fixtures/
│   ├── images/
│   │   ├── test-face.jpg
│   │   └── test-photo.png
│   ├── audio/
│   │   └── test-voice.ogg
│   └── data/
│       └── test-dataset.json
└── mocks/
    ├── telegram/
    └── api/
```

### Создание файксчиров

```typescript
// tests/utils/create-fixture.ts
import fs from 'fs';
import path from 'path';

export const createFixture = (name: string, data: any) => {
  const fixturesDir = path.resolve(__dirname, '../fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const filePath = path.join(fixturesDir, name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return filePath;
};

export const getFixture = (name: string): any => {
  const filePath = path.resolve(__dirname, '../fixtures', name);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
};
```

## Лучшие практики тестирования

### 1. Тестируйте поведение, а не реализацию

```typescript
// ✅ Хорошо: Тестируем поведение
it('should show menu when requested', async () => {
  await myAction.handler(runtime, message, state, {}, callback, []);

  expect(callback).toHaveBeenCalledWith({
    text: expect.stringContaining('меню')
  });
});

// ❌ Плохо: Тестируем внутреннюю реализацию
it('should call showMenu function', async () => {
  const showMenuSpy = spyOn(service, 'showMenu');
  await myAction.handler(runtime, message, state, {}, callback, []);
  expect(showMenuSpy).toHaveBeenCalled();
});
```

### 2. Используйте descriptive test names

```typescript
// ✅ Хорошо
it('should return error when API key is missing', async () => {
  // Тест
});

// ❌ Плохо
it('should return error', async () => {
  // Тест
});
```

### 3. Один тест - одна проверка

```typescript
// ✅ Хорошо
it('should validate message with keyword', async () => {
  const result = await myAction.validate(runtime, message, {});
  expect(result).toBe(true);
});

it('should reject message without keyword', async () => {
  message.content.text = 'no keyword';
  const result = await myAction.validate(runtime, message, {});
  expect(result).toBe(false);
});

// ❌ Плохо
it('should validate message correctly', async () => {
  const result = await myAction.validate(runtime, message, {});
  expect(result).toBe(true);

  message.content.text = 'no keyword';
  const result2 = await myAction.validate(runtime, message, {});
  expect(result2).toBe(false);
});
```

### 4. Подготовка и очистка

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService(mockRuntime);
  });

  afterEach(async () => {
    await service.cleanup();
    service = null;
  });
});
```

### 5. Моки и стабы

```typescript
// ✅ Используйте моки для внешних зависимостей
beforeEach(() => {
  // Мокаем API
  spyOn(apiClient, 'fetch').mockResolvedValue({ data: 'test' });

  // Мокаем файловую систему
  spyOn(fs, 'readFile').mockResolvedValue('test data');
});
```

### 6. Тестируйте граничные случаи

```typescript
it('should handle empty array', async () => {
  const result = await myService.processItems([]);
  expect(result).toEqual([]);
});

it('should handle large array', async () => {
  const largeArray = new Array(10000).fill('item');
  const result = await myService.processItems(largeArray);
  expect(result).toHaveLength(10000);
});

it('should handle null/undefined values', async () => {
  const result = await myService.processItems([null, undefined, 'item']);
  expect(result).toBeDefined();
});
```

### 7. Тестируйте ошибки

```typescript
it('should throw error for invalid input', async () => {
  await expect(myService.invalidOperation('bad')).rejects.toThrow('Invalid input');
});

it('should handle timeout gracefully', async () => {
  spyOn(apiClient, 'fetch').mockImplementation(
    () => new Promise(resolve => setTimeout(resolve, 10000))
  );

  const promise = myService.fetchData();

  await expect(promise).rejects.toThrow('Timeout');
});
```

## Проверка качества тестов

### Мутационное тестирование

```bash
npm install -D stryker-cli

# Запуск
npx stryker run
```

### Статический анализ тестов

```bash
# Проверка покрытия утверждений
npm install -D chai-exclude

# Использование
const result = await service.doSomething();
expect(result).to.be.excluded(['timestamp', 'id']);
```

## Документирование тестов

### JSDoc для тестов

```typescript
/**
 * Тестирует валидацию Action
 *
 * Валидация должна возвращать true только для сообщений,
 * содержащих ключевое слово "help" или "помощь"
 *
 * @group Validation
 * @group Action
 * @expectedResult Возвращает boolean
 */
describe('MyAction validate', () => {
  // Тесты
});
```

### Тестовые примеры

```typescript
describe('Examples from documentation', () => {
  it('matches example from README', async () => {
    // Копируем пример из README
    const message = {
      content: { text: 'help me' },
      // ...
    };

    const action = runtime.actions.get('HELP');
    const result = await action!.handler(runtime, message, {}, {}, () => {}, []);

    expect(result.success).toBe(true);
  });
});
```

## Непрерывная интеграция

### Отчеты о покрытии

```typescript
// Скрипт генерации отчета
// scripts/coverage-report.js
import { exec } from 'child_process';

exec('bun test --coverage', (error, stdout, stderr) => {
  console.log(stdout);
  if (error) {
    console.error(error);
  }
});
```

### Бейджи качества

```markdown
<!-- Добавьте в README -->
[![Coverage Status](https://coveralls.io/repos/github/user/repo/badge.svg)](https://coveralls.io/github/user/repo)
[![Tests](https://github.com/user/repo/workflows/Tests/badge.svg)](https://github.com/user/repo/actions)
```

## Часто задаваемые вопросы

### Q: Как тестировать приватные методы?

A: Не тестируйте приватные методы напрямую. Тестируйте публичное поведение, которое использует эти методы.

### Q: Сколько тестов нужно писать?

A: Столько, чтобы обеспечить уверенность в работе кода. Ориентируйтесь на 80-90% покрытие кода.

### Q: Нужно ли тестировать простые getter/setter?

A: Нет, тестируйте только логику. Getters/setters покрываются интеграционными тестами.

### Q: Как тестировать асинхронный код?

A: Используйте `async/await` и `expect(...).rejects` для ошибок.

## Заключение

Качественное тестирование плагинов обеспечивает:
- Надежность и стабильность
- Предотвращение регрессий
- Уверенность при рефакторинге
- Документирование ожидаемого поведения

Следуйте best practices и пишите тесты регулярно, а не в конце разработки.

Более подробную информацию см. в [DEVELOPMENT.md](./DEVELOPMENT.md) и [ARCHITECTURE.md](./ARCHITECTURE.md).
