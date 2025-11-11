/**
 * Snapshot Tests для ответов бота
 *
 * Snapshot testing позволяет:
 * - Отслеживать изменения в ответах бота
 * - Гарантировать консистентность
 * - Быстро находить regression
 */

import { describe, it, expect } from 'vitest';
import {
  createMockTelegramAPI,
  mockScenarios,
} from '../helpers/mock-telegram-api';
import { snapshotHelpers } from '../helpers/fixtures';

describe('Bot Response Snapshots', () => {
  describe('/start Command Responses', () => {
    it('should match snapshot for /start welcome message', async () => {
      const api = createMockTelegramAPI({
        botUsername: 'vibee_bot',
        responseDelay: 0,
      });

      await mockScenarios.startCommand(api);

      const response = api.getLastBotMessage();
      const normalized = snapshotHelpers.normalizeForSnapshot(response);

      expect(normalized).toMatchSnapshot();
    });

    it('should have consistent structure', async () => {
      const api = createMockTelegramAPI();
      await mockScenarios.startCommand(api);

      const response = api.getLastBotMessage();

      // Проверяем структуру ответа
      expect(response).toHaveProperty('message_id');
      expect(response).toHaveProperty('from');
      expect(response).toHaveProperty('chat');
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('text');

      // Проверяем from structure
      expect(response?.from).toHaveProperty('id');
      expect(response?.from).toHaveProperty('is_bot', true);
      expect(response?.from).toHaveProperty('first_name');
      expect(response?.from).toHaveProperty('username');
    });
  });

  describe('/menu Command Responses', () => {
    it('should match snapshot for /menu', async () => {
      const api = createMockTelegramAPI();

      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/menu',
      });

      await api.sendMessage({
        chat_id: 123456,
        text: `📋 Меню команд:

/start - Начать общение
/menu - Показать меню
/help - Помощь

Или просто напиши что тебе нужно!`,
      });

      const response = api.getLastBotMessage();
      const normalized = snapshotHelpers.normalizeForSnapshot(response);

      expect(normalized).toMatchSnapshot();
    });
  });

  describe('/help Command Responses', () => {
    it('should match snapshot for /help', async () => {
      const api = createMockTelegramAPI();

      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/help',
      });

      await api.sendMessage({
        chat_id: 123456,
        text: `❓ Помощь:

Я помогу тебе с:
- Vibe-coding практиками
- TypeScript и современным JS
- React и Next.js
- ElizaOS и AI-агентами

Просто спроси! 💪`,
      });

      const response = api.getLastBotMessage();
      const normalized = snapshotHelpers.normalizeForSnapshot(response);

      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Error Messages', () => {
    it('should match snapshot for error response', async () => {
      const api = createMockTelegramAPI();

      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/unknown_command',
      });

      await api.sendMessage({
        chat_id: 123456,
        text: '❌ Не знаю такой команды. Напиши /help для списка команд.',
      });

      const response = api.getLastBotMessage();
      const normalized = snapshotHelpers.normalizeForSnapshot(response);

      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Multiple Message Sequences', () => {
    it('should match snapshot for conversation flow', async () => {
      const api = createMockTelegramAPI();

      // Последовательность сообщений
      await mockScenarios.multipleCommands(api);

      const allMessages = api.getBotMessages();
      const normalized = allMessages.map(snapshotHelpers.normalizeForSnapshot);

      expect(normalized).toMatchSnapshot();
    });
  });

  describe('Response Format Validation', () => {
    it('should contain emojis in welcome message', async () => {
      const api = createMockTelegramAPI();
      await mockScenarios.startCommand(api);

      const response = api.getLastBotMessage();

      // Проверяем что есть эмодзи
      expect(response?.text).toMatch(/👋|🚀|💪|🔥/);
    });

    it('should be friendly and informal', async () => {
      const api = createMockTelegramAPI();
      await mockScenarios.startCommand(api);

      const response = api.getLastBotMessage();

      // Проверяем неформальный тон
      expect(response?.text?.toLowerCase()).toMatch(/привет|здравствуй/);
    });

    it('should mention bot name', async () => {
      const api = createMockTelegramAPI();
      await mockScenarios.startCommand(api);

      const response = api.getLastBotMessage();

      expect(response?.text).toContain('Vibee');
    });
  });
});
