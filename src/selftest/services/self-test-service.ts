/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Test Service
 *
 * Сервис для автоматического самотестирования бота.
 */

import {
  IAgentRuntime,
  Service,
  ServiceType,
  elizaLogger,
} from '@elizaos/core';
import { TestManager } from '../test-manager';
import { TestResult } from '../base-test';

// Импортируем все тесты
import { TrainStartTest } from '../tests/train-start-test';

export class SelfTestService extends Service {
  static serviceType = 'selftest';

  private testManager: TestManager;
  private testHistory: TestResult[] = [];
  private testChatId: string | null = null;
  private isAutonomousMode: boolean = false;
  private scheduledTestsTimer?: NodeJS.Timeout;
  private improvementCycleTimer?: NodeJS.Timeout;

  constructor(runtime?: IAgentRuntime) {
    super(runtime);
    this.testManager = new TestManager();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [SelfTestService] Initializing РАДУЖНЫЙ МОСТ...');

    // Регистрируем все тесты
    this.registerTests();

    // Проверяем наличие Telegram клиента
    const telegramClient = runtime.clients?.find(
      (client: any) => client.constructor.name === 'TelegramClientInterface'
    );

    if (!telegramClient) {
      elizaLogger.warn(
        '[SelfTestService] ⚠️ Telegram client not found, self-testing may not work'
      );
    }

    const stats = this.testManager.getStats();
    elizaLogger.success(
      `🌈 [SelfTestService] РАДУЖНЫЙ МОСТ initialized with ${stats.total} tests!`
    );
    elizaLogger.info('[SelfTestService] Available tests:');
    stats.tests.forEach((test) => {
      elizaLogger.info(`  - ${test.id}: ${test.name}`);
    });

    // Проверяем autonomous mode
    const autonomousMode = process.env.SELFTEST_AUTONOMOUS === 'true';

    if (autonomousMode) {
      elizaLogger.success('🌈 [Autonomous] РАДУЖНЫЙ МОСТ Autonomous Mode ENABLED!');
      await this.startAutonomousMode(runtime);
    } else {
      elizaLogger.info('[SelfTestService] Autonomous mode disabled. Set SELFTEST_AUTONOMOUS=true to enable.');
    }
  }

  static async start(runtime: IAgentRuntime): Promise<SelfTestService> {
    const service = new SelfTestService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    elizaLogger.info('[SelfTestService] Stopping...');

    // Очищаем таймеры
    if (this.scheduledTestsTimer) {
      clearInterval(this.scheduledTestsTimer);
      this.scheduledTestsTimer = undefined;
    }

    if (this.improvementCycleTimer) {
      clearInterval(this.improvementCycleTimer);
      this.improvementCycleTimer = undefined;
    }

    elizaLogger.info('[SelfTestService] Autonomous mode stopped');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }

  /**
   * Регистрация всех тестов
   */
  private registerTests(): void {
    // Регистрируем тесты
    this.testManager.registerTest(new TrainStartTest());

    // Здесь можно легко добавить новые тесты:
    // this.testManager.registerTest(new TrainCancelTest());
    // this.testManager.registerTest(new PhotoUploadTest());
  }

  /**
   * Установить chat_id для тестирования
   */
  setTestChatId(chatId: string): void {
    this.testChatId = chatId;
    elizaLogger.info(
      `🌈 [SelfTestService] Test chat_id set to: ${chatId}`
    );
  }

  /**
   * Запустить все тесты
   */
  async runAllTests(runtime: IAgentRuntime): Promise<TestResult[]> {
    if (!this.testChatId) {
      throw new Error('Test chat_id not set. Call setTestChatId() first.');
    }

    elizaLogger.info('🌈 [SelfTestService] Running full test suite...');

    const results = await this.testManager.runAll(runtime, this.testChatId);

    // Сохраняем в историю
    this.testHistory.push(...results);

    // Статистика
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    elizaLogger.info(
      `📊 [SelfTestService] Tests complete: ${passed}/${total} passed`
    );

    if (passed === total) {
      elizaLogger.success('🎉 [SelfTestService] ALL TESTS PASSED!');
      elizaLogger.success('🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!');
    } else {
      elizaLogger.warn(
        `⚠️ [SelfTestService] ${total - passed} test(s) failed`
      );
    }

    return results;
  }

