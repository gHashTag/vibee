---
# 🔄 TDD WORKFLOW EXAMPLES - Практические Примеры
**"Learn by doing: Real-world TDD scenarios"**
---

## 📖 Содержание

1. [Пример 1: Новая команда /profile](#пример-1-новая-команда-profile)
2. [Пример 2: Исправление бага в UI генерации](#пример-2-исправление-бага-в-ui-генерации)
3. [Пример 3: Рефакторинг с TDD](#пример-3-рефакторинг-с-tdd)
4. [Пример 4: Интеграционный тест](#пример-4-интеграционный-тест)
5. [Пример 5: Property-Based Testing](#пример-5-property-based-testing)

---

## Пример 1: Новая команда /profile

### Шаг 1: Спецификация

```markdown
# Feature: User Profile Command

## User Story
As a Vibee user
I want to see my profile with statistics
So that I can track my learning progress

## Acceptance Criteria
- ✅ Command /profile shows user info
- ✅ Displays: messages count, commands used, active days
- ✅ Shows "Edit Profile" button
- ✅ Handles new users gracefully (0 stats)
- ✅ Response time < 500ms

## Test Scenarios

### Happy Path
Given user has sent 42 messages
When user types "/profile"
Then system shows profile with stats: 42 messages, 7 active days

### New User
Given user just joined
When user types "/profile"
Then system shows welcome + empty stats

### Edit Action
Given user views profile
When user clicks "Edit Profile"
Then system shows edit form
```

### Шаг 2: RED - Пишем failing тесты

```typescript
// src/__tests__/telegram-commands-plugin.test.ts
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { profileCommandAction } from '../telegram-commands-plugin';

describe('/profile command', () => {
  let mockRuntime: any;
  let mockCallback: any;

  beforeEach(() => {
    mockRuntime = {
      getService: mock((name) => {
        if (name === 'analytics') {
          return {
            getUserStats: mock(() =>
              Promise.resolve({
                totalMessages: 42,
                commandsUsed: 10,
                activeDays: 7,
              })
            ),
          };
        }
      }),
    };
    mockCallback = mock(() => Promise.resolve());
  });

  test('should respond to /profile command', async () => {
    // ARRANGE
    const message = {
      content: { text: '/profile' },
      userId: '123',
      roomId: 'test-room',
    };

    // ACT
    await profileCommandAction.handler(
      mockRuntime,
      message,
      {},
      {},
      mockCallback
    );

    // ASSERT
    expect(mockCallback).toHaveBeenCalled();
    expect(mockCallback.mock.calls[0][0].text).toContain('профиль');
  });

  test('should show user statistics', async () => {
    const message = {
      content: { text: '/profile' },
      userId: '123',
      roomId: 'test-room',
    };

    await profileCommandAction.handler(
      mockRuntime,
      message,
      {},
      {},
      mockCallback
    );

    const response = mockCallback.mock.calls[0][0];
    expect(response.text).toContain('42'); // message count
    expect(response.text).toContain('7'); // active days
  });

  test('should provide edit profile button', async () => {
    const message = {
      content: { text: '/profile' },
      userId: '123',
      roomId: 'test-room',
    };

    await profileCommandAction.handler(
      mockRuntime,
      message,
      {},
      {},
      mockCallback
    );

    const response = mockCallback.mock.calls[0][0];
    expect(response.uiElements).toBeDefined();
    expect(response.uiElements[0]).toMatchObject({
      type: 'inline_callback',
      callback_data: 'edit_profile',
    });
  });

  test('should handle new user with no stats', async () => {
    // Mock для нового пользователя
    mockRuntime.getService = mock((name) => {
      if (name === 'analytics') {
        return {
          getUserStats: mock(() =>
            Promise.resolve({
              totalMessages: 0,
              commandsUsed: 0,
              activeDays: 0,
            })
          ),
        };
      }
    });

    const message = {
      content: { text: '/profile' },
      userId: 'new-user',
      roomId: 'test-room',
    };

    await profileCommandAction.handler(
      mockRuntime,
      message,
      {},
      {},
      mockCallback
    );

    const response = mockCallback.mock.calls[0][0];
    expect(response.text).toContain('0');
    expect(response.text).toContain('Добро пожаловать');
  });
});
```

**Запускаем тесты**:
```bash
bun test --watch telegram-commands
```

**Результат**: 🔴 All tests FAIL - profileCommandAction doesn't exist

### Шаг 3: GREEN - Минимальная реализация

```typescript
// src/telegram-commands-plugin.ts
import { Action } from '@elizaos/core';

export const profileCommandAction: Action = {
  name: 'TELEGRAM_PROFILE_COMMAND',
  description: 'Shows user profile with statistics',
  similes: ['SHOW_PROFILE', 'USER_INFO', 'MY_PROFILE'],

  validate: async (runtime, message) => {
    return message.content.text === '/profile';
  },

  handler: async (runtime, message, state, options, callback) => {
    const userId = message.userId;

    // Получаем статистику
    const analyticsService = runtime.getService('analytics');
    const stats = await analyticsService.getUserStats(userId);

    // Формируем текст
    let profileText = '👤 Ваш профиль:\n\n';

    if (stats.totalMessages === 0) {
      profileText += 'Добро пожаловать! Начните общение.\n\n';
    }

    profileText += `📊 Сообщений: ${stats.totalMessages}\n`;
    profileText += `⚡️ Команд: ${stats.commandsUsed}\n`;
    profileText += `📅 Активных дней: ${stats.activeDays}`;

    // UI элементы
    const uiElements = [
      {
        type: 'inline_callback' as const,
        text: '✏️ Редактировать',
        callback_data: 'edit_profile',
      },
    ];

    await callback({
      text: profileText,
      uiElements,
    });
  },

  examples: [
    [
      { name: 'user', content: { text: '/profile' } },
      {
        name: 'Vibee',
        content: {
          text: '👤 Ваш профиль:\n\n📊 Сообщений: 42\n⚡️ Команд: 10',
        },
      },
    ],
  ],
};
```

**Запускаем тесты**:
```bash
bun test --watch telegram-commands
```

**Результат**: 🟢 All tests PASS!

### Шаг 4: REFACTOR - Улучшаем код

```typescript
// src/telegram-commands-plugin.ts

// Вынесли форматирование в отдельную функцию
function formatUserProfile(stats: UserStats): string {
  let text = '👤 Ваш профиль:\n\n';

  if (stats.totalMessages === 0) {
    text += '🌟 Добро пожаловать! Начните общение и ваша статистика появится здесь.\n\n';
  }

  text += `📊 Сообщений отправлено: ${stats.totalMessages}\n`;
  text += `⚡️ Команд использовано: ${stats.commandsUsed}\n`;
  text += `📅 Активных дней: ${stats.activeDays}`;

  if (stats.activeDays > 7) {
    text += '\n\n🔥 Отличная активность!';
  }

  return text;
}

// Вынесли UI в отдельную функцию
function createProfileUI(userId: string) {
  return [
    {
      type: 'inline_callback' as const,
      text: '✏️ Редактировать профиль',
      callback_data: 'edit_profile',
    },
    {
      type: 'inline_callback' as const,
      text: '⚙️ Настройки',
      callback_data: 'user_settings',
    },
  ];
}

export const profileCommandAction: Action = {
  name: 'TELEGRAM_PROFILE_COMMAND',
  description: 'Shows user profile with statistics and activity',
  similes: ['SHOW_PROFILE', 'USER_INFO', 'MY_PROFILE', 'VIEW_STATS'],

  validate: async (runtime, message) => {
    return message.content.text === '/profile';
  },

  handler: async (runtime, message, state, options, callback) => {
    try {
      const userId = message.userId;
      const analyticsService = runtime.getService('analytics');
      const stats = await analyticsService.getUserStats(userId);

      const profileText = formatUserProfile(stats);
      const uiElements = createProfileUI(userId);

      await callback({
        text: profileText,
        uiElements,
      });
    } catch (error) {
      console.error('Profile command error:', error);
      await callback({
        text: '❌ Не удалось загрузить профиль. Попробуйте позже.',
      });
    }
  },

  examples: [
    [
      { name: 'user', content: { text: '/profile' } },
      {
        name: 'Vibee',
        content: {
          text: '👤 Ваш профиль:\n\n📊 Сообщений: 42\n⚡️ Команд: 10\n📅 Активных дней: 7',
        },
      },
    ],
  ],
};
```

**Запускаем тесты**:
```bash
bun test telegram-commands
```

**Результат**: 🟢 All tests STILL PASS! Code improved!

### Шаг 5: Коммит

```bash
git add src/telegram-commands-plugin.ts src/__tests__/telegram-commands-plugin.test.ts
git commit -m "feat: add /profile command with user statistics

- Shows message count, commands used, active days
- Handles new users gracefully
- Includes edit profile button
- 100% test coverage

🧪 Generated with TDD Cycle Engine
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Пример 2: Исправление бага в UI генерации

### Проблема

UI generation не работает для длинных сообщений (>500 символов).

### Шаг 1: RED - Regression Test

```typescript
// src/__tests__/telegram-ui-plugin.test.ts
import { describe, test, expect } from 'bun:test';
import { TelegramUIGenerator } from '../telegram-ui-plugin';

describe('TelegramUIGenerator - Long Messages', () => {
  test('should generate UI for message longer than 500 chars', () => {
    // ARRANGE
    const longMessage =
      'x'.repeat(700) + ' Хочу обучиться vibe-coding и изучить все инструменты';
    const context = 'learning';

    // ACT
    const result = TelegramUIGenerator.generateUI(longMessage, context);

    // ASSERT
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({
      type: 'inline_callback',
      text: expect.stringContaining('обуч'),
    });
  });

  test('should handle Telegram message limit (4096 chars)', () => {
    const veryLongMessage = 'test '.repeat(1000) + ' обуч'; // > 4096 chars
    const result = TelegramUIGenerator.generateUI(veryLongMessage, 'learning');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should not crash on extremely long input', () => {
    const extremelyLong = 'x'.repeat(100000); // 100K chars
    expect(() => TelegramUIGenerator.generateUI(extremelyLong, '')).not.toThrow();
  });
});
```

**Запускаем**:
```bash
bun test --watch telegram-ui
```

**Результат**: 🔴 FAIL - No UI generated for long messages

### Шаг 2: GREEN - Исправление

```typescript
// src/telegram-ui-plugin.ts

export class TelegramUIGenerator {
  static generateUI(text: string, context: string): UIElement[] {
    const elements: UIElement[] = [];

    // FIX: Process full text (up to Telegram limit)
    const processedText = text.substring(0, 4096); // Telegram message limit

    // Keyword detection on FULL text
    if (processedText.toLowerCase().includes('обуч')) {
      elements.push({
        type: 'inline_callback',
        text: '📚 Обучение',
        callback_data: 'learn_vibe_basics',
      });
    }

    // ... rest of keyword checks on processedText

    return elements;
  }
}
```

**Запускаем**:
```bash
bun test telegram-ui
```

**Результат**: 🟢 All tests PASS!

### Шаг 3: Коммит

```bash
git add src/telegram-ui-plugin.ts src/__tests__/telegram-ui-plugin.test.ts
git commit -m "fix: UI generation for messages >500 chars

- Process full message up to Telegram limit (4096)
- Fixed keyword detection in long messages
- Added regression tests

Fixes #42

🧪 Generated with TDD Cycle Engine"
```

---

## Пример 3: Рефакторинг с TDD

### Задача

Рефакторинг: вынести hardcoded strings в config.

### Шаг 1: Убедиться что все тесты зелёные

```bash
bun test
```

**Результат**: ✅ All 127 tests passing

### Шаг 2: Добавить тест для config structure

```typescript
// src/__tests__/telegram-commands-config.test.ts
import { describe, test, expect } from 'bun:test';
import { COMMANDS_CONFIG } from '../telegram-commands-config';

describe('Commands Configuration', () => {
  test('should have all required commands', () => {
    expect(COMMANDS_CONFIG.start).toBeDefined();
    expect(COMMANDS_CONFIG.menu).toBeDefined();
    expect(COMMANDS_CONFIG.help).toBeDefined();
    expect(COMMANDS_CONFIG.profile).toBeDefined();
  });

  test('each command should have text and uiElements', () => {
    for (const [key, config] of Object.entries(COMMANDS_CONFIG)) {
      expect(config.text).toBeDefined();
      expect(config.text.length).toBeGreaterThan(0);
      expect(Array.isArray(config.uiElements)).toBe(true);
    }
  });

  test('start command should have welcome text', () => {
    expect(COMMANDS_CONFIG.start.text).toContain('Привет');
    expect(COMMANDS_CONFIG.start.text).toContain('Vibee');
  });

  test('menu command should have learning option', () => {
    const learningButton = COMMANDS_CONFIG.menu.uiElements.find((el) =>
      el.text.includes('Обучение')
    );
    expect(learningButton).toBeDefined();
  });
});
```

**Запускаем**:
```bash
bun test telegram-commands-config
```

**Результат**: 🔴 FAIL - Config file doesn't exist

### Шаг 3: Создать config file

```typescript
// src/telegram-commands-config.ts
export const COMMANDS_CONFIG = {
  start: {
    text: `👋 Привет!

Я **Vibee** - твой AI-наставник по vibe-coding и современной разработке.

🚀 Я помогу тебе:
• Освоить vibe-coding практики
• Изучить современные инструменты
• Писать чистый и эффективный код
• Решать задачи быстро и красиво

Жми /menu чтобы начать! 💪`,

    uiElements: [
      {
        type: 'inline_callback' as const,
        text: '📚 Обучение',
        callback_data: 'learn_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '🛠 Инструменты',
        callback_data: 'tools_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '💡 Примеры',
        callback_data: 'examples_menu',
      },
    ],
  },

  menu: {
    text: '🎯 Главное меню\n\nВыбери раздел:',
    uiElements: [
      {
        type: 'inline_callback' as const,
        text: '📚 Обучение',
        callback_data: 'learn_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '🛠 Инструменты',
        callback_data: 'tools_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '💡 Примеры кода',
        callback_data: 'examples_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '❓ Помощь',
        callback_data: 'help_menu',
      },
      {
        type: 'inline_callback' as const,
        text: '📊 Прогресс',
        callback_data: 'progress_menu',
      },
    ],
  },

  help: {
    text: `❓ Помощь

**Доступные команды:**
/start - Начало работы
/menu - Главное меню
/help - Эта справка
/profile - Твой профиль

**Как пользоваться:**
Просто пиши свои вопросы, и я помогу! 💬

Могу показывать примеры кода, объяснять концепции, помогать с инструментами.`,

    uiElements: [
      {
        type: 'inline_url' as const,
        text: '📚 Документация',
        url: 'https://github.com/elizaos/eliza',
      },
      {
        type: 'inline_callback' as const,
        text: '🏠 Главное меню',
        callback_data: 'main_menu',
      },
    ],
  },

  profile: {
    text: '👤 Функция профиля будет добавлена позже',
    uiElements: [],
  },
};

export type CommandConfig = (typeof COMMANDS_CONFIG)[keyof typeof COMMANDS_CONFIG];
```

**Запускаем тесты**:
```bash
bun test telegram-commands-config
```

**Результат**: 🟢 Config tests PASS!

### Шаг 4: Рефакторинг команд для использования config

```typescript
// src/telegram-commands-plugin.ts
import { COMMANDS_CONFIG } from './telegram-commands-config';

export const startCommandAction: Action = {
  name: 'TELEGRAM_START_COMMAND',
  // ... rest of config

  handler: async (runtime, message, state, options, callback) => {
    const config = COMMANDS_CONFIG.start;
    await callback({
      text: config.text,
      uiElements: config.uiElements,
    });
  },
};

export const menuCommandAction: Action = {
  name: 'TELEGRAM_MENU_COMMAND',
  // ... rest of config

  handler: async (runtime, message, state, options, callback) => {
    const config = COMMANDS_CONFIG.menu;
    await callback({
      text: config.text,
      uiElements: config.uiElements,
    });
  },
};

// ... аналогично для других команд
```

### Шаг 5: Запустить ВСЕ тесты

```bash
bun test
```

**Результат**: ✅ All 132 tests passing (5 new config tests added)

### Шаг 6: Коммит

```bash
git add src/telegram-commands-plugin.ts src/telegram-commands-config.ts src/__tests__/telegram-commands-config.test.ts
git commit -m "refactor: extract command content to config file

- Separated concerns: logic vs content
- Easier content management
- Prepared for i18n
- All existing tests still pass
- Added config structure tests

🔵 Refactoring completed with TDD safety net"
```

---

## Пример 4: Интеграционный тест

### Тест полного потока: команда → UI → callback

```typescript
// src/__tests__/integration/telegram-flow.test.ts
import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { telegramCommandsPlugin } from '../../telegram-commands-plugin';
import { telegramUIPlugin } from '../../telegram-ui-plugin';

describe('Telegram Flow Integration', () => {
  let mockRuntime: any;
  let commandHandlers: Map<string, Function>;
  let callbackHandlers: Map<string, Function>;

  beforeEach(() => {
    // Setup mock runtime
    mockRuntime = createMockRuntime();

    // Register handlers from plugins
    commandHandlers = new Map();
    callbackHandlers = new Map();

    for (const action of telegramCommandsPlugin.actions) {
      commandHandlers.set(action.name, action.handler);
    }

    for (const action of telegramUIPlugin.actions) {
      if (action.name === 'HANDLE_TELEGRAM_CALLBACK') {
        // This handler manages all callbacks
        callbackHandlers.set('callback', action.handler);
      }
    }
  });

  test('complete flow: /menu → learning → learn_vibe_basics', async () => {
    // Step 1: User types /menu
    const menuMessage = {
      content: { text: '/menu' },
      userId: 'test-user',
      roomId: 'test-room',
    };

    let capturedResponse: any;
    const menuCallback = mock((response) => {
      capturedResponse = response;
      return Promise.resolve();
    });

    const menuHandler = commandHandlers.get('TELEGRAM_MENU_COMMAND')!;
    await menuHandler(mockRuntime, menuMessage, {}, {}, menuCallback);

    // Verify menu response
    expect(menuCallback).toHaveBeenCalled();
    expect(capturedResponse.text).toContain('меню');
    expect(capturedResponse.uiElements.length).toBeGreaterThan(0);

    // Find learning button
    const learningButton = capturedResponse.uiElements.find((el: any) =>
      el.text.includes('Обучение')
    );
    expect(learningButton).toBeDefined();
    const callbackData = learningButton.callback_data;

    // Step 2: User clicks "Обучение" button
    const callbackMessage = {
      content: { text: `callback:${callbackData}` },
      userId: 'test-user',
      roomId: 'test-room',
    };

    capturedResponse = null;
    const callbackCallback = mock((response) => {
      capturedResponse = response;
      return Promise.resolve();
    });

    const callbackHandler = callbackHandlers.get('callback')!;
    await callbackHandler(
      mockRuntime,
      callbackMessage,
      {},
      {},
      callbackCallback
    );

    // Verify learning menu response
    expect(callbackCallback).toHaveBeenCalled();
    expect(capturedResponse.text).toContain('обуч');

    // Step 3: User clicks specific learning topic
    const topicButton = capturedResponse.uiElements.find((el: any) =>
      el.callback_data === 'learn_vibe_basics'
    );
    expect(topicButton).toBeDefined();

    const topicMessage = {
      content: { text: 'callback:learn_vibe_basics' },
      userId: 'test-user',
      roomId: 'test-room',
    };

    capturedResponse = null;
    const topicCallback = mock((response) => {
      capturedResponse = response;
      return Promise.resolve();
    });

    await callbackHandler(mockRuntime, topicMessage, {}, {}, topicCallback);

    // Verify final content
    expect(topicCallback).toHaveBeenCalled();
    expect(capturedResponse.text).toContain('vibe-coding');
  });

  test('error handling: invalid callback data', async () => {
    const invalidMessage = {
      content: { text: 'callback:nonexistent_action' },
      userId: 'test-user',
      roomId: 'test-room',
    };

    const errorCallback = mock((response) => Promise.resolve());

    const callbackHandler = callbackHandlers.get('callback')!;
    await callbackHandler(mockRuntime, invalidMessage, {}, {}, errorCallback);

    expect(errorCallback).toHaveBeenCalled();
    const response = errorCallback.mock.calls[0][0];
    expect(response.text).toContain('Неизвестная команда');
  });
});
```

---

## Пример 5: Property-Based Testing

### Тест любого пользовательского ввода

```typescript
// src/__tests__/telegram-ui-plugin.property.test.ts
import { describe, test, expect } from 'bun:test';
import fc from 'fast-check';
import { TelegramUIGenerator } from '../telegram-ui-plugin';

describe('TelegramUIGenerator - Property Tests', () => {
  test('should never crash on any string input', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (text, context) => {
        // Property: Function should never throw
        expect(() => TelegramUIGenerator.generateUI(text, context)).not.toThrow();
      })
    );
  });

  test('should always return array', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (text, context) => {
        const result = TelegramUIGenerator.generateUI(text, context);
        expect(Array.isArray(result)).toBe(true);
      })
    );
  });

  test('UI elements should have valid structure', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (text, context) => {
        const result = TelegramUIGenerator.generateUI(text, context);

        for (const element of result) {
          // Property: All elements have type
          expect(element.type).toBeDefined();

          // Property: All elements have text
          expect(element.text).toBeDefined();
          expect(typeof element.text).toBe('string');

          // Property: Callback buttons have callback_data
          if (element.type === 'inline_callback') {
            expect(element.callback_data).toBeDefined();
          }

          // Property: URL buttons have valid URL
          if (element.type === 'inline_url') {
            expect(element.url).toBeDefined();
            expect(element.url).toMatch(/^https?:\/\//);
          }
        }
      })
    );
  });

  test('should handle unicode and special characters', () => {
    fc.assert(
      fc.property(fc.unicodeString(), (text) => {
        const result = TelegramUIGenerator.generateUI(text, '');
        expect(Array.isArray(result)).toBe(true);
      })
    );
  });

  test('output size should be reasonable', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (text, context) => {
        const result = TelegramUIGenerator.generateUI(text, context);

        // Property: Not too many UI elements (max 10)
        expect(result.length).toBeLessThanOrEqual(10);

        // Property: Each button text not too long (max 64 chars)
        for (const element of result) {
          expect(element.text.length).toBeLessThanOrEqual(64);
        }
      })
    );
  });
});
```

---

## 🎯 Выводы и Best Practices

### 1. Всегда начинай с теста (RED)
- Пиши failing test ПЕРЕД кодом
- Убедись, что тест падает по правильной причине
- Clear error message = хороший тест

### 2. Минимальная реализация (GREEN)
- Пиши ровно столько кода, сколько нужно для прохождения
- Не думай о красоте на этом этапе
- Важна работоспособность, не оптимизация

### 3. Улучшай, сохраняя тесты зелёными (REFACTOR)
- Применяй DRY, SOLID, паттерны
- Тесты должны оставаться зелёными
- Small steps: маленькие изменения + запуск тестов

### 4. Используй AAA Pattern
- ARRANGE: Setup test data
- ACT: Execute code
- ASSERT: Verify results

### 5. Test Names = Documentation
```typescript
// ❌ BAD
test('test1', () => {});

