# 🌈 РАДУЖНЫЙ МОСТ - SelfTest Plugin

Модульный микросервис автоматического самотестирования для ElizaOS.

## Быстрый Старт

### Установка

```typescript
// src/index.ts
import { selftestPlugin } from './selftest/index.ts';

export const projectAgent: ProjectAgent = {
  character,
  plugins: [
    // ... другие плагины
    selftestPlugin,  // ← Добавить
  ],
};
```

### Использование

**Вариант 1: Ручное тестирование**

В Telegram:
```
/selftest
```

Бот автоматически:
1. Запустит все зарегистрированные тесты
2. Проверит работоспособность системы
3. Вернёт детальный отчёт

**Вариант 2: Полностью Автономный Режим (рекомендуется!)**

Добавьте в `.env`:
```bash
SELFTEST_AUTONOMOUS=true
```

Бот будет **САМ** тестировать себя:
- 🚀 **Startup Health Check** - тесты сразу при старте (через 10 сек)
- ⏰ **Scheduled Tests** - каждые 30 минут
- 💡 **Improvement Cycle** - анализ и рекомендации каждый час
- 📨 **Auto Reports** - отчёты в Telegram только при проблемах

**БЕЗ участия человека! 🌈 РАДУЖНЫЙ МОСТ работает сам!**

## Создание Нового Теста

### Шаг 1: Создать файл теста

```typescript
// src/selftest/tests/my-new-test.ts
import { IAgentRuntime } from '@elizaos/core';
import { BaseTest, TestResult } from '../base-test';

export class MyNewTest extends BaseTest {
  id = 'my-test';
  name = 'My Test Name';
  description = 'Description of what this test does';

  protected async run(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'>> {

    // Получить зависимости через DI
    const myService = runtime.getService('my-service');

    if (!myService) {
      return this.failure('My service not found');
    }

    // Выполнить тест
    const result = await myService.doSomething();

    // Вернуть результат
    if (result.success) {
      return this.success('Test passed!', {
        someDetail: result.data,
      });
    } else {
      return this.failure('Test failed', {
        error: result.error,
      });
    }
  }
}
```

### Шаг 2: Зарегистрировать тест

```typescript
// src/selftest/services/self-test-service.ts

// Импортировать
import { MyNewTest } from '../tests/my-new-test';

// Зарегистрировать в registerTests()
private registerTests(): void {
  this.testManager.registerTest(new TrainStartTest());
  this.testManager.registerTest(new MyNewTest());  // ← Добавить
}
```

### Шаг 3: Готово!

Тест автоматически появится в `/selftest`.

## API Reference

### BaseTest

Абстрактный класс для создания тестов.

```typescript
abstract class BaseTest {
  abstract id: string;           // Уникальный ID
  abstract name: string;         // Название теста
  abstract description: string;  // Описание

  // Конфигурация
  protected config: TestConfig = {
    timeout: 10000,      // Timeout в ms
    retries: 0,          // Количество retry
    skipOnFailure: false // Skip следующих тестов при failure
  };

  // Абстрактный метод (нужно реализовать)
  protected abstract run(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<TestResult>;

  // Хелперы
  protected success(message: string, details?: any): TestResult;
  protected failure(message: string, details?: any): TestResult;
}
```

### TestResult

```typescript
type TestResult = {
  testName: string;
  testId: string;
  passed: boolean;
  message: string;
  timestamp: number;
  duration: number;  // ms
  details?: Record<string, any>;
};
```

### SelfTestService

```typescript
class SelfTestService {
  // Установить chat_id для тестирования
  setTestChatId(chatId: string): void;

  // Запустить все тесты
  runAllTests(runtime: IAgentRuntime): Promise<TestResult[]>;

  // Запустить конкретный тест
  runTest(testId: string, runtime: IAgentRuntime): Promise<TestResult>;

  // Получить статистику
  getStats(): { total: number; tests: Array<{...}> };

  // Получить историю
  getTestHistory(): TestResult[];
}
```

## Примеры

### Пример 1: Простой тест

```typescript
export class HealthCheckTest extends BaseTest {
  id = 'health-check';
  name = 'Health Check';
  description = 'Checks if bot is responding';

  protected async run(runtime, chatId) {
    // Просто проверяем, что runtime доступен
    if (runtime) {
      return this.success('Bot is healthy');
    }
    return this.failure('Bot not responding');
  }
}
```

