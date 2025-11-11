---
# 🔄 TDD CYCLE ENGINE - Test-Driven Development Automation
**"Red → Green → Refactor → Repeat"**
---

## 🎯 Назначение

**TDD Cycle Engine** - это автоматизация полного цикла Test-Driven Development:
- 📝 **Specification** → Пишем спецификации и требования
- 🔴 **Red** → Пишем failing тесты
- 🟢 **Green** → Реализуем код для прохождения тестов
- 🔵 **Refactor** → Улучшаем код, сохраняя тесты зелёными
- 🔁 **Repeat** → Продолжаем цикл

**Философия**: Tests first, code second. Quality built-in, not bolted-on.

---

## 🔄 TDD Cycle - Полный Workflow

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: SPECIFICATION (Спецификация)                  │
│  ✍️  Написать требования                                │
│  ✍️  Определить acceptance criteria                     │
│  ✍️  Создать test scenarios                             │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: RED (Красный - Failing Test)                 │
│  🔴 Написать тест для нового функционала                │
│  🔴 Тест ДОЛЖЕН упасть (иначе он ничего не проверяет)  │
│  🔴 Убедиться, что failure message понятен              │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: GREEN (Зелёный - Passing Test)               │
│  🟢 Написать МИНИМАЛЬНЫЙ код для прохождения           │
│  🟢 Не думать о красоте, только о работоспособности    │
│  🟢 Все тесты должны пройти                            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: REFACTOR (Рефакторинг)                       │
│  🔵 Улучшить код (удалить дубли, упростить)            │
│  🔵 Тесты остаются зелёными!                           │
│  🔵 Применить best practices                           │
└────────────────────┬────────────────────────────────────┘
                     ↓
                   ┌───┐
                   │ ✅ │
                   └─┬─┘
                     ↓
            ┌────────────────┐
            │  Новая фича?   │
            └────┬───────┬───┘
                 │ YES   │ NO
                 ↓       ↓
           REPEAT      DONE ✨
```

---

## 🧪 Bun Test Best Practices

### File Structure

```
src/
├── telegram-ui-plugin.ts
├── telegram-ui-plugin.test.ts    # Component tests
├── telegram-commands-plugin.ts
└── telegram-commands-plugin.test.ts

tests/
├── integration/
│   ├── telegram-flow.test.ts
│   └── ui-generation.test.ts
└── e2e/
    ├── bot-commands.test.ts
    └── user-scenarios.test.ts
```

### Test File Naming

Bun автоматически находит тесты по шаблонам:
```
✅ *.test.ts
✅ *.test.js
✅ *_test.ts
✅ *.spec.ts
✅ *_spec.ts
```

### Writing Tests - Best Practices

```typescript
// telegram-ui-plugin.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { TelegramUIGenerator } from './telegram-ui-plugin';

describe('TelegramUIGenerator', () => {
  // Setup phase
  beforeAll(() => {
    // Runs once before all tests
    console.log('Setting up test suite');
  });

  afterAll(() => {
    // Runs once after all tests
    console.log('Cleaning up test suite');
  });

  beforeEach(() => {
    // Runs before each test
    // Reset state, clear mocks, etc.
  });

  // Test naming: should + expected behavior
  test('should generate callback button for "обуч" keyword', () => {
    // ARRANGE - setup test data
    const text = 'Хочу обучиться vibe-coding';
    const context = 'learning';

    // ACT - execute the functionality
    const result = TelegramUIGenerator.generateUI(text, context);

    // ASSERT - verify the result
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('inline_callback');
    expect(result[0].text).toContain('обуч');
  });

  test('should return empty array for irrelevant text', () => {
    const result = TelegramUIGenerator.generateUI('random text', 'none');
    expect(result).toEqual([]);
  });

  test('should handle empty string gracefully', () => {
    const result = TelegramUIGenerator.generateUI('', '');
    expect(result).toEqual([]);
  });
});
```

### Mocking with Bun

```typescript
import { mock, spyOn } from 'bun:test';