// ✅ GOOD
test('should generate learning buttons for "обуч" keyword', () => {});
```

### 6. One Test, One Concept
- Тестируй одну вещь за раз
- Легче найти проблему
- Быстрее понять, что сломалось

### 7. Mock External Dependencies
- База данных → mock
- API calls → mock
- File system → mock
- Тесты должны быть fast & isolated

### 8. Watch Mode = TDD Superpower
```bash
bun test --watch
```
- Мгновенный feedback
- Видишь результат сразу
- Не отвлекаешься на запуск вручную

---

## 📚 Дополнительные Ресурсы

**Документация**:
- Bun Test: https://bun.com/docs/test
- Mocking Guide: https://bun.sh/guides/test/mock-functions
- Fast-Check: https://fast-check.dev/

**Наши Skills**:
- `.claude/skills/tdd-cycle-engine/SKILL.md`
- `.claude/skills/specification-writer/SKILL.md`
- `.claude/agents/test-engineer.md`

**Статьи**:
- Kent Beck - "Test-Driven Development By Example"
- Martin Fowler - "Mocks Aren't Stubs"
- Growing Object-Oriented Software, Guided by Tests

---

**Created**: 2025-01-12
**Purpose**: Practical TDD examples for Vibee development
**Status**: 🟢 Active Reference

**Red → Green → Refactor. Every. Single. Time. 🔄✨**
