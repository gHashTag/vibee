/**
 * Telegram Keyboard Builder Service
 *
 * Fluent API for building Telegram keyboards with common patterns
 */

import type {
  InlineKeyboardMarkup,
  InlineKeyboardButton,
  ReplyKeyboardMarkup,
  KeyboardButton,
  ReplyKeyboardRemove,
  KeyboardPattern,
  KeyboardOptions,
  ButtonConfig,
  ButtonAction,
} from './types';

export class KeyboardBuilder {
  private buttons: ButtonConfig[] = [];
  private options: KeyboardOptions = {};

  /**
   * Add a button to the keyboard
   */
  addButton(text: string, action: ButtonAction, row?: number): this {
    this.buttons.push({ text, action, row });
    return this;
  }

  /**
   * Add a callback button
   */
  callback(text: string, data: string, row?: number): this {
    return this.addButton(text, { type: 'callback', data }, row);
  }

  /**
   * Add a URL button
   */
  url(text: string, url: string, row?: number): this {
    return this.addButton(text, { type: 'url', url }, row);
  }

  /**
   * Add a Web App button
   */
  webApp(text: string, url: string, row?: number): this {
    return this.addButton(text, { type: 'web_app', url }, row);
  }

  /**
   * Add an inline query button
   */
  switchInline(text: string, query: string, row?: number): this {
    return this.addButton(text, { type: 'switch_inline', query }, row);
  }

  /**
   * Add a contact request button (Reply Keyboard only)
   */
  requestContact(text: string, row?: number): this {
    return this.addButton(text, { type: 'request_contact' }, row);
  }

  /**
   * Add a location request button (Reply Keyboard only)
   */
  requestLocation(text: string, row?: number): this {
    return this.addButton(text, { type: 'request_location' }, row);
  }

  /**
   * Add a payment button
   */
  pay(text: string, row?: number): this {
    return this.addButton(text, { type: 'pay' }, row);
  }

  /**
   * Set keyboard options
   */
  setOptions(options: KeyboardOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Use a predefined pattern
   */
  usePattern(pattern: KeyboardPattern, data?: Record<string, any>): this {
    this.buttons = [];
    this.options.pattern = pattern;

    switch (pattern) {
      case 'main_menu':
        this.callback('📝 Создать', 'menu_create', 0)
          .callback('📋 Список', 'menu_list', 0)
          .callback('⚙️ Настройки', 'menu_settings', 1)
          .callback('ℹ️ Помощь', 'menu_help', 1);
        break;

      case 'yes_no':
        this.callback('✅ Да', 'confirm_yes', 0).callback('❌ Нет', 'confirm_no', 0);
        break;

      case 'confirm_cancel':
        this.callback('✅ Подтвердить', 'action_confirm', 0).callback(
          '❌ Отменить',
          'action_cancel',
          0
        );
        break;

      case 'number_grid':
        // 1 2 3
        this.callback('1', 'num_1', 0)
          .callback('2', 'num_2', 0)
          .callback('3', 'num_3', 0);
        // 4 5 6
        this.callback('4', 'num_4', 1)
          .callback('5', 'num_5', 1)
          .callback('6', 'num_6', 1);
        // 7 8 9
        this.callback('7', 'num_7', 2)
          .callback('8', 'num_8', 2)
          .callback('9', 'num_9', 2);
        // 0
        this.callback('0', 'num_0', 3);
        break;

      case 'pagination':
        const page = data?.page || 1;
        const totalPages = data?.totalPages || 1;

        if (page > 1) {
          this.callback('◀️ Назад', `page_${page - 1}`, 0);
        }
        this.callback(`${page}/${totalPages}`, 'page_current', 0);
        if (page < totalPages) {
          this.callback('▶️ Вперед', `page_${page + 1}`, 0);
        }
        break;

      case 'settings':
        this.callback('🔔 Уведомления', 'settings_notifications', 0)
          .callback('🌐 Язык', 'settings_language', 1)
          .callback('👤 Профиль', 'settings_profile', 2)
          .callback('◀️ Назад', 'back_to_menu', 3);
        break;

      case 'back':
        this.callback('◀️ Назад', 'back', 0);
        break;

      case 'custom':
        // User will add buttons manually
        break;
    }

    return this;
  }

  /**
   * Build an Inline Keyboard
   */
  buildInline(): InlineKeyboardMarkup {
    const rows = this.organizeButtonsIntoRows();
    const inline_keyboard: InlineKeyboardButton[][] = rows.map((row) =>
      row.map((btn) => this.buildInlineButton(btn))
    );

    return { inline_keyboard };
  }

  /**
   * Build a Reply Keyboard
   */
  buildReply(): ReplyKeyboardMarkup {
    const rows = this.organizeButtonsIntoRows();
    const keyboard: KeyboardButton[][] = rows.map((row) =>
      row.map((btn) => this.buildReplyButton(btn))
    );

    return {
      keyboard,
      resize_keyboard: this.options.resize ?? true,
      one_time_keyboard: this.options.oneTime ?? false,
      input_field_placeholder: this.options.placeholder,
      selective: this.options.selective,
    };
  }

  /**
   * Build a keyboard remove object
   */
  static remove(selective?: boolean): ReplyKeyboardRemove {
    return {
      remove_keyboard: true,
      selective,
    };
  }

  /**
   * Organize buttons into rows
   */
  private organizeButtonsIntoRows(): ButtonConfig[][] {
    const rowMap = new Map<number, ButtonConfig[]>();

    // Group buttons by row
    for (const btn of this.buttons) {
      const rowIndex = btn.row ?? 0;
      if (!rowMap.has(rowIndex)) {
        rowMap.set(rowIndex, []);
      }
      rowMap.get(rowIndex)!.push(btn);
    }

    // Convert to array of rows, sorted by row index
    const sortedRows = Array.from(rowMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, buttons]) => buttons);

