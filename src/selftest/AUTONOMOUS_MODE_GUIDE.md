# 🌈 РАДУЖНЫЙ МОСТ - Гайд по Полностью Автономному Режиму

## Что Было Сделано

### ✅ Завершенная Работа

1. **Полная Микросервисная Архитектура**
   - BaseTest абстракция для расширения
   - TestManager (Service Registry)
   - SelfTestService с полным lifecycle
   - selfTestAction для `/selftest` команды
   - Интеграционные тесты (8/9 passing - 89%)

2. **Документация**
   - `README.md` - руководство пользователя
   - `ARCHITECTURE.md` - микросервисная архитектура
   - `PLUGIN_AUTO_REGISTRATION.md` - система плагинов ElizaOS
   - `AUTONOMOUS_MODE_GUIDE.md` - этот файл

3. **Autonomous Mode (НОВОЕ! 🎉)**
   - 🚀 Startup Health Check (через 10 сек после старта)
   - ⏰ Scheduled Tests (каждые 30 минут)
   - 💡 Improvement Cycle (каждый час с анализом)
   - 📨 Auto Reports (отчёты в Telegram при проблемах)
   - 🛑 Graceful Shutdown (очистка таймеров)

## Как Включить Полностью Автономный Режим

### Шаг 1: Добавить Environment Variable

Добавь в `.env`:

```bash
# 🌈 РАДУЖНЫЙ МОСТ - Autonomous Mode
SELFTEST_AUTONOMOUS=true
```

### Шаг 2: Настроить Chat ID (первый запуск)

При первом запуске с autonomous mode, бот еще не знает куда отправлять отчёты.

**Вариант A: Через /selftest (рекомендуется)**

1. Запусти бота: `bun run dev`
2. Открой Telegram и напиши боту: `/selftest`
3. Бот запомнит твой chat_id автоматически
4. С этого момента все autonomous отчёты будут приходить в этот чат

**Вариант B: Программно**

Если нужно задать chat_id программно:

```typescript
// В коде, где инициализируется runtime
const selfTestService = runtime.getService('selftest') as SelfTestService;
selfTestService?.setTestChatId('YOUR_CHAT_ID');
```

### Шаг 3: Запустить и Наблюдать

```bash
bun run dev
```

**Что произойдёт:**

1. **Сразу при старте:**
   ```
   🌈 [Autonomous] Starting autonomous self-testing mode...
   🌈 [Autonomous] Bot will now test itself automatically!
   🌈 [Autonomous] All autonomous cycles started!
   ```

2. **Через 10 секунд:**
   ```
   🌈 [Autonomous] Running startup health check...
   📊 [SelfTestService] Tests complete: 1/1 passed
   🎉 [SelfTestService] ALL TESTS PASSED!
   🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!
   🌈 [Autonomous] Report sent to Telegram
   ```

3. **Каждые 30 минут:**
   - Запускаются все тесты
   - Если все проходят - только логи
   - Если есть failures - отчёт в Telegram

4. **Каждый час:**
   - Анализируется история тестов
   - Идентифицируются проблемные области
   - Отправляются рекомендации для улучшения

## Что Ты Получаешь

### До Autonomous Mode:

```
Developer → /selftest → Bot runs tests → Developer reads report → repeat
           ↑__________________________________________________↑
                       Человек в цикле
```

### После Autonomous Mode:

```
Bot starts → Startup tests → Scheduled tests → Improvement analysis → ...
             ↑_______________________________________________________↑
                        Полностью автономно 24/7
```

## Примеры Отчётов

### 🚀 Startup Health Check

```
🌈 РАДУЖНЫЙ МОСТ - 🚀 Startup Health Check
========================================

📊 Итого: 1/1 тестов пройдено

✅ /train start (2043ms)
   Session created: TestModel

🌈 РАДУЖНЫЙ МОСТ работает автономно!
Время: 12.01.2025, 15:30:42
```

### ⚠️ Scheduled Test Failures

```
🌈 РАДУЖНЫЙ МОСТ - ⚠️ Scheduled Test Failures
========================================

📊 Итого: 0/1 тестов пройдено

❌ /train start (5000ms)
   Telegram client not found after waiting 5s

🌈 РАДУЖНЫЙ МОСТ работает автономно!
Время: 12.01.2025, 16:00:15
```

### 💡 Improvement Opportunities

```
🌈 РАДУЖНЫЙ МОСТ - 💡 Improvement Opportunities
========================================

💡 Рекомендации:
   - Test "train-start" имеет низкий success rate: 66.7% (2/3)
   - Недостаточно тестов: 1. Рекомендуется добавить больше тестов для покрытия.

🌈 РАДУЖНЫЙ МОСТ работает автономно!
Время: 12.01.2025, 17:00:01
```

## Архитектура Autonomous Mode

### Компоненты:

