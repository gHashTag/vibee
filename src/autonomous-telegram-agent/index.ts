/**
 * 🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram User-Agent Plugin
 *
 * Allows ElizaOS bots to send messages TO OTHER BOTS from user's account.
 * Enables autonomous testing, monitoring, and interaction with Telegram bots.
 *
 * Features:
 * - StringSession authentication (one-time setup)
 * - Send messages to any bot autonomously
 * - Read bot responses
 * - Autonomous self-testing capabilities
 *
 * @example
 * ```typescript
 * import { autonomousTelegramAgentPlugin } from '@/autonomous-telegram-agent';
 *
 * export const projectAgent: ProjectAgent = {
 *   character,
 *   plugins: [
 *     autonomousTelegramAgentPlugin,
 *   ],
 * };
 * ```
 *
 * @requires Environment variables:
 * - TELEGRAM_API_ID: Telegram API ID
 * - TELEGRAM_API_HASH: Telegram API Hash
 * - TELEGRAM_PHONE: Phone number (for first auth)
 * - TELEGRAM_SESSION_STRING: Session string (created automatically)
 */

import { Plugin } from '@elizaos/core';
import { TelegramUserAgentService } from './services/TelegramUserAgentService';
import { sendMessageAction } from './actions/send-message-action.ts';
import { readMessagesAction } from './actions/read-messages-action.ts';

export const autonomousTelegramAgentPlugin: Plugin = {
  name: 'autonomous-telegram-agent',
  description: '🌈 РАДУЖНЫЙ МОСТ - Autonomous Telegram User-Agent for bot testing and interaction',

  services: [TelegramUserAgentService],

  actions: [
    sendMessageAction,
    readMessagesAction,
  ],
};

export default autonomousTelegramAgentPlugin;

// Re-export types for external usage
export { TelegramUserAgentService } from './services/TelegramUserAgentService';
export type {
  TelegramMessage,
  SendMessageOptions,
  ReadMessagesOptions
} from './types';
