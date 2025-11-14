/**
 * Telegram User-Agent Service
 *
 * Connects to Telegram as USER (not bot) to send messages TO bots.
 * Uses Telethon (Python) via child_process for session management.
 */

import { Service, IAgentRuntime, elizaLogger } from '@elizaos/core';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  SendMessageOptions,
  ReadMessagesOptions,
  TelegramMessage,
  TelegramSession
} from '../types';

const execAsync = promisify(exec);

export class TelegramUserAgentService extends Service {
  static serviceType = 'telegram-user-agent';

  private session: TelegramSession | null = null;
  private pythonScriptPath: string;

  constructor(runtime?: IAgentRuntime) {
    super(runtime);
    // Path to Python script (относительно project root)
    this.pythonScriptPath = 'scripts/autonomous-telegram-bot.py';
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [TelegramUserAgent] Initializing...');

    // Load session from environment
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionString = process.env.TELEGRAM_SESSION_STRING;

    if (!apiId || !apiHash) {
      elizaLogger.warn('[TelegramUserAgent] ⚠️ TELEGRAM_API_ID or TELEGRAM_API_HASH not set');
      elizaLogger.warn('[TelegramUserAgent] Plugin will not be functional');
      return;
    }

    if (!sessionString) {
      elizaLogger.warn('[TelegramUserAgent] ⚠️ TELEGRAM_SESSION_STRING not set');
      elizaLogger.warn('[TelegramUserAgent] Run: python3 scripts/autonomous-telegram-auth.py');
      return;
    }

    this.session = {
      apiId: parseInt(apiId),
      apiHash,
      sessionString,
      isValid: false,
    };

    // Validate session
    const isValid = await this.validateSession();

    if (isValid) {
      elizaLogger.success('🌈 [TelegramUserAgent] Session validated!');
      elizaLogger.success('🌈 [TelegramUserAgent] Ready for autonomous operations!');
    } else {
      elizaLogger.error('[TelegramUserAgent] ❌ Session validation failed');
      elizaLogger.warn('[TelegramUserAgent] Re-run: python3 scripts/autonomous-telegram-auth.py');
    }
  }

  static async start(runtime: IAgentRuntime): Promise<TelegramUserAgentService> {
    const service = new TelegramUserAgentService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    elizaLogger.info('[TelegramUserAgent] Stopping...');
    this.session = null;
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }

  /**
   * Validate session by connecting to Telegram
   */
  private async validateSession(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `python3 ${this.pythonScriptPath} validate-session`,
        { timeout: 10000 }
      );

      const isValid = stdout.includes('Session validated') || stdout.includes('готов к автономной работе');

      if (this.session) {
        this.session.isValid = isValid;
        this.session.lastChecked = new Date();
      }

      return isValid;
    } catch (error) {
      elizaLogger.error('[TelegramUserAgent] Session validation error:', error);
      return false;
    }
  }

  /**
   * Send message to a bot (autonomous)
   */
  async sendMessage(options: SendMessageOptions): Promise<{
    success: boolean;
    response?: TelegramMessage[];
    error?: string;
  }> {
    if (!this.session?.isValid) {
      return {
        success: false,
        error: 'Session not initialized or invalid'
      };
    }

    try {
      elizaLogger.info(`[TelegramUserAgent] Sending message to @${options.username}`);

      const command = `python3 ${this.pythonScriptPath} send-message "${options.username}" "${options.message}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: options.timeout || 30000
      });

      if (stderr && stderr.includes('Error')) {
        return {
          success: false,
          error: stderr
        };
      }

      // Parse response from stdout
      const messages = this.parseMessagesFromOutput(stdout);

      elizaLogger.success(`[TelegramUserAgent] ✅ Message sent to @${options.username}`);

      return {
        success: true,
        response: messages
      };

    } catch (error: any) {
      elizaLogger.error('[TelegramUserAgent] Send message error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Read messages from a bot
   */
  async readMessages(options: ReadMessagesOptions): Promise<{
    success: boolean;
    messages?: TelegramMessage[];
    error?: string;
  }> {
    if (!this.session?.isValid) {
      return {
        success: false,
        error: 'Session not initialized or invalid'
      };
    }

    try {
      elizaLogger.info(`[TelegramUserAgent] Reading messages from @${options.username}`);

      const command = `python3 ${this.pythonScriptPath} read-messages "${options.username}" ${options.limit || 10}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000
      });

      if (stderr && stderr.includes('Error')) {
        return {
          success: false,
          error: stderr
        };
      }

      const messages = this.parseMessagesFromOutput(stdout);

      elizaLogger.success(`[TelegramUserAgent] ✅ Read ${messages.length} messages`);

      return {
        success: true,
        messages
      };

    } catch (error: any) {
      elizaLogger.error('[TelegramUserAgent] Read messages error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Telegram messages from Python script output
   */
  private parseMessagesFromOutput(output: string): TelegramMessage[] {
    const messages: TelegramMessage[] = [];

    // Look for message blocks in output
    // Format from Python script:
    // ============================================================
    // 📨 ОТВЕТ БОТА:
    // ============================================================
    // [message text]
    // ============================================================

    const messageRegex = /📨 ОТВЕТ БОТА:[\s\S]*?={60}([\s\S]*?)={60}/g;
    const matches = output.matchAll(messageRegex);

    for (const match of matches) {
      const messageText = match[1].trim();
      if (messageText) {
        messages.push({
          id: Date.now(),
          text: messageText,
          from: {
            id: 0,
            firstName: 'Bot',
          },
          date: new Date(),
          isOutgoing: false,
        });
      }
    }

    return messages;
  }

  /**
   * Get session status
   */
  getSessionStatus(): {
    isConfigured: boolean;
    isValid: boolean;
    lastChecked?: Date;
  } {
    return {
      isConfigured: !!this.session,
      isValid: this.session?.isValid || false,
      lastChecked: this.session?.lastChecked,
    };
  }
}
