/**
 * Unit Tests для KeyboardBuilder
 *
 * Тестируем создание различных типов клавиатур
 */

import { describe, it, expect } from 'vitest';
import { KeyboardBuilder, keyboard } from '../../src/telegram-keyboards/KeyboardBuilder';

describe('KeyboardBuilder', () => {
  describe('Inline Keyboards', () => {
    it('should create simple callback button', () => {
      const kb = keyboard
        .builder()
        .callback('Click me', 'button_clicked')
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0]).toHaveLength(1);
      expect(kb.inline_keyboard[0][0]).toEqual({
        text: 'Click me',
        callback_data: 'button_clicked',
      });
    });

    it('should create URL button', () => {
      const kb = keyboard
        .builder()
        .url('Open Link', 'https://example.com')
        .buildInline();

      expect(kb.inline_keyboard[0][0]).toEqual({
        text: 'Open Link',
        url: 'https://example.com',
      });
    });

    it('should create Web App button', () => {
      const kb = keyboard
        .builder()
        .webApp('Open App', 'https://app.example.com')
        .buildInline();

      expect(kb.inline_keyboard[0][0]).toEqual({
        text: 'Open App',
        web_app: { url: 'https://app.example.com' },
      });
    });

    it('should create multiple buttons in one row', () => {
      const kb = keyboard
        .builder()
        .callback('Button 1', 'btn1', 0)
        .callback('Button 2', 'btn2', 0)
        .callback('Button 3', 'btn3', 0)
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0]).toHaveLength(3);
      expect(kb.inline_keyboard[0].map((b) => b.text)).toEqual([
        'Button 1',
        'Button 2',
        'Button 3',
      ]);
    });

    it('should create multiple rows', () => {
      const kb = keyboard
        .builder()
        .callback('Row 1 Btn 1', 'r1b1', 0)
        .callback('Row 1 Btn 2', 'r1b2', 0)
        .callback('Row 2 Btn 1', 'r2b1', 1)
        .callback('Row 2 Btn 2', 'r2b2', 1)
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(2);
      expect(kb.inline_keyboard[0]).toHaveLength(2);
      expect(kb.inline_keyboard[1]).toHaveLength(2);
    });

    it('should organize buttons by row index', () => {
      const kb = keyboard
        .builder()
        .callback('Bottom', 'bottom', 2)
        .callback('Top', 'top', 0)
        .callback('Middle', 'middle', 1)
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(3);
      expect(kb.inline_keyboard[0][0].text).toBe('Top');
      expect(kb.inline_keyboard[1][0].text).toBe('Middle');
      expect(kb.inline_keyboard[2][0].text).toBe('Bottom');
    });
  });

  describe('Reply Keyboards', () => {
    it('should create simple reply keyboard', () => {
      const kb = keyboard.builder().addButton('Send', { type: 'callback', data: 'send' }).buildReply();

      expect(kb.keyboard).toHaveLength(1);
      expect(kb.keyboard[0][0].text).toBe('Send');
      expect(kb.resize_keyboard).toBe(true);
    });

    it('should create contact request button', () => {
      const kb = keyboard.builder().requestContact('Share Contact').buildReply();

      expect(kb.keyboard[0][0]).toEqual({
        text: 'Share Contact',
        request_contact: true,
      });
    });

    it('should create location request button', () => {
      const kb = keyboard.builder().requestLocation('Share Location').buildReply();

      expect(kb.keyboard[0][0]).toEqual({
        text: 'Share Location',
        request_location: true,
      });
    });

    it('should apply keyboard options', () => {
      const kb = keyboard
        .builder()
        .callback('Button', 'data')
        .setOptions({
          resize: false,
          oneTime: true,
          placeholder: 'Choose an option...',
        })
        .buildReply();

      expect(kb.resize_keyboard).toBe(false);
      expect(kb.one_time_keyboard).toBe(true);
      expect(kb.input_field_placeholder).toBe('Choose an option...');
    });
  });

  describe('Keyboard Patterns', () => {
    it('should create main_menu pattern', () => {
      const kb = keyboard.builder().usePattern('main_menu').buildInline();

      expect(kb.inline_keyboard).toHaveLength(2);
      expect(kb.inline_keyboard[0]).toHaveLength(2); // Create, List
      expect(kb.inline_keyboard[1]).toHaveLength(2); // Settings, Help

      expect(kb.inline_keyboard[0][0].text).toBe('📝 Создать');
      expect(kb.inline_keyboard[0][1].text).toBe('📋 Список');
      expect(kb.inline_keyboard[1][0].text).toBe('⚙️ Настройки');
      expect(kb.inline_keyboard[1][1].text).toBe('ℹ️ Помощь');
    });

    it('should create yes_no pattern', () => {
      const kb = keyboard.builder().usePattern('yes_no').buildInline();

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0]).toHaveLength(2);
      expect(kb.inline_keyboard[0][0].text).toBe('✅ Да');
      expect(kb.inline_keyboard[0][1].text).toBe('❌ Нет');
    });

    it('should create confirm_cancel pattern', () => {
      const kb = keyboard.builder().usePattern('confirm_cancel').buildInline();

      expect(kb.inline_keyboard[0][0].callback_data).toBe('action_confirm');
      expect(kb.inline_keyboard[0][1].callback_data).toBe('action_cancel');
    });

    it('should create number_grid pattern', () => {
      const kb = keyboard.builder().usePattern('number_grid').buildInline();

      expect(kb.inline_keyboard).toHaveLength(4); // 3 rows + 0 row
      expect(kb.inline_keyboard[0]).toHaveLength(3); // 1 2 3
      expect(kb.inline_keyboard[1]).toHaveLength(3); // 4 5 6
      expect(kb.inline_keyboard[2]).toHaveLength(3); // 7 8 9
      expect(kb.inline_keyboard[3]).toHaveLength(1); // 0

      expect(kb.inline_keyboard[0].map((b) => b.text)).toEqual(['1', '2', '3']);
      expect(kb.inline_keyboard[3][0].text).toBe('0');
    });

    it('should create pagination pattern', () => {
      const kb = keyboard.builder().usePattern('pagination', { page: 2, totalPages: 5 }).buildInline();

      expect(kb.inline_keyboard[0]).toHaveLength(3);
      expect(kb.inline_keyboard[0][0].text).toBe('◀️ Назад');
      expect(kb.inline_keyboard[0][1].text).toBe('2/5');
      expect(kb.inline_keyboard[0][2].text).toBe('▶️ Вперед');
    });

    it('should create pagination first page', () => {
      const kb = keyboard.builder().usePattern('pagination', { page: 1, totalPages: 3 }).buildInline();

      expect(kb.inline_keyboard[0]).toHaveLength(2); // No back button
      expect(kb.inline_keyboard[0][0].text).toBe('1/3');
      expect(kb.inline_keyboard[0][1].text).toBe('▶️ Вперед');
    });

    it('should create pagination last page', () => {
      const kb = keyboard.builder().usePattern('pagination', { page: 3, totalPages: 3 }).buildInline();

      expect(kb.inline_keyboard[0]).toHaveLength(2); // No forward button
      expect(kb.inline_keyboard[0][0].text).toBe('◀️ Назад');
      expect(kb.inline_keyboard[0][1].text).toBe('3/3');
    });

    it('should create settings pattern', () => {
      const kb = keyboard.builder().usePattern('settings').buildInline();

      expect(kb.inline_keyboard).toHaveLength(4);
      expect(kb.inline_keyboard[0][0].text).toBe('🔔 Уведомления');
      expect(kb.inline_keyboard[3][0].text).toBe('◀️ Назад');
    });

    it('should create back pattern', () => {
      const kb = keyboard.builder().usePattern('back').buildInline();

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0][0].text).toBe('◀️ Назад');
      expect(kb.inline_keyboard[0][0].callback_data).toBe('back');
    });
  });

  describe('Shorthand Functions', () => {
    it('keyboard.inline() should create inline keyboard', () => {
      const kb = keyboard.inline([
        { text: 'Button 1', action: { type: 'callback', data: 'btn1' } },
        { text: 'Button 2', action: { type: 'url', url: 'https://example.com' } },
      ]);

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0]).toHaveLength(2);
    });

    it('keyboard.reply() should create reply keyboard', () => {
      const kb = keyboard.reply([
        { text: 'Option 1', action: { type: 'callback', data: 'opt1' } },
        { text: 'Option 2', action: { type: 'callback', data: 'opt2' } },
      ]);

      expect(kb.keyboard).toHaveLength(1);
      expect(kb.keyboard[0]).toHaveLength(2);
    });

    it('keyboard.pattern() should create pattern keyboard', () => {
      const kb = keyboard.pattern('yes_no');

      expect(kb.inline_keyboard[0]).toHaveLength(2);
      expect(kb.inline_keyboard[0][0].text).toContain('Да');
      expect(kb.inline_keyboard[0][1].text).toContain('Нет');
    });

    it('keyboard.remove() should create remove keyboard object', () => {
      const remove = keyboard.remove();

      expect(remove.remove_keyboard).toBe(true);
      expect(remove.selective).toBeUndefined();
    });

    it('keyboard.remove(true) should set selective', () => {
      const remove = keyboard.remove(true);

      expect(remove.remove_keyboard).toBe(true);
      expect(remove.selective).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty keyboard', () => {
      const kb = keyboard.builder().buildInline();

      expect(kb.inline_keyboard).toEqual([]);
    });

    it('should handle duplicate rows', () => {
      const kb = keyboard
        .builder()
        .callback('Btn 1', 'b1', 0)
        .callback('Btn 2', 'b2', 0)
        .callback('Btn 3', 'b3', 0)
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(1);
      expect(kb.inline_keyboard[0]).toHaveLength(3);
    });

    it('should handle non-sequential row indices', () => {
      const kb = keyboard
        .builder()
        .callback('First', 'first', 0)
        .callback('Third', 'third', 5)
        .callback('Second', 'second', 2)
        .buildInline();

      expect(kb.inline_keyboard).toHaveLength(3);
      expect(kb.inline_keyboard[0][0].text).toBe('First');
      expect(kb.inline_keyboard[1][0].text).toBe('Second');
      expect(kb.inline_keyboard[2][0].text).toBe('Third');
    });
  });
});
