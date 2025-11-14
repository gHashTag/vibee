# Руководство по тестированию Scene плагинов

## Обзор

Данная директория содержит тесты для всех Scene плагинов. Тесты написаны с использованием Jest и проверяют функциональность каждой сцены.

## Структура тестов

```
tests/
├── balance-scene.test.ts      # Тесты для сцены баланса
├── invite-scene.test.ts       # Тесты для сцены приглашений
├── scenes-plugin.test.ts      # Тесты для основного plugin сервиса
└── README.md                  # Этот файл
```

## Запуск тестов

```bash
# Все тесты Scene плагинов
npm test -- src/plugins/scenes/tests/

# Конкретный файл
npm test -- balance-scene.test.ts

# С покрытием
npm test -- --coverage src/plugins/scenes/tests/
```

## Покрытие тестами

### Balance Scene (balance-scene.test.ts)
- ✅ Отображение баланса при входе
- ✅ Показ информации о подписке
- ✅ Пополнение баланса (различные суммы)
- ✅ История операций с фильтрами
- ✅ Управление подпиской
- ✅ Вывод средств
- ✅ Произвольная сумма пополнения
- ✅ Функция getUserBalance

### Invite Scene (invite-scene.test.ts)
- ✅ Главное меню приглашений
- ✅ Создание пригласительной ссылки
- ✅ Приглашение по username
- ✅ Показ реферального кода
- ✅ Статистика приглашений
- ✅ Программа лояльности
- ✅ Валидация username
- ✅ Генерация уникального кода
- ✅ Функция getInviteStats

### Scenes Plugin (scenes-plugin.test.ts)
- ✅ Инициализация сервиса
- ✅ Ожидание TelegramService
- ✅ Регистрация всех сцен
- ✅ Регистрация команд
- ✅ Жизненный цикл (start/stop/cleanup)
- ✅ Статический метод start

## Примеры тестов

### Простой тест сцены
```typescript
describe('MyScene', () => {
  let scene: Scenes.WizardScene<SceneContext>;

  beforeEach(() => {
    scene = createMyScene();
  });

  it('должен показать главный экран', async () => {
    const ctx = createMockContext() as SceneContext;

    await scene.stepHandlers[0](ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Заголовок сообщения')
    );
  });
});
```

### Тест с мокированием зависимостей
```typescript
it('должен получить данные из базы', async () => {
  const mockData = { rubles: 500, stars: 250 };
  jest.spyOn(require('../module'), 'getData')
    .mockResolvedValue(mockData);

  const ctx = createMockContext() as SceneContext;
  await scene.stepHandlers[0](ctx);

  expect(ctx.reply).toHaveBeenCalledWith(
    expect.stringContaining('500')
  );
});
```

### Тест валидации ввода
```typescript
it('должен отклонить некорректные данные', async () => {
  const ctx = createMockContext() as SceneContext;
  ctx.message = { text: 'invalid' } as any;

  await scene.stepHandlers[1](ctx);

  expect(ctx.reply).toHaveBeenCalledWith(
    expect.stringContaining('❌ Некорректные данные')
  );
});
```

## Mock-объекты

### Создание Mock Context
```typescript
function createMockContext(): Partial<SceneContext> {
  return {
    from: { id: '12345', username: 'testuser' },
    reply: jest.fn(),
    wizard: {
      next: jest.fn(),
      back: jest.fn(),
      selectStep: jest.fn(),
    },
    scene: {
      enter: jest.fn(),
      leave: jest.fn(),
      current: { id: 'testScene' },
    },
    session: {
      wizardData: {},
    },
  };
}
```

### Мокирование Telegraf API
```typescript
// Мок для telegraf scenes
jest.mock('telegraf', () => ({
  Scenes: {
    WizardScene: jest.fn().mockImplementation((id, ...handlers) => ({
      id,
      stepHandlers: handlers,
    })),
    Stage: jest.fn().mockImplementation((scenes) => ({
      middleware: jest.fn().mockReturnValue(() => {}),
    })),
  },
  Markup: {
    inlineKeyboard: jest.fn().mockImplementation((buttons) => ({
      reply_markup: { inline_keyboard: buttons },
    })),
    button: {
      callback: jest.fn().mockImplementation((text, data) => ({ text, callback_data: data })),
    },
  },
}));
```

## Лучшие практики

### 1. Используйте beforeEach для инициализации
```typescript
beforeEach(() => {
  scene = createMyScene();
  jest.clearAllMocks();
});
```

### 2. Тестируйте каждый шаг сцены
```typescript
it('должен перейти к следующему шагу', async () => {
  const ctx = createMockContext() as SceneContext;
  ctx.match = ['action'];

  await scene.stepHandlers[0](ctx);

  expect(ctx.wizard.next).toHaveBeenCalled();
});
```

### 3. Проверяйте интерактивность
```typescript
it('должен показать кнопки', async () => {
  const ctx = createMockContext() as SceneContext;

  await scene.stepHandlers[0](ctx);

  expect(ctx.reply).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      reply_markup: expect.objectContaining({
        inline_keyboard: expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ text: 'Кнопка 1' }),
          ]),
        ]),
      }),
    })
  );
});
```

### 4. Тестируйте обработку ошибок
```typescript
it('должен обработать ошибку', async () => {
  const ctx = createMockContext() as SceneContext;
  jest.spyOn(console, 'error').mockImplementation();

  await scene.stepHandlers[0](ctx);

  expect(console.error).toHaveBeenCalled();
});
```

## Интеграционные тесты

### Тест Plugin сервиса
```typescript
describe('ScenesPlugin Integration', () => {
  it('должен зарегистрировать все сцены', async () => {
    const runtime = createMockRuntime();
    const service = await ScenesService.start(runtime);

    expect(service).toBeDefined();
    // Проверяем что все команды зарегистрированы
    expect(runtime.getService).toHaveBeenCalledWith('telegram');
  });
});
```

### Тест переходов между сценами
```typescript
it('должен перейти к другой сцене', async () => {
  const ctx = createMockContext() as SceneContext;
  ctx.match = ['balance'];

  // Эмулируем нажатие на кнопку
  const handler = scene.stepHandlers[1];
  await handler(ctx);

  expect(ctx.scene.enter).toHaveBeenCalledWith('balanceScene');
});
```

## Покрытие кода

Цель покрытия: 80%+

```bash
# Проверка покрытия
npm test -- --coverage --collectCoverageFrom="src/plugins/scenes/**/*.ts"

# Отчёт покрытия
open coverage/lcov-report/index.html
```

## Отладка тестов

### Запуск в режиме watch
```bash
npm test -- --watch src/plugins/scenes/tests/balance-scene.test.ts
```

### Логирование в тестах
```typescript
it('должен выполнить действие', async () => {
  console.log('Debug info:', ctx.session.wizardData);
  // ...
});
```

## Типичные проблемы

### 1. Асинхронные операции
```typescript
// ❌ Неправильно
await scene.stepHandlers[0](ctx);

// ✅ Правильно
await new Promise(resolve => setTimeout(resolve, 0));
await scene.stepHandlers[0](ctx);
```

### 2. Мокирование модулей
```typescript
// ❌ Неправильно
jest.mock('../module');

// ✅ Правильно
jest.doMock('../module', () => ({
  getData: jest.fn().mockResolvedValue({}),
}));
```

### 3. Очистка моков
```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
```

## Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Telegraf Scenes API](https://telegraf.js.org/next/#/scene)
- [Testing Best Practices](https://jestjs.io/docs/tutorial-async)
