/**
 * Send Message Action - Autonomous Telegram User-Agent
 *
 * Allows bot to send messages TO OTHER BOTS from user's account.
 * This enables autonomous testing and interaction with Telegram bots.
 */

import { Action, IAgentRuntime, Memory, State, HandlerCallback, elizaLogger } from '@elizaos/core';
import { TelegramUserAgentService } from '../services/TelegramUserAgentService';

export const sendMessageAction: Action = {
  name: 'SEND_TELEGRAM_MESSAGE_AS_USER',
  similes: [
    'TELEGRAM_USER_SEND',
    'AUTONOMOUS_TELEGRAM_SEND',
    'USERBOT_SEND_MESSAGE',
  ],
  description: 'Send message to a Telegram bot from user account (autonomous)',

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // Check if service is available
    const service = runtime.getService('telegram-user-agent') as TelegramUserAgentService;
    if (!service) {
      elizaLogger.warn('[SendMessageAction] TelegramUserAgentService not available');
      return false;
    }

    // Check session status
    const status = service.getSessionStatus();
    if (!status.isValid) {
      elizaLogger.warn('[SendMessageAction] Telegram session not valid');
      return false;
    }

    // Validate message content
    const text = message.content.text?.toLowerCase() || '';

    // Trigger patterns for autonomous sending
    const triggers = [
      'send message to',
      'отправь сообщение',
      'autonomous send',
      'userbot send',
      'test bot with',
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
      elizaLogger.info('[SendMessageAction] Handling autonomous message send');

      const service = runtime.getService('telegram-user-agent') as TelegramUserAgentService;
      if (!service) {
        await callback?.({
          text: '❌ TelegramUserAgentService not available',
          error: 'Service not found',
        });
        return { success: false, error: 'Service not found' };
      }

      // Extract username and message from content
      // Expected format: "send message to @bot_username: message text"
      const text = message.content.text || '';
      const match = text.match(/@?(\w+)[:：]\s*(.+)/i);

      if (!match) {
        await callback?.({
          text: '❌ Invalid format. Use: send message to @bot_username: your message',
        });
        return { success: false, error: 'Invalid format' };
      }

      const [, username, messageText] = match;

      elizaLogger.info(`[SendMessageAction] Sending to @${username}: ${messageText}`);

      // Send message via userbot
      const result = await service.sendMessage({
        username,
        message: messageText,
        waitForResponse: true,
        timeout: 10000,
      });

      if (result.success) {
        const responseText = result.response && result.response.length > 0
          ? result.response.map(msg => msg.text).join('\n\n')
          : 'No response received';

        await callback?.({
          text: `✅ Message sent to @${username}\n\n📨 Response:\n${responseText}`,
        });

        return {
          success: true,
          text: `Sent message to @${username}`,
          values: {
            username,
            messageText,
            response: result.response,
          },
        };
      } else {
        await callback?.({
          text: `❌ Failed to send message: ${result.error}`,
        });

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      elizaLogger.error('[SendMessageAction] Error:', error);

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
          text: 'Send message to @agent_vibecoder_bot: /selftest',
        },
      },
      {
        user: 'agent',
        content: {
          text: '✅ Message sent to @agent_vibecoder_bot\n\n📨 Response:\n[Bot response here]',
          action: 'SEND_TELEGRAM_MESSAGE_AS_USER',
        },
      },
    ],
    [
      {
        user: 'user',
        content: {
          text: 'Отправь сообщение @mybot: привет',
        },
      },
      {
        user: 'agent',
        content: {
          text: '✅ Сообщение отправлено @mybot\n\n📨 Ответ:\n[Bot response]',
          action: 'SEND_TELEGRAM_MESSAGE_AS_USER',
        },
      },
    ],
  ],
};