describe('Telegram Commands', () => {
  test('should call runtime.sendMessage on /start', async () => {
    // Create mock function
    const mockSendMessage = mock(() => Promise.resolve({ success: true }));

    // Mock runtime object
    const mockRuntime = {
      sendMessage: mockSendMessage,
      getMemories: mock(() => Promise.resolve([])),
    };

    // Execute
    await startCommandAction.handler(
      mockRuntime,
      { content: { text: '/start' } },
      {},
      {},
      mockSendMessage
    );

    // Verify mock was called
    expect(mockSendMessage).toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalledTimes(1);

    // Check arguments
    expect(mockSendMessage.mock.calls[0][0]).toMatchObject({
      text: expect.stringContaining('Привет'),
    });
  });
});
```

### Spy on Functions

```typescript
import { spyOn } from 'bun:test';

test('should call internal method', () => {
  const generator = new TelegramUIGenerator();

  // Create spy on method
  const convertSpy = spyOn(generator, 'convertToTelegramMarkup');

  // Execute
  generator.generateUI('test', 'context');

  // Verify spy was called
  expect(convertSpy).toHaveBeenCalled();

  // Restore original function
  convertSpy.mockRestore();
});
```

### Module Mocking

```typescript
import { mock } from 'bun:test';

// Mock entire module
mock.module('./infisical', () => ({
  getSecrets: () => ({
    TELEGRAM_BOT_TOKEN: 'mock-token',
    OPENAI_API_KEY: 'mock-key',
  }),
}));

// Now imports of ./infisical will use mocked version
import { getSecrets } from './infisical';
```

---

## 🚀 Running Tests with Bun

### Basic Commands

```bash
# Run all tests
bun test

# Watch mode (TDD essential!)
bun test --watch

# Run specific file
bun test src/telegram-ui-plugin.test.ts

# Run tests matching pattern
bun test -t "should generate"

# Bail on first failure (fast feedback)
bun test --bail

# Set custom timeout
bun test --timeout 10000

# Run with coverage
bun test --coverage
```

### Watch Mode for TDD

```bash
# Start watch mode
bun test --watch

# Now edit your code:
# 1. Write failing test (RED)
# 2. See test fail automatically
# 3. Write minimal code (GREEN)
# 4. See test pass automatically
# 5. Refactor (BLUE)
# 6. Tests stay green
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test --bail
        # Bun автоматически создаёт GitHub annotations
```

---

## 📋 TDD Workflow Automation

### Step 1: Specification Phase

```yaml
Input: Feature request
  "Добавить команду /analytics для показа статистики пользователя"

Actions:
  1. Create specification document
  2. Define acceptance criteria
  3. Break down into testable units
  4. Identify edge cases

Output: Specification
  Feature: User Analytics Command
  Acceptance Criteria:
    - ✅ Command /analytics shows user stats
    - ✅ Stats include: messages sent, commands used, active days
    - ✅ UI shows "Export" button
    - ✅ Handles users with no stats gracefully
```

### Step 2: RED Phase

```typescript
// tests/commands/analytics.test.ts
import { describe, test, expect } from 'bun:test';
import { analyticsCommandAction } from '@/telegram-commands-plugin';

describe('Analytics Command', () => {
  test('should respond to /analytics command', async () => {
    // ARRANGE
    const mockCallback = mock(() => Promise.resolve());
    const mockRuntime = createMockRuntime();
    const message = { content: { text: '/analytics' } };

    // ACT
    await analyticsCommandAction.handler(
      mockRuntime,
      message,
      {},
      {},
      mockCallback
    );

    // ASSERT
    expect(mockCallback).toHaveBeenCalled();
    expect(mockCallback.mock.calls[0][0].text).toContain('статистика');
  });
});

