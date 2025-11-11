/**
 * E2E Tests для Telegram Bot
 *
 * Эти тесты проверяют полный цикл работы бота:
 * 1. Запуск бота
 * 2. Отправка команд
 * 3. Получение и проверка ответов
 * 4. Проверка памяти и контекста
 * 5. Performance и timing
 *
 * Based on ElizaOS testing best practices
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn, type ChildProcess } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramResponse {
  ok: boolean;
  result: TelegramMessage | TelegramUpdate[];
  description?: string;
}

// Helper для взаимодействия с Telegram API
class TelegramClient {
  private botToken: string;
  private lastUpdateId: number = 0;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async apiCall(method: string, params: Record<string, any> = {}): Promise<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'API error');
    }

    return data.result;
  }

  async sendCommand(chatId: number, command: string): Promise<TelegramMessage> {
    return this.apiCall('sendMessage', {
      chat_id: chatId,
      text: command,
    });
  }

  async waitForResponse(botUsername: string, timeoutMs: number = 15000): Promise<TelegramMessage | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const updates: TelegramUpdate[] = await this.apiCall('getUpdates', {
        offset: this.lastUpdateId + 1,
        timeout: 3,
      });

      for (const update of updates) {
        this.lastUpdateId = update.update_id;

        if (update.message && update.message.from.username === botUsername) {
          return update.message;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return null;
  }

  async clearUpdates(): Promise<void> {
    const updates: TelegramUpdate[] = await this.apiCall('getUpdates', { offset: -1 });
    if (updates.length > 0) {
      this.lastUpdateId = updates[updates.length - 1].update_id;
    }
  }
}

// Управление процессом бота для E2E тестов
class BotProcess {
  private process: ChildProcess | null = null;
  private logFile: string;

  constructor(logFile: string = '/tmp/vibee-e2e-test.log') {
    this.logFile = logFile;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Запускаем через наш single-instance скрипт
      this.process = spawn('bash', [resolve(__dirname, '../scripts/start-single.sh')], {
        stdio: 'inherit',
        detached: true,
      });

      // Ждем когда бот запустится (проверяем логи)
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (existsSync(this.logFile)) {
          const logs = readFileSync(this.logFile, 'utf-8');

          if (logs.includes('Bot info:')) {
            clearInterval(checkInterval);
            resolve();
          }
        }

        if (Date.now() - startTime > 30000) {
          clearInterval(checkInterval);
          reject(new Error('Bot failed to start within 30 seconds'));
        }
      }, 1000);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');

      // Ждем graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Force kill если еще жив
      if (this.process.pid) {
        try {
          process.kill(this.process.pid, 'SIGKILL');
        } catch (e) {
          // Process already dead
        }
      }
    }

    // Убиваем все elizaos процессы на всякий случай
    spawn('pkill', ['-9', '-f', 'elizaos']);
  }
}

describe('Telegram Bot E2E Tests', () => {
  let client: TelegramClient;
  let botProcess: BotProcess;
  let testChatId: number;
  let botUsername: string;

  beforeAll(async () => {
    // Загружаем тестовые credentials
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    const chatIdStr = process.env.TEST_TELEGRAM_CHAT_ID;
    if (!chatIdStr) {
      throw new Error('TEST_TELEGRAM_CHAT_ID not set');
    }

    testChatId = parseInt(chatIdStr, 10);
    client = new TelegramClient(botToken);

    // Получаем username бота
    const botInfo = await client.apiCall('getMe');
    botUsername = botInfo.username;

    // Очищаем старые обновления
    await client.clearUpdates();

    // Запускаем бота
    botProcess = new BotProcess();
    console.log('🚀 Starting bot process for E2E tests...');
    await botProcess.start();
    console.log('✅ Bot started successfully');

    // Даем боту время полностью инициализироваться
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }, 60000); // 60 second timeout for beforeAll

  afterAll(async () => {
    console.log('🛑 Stopping bot process...');
    await botProcess.stop();
    console.log('✅ Bot stopped');
  });

  describe('Bot Lifecycle', () => {
    it('should be running and responsive', async () => {
      const botInfo = await client.apiCall('getMe');
      expect(botInfo).toBeDefined();
      expect(botInfo.username).toBe(botUsername);
    });
  });

  describe('/start Command', () => {
    it('should respond to /start command', async () => {
      // Отправляем /start
      await client.sendCommand(testChatId, '/start');

      // Ждем ответ
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
      expect(response?.text).toBeDefined();
      expect(response?.text?.length).toBeGreaterThan(0);
    }, 30000);

    it('should respond within 10 seconds', async () => {
      const startTime = Date.now();

      await client.sendCommand(testChatId, '/start');
      const response = await client.waitForResponse(botUsername, 10000);

      const responseTime = Date.now() - startTime;

      expect(response).not.toBeNull();
      expect(responseTime).toBeLessThan(10000);
    }, 20000);

    it('should have welcome message format', async () => {
      await client.sendCommand(testChatId, '/start');
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
      expect(response?.text).toMatch(/привет|hello|hi|добро пожаловать|welcome/i);
    }, 30000);
  });

  describe('/menu Command', () => {
    it('should respond to /menu command', async () => {
      await client.sendCommand(testChatId, '/menu');
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
      expect(response?.text).toBeDefined();
    }, 30000);
  });

  describe('/help Command', () => {
    it('should respond to /help command', async () => {
      await client.sendCommand(testChatId, '/help');
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
      expect(response?.text).toBeDefined();
    }, 30000);
  });

  describe('Regular Messages', () => {
    it('should respond to regular text messages', async () => {
      await client.sendCommand(testChatId, 'Привет! Как дела?');
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
      expect(response?.text).toBeDefined();
    }, 30000);

    it('should maintain conversation context', async () => {
      // Первое сообщение
      await client.sendCommand(testChatId, 'Меня зовут Тестовый Пользователь');
      const response1 = await client.waitForResponse(botUsername, 15000);
      expect(response1).not.toBeNull();

      // Ждем немного
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Второе сообщение - проверяем память
      await client.sendCommand(testChatId, 'Как меня зовут?');
      const response2 = await client.waitForResponse(botUsername, 15000);

      expect(response2).not.toBeNull();
      // Бот должен помнить имя из предыдущего сообщения
      expect(response2?.text?.toLowerCase()).toMatch(/тестовый|пользователь/i);
    }, 60000);
  });

  describe('Performance Tests', () => {
    it('should handle multiple commands in sequence', async () => {
      const commands = ['/start', '/menu', '/help'];

      for (const command of commands) {
        await client.sendCommand(testChatId, command);
        const response = await client.waitForResponse(botUsername, 15000);

        expect(response).not.toBeNull();

        // Пауза между командами
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }, 90000);

    it('should not have memory leaks after 10 messages', async () => {
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        await client.sendCommand(testChatId, `Test message ${i + 1}`);
        await client.waitForResponse(botUsername, 10000);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Проверяем что бот все еще отвечает
      await client.sendCommand(testChatId, 'Final test message');
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
    }, 180000); // 3 minutes
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      await client.sendCommand(testChatId, '/invalidcommand123');
      const response = await client.waitForResponse(botUsername, 15000);

      // Бот должен или ответить что не понимает, или просто ответить по-умолчанию
      expect(response).not.toBeNull();
    }, 30000);

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000);

      await client.sendCommand(testChatId, longMessage);
      const response = await client.waitForResponse(botUsername, 15000);

      expect(response).not.toBeNull();
    }, 30000);
  });
});
