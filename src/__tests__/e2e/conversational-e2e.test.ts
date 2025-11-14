import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { AgentRuntime, Service, Plugin } from '@elizaos/core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * E2E Tests для разговорного интерфейса
 * Тестируем реальное поведение во время выполнения
 * Согласно лучшим практикам ElizaOS:
 * https://docs.elizaos.ai/guides/test-a-project
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock Telegram Service для тестирования
class MockTelegramService extends Service {
  static serviceType = 'telegram';

  bot = {
    telegram: {
      sendMessage: async (chatId: number, text: string, options?: any) => {
        console.log(`📤 [MOCK] Sent message to ${chatId}:`, text.substring(0, 100));
        return { message_id: 12345 };
      },
      setMyCommands: async (commands: any[]) => {
        console.log(`📤 [MOCK] Set commands:`, commands);
        return true;
      },
    },
    handleUpdate: async (update: any) => {
      console.log(`📥 [MOCK] Received update:`, update);
    },
    on: (event: string, handler: Function) => {
      console.log(`🎧 [MOCK] Registered handler for:`, event);
    },
  };

  async initialize(runtime: any) {
    console.log('🤖 [MOCK] Telegram service initialized');
  }
}

describe('Conversational Interface - E2E Tests', () => {
  let runtime: AgentRuntime;

  /**
   * Инициализация тестового окружения
   */
  beforeAll(async () => {
    console.log('\n🚀 Инициализация E2E тестов для разговорного интерфейса\n');

    // Создаем mock runtime с нужными сервисами
    runtime = new AgentRuntime({
      token: 'test-token',
      modelProvider: 'test',
      agents: [],
      plugins: [],
      services: [MockTelegramService],
    } as any);

    // Добавляем mock Telegram service
    runtime.registerService(new MockTelegramService(runtime));
  });

  afterAll(() => {
    console.log('\n✅ E2E тесты завершены\n');
  });

  /**
   * Тест 1: Инициализация сервисов
   */
  describe('Service Initialization', () => {
    it('должен инициализировать TelegramCommandsService', async () => {
      const telegramCommandsService = runtime.getService('telegram-commands');
      expect(telegramCommandsService).toBeDefined();

      console.log('✅ TelegramCommandsService найден');
    });

    it('должен инициализировать ContentCallbackHandlerService', async () => {
      const callbackHandlerService = runtime.getService('content-callback-handler');
      expect(callbackHandlerService).toBeDefined();

      console.log('✅ ContentCallbackHandlerService найден');
    });

    it('должен инициализировать TelegramStartService', async () => {
      const startService = runtime.getService('telegram-start-handler');
      expect(startService).toBeDefined();

      console.log('✅ TelegramStartService найден');
    });
  });

  /**
   * Тест 2: Проверка загрузки плагинов
   */
  describe('Plugin Loading', () => {
    it('должен загрузить telegram-start-handler плагин', async () => {
      // Импортируем плагин
      const { telegramStartPlugin } = await import(join(__dirname, '../../telegram-start-plugin.ts'));
      expect(telegramStartPlugin).toBeDefined();
      expect(telegramStartPlugin.name).toBe('telegram-start-handler');
      expect(telegramStartPlugin.services).toBeDefined();
      expect(telegramStartPlugin.services!.length).toBeGreaterThan(0);

      console.log('✅ telegram-start-handler плагин корректно структурирован');
    });

    it('должен загрузить telegram-commands плагин', async () => {
      const { telegramCommandsPlugin } = await import(join(__dirname, '../../telegram-commands-plugin.ts'));
      expect(telegramCommandsPlugin).toBeDefined();
      expect(telegramCommandsPlugin.name).toBe('telegram-commands');
      expect(telegramCommandsPlugin.services).toBeDefined();

      console.log('✅ telegram-commands плагин корректно структурирован');
    });

    it('должен загрузить content-callback-handler плагин', async () => {
      const { contentCallbackHandlerPlugin } = await import(join(__dirname, '../../content-callback-handler.ts'));
      expect(contentCallbackHandlerPlugin).toBeDefined();
      expect(contentCallbackHandlerPlugin.name).toBe('content-callback-handler');
      expect(contentCallbackHandlerPlugin.services).toBeDefined();

      console.log('✅ content-callback-handler плагин корректно структурирован');
    });
  });

  /**
   * Тест 3: Проверка KeyboardBuilder
   */
  describe('Keyboard Builder', () => {
    it('должен создавать клавиатуры без ошибок', async () => {
      const { keyboard } = await import(join(__dirname, '../../telegram-keyboards/index.ts'));

      // Проверяем что keyboard объект существует
      expect(keyboard).toBeDefined();
      expect(typeof keyboard.pattern).toBe('function');

      console.log('✅ KeyboardBuilder функционален');
    });

    it('должен создавать content_hooks клавиатуру', async () => {
      const { keyboard } = await import(join(__dirname, '../../telegram-keyboards/index.ts'));

      const hooksKeyboard = keyboard.pattern('content_hooks');
      expect(hooksKeyboard).toBeDefined();
      expect(hooksKeyboard.inline_keyboard).toBeDefined();
      expect(Array.isArray(hooksKeyboard.inline_keyboard)).toBe(true);

      console.log('✅ content_hooks клавиатура создается корректно');
    });
  });

  /**
   * Тест 4: Проверка callback обработчиков (импорты)
   */
  describe('Callback Handlers Imports', () => {
    it('должен корректно импортировать content-callback-handler', async () => {
      const callbackHandler = await import(join(__dirname, '../../content-callback-handler.ts'));

      expect(callbackHandler).toBeDefined();
      expect(typeof callbackHandler).toBe('object');

      console.log('✅ content-callback-handler импортируется');
    });

    it('должен иметь файл с callback обработчиками', async () => {
      const fs = require('fs');
      const callbackHandlerPath = join(__dirname, '../../content-callback-handler.ts');
      const content = fs.readFileSync(callbackHandlerPath, 'utf-8');

      expect(content).toContain('handleShowCommands');
      expect(content).toContain('handleShowNews');
      expect(content).toContain('handleCreateReels');

      console.log('✅ Callback обработчики присутствуют в файле');
    });
  });

  /**
   * Тест 5: Проверка интеграции с Character
   */
  describe('Character Integration', () => {
    it('должен корректно импортировать character', async () => {
      const characterPath = join(__dirname, '../../character.ts');
      const { character } = await import(join(__dirname, '../../character.ts'));

      expect(character).toBeDefined();
      expect(character.name).toBe('Vibee');

      console.log('✅ Character интегрирован корректно');
    });

    it('должен иметь корректную систему промптов', async () => {
      const { character } = await import(join(__dirname, '../../character.ts'));

      expect(character.system).toBeDefined();
      expect(typeof character.system).toBe('string');
      expect(character.system.length).toBeGreaterThan(50);

      console.log('✅ Системные промпты настроены');
    });
  });
});