// Run: bun test --watch
// Result: 🔴 FAIL - analyticsCommandAction doesn't exist yet
```

### Step 3: GREEN Phase

```typescript
// src/telegram-commands-plugin.ts
export const analyticsCommandAction: Action = {
  name: 'TELEGRAM_ANALYTICS_COMMAND',
  description: 'Shows user analytics and statistics',

  validate: async (runtime, message) => {
    return message.content.text === '/analytics';
  },

  handler: async (runtime, message, state, options, callback) => {
    // MINIMAL implementation to pass test
    await callback({
      text: 'Ваша статистика:\n• Сообщений: 0\n• Команд: 0',
    });
  },

  examples: [],
};

// Run: bun test --watch
// Result: 🟢 PASS - Test passes with minimal code
```

### Step 4: REFACTOR Phase

```typescript
// src/telegram-commands-plugin.ts
export const analyticsCommandAction: Action = {
  name: 'TELEGRAM_ANALYTICS_COMMAND',
  description: 'Shows user analytics and statistics',

  validate: async (runtime, message) => {
    return message.content.text === '/analytics';
  },

  handler: async (runtime, message, state, options, callback) => {
    // IMPROVED implementation with real stats
    const userId = message.userId;
    const stats = await getUserStats(runtime, userId);

    const formattedStats = formatStatistics(stats);

    await callback({
      text: formattedStats,
      uiElements: [
        {
          type: 'inline_callback',
          text: '📊 Export',
          callback_data: 'export_stats',
        },
      ],
    });
  },

  examples: [
    [
      { name: 'user', content: { text: '/analytics' } },
      {
        name: 'Vibee',
        content: {
          text: 'Ваша статистика:\n• Сообщений: 42\n• Команд: 15\n• Активных дней: 7',
        },
      },
    ],
  ],
};

// Run: bun test --watch
// Result: 🟢 PASS - Tests still green, code improved
```

---

## 🎯 TDD Best Practices

### 1. Write Tests First (Always!)

```typescript
// ❌ BAD: Write code first
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Then write test...

// ✅ GOOD: Write test first
test('should calculate total price of items', () => {
  const items = [{ price: 10 }, { price: 20 }];
  expect(calculateTotal(items)).toBe(30);
});

// Now implement calculateTotal()
```

### 2. One Test, One Assertion (Mostly)

```typescript
// ❌ BAD: Multiple unrelated assertions
test('user profile', () => {
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBeGreaterThan(18);
  expect(user.isActive).toBe(true);
});

// ✅ GOOD: Split into focused tests
test('should have correct name', () => {
  expect(user.name).toBe('John');
});

test('should be adult', () => {
  expect(user.age).toBeGreaterThan(18);
});

