# 🚀 Интеграция Command Плагинов в Vibee

## ✅ Готово

Создано **10 Command плагинов** в `/Users/playra/vibee/src/plugins/commands/`:

### 📦 Список плагинов

| № | Команда | Плагин | Функциональность |
|---|---------|--------|------------------|
| 1 | `/stats` | stats | 📊 Статистика бота |
| 2 | `/expenses` | expense-analysis | 💰 Анализ расходов |
| 3 | `/monitor` | autonomous-monitor | 📡 Мониторинг системы |
| 4 | `/admin sub` | admin-subscription | 💳 Управление подписками |
| 5 | `/balance` | balance | 💰 Баланс пользователя |
| 6 | `/help` | help | ❓ Справка и документация |
| 7 | `/invite` | invite | 👥 Реферальная программа |
| 8 | `/lang` | language | 🌐 Переключение языка |
| 9 | `/model` | model-select | 🤖 Выбор AI-модели |
| 10 | `/subscription` | subscription-status | 📋 Статус подписки |

## 🔧 Интеграция

### Шаг 1: Импорт в `src/index.ts`

Добавьте импорты в начало файла после существующих импортов:

```typescript
// После строки 30 (после import agentAgentBridgePlugin...)
import { createStatsCommand } from './plugins/commands/stats/index.js';
import { createExpenseAnalysisCommand } from './plugins/commands/expense-analysis/index.js';
import { createAutonomousMonitorCommand } from './plugins/commands/autonomous-monitor/index.js';
import { createAdminSubscriptionCommand } from './plugins/commands/admin-subscription/index.js';
import { createBalanceCommand } from './plugins/commands/balance/index.js';
import { createHelpCommand } from './plugins/commands/help/index.js';
import { createInviteCommand } from './plugins/commands/invite/index.js';
import { createLanguageCommand } from './plugins/commands/language/index.js';
import { createModelSelectCommand } from './plugins/commands/model-select/index.js';
import { createSubscriptionStatusCommand } from './plugins/commands/subscription-status/index.js';
```

### Шаг 2: Добавление в список плагинов

В объекте `projectAgent` добавьте плагины в массив `plugins` (строка 67-91):

```typescript
export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [
    // Существующие плагины...
    telegramStartPlugin,
    telegramTypingPlugin,
    conversationLearningPlugin,
    salesAutomationPlugin,
    contentCreationPlugin,
    contentCallbackHandlerPlugin,
    telegramDebugPlugin,
    telegramCommandsPlugin,
    telegramUIPlugin,
    starterPlugin,
    telegramKeyboardsPlugin,
    trainingPlugin,
    aiPhotoshopPlugin,
    selftestPlugin,
    templatePlugin,
    vectorDbPlugin,
    aiTutorPlugin,
    topicRouterPlugin,
    vibematesCommandsPlugin,
    newsMonitorPlugin,
    agentAgentBridgePlugin,

    // === НОВЫЕ COMMAND ПЛАГИНЫ ===
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
  ],
};
```

### Шаг 3: Обновление команд бота

В `src/telegram-commands-plugin.ts` обновите список команд (строка 57-68):

```typescript
await telegramService.bot.telegram.setMyCommands([
  { command: 'start', description: '🚀 Начать работу с ботом' },
  { command: 'menu', description: '📋 Главное меню' },
  { command: 'help', description: '❓ Помощь и справка' },
  { command: 'quickstart', description: '⚡ Быстрый старт в разработке' },
  { command: 'tools', description: '🔧 Топ инструменты 2025' },
  { command: 'ai', description: '🤖 AI в разработке' },
  { command: 'tts', description: '🎤 Создать голосовое' },
  { command: 'news', description: '📰 Проверить новости сейчас' },
  { command: 'chat', description: '💬 Чат VibeMates' },
  { command: 'mate', description: '🤖 Выбрать VibeMate' },

  // === НОВЫЕ COMMAND ПЛАГИНЫ ===
  { command: 'stats', description: '📊 Статистика бота' },
  { command: 'expenses', description: '💰 Анализ расходов' },
  { command: 'monitor', description: '📡 Мониторинг системы' },
  { command: 'balance', description: '💰 Баланс и платежи' },
  { command: 'subscription', description: '📋 Статус подписки' },
  { command: 'invite', description: '👥 Пригласить друзей' },
  { command: 'lang', description: '🌐 Выбрать язык' },
  { command: 'model', description: '🤖 Выбрать AI-модель' },
]);
```

