/**
 * Agent SDK Types
 *
 * Based on Anthropic's best practices for building agents with Claude Agent SDK
 * @see https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 */

import type { IAgentRuntime, Memory, State } from '@elizaos/core';

// ============================================================================
// Pipeline Types
// ============================================================================

/**
 * Pipeline execution phases following Gather → Action → Verify pattern
 */
export type PipelinePhase = 'gather' | 'action' | 'verify';

/**
 * Pipeline execution status
 */
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

/**
 * Verification result from rules, visual, or LLM-as-Judge
 */
export interface VerificationResult {
  passed: boolean;
  score: number; // 0-100
  feedback: string[];
  suggestions: string[];
  details?: Record<string, unknown>;
}

/**
 * Pipeline step result
 */
export interface PipelineStepResult<T = unknown> {
  phase: PipelinePhase;
  status: PipelineStatus;
  data: T;
  duration: number;
  retries: number;
  verification?: VerificationResult;
  error?: Error;
}

/**
 * Complete pipeline execution result
 */
export interface PipelineExecutionResult {
  id: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  phases: {
    gather: PipelineStepResult;
    action: PipelineStepResult;
    verify: PipelineStepResult;
  };
  iterations: number;
  success: boolean;
  finalOutput: unknown;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  maxIterations: number;
  maxRetries: number;
  timeoutMs: number;
  verificationThreshold: number; // Minimum score to pass (0-100)
  enableCompaction: boolean;
  compactionThreshold: number; // Token count threshold
}

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Tool execution context
 */
export interface ToolContext {
  runtime: IAgentRuntime;
  memory: Memory;
  state: State;
  sandboxConfig: SandboxConfig;
}

/**
 * Tool execution result
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data: T;
  output: string;
  error?: string;
  duration: number;
}

/**
 * Base tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

/**
 * Parameter definition for tools
 */
export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
}

// ============================================================================
// Sandbox Types
// ============================================================================

/**
 * Sandbox security configuration
 * Based on Anthropic's dual-boundary approach (filesystem + network)
 */
export interface SandboxConfig {
  enabled: boolean;

  // Filesystem isolation
  filesystem: {
    allowedPaths: string[];
    blockedPaths: string[];
    workingDirectory: string;
    readOnly: boolean;
  };

  // Network isolation
  network: {
    allowedDomains: string[];
    blockedDomains: string[];
    allowLocalhost: boolean;
    proxyUrl?: string;
  };

  // Resource limits
  resources: {
    maxMemoryMb: number;
    maxCpuPercent: number;
    maxDiskMb: number;
    timeoutMs: number;
  };

  // Git security
  git: {
    allowedBranches: string[];
    blockedBranches: string[];
    allowForcePush: boolean;
    signCommits: boolean;
  };
}

/**
 * Sandbox execution environment
 */
export interface SandboxEnvironment {
  id: string;
  config: SandboxConfig;
  status: 'active' | 'suspended' | 'terminated';
  createdAt: Date;
  metrics: SandboxMetrics;
}

/**
 * Sandbox resource metrics
 */
export interface SandboxMetrics {
  memoryUsedMb: number;
  cpuPercent: number;
  diskUsedMb: number;
  networkBytesIn: number;
  networkBytesOut: number;
  executionCount: number;
}

// ============================================================================
// Subagent Types
// ============================================================================

/**
 * Subagent definition for parallel execution
 */
export interface SubagentDefinition {
  id: string;
  name: string;
  specialty: string;
  tools: ToolDefinition[];
  maxContextTokens: number;
}

/**
 * Subagent task for parallel execution
 */
export interface SubagentTask {
  id: string;
  subagentId: string;
  task: string;
  context: Record<string, unknown>;
  priority: number;
  timeout: number;
}

/**
 * Subagent execution result
 */
export interface SubagentResult {
  taskId: string;
  subagentId: string;
  success: boolean;
  output: string;
  excerpt: string; // Summarized output for orchestrator
  duration: number;
  tokensUsed: number;
  error?: string;
}

/**
 * Orchestrator coordination result
 */
export interface OrchestrationResult {
  tasks: SubagentTask[];
  results: SubagentResult[];
  totalDuration: number;
  successRate: number;
  combinedOutput: string;
}

// ============================================================================
// Context Compaction Types
// ============================================================================

/**
 * Context compaction configuration
 */
export interface CompactionConfig {
  enabled: boolean;
  threshold: number; // Token count to trigger compaction
  targetSize: number; // Target token count after compaction
  preserveRecent: number; // Number of recent messages to preserve
  preserveImportant: boolean; // Preserve messages marked as important
}

/**
 * Compaction result
 */
export interface CompactionResult {
  originalTokens: number;
  compactedTokens: number;
  reduction: number; // Percentage reduction
  summary: string;
  preservedMessages: number;
}

// ============================================================================
// Verification Types
// ============================================================================

/**
 * Verification strategy type
 */
export type VerificationStrategy = 'rules' | 'visual' | 'llm-judge' | 'combined';

/**
 * Rule-based verification configuration
 */
export interface RulesVerificationConfig {
  rules: VerificationRule[];
  strictMode: boolean; // Fail on first rule violation
}

/**
 * Single verification rule
 */
export interface VerificationRule {
  id: string;
  name: string;
  description: string;
  check: (output: unknown) => boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Visual verification configuration (for UI tasks)
 */
export interface VisualVerificationConfig {
  screenshotPath?: string;
  checkLayout: boolean;
  checkColors: boolean;
  checkResponsiveness: boolean;
  referenceImage?: string;
}

/**
 * LLM-as-Judge verification configuration
 */
export interface LLMJudgeConfig {
  model: string;
  criteria: string[];
  maxScore: number;
  passingScore: number;
  prompt?: string;
}

// ============================================================================
// Testing Types
// ============================================================================

/**
 * Test case definition for pipeline testing
 */
export interface PipelineTestCase {
  id: string;
  name: string;
  description: string;
  input: Record<string, unknown>;
  expectedOutput?: unknown;
  verificationRules?: VerificationRule[];
  timeout: number;
  tags: string[];
}

/**
 * Test suite for pipeline evaluation
 */
export interface PipelineTestSuite {
  id: string;
  name: string;
  description: string;
  testCases: PipelineTestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

/**
 * Test execution result
 */
export interface TestResult {
  testCaseId: string;
  passed: boolean;
  duration: number;
  output: unknown;
  verification: VerificationResult;
  error?: Error;
}

/**
 * Test suite execution report
 */
export interface TestSuiteReport {
  suiteId: string;
  startTime: Date;
  endTime: Date;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  coverage?: number;
}

// ============================================================================
// Cloud Development Types
// ============================================================================

/**
 * Cloud environment configuration
 */
export interface CloudConfig {
  provider: 'local' | 'docker' | 'kubernetes';
  region?: string;
  instanceType?: string;

  // Persistent storage
  storage: {
    type: 'local' | 's3' | 'gcs';
    path: string;
    credentials?: Record<string, string>;
  };

  // Secrets management
  secrets: {
    provider: 'env' | 'infisical' | 'vault';
    config: Record<string, string>;
  };

  // Logging and monitoring
  monitoring: {
    enabled: boolean;
    endpoint?: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  cloud: CloudConfig;
  sandbox: SandboxConfig;
  pipeline: PipelineConfig;
  scaling: {
    minInstances: number;
    maxInstances: number;
    autoScale: boolean;
  };
}
