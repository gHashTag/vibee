# 🌈 РАДУЖНЫЙ МОСТ - Индекс Файлов

## Структура Проекта

```
src/selftest/
├── index.ts                           # Public API (экспорты плагина)
├── base-test.ts                       # Абстрактный класс для тестов
├── test-manager.ts                    # Service Registry для тестов
│
├── services/
│   └── self-test-service.ts           # Главный микросервис
│
├── actions/
│   └── selftest-action.ts             # Action для /selftest команды
│
├── tests/
│   └── train-start-test.ts            # Тест /train start
│
└── docs/
    ├── README.md                      # Руководство пользователя
    ├── ARCHITECTURE.md                # Микросервисная архитектура
    ├── PLUGIN_AUTO_REGISTRATION.md    # Система плагинов ElizaOS
    ├── AUTONOMOUS_MODE_GUIDE.md       # Гайд по autonomous mode
    └── FILES_INDEX.md                 # Этот файл
```

## Файлы

### Core Files (Обязательные)

#### `index.ts`
**Назначение:** Публичный API плагина
**Экспорты:**
- `selftestPlugin: Plugin` - главный экспорт плагина
- `BaseTest` - абстрактный класс для создания тестов
- `TestResult, TestConfig` - типы
- `TestManager` - менеджер тестов
- `SelfTestService` - микросервис

**Используется:**
- В `src/index.ts` для регистрации плагина
- Разработчиками для создания новых тестов

#### `base-test.ts`
**Назначение:** Абстрактный класс для всех тестов
**Ключевые функции:**
- `execute()` - запускает тест с timeout и error handling
- `run()` - абстрактный метод (реализуется в конкретных тестах)
- `success()`, `failure()` - хелперы для результатов

**Расширяется в:**
- `tests/train-start-test.ts`
- Любых новых тестах

#### `test-manager.ts`
**Назначение:** Service Registry для управления тестами
**Ключевые функции:**
- `registerTest()` - регистрация нового теста
- `getTest()` - получение теста по ID
- `runAll()` - запуск всех тестов
- `runTest()` - запуск конкретного теста

**Используется в:**
- `SelfTestService` для оркестрации тестов

#### `services/self-test-service.ts`
**Назначение:** Главный микросервис (180+ строк)
**Ключевые функции:**

**Lifecycle:**
- `initialize()` - инициализация, регистрация тестов
- `start()` - запуск сервиса
- `stop()` - остановка, очистка таймеров
- `cleanup()` - финальная очистка

**Manual Testing:**
- `setTestChatId()` - установка chat_id для тестов
- `runAllTests()` - запуск всех тестов
- `runTest()` - запуск конкретного теста
- `getTestHistory()` - история выполнений
- `getStats()` - статистика тестов

**Autonomous Mode (НОВОЕ!):**
- `startAutonomousMode()` - запуск всех autonomous циклов
- `runStartupTests()` - health check при старте (через 10s)
- `runScheduledTests()` - периодические тесты (каждые 30min)
- `runImprovementCycle()` - анализ и улучшение (каждый час)
- `sendReport()` - отправка отчётов в Telegram
- `formatDetailedReport()` - форматирование отчёта
- `analyzeTestHistory()` - анализ истории тестов
- `identifyIssues()` - поиск проблем

**Используется:**
- Автоматически ElizaOS при старте
- Через `runtime.getService('selftest')`
- В `selfTestAction`

#### `actions/selftest-action.ts`
**Назначение:** Action для команды `/selftest`
**Ключевые функции:**
- `validate()` - проверяет триггеры (/selftest, самотест, радужный мост)
- `handler()` - запускает тесты и отправляет отчёт

**Используется:**
- Автоматически при `/selftest` в Telegram
- Регистрируется в `selftestPlugin.actions`

#### `tests/train-start-test.ts`
**Назначение:** Конкретный тест для `/train start`
**Что тестирует:**
- Telegram client доступен
- Команда `/train start` отправляется
- PhotoCollectorService создаёт сессию
- Сессия содержит правильные данные

**Расширяет:** `BaseTest`

### Documentation Files

#### `README.md`
**Назначение:** Руководство пользователя
**Содержит:**
- Quick start (установка, использование)
- Как создать новый тест (3 шага)
- API reference
- 4 практических примера
- Troubleshooting
- Roadmap

**Аудитория:** Разработчики, использующие плагин

#### `ARCHITECTURE.md`
**Назначение:** Описание микросервисной архитектуры
**Содержит:**
- Принципы микросервисов (изоляция, SRP, OCP, DI, ISP)
- Масштабируемость (горизонтальная, вертикальная)
- Микросервисные паттерны (Service Registry, Circuit Breaker, Observer)
- Интеграция с ElizaOS
- Best practices
- Roadmap (3 фазы)

**Аудитория:** Архитекторы, senior разработчики

