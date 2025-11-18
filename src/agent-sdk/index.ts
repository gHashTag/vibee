/**
 * Agent SDK - Best Practices Implementation
 *
 * Based on Anthropic's engineering guides:
 * - https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 * - https://www.anthropic.com/engineering/claude-code-sandboxing
 *
 * This module provides:
 * - Agent Pipeline (Gather → Action → Verify loop)
 * - Sandbox Configuration (filesystem + network isolation)
 * - Subagent System (parallel execution)
 * - Context Compaction (long-running sessions)
 * - Verification System (rules, visual, LLM-as-Judge)
 * - Pipeline Testing (isolated environments)
 */

// Core exports
export {
  AgentPipeline,
  createPipeline,
  executePipeline,
} from './core/pipeline';

export {
  SandboxManager,
  createSandbox,
  sandboxValidators,
  DEFAULT_SANDBOX_CONFIG,
} from './core/sandbox';

export {
  SubagentManager,
  createSubagentManager,
  executeParallelTasks,
  DEFAULT_SUBAGENTS,
} from './core/subagents';

export {
  ContextCompactor,
  createCompactor,
  compactContext,
} from './core/compaction';

export {
  Verifier,
  createVerifier,
  verify,
  BUILT_IN_RULES,
  CODE_RULES,
} from './core/verification';

// Testing exports
export {
  PipelineTester,
  createPipelineTester,
  runPipelineTests,
  createExampleTestCases,
} from './testing/pipeline-tester';

// Type exports
export type {
  // Pipeline types
  PipelinePhase,
  PipelineStatus,
  PipelineConfig,
  PipelineStepResult,
  PipelineExecutionResult,
  VerificationResult,

  // Tool types
  ToolContext,
  ToolResult,
  ToolDefinition,
  ParameterDefinition,

  // Sandbox types
  SandboxConfig,
  SandboxEnvironment,
  SandboxMetrics,

  // Subagent types
  SubagentDefinition,
  SubagentTask,
  SubagentResult,
  OrchestrationResult,

  // Compaction types
  CompactionConfig,
  CompactionResult,

  // Verification types
  VerificationStrategy,
  RulesVerificationConfig,
  VerificationRule,
  VisualVerificationConfig,
  LLMJudgeConfig,

  // Testing types
  PipelineTestCase,
  PipelineTestSuite,
  TestResult,
  TestSuiteReport,

  // Cloud types
  CloudConfig,
  DeploymentConfig,
} from './types';

/**
 * Default configuration preset for cloud development
 */
export const CLOUD_PRESET = {
  pipeline: {
    maxIterations: 5,
    maxRetries: 3,
    timeoutMs: 300000,
    verificationThreshold: 80,
    enableCompaction: true,
    compactionThreshold: 100000,
  },
  sandbox: {
    enabled: true,
    filesystem: {
      allowedPaths: [process.cwd(), '/tmp'],
      blockedPaths: ['~/.ssh', '~/.gnupg', '~/.aws'],
      workingDirectory: process.cwd(),
      readOnly: false,
    },
    network: {
      allowedDomains: [
        'api.openai.com',
        'api.anthropic.com',
        'api.telegram.org',
        'github.com',
      ],
      blockedDomains: [],
      allowLocalhost: true,
    },
    resources: {
      maxMemoryMb: 4096,
      maxCpuPercent: 80,
      maxDiskMb: 10240,
      timeoutMs: 600000,
    },
    git: {
      allowedBranches: ['main', 'develop', 'feature/*', 'claude/*'],
      blockedBranches: [],
      allowForcePush: false,
      signCommits: false,
    },
  },
};

/**
 * Quick start helper for setting up Agent SDK
 */
export function quickStart() {
  return {
    pipeline: createPipeline(CLOUD_PRESET.pipeline),
    sandbox: createSandbox(CLOUD_PRESET.sandbox),
    subagents: createSubagentManager(),
    verifier: createVerifier(),
    tester: createPipelineTester({
      sandbox: CLOUD_PRESET.sandbox,
      pipeline: CLOUD_PRESET.pipeline,
    }),
  };
}
