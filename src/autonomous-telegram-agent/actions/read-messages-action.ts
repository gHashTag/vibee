/**
 * Read Messages Action - Autonomous Telegram User-Agent
 *
 * Reads messages from a Telegram bot (user's conversation history).
 * Useful for checking bot responses and monitoring conversations.
 */

import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { TelegramUserAgentService } from '../services/TelegramUserAgentService';

export const readMessagesAction: Action = {
  name: 'READ_TELEGRAM_MESSAGES_AS_USER',
  similes: [
    'TELEGRAM_USER_READ',
    'AUTONOMOUS_TELEGRAM_READ',
    'USERBOT_READ_MESSAGES',
    'CHECK_BOT_MESSAGES',
  ],
  description: 'Read messages from a Telegram bot conversation (autonomous)',

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Check if service is available
    const service = runtime.getService('telegram-user-agent') as TelegramUserAgentService;
    if (!service) {
      elizaLogger.warn('[ReadMessagesAction] TelegramUserAgentService not available');
      return false;
    }

    // Check session status
    const status = service.getSessionStatus();
    if (!status.isValid) {
      elizaLogger.warn('[ReadMessagesAction] Telegram session not valid');
      return false;
    }

    // Validate message content
    const text = message.content.text?.toLowerCase() || '';

    // Trigger patterns
    const triggers = [
      'read messages from',
      'check messages from',
      'прочитай сообщения',
      'покажи сообщения',
      'check bot response',
      'what did bot say',
    ];

    return triggers.some(trigger => text.includes(trigger));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      elizaLogger.info('[ReadMessagesAction] Handling message read request');

      const service = runtime.getService('telegram-user-agent') as TelegramUserAgentService;
      if (!service) {
        await callback?.({
          text: '❌ TelegramUserAgentService not available',
          error: 'Service not found',
        });
        return { success: false, error: 'Service not found' };
      }

      // Extract username and optional limit
      // Expected format: "read messages from @bot_username" or "read 20 messages from @bot"
      const text = message.content.text || '';
      const limitMatch = text.match(/(\d+)\s+messages?/i);
      const usernameMatch = text.match(/@?(\w+)/i);

      if (!usernameMatch) {
        await callback?.({
          text: '❌ Invalid format. Use: read messages from @bot_username',
        });
        return { success: false, error: 'Invalid format' };
      }

      const username = usernameMatch[1];
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;

      elizaLogger.info(`[ReadMessagesAction] Reading ${limit} messages from @${username}`);

      // Read messages via userbot
      const result = await service.readMessages({
        username,
        limit,
        onlyIncoming: true,
      });

      if (result.success && result.messages) {
        if (result.messages.length === 0) {
          await callback?.({
            text: `📭 No messages found from @${username}`,
          });
        } else {
          const messagesText = result.messages
            .map((msg, i) => `${i + 1}. ${msg.text}`)
            .join('\n\n');

          await callback?.({
            text: `📨 Messages from @${username} (${result.messages.length}):\n\n${messagesText}`,
          });
        }

        return {
          success: true,
          text: `Read ${result.messages.length} messages from @${username}`,
          values: {
            username,
            count: result.messages.length,
            messages: result.messages,
          },
        };
      } else {
        await callback?.({
          text: `❌ Failed to read messages: ${result.error}`,
        });

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      elizaLogger.error('[ReadMessagesAction] Error:', error);

      await callback?.({
        text: `❌ Error: ${error.message}`,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  },

  examples: [
    [
      {
        user: 'user',
        content: {
          text: 'Read messages from @agent_vibecoder_bot',
        },
      },
      {
        user: 'agent',
        content: {
          text: '📨 Messages from @agent_vibecoder_bot (3):\n\n1. Test message\n2. Another message\n3. Last message',
          action: 'READ_TELEGRAM_MESSAGES_AS_USER',
        },
      },
    ],
    [
      {
        user: 'user',
        content: {
          text: 'Прочитай сообщения от @mybot',
        },
      },
      {
        user: 'agent',
        content: {
          text: '📨 Сообщения от @mybot (5):\n\n1. ...',
          action: 'READ_TELEGRAM_MESSAGES_AS_USER',
        },
      },
    ],
  ],
};