#### `PLUGIN_AUTO_REGISTRATION.md`
**Назначение:** Объяснение системы плагинов ElizaOS
**Содержит:**
- Почему нужна автоматическая регистрация
- Как работает система плагинов ElizaOS
- Полный lifecycle плагина
- Checklist для автономной работы
- Missing piece: проактивный триггер (3 варианта)
- Рекомендуемая реализация (гибридный подход)

**Аудитория:** Разработчики, изучающие ElizaOS

#### `AUTONOMOUS_MODE_GUIDE.md`
**Назначение:** Полный гайд по autonomous mode
**Содержит:**
- Что было сделано (полный список)
- Как включить autonomous mode (3 шага)
- Примеры отчётов
- Архитектура autonomous mode
- Мониторинг и логи
- Troubleshooting
- Следующие шаги

**Аудитория:** Пользователи, запускающие autonomous mode

#### `FILES_INDEX.md` (этот файл)
**Назначение:** Индекс всех файлов с описанием
**Содержит:**
- Структура проекта
- Назначение каждого файла
- Связи между файлами

**Аудитория:** Новые разработчики, быстрый обзор

## Связи Между Файлами

### Plugin Registration Flow

```
src/index.ts
  ↓ imports
src/selftest/index.ts
  ↓ exports
selftestPlugin
  ├── services: [SelfTestService]
  └── actions: [selfTestAction]
```

### Service Initialization Flow

```
ElizaOS Runtime
  ↓ loads plugin
selftestPlugin
  ↓ initializes
SelfTestService.start()
  ↓ calls
SelfTestService.initialize()
  ↓ registers
TestManager.registerTest(TrainStartTest)
  ↓ if SELFTEST_AUTONOMOUS=true
startAutonomousMode()
  ├── setTimeout → runStartupTests
  ├── setInterval → runScheduledTests
  └── setInterval → runImprovementCycle
```

### Test Execution Flow

```
/selftest command
  ↓ triggers
selfTestAction.validate()
  ↓ if true
selfTestAction.handler()
  ↓ calls
SelfTestService.runAllTests()
  ↓ calls
TestManager.runAll()
  ↓ for each test
BaseTest.execute()
  ↓ calls
TrainStartTest.run()
  ↓ returns
TestResult
  ↓ formatted by
formatTestReport()
  ↓ sent to
Telegram
```

### Autonomous Test Flow

```
Bot Start
  ↓ after 10s
runStartupTests()
  ↓ calls
runAllTests()
  ↓ returns
TestResult[]
  ↓ formatted by
formatDetailedReport()
  ↓ sent via
sendReport()
  ↓ to
Telegram
```

## Файлы по Категориям

### Обязательные для работы плагина
- `index.ts`
- `base-test.ts`
- `test-manager.ts`
- `services/self-test-service.ts`
- `actions/selftest-action.ts`
- `tests/train-start-test.ts`

### Документация
- `README.md`
- `ARCHITECTURE.md`
- `PLUGIN_AUTO_REGISTRATION.md`
- `AUTONOMOUS_MODE_GUIDE.md`
- `FILES_INDEX.md`

## Где Что Менять

### Добавить новый тест
1. Создай `tests/my-new-test.ts` (наследуй `BaseTest`)
2. Зарегистрируй в `SelfTestService.registerTests()`

### Изменить autonomous интервалы
- Startup delay: `self-test-service.ts:210` (10000ms)
- Scheduled tests: `self-test-service.ts:215` (30 * 60 * 1000ms)
- Improvement cycle: `self-test-service.ts:220` (60 * 60 * 1000ms)

### Добавить новый анализ в improvement cycle
- `SelfTestService.identifyIssues()` в `self-test-service.ts:389`

### Изменить формат отчётов
- `SelfTestService.formatDetailedReport()` в `self-test-service.ts:333`

## Метрики

| Метрика | Значение |
|---------|----------|
| Всего файлов | 11 |
| Core файлов | 6 |
| Документации | 5 |
| Строк кода (core) | ~800 |
| Строк документации | ~1200 |
| Integration tests | 9 (8 pass, 1 timeout) |
| Test coverage | 66.68% lines |

## История Изменений

### v1.0 - Initial Release
- Базовая инфраструктура
- TrainStartTest
- Integration tests
- Документация

### v2.0 - Autonomous Mode (CURRENT)
- ✅ Полностью автономный режим
- ✅ Startup health check
- ✅ Scheduled tests
- ✅ Improvement cycle
- ✅ Auto reports в Telegram
- ✅ Graceful shutdown
- ✅ Расширенная документация

### v3.0 - Roadmap
- [ ] PhotoUploadTest
- [ ] TrainCancelTest
- [ ] Performance tests
- [ ] Test parallelization
- [ ] ML-based failure prediction
- [ ] Auto-fix common issues
- [ ] CI/CD integration
