/**
 * Unit Tests для Telegram Commands
 *
 * Используют моки для быстрого изолированного тестирования
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockTelegramAPI,
  createMockTelegramClient,
  mockScenarios,
  mockAssertions,
} from '../helpers/mock-telegram-api';
import {
  createMockRuntime,
  createMockTelegramContext,
  messageFixtures,
  botResponseFixtures,
  timingHelpers,
  performanceHelpers,
} from '../helpers/fixtures';

describe('Telegram Commands - Unit Tests', () => {
  let api: ReturnType<typeof createMockTelegramAPI>;
  let client: ReturnType<typeof createMockTelegramClient>;
  let runtime: ReturnType<typeof createMockRuntime>;

  beforeEach(() => {
    // Создаем свежие моки перед каждым тестом
    api = createMockTelegramAPI({
      botUsername: 'test_bot',
      responseDelay: 10, // 10ms задержка для реалистичности
    });

    client = createMockTelegramClient(api);
    runtime = createMockRuntime();

    // Очищаем все моки
    vi.clearAllMocks();
  });

  describe('/start Command', () => {
    it('should handle /start command', async () => {
      // Симулируем /start
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/start',
      });

      // Проверяем что update создан
      expect(update).toBeDefined();
      expect(update.message?.text).toBe('/start');
      expect(update.message?.entities?.[0].type).toBe('bot_command');
    });

    it('should emit TELEGRAM_SLASH_START event', async () => {
      const ctx = createMockTelegramContext({
        update: {
          message: messageFixtures.startCommand,
        },
      });

      // Создаем handler
      const handler = vi.fn();
      runtime.on('TELEGRAM_SLASH_START', handler);

      // Эмитим событие
      runtime.emitEvent(['TELEGRAM_SLASH_START'], { ctx });

      // Проверяем что handler вызван
      expect(handler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({ ctx });
    });

    it('should respond with welcome message', async () => {
      // Симулируем полный flow
      await mockScenarios.startCommand(api);

      // Проверяем что бот ответил
      const lastMessage = api.getLastBotMessage();
      expect(lastMessage).toBeDefined();
      expect(lastMessage?.text).toContain('Привет');
    });

    it('should respond quickly (< 1s)', async () => {
      await performanceHelpers.expectFasterThan(async () => {
        await mockScenarios.startCommand(api);
      }, 1000);
    });
  });

  describe('/menu Command', () => {
    it('should parse /menu command correctly', () => {
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/menu',
      });

      expect(update.message?.text).toBe('/menu');
      expect(update.message?.entities?.[0]).toMatchObject({
        type: 'bot_command',
        offset: 0,
        length: 5,
      });
    });

    it('should emit correct event for /menu', () => {
      const handler = vi.fn();
      runtime.on('TELEGRAM_SLASH_MENU', handler);

      runtime.emitEvent(['TELEGRAM_SLASH_MENU'], {
        ctx: createMockTelegramContext({
          update: { message: messageFixtures.menuCommand },
        }),
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('/help Command', () => {
    it('should handle /help command', () => {
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/help',
      });

      expect(update.message?.text).toBe('/help');
    });

    it('should respond with help text', async () => {
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/help',
      });

      // Симулируем ответ бота
      await api.sendMessage({
        chat_id: 123456,
        text: botResponseFixtures.help.text,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toContain('Помощь');
    });
  });

  describe('Regular Messages', () => {
    it('should handle regular text messages', () => {
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: 'Привет! Как дела?',
      });

      expect(update.message?.text).toBe('Привет! Как дела?');
      expect(update.message?.entities).toBeUndefined(); // No entities
    });

    it('should handle long messages', () => {
      const longText = 'A'.repeat(4000);

      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: longText,
      });

      expect(update.message?.text).toHaveLength(4000);
    });

    it('should handle messages with emojis', () => {
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '🚀 Привет! 👋',
      });

      expect(update.message?.text).toBe('🚀 Привет! 👋');
    });
  });

  describe('Multiple Commands Sequence', () => {
    it('should handle multiple commands in sequence', async () => {
      const commands = ['/start', '/menu', '/help'];

      for (const cmd of commands) {
        api.simulateUserMessage({
          chatId: 123456,
          userId: 999999,
          username: 'test_user',
          text: cmd,
        });

        await api.sendMessage({
          chat_id: 123456,
          text: `Response to ${cmd}`,
        });
      }

      const botMessages = api.getBotMessages();
      expect(botMessages).toHaveLength(3);
    });

    it('should maintain message order', async () => {
      await mockScenarios.multipleCommands(api);

      const allMessages = api.getAllMessages();
      const userMessages = allMessages.filter((m) => !m.from.is_bot);
      const botMessages = allMessages.filter((m) => m.from.is_bot);

      expect(userMessages).toHaveLength(3);
      expect(botMessages).toHaveLength(3);

      // Проверяем порядок
      expect(userMessages[0].text).toBe('/start');
      expect(userMessages[1].text).toBe('/menu');
      expect(userMessages[2].text).toBe('/help');
    });
  });

  describe('Event System', () => {
    it('should support multiple event handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      runtime.on('TEST_EVENT', handler1);
      runtime.on('TEST_EVENT', handler2);
      runtime.on('TEST_EVENT', handler3);

      runtime.emitEvent(['TEST_EVENT'], { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
      expect(handler3).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support event removal', () => {
      const handler = vi.fn();

      runtime.on('TEST_EVENT', handler);
      runtime.emitEvent(['TEST_EVENT'], { data: 'test1' });

      runtime.off('TEST_EVENT', handler);
      runtime.emitEvent(['TEST_EVENT'], { data: 'test2' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test1' });
    });

    it('should broadcast to multiple event names', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      runtime.on('EVENT_1', handler1);
      runtime.on('EVENT_2', handler2);

      runtime.emitEvent(['EVENT_1', 'EVENT_2'], { data: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('should store and retrieve memories', async () => {
      await runtime.addMemory({
        content: { text: 'Test memory' },
        roomId: 'test-room',
      });

      const memories = await runtime.getMemories({ roomId: 'test-room' });

      expect(memories).toHaveLength(1);
      expect(memories[0].content.text).toBe('Test memory');
    });

    it('should support multiple rooms', async () => {
      await runtime.addMemory({
        content: { text: 'Room 1 memory' },
        roomId: 'room-1',
      });

      await runtime.addMemory({
        content: { text: 'Room 2 memory' },
        roomId: 'room-2',
      });

      const room1Memories = await runtime.getMemories({ roomId: 'room-1' });
      const room2Memories = await runtime.getMemories({ roomId: 'room-2' });

      expect(room1Memories).toHaveLength(1);
      expect(room2Memories).toHaveLength(1);
      expect(room1Memories[0].content.text).toBe('Room 1 memory');
      expect(room2Memories[0].content.text).toBe('Room 2 memory');
    });

    it('should delete memories', async () => {
      await runtime.addMemory({
        id: 'memory-1',
        content: { text: 'Test' },
        roomId: 'test-room',
      });

      await runtime.deleteMemory('memory-1');

      const memories = await runtime.getMemories({ roomId: 'test-room' });
      expect(memories).toHaveLength(0);
    });
  });

  describe('Service Registry', () => {
    it('should register and retrieve services', () => {
      const mockService = {
        serviceType: 'test-service',
        initialize: vi.fn(),
      };

      runtime.registerService(mockService);

      const retrieved = runtime.getService('test-service');
      expect(retrieved).toBe(mockService);
    });

    it('should return null for non-existent services', () => {
      const service = runtime.getService('non-existent');
      expect(service).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle 100 messages quickly', async () => {
      const { avgMs } = await performanceHelpers.benchmark(
        '100 messages',
        async () => {
          api.simulateUserMessage({
            chatId: 123456,
            userId: 999999,
            username: 'test_user',
            text: 'Test message',
          });
        },
        100
      );

      console.log(`Average time per message: ${avgMs.toFixed(2)}ms`);
      expect(avgMs).toBeLessThan(50); // Should be < 50ms per message
    });

    it('should handle events efficiently', async () => {
      const handler = vi.fn();
      runtime.on('PERF_TEST', handler);

      const { avgMs } = await performanceHelpers.benchmark(
        'event emission',
        async () => {
          runtime.emitEvent(['PERF_TEST'], { data: 'test' });
        },
        1000
      );

      console.log(`Average time per event: ${avgMs.toFixed(3)}ms`);
      expect(avgMs).toBeLessThan(1); // Should be < 1ms per event
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message gracefully', () => {
      expect(() => {
        api.simulateUserMessage({
          chatId: 123456,
          userId: 999999,
          username: 'test_user',
          text: '', // Empty text
        });
      }).not.toThrow();
    });

    it('should handle missing username', () => {
      const update = api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: '', // Empty username
        text: 'Test',
      });

      expect(update.message).toBeDefined();
    });
  });

  describe('Mock API Assertions', () => {
    it('should use expectBotResponse assertion', async () => {
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/start',
      });

      await api.sendMessage({
        chat_id: 123456,
        text: 'Welcome!',
      });

      expect(() => {
        mockAssertions.expectBotResponse(api, 'Welcome!');
      }).not.toThrow();
    });

    it('should use expectBotMessageCount assertion', async () => {
      await api.sendMessage({ chat_id: 123456, text: 'Message 1' });
      await api.sendMessage({ chat_id: 123456, text: 'Message 2' });

      expect(() => {
        mockAssertions.expectBotMessageCount(api, 2);
      }).not.toThrow();
    });
  });
});
