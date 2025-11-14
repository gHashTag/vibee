# 🌈 РАДУЖНЫЙ МОСТ - Микросервисная Архитектура

## Обзор

`selftestPlugin` - **изолированный микросервис** для автоматического самотестирования ElizaOS бота.

## Принципы Микросервисной Архитектуры

### 1️⃣ **Изоляция Модулей**

Каждый компонент - **независимый модуль**:

```
selftest/                    # ИЗОЛИРОВАННЫЙ СЕРВИС
├── index.ts                 # Service API (public interface)
├── base-test.ts             # Core abstraction
├── test-manager.ts          # Orchestration layer
├── services/                # Business logic layer
│   └── self-test-service.ts
├── actions/                 # Presentation layer
│   └── selftest-action.ts
└── tests/                   # Domain-specific implementations
    └── train-start-test.ts
```

**Границы модулей:**
- ❌ НЕТ зависимостей от других плагинов
- ❌ НЕТ прямого доступа к базе данных
- ✅ Все взаимодействия через `IAgentRuntime` (Dependency Injection)
- ✅ Публичный API через `index.ts`

### 2️⃣ **Single Responsibility Principle**

Каждый компонент отвечает за **ОДНУ** задачу:

| Компонент | Ответственность |
|-----------|-----------------|
| `BaseTest` | Абстракция для создания тестов |
| `TestManager` | Управление коллекцией тестов |
| `SelfTestService` | Оркестрация выполнения тестов |
| `selfTestAction` | Обработка команды `/selftest` |
| `TrainStartTest` | Конкретный тест `/train start` |

### 3️⃣ **Open/Closed Principle**

**Открыт для расширения, закрыт для модификации:**

```typescript
// ✅ Добавить новый тест - БЕЗ изменения базового кода
export class PhotoUploadTest extends BaseTest {
  id = 'photo-upload';
  name = 'Photo Upload';

  protected async run(runtime, chatId) {
    // Implementation
  }
}

// Регистрация в SelfTestService.registerTests():
this.testManager.registerTest(new PhotoUploadTest());
```

### 4️⃣ **Dependency Injection**

Все зависимости инжектятся через `IAgentRuntime`:

```typescript
async run(runtime: IAgentRuntime, chatId: string) {
  // ✅ DI: получаем зависимости через runtime
  const telegramClient = runtime.clients?.find(...);
  const photoCollectorService = runtime.getService('photoCollector');

  // ❌ НЕТ прямых импортов сервисов
  // ❌ НЕТ глобального состояния
}
```

### 5️⃣ **Interface Segregation**

**Минимальные публичные интерфейсы:**

```typescript
// index.ts - ЕДИНСТВЕННЫЙ публичный API
export { BaseTest } from './base-test';
export type { TestResult, TestConfig } from './base-test';
export { TestManager } from './test-manager';
export { SelfTestService } from './services/self-test-service';
export const selftestPlugin: Plugin = { ... };

// Всё остальное - private implementation
```

## Масштабируемость

### Горизонтальное Масштабирование

**Добавление новых тестов:**

```typescript
// 1. Создать файл tests/my-new-test.ts
export class MyNewTest extends BaseTest {
  id = 'my-test';
  name = 'My Test Name';
  description = 'What this test does';

  protected async run(runtime: IAgentRuntime, chatId: string) {
    // Тест логика
    return this.success('Test passed');
  }
}

// 2. Зарегистрировать в SelfTestService
private registerTests(): void {
  this.testManager.registerTest(new TrainStartTest());
  this.testManager.registerTest(new MyNewTest()); // ← Добавить
}

// 3. ГОТОВО! Тест автоматически появляется в /selftest
```

### Вертикальное Масштабирование

**Расширение возможностей:**

```typescript
// Добавить новый тип теста (например, performance test)
export abstract class PerformanceTest extends BaseTest {
  protected maxDuration: number = 1000;

  protected async run(runtime, chatId) {
    const start = Date.now();
    const result = await this.performanceTest(runtime, chatId);
    const duration = Date.now() - start;

    if (duration > this.maxDuration) {
      return this.failure(`Too slow: ${duration}ms > ${this.maxDuration}ms`);
    }

    return result;
  }

  protected abstract performanceTest(runtime, chatId): Promise<any>;
}
```

