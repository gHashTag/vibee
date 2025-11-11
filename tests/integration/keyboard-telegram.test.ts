/**
 * Integration Tests для Telegram Keyboards
 *
 * Тестируем интеграцию клавиатур с Telegram API
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockTelegramAPI } from '../helpers/mock-telegram-api';
import { keyboard } from '../../src/telegram-keyboards/KeyboardBuilder';

describe('Telegram Keyboards Integration', () => {
  let api: ReturnType<typeof createMockTelegramAPI>;

  beforeEach(() => {
    api = createMockTelegramAPI({
      botUsername: 'keyboard_test_bot',
      responseDelay: 0,
    });
  });

  describe('Sending Keyboards with Messages', () => {
    it('should send message with inline keyboard', async () => {
      const kb = keyboard.builder().callback('Click me', 'button_clicked').buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Choose an option:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage).toBeDefined();
      expect(lastMessage?.text).toBe('Choose an option:');
    });

    it('should send main menu keyboard', async () => {
      const mainMenu = keyboard.builder().usePattern('main_menu').buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Выберите действие:',
        reply_markup: mainMenu as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Выберите действие:');
    });

    it('should send yes/no keyboard', async () => {
      const yesNoKeyboard = keyboard.builder().usePattern('yes_no').buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Вы согласны?',
        reply_markup: yesNoKeyboard as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Вы согласны?');
    });
  });

  describe('User Interaction Flow', () => {
    it('should handle callback button click', async () => {
      // Bot sends keyboard
      const kb = keyboard
        .builder()
        .callback('Начать', 'start')
        .callback('Помощь', 'help')
        .buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Что хотите сделать?',
        reply_markup: kb as any,
      });

      // User clicks button (simulated)
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: '/callback_query', // Simulated callback
      });

      const messages = api.getAllMessages();
      expect(messages).toHaveLength(2); // Bot message + user callback
    });

    it('should handle multiple menu levels', async () => {
      // Main menu
      const mainMenu = keyboard.builder().usePattern('main_menu').buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Главное меню:',
        reply_markup: mainMenu as any,
      });

      // User clicks "Settings"
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: 'Settings',
      });

      // Bot shows settings menu
      const settingsMenu = keyboard.builder().usePattern('settings').buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Настройки:',
        reply_markup: settingsMenu as any,
      });

      const botMessages = api.getBotMessages();
      expect(botMessages).toHaveLength(2);
      expect(botMessages[0].text).toBe('Главное меню:');
      expect(botMessages[1].text).toBe('Настройки:');
    });
  });

  describe('Pagination Flow', () => {
    it('should navigate through pages', async () => {
      const totalPages = 3;

      // Page 1
      let kb = keyboard.builder().usePattern('pagination', { page: 1, totalPages }).buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Страница 1',
        reply_markup: kb as any,
      });

      // User clicks "Next"
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: 'Next',
      });

      // Page 2
      kb = keyboard.builder().usePattern('pagination', { page: 2, totalPages }).buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Страница 2',
        reply_markup: kb as any,
      });

      // User clicks "Next" again
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: 'Next',
      });

      // Page 3 (last page)
      kb = keyboard.builder().usePattern('pagination', { page: 3, totalPages }).buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Страница 3',
        reply_markup: kb as any,
      });

      const botMessages = api.getBotMessages();
      expect(botMessages).toHaveLength(3);
      expect(botMessages[2].text).toBe('Страница 3');
    });
  });

  describe('Dynamic Keyboards', () => {
    it('should create keyboard from data array', async () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const builder = keyboard.builder();

      // Add items (2 per row)
      items.forEach((item, index) => {
        const row = Math.floor(index / 2);
        builder.callback(item.name, `item_${item.id}`, row);
      });

      builder.callback('Back', 'back', Math.ceil(items.length / 2));

      const kb = builder.buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Выберите товар:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Выберите товар:');
    });

    it('should create keyboard from empty array', async () => {
      const items: Array<{ id: string; name: string }> = [];

      const builder = keyboard.builder();

      if (items.length === 0) {
        builder.callback('Нет элементов', 'empty');
      } else {
        items.forEach((item, index) => {
          builder.callback(item.name, `item_${item.id}`, Math.floor(index / 2));
        });
      }

      const kb = builder.buildInline();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Список:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Список:');
    });
  });

  describe('Reply Keyboards', () => {
    it('should send reply keyboard', async () => {
      const kb = keyboard
        .builder()
        .addButton('Option 1', { type: 'callback', data: 'opt1' })
        .addButton('Option 2', { type: 'callback', data: 'opt2' })
        .setOptions({ oneTime: true })
        .buildReply();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Choose:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Choose:');
    });

    it('should request contact', async () => {
      const kb = keyboard.builder().requestContact('Share Contact').buildReply();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Please share your contact:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Please share your contact:');
    });

    it('should request location', async () => {
      const kb = keyboard.builder().requestLocation('Share Location').buildReply();

      await api.sendMessage({
        chat_id: 123456,
        text: 'Please share your location:',
        reply_markup: kb as any,
      });

      const lastMessage = api.getLastBotMessage();
      expect(lastMessage?.text).toBe('Please share your location:');
    });
  });

  describe('Performance', () => {
    it('should handle rapid keyboard sends', async () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const kb = keyboard.builder().usePattern('yes_no').buildInline();

        await api.sendMessage({
          chat_id: 123456,
          text: `Message ${i}`,
          reply_markup: kb as any,
        });
      }

      const botMessages = api.getBotMessages();
      expect(botMessages).toHaveLength(iterations);
    });
  });
});
