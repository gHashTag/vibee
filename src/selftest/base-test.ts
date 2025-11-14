/**
 * 🌈 РАДУЖНЫЙ МОСТ - Базовый класс для тестов
 *
 * Абстрактный класс для создания модульных тестов.
 * Каждый тест наследуется от этого класса.
 */

import { IAgentRuntime, elizaLogger } from '@elizaos/core';

export type TestResult = {
  testName: string;
  testId: string;
  passed: boolean;
  message: string;
  timestamp: number;
  duration: number; // ms
  details?: Record<string, any>;
};

export type TestConfig = {
  timeout?: number; // ms
  retries?: number;
  skipOnFailure?: boolean;
};

/**
 * Абстрактный базовый класс для всех тестов
 */
export abstract class BaseTest {
  abstract id: string;
  abstract name: string;
  abstract description: string;

  protected config: TestConfig = {
    timeout: 10000,
    retries: 0,
    skipOnFailure: false,
  };

  /**
   * Выполнить тест
   */
  async execute(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    elizaLogger.info(`🧪 [${this.id}] Starting test: ${this.name}`);

    try {
      // Выполняем тест с timeout
      const result = await this.runWithTimeout(runtime, chatId);

      const duration = Date.now() - startTime;

      if (result.passed) {
        elizaLogger.success(
          `✅ [${this.id}] PASSED (${duration}ms): ${result.message}`
        );
      } else {
        elizaLogger.error(
          `❌ [${this.id}] FAILED (${duration}ms): ${result.message}`
        );
      }

      return {
        ...result,
        testId: this.id,
        testName: this.name,
        timestamp: startTime,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      elizaLogger.error(`❌ [${this.id}] ERROR (${duration}ms):`, error);

      return {
        testId: this.id,
        testName: this.name,
        passed: false,
        message: `Error: ${error.message}`,
        timestamp: startTime,
        duration,
        details: { error: error.stack },
      };
    }
  }

  /**
   * Запустить тест с timeout
   */
  private async runWithTimeout(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'>> {
    const timeout = this.config.timeout || 10000;

    return Promise.race([
      this.run(runtime, chatId),
      new Promise<any>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Test timeout after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Абстрактный метод для выполнения теста
   * Должен быть реализован в дочерних классах
   */
  protected abstract run(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'>>;

  /**
   * Вспомогательный метод для успешного результата
   */
  protected success(message: string, details?: Record<string, any>): Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'> {
    return {
      passed: true,
      message,
      details,
    };
  }

  /**
   * Вспомогательный метод для неуспешного результата
   */
  protected failure(message: string, details?: Record<string, any>): Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'> {
    return {
      passed: false,
      message,
      details,
    };
  }
}
