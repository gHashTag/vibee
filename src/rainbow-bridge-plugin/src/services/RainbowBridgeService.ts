/**
 * Rainbow Bridge Service
 * Main service for autonomous E2E testing
 */

import { Service, IAgentRuntime, elizaLogger } from '@elizaos/core';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { RainbowBridgeConfig, TestScenario, TestResult, TestReport } from '../types';

const execAsync = promisify(exec);

export class RainbowBridgeService extends Service {
  static serviceType = 'rainbow-bridge';

  private config: RainbowBridgeConfig | null = null;
  private pythonScriptPath: string;

  constructor(runtime?: IAgentRuntime) {
    super(runtime);
    // Assuming scripts are in project root
    this.pythonScriptPath = 'scripts/autonomous-telegram-bot.py';
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('🌈 [RainbowBridge] Initializing...');

    // Load configuration from environment
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionString = process.env.TELEGRAM_SESSION_STRING;
    const botUsername = process.env.RAINBOW_BRIDGE_BOT_USERNAME;
    const enabled = process.env.RAINBOW_BRIDGE_ENABLED !== 'false';
    const autoRun = process.env.RAINBOW_BRIDGE_AUTO_RUN === 'true';

    if (!apiId || !apiHash) {
      elizaLogger.warn('[RainbowBridge] ⚠️ TELEGRAM_API_ID or TELEGRAM_API_HASH not set');
      elizaLogger.warn('[RainbowBridge] Plugin will not be functional');
      return;
    }

    if (!sessionString) {
      elizaLogger.warn('[RainbowBridge] ⚠️ TELEGRAM_SESSION_STRING not set');
      elizaLogger.warn('[RainbowBridge] Run: python3 scripts/autonomous-telegram-auth.py');
      return;
    }

    if (!botUsername) {
      elizaLogger.warn('[RainbowBridge] ⚠️ RAINBOW_BRIDGE_BOT_USERNAME not set');
      elizaLogger.warn('[RainbowBridge] Will use default bot for testing');
    }

    this.config = {
      apiId: parseInt(apiId),
      apiHash,
      sessionString,
      botUsername: botUsername || 'agent_vibecoder_bot',
      enabled,
      autoRun,
    };

    // Validate session
    const isValid = await this.validateSession();

    if (isValid) {
      elizaLogger.success('🌈 [RainbowBridge] Session validated!');
      elizaLogger.success('🌈 [RainbowBridge] Ready for autonomous E2E testing!');

      // Auto-run tests if configured
      if (autoRun) {
        elizaLogger.info('[RainbowBridge] Auto-running E2E tests...');
        setTimeout(() => this.runQuickTest(runtime), 5000);
      }
    } else {
      elizaLogger.error('[RainbowBridge] ❌ Session validation failed');
    }
  }

  static async start(runtime: IAgentRuntime): Promise<RainbowBridgeService> {
    const service = new RainbowBridgeService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    elizaLogger.info('[RainbowBridge] Stopping...');
    this.config = null;
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }

  /**
   * Validate Telegram session
   */
  private async validateSession(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `python3 ${this.pythonScriptPath} validate-session`,
        { timeout: 10000 }
      );

      return stdout.includes('Session validated') || stdout.includes('готов к автономной работе');
    } catch (error) {
      elizaLogger.error('[RainbowBridge] Session validation error:', error);
      return false;
    }
  }

  /**
   * Send message to bot and get response
   */
  async sendMessage(message: string): Promise<{ success: boolean; response: string }> {
    if (!this.config) {
      return { success: false, response: 'Service not initialized' };
    }

    try {
      const command = `python3 ${this.pythonScriptPath} send-message "${this.config.botUsername}" "${message}"`;

      const { stdout, stderr } = await execAsync(command, { timeout: 15000 });

      if (stderr && stderr.includes('Error')) {
        return { success: false, response: stderr };
      }

      // Extract response from output
      const response = this.parseMessageFromOutput(stdout);

      return { success: true, response };
    } catch (error: any) {
      elizaLogger.error('[RainbowBridge] Send message error:', error.message);
      return { success: false, response: error.message };
    }
  }

  /**
   * Run E2E test scenario
   */
  async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();

    try {
      let actualResponse = '';

      for (const step of scenario.steps) {
        if (step.action === 'send_message') {
          const result = await this.sendMessage(step.data);
          actualResponse += result.response + '\n';

          // Wait for bot processing
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        // Add more step types as needed
      }

      // Verify result
      const passed = actualResponse.toLowerCase().includes(scenario.expected.toLowerCase());

      return {
        id: scenario.id,
        status: passed ? 'passed' : 'failed',
        description: scenario.description,
        expected: scenario.expected,
        actual: actualResponse,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        id: scenario.id,
        status: 'failed',
        description: scenario.description,
        expected: scenario.expected,
        actual: '',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run full E2E test suite
   */
  async runTestSuite(scenarios: TestScenario[]): Promise<TestReport> {
    const sessionId = `rb-${Date.now()}`;
    const startTime = new Date();

    elizaLogger.info(`[RainbowBridge] Running ${scenarios.length} test scenarios...`);

    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      elizaLogger.info(`[RainbowBridge] 🧪 Running: ${scenario.id} - ${scenario.description}`);
      const result = await this.runTestScenario(scenario);
      results.push(result);

      elizaLogger.info(
        `[RainbowBridge] ${result.status === 'passed' ? '✅' : '❌'} ${scenario.id}: ${result.status}`
      );
    }

    const endTime = new Date();
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const report: TestReport = {
      sessionId,
      startTime,
      endTime,
      total: results.length,
      passed,
      failed,
      skipped,
      passRate: (passed / results.length) * 100,
      results,
    };

    elizaLogger.info(`[RainbowBridge] 📊 Test Report: ${passed}/${results.length} passed (${report.passRate.toFixed(1)}%)`);

    return report;
  }

  /**
   * Quick smoke test
   */
  async runQuickTest(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info('[RainbowBridge] Running quick smoke test...');

    const scenarios: TestScenario[] = [
      {
        id: 'SMOKE_001',
        description: 'Bot responds to help command',
        priority: 'critical',
        steps: [{ action: 'send_message', data: '/help' }],
        expected: 'help',
      },
    ];

    const report = await this.runTestSuite(scenarios);

    if (report.passRate === 100) {
      elizaLogger.success('🌈 [RainbowBridge] ✅ Quick test passed!');
    } else {
      elizaLogger.error('[RainbowBridge] ❌ Quick test failed!');
    }
  }

  /**
   * Parse message from Python script output
   */
  private parseMessageFromOutput(output: string): string {
    if (output.includes('📨 ОТВЕТ БОТА:')) {
      const start = output.indexOf('📨 ОТВЕТ БОТА:');
      const end = output.indexOf('=' . repeat(60), start + 20);
      if (end !== -1) {
        return output.substring(start, end).replace('📨 ОТВЕТ БОТА:', '').replace(/={60}/g, '').trim();
      }
    }
    return output;
  }

  /**
   * Get service status
   */
  getStatus(): {
    enabled: boolean;
    configured: boolean;
    botUsername: string;
  } {
    return {
      enabled: this.config?.enabled ?? false,
      configured: !!this.config,
      botUsername: this.config?.botUsername ?? 'not-configured',
    };
  }
}
