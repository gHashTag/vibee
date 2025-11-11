/**
 * Test Fixtures
 *
 * Предопределенные тестовые данные для консистентного тестирования
 */

import type { IAgentRuntime } from '@elizaos/core';
import { vi } from 'vitest';

/**
 * Mock Runtime с расширенным функционалом
 */
export function createMockRuntime(overrides?: Partial<IAgentRuntime>): IAgentRuntime {
  const eventHandlers = new Map<string, Function[]>();
  const memories = new Map<string, any[]>();
  const services = new Map<string, any>();

  const mockRuntime: Partial<IAgentRuntime> = {
    // Event system
    emitEvent: vi.fn((event: string | string[], data: any) => {
      const events = Array.isArray(event) ? event : [event];
      events.forEach((e) => {
        const handlers = eventHandlers.get(e) || [];
        handlers.forEach((handler) => handler(data));
      });
    }),

    on: vi.fn((event: string, handler: Function) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)?.push(handler);
    }),

    off: vi.fn((event: string, handler: Function) => {
      const handlers = eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }),

    // Memory management
    getMemories: vi.fn(async (options?: any) => {
      const roomId = options?.roomId || 'default';
      return memories.get(roomId) || [];
    }),

    addMemory: vi.fn(async (memory: any) => {
      const roomId = memory.roomId || 'default';
      if (!memories.has(roomId)) {
        memories.set(roomId, []);
      }
      memories.get(roomId)?.push(memory);
    }),

    deleteMemory: vi.fn(async (memoryId: string) => {
      memories.forEach((roomMemories) => {
        const index = roomMemories.findIndex((m) => m.id === memoryId);
        if (index > -1) {
          roomMemories.splice(index, 1);
        }
      });
    }),

    // Service management
    getService: vi.fn((type: string) => {
      return services.get(type) || null;
    }),

    registerService: vi.fn((service: any) => {
      services.set(service.serviceType, service);
    }),

    // Settings
    getSetting: vi.fn((key: string) => {
      const settings: Record<string, any> = {
        TELEGRAM_BOT_TOKEN: 'mock_token',
        OPENAI_API_KEY: 'mock_openai_key',
        MODEL: 'gpt-4o-mini',
        ...overrides?.getSetting?.(key),
      };
      return settings[key] || null;
    }),

    // Character info
    character: {
      name: 'TestBot',
      username: 'test_bot',
      bio: ['Test bot for testing'],
      topics: ['testing'],
      style: { all: [], chat: [], post: [] },
      messageExamples: [],
      plugins: [],
      settings: {},
      ...overrides?.character,
    },

    // Agent ID
    agentId: 'test-agent-id',

    // Database client (mock)
    databaseClient: {
      query: vi.fn(),
      execute: vi.fn(),
    } as any,

    ...overrides,
  };

  return mockRuntime as IAgentRuntime;
}

/**
 * Mock Telegram Context
 */
