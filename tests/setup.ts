/**
 * Test Setup Configuration
 * Global setup for all tests
 */

import { vi } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

// Set up global mocks before all tests

// Mock fetch globally
global.fetch = vi.fn();

// Mock Telegram API
global.telegram = {
  sendMessage: vi.fn(),
  sendPhoto: vi.fn(),
  sendVideo: vi.fn(),
  sendDocument: vi.fn(),
  editMessageText: vi.fn(),
  deleteMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
  getChat: vi.fn(),
  getChatMember: vi.fn(),
  setMyCommands: vi.fn(),
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock timers
vi.useFakeTimers();

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  vi.clearAllTimers();

  // Reset environment variables
  vi.stubGlobal('process', {
    ...process,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TELEGRAM_BOT_TOKEN: 'test-token',
      REPLICATE_API_TOKEN: 'test-replicate-token',
      KIE_AI_API_KEY: 'test-kie-key',
      OPENAI_API_KEY: 'test-openai-key',
    },
  });
});

// Cleanup after each test
afterEach(() => {
  vi.useRealTimers();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Helper function to create mock runtime
export function createMockRuntime(): IAgentRuntime {
  return {
    getSetting: vi.fn((key: string) => {
      const settings: Record<string, string> = {
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        REPLICATE_API_TOKEN: 'test-replicate-token',
        KIE_AI_API_KEY: 'test-kie-key',
        OPENAI_API_KEY: 'test-openai-key',
      };
      return settings[key] || undefined;
    }),
    setSetting: vi.fn(),
    registerPlugin: vi.fn(),
    unregisterPlugin: vi.fn(),
    getPlugin: vi.fn(),
    getPlugins: vi.fn().mockReturnValue([]),
    databaseAdapter: {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      insert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  } as any;
}

// Helper function to create mock message
export function createMockMessage(text: string, userId = 'user-123') {
  return {
    text,
    from: {
      id: userId,
      username: 'testuser',
      first_name: 'Test',
    },
    chat: {
      id: 'chat-123',
      type: 'private',
    },
    message_id: Date.now(),
    date: Math.floor(Date.now() / 1000),
  };
}

// Helper function to create mock callback query
export function createMockCallbackQuery(
  data: string,
  messageId = 'msg-1',
  userId = 'user-123'
) {
  return {
    id: `callback-${Date.now()}`,
    from: {
      id: userId,
      username: 'testuser',
    },
    message: {
      message_id: messageId,
      chat: {
        id: 'chat-123',
        type: 'private',
      },
    },
    data,
    chat_instance: 'chat-instance-123',
  };
}

// Helper function to wait for async operations
export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to flush promises
export async function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

// Jest/Vitest matchers extension
expect.extend({
  toHaveBeenCalledWithMessage(received, expectedText) {
    const calls = received.mock.calls;
    const hasMatch = calls.some((call) => {
      const message = call[1];
      return message && message.text && message.text.includes(expectedText);
    });

    return {
      pass: hasMatch,
      message: () =>
        `Expected mock to have been called with message containing "${expectedText}"`,
    };
  },

  toHaveBeenCalledWithCallback(received, expectedCallback) {
    const calls = received.mock.calls;
    const hasMatch = calls.some((call) => {
      const callback = call[1]?.reply_markup?.inline_keyboard;
      if (!callback) return false;

      const flat = callback.flat();
      return flat.some((btn) => btn.callback_data === expectedCallback);
    });

    return {
      pass: hasMatch,
      message: () =>
        `Expected mock to have been called with callback "${expectedCallback}"`,
    };
  },
});

declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        TestingLibraryMatchers<T, void> {}
  }
}

interface TestingLibraryMatchers<R, T> {
  toHaveBeenCalledWithMessage(expectedText: string): R;
  toHaveBeenCalledWithCallback(expectedCallback: string): R;
}

export {};