  /**
   * Запустить конкретный тест
   */
  async runTest(testId: string, runtime: IAgentRuntime): Promise<TestResult | null> {
    if (!this.testChatId) {
      throw new Error('Test chat_id not set. Call setTestChatId() first.');
    }

    const result = await this.testManager.runTest(testId, runtime, this.testChatId);

    if (result) {
      this.testHistory.push(result);
    }

    return result;
  }

  /**
   * Получить историю тестов
   */
  getTestHistory(): TestResult[] {
    return this.testHistory;
  }

  /**
   * Очистить историю
   */
  clearTestHistory(): void {
    this.testHistory = [];
    elizaLogger.info('[SelfTestService] Test history cleared');
  }

  /**
   * Получить статистику тестов
   */
  getStats() {
    return this.testManager.getStats();
  }

  // ============================================================
  // 🌈 РАДУЖНЫЙ МОСТ - Autonomous Mode
  // ============================================================

  /**
   * Запустить autonomous mode (полностью автономный режим)
   */
  private async startAutonomousMode(runtime: IAgentRuntime): Promise<void> {
    this.isAutonomousMode = true;

    elizaLogger.success('🌈 [Autonomous] Starting autonomous self-testing mode...');
    elizaLogger.info('🌈 [Autonomous] Bot will now test itself automatically!');

    // 1. Запустить тесты сразу при старте (но с задержкой, чтобы все клиенты инициализировались)
    setTimeout(async () => {
      await this.runStartupTests(runtime);
    }, 10000); // 10 секунд задержки

    // 2. Scheduled tests каждые 30 минут
    this.scheduledTestsTimer = setInterval(async () => {
      await this.runScheduledTests(runtime);
    }, 30 * 60 * 1000); // 30 минут

    // 3. Continuous improvement cycle каждый час
    this.improvementCycleTimer = setInterval(async () => {
      await this.runImprovementCycle(runtime);
    }, 60 * 60 * 1000); // 60 минут

    elizaLogger.success('🌈 [Autonomous] All autonomous cycles started!');
  }

  /**
   * Запустить startup health check
   */
  private async runStartupTests(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [Autonomous] Running startup health check...');

    if (!this.testChatId) {
      elizaLogger.warn('🌈 [Autonomous] No test chat_id set, skipping startup tests');
      return;
    }

    try {
      const results = await this.runAllTests(runtime);
      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      elizaLogger.success(`🌈 [Autonomous] Startup tests: ${passed}/${total} passed`);

      // Отправить отчет в дефолтный chat
      await this.sendReport(runtime, results, '🚀 Startup Health Check');
    } catch (error: any) {
      elizaLogger.error(`🌈 [Autonomous] Startup tests failed: ${error.message}`);
    }
  }

  /**
   * Запустить scheduled tests
   */
  private async runScheduledTests(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [Autonomous] Running scheduled tests...');

    if (!this.testChatId) {
      elizaLogger.warn('🌈 [Autonomous] No test chat_id set, skipping scheduled tests');
      return;
    }

    try {
      const results = await this.runAllTests(runtime);

      // Отправлять отчет только если есть failures
      const failures = results.filter(r => !r.passed);
      if (failures.length > 0) {
        elizaLogger.warn(`🌈 [Autonomous] Found ${failures.length} test failures`);
        await this.sendReport(runtime, results, '⚠️ Scheduled Test Failures');
      } else {
        elizaLogger.success('🌈 [Autonomous] All scheduled tests passed!');
      }
    } catch (error: any) {
      elizaLogger.error(`🌈 [Autonomous] Scheduled tests failed: ${error.message}`);
    }
  }

