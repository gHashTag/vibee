import { Action, IAgentRuntime, Memory, HandlerCallback, elizaLogger } from '@elizaos/core';
import { RainbowBridgeService } from '../services/RainbowBridgeService';
import type { TestScenario } from '../types';

export const runE2ETestAction: Action = {
  name: 'RUN_E2E_TEST',
  similes: ['RUN_RAINBOW_BRIDGE_TEST', 'TEST_BOT_E2E', 'AUTONOMOUS_TEST'],
  description: 'Run autonomous E2E test via Rainbow Bridge',

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes('run e2e') || text.includes('run test') || text.includes('rainbow bridge test');
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state, options, callback?: HandlerCallback) => {
    try {
      const service = runtime.getService('rainbow-bridge') as RainbowBridgeService;
      if (!service) {
        await callback?.({ text: '❌ Rainbow Bridge service not available' });
        return { success: false, error: 'Service not found' };
      }

      await callback?.({ text: '🌈 Starting E2E tests...' });

      // Define test scenarios (customize based on your bot)
      const scenarios: TestScenario[] = [
        {
          id: 'TEST_001',
          description: 'Bot responds to /help',
          priority: 'critical',
          steps: [{ action: 'send_message', data: '/help' }],
          expected: 'help',
        },
      ];

      const report = await service.runTestSuite(scenarios);

      const resultText = `
🌈 **Rainbow Bridge Test Report**

📊 **Results:**
- Total: ${report.total}
- ✅ Passed: ${report.passed}
- ❌ Failed: ${report.failed}
- 📈 Pass Rate: ${report.passRate.toFixed(1)}%

⏱️ Duration: ${((report.endTime.getTime() - report.startTime.getTime()) / 1000).toFixed(1)}s
`;

      await callback?.({ text: resultText });

      return { success: report.passRate > 80, data: report };
    } catch (error: any) {
      elizaLogger.error('[RunE2ETestAction] Error:', error);
      await callback?.({ text: `❌ Error: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  examples: [[
    { user: 'user', content: { text: 'Run E2E tests' } },
    { user: 'agent', content: { text: '🌈 Starting E2E tests...', action: 'RUN_E2E_TEST' } },
  ]],
};
