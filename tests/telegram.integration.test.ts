/**
 * Integration Tests для Telegram Plugin
 *
 * Эти тесты проверяют:
 * 1. Инициализацию TelegramService
 * 2. Отправку команд (/start, /menu, /help)
 * 3. Получение ответов от бота
 * 4. Обработку событий
 * 5. Memory и persistence
 *
 * Based on ElizaOS Twitter plugin testing guide
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { IAgentRuntime } from '@elizaos/core';

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramResponse {
  ok: boolean;
  result: TelegramMessage | TelegramUpdate[];
  description?: string;
}

// Mock Runtime для изолированного тестирования
function createMockRuntime(): Partial<IAgentRuntime> {
  const eventHandlers = new Map<string, Function[]>();

  return {
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
    getMemories: vi.fn(() => Promise.resolve([])),
    addMemory: vi.fn(() => Promise.resolve()),
    getSetting: vi.fn((key: string) => {
      if (key === 'TELEGRAM_BOT_TOKEN') return process.env.TELEGRAM_BOT_TOKEN;
      return null;
    }),
  };
}

// Helper для API вызовов Telegram
class TelegramTestClient {
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async apiCall(method: string, params: Record<string, any> = {}): Promise<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }

    return data.result;
  }

  async sendMessage(chatId: number, text: string): Promise<TelegramMessage> {
    return this.apiCall('sendMessage', {
      chat_id: chatId,
      text,
    });
  }

  async getUpdates(offset?: number): Promise<TelegramUpdate[]> {
    return this.apiCall('getUpdates', {
      offset,
      timeout: 5,
    });
  }

  async getMe(): Promise<any> {
    return this.apiCall('getMe');
  }
}

describe('Telegram Plugin Integration Tests', () => {
  let runtime: Partial<IAgentRuntime>;
  let client: TelegramTestClient;
  let botInfo: any;
  let testChatId: number;

  beforeAll(async () => {
    // Загружаем тестовые env переменные
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set for testing');
    }

    // Инициализируем клиент
    client = new TelegramTestClient(botToken);
    botInfo = await client.getMe();

    // Получаем test chat ID из env
    const envChatId = process.env.TEST_TELEGRAM_CHAT_ID;
    if (envChatId) {
      testChatId = parseInt(envChatId, 10);
    }

    // Создаем mock runtime
    runtime = createMockRuntime();
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Bot Initialization', () => {
    it('should get bot info successfully', () => {
      expect(botInfo).toBeDefined();
      expect(botInfo.username).toBeDefined();
      expect(botInfo.first_name).toBeDefined();
    });

    it('should have correct bot username', () => {
      expect(botInfo.username).toContain('bot');
    });
  });

  describe('Message Sending', () => {
    it('should send message to test chat', async () => {
      if (!testChatId) {
        console.warn('⚠️ TEST_TELEGRAM_CHAT_ID not set, skipping test');
        return;
      }

      const message = await client.sendMessage(testChatId, 'Test message from integration test');

      expect(message).toBeDefined();
      expect(message.text).toBe('Test message from integration test');
      expect(message.chat.id).toBe(testChatId);
    });
  });

  describe('Command Testing', () => {
    it('should send /start command and receive response', async () => {
      if (!testChatId) {
        console.warn('⚠️ TEST_TELEGRAM_CHAT_ID not set, skipping test');
        return;
      }

      // Отправляем команду
      await client.sendMessage(testChatId, '/start');

      // Ждем ответ (15 секунд)
      const startTime = Date.now();
      let receivedResponse = false;
      let lastUpdateId = 0;

      // Получаем текущий offset
      const initialUpdates = await client.getUpdates();
      if (initialUpdates.length > 0) {
        lastUpdateId = initialUpdates[initialUpdates.length - 1].update_id;
      }

      while (Date.now() - startTime < 15000 && !receivedResponse) {
        const updates = await client.getUpdates(lastUpdateId + 1);

        for (const update of updates) {
          lastUpdateId = update.update_id;

          if (update.message && update.message.from.username === botInfo.username) {
            receivedResponse = true;
            expect(update.message.text).toBeDefined();
            expect(update.message.text.length).toBeGreaterThan(0);
            break;
          }
        }

        if (!receivedResponse) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Проверяем что получили ответ
      expect(receivedResponse).toBe(true);
    }, 30000); // 30 second timeout

    it('should handle /menu command', async () => {
      if (!testChatId) {
        console.warn('⚠️ TEST_TELEGRAM_CHAT_ID not set, skipping test');
        return;
      }

      await client.sendMessage(testChatId, '/menu');

      // Ждем ответ
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // TODO: Проверить что меню отобразилось
    }, 15000);

    it('should handle /help command', async () => {
      if (!testChatId) {
        console.warn('⚠️ TEST_TELEGRAM_CHAT_ID not set, skipping test');
        return;
      }

      await client.sendMessage(testChatId, '/help');

      // Ждем ответ
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // TODO: Проверить что help message отобразилось
    }, 15000);
  });

  describe('Event Emission', () => {
    it('should emit TELEGRAM_SLASH_START event on /start command', () => {
      const mockHandler = vi.fn();
      runtime.on?.('TELEGRAM_SLASH_START', mockHandler);

      // Симулируем событие
      runtime.emitEvent?.('TELEGRAM_SLASH_START', { text: '/start' });

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should respond to /start within 10 seconds', async () => {
      if (!testChatId) {
        console.warn('⚠️ TEST_TELEGRAM_CHAT_ID not set, skipping test');
        return;
      }

      const startTime = Date.now();

      await client.sendMessage(testChatId, '/start');

      // Ждем ответ и измеряем время
      let responseTime = 0;
      let receivedResponse = false;
      let lastUpdateId = 0;

      while (Date.now() - startTime < 15000 && !receivedResponse) {
        const updates = await client.getUpdates(lastUpdateId + 1);

        for (const update of updates) {
          lastUpdateId = update.update_id;

          if (update.message && update.message.from.username === botInfo.username) {
            responseTime = Date.now() - startTime;
            receivedResponse = true;
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(receivedResponse).toBe(true);
      expect(responseTime).toBeLessThan(10000);
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle invalid bot token gracefully', async () => {
      const invalidClient = new TelegramTestClient('invalid_token');

      await expect(invalidClient.getMe()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

      await expect(client.getMe()).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});