export function createMockTelegramContext(overrides?: any) {
  return {
    update: {
      update_id: 123456,
      message: {
        message_id: 1,
        from: {
          id: 999999,
          first_name: 'Test User',
          username: 'test_user',
          is_bot: false,
        },
        chat: {
          id: 999999,
          type: 'private',
          first_name: 'Test User',
          username: 'test_user',
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
        ...overrides?.update?.message,
      },
      ...overrides?.update,
    },

    message: overrides?.update?.message || {
      message_id: 1,
      from: {
        id: 999999,
        first_name: 'Test User',
        username: 'test_user',
      },
      chat: {
        id: 999999,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: '/start',
    },

    chat: {
      id: 999999,
      type: 'private',
      first_name: 'Test User',
      username: 'test_user',
      ...overrides?.chat,
    },

    from: {
      id: 999999,
      first_name: 'Test User',
      username: 'test_user',
      is_bot: false,
      ...overrides?.from,
    },

    reply: vi.fn(async (text: string, extra?: any) => {
      return {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 123456789,
          is_bot: true,
          first_name: 'TestBot',
          username: 'test_bot',
        },
        chat: {
          id: 999999,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text,
        ...extra,
      };
    }),

    replyWithMarkdown: vi.fn(),
    replyWithHTML: vi.fn(),
    sendChatAction: vi.fn(),
    editMessageText: vi.fn(),
    deleteMessage: vi.fn(),

    telegram: {
      sendMessage: vi.fn(),
      sendChatAction: vi.fn(),
      getMe: vi.fn(async () => ({
        id: 123456789,
        is_bot: true,
        first_name: 'TestBot',
        username: 'test_bot',
      })),
    },

    ...overrides,
  };
}

/**
 * Фикстуры сообщений
 */
export const messageFixtures = {
  startCommand: {
    text: '/start',
    entities: [{ type: 'bot_command', offset: 0, length: 6 }],
  },

  menuCommand: {
    text: '/menu',
    entities: [{ type: 'bot_command', offset: 0, length: 5 }],
  },

  helpCommand: {
    text: '/help',
    entities: [{ type: 'bot_command', offset: 0, length: 5 }],
  },

  regularMessage: {
    text: 'Привет! Как дела?',
  },

  longMessage: {
    text: 'A'.repeat(4000),
  },

  messageWithMention: {
    text: '@test_bot привет!',
    entities: [{ type: 'mention', offset: 0, length: 9 }],
  },

  messageWithUrl: {
    text: 'Посмотри https://example.com',
    entities: [{ type: 'url', offset: 10, length: 19 }],
  },
};

/**
 * Фикстуры пользователей
 */
export const userFixtures = {
  regularUser: {
    id: 999999,
    first_name: 'Test User',
    username: 'test_user',
    is_bot: false,
  },

  premiumUser: {
    id: 888888,
    first_name: 'Premium User',
    username: 'premium_user',
    is_bot: false,
    is_premium: true,
  },

  adminUser: {
    id: 777777,
    first_name: 'Admin User',
    username: 'admin_user',
    is_bot: false,
  },

  botUser: {
    id: 123456789,
    first_name: 'TestBot',
    username: 'test_bot',
    is_bot: true,
  },
};

/**
 * Фикстуры чатов
 */
export const chatFixtures = {
  privateChat: {
    id: 999999,
    type: 'private' as const,
    first_name: 'Test User',
    username: 'test_user',
  },

  groupChat: {
    id: -1001234567890,
    type: 'group' as const,
    title: 'Test Group',
  },

  superGroup: {
    id: -1009876543210,
    type: 'supergroup' as const,
    title: 'Test Supergroup',
    username: 'test_supergroup',
  },

  channel: {
    id: -1005555555555,
    type: 'channel' as const,
    title: 'Test Channel',
    username: 'test_channel',
  },
};

/**
 * Фикстуры ответов бота
 */
export const botResponseFixtures = {
  welcome: {
    text: 'Привет! 👋 Я Vibee, твой AI-наставник по vibe-coding!\n\nЧем могу помочь? 🚀',
  },

  menu: {
    text: '📋 Меню команд:\n\n/start - Начать общение\n/menu - Показать меню\n/help - Помощь\n\nИли просто напиши что тебе нужно!',
  },

  help: {
    text: '❓ Помощь:\n\nЯ помогу тебе с:\n- Vibe-coding практиками\n- TypeScript и современным JS\n- React и Next.js\n- ElizaOS и AI-агентами\n\nПросто спроси! 💪',
  },

  error: {
    text: '❌ Произошла ошибка. Попробуй еще раз или напиши /help для помощи.',
  },
};

/**
 * Фикстуры событий
 */
export const eventFixtures = {
  telegramSlashStart: {
    event: 'TELEGRAM_SLASH_START',
    data: {
      ctx: createMockTelegramContext({
        update: {
          message: {
            text: '/start',
          },
        },
      }),
    },
  },

  telegramMessage: {
    event: 'TELEGRAM_MESSAGE',
    data: {
      ctx: createMockTelegramContext({
        update: {
          message: {
            text: 'Hello!',
          },
        },
      }),
    },
  },
};

/**
 * Timing helpers для тестов
 */
export const timingHelpers = {
  /**
   * Ждать определенное время
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Ждать пока условие не станет true
   */
  waitForCondition: async (
    condition: () => boolean,
    timeoutMs: number = 5000,
    checkIntervalMs: number = 100
  ): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (condition()) {
        return true;
      }
      await timingHelpers.wait(checkIntervalMs);
    }

    return false;
  },

  /**
   * Измерить время выполнения
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    return { result, duration };
  },
};

/**
 * Assertion helpers
 */
export const assertionHelpers = {
  /**
   * Проверить что значение в диапазоне
   */
  expectInRange: (value: number, min: number, max: number, message?: string) => {
    if (value < min || value > max) {
      throw new Error(
        message || `Expected ${value} to be between ${min} and ${max}`
      );
    }
  },

  /**
   * Проверить что функция вызвана с правильными аргументами
   */
  expectCalledWith: (mockFn: any, expectedArgs: any[]) => {
    const calls = mockFn.mock.calls;
    const found = calls.some((call: any[]) => {
      return expectedArgs.every((arg, index) => {
        if (typeof arg === 'object') {
          return JSON.stringify(call[index]) === JSON.stringify(arg);
        }
        return call[index] === arg;
      });
    });

    if (!found) {
      throw new Error(
        `Expected function to be called with ${JSON.stringify(expectedArgs)}`
      );
    }
  },

  /**
   * Проверить что строка соответствует одному из паттернов
   */
  expectMatchesOneOf: (value: string, patterns: (string | RegExp)[]) => {
    const matches = patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return value.includes(pattern);
      }
      return pattern.test(value);
    });

    if (!matches) {
      throw new Error(
        `Expected "${value}" to match one of patterns: ${patterns.join(', ')}`
      );
    }
  },
};