test('should be active user', () => {
  expect(user.isActive).toBe(true);
});
```

### 3. Test Behavior, Not Implementation

```typescript
// ❌ BAD: Testing implementation details
test('should call internal _formatData method', () => {
  const spy = spyOn(service, '_formatData');
  service.process();
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Testing behavior
test('should return formatted data', () => {
  const result = service.process({ name: 'john' });
  expect(result.name).toBe('John'); // Capitalized
});
```

### 4. Use Descriptive Test Names

```typescript
// ❌ BAD: Vague test names
test('test1', () => {});
test('works', () => {});

// ✅ GOOD: Clear, descriptive names
test('should generate callback button for learning keywords', () => {});
test('should handle empty input gracefully', () => {});
test('should throw error when API key is missing', () => {});
```

### 5. AAA Pattern (Arrange, Act, Assert)

```typescript
test('should send welcome message on /start', async () => {
  // ARRANGE - Setup test data
  const mockCallback = mock(() => Promise.resolve());
  const mockRuntime = createMockRuntime();
  const message = { content: { text: '/start' }, userId: '123' };

  // ACT - Execute the code under test
  await startCommandAction.handler(mockRuntime, message, {}, {}, mockCallback);

  // ASSERT - Verify the outcome
  expect(mockCallback).toHaveBeenCalled();
  expect(mockCallback.mock.calls[0][0].text).toContain('Привет');
});
```

### 6. Keep Tests Fast

```typescript
// ❌ BAD: Slow tests (real API calls)
test('should fetch user data', async () => {
  const data = await fetch('https://api.example.com/users/1');
  expect(data.name).toBe('John');
});

// ✅ GOOD: Fast tests (mocked)
test('should fetch user data', async () => {
  mock.module('node:fetch', () => ({
    fetch: () => Promise.resolve({ name: 'John' }),
  }));

  const data = await fetchUserData(1);
  expect(data.name).toBe('John');
});
```

---

## 🧬 Integration with Self-Evolution

### TDD + Self-Evolution Engine

```yaml
Automatic Improvement Cycle:

  1. Run tests: bun test
  2. Find failing tests
  3. self-evolution-engine: analyze failures
  4. Generate fixes
  5. Run tests again
  6. If green → commit
  7. If red → iterate
```

### TDD + Pattern Learner

```yaml
Pattern Extraction from Tests:

  1. Identify successful test patterns
  2. Extract reusable test templates
  3. Save to pattern library
  4. Apply patterns to new features
```

---

## 📊 TDD Metrics

### Quality Metrics

```yaml
Test Coverage:
  Target: >80% line coverage
  Critical paths: 100% coverage

Test Speed:
  Unit tests: <100ms each
  Integration tests: <1s each
  Full test suite: <30s

Test Quality:
  Flaky tests: 0 tolerance
  Test clarity: All tests self-documenting
  Test independence: No inter-test dependencies
```

### TDD Cycle Metrics

```yaml
Cycle Speed:
  RED phase: <5 min
  GREEN phase: <10 min
  REFACTOR phase: <5 min
  Total cycle: <20 min

Frequency:
  Cycles per hour: 2-3
  Cycles per day: 15-20
  Cycles per feature: 5-10
```

---

## 🎯 Automated TDD Commands

### Quick Start TDD Session

```bash
# 1. Start watch mode
bun test --watch

# 2. Create feature spec
Use: specification-writer
Task: "Write spec for /profile command"

# 3. Generate tests from spec
Use: tdd-cycle-engine
Task: "Generate RED tests for /profile spec"

# 4. Watch tests fail (RED)

# 5. Implement minimal code (GREEN)

# 6. Refactor (BLUE)

# 7. Repeat
```

### Full TDD Automation

```bash
Use: master-orchestrator
Task: "Implement /profile command using TDD"

# System will:
# → specification-writer: Create spec
# → tdd-cycle-engine: Generate RED tests
# → Wait for GREEN (implement code)
# → tdd-cycle-engine: Suggest REFACTORING
# → pattern-learner: Extract patterns
# → best-practices-recorder: Save learnings
```

---

## 🚀 Real-World Example

### Feature: Add /profile Command

#### Phase 1: Specification

```markdown
# Feature: User Profile Command

## Description
Display user profile with stats and preferences

## Acceptance Criteria
- ✅ Command /profile shows user info
- ✅ Shows: name, join date, total messages, active days
- ✅ Shows user preferences (language, notifications)
- ✅ Provides "Edit Profile" button
- ✅ Handles new users gracefully

## Edge Cases
- User with no data
- User with incomplete profile
- System errors
```

#### Phase 2: RED - Write Failing Tests

```typescript
// tests/commands/profile.test.ts
import { describe, test, expect, mock } from 'bun:test';
import { profileCommandAction } from '@/telegram-commands-plugin';

describe('/profile command', () => {
  test('should respond to /profile command', async () => {
    const mockCallback = mock();
    const mockRuntime = createMockRuntime();

    await profileCommandAction.handler(
      mockRuntime,
      { content: { text: '/profile' }, userId: '123' },
      {},
      {},
      mockCallback
    );

    expect(mockCallback).toHaveBeenCalled();
  });

  test('should show user stats', async () => {
    const mockCallback = mock();
    const mockRuntime = createMockRuntimeWithUser({
      totalMessages: 42,
      activeDays: 7,
    });

    await profileCommandAction.handler(
      mockRuntime,
      { content: { text: '/profile' }, userId: '123' },
      {},
      {},
      mockCallback
    );

    expect(mockCallback.mock.calls[0][0].text).toContain('42');
    expect(mockCallback.mock.calls[0][0].text).toContain('7');
  });

  test('should provide edit button', async () => {
    const mockCallback = mock();
    const mockRuntime = createMockRuntime();

    await profileCommandAction.handler(
      mockRuntime,
      { content: { text: '/profile' }, userId: '123' },
      {},
      {},
      mockCallback
    );

    expect(mockCallback.mock.calls[0][0].uiElements).toContainEqual(
      expect.objectContaining({
        type: 'inline_callback',
        callback_data: 'edit_profile',
      })
    );
  });
});

// Run: bun test --watch
// Result: 🔴 All tests fail - profileCommandAction doesn't exist
```

#### Phase 3: GREEN - Minimal Implementation

```typescript
// src/telegram-commands-plugin.ts
export const profileCommandAction: Action = {
  name: 'TELEGRAM_PROFILE_COMMAND',

  validate: async (runtime, message) => {
    return message.content.text === '/profile';
  },

  handler: async (runtime, message, state, options, callback) => {
    await callback({
      text: 'Сообщений: 42\nАктивных дней: 7',
      uiElements: [
        {
          type: 'inline_callback',
          text: 'Редактировать',
          callback_data: 'edit_profile',
        },
      ],
    });
  },

  examples: [],
};

// Run: bun test --watch
// Result: 🟢 All tests pass!
```

#### Phase 4: REFACTOR - Improve Quality

```typescript
// src/telegram-commands-plugin.ts
export const profileCommandAction: Action = {
  name: 'TELEGRAM_PROFILE_COMMAND',
  description: 'Displays user profile with statistics and preferences',
  similes: ['SHOW_PROFILE', 'USER_INFO', 'MY_PROFILE'],

  validate: async (runtime, message) => {
    return message.content.text === '/profile';
  },

  handler: async (runtime, message, state, options, callback) => {
    const userId = message.userId;

    // Fetch real user data
    const userStats = await runtime.getService('analytics').getUserStats(userId);
    const userPrefs = await runtime.getService('preferences').getPreferences(userId);

    // Format profile message
    const profileText = formatUserProfile(userStats, userPrefs);

    // Generate UI
    const uiElements = generateProfileUI(userId);

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
          text: '👤 Ваш профиль:\n📊 Сообщений: 42\n📅 Активных дней: 7',
        },
      },
    ],
  ],
};