    return sortedRows;
  }

  /**
   * Build an inline keyboard button from config
   */
  private buildInlineButton(config: ButtonConfig): InlineKeyboardButton {
    const btn: InlineKeyboardButton = { text: config.text };

    switch (config.action.type) {
      case 'callback':
        btn.callback_data = config.action.data;
        break;
      case 'url':
        btn.url = config.action.url;
        break;
      case 'web_app':
        btn.web_app = { url: config.action.url };
        break;
      case 'switch_inline':
        btn.switch_inline_query = config.action.query;
        break;
      case 'pay':
        btn.pay = true;
        break;
    }

    return btn;
  }

  /**
   * Build a reply keyboard button from config
   */
  private buildReplyButton(config: ButtonConfig): KeyboardButton {
    const btn: KeyboardButton = { text: config.text };

    switch (config.action.type) {
      case 'request_contact':
        btn.request_contact = true;
        break;
      case 'request_location':
        btn.request_location = true;
        break;
      case 'web_app':
        btn.web_app = { url: config.action.url };
        break;
    }

    return btn;
  }
}

/**
 * Shorthand factory functions
 */
export const keyboard = {
  /**
   * Create a new keyboard builder
   */
  builder(): KeyboardBuilder {
    return new KeyboardBuilder();
  },

  /**
   * Quick inline keyboard
   */
  inline(buttons: Array<{ text: string; action: ButtonAction; row?: number }>): InlineKeyboardMarkup {
    const builder = new KeyboardBuilder();
    for (const btn of buttons) {
      builder.addButton(btn.text, btn.action, btn.row);
    }
    return builder.buildInline();
  },

  /**
   * Quick reply keyboard
   */
  reply(buttons: Array<{ text: string; action: ButtonAction; row?: number }>): ReplyKeyboardMarkup {
    const builder = new KeyboardBuilder();
    for (const btn of buttons) {
      builder.addButton(btn.text, btn.action, btn.row);
    }
    return builder.buildReply();
  },

  /**
   * Quick pattern keyboard
   */
  pattern(pattern: KeyboardPattern, data?: Record<string, any>): InlineKeyboardMarkup {
    return new KeyboardBuilder().usePattern(pattern, data).buildInline();
  },

  /**
   * Remove keyboard
   */
  remove(selective?: boolean): ReplyKeyboardRemove {
    return KeyboardBuilder.remove(selective);
  },
};
