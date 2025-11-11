# 🧪 Vibee Telegram Bot Testing System

Профессиональная система тестирования для Telegram бота на базе ElizaOS.

## 📚 Структура

```
tests/
├── telegram.integration.test.ts   # Integration тесты
├── telegram.e2e.test.ts           # E2E тесты (полный цикл)
└── README.md                      # Эта документация

scripts/
├── test-bot-auto.ts               # Автоматический тестер
├── start-single.sh                # Single-instance запуск
└── stop.sh                        # Остановка бота

.env.test                          # Тестовое окружение
```

## 🚀 Быстрый старт

### 1. Настройка тестового окружения

Отредактируйте `.env.test`:

```bash
# Получите chat ID: отправьте сообщение боту и посмотрите логи
TEST_TELEGRAM_CHAT_ID=YOUR_CHAT_ID
```

### 2. Запуск тестов

```bash
# Все тесты
bun test

# Integration тесты (без запуска бота)
bun test:integration

# E2E тесты (запускают бота автоматически)
bun test:e2e

# Автоматический тестер (интерактивный)
bun test:auto

# Watch mode (перезапуск при изменениях)
bun test:watch

# С coverage
bun test:coverage
```

## 📋 Типы тестов

### Integration Tests

**Файл:** `telegram.integration.test.ts`

**Что тестирует:**
- ✅ Инициализацию TelegramService
- ✅ API вызовы к Telegram
- ✅ Отправку команд (/start, /menu, /help)
- ✅ Получение ответов
- ✅ Event emission и handling
- ✅ Performance (время ответа)
- ✅ Error handling

**Требования:**
- Бот должен быть запущен (`bun start`)
- `TEST_TELEGRAM_CHAT_ID` должен быть установлен

**Запуск:**
```bash
bun test:integration
```

### E2E Tests

**Файл:** `telegram.e2e.test.ts`

**Что тестирует:**
- ✅ Полный жизненный цикл бота (запуск → работа → остановка)
- ✅ Все команды (/start, /menu, /help)
- ✅ Обработку обычных сообщений
- ✅ Memory и контекст разговора
- ✅ Performance при множественных запросах
- ✅ Graceful shutdown
- ✅ Memory leaks

**Особенности:**
- Автоматически запускает и останавливает бота
- Изолированный тестовый environment
- Проверяет реальную работу в production условиях

**Запуск:**
```bash
bun test:e2e
```

### Автоматический тестер

**Файл:** `scripts/test-bot-auto.ts`

**Возможности:**
- 🤖 Отправляет команды боту автоматически
- 👀 Мониторит ответы в реальном времени
- 📊 Показывает результаты с цветным выводом
- ⏱️ Измеряет время ответа
- 🔄 Запускает тестовый сьют команд

**Использование:**
```bash
# Интерактивный режим
bun test:auto

# Сначала отправьте любое сообщение боту чтобы получить chat_id
# Затем тестер автоматически протестирует все команды
```

## 🎯 Best Practices

### 1. Изолированное тестирование

```typescript
// ✅ Good: Изолированный тест с моками
describe('Event Handling', () => {
  const runtime = createMockRuntime();

  it('should emit TELEGRAM_SLASH_START', () => {
    const mockHandler = vi.fn();
    runtime.on('TELEGRAM_SLASH_START', mockHandler);

    runtime.emitEvent('TELEGRAM_SLASH_START', { text: '/start' });

    expect(mockHandler).toHaveBeenCalled();
  });
});

// ❌ Bad: Зависимость от внешних сервисов без моков
it('should always respond', async () => {
  const response = await realBot.sendMessage('/start'); // Нестабильно!
  expect(response).toBeDefined();
});
```

### 2. Async Testing