```typescript
SelfTestService
├── isAutonomousMode: boolean              // Флаг режима
├── scheduledTestsTimer: NodeJS.Timeout    // Таймер scheduled tests
├── improvementCycleTimer: NodeJS.Timeout  // Таймер improvement cycle
│
├── startAutonomousMode()                  // Запуск всех циклов
│   ├── setTimeout(runStartupTests, 10s)   // Startup tests
│   ├── setInterval(runScheduledTests, 30min)  // Scheduled tests
│   └── setInterval(runImprovementCycle, 1h)   // Improvement cycle
│
├── runStartupTests()                      // Health check при старте
│   ├── runAllTests()
│   └── sendReport('🚀 Startup Health Check')
│
├── runScheduledTests()                    // Периодическая проверка
│   ├── runAllTests()
│   └── sendReport('⚠️ ...') если есть failures
│
├── runImprovementCycle()                  // Анализ и улучшение
│   ├── analyzeTestHistory()               // Анализ истории
│   ├── identifyIssues()                   // Поиск проблем
│   └── sendReport('💡 Improvement Opportunities')
│
├── sendReport()                           // Отправка в Telegram
│   └── formatDetailedReport()
│
└── stop() / cleanup()                     // Graceful shutdown
    ├── clearInterval(scheduledTestsTimer)
    └── clearInterval(improvementCycleTimer)
```

### Lifecycle:

```
1. Bot Start
   ↓
2. SelfTestService.initialize()
   ↓
3. Check SELFTEST_AUTONOMOUS=true
   ↓
4. startAutonomousMode()
   ├── setTimeout → runStartupTests (10s)
   ├── setInterval → runScheduledTests (30min)
   └── setInterval → runImprovementCycle (1h)
   ↓
5. Bot Running (autonomous cycles active)
   ↓
6. Bot Stop
   ↓
7. SelfTestService.stop()
   ├── clearInterval(scheduledTestsTimer)
   └── clearInterval(improvementCycleTimer)
```

## Мониторинг Autonomous Mode

### Логи

**При старте:**
```bash
grep "Autonomous" /tmp/vibee-*.log

# Ожидается:
# 🌈 [Autonomous] Starting autonomous self-testing mode...
# 🌈 [Autonomous] Bot will now test itself automatically!
# 🌈 [Autonomous] All autonomous cycles started!
```

**Startup tests:**
```bash
grep "Startup" /tmp/vibee-*.log

# Ожидается (через 10 сек):
# 🌈 [Autonomous] Running startup health check...
# 🌈 [Autonomous] Startup tests: 1/1 passed
# 🌈 [Autonomous] Report sent to Telegram
```

**Scheduled tests:**
```bash
grep "Scheduled" /tmp/vibee-*.log

# Ожидается (каждые 30 минут):
# 🌈 [Autonomous] Running scheduled tests...
# 🌈 [Autonomous] All scheduled tests passed!
```

**Improvement cycle:**
```bash
grep "Improvement" /tmp/vibee-*.log

# Ожидается (каждый час):
# 🌈 [Autonomous] Running improvement cycle...
# 🌈 [Autonomous] No issues found, system is healthy!
```

### Telegram

Все autonomous отчёты автоматически приходят в Telegram (если chat_id установлен).

## Troubleshooting

### Autonomous Mode не запускается

**Проблема:** Логи не показывают "Autonomous mode enabled"

**Решение:**
1. Проверь `.env`: `SELFTEST_AUTONOMOUS=true`
2. Перезапусти бота: `bun run dev`
3. Проверь логи при старте

### Отчёты не приходят в Telegram

**Проблема:** Тесты запускаются, но отчёты не приходят

**Решение:**
1. Проверь chat_id: отправь `/selftest` вручную один раз
2. Проверь логи: `grep "Cannot send report" /tmp/vibee-*.log`
3. Убедись, что Telegram client инициализирован

### Тесты падают в Autonomous Mode

**Проблема:** Все тесты падают с "Telegram client not found"

**Решение:**
1. Увеличь задержку startup tests с 10s до 30s:
   ```typescript
   setTimeout(async () => {
     await this.runStartupTests(runtime);
   }, 30000); // 30 секунд
   ```
2. Перестрой и перезапусти

## Следующие Шаги

### 1. Добавить Больше Тестов

```typescript
// src/selftest/tests/photo-upload-test.ts
export class PhotoUploadTest extends BaseTest {
  id = 'photo-upload';
  name = 'Photo Upload';
  description = 'Tests photo upload to training session';

  protected async run(runtime, chatId) {
    // Implementation...
  }
}
```

### 2. Улучшить Improvement Cycle

Добавь ML-анализ:
- Предсказание failures
- Автоматическое исправление
- Pattern extraction

### 3. CI/CD Integration

Интегрируй с GitHub Actions:
```yaml
# .github/workflows/autonomous-tests.yml
- name: Run Autonomous Tests
  run: SELFTEST_AUTONOMOUS=true bun run start
```

## Заключение

🌈 **РАДУЖНЫЙ МОСТ теперь полностью автономен!**

✅ **Что работает:**
- Автоматические тесты при старте
- Scheduled тесты каждые 30 минут
- Анализ и улучшение каждый час
- Автоматические отчёты в Telegram
- Graceful shutdown

🎯 **Что делать:**
1. Добавь `SELFTEST_AUTONOMOUS=true` в `.env`
2. Запусти: `bun run dev`
3. Отправь `/selftest` один раз (для chat_id)
4. Наблюдай, как бот тестирует себя сам!

**БЕЗ участия человека! 🚀**
