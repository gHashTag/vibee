import { logger, type IAgentRuntime, type Plugin, Service } from '@elizaos/core';

logger.info('🔄 [TYPING PLUGIN] Module loaded');

/**
 * Service that shows "typing..." indicator and implements streaming responses in Telegram
 */
class TelegramTypingService extends Service {
  static serviceType = 'telegram-typing-handler';
  capabilityDescription = 'Shows typing indicator and streams responses in Telegram';

  private typingIntervals: Map<string, NodeJS.Timeout> = new Map();

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new TelegramTypingService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    // Clear all typing intervals
    for (const interval of this.typingIntervals.values()) {
      clearInterval(interval);
    }
    this.typingIntervals.clear();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TelegramTypingService] 🔍 Initializing...');

    // Wait for TelegramService to be available
    const maxAttempts = 20;
    let telegramService = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService) {
        logger.info('[TelegramTypingService] ✅ Found TelegramService');
        break;
      }
      logger.info(`[TelegramTypingService] Waiting for TelegramService... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!telegramService) {
      logger.error('[TelegramTypingService] ⚠️ TelegramService not found');
      return;
    }

    // Wait for bot to be created
    const maxBotAttempts = 40;
    for (let i = 0; i < maxBotAttempts; i++) {
      if (telegramService.bot) {
        logger.info('[TelegramTypingService] ✅ Found bot instance');
        break;
      }
      logger.info(`[TelegramTypingService] Waiting for bot... (attempt ${i + 1}/${maxBotAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!telegramService.bot) {
      logger.error('[TelegramTypingService] ⚠️ Bot not found after waiting');
      return;
    }

    // MONKEY PATCH: Wrap handleUpdate to show typing indicator for all messages
    const originalHandleUpdate = telegramService.bot.handleUpdate.bind(telegramService.bot);

    telegramService.bot.handleUpdate = async (update: any, webhookReply?: any) => {
      const message = update.message || update.channel_post;
      const chatId = message?.chat?.id;

      // Start typing indicator for user messages (not our own messages)
      if (chatId && message?.text && !message.from?.is_bot) {
        this.startTypingIndicator(telegramService.bot.telegram, chatId);
      }

      // Call original handler
      const result = await originalHandleUpdate(update, webhookReply);

      // Stop typing indicator after processing
      if (chatId && message?.text && !message.from?.is_bot) {
        this.stopTypingIndicator(chatId);
      }

      return result;
    };

    logger.info('[TelegramTypingService] ✅ Typing indicator enabled');
  }

  /**
   * Start typing indicator (sends every 5 seconds to keep it alive)
   */
  private startTypingIndicator(telegram: any, chatId: string | number): void {
    // Clear existing interval if any
    this.stopTypingIndicator(chatId);

    // Send initial typing action
    telegram.sendChatAction(chatId, 'typing').catch((err: Error) => {
      logger.error(`[TelegramTypingService] Failed to send typing action: ${err.message}`);
    });

    // Keep sending typing action every 4 seconds (expires after 5)
    const interval = setInterval(() => {
      telegram.sendChatAction(chatId, 'typing').catch((err: Error) => {
        logger.error(`[TelegramTypingService] Failed to send typing action: ${err.message}`);
      });
    }, 4000);

    this.typingIntervals.set(String(chatId), interval);
  }

  /**
   * Stop typing indicator
   */
  private stopTypingIndicator(chatId: string | number): void {
    const interval = this.typingIntervals.get(String(chatId));
    if (interval) {
      clearInterval(interval);
      this.typingIntervals.delete(String(chatId));
    }
  }
}

export const telegramTypingPlugin: Plugin = {
  name: 'telegram-typing',
  description: 'Shows typing indicator and streams responses in Telegram',
  services: [TelegramTypingService],
};

logger.info('🔄 [TYPING PLUGIN] Plugin exported');

export default telegramTypingPlugin;
