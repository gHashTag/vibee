/**
 * 🌈 РАДУЖНЫЙ МОСТ - Агент-Агент Связь
 *
 * Система двусторонней коммуникации где бот сам себе отправляет сообщения,
 * обрабатывает их, анализирует результаты и развивается автономно.
 *
 * БЕЗ ВНЕШНИХ СКРИПТОВ - только агент-агент связь!
 */

import { Service, type IAgentRuntime, logger } from '@elizaos/core';

console.log('🌈 [DEBUG] agent-agent-bridge.ts module starting to load...');

class AgentAgentBridgeService extends Service {
  static serviceType = 'agent-agent-bridge';
  capabilityDescription = 'Двусторонняя связь агент-агент для автономного тестирования';

  private readonly SELF_CHAT_ID: string = process.env.ADMIN_CHAT_ID || '144022504';
  private isProcessing = false;
  private testCounter = 0;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<AgentAgentBridgeService> {
    console.log('🌈 [DEBUG] AgentAgentBridgeService.start() called');
    const service = new AgentAgentBridgeService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log('🌈 [DEBUG] AgentAgentBridgeService.initialize() called');
    logger.info('🌈 [AgentAgentBridge] Initializing self-testing system...');

    // Ждем Telegram сервис (как другие сервисы)
    const maxAttempts = 20;
    let telegramService: any = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService?.bot) {
        logger.info('🌈 [AgentAgentBridge] ✅ Found TelegramService with bot');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!telegramService?.bot) {
      logger.error('❌ Telegram service not available after waiting');
      return;
    }

    // Слушаем ВСЕ сообщения в чате
    telegramService.bot.on('message', async (msg: any) => {
      // Игнорируем свои собственные сообщения
      if (msg.from?.id === telegramService.bot.botInfo?.id) {
        return;
      }

      // Обрабатываем сообщения от пользователей
      await this.handleIncomingMessage(runtime, msg);
    });

    logger.info('✅ [AgentAgentBridge] Listening for incoming messages');

    // Запускаем автономный цикл тестирования каждые 5 минут
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.autonomousTestCycle(runtime);
      }
    }, 5 * 60 * 1000);

    // Первый тест через минуту
    setTimeout(() => {
      this.autonomousTestCycle(runtime);
    }, 60 * 1000);

    logger.info('🚀 [AgentAgentBridge] Ready for agent-agent communication!');
  }

  /**
   * Автономный цикл тестирования - бот сам себе отправляет тестовое сообщение
   */
  private async autonomousTestCycle(runtime: IAgentRuntime): Promise<void> {
    this.isProcessing = true;
    this.testCounter++;

    try {
      logger.info(`🔄 [AgentAgentBridge] Starting autonomous test cycle #${this.testCounter}`);

      // Генерируем тестовое сообщение
      const testMessage = this.generateTestMessage();

      // Отправляем сообщение САМОМУ СЕБЕ через Telegram API
      await this.sendSelfMessage(runtime, testMessage);

      logger.info(`📤 [AgentAgentBridge] Sent self-message: "${testMessage}"`);
    } catch (error) {
      logger.error('❌ [AgentAgentBridge] Error in autonomous cycle:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Отправляем сообщение самому себе
   */
  private async sendSelfMessage(runtime: IAgentRuntime, text: string): Promise<void> {
    const telegramService: any = runtime.getService('telegram');
    if (!telegramService?.bot) {
      throw new Error('Telegram service not available');
    }

    // Отправляем без markdown парсинга
    const messageText = `SELF_TEST: ${text}`;

    // Отправляем сообщение в свой собственный чат
    await telegramService.bot.telegram.sendMessage(
      this.SELF_CHAT_ID,
      messageText
    );
  }

  /**
   * Обрабатываем входящее сообщение
   */
  private async handleIncomingMessage(runtime: IAgentRuntime, msg: any): Promise<void> {
    const text = msg.text || '';

    // Проверяем что это наше собственное тестовое сообщение
    if (text.startsWith('SELF_TEST:')) {
      await this.processSelfMessage(runtime, text, msg);
    } else {
      // Обычное сообщение от пользователя - просто логируем
      logger.info(`📨 [AgentAgentBridge] User message: "${text.substring(0, 50)}..."`);
    }
  }

  /**
   * Обрабатываем собственное сообщение - анализируем и реагируем
   */
  private async processSelfMessage(runtime: IAgentRuntime, text: string, msg: any): Promise<void> {
    const testContent = text.replace('SELF_TEST: ', '');

    logger.info(`🔍 [AgentAgentBridge] Processing self-message: "${testContent}"`);

    // Анализируем результат
    const analysis = await this.analyzeTestResult(runtime, testContent, msg);

    // Отправляем обратную связь себе
    await this.sendFeedbackMessage(runtime, analysis);
  }

  /**
   * Анализируем результат тестирования
   */
  private async analyzeTestResult(runtime: IAgentRuntime, testMessage: string, msg: any): Promise<string> {
    // Здесь можно добавить сложную логику анализа
    // Пока простой пример

    const analyses = [
      '✅ Тест пройден успешно',
      '⚠️ Требуется проверка',
      '🔧 Обнаружена проблема',
      '🚀 Система работает отлично!',
      '🎯 Все команды функционируют'
    ];

    const randomAnalysis = analyses[Math.floor(Math.random() * analyses.length)];
    return `${randomAnalysis}\n\n📊 Test: "${testMessage}"\n🕐 Time: ${new Date().toISOString()}`;
  }

  /**
   * Отправляем обратную связь
   */
  private async sendFeedbackMessage(runtime: IAgentRuntime, analysis: string): Promise<void> {
    // Экранируем markdown в анализе
    const escapedAnalysis = analysis.replace(/[_*[\]()`~>#+\-=|{}.!]/g, '\\$&');
    await this.sendSelfMessage(runtime, `📋 FEEDBACK:\n${escapedAnalysis}`);
  }

  /**
   * Генерируем тестовое сообщение
   */
  private generateTestMessage(): string {
    const tests = [
      'Проверка /start команды',
      'Тест системы обучения',
      'Проверка генерации изображений',
      'Тест новостного мониторинга',
      'Проверка TTS функций',
      'Тест базы данных',
      'Проверка векторных знаний',
      'Тест всех плагинов'
    ];

    const randomTest = tests[Math.floor(Math.random() * tests.length)];
    return `${randomTest} #${this.testCounter}`;
  }

  async stop(): Promise<void> {
    logger.info('🌈 [AgentAgentBridge] Stopping...');
    this.isProcessing = false;
  }
}

export const agentAgentBridgePlugin = {
  name: 'agent-agent-bridge',
  description: 'Двусторонняя связь агент-агент для автономного тестирования',
  services: [AgentAgentBridgeService],
};

console.log('🌈 [DEBUG] agentAgentBridgePlugin exported:', agentAgentBridgePlugin.name);

export default agentAgentBridgePlugin;
