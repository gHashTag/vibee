# 🌈 РАДУЖНЫЙ МОСТ (Rainbow Bridge)

**Автономное E2E тестирование через реальный Telegram**

---

## 🎯 Философия

**"Прямо в боте сам сделал, прямо в боте протестировал"**

Радужный Мост — это фундаментальная методология разработки для Telegram ботов:
- ✅ Тестируем через **РЕАЛЬНЫЙ** Telegram (не моки!)
- ✅ **АВТОНОМНО** — без участия человека
- ✅ **END-TO-END** — как реальный пользователь
- ✅ **НЕПРЕРЫВНО** — на каждом коммите

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pip3 install telethon python-dotenv
```

### 2. Получение Telegram API credentials

1. Перейди на https://my.telegram.org/apps
2. Создай новое приложение
3. Сохрани `api_id` и `api_hash`

### 3. Создание session string (ОДИН РАЗ)

```bash
python3 scripts/autonomous-telegram-auth.py
```

Этот скрипт:
- Запросит номер телефона
- Отправит код подтверждения в Telegram
- Создаст `TELEGRAM_SESSION_STRING` для автономной работы
- Автоматически сохранит в `.env`

### 4. Настройка `.env`

```bash
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION_STRING=your_generated_session_string
```

### 5. Запуск тестов

```bash
# Только критичные тесты
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json --critical-only

# Все тесты
python3 scripts/rainbow-bridge-runner.py tests/rainbow-bridge-scenarios.json
```

---

## 📁 Структура проекта

```
vibee/
├── scripts/
│   ├── autonomous-telegram-auth.py      # Аутентификация (ОДИН РАЗ)
│   ├── autonomous-telegram-bot.py       # Отправка сообщений
│   └── rainbow-bridge-runner.py         # Автоматизированный тестировщик
├── tests/
│   ├── rainbow-bridge-scenarios.json    # Тестовые сценарии
│   └── rainbow-bridge-report-*.json     # Отчёты о тестировании
└── RAINBOW_BRIDGE.md                    # Эта документация
```

---

## 🧪 Как это работает

### Архитектура

```
Python (Telethon)
  ↓ отправляет сообщения как пользователь
Telegram Servers (MTProto)
  ↓ доставляет сообщения
Твой бот (@agent_vibecoder_bot)
  ↓ обрабатывает и отвечает
Telegram Servers
  ↓ доставляет ответы
Python (Telethon)
  ↓ читает ответы и валидирует
Отчёт о тестировании
```

### Ключевые компоненты

**1. autonomous-telegram-auth.py**
- Создаёт `StringSession` для автономной работы
- Запускается **ОДИН РАЗ**
- После этого бот работает **БЕЗ ЧЕЛОВЕКА**

**2. autonomous-telegram-bot.py**
- Отправляет сообщения боту от имени пользователя
- Использует Telegram MTProto (user API)
- Читает ответы бота

**3. rainbow-bridge-runner.py**
- Читает тестовые сценарии из JSON
- Запускает тесты автоматически
- Валидирует ответы
- Генерирует отчёты

**4. rainbow-bridge-scenarios.json**
- Описывает тестовые сценарии
- Содержит ожидаемые результаты
- Приоритеты тестов (critical, high, medium, low)

---

## 📝 Создание тестовых сценариев

### Формат JSON

```json
{
  "testSuites": [
    {
      "id": "my-feature",
      "name": "My Feature Tests",
      "description": "Test my awesome feature",
      "scenarios": [
        {
          "id": "FEATURE_001",
          "description": "Feature responds correctly",
          "priority": "critical",
          "steps": [
            {
              "action": "send_message",
              "data": "/mycommand",
              "wait_ms": 3000
            }
          ],
          "expected": {
            "contains": ["expected text", "another text"],
            "not_contains": ["Error", "undefined"],
            "min_length": 50
          }
        }
      ]
    }
  ],
  "config": {
    "bot_username": "your_bot_username",
    "default_timeout_ms": 15000
  }
}
```

### Приоритеты тестов

- **critical** - Критичная функциональность, ДОЛЖНА работать всегда
- **high** - Важные фичи
- **medium** - Дополнительные возможности
- **low** - Edge cases, оптимизации

---

## 📊 Отчёты о тестировании

После каждого прогона создаётся JSON отчёт:

```json
{
  "timestamp": "2025-11-12T09:06:27.086502",
  "total": 8,
  "passed": 7,
  "failed": 1,
  "pass_rate": 87.5,
  "results": [
    {
      "id": "START_001",
      "status": "passed",
      "duration_ms": 3587,
      "errors": [],
      "response_preview": "..."
    }
  ]
}
```

---

## 🔧 Использование в CI/CD

### GitHub Actions

```yaml
name: Rainbow Bridge E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Python dependencies
        run: pip3 install telethon python-dotenv

      - name: Run E2E tests
        env:
          TELEGRAM_API_ID: ${{ secrets.TELEGRAM_API_ID }}
          TELEGRAM_API_HASH: ${{ secrets.TELEGRAM_API_HASH }}
          TELEGRAM_SESSION_STRING: ${{ secrets.TELEGRAM_SESSION_STRING }}
        run: |
          python3 scripts/rainbow-bridge-runner.py \
            tests/rainbow-bridge-scenarios.json \
            --critical-only

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: rainbow-bridge-reports
          path: tests/rainbow-bridge-report-*.json