/**
 * Cleanup helpers
 */
export const cleanupHelpers = {
  /**
   * Очистить все моки
   */
  clearAllMocks: () => {
    vi.clearAllMocks();
  },

  /**
   * Восстановить все моки
   */
  restoreAllMocks: () => {
    vi.restoreAllMocks();
  },

  /**
   * Очистить память runtime
   */
  clearRuntimeMemory: (runtime: IAgentRuntime) => {
    // Implementation depends on runtime structure
  },
};

/**
 * Snapshot helpers
 */
export const snapshotHelpers = {
  /**
   * Нормализовать данные для snapshot
   * (удаляет timestamp, random IDs, etc.)
   */
  normalizeForSnapshot: (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(snapshotHelpers.normalizeForSnapshot);
    }

    if (data && typeof data === 'object') {
      const normalized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Пропускаем динамические поля
        if (['date', 'timestamp', 'message_id', 'update_id'].includes(key)) {
          normalized[key] = '[DYNAMIC]';
        } else {
          normalized[key] = snapshotHelpers.normalizeForSnapshot(value);
        }
      }

      return normalized;
    }

    return data;
  },
};

/**
 * Performance helpers
 */
export const performanceHelpers = {
  /**
   * Benchmark функции
   */
  benchmark: async (
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<{
    name: string;
    avgMs: number;
    minMs: number;
    maxMs: number;
    totalMs: number;
  }> => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await timingHelpers.measureTime(fn);
      times.push(duration);
    }

    const totalMs = times.reduce((sum, time) => sum + time, 0);
    const avgMs = totalMs / iterations;
    const minMs = Math.min(...times);
    const maxMs = Math.max(...times);

    return {
      name,
      avgMs,
      minMs,
      maxMs,
      totalMs,
    };
  },

  /**
   * Проверить что операция быстрее лимита
   */
  expectFasterThan: async (
    fn: () => Promise<void>,
    maxMs: number,
    message?: string
  ): Promise<void> => {
    const { duration } = await timingHelpers.measureTime(fn);

    if (duration > maxMs) {
      throw new Error(
        message || `Expected operation to take < ${maxMs}ms, but took ${duration}ms`
      );
    }
  },
};
