# Command Plugins Collection

Коллекция из 10 готовых Command плагинов для Vibee Telegram бота.

## 📦 Список плагинов

### 1. Stats Command (`/stats`)
📊 Отображение статистики бота: пользователи, доходы, производительность
- Общая статистика и детальные метрики
- Экспорт данных в JSON
- Графики производительности

### 2. Expense Analysis Command (`/expenses`)
💰 Анализ расходов и бюджета
- Анализ по категориям
- Тренды и динамика
- Персональные советы по экономии

### 3. Autonomous Monitor Command (`/monitor`)
📡 Автономный мониторинг системы
- Метрики в реальном времени
- Система алертов
- Автовосстановление

### 4. Admin Subscription Command (`/admin sub`)
💳 Администрирование подписок
- Управление планами
- Статистика доходов
- Список пользователей

### 5. Balance Command (`/balance`)
💰 Команды баланса
- Просмотр баланса
- Пополнение счета
- История операций

### 6. Help Command (`/help`)
❓ Команда помощи
- Справка по командам
- Документация
- Поиск по разделам

### 7. Invite Command (`/invite`)
👥 Реферальная программа
- Пригласительные ссылки
- Статистика приглашений
- Система наград

### 8. Language Command (`/lang`)
🌐 Переключение языка
- Русский и английский
- Динамическое переключение
- Больше языков скоро

### 9. Model Select Command (`/model`)
🤖 Выбор AI-модели
- Claude, GPT, Gemini
- Сравнение параметров
- Оптимизация скорости

### 10. Subscription Status Command (`/subscription`)
📋 Статус подписки пользователя
- Текущий план
- Срок действия
- Доступные функции

## 🚀 Интеграция в Vibee

### 1. Импорт плагинов в `src/index.ts`:

```typescript
import { createStatsCommand } from './plugins/commands/stats';
import { createExpenseAnalysisCommand } from './plugins/commands/expense-analysis';
import { createAutonomousMonitorCommand } from './plugins/commands/autonomous-monitor';
import { createAdminSubscriptionCommand } from './plugins/commands/admin-subscription';
import { createBalanceCommand } from './plugins/commands/balance';
import { createHelpCommand } from './plugins/commands/help';
import { createInviteCommand } from './plugins/commands/invite';
import { createLanguageCommand } from './plugins/commands/language';
import { createModelSelectCommand } from './plugins/commands/model-select';
import { createSubscriptionStatusCommand } from './plugins/commands/subscription-status';
```

### 2. Добавление в список плагинов агента:

```typescript
export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [
    // Существующие плагины...
    createStatsCommand(),
    createExpenseAnalysisCommand(),
    createAutonomousMonitorCommand(),
    createAdminSubscriptionCommand(),
    createBalanceCommand(),
    createHelpCommand(),
    createInviteCommand(),
    createLanguageCommand(),
    createModelSelectCommand(),
    createSubscriptionStatusCommand(),
    // ...
  ],
};
```

### 3. Настройка команд бота:

Обновите `telegram-commands-plugin.ts` для установки команд:

```typescript
await telegramService.bot.telegram.setMyCommands([
  { command: 'start', description: '🚀 Начать работу' },
  { command: 'menu', description: '📋 Главное меню' },
  { command: 'help', description: '❓ Помощь' },
  { command: 'stats', description: '📊 Статистика' },
  { command: 'expenses', description: '💰 Анализ расходов' },
  { command: 'monitor', description: '📡 Мониторинг' },
  { command: 'balance', description: '💰 Баланс' },
  { command: 'subscription', description: '📋 Подписка' },
  { command: 'invite', description: '👥 Пригласить' },
  { command: 'lang', description: '🌐 Язык' },
  { command: 'model', description: '🤖 Модель' },
]);
```

## 🏗️ Структура каждого плагина

```
commands/[name]/
├── index.ts         # Экспорт плагина
├── Command.ts       # Фабрика плагина
├── handler.ts       # Обработчики команд
├── types.ts         # TypeScript типы
└── README.md        # Документация
```

## 🎯 Middleware

Каждый плагин поддерживает:
- ✅ Rate limiting (ограничение частоты)
- ✅ Admin check (проверка админа)
- ✅ Subscription check (проверка подписки)
- ✅ Error handling (обработка ошибок)
- ✅ Logging (логирование)

## 📝 Пример расширения

Для добавления новой команды:

1. Создайте папку в `/src/plugins/commands/`
2. Скопируйте структуру из существующих плагинов
3. Реализуйте обработчики в `handler.ts`
4. Экспортируйте из `index.ts`
5. Импортируйте в `src/index.ts`
6. Добавьте в список плагинов агента

## 🔧 Требования

- TypeScript с строгой типизацией
- Отступы: 2 пробела
- Одинарные кавычки
- Обязательные точки с запятой
- Логирование всех операций
- Обработка ошибок

## 📚 Документация

Подробная документация для каждого плагина находится в соответствующих README.md файлах.

## 🎨 Архитектура

Плагины используют ElizaOS Service паттерн:
- Service для жизненного цикла
- Event-based обработка
- Dependency injection
- Modular design

---

**Создано:** 2025-11-13
**Версия:** 1.0.0
**Статус:** ✅ Готово к использованию
