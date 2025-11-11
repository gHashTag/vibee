/**
 * Telegram Keyboard Types
 *
 * Based on official Telegram Bot API:
 * https://core.telegram.org/bots/api#replykeyboardmarkup
 * https://core.telegram.org/bots/api#inlinekeyboardmarkup
 */

/**
 * Inline Keyboard Button Types
 */
export interface InlineKeyboardButton {
  /** Label text on the button */
  text: string;

  /** Optional: HTTP or tg:// url to be opened when button is pressed */
  url?: string;

  /** Optional: Data to be sent in a callback query to the bot when button is pressed */
  callback_data?: string;

  /** Optional: Description of the Web App that will be launched when the user presses the button */
  web_app?: { url: string };

  /** Optional: Inline query to be inserted in the input field when the button is pressed */
  switch_inline_query?: string;

  /** Optional: Same as switch_inline_query, but the query is inserted in the input field of the chat */
  switch_inline_query_current_chat?: string;

  /** Optional: Pay button */
  pay?: boolean;
}

/**
 * Inline Keyboard Markup
 *
 * This object represents an inline keyboard that appears right next to the message it belongs to.
 */
export interface InlineKeyboardMarkup {
  /** Array of button rows, each represented by an Array of InlineKeyboardButton objects */
  inline_keyboard: InlineKeyboardButton[][];
}

/**
 * Reply Keyboard Button
 */
export interface KeyboardButton {
  /** Text of the button */
  text: string;

  /** Optional: Request user's phone number */
  request_contact?: boolean;

  /** Optional: Request user's location */
  request_location?: boolean;

  /** Optional: Request a poll */
  request_poll?: {
    /** Optional: Poll type */
    type?: 'quiz' | 'regular';
  };

  /** Optional: Web App to be launched */
  web_app?: { url: string };
}

/**
 * Reply Keyboard Markup
 *
 * This object represents a custom keyboard with reply options
 */
export interface ReplyKeyboardMarkup {
  /** Array of button rows, each represented by an Array of KeyboardButton objects */
  keyboard: KeyboardButton[][];

  /** Optional: Requests clients to resize the keyboard vertically for optimal fit */
  resize_keyboard?: boolean;

  /** Optional: Requests clients to hide the keyboard as soon as it's been used */
  one_time_keyboard?: boolean;

  /** Optional: The placeholder to be shown in the input field when the keyboard is active */
  input_field_placeholder?: string;

  /** Optional: Use this parameter if you want to show the keyboard to specific users only */
  selective?: boolean;
}

/**
 * Remove Keyboard
 *
 * Upon receiving a message with this object, Telegram clients will remove the current custom keyboard
 */
export interface ReplyKeyboardRemove {
  /** Requests clients to remove the custom keyboard */
  remove_keyboard: true;

  /** Optional: Use this parameter if you want to remove the keyboard for specific users only */
  selective?: boolean;
}

/**
 * Force Reply
 *
 * Upon receiving a message with this object, Telegram clients will display a reply interface to the user
 */
export interface ForceReply {
  /** Shows reply interface to the user */
  force_reply: true;

  /** Optional: The placeholder to be shown in the input field when the reply is active */
  input_field_placeholder?: string;

  /** Optional: Use this parameter if you want to force reply from specific users only */
  selective?: boolean;
}

/**
 * Keyboard Patterns - Common keyboard layouts
 */
export type KeyboardPattern =
  | 'main_menu'           // Main menu with common actions
  | 'yes_no'              // Simple yes/no choice
  | 'confirm_cancel'      // Confirm or cancel action
  | 'number_grid'         // Numeric keypad (1-9, 0)
  | 'pagination'          // Previous/Next navigation
  | 'settings'            // Settings menu
  | 'back'                // Just a back button
  | 'custom';             // Custom layout

/**
 * Button Action Types
 */
export type ButtonAction =
  | { type: 'callback'; data: string }
  | { type: 'url'; url: string }
  | { type: 'web_app'; url: string }
  | { type: 'switch_inline'; query: string }
  | { type: 'request_contact' }
  | { type: 'request_location' }
  | { type: 'pay' };

/**
 * Keyboard Builder Options
 */
export interface KeyboardOptions {
  /** Pattern to use for keyboard layout */
  pattern?: KeyboardPattern;

  /** For reply keyboards: resize keyboard */
  resize?: boolean;

  /** For reply keyboards: hide after one use */
  oneTime?: boolean;

  /** Placeholder text for input field */
  placeholder?: string;

  /** Show keyboard to specific users only */
  selective?: boolean;
}

/**
 * Button Configuration
 */
export interface ButtonConfig {
  /** Button text */
  text: string;

  /** Button action */
  action: ButtonAction;

  /** Optional: Custom row index (0-based) */
  row?: number;
}
