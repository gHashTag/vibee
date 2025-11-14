/**
 * 🌈 РАДУЖНЫЙ МОСТ - Self-Test Action
 *
 * Action для запуска автоматического самотестирования бота.
 * Использование: /selftest
 */

import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  elizaLogger,
} from '@elizaos/core';
import { selfTestService, SelfTestResult } from '../services/self-test';

export const selfTestAction: Action = {
  name: 'SELF_TEST',
  similes: ['SELF_TEST', 'RUN_TESTS', 'TEST_BOT', 'RAINBOW_BRIDGE'],
  description: '🌈 Запускает автоматическое самотестирование бота (РАДУЖНЫЙ МОСТ)',

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || '';

    // Триггерится на /selftest или упоминания тестирования
    return (
      text.includes('/selftest') ||
      text.includes('самотест') ||
      text.includes('тестируй себя') ||
      text.includes('радужный мост')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    elizaLogger.info('🌈 [SELF_TEST] Starting self-test...');

    try {
      // Устанавливаем chat_id для тестирования
      const chatId = message.userId || message.roomId;

      if (!chatId) {
        await callback({
          text: '❌ Не могу определить chat_id для тестирования',
        });

        return {
          success: false,
          text: 'Chat ID not found',
        };
      }

      // Устанавливаем test chat_id
      selfTestService.setTestChatId(chatId);

      // Отправляем сообщение о начале тестов
      await callback({
        text: '🌈 **РАДУЖНЫЙ МОСТ - Автоматическое самотестирование**\n\n' +
              'Запускаю тесты...\n' +
              '⏳ Это займёт несколько секунд...',
      });

      // Запускаем все тесты
      const results: SelfTestResult[] = await selfTestService.runAllTests(runtime);

      // Формируем отчёт
      let report = '📊 **Результаты самотестирования:**\n\n';

      results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        report += `${index + 1}. ${icon} **${result.testName}**\n`;
        report += `   ${result.message}\n`;
        report += `   _${new Date(result.timestamp).toLocaleString()}_\n\n`;
      });

      const passed = results.filter((r) => r.passed).length;
      const total = results.length;

      report += '\n---\n';
      report += `**Итого:** ${passed}/${total} тестов пройдено\n`;

      if (passed === total) {
        report += '\n🎉 **ВСЕ ТЕСТЫ ПРОЙДЕНЫ!**\n';
        report += '🌈 **РАДУЖНЫЙ МОСТ РАБОТАЕТ!**';
      } else {
        report += `\n⚠️ **${total - passed} тест(ов) провалено**`;
      }

      // Отправляем отчёт
      await callback({
        text: report,
      });

      elizaLogger.success('🌈 [SELF_TEST] Self-test complete!');

      return {
        success: true,
        text: report,
        values: {
          results,
          passed,
          total,
        },
      };
    } catch (error: any) {
      elizaLogger.error('❌ [SELF_TEST] Error:', error);

      await callback({
        text: `❌ Ошибка при самотестировании: ${error.message}`,
      });

      return {
        success: false,
        text: `Error: ${error.message}`,
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/selftest' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '🌈 РАДУЖНЫЙ МОСТ - Автоматическое самотестирование\n\nЗапускаю тесты...',
          action: 'SELF_TEST',
        },
      },
      {
        user: '{{agent}}',
        content: {
          text: '📊 Результаты самотестирования:\n\n✅ /train start - Session created\n\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!\n🌈 РАДУЖНЫЙ МОСТ РАБОТАЕТ!',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Тестируй себя' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '🌈 Запускаю автоматическое самотестирование...',
          action: 'SELF_TEST',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Радужный мост работает?' },
      },
      {
        user: '{{agent}}',
        content: {
          text: '🌈 Сейчас проверю! Запускаю самотестирование...',
          action: 'SELF_TEST',
        },
      },
    ],
  ],
};
