/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Testing Service - OPTIMIZED
 *
 * Этот сервис позволяет боту тестировать сам себя изнутри ElizaOS runtime.
 * Не требует MTProto, работает через внутренние механизмы бота.
 *
 * OPTIMIZATIONS: Parallel test execution, caching, batch processing
 */

import {
  IAgentRuntime,
  Service,
  ServiceType,
  elizaLogger,
} from '@elizaos/core';
import { performanceMonitor } from '../performance/PerformanceMonitor';
import { cachedProviderFactory } from '../performance/CachedProvider';

export interface SelfTestResult {
  testName: string;
  passed: boolean;
  message: string;
  timestamp: number;
}

export class SelfTestService extends Service {
  private testResults: SelfTestResult[] = [];
  private testChatId: string | null = null;
  private telegramClient: any = null;
  private testCache: ReturnType<typeof cachedProviderFactory.getProvider> | null = null;
  private testQueue: Array<() => Promise<SelfTestResult>> = [];
  private isProcessing = false;

  static serviceType: ServiceType = ServiceType.CUSTOM;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [SelfTestService] Initializing optimized РАДУЖНЫЙ МОСТ...');

    // Initialize cache
    this.testCache = cachedProviderFactory.getProvider(
      'selftest-results',
      {
        ttl: 5 * 60 * 1000, // 5 minutes cache
        maxSize: 100,
      }
    );

    // Get Telegram client
    this.telegramClient = runtime.clients?.find(
      (client: any) => client.constructor.name === 'TelegramClientInterface'
    );

    if (!this.telegramClient) {
      elizaLogger.warn(
        '[SelfTestService] ⚠️ Telegram client not found, self-testing disabled'
      );
      return;
    }

    elizaLogger.success(
      '🌈 [SelfTestService] Optimized РАДУЖНЫЙ МОСТ initialized! Ready for parallel self-testing.'
    );
  }

  /**
   * Устанавливает chat_id для самотестирования
   */
  setTestChatId(chatId: string): void {
    this.testChatId = chatId;
    elizaLogger.info(
      `🌈 [SelfTestService] Test chat_id set to: ${chatId}`
    );
  }

  /**
   * Запускает автоматический тест команды /train start - OPTIMIZED
   */
  async testTrainStart(runtime: IAgentRuntime): Promise<SelfTestResult> {
    return performanceMonitor.measure('test_train_start', async () => {
      elizaLogger.info('🧪 [SelfTestService] Running test: /train start');

      // Check cache first
      const cacheKey = { testName: 'train_start', chatId: this.testChatId };

      return this.testCache!.get(cacheKey, async () => {
        if (!this.testChatId) {
          return {
            testName: '/train start',
            passed: false,
            message: 'Test chat_id not set',
            timestamp: Date.now(),
          };
        }

        try {
          if (!this.telegramClient) {
            throw new Error('Telegram client not found');
          }

          // Send command to bot
          await this.telegramClient.sendMessage(
            this.testChatId,
            '/train start TestModel test_trigger'
          );

          elizaLogger.info('📤 [SelfTestService] Sent: /train start');

          // Wait for processing with timeout
          await this.waitForProcessing(3000);

          // Check if session was created
          const photoCollectorService = runtime.getService(
            'photoCollector'
          ) as any;

          if (photoCollectorService) {
            const session = photoCollectorService.getSession?.(this.testChatId);

            if (session) {
              const result: SelfTestResult = {
                testName: '/train start',
                passed: true,
                message: `✅ Session created: ${session.modelName}`,
                timestamp: Date.now(),
              };

              this.testResults.push(result);
              elizaLogger.success(
                '✅ [SelfTestService] TEST PASSED: /train start'
              );

              return result;
            }
          }

          const result: SelfTestResult = {
            testName: '/train start',
            passed: false,
            message: 'Session not created',
            timestamp: Date.now(),
          };

          this.testResults.push(result);
          elizaLogger.error('❌ [SelfTestService] TEST FAILED: /train start');

          return result;
        } catch (error: any) {
          const result: SelfTestResult = {
            testName: '/train start',
            passed: false,
            message: `Error: ${error.message}`,
            timestamp: Date.now(),
          };

          this.testResults.push(result);
          elizaLogger.error(
            '❌ [SelfTestService] TEST ERROR:',
            error
          );

          return result;
        }
      });
    });
  }

  /**
   * Wait for processing with smart polling
   */
  private async waitForProcessing(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 500;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Запускает полный набор тестов - OPTIMIZED с параллельным выполнением
   */
  async runAllTests(runtime: IAgentRuntime): Promise<SelfTestResult[]> {
    elizaLogger.info('🌈 [SelfTestService] Running optimized test suite in parallel...');

    const results: SelfTestResult[] = [];

    // Define all tests
    const tests = [
      () => this.testTrainStart(runtime),
      // Add more tests here as needed
      // () => this.testCommand1(runtime),
      // () => this.testCommand2(runtime),
    ];

    // Run tests in parallel for better performance
    const testResults = await Promise.all(
      tests.map(test => test())
    );

    results.push(...testResults);

    // Summarize results
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
   * Получить результаты всех тестов
   */
  getTestResults(): SelfTestResult[] {
    return this.testResults;
  }

  /**
   * Очистить результаты тестов
   */
  clearTestResults(): void {
    this.testResults = [];
    elizaLogger.info('[SelfTestService] Test results cleared');
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      cache: this.testCache?.getStats(),
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      metrics: performanceMonitor.getAllMetrics(),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.testCache?.clear();
    elizaLogger.info('[SelfTestService] Cache cleared');
  }
}

// Экспортируем singleton
export const selfTestService = new SelfTestService();
