/**
 * Mock Telegram API для офлайн тестирования
 *
 * Позволяет тестировать бота без реальных API вызовов:
 * - Быстрее (нет сетевых запросов)
 * - Предсказуемо (контролируемые ответы)
 * - Офлайн (работает без интернета)
 * - Изолировано (не зависит от Telegram API)
 */

export interface MockTelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
    is_bot?: boolean;
  };
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
  };
  date: number;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface MockTelegramUpdate {
  update_id: number;
  message?: MockTelegramMessage;
}

/**
 * Mock Telegram API Server
 *
 * Симулирует Telegram Bot API локально
 */
export class MockTelegramAPI {
  private messages: MockTelegramMessage[] = [];
  private updates: MockTelegramUpdate[] = [];
  private nextUpdateId: number = 1;
  private nextMessageId: number = 1;
  private botInfo: any;
  private responseDelay: number;

  constructor(options: {
    botUsername?: string;
    botId?: number;
    responseDelay?: number;
  } = {}) {
    this.botInfo = {
      id: options.botId || 123456789,
      is_bot: true,
      first_name: 'Mock Bot',
      username: options.botUsername || 'mock_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };

    this.responseDelay = options.responseDelay || 0;
  }

  /**
   * Симулирует задержку сети
   */
  private async delay(): Promise<void> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }
  }

  /**
   * GET /getMe - Получить информацию о боте
   */
  async getMe(): Promise<{ ok: boolean; result: any }> {
    await this.delay();
    return {
      ok: true,
      result: this.botInfo,
    };
  }

  /**
   * POST /sendMessage - Отправить сообщение
   */
  async sendMessage(params: {
    chat_id: number;
    text: string;
    parse_mode?: string;
    reply_markup?: any;
  }): Promise<{ ok: boolean; result: MockTelegramMessage }> {
    await this.delay();

    const message: MockTelegramMessage = {
      message_id: this.nextMessageId++,
      from: {
        id: this.botInfo.id,
        first_name: this.botInfo.first_name,
        username: this.botInfo.username,
        is_bot: true,
      },
      chat: {
        id: params.chat_id,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: params.text,
    };

    this.messages.push(message);

    return {
      ok: true,
      result: message,
    };
  }

  /**
   * POST /getUpdates - Получить обновления
   */
  async getUpdates(params: {
    offset?: number;
    limit?: number;
    timeout?: number;
  } = {}): Promise<{ ok: boolean; result: MockTelegramUpdate[] }> {
    await this.delay();

    const offset = params.offset || 0;
    const limit = params.limit || 100;

    const updates = this.updates.filter((u) => u.update_id >= offset).slice(0, limit);

    return {
      ok: true,
      result: updates,
    };
  }

  /**
   * POST /sendChatAction - Отправить действие (typing, upload_photo, etc.)
   */
  async sendChatAction(params: {
    chat_id: number;
    action: string;
  }): Promise<{ ok: boolean; result: boolean }> {
    await this.delay();

    return {
      ok: true,
      result: true,
    };
  }

  /**
   * Симулировать входящее сообщение от пользователя
   */
  simulateUserMessage(params: {
    chatId: number;
    userId: number;
    username: string;
    text: string;
  }): MockTelegramUpdate {
    const message: MockTelegramMessage = {
      message_id: this.nextMessageId++,
      from: {
        id: params.userId,
        first_name: params.username,
        username: params.username,
        is_bot: false,
      },
      chat: {
        id: params.chatId,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: params.text,
    };

    // Detect entities (commands, mentions, etc.)
    if (message.text?.startsWith('/')) {
      const commandEnd = message.text.indexOf(' ');
      message.entities = [
        {
          type: 'bot_command',
          offset: 0,
          length: commandEnd === -1 ? message.text.length : commandEnd,
        },
      ];
    }

    const update: MockTelegramUpdate = {
      update_id: this.nextUpdateId++,
      message,
    };

    this.updates.push(update);
    this.messages.push(message);

    return update;
  }

  /**
   * Получить все сообщения бота
   */
  getBotMessages(): MockTelegramMessage[] {
    return this.messages.filter((m) => m.from.is_bot);
  }

  /**
   * Получить последнее сообщение бота
   */
  getLastBotMessage(): MockTelegramMessage | null {
    const botMessages = this.getBotMessages();
    return botMessages.length > 0 ? botMessages[botMessages.length - 1] : null;
  }

  /**
   * Очистить все сообщения и обновления
   */
  clear(): void {
    this.messages = [];
    this.updates = [];
    this.nextUpdateId = 1;
    this.nextMessageId = 1;
  }

  /**
   * Получить все сообщения (для debugging)
   */
  getAllMessages(): MockTelegramMessage[] {
    return [...this.messages];
  }
}

/**
 * Mock Telegram Client для тестов
 *
 * Имитирует интерфейс настоящего TelegramClient
 */
export class MockTelegramClient {
  private api: MockTelegramAPI;
  private lastUpdateId: number = 0;

  constructor(api: MockTelegramAPI) {
    this.api = api;
  }

  async sendCommand(chatId: number, command: string): Promise<MockTelegramMessage> {
    // Симулируем отправку от пользователя
    this.api.simulateUserMessage({
      chatId,
      userId: 999999,
      username: 'test_user',
      text: command,
    });

    // Ждем ответ бота (в реальности бот должен обработать и ответить)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const lastMessage = this.api.getLastBotMessage();
    if (!lastMessage) {
      throw new Error('No bot response received');
    }

    return lastMessage;
  }

  async waitForResponse(
    botUsername: string,
    timeoutMs: number = 5000
  ): Promise<MockTelegramMessage | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const updates = await this.api.getUpdates({
        offset: this.lastUpdateId + 1,
      });

      for (const update of updates.result) {
        this.lastUpdateId = update.update_id;

        if (update.message && update.message.from.username === botUsername) {
          return update.message;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return null;
  }

  async clearUpdates(): Promise<void> {
    const updates = await this.api.getUpdates();
    if (updates.result.length > 0) {
      this.lastUpdateId = updates.result[updates.result.length - 1].update_id;
    }
  }

  getAPI(): MockTelegramAPI {
    return this.api;
  }
}

/**
 * Factory функции для быстрого создания моков
 */
export function createMockTelegramAPI(
  options?: {
    botUsername?: string;
    responseDelay?: number;
  }
): MockTelegramAPI {
  return new MockTelegramAPI(options);
}

export function createMockTelegramClient(
  api?: MockTelegramAPI
): MockTelegramClient {
  return new MockTelegramClient(api || createMockTelegramAPI());
}

/**
 * Предопределенные сценарии для тестов
 */
export const mockScenarios = {
  /**
   * Успешный /start command
   */
  startCommand: async (api: MockTelegramAPI) => {
    api.simulateUserMessage({
      chatId: 123456,
      userId: 999999,
      username: 'test_user',
      text: '/start',
    });

    // Симулируем ответ бота
    await api.sendMessage({
      chat_id: 123456,
      text: 'Привет! 👋 Я Vibee, твой AI-наставник по vibe-coding! Чем могу помочь?',
    });
  },

  /**
   * Обычное сообщение
   */
  regularMessage: async (api: MockTelegramAPI, text: string) => {
    api.simulateUserMessage({
      chatId: 123456,
      userId: 999999,
      username: 'test_user',
      text,
    });

    // Симулируем ответ бота
    await api.sendMessage({
      chat_id: 123456,
      text: `Отвечаю на: "${text}"`,
    });
  },

  /**
   * Множественные команды
   */
  multipleCommands: async (api: MockTelegramAPI) => {
    const commands = ['/start', '/menu', '/help'];

    for (const cmd of commands) {
      api.simulateUserMessage({
        chatId: 123456,
        userId: 999999,
        username: 'test_user',
        text: cmd,
      });

      await api.sendMessage({
        chat_id: 123456,
        text: `Response to ${cmd}`,
      });
    }
  },
};

/**
 * Assertion helpers для тестов
 */
export const mockAssertions = {
  /**
   * Проверить что бот ответил
   */
  expectBotResponse(api: MockTelegramAPI, expected?: string): void {
    const lastMessage = api.getLastBotMessage();

    if (!lastMessage) {
      throw new Error('Expected bot response but got none');
    }

    if (expected && lastMessage.text !== expected) {
      throw new Error(
        `Expected bot to say "${expected}" but got "${lastMessage.text}"`
      );
    }
  },

  /**
   * Проверить количество сообщений бота
   */
  expectBotMessageCount(api: MockTelegramAPI, count: number): void {
    const botMessages = api.getBotMessages();

    if (botMessages.length !== count) {
      throw new Error(
        `Expected ${count} bot messages but got ${botMessages.length}`
      );
    }
  },

  /**
   * Проверить что бот ответил за определенное время
   */
  async expectResponseWithin(
    api: MockTelegramAPI,
    maxMs: number,
    action: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    const messagesBefore = api.getBotMessages().length;

    await action();

    const elapsed = Date.now() - startTime;
    const messagesAfter = api.getBotMessages().length;

    if (messagesAfter === messagesBefore) {
      throw new Error('No bot response received');
    }

    if (elapsed > maxMs) {
      throw new Error(`Response took ${elapsed}ms, expected < ${maxMs}ms`);
    }
  },
};