```typescript
// ✅ Good: Правильный async/await с таймаутом
it('should respond within 10 seconds', async () => {
  const response = await client.waitForResponse(botUsername, 10000);
  expect(response).not.toBeNull();
}, 15000); // Timeout > ожидаемое время

// ❌ Bad: Без await и таймаута
it('should respond', () => {
  client.sendCommand('/start'); // Не дождется ответа!
  expect(response).toBeDefined();
});
```

### 3. Cleanup

```typescript
// ✅ Good: Cleanup после тестов
afterAll(async () => {
  await botProcess.stop();
  await client.clearUpdates();
});

// ❌ Bad: Процессы остаются висеть
afterAll(() => {
  // No cleanup - утечка ресурсов!
});
```

## 🔍 Debugging тестов

### Проверка логов

```bash
# Логи бота
tail -f /tmp/vibee-elizaos.log

# E2E тесты логи
tail -f /tmp/vibee-e2e-test.log
```

### Verbose режим

```bash
# С детальным выводом
LOG_LEVEL=debug bun test

# Только один тест
bun test --name "should respond to /start"
```

### Проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| `TEST_TELEGRAM_CHAT_ID not set` | Не настроен `.env.test` | Отправьте сообщение боту, найдите chat_id в логах |
| `409 Conflict` | Множественные инстансы бота | `bun stop && bun start` |
| `Timeout exceeded` | Бот не отвечает | Проверьте что бот запущен и работает |
| `Bot failed to start` | Ошибка при запуске | Проверьте логи: `tail -f /tmp/vibee-elizaos.log` |

## 📊 Coverage

```bash
# Запустить с coverage
bun test:coverage

# Coverage будет в:
# - Терминал: краткая сводка
# - coverage/: детальный HTML отчет
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TEST_TELEGRAM_CHAT_ID: ${{ secrets.TEST_TELEGRAM_CHAT_ID }}
```

## 🎓 Примеры тестов

### Test 1: Проверка команды /start

```typescript
it('should respond to /start command', async () => {
  // Отправляем команду
  await client.sendCommand(testChatId, '/start');

  // Ждем ответ (15 секунд таймаут)
  const response = await client.waitForResponse(botUsername, 15000);

  // Проверки
  expect(response).not.toBeNull();
  expect(response?.text).toBeDefined();
  expect(response?.text).toMatch(/привет|hello|welcome/i);
}, 30000);
```

### Test 2: Performance тест

```typescript
it('should respond within 10 seconds', async () => {
  const startTime = Date.now();

  await client.sendCommand(testChatId, '/start');
  const response = await client.waitForResponse(botUsername, 10000);

  const responseTime = Date.now() - startTime;

  expect(response).not.toBeNull();
  expect(responseTime).toBeLessThan(10000);
}, 20000);
```

### Test 3: Memory тест

```typescript
it('should maintain conversation context', async () => {
  // Сообщение 1: Представляемся
  await client.sendCommand(testChatId, 'Меня зовут Алексей');
  const response1 = await client.waitForResponse(botUsername, 15000);
  expect(response1).not.toBeNull();

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Сообщение 2: Проверяем память
  await client.sendCommand(testChatId, 'Как меня зовут?');
  const response2 = await client.waitForResponse(botUsername, 15000);

  expect(response2).not.toBeNull();
  expect(response2?.text).toMatch(/алексей/i);
}, 60000);
```

## 📖 Документация ElizaOS

Эта система тестирования основана на:
- [ElizaOS Testing Guide](https://docs.elizaos.ai/guides/test-a-project)
- [Twitter Plugin Testing](https://docs.elizaos.ai/plugin-registry/platform/twitter/testing-guide)
- [Project Testing Overview](https://docs.elizaos.ai/projects/overview#testing-projects)

## 🤝 Contributing

При добавлении новых фичей:
1. Напишите тесты ПЕРЕД реализацией (TDD)
2. Покройте и happy path, и error cases
3. Добавьте performance тесты для критических операций
4. Обновите эту документацию

---

**Готово для тестирования! 🚀**

Начните с: `bun test:auto`
