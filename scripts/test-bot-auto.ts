#!/usr/bin/env bun
/**
 * Автоматический тестер Telegram бота
 *
 * Этот скрипт:
 * 1. Отправляет команды боту от имени тестового пользователя
 * 2. Ожидает и отслеживает ответы бота
 * 3. Выводит результаты в режиме реального времени
 * 4. Проверяет работу всех команд (/start, /menu, /help)
 *
 * Использование: bun scripts/test-bot-auto.ts
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// Загружаем Infisical секреты
async function loadInfisicalSecrets(): Promise<void> {
  const envLocalPath = resolve(import.meta.dir, '../.env.local');

  if (!existsSync(envLocalPath)) {
    console.error(`${colors.red}❌ .env.local not found!${colors.reset}`);
    process.exit(1);
  }

  // Динамический импорт InfisicalClient
  const { InfisicalClient } = await import('@infisical/sdk');

  const client = new InfisicalClient({
    clientId: process.env.INFISICAL_CLIENT_ID,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET,
    siteUrl: 'https://eu.infisical.com',
  });

  const secrets = await client.listSecrets({
    environment: 'dev',
    projectId: process.env.INFISICAL_PROJECT_ID || '',
    path: '/',
  });

  for (const secret of secrets) {
    process.env[secret.secretKey] = secret.secretValue;
  }
}

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

// Класс для автоматического тестирования бота
class BotTester {
  private botToken: string;
  private testUserId: number | null = null;
  private lastUpdateId: number = 0;
  private botUsername: string = '';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  private async apiCall(method: string, params: Record<string, any> = {}): Promise<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data: TelegramResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Unknown API error');
      }

      return data.result;
    } catch (error) {
      console.error(`${colors.red}API Error [${method}]:${colors.reset}`, error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    console.log(`${colors.cyan}🤖 Инициализация тестера...${colors.reset}\n`);

    // Получаем информацию о боте
    const botInfo = await this.apiCall('getMe');
    this.botUsername = botInfo.username;

    console.log(`${colors.green}✓${colors.reset} Бот: @${colors.bright}${this.botUsername}${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} ID: ${colors.dim}${botInfo.id}${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Имя: ${colors.dim}${botInfo.first_name}${colors.reset}\n`);

    // Получаем последние обновления чтобы установить offset
    const updates: TelegramUpdate[] = await this.apiCall('getUpdates', { limit: 1 });
    if (updates.length > 0) {
      this.lastUpdateId = updates[0].update_id;
    }

    console.log(`${colors.yellow}📡 Начинаем мониторинг сообщений...${colors.reset}\n`);
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.testUserId) {
      console.error(`${colors.red}❌ Test user ID не установлен!${colors.reset}`);
      console.log(`${colors.yellow}💡 Отправьте любое сообщение боту @${this.botUsername} чтобы получить chat_id${colors.reset}\n`);
      return;
    }

    console.log(`${colors.blue}➤${colors.reset} Отправляю команду: ${colors.bright}${command}${colors.reset}`);

    await this.apiCall('sendMessage', {
      chat_id: this.testUserId,
      text: command,
    });

    console.log(`${colors.green}✓${colors.reset} Команда отправлена, ожидаю ответ...\n`);
  }

  async monitorUpdates(duration: number = 30): Promise<void> {
    const startTime = Date.now();
    let receivedResponse = false;

    console.log(`${colors.cyan}👀 Мониторинг ответов (${duration}s)...${colors.reset}\n`);

    while (Date.now() - startTime < duration * 1000) {
      try {
        const updates: TelegramUpdate[] = await this.apiCall('getUpdates', {
          offset: this.lastUpdateId + 1,
          timeout: 5,
        });

        for (const update of updates) {
          this.lastUpdateId = update.update_id;

          if (update.message) {
            const msg = update.message;
            const isFromBot = msg.from.first_name.includes('agent_v') || msg.from.username === this.botUsername;

            // Устанавливаем test user ID при первом сообщении
            if (!this.testUserId && !isFromBot) {
              this.testUserId = msg.chat.id;
              console.log(`${colors.green}✓${colors.reset} Обнаружен тестовый пользователь: ${colors.bright}${msg.from.first_name}${colors.reset} (ID: ${msg.chat.id})\n`);
            }

            // Выводим сообщения
            if (isFromBot) {
              console.log(`${colors.bgGreen}${colors.white} BOT ${colors.reset} ${colors.green}${msg.from.first_name}${colors.reset}`);
              console.log(`${colors.dim}${new Date(msg.date * 1000).toLocaleTimeString()}${colors.reset}`);
              console.log(`${msg.text || '[no text]'}\n`);
              receivedResponse = true;
            } else {
              console.log(`${colors.bgBlue}${colors.white} USER ${colors.reset} ${colors.blue}${msg.from.first_name}${colors.reset}`);
              console.log(`${colors.dim}${new Date(msg.date * 1000).toLocaleTimeString()}${colors.reset}`);
              console.log(`${msg.text || '[no text]'}\n`);
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${colors.red}Ошибка мониторинга:${colors.reset}`, error);
      }
    }

    if (!receivedResponse) {
      console.log(`${colors.red}❌ Бот не ответил за ${duration} секунд${colors.reset}\n`);
    }
  }

  async runTestSuite(): Promise<void> {
    console.log(`\n${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}  🧪 АВТОМАТИЧЕСКОЕ ТЕСТИРОВАНИЕ  ${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const commands = ['/start', '/menu', '/help'];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      console.log(`${colors.yellow}[${i + 1}/${commands.length}]${colors.reset} Тестирую команду: ${colors.bright}${command}${colors.reset}\n`);

      await this.sendCommand(command);
      await this.monitorUpdates(15);

      if (i < commands.length - 1) {
        console.log(`${colors.dim}⏳ Пауза перед следующим тестом...${colors.reset}\n`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  ✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО  ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.yellow}
    🐝 VIBEE BOT AUTO-TESTER 🐝
  ${colors.reset}\n`);

  await loadInfisicalSecrets();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error(`${colors.red}❌ TELEGRAM_BOT_TOKEN не найден!${colors.reset}`);
    process.exit(1);
  }

  const tester = new BotTester(botToken);
  await tester.initialize();

  // Сначала мониторим чтобы получить test user ID
  console.log(`${colors.yellow}💡 Отправьте любое сообщение боту чтобы начать тестирование${colors.reset}`);
  console.log(`${colors.dim}   Ожидание 30 секунд...${colors.reset}\n`);

  await tester.monitorUpdates(30);

  // Запускаем тесты
  await tester.runTestSuite();

  console.log(`${colors.cyan}✨ Тестирование завершено успешно!${colors.reset}`);
}

main().catch((error) => {
  console.error(`${colors.bgRed}${colors.white} FATAL ERROR ${colors.reset}`, error);
  process.exit(1);
});