```

---

## 🎓 Best Practices

### 1. Тестируй как пользователь

**❌ Плохо:**
```json
"expected": {
  "contains": ["PhotoCollectorService initialized"]
}
```

**✅ Хорошо:**
```json
"expected": {
  "contains": ["Отправь свои фото для обучения"]
}
```

### 2. Изолируй тестовые данные

Используй уникальные имена/триггеры для тестов:

```json
{
  "action": "send_message",
  "data": "/train start TestModel_20251112 test_trigger_unique"
}
```

### 3. Запускай критичные тесты часто

```bash
# Перед каждым коммитом
python3 scripts/rainbow-bridge-runner.py \
  tests/rainbow-bridge-scenarios.json \
  --critical-only

# Полный набор - перед deploy
python3 scripts/rainbow-bridge-runner.py \
  tests/rainbow-bridge-scenarios.json
```

### 4. Мониторь Pass Rate

- **100%** critical tests - обязательно перед deploy
- **> 80%** all tests - хорошо
- **< 80%** - нужны улучшения

---

## 🐛 Troubleshooting

### Session Invalid

```bash
# Пересоздай session
python3 scripts/autonomous-telegram-auth.py
```

### Тесты не проходят

1. Проверь, что бот запущен
2. Проверь `bot_username` в config
3. Увеличь `wait_ms` для медленных команд
4. Посмотри `response_preview` в отчёте

### Бот не отвечает

1. Проверь логи бота
2. Убедись, что session string правильный
3. Попробуй отправить сообщение вручную

---

## 📈 Что протестировано

### ✅ Критичная функциональность (100%)

- `/start` - приветствие
- `/help` - справка
- Обычный разговор - отвечает на вопросы

### ✅ AI Model Training (100%)

- `/train help` - помощь по обучению
- `/train start <model> <trigger>` - запуск обучения

### ✅ Самодиагностика (100%)

- `/selftest` - самотестирование

### ✅ Edge Cases (50%)

- Неизвестные команды - обрабатываются корректно
- ⚠️ `/train start` без параметров - продолжает предыдущую сессию (возможный баг)

### 📊 Общий Pass Rate: 87.5% (7/8)

---

## 🎯 Цели на будущее

- [ ] Screenshot capture при провалах
- [ ] Визуальное регрессионное тестирование
- [ ] Мониторинг производительности
- [ ] Тестирование нескольких ботов одновременно
- [ ] Web dashboard для отчётов
- [ ] Интеграция со Slack/Discord
- [ ] Аналитика исторических данных

---

## 🌟 Философия Радужного Моста

> **"Сделай для себя максимальную способность работать без человека"**

Радужный Мост — это не просто тестирование. Это:

1. **Автономность** - Бот может тестировать себя сам
2. **Реальность** - Тесты проходят в реальном Telegram
3. **Непрерывность** - Тесты запускаются на каждом изменении
4. **Уверенность** - Ты знаешь, что всё работает

**Результат:** Бот, который **САМ** находит баги, **САМ** тестирует фичи, **САМ** улучшается. Без твоего участия! 🚀

---

## 📚 Дополнительные ресурсы

- [Telethon Documentation](https://docs.telethon.dev/)
- [Telegram MTProto](https://core.telegram.org/mtproto)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Made with ❤️ for autonomous development**

🌈 Building bridges between development and reality, autonomously.