  /**
   * Запустить improvement cycle
   */
  private async runImprovementCycle(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [Autonomous] Running improvement cycle...');

    try {
      // 1. Анализировать историю тестов
      const patterns = this.analyzeTestHistory();

      // 2. Идентифицировать проблемные области
      const issues = this.identifyIssues(patterns);

      // 3. Логировать для дальнейшего улучшения
      if (issues.length > 0) {
        elizaLogger.warn(`🌈 [Autonomous] Found ${issues.length} improvement opportunities`);
        await this.sendReport(runtime, [], '💡 Improvement Opportunities', issues);
      } else {
        elizaLogger.success('🌈 [Autonomous] No issues found, system is healthy!');
      }
    } catch (error: any) {
      elizaLogger.error(`🌈 [Autonomous] Improvement cycle failed: ${error.message}`);
    }
  }

  /**
   * Отправить отчет в Telegram
   */
  private async sendReport(
    runtime: IAgentRuntime,
    results: TestResult[],
    title: string,
    additionalInfo?: string[]
  ): Promise<void> {
    const telegramClient = runtime.clients?.find(
      (client: any) => client.constructor.name === 'TelegramClientInterface'
    );

    if (!telegramClient || !this.testChatId) {
      elizaLogger.warn('🌈 [Autonomous] Cannot send report: Telegram client or chat_id not available');
      return;
    }

    const report = this.formatDetailedReport(results, title, additionalInfo);

    try {
      await (telegramClient as any).sendMessage(this.testChatId, report);
      elizaLogger.success('🌈 [Autonomous] Report sent to Telegram');
    } catch (error: any) {
      elizaLogger.error(`🌈 [Autonomous] Failed to send report: ${error.message}`);
    }
  }

  /**
   * Форматировать детальный отчет
   */
  private formatDetailedReport(
    results: TestResult[],
    title: string,
    additionalInfo?: string[]
  ): string {
    let report = `🌈 РАДУЖНЫЙ МОСТ - ${title}\n`;
    report += `${'='.repeat(40)}\n\n`;

    if (results.length > 0) {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      report += `📊 Итого: ${passed}/${total} тестов пройдено\n\n`;

      // Детали по каждому тесту
      results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        report += `${icon} ${result.testName} (${result.duration}ms)\n`;
        report += `   ${result.message}\n\n`;
      });
    }

    // Дополнительная информация
    if (additionalInfo && additionalInfo.length > 0) {
      report += `\n💡 Рекомендации:\n`;
      additionalInfo.forEach(info => {
        report += `   - ${info}\n`;
      });
    }

    report += `\n🌈 РАДУЖНЫЙ МОСТ работает автономно!\n`;
    report += `Время: ${new Date().toLocaleString('ru-RU')}\n`;

    return report;
  }

  /**
   * Анализировать историю тестов
   */
  private analyzeTestHistory(): any {
    // Простой анализ: подсчитать success rate для каждого теста
    const stats = new Map<string, { total: number; passed: number }>();

    this.testHistory.forEach(result => {
      const current = stats.get(result.testId) || { total: 0, passed: 0 };
      current.total++;
      if (result.passed) current.passed++;
      stats.set(result.testId, current);
    });

    return Object.fromEntries(stats);
  }

  /**
   * Идентифицировать проблемы
   */
  private identifyIssues(patterns: any): string[] {
    const issues: string[] = [];

    // Проверяем каждый тест на success rate
    Object.entries(patterns).forEach(([testId, stats]: [string, any]) => {
      const successRate = (stats.passed / stats.total) * 100;

      if (successRate < 70) {
        issues.push(
          `Test "${testId}" имеет низкий success rate: ${successRate.toFixed(1)}% (${stats.passed}/${stats.total})`
        );
      }
    });

    // Проверяем общее количество тестов
    const totalTests = this.testManager.getStats().total;
    if (totalTests < 3) {
      issues.push(`Недостаточно тестов: ${totalTests}. Рекомендуется добавить больше тестов для покрытия.`);
    }

    return issues;
  }
}
