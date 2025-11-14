/**
 * Telegram Keyboards Plugin for ElizaOS
 *
 * Adds keyboard building capabilities to Telegram bot
 */

import type { Plugin, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { keyboard } from './KeyboardBuilder';
import type { KeyboardPattern } from './types';
import { TelegramKeyboardSenderService } from './telegram-keyboard-sender';

/**
 * Example Action that uses keyboards
 */
const exampleKeyboardAction = {
  name: 'SHOW_MENU',
  description: 'Shows a menu with keyboard buttons',
  similes: ['menu', 'показать меню', 'кнопки'],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase();
    return text?.includes('меню') || text?.includes('menu') || text?.includes('кнопки');
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: any, callback?: any) => {
    // Create main menu keyboard
    const mainMenu = keyboard.builder().usePattern('main_menu').buildInline();

    // Получаем TelegramService и отправляем напрямую
    const telegramService = runtime.getService('telegram');

    if (telegramService && telegramService.bot) {
      const chatId = message.roomId?.replace(/telegram-/, '');

      if (chatId) {
        try {
          await telegramService.bot.telegram.sendMessage(chatId, 'Выберите действие из меню ниже:', {
            reply_markup: mainMenu,
          });
        } catch (error) {
          logger.error('[SHOW_MENU] Error sending message:', error);
        }
      }
    }

    return {
      success: true,
      text: 'Menu shown',
    };
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Покажи меню' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Выберите действие из меню ниже:',
          action: 'SHOW_MENU',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Нужны кнопки' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Выберите действие из меню ниже:',
          action: 'SHOW_MENU',
        },
      },
    ],
  ],
};

/**
 * Telegram Keyboards Plugin
 */
export const telegramKeyboardsPlugin: Plugin = {
  name: 'telegram-keyboards',
  description: 'Telegram keyboard builder with common patterns',

  actions: [exampleKeyboardAction],

  // Make keyboard builder available in runtime
  services: [TelegramKeyboardSenderService],

  // Provide helper functions
  providers: [],
};

/**
 * Helper to get keyboard in telegram-compatible format
 */
export function formatKeyboardForTelegram(markup: any): string {
  return JSON.stringify(markup);
}

/**
 * Example usage patterns for documentation
 */
export const keyboardExamples = {
  /**
   * Simple inline keyboard with callbacks
   */
  simpleInline: () =>
    keyboard.inline([
      { text: 'Yes', action: { type: 'callback', data: 'yes' } },
      { text: 'No', action: { type: 'callback', data: 'no' } },
    ]),

  /**
   * Multi-row keyboard
   */
  multiRow: () =>
    keyboard
      .builder()
      .callback('Option 1', 'opt1', 0)
      .callback('Option 2', 'opt2', 0)
      .callback('Option 3', 'opt3', 1)
      .callback('Back', 'back', 2)
      .buildInline(),

  /**
   * URL buttons
   */
  urlButtons: () =>
    keyboard
      .builder()
      .url('Documentation', 'https://docs.example.com')
      .url('Support', 'https://support.example.com')
      .buildInline(),

  /**
   * Reply keyboard with contact/location
   */
  replyKeyboard: () =>
    keyboard
      .builder()
      .requestContact('Share Contact')
      .requestLocation('Share Location')
      .setOptions({ oneTime: true })
      .buildReply(),

  /**
   * Pagination
   */
  pagination: (page: number, total: number) =>
    keyboard.builder().usePattern('pagination', { page, totalPages: total }).buildInline(),

  /**
   * Dynamic menu from data
   */
  dynamicMenu: (items: Array<{ id: string; name: string }>) => {
    const builder = keyboard.builder();

    // Add items (2 per row)
    items.forEach((item, index) => {
      const row = Math.floor(index / 2);
      builder.callback(item.name, `item_${item.id}`, row);
    });

    // Add back button
    builder.callback('Back', 'back', Math.ceil(items.length / 2));

    return builder.buildInline();
  },
};