### Шаг 4: Обработка команд

В `src/telegram-commands-plugin.ts` добавьте обработку новых команд (строка 82-126 в `TELEGRAM_MESSAGE_RECEIVED`):

```typescript
} else if (text.startsWith('/stats') || text === 'stats' || text === 'статистика') {
  logger.info('✅ /stats command');
  await this.handleStatsCommand(runtime, message);
} else if (text.startsWith('/expenses') || text === 'expenses' || text === 'расходы') {
  logger.info('✅ /expenses command');
  await this.handleExpensesCommand(runtime, message);
} else if (text.startsWith('/monitor') || text === 'monitor' || text === 'мониторинг') {
  logger.info('✅ /monitor command');
  await this.handleMonitorCommand(runtime, message);
} else if (text.startsWith('/balance') || text === 'balance' || text === 'баланс') {
  logger.info('✅ /balance command');
  await this.handleBalanceCommand(runtime, message);
} else if (text.startsWith('/subscription') || text === 'subscription' || text === 'подписка') {
  logger.info('✅ /subscription command');
  await this.handleSubscriptionCommand(runtime, message);
} else if (text.startsWith('/invite') || text === 'invite' || text === 'пригласить') {
  logger.info('✅ /invite command');
  await this.handleInviteCommand(runtime, message);
} else if (text.startsWith('/lang') || text.startsWith('/language')) {
  logger.info('✅ /lang command');
  await this.handleLanguageCommand(runtime, message);
} else if (text.startsWith('/model') || text === 'model' || text === 'модель') {
  logger.info('✅ /model command');
  await this.handleModelCommand(runtime, message);
} else if (text.startsWith('/admin sub')) {
  logger.info('✅ /admin sub command');
  await this.handleAdminSubCommand(runtime, message);
}
```

## 📁 Структура проекта

```
/Users/playra/vibee/src/plugins/commands/
├── README.md                           # Общая документация
├── stats/                              # 📊 Статистика
│   ├── index.ts
│   ├── Command.ts
│   ├── handler.ts
│   ├── types.ts
│   └── README.md
├── expense-analysis/                   # 💰 Анализ расходов
├── autonomous-monitor/                 # 📡 Мониторинг
├── admin-subscription/                 # 💳 Админ подписок
├── balance/                            # 💰 Баланс
├── help/                               # ❓ Помощь
├── invite/                             # 👥 Приглашения
├── language/                           # 🌐 Язык
├── model-select/                       # 🤖 Выбор модели
└── subscription-status/                # 📋 Статус подписки
```

## 🎯 Архитектура

Каждый плагин состоит из:

- **`index.ts`** - Экспорт плагина
- **`Command.ts`** - Фабрика плагина (ElizaOS Service)
- **`handler.ts`** - Обработчики команд
- **`types.ts`** - TypeScript типы
- **`README.md`** - Документация

## 🔐 Middleware

Плагины поддерживают:
- ✅ Rate limiting
- ✅ Admin check
- ✅ Subscription check
- ✅ Error handling
- ✅ Logging

## 📊 Статистика

- ✅ **10 плагинов** создано
- ✅ **50 файлов** реализовано
- ✅ **TypeScript** со строгой типизацией
- ✅ **Отступ 2 пробела**
- ✅ **Одинарные кавычки**
- ✅ **Точки с запятой**

## 🚀 Готово к использованию

Все плагины готовы к интеграции в Vibee. Просто следуйте инструкциям выше!

## 📝 Тестирование

После интеграции рекомендуется протестировать:
1. Установку команд бота
2. Работу каждой команды
3. Обработку ошибок
4. Права доступа (админ команды)
5. Callback от кнопок

---

**Создано:** 2025-11-13
**Автор:** Claude Code (AGENT 6: CommandPluginEngineer)
**Статус:** ✅ Готово
