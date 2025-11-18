/**
 * Agent SDK Unit Tests
 *
 * Tests for Agent SDK best practices implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AgentPipeline,
  createPipeline,
  SandboxManager,
  createSandbox,
  SubagentManager,
  createSubagentManager,
  ContextCompactor,
  createCompactor,
  Verifier,
  createVerifier,
  verify,
  BUILT_IN_RULES,
  CODE_RULES,
  createPipelineTester,
  createExampleTestCases,
  CLOUD_PRESET,
} from '../../src/agent-sdk';

// Mock runtime
const mockRuntime = {
  getService: vi.fn(),
  agentId: 'test-agent',
  character: { name: 'TestAgent' },
} as any;

describe('Agent SDK', () => {
  describe('AgentPipeline', () => {
    it('should create pipeline with default config', () => {
      const pipeline = createPipeline();
      expect(pipeline).toBeInstanceOf(AgentPipeline);
    });

    it('should create pipeline with custom config', () => {
      const pipeline = createPipeline({
        maxIterations: 10,
        verificationThreshold: 90,
      });
      expect(pipeline).toBeInstanceOf(AgentPipeline);
    });

    it('should execute pipeline with handlers', async () => {
      const pipeline = createPipeline({ maxIterations: 1 });

      const result = await pipeline.execute(
        mockRuntime,
        {} as any,
        {} as any,
        async () => ({ gathered: true }),
        async (ctx, input) => ({ action: 'done', input }),
        async () => ({ passed: true, score: 100, feedback: [], suggestions: [] })
      );

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1);
    });

    it('should retry on verification failure', async () => {
      const pipeline = createPipeline({ maxIterations: 3, verificationThreshold: 80 });
      let attempts = 0;

      const result = await pipeline.execute(
        mockRuntime,
        {} as any,
        {} as any,
        async () => ({ gathered: true }),
        async () => ({ action: 'done' }),
        async () => {
          attempts++;
          // Pass on third attempt
          const passed = attempts >= 3;
          return {
            passed,
            score: passed ? 100 : 50,
            feedback: passed ? [] : ['Not good enough'],
            suggestions: [],
          };
        }
      );

      expect(attempts).toBeGreaterThan(1);
    });
  });

  describe('SandboxManager', () => {
    let sandbox: SandboxManager;

    beforeEach(() => {
      sandbox = createSandbox();
    });

    it('should create sandbox with default config', () => {
      expect(sandbox).toBeInstanceOf(SandboxManager);
    });

    it('should allow access to working directory', () => {
      const allowed = sandbox.validateFilesystemAccess(process.cwd());
      expect(allowed).toBe(true);
    });

    it('should allow access to /tmp', () => {
      const allowed = sandbox.validateFilesystemAccess('/tmp/test.txt');
      expect(allowed).toBe(true);
    });

    it('should block access to blocked paths', () => {
      const allowed = sandbox.validateFilesystemAccess('/etc/passwd');
      expect(allowed).toBe(false);
    });

    it('should validate allowed network domains', () => {
      expect(sandbox.validateNetworkAccess('https://api.openai.com/v1/chat')).toBe(true);
      expect(sandbox.validateNetworkAccess('https://api.anthropic.com/v1')).toBe(true);
      expect(sandbox.validateNetworkAccess('https://github.com')).toBe(true);
    });

    it('should block unknown network domains', () => {
      const allowed = sandbox.validateNetworkAccess('https://malicious.com/hack');
      expect(allowed).toBe(false);
    });

    it('should allow localhost when configured', () => {
      expect(sandbox.validateNetworkAccess('http://localhost:3000')).toBe(true);
      expect(sandbox.validateNetworkAccess('http://127.0.0.1:8080')).toBe(true);
    });

    it('should validate git operations', () => {
      expect(sandbox.validateGitOperation('push', 'main')).toBe(true);
      expect(sandbox.validateGitOperation('push', 'feature/test')).toBe(true);
      expect(sandbox.validateGitOperation('push', 'claude/test-branch')).toBe(true);
    });

    it('should block force push by default', () => {
      const allowed = sandbox.validateGitOperation('push --force', 'main');
      expect(allowed).toBe(false);
    });

    it('should create sandbox environment', async () => {
      const env = await sandbox.createEnvironment('test-env');
      expect(env.id).toBe('test-env');
      expect(env.status).toBe('active');
    });

    it('should execute commands in sandbox', async () => {
      const result = await sandbox.executeCommand('echo "hello"');
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('hello');
    });

    it('should block dangerous commands', async () => {
      const result = await sandbox.executeCommand('rm -rf /');
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('blocked');
    });
  });

  describe('SubagentManager', () => {
    let manager: SubagentManager;

    beforeEach(() => {
      manager = createSubagentManager();
      manager.setRuntime(mockRuntime);
    });

    it('should create subagent manager with default subagents', () => {
      const subagents = manager.getAvailableSubagents();
      expect(subagents.length).toBeGreaterThan(0);
    });

    it('should create task for subagent', () => {
      const task = manager.createTask('code-searcher', 'Find all TODO comments');
      expect(task).not.toBeNull();
      expect(task?.subagentId).toBe('code-searcher');
    });

    it('should return null for unknown subagent', () => {
      const task = manager.createTask('unknown-agent', 'Some task');
      expect(task).toBeNull();
    });

    it('should execute single task', async () => {
      const task = manager.createTask('code-searcher', 'Find patterns');
      expect(task).not.toBeNull();

      const result = await manager.executeTask(task!);
      expect(result.taskId).toBe(task!.id);
      expect(result.success).toBe(true);
    });

    it('should execute parallel tasks', async () => {
      const tasks = [
        manager.createTask('code-searcher', 'Task 1'),
        manager.createTask('file-processor', 'Task 2'),
        manager.createTask('data-analyzer', 'Task 3'),
      ].filter((t) => t !== null);

      const result = await manager.executeParallel(tasks as any[]);
      expect(result.results.length).toBe(3);
      expect(result.successRate).toBe(100);
    });

    it('should register custom subagent', () => {
      manager.registerSubagent({
        id: 'custom-agent',
        name: 'Custom Agent',
        specialty: 'Custom tasks',
        tools: [],
        maxContextTokens: 50000,
      });

      const subagents = manager.getAvailableSubagents();
      const custom = subagents.find((s) => s.id === 'custom-agent');
      expect(custom).toBeDefined();
    });
  });

  describe('ContextCompactor', () => {
    let compactor: ContextCompactor;

    beforeEach(() => {
      compactor = createCompactor();
    });

    it('should create compactor with default config', () => {
      expect(compactor).toBeInstanceOf(ContextCompactor);
    });

    it('should not compact when below threshold', () => {
      const messages = ['Short message 1', 'Short message 2'];
      expect(compactor.needsCompaction(messages.join(' '))).toBe(false);
    });

    it('should compact long conversations', async () => {
      // Create messages that exceed threshold
      const messages = Array(1000).fill('This is a test message that adds tokens to the context window for testing compaction functionality.');

      const result = await compactor.compact(messages, mockRuntime);
      expect(result.reduction).toBeGreaterThan(0);
      expect(result.compactedTokens).toBeLessThan(result.originalTokens);
    });

    it('should preserve recent messages', async () => {
      const messages = [
        ...Array(100).fill('Old message'),
        'Recent message 1',
        'Recent message 2',
      ];

      const result = await compactor.compact(messages, mockRuntime);
      expect(result.preservedMessages).toBeGreaterThan(0);
    });
  });

  describe('Verifier', () => {
    let verifier: Verifier;

    beforeEach(() => {
      verifier = createVerifier();
    });

    it('should create verifier', () => {
      expect(verifier).toBeInstanceOf(Verifier);
    });

    it('should pass verification for valid output', async () => {
      const result = await verifier.verify('Valid output', {
        strategy: 'rules',
        rules: { rules: BUILT_IN_RULES, strictMode: false },
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should fail verification for empty output', async () => {
      const result = await verifier.verify('', {
        strategy: 'rules',
        rules: { rules: BUILT_IN_RULES, strictMode: false },
      });

      expect(result.passed).toBe(false);
    });

    it('should detect errors in output', async () => {
      const result = await verifier.verify('This contains an error message', {
        strategy: 'rules',
        rules: { rules: BUILT_IN_RULES, strictMode: false },
      });

      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should use quick verification helpers', async () => {
      expect(await verify.isValid('Valid content')).toBe(true);
      expect(await verify.isValid('')).toBe(false);
    });

    it('should verify code with code rules', async () => {
      const code = `
        function test() {
          const apiKey = "sk-12345";
          console.log(apiKey);
        }
      `;

      const result = await verify.code(code);
      // Should have warnings for console.log and hardcoded secrets
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  describe('PipelineTester', () => {
    it('should create pipeline tester', () => {
      const tester = createPipelineTester();
      expect(tester).toBeDefined();
    });

    it('should create example test cases', () => {
      const testCases = createExampleTestCases();
      expect(testCases.length).toBeGreaterThan(0);
    });

    it('should run single test', async () => {
      const tester = createPipelineTester();
      const testCases = createExampleTestCases();

      const result = await tester.runTest(testCases[0], mockRuntime);
      expect(result.testCaseId).toBe(testCases[0].id);
    });

    it('should run test suite', async () => {
      const tester = createPipelineTester({ parallelTests: 2 });
      const testCases = createExampleTestCases().slice(0, 2);

      const report = await tester.runSuite(
        {
          id: 'test-suite',
          name: 'Test Suite',
          description: 'Test suite for testing',
          testCases,
        },
        mockRuntime
      );

      expect(report.totalTests).toBe(2);
      expect(report.results.length).toBe(2);
    });
  });

  describe('CLOUD_PRESET', () => {
    it('should have valid pipeline config', () => {
      expect(CLOUD_PRESET.pipeline.maxIterations).toBeGreaterThan(0);
      expect(CLOUD_PRESET.pipeline.verificationThreshold).toBeGreaterThanOrEqual(0);
      expect(CLOUD_PRESET.pipeline.verificationThreshold).toBeLessThanOrEqual(100);
    });

    it('should have valid sandbox config', () => {
      expect(CLOUD_PRESET.sandbox.enabled).toBe(true);
      expect(CLOUD_PRESET.sandbox.filesystem.allowedPaths.length).toBeGreaterThan(0);
      expect(CLOUD_PRESET.sandbox.network.allowedDomains.length).toBeGreaterThan(0);
    });

    it('should include essential domains', () => {
      const domains = CLOUD_PRESET.sandbox.network.allowedDomains;
      expect(domains).toContain('api.openai.com');
      expect(domains).toContain('api.anthropic.com');
      expect(domains).toContain('github.com');
    });
  });
});