## Микросервисные Паттерны

### 1. Service Registry

`TestManager` - **Service Registry** для тестов:

```typescript
class TestManager {
  private tests: Map<string, BaseTest> = new Map();

  registerTest(test: BaseTest): void {
    this.tests.set(test.id, test);
  }

  getTest(testId: string): BaseTest | undefined {
    return this.tests.get(testId);
  }
}
```

### 2. Circuit Breaker

`BaseTest` с **timeout protection**:

```typescript
private async runWithTimeout(runtime, chatId) {
  const timeout = this.config.timeout || 10000;

  return Promise.race([
    this.run(runtime, chatId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    ),
  ]);
}
```

### 3. Observer Pattern

`SelfTestService` собирает **history** выполнений:

```typescript
private testHistory: TestResult[] = [];

async runAllTests(runtime: IAgentRuntime): Promise<TestResult[]> {
  const results = await this.testManager.runAll(runtime, this.testChatId);

  // History для анализа и мониторинга
  this.testHistory.push(...results);

  return results;
}
```

## Интеграция с ElizaOS

### Plugin Interface

```typescript
export const selftestPlugin: Plugin = {
  name: 'selftest',
  description: '🌈 РАДУЖНЫЙ МОСТ - Self-testing microservice',

  services: [SelfTestService],  // Микросервис
  actions: [selfTestAction],     // API endpoint
};
```

### Service Lifecycle

```typescript
class SelfTestService extends Service {
  static serviceType = 'selftest';

  // Lifecycle hooks
  async initialize(runtime: IAgentRuntime): Promise<void> { }
  static async start(runtime: IAgentRuntime): Promise<SelfTestService> { }
  async stop(): Promise<void> { }
  async cleanup(): Promise<void> { }
}
```

## Тестирование

### Unit Tests

```typescript
// Каждый компонент тестируется изолированно
describe('TestManager', () => {
  test('регистрирует тесты', () => {
    const manager = new TestManager();
    const test = new TrainStartTest();

    manager.registerTest(test);

    expect(manager.getTest('train-start')).toBe(test);
  });
});
```

### Integration Tests

```typescript
// Тестируем взаимодействие компонентов
describe('SelfTestService Integration', () => {
  test('создаётся и инициализируется', async () => {
    const service = new SelfTestService(mockRuntime);
    await service.initialize(mockRuntime);

    const stats = service.getStats();
    expect(stats.total).toBeGreaterThan(0);
  });
});
```

## Метрики и Мониторинг

### Test Results

```typescript
export type TestResult = {
  testName: string;
  testId: string;
  passed: boolean;
  message: string;
  timestamp: number;
  duration: number;  // Performance metric
  details?: Record<string, any>;
};
```

### Service Stats

```typescript
getStats() {
  return {
    total: this.testManager.getAllTests().length,
    tests: this.testManager.getAllTests().map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
  };
}
```

## Best Practices

### ✅ DO

- Используй DI через `IAgentRuntime`
- Наследуй `BaseTest` для новых тестов
- Добавляй детальные `TestResult.details`
- Логируй через `elizaLogger`
- Используй timeout для всех тестов

### ❌ DON'T

- Не создавай прямые зависимости между тестами
- Не используй глобальное состояние
- Не импортируй напрямую другие плагины
- Не блокируй async операции
- Не забывай про error handling

## Roadmap

### Phase 1: Foundation ✅
- [x] BaseTest abstraction
- [x] TestManager
- [x] SelfTestService
- [x] Integration tests

### Phase 2: Expansion
- [ ] Performance tests
- [ ] Photo upload test
- [ ] Train cancel test
- [ ] Async test execution
- [ ] Test parallelization

### Phase 3: Advanced
- [ ] Test fixtures
- [ ] Test mocking framework
- [ ] Coverage reporting
- [ ] CI/CD integration
- [ ] Auto-healing tests

## Заключение

`selftestPlugin` демонстрирует **микросервисную архитектуру**:

- 🎯 **Изоляция** - независимый модуль
- 🔧 **Масштабируемость** - легко добавлять тесты
- 🏗️ **SOLID принципы** - чистая архитектура
- 🧪 **Тестируемость** - unit + integration tests
- 📊 **Наблюдаемость** - метрики и логи

**Готов к production и дальнейшему расширению!** 🚀
