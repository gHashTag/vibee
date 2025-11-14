/**
 * 🌈 РАДУЖНЫЙ МОСТ - Менеджер тестов
 *
 * Управляет набором тестов и их выполнением.
 */

import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseTest, TestResult } from './base-test';

export class TestManager {
  private tests: Map<string, BaseTest> = new Map();

  /**
   * Регистрировать тест
   */
  registerTest(test: BaseTest): void {
    if (this.tests.has(test.id)) {
      elizaLogger.warn(
        `[TestManager] Test ${test.id} already registered, overwriting`
      );
    }

    this.tests.set(test.id, test);
    elizaLogger.info(
      `[TestManager] Registered test: ${test.id} - ${test.name}`
    );
  }

  /**
   * Получить тест по ID
   */
  getTest(testId: string): BaseTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Получить все тесты
   */
  getAllTests(): BaseTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Запустить все тесты
   */
  async runAll(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<TestResult[]> {
    elizaLogger.info('[TestManager] Running all tests...');

    const results: TestResult[] = [];
    const tests = this.getAllTests();

    for (const test of tests) {
      const result = await test.execute(runtime, chatId);
      results.push(result);

      // Останавливаемся, если тест провален и установлен skipOnFailure
      if (!result.passed && test['config']?.skipOnFailure) {
        elizaLogger.warn(
          `[TestManager] Stopping execution after failed test: ${test.id}`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Запустить конкретный тест
   */
  async runTest(
    testId: string,
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<TestResult | null> {
    const test = this.getTest(testId);

    if (!test) {
      elizaLogger.error(`[TestManager] Test not found: ${testId}`);
      return null;
    }

    return await test.execute(runtime, chatId);
  }

  /**
   * Получить статистику тестов
   */
  getStats(): { total: number; tests: Array<{ id: string; name: string; description: string }> } {
    const tests = this.getAllTests();

    return {
      total: tests.length,
      tests: tests.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
      })),
    };
  }
}