### Пример 2: Тест с зависимостью

```typescript
export class DatabaseTest extends BaseTest {
  id = 'database';
  name = 'Database Connection';
  description = 'Tests database connectivity';

  protected async run(runtime, chatId) {
    const dbAdapter = runtime.databaseAdapter;

    if (!dbAdapter) {
      return this.failure('Database adapter not found');
    }

    try {
      // Попробовать выполнить запрос
      const result = await dbAdapter.getRoom(chatId);

      return this.success('Database connected', {
        roomId: result?.id,
      });
    } catch (error) {
      return this.failure(`Database error: ${error.message}`);
    }
  }
}
```

### Пример 3: Асинхронный тест

```typescript
export class AsyncTest extends BaseTest {
  id = 'async-test';
  name = 'Async Operation';
  description = 'Tests async operations';

  protected config = {
    timeout: 15000,  // Увеличенный timeout
  };

  protected async run(runtime, chatId) {
    // Долгая операция
    await new Promise(resolve => setTimeout(resolve, 5000));

    return this.success('Async operation completed', {
      duration: '5 seconds',
    });
  }
}
```

### Пример 4: Тест с retry

```typescript
export class FlakeyTest extends BaseTest {
  id = 'flakey';
  name = 'Flakey Test';
  description = 'Test with retry on failure';

  protected config = {
    retries: 3,  // Retry до 3 раз
  };

  private attempts = 0;

  protected async run(runtime, chatId) {
    this.attempts++;

    // Симулируем случайный failure
    if (Math.random() > 0.7 || this.attempts >= 3) {
      return this.success(`Passed on attempt ${this.attempts}`);
    }

    return this.failure(`Failed attempt ${this.attempts}`);
  }
}
```

## Интеграционное Тестирование

```typescript
// src/__tests__/selftest-integration.test.ts
import { describe, test, expect } from 'bun:test';
import { selftestPlugin } from '../selftest/index.ts';

describe('SelfTest Plugin', () => {
  test('плагин загружается', () => {
    expect(selftestPlugin).toBeDefined();
    expect(selftestPlugin.name).toBe('selftest');
  });

  test('содержит все компоненты', () => {
    expect(selftestPlugin.services).toContain(SelfTestService);
    expect(selftestPlugin.actions?.length).toBeGreaterThan(0);
  });
});
```

## Архитектура

См. [ARCHITECTURE.md](./ARCHITECTURE.md) для детального описания микросервисной архитектуры.

**Ключевые принципы:**
- 🎯 Изоляция модулей
- 🔧 Dependency Injection
- 🏗️ SOLID principles
- 🧪 100% тестируемость
- 📊 Observability

## Troubleshooting

### Тест не регистрируется

**Проблема:** Тест не появляется в `/selftest`

**Решение:**
1. Проверь, что тест импортирован в `self-test-service.ts`
2. Проверь, что `registerTest()` вызван в `registerTests()`
3. Проверь логи: `grep "Registered test" /tmp/vibee-*.log`

### Timeout ошибки

**Проблема:** Тест падает с `Timeout after Xms`

**Решение:**
Увеличь timeout в конфигурации:
```typescript
protected config = {
  timeout: 30000,  // 30 секунд
};
```

### Telegram client not found

**Проблема:** `Telegram client not found`

**Решение:**
Добавь ожидание клиента:
```typescript
let telegramClient = null;
for (let i = 0; i < 10; i++) {
  telegramClient = runtime.clients?.find(...);
  if (telegramClient) break;
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

## Roadmap

- [x] Базовая инфраструктура
- [x] TrainStartTest
- [x] Интеграционные тесты
- [x] Документация
- [ ] PhotoUploadTest
- [ ] TrainCancelTest
- [ ] Performance tests
- [ ] Test parallelization
- [ ] CI/CD integration

## Contributing

1. Создай новый тест в `tests/`
2. Наследуй `BaseTest`
3. Реализуй метод `run()`
4. Зарегистрируй в `SelfTestService`
5. Добавь integration test
6. Submit PR

## License

Часть проекта Vibee (ElizaOS).
