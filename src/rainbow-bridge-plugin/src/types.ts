/**
 * Rainbow Bridge Plugin Types
 */

export interface RainbowBridgeConfig {
  botUsername: string;
  apiId: number;
  apiHash: string;
  sessionString: string;
  enabled?: boolean;
  autoRun?: boolean;
}

export interface TestScenario {
  id: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  steps: TestStep[];
  expected: string;
}

export interface TestStep {
  action: 'send_message' | 'send_photo' | 'click_button' | 'verify';
  data: string;
  expected?: string;
}

export interface TestResult {
  id: string;
  status: 'passed' | 'failed' | 'skipped';
  description: string;
  expected: string;
  actual: string;
  error?: string;
  duration: number;
}

export interface TestReport {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  results: TestResult[];
}

export interface TelegramMessage {
  id: number;
  text: string;
  from: {
    id: number;
    firstName: string;
    username?: string;
  };
  date: Date;
  isOutgoing: boolean;
}