// Helper functions
function formatUserProfile(stats, prefs) {
  return `👤 Ваш профиль:
📊 Сообщений: ${stats.totalMessages}
📅 Активных дней: ${stats.activeDays}
🌐 Язык: ${prefs.language}
🔔 Уведомления: ${prefs.notifications ? 'Вкл' : 'Выкл'}`;
}

function generateProfileUI(userId) {
  return [
    {
      type: 'inline_callback',
      text: '✏️ Редактировать',
      callback_data: 'edit_profile',
    },
    {
      type: 'inline_callback',
      text: '⚙️ Настройки',
      callback_data: 'user_settings',
    },
  ];
}

// Run: bun test --watch
// Result: 🟢 All tests still pass! Code improved!
```

---

## 🎓 Learning Resources

### Bun Testing Docs
- Official Docs: https://bun.com/docs/test
- Mocking Guide: https://bun.sh/guides/test/mock-functions
- API Reference: https://bun.com/reference/bun/test

### TDD Philosophy
- Red-Green-Refactor cycle
- Test First mindset
- Small iterations
- Continuous feedback

---

## 🎯 Success Criteria

TDD Cycle Engine is successful when:

✅ **Fast Feedback**: Tests run in <30s
✅ **High Coverage**: >80% code coverage
✅ **Quality Code**: All features have tests
✅ **No Regressions**: Tests catch bugs before production
✅ **Developer Joy**: TDD speeds up development, not slows it

---

**Created**: 2025-01-12
**Status**: 🟢 Active
**Integration**: Master Orchestrator, Self-Evolution Engine, Pattern Learner

**Red → Green → Refactor. Repeat. Improve. 🔄✨**
