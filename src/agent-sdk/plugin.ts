/**
 * Agent SDK Plugin for ElizaOS
 *
 * Integrates Agent SDK best practices into the ElizaOS framework.
 * Provides pipeline execution, sandboxing, and verification capabilities.
 */

import {
  elizaLogger,
  type Action,
  type Evaluator,
  type IAgentRuntime,
  type Memory,
  type Plugin,
  type Provider,
  type Service,
  type State,
} from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import { AgentPipeline } from './core/pipeline';
import { SandboxManager } from './core/sandbox';
import { SubagentManager } from './core/subagents';
import { ContextCompactor } from './core/compaction';
import { Verifier, BUILT_IN_RULES } from './core/verification';
import { CLOUD_PRESET } from './index';
import type { PipelineConfig, SandboxConfig } from './types';

/**
 * Agent SDK Service for managing pipeline execution
 */
class AgentSDKService implements Service {
  static serviceType = 'agent-sdk';

  private runtime: IAgentRuntime | null = null;
  private pipeline: AgentPipeline;
  private sandbox: SandboxManager;
  private subagentManager: SubagentManager;
  private compactor: ContextCompactor;
  private verifier: Verifier;

  constructor() {
    this.pipeline = new AgentPipeline(CLOUD_PRESET.pipeline);
    this.sandbox = new SandboxManager(CLOUD_PRESET.sandbox);
    this.subagentManager = new SubagentManager();
    this.compactor = new ContextCompactor({
      enabled: true,
      threshold: 100000,
      targetSize: 70000,
      preserveRecent: 10,
      preserveImportant: true,
    });
    this.verifier = new Verifier();
  }

  get serviceType(): string {
    return AgentSDKService.serviceType;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    this.subagentManager.setRuntime(runtime);
    elizaLogger.info('[AgentSDK] Service initialized');
  }

  async start(): Promise<void> {
    elizaLogger.info('[AgentSDK] Service started');
  }

  async stop(): Promise<void> {
    elizaLogger.info('[AgentSDK] Service stopped');
  }

  /**
   * Get the pipeline instance
   */
  getPipeline(): AgentPipeline {
    return this.pipeline;
  }

  /**
   * Get the sandbox manager
   */
  getSandbox(): SandboxManager {
    return this.sandbox;
  }

  /**
   * Get the subagent manager
   */
  getSubagentManager(): SubagentManager {
    return this.subagentManager;
  }

  /**
   * Get the context compactor
   */
  getCompactor(): ContextCompactor {
    return this.compactor;
  }

  /**
   * Get the verifier
   */
  getVerifier(): Verifier {
    return this.verifier;
  }

  /**
   * Validate file access through sandbox
   */
  canAccessFile(filepath: string): boolean {
    return this.sandbox.validateFilesystemAccess(filepath);
  }

  /**
   * Validate network access through sandbox
   */
  canAccessNetwork(url: string): boolean {
    return this.sandbox.validateNetworkAccess(url);
  }

  /**
   * Validate git operation through sandbox
   */
  canPerformGitOperation(operation: string, branch?: string): boolean {
    return this.sandbox.validateGitOperation(operation, branch);
  }
}

/**
 * Provider for Agent SDK context
 */
const agentSDKProvider: Provider = {
  name: 'agent-sdk',
  description: 'Provides Agent SDK capabilities for pipeline execution',

  async get(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> {
    const service = runtime.getService('agent-sdk') as AgentSDKService;

    if (!service) {
      return 'Agent SDK service not available';
    }

    return `Agent SDK is available with the following capabilities:
- Pipeline execution (Gather → Action → Verify)
- Sandbox isolation (filesystem + network)
- Subagent parallelization
- Context compaction
- Output verification

Use the pipeline for complex multi-step tasks that require verification.`;
  },
};

/**
 * Action for executing a pipeline task
 */
const executePipelineAction: Action = {
  name: 'EXECUTE_PIPELINE',
  description: 'Execute a task using the Agent SDK pipeline with verification',
  similes: ['run pipeline', 'execute with verification', 'pipeline task'],
  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Execute a code review pipeline on the latest changes',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'I will execute the pipeline to review the code changes with verification.',
          action: 'EXECUTE_PIPELINE',
        },
      },
    ],
  ],

  async validate(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> {
    const service = runtime.getService('agent-sdk');
    return service !== null;
  },

  async handler(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<void> {
    const service = runtime.getService('agent-sdk') as AgentSDKService;

    if (!service) {
      elizaLogger.error('[AgentSDK] Service not available for pipeline execution');
      return;
    }

    const pipeline = service.getPipeline();

    try {
      const result = await pipeline.execute(
        runtime,
        message,
        state || {} as State,
        // Gather phase
        async (context, input) => {
          return {
            task: message.content.text,
            context: state,
            timestamp: new Date().toISOString(),
          };
        },
        // Action phase
        async (context, input) => {
          return {
            completed: true,
            input,
            result: 'Task processed through pipeline',
          };
        },
        // Verify phase
        async (context, output) => {
          const verifier = service.getVerifier();
          return verifier.verify(output, {
            strategy: 'rules',
            rules: { rules: BUILT_IN_RULES, strictMode: false },
          });
        }
      );

      elizaLogger.info(
        `[AgentSDK] Pipeline completed: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.iterations} iterations)`
      );
    } catch (error) {
      elizaLogger.error(`[AgentSDK] Pipeline execution failed: ${error}`);
    }
  },
};

/**
 * Evaluator for checking sandbox compliance
 */
const sandboxComplianceEvaluator: Evaluator = {
  name: 'SANDBOX_COMPLIANCE',
  description: 'Evaluates if actions comply with sandbox restrictions',
  similes: ['security check', 'sandbox validation'],
  examples: [
    {
      prompt: 'Check if file access is allowed',
      messages: [
        {
          name: '{{name1}}',
          content: { text: 'Read file /etc/passwd' },
        },
      ],
      outcome: 'Blocked - path not in allowed list',
    },
  ],

  async validate(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> {
    return true;
  },

  async handler(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<void> {
    const service = runtime.getService('agent-sdk') as AgentSDKService;

    if (!service) {
      return;
    }

    const text = message.content.text || '';

    // Check for file paths
    const filePathMatch = text.match(/(?:read|write|access|open)\s+(?:file\s+)?([^\s]+)/i);
    if (filePathMatch) {
      const filepath = filePathMatch[1];
      const allowed = service.canAccessFile(filepath);

      if (!allowed) {
        elizaLogger.warn(`[AgentSDK] Sandbox blocked file access: ${filepath}`);
      }
    }

    // Check for URLs
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      const url = urlMatch[0];
      const allowed = service.canAccessNetwork(url);

      if (!allowed) {
        elizaLogger.warn(`[AgentSDK] Sandbox blocked network access: ${url}`);
      }
    }
  },
};

/**
 * Agent SDK Plugin
 */
export const agentSDKPlugin: Plugin = {
  name: 'agent-sdk',
  description: 'Agent SDK best practices implementation for cloud development and pipeline testing',
  services: [new AgentSDKService()],
  providers: [agentSDKProvider],
  actions: [executePipelineAction],
  evaluators: [sandboxComplianceEvaluator],
};

export default agentSDKPlugin;
