/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Test Plugin
 *
 * Модульный и масштабируемый плагин для автоматического самотестирования бота.
 *
 * ## Архитектура:
 *
 * - **BaseTest**: Абстрактный класс для создания новых тестов
 * - **TestManager**: Управление набором тестов
 * - **SelfTestService**: Сервис для оркестрации тестирования
 * - **selfTestAction**: Action для запуска через /selftest
 *
 * ## Использование:
 *
 * ```typescript
 * // В character.ts:
 * import { selftestPlugin } from './selftest';
 *
 * export const character = {
 *   // ...
 *   plugins: [selftestPlugin],
 * };
 * ```
 *
 * ## Добавление новых тестов:
 *
 * 1. Создайте файл в `tests/` наследуясь от `BaseTest`
 * 2. Зарегистрируйте в `SelfTestService.registerTests()`
 * 3. Готово! Тест автоматически появится в `/selftest`
 *
 * ## Пример нового теста:
 *
 * ```typescript
 * export class MyNewTest extends BaseTest {
 *   id = 'my-test';
 *   name = 'My Test Name';
 *   description = 'What this test does';
 *
 *   protected async run(runtime, chatId) {
 *     // Ваш код тестирования
 *     return this.success('Test passed!');
 *   }
 * }
 * ```
 */

import { Plugin, elizaLogger } from '@elizaos/core';
import { SelfTestService } from './services/self-test-service';
import { selfTestAction } from './actions/selftest-action';

// Экспортируем публичные типы для расширения
export { BaseTest } from './base-test';
export type { TestResult, TestConfig } from './base-test';
export { TestManager } from './test-manager';
export { SelfTestService } from './services/self-test-service';

/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Test Plugin
 */
export const selftestPlugin: Plugin = {
  name: 'selftest',
  description: '🌈 РАДУЖНЫЙ МОСТ - Automatic self-testing system',

  services: [SelfTestService],

  actions: [selfTestAction],
};

elizaLogger.info('🌈 [SELFTEST PLUGIN] Module loaded - plugin exported');
elizaLogger.info('🌈 [SELFTEST PLUGIN] Plugin name:', selftestPlugin.name);
elizaLogger.info(
  '🌈 [SELFTEST PLUGIN] Features: Modular test system, automatic self-testing'
);

export default selftestPlugin;
