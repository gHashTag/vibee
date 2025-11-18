/**
 * Agent Pipeline - Gather → Action → Verify Loop
 *
 * Core pipeline implementation following Anthropic's Agent SDK best practices.
 * This feedback loop ensures agents can autonomously improve their outputs
 * by evaluating results before proceeding.
 *
 * @see https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 */

import { elizaLogger, type IAgentRuntime, type Memory, type State } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import type {
  PipelineConfig,
  PipelineExecutionResult,
  PipelinePhase,
  PipelineStepResult,
  ToolContext,
  ToolResult,
  VerificationResult,
} from '../types';
import { ContextCompactor } from './compaction';
import { Verifier } from './verification';

/**
 * Default pipeline configuration
 */
const DEFAULT_CONFIG: PipelineConfig = {
  maxIterations: 5,
  maxRetries: 3,
  timeoutMs: 120000, // 2 minutes
  verificationThreshold: 80, // 80% score to pass
  enableCompaction: true,
  compactionThreshold: 100000, // 100k tokens
};

/**
 * Pipeline execution context
 */
interface PipelineContext {
  id: string;
  runtime: IAgentRuntime;
  memory: Memory;
  state: State;
  config: PipelineConfig;
  iteration: number;
  accumulatedContext: string[];
  tokenCount: number;
}

/**
 * Phase handler function type
 */
type PhaseHandler<T = unknown> = (context: PipelineContext, input: unknown) => Promise<T>;

/**
 * Agent Pipeline Implementation
 *
 * Implements the core Gather → Action → Verify loop with:
 * - Automatic context management
 * - Verification and feedback
 * - Retry logic with exponential backoff
 * - Context compaction for long-running tasks
 */
export class AgentPipeline {
  private config: PipelineConfig;
  private compactor: ContextCompactor;
  private verifier: Verifier;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.compactor = new ContextCompactor({
      enabled: this.config.enableCompaction,
      threshold: this.config.compactionThreshold,
      targetSize: Math.floor(this.config.compactionThreshold * 0.7),
      preserveRecent: 10,
      preserveImportant: true,
    });
    this.verifier = new Verifier();
  }

  /**
   * Execute the full pipeline with Gather → Action → Verify loop
   */
  async execute(
    runtime: IAgentRuntime,
    memory: Memory,
    state: State,
    gatherHandler: PhaseHandler,
    actionHandler: PhaseHandler,
    verifyHandler?: PhaseHandler<VerificationResult>
  ): Promise<PipelineExecutionResult> {
    const startTime = new Date();
    const pipelineId = uuidv4();

    elizaLogger.info(`[AgentPipeline] Starting pipeline execution ${pipelineId}`);

    const context: PipelineContext = {
      id: pipelineId,
      runtime,
      memory,
      state,
      config: this.config,
      iteration: 0,
      accumulatedContext: [],
      tokenCount: 0,
    };

    const phases: PipelineExecutionResult['phases'] = {
      gather: this.createEmptyStepResult('gather'),
      action: this.createEmptyStepResult('action'),
      verify: this.createEmptyStepResult('verify'),
    };

    let success = false;
    let finalOutput: unknown = null;

    try {
      // Main iteration loop
      while (context.iteration < this.config.maxIterations && !success) {
        context.iteration++;
        elizaLogger.info(`[AgentPipeline] Iteration ${context.iteration}/${this.config.maxIterations}`);

        // Phase 1: Gather Context
        phases.gather = await this.executePhase('gather', context, gatherHandler, undefined);

        if (phases.gather.status === 'failed') {
          elizaLogger.error('[AgentPipeline] Gather phase failed');
          break;
        }

        // Check for context compaction
        if (this.config.enableCompaction) {
          await this.checkAndCompact(context);
        }

        // Phase 2: Take Action
        phases.action = await this.executePhase('action', context, actionHandler, phases.gather.data);

        if (phases.action.status === 'failed') {
          elizaLogger.error('[AgentPipeline] Action phase failed');
          break;
        }

        // Phase 3: Verify Work
        const customVerifyHandler = verifyHandler || this.defaultVerifyHandler.bind(this);
        phases.verify = await this.executePhase('verify', context, customVerifyHandler, phases.action.data);

        if (phases.verify.status === 'failed') {
          elizaLogger.warn('[AgentPipeline] Verification failed, will retry');
          continue;
        }

        const verification = phases.verify.data as VerificationResult;

        if (verification.passed && verification.score >= this.config.verificationThreshold) {
          success = true;
          finalOutput = phases.action.data;
          elizaLogger.info(
            `[AgentPipeline] Pipeline completed successfully with score ${verification.score}`
          );
        } else {
          elizaLogger.info(
            `[AgentPipeline] Verification score ${verification.score} below threshold ${this.config.verificationThreshold}, iterating`
          );
          // Add feedback to context for next iteration
          context.accumulatedContext.push(
            `Iteration ${context.iteration} feedback: ${verification.feedback.join('; ')}`
          );
        }
      }
    } catch (error) {
      elizaLogger.error(`[AgentPipeline] Pipeline execution error: ${error}`);
    }

    const endTime = new Date();

    return {
      id: pipelineId,
      startTime,
      endTime,
      totalDuration: endTime.getTime() - startTime.getTime(),
      phases,
      iterations: context.iteration,
      success,
      finalOutput,
    };
  }

  /**
   * Execute a single phase with retry logic
   */
  private async executePhase<T>(
    phase: PipelinePhase,
    context: PipelineContext,
    handler: PhaseHandler<T>,
    input: unknown
  ): Promise<PipelineStepResult<T>> {
    const startTime = Date.now();
    let retries = 0;

    while (retries <= this.config.maxRetries) {
      try {
        elizaLogger.debug(`[AgentPipeline] Executing ${phase} phase (attempt ${retries + 1})`);

        const result = await Promise.race([
          handler(context, input),
          this.createTimeout(this.config.timeoutMs),
        ]);

        return {
          phase,
          status: 'completed',
          data: result as T,
          duration: Date.now() - startTime,
          retries,
        };
      } catch (error) {
        retries++;

        if (retries > this.config.maxRetries) {
          elizaLogger.error(`[AgentPipeline] ${phase} phase failed after ${retries} retries: ${error}`);

          return {
            phase,
            status: 'failed',
            data: null as T,
            duration: Date.now() - startTime,
            retries,
            error: error as Error,
          };
        }

        // Exponential backoff
        const backoffMs = Math.pow(2, retries) * 1000;
        elizaLogger.warn(
          `[AgentPipeline] ${phase} phase failed, retrying in ${backoffMs}ms: ${error}`
        );
        await this.sleep(backoffMs);
      }
    }

    // Should not reach here, but TypeScript needs it
    return this.createEmptyStepResult(phase);
  }

  /**
   * Default verification handler
   */
  private async defaultVerifyHandler(
    context: PipelineContext,
    actionOutput: unknown
  ): Promise<VerificationResult> {
    return this.verifier.verify(actionOutput, {
      strategy: 'rules',
      rules: {
        rules: [],
        strictMode: false,
      },
    });
  }

  /**
   * Check if context compaction is needed and perform it
   */
  private async checkAndCompact(context: PipelineContext): Promise<void> {
    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const totalContent = context.accumulatedContext.join(' ');
    const estimatedTokens = Math.ceil(totalContent.length / 4);
    context.tokenCount = estimatedTokens;

    if (estimatedTokens > this.config.compactionThreshold) {
      elizaLogger.info(
        `[AgentPipeline] Context compaction triggered (${estimatedTokens} tokens)`
      );

      const compactionResult = await this.compactor.compact(
        context.accumulatedContext,
        context.runtime
      );

      // Replace accumulated context with compacted version
      context.accumulatedContext = [compactionResult.summary];
      context.tokenCount = compactionResult.compactedTokens;

      elizaLogger.info(
        `[AgentPipeline] Context compacted: ${compactionResult.originalTokens} → ${compactionResult.compactedTokens} tokens (${compactionResult.reduction}% reduction)`
      );
    }
  }

  /**
   * Create empty step result for initialization
   */
  private createEmptyStepResult<T>(phase: PipelinePhase): PipelineStepResult<T> {
    return {
      phase,
      status: 'pending',
      data: null as T,
      duration: 0,
      retries: 0,
    };
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Pipeline timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a pre-configured pipeline for common use cases
 */
export function createPipeline(config?: Partial<PipelineConfig>): AgentPipeline {
  return new AgentPipeline(config);
}

/**
 * Quick pipeline execution helper
 */
export async function executePipeline(
  runtime: IAgentRuntime,
  memory: Memory,
  state: State,
  handlers: {
    gather: PhaseHandler;
    action: PhaseHandler;
    verify?: PhaseHandler<VerificationResult>;
  },
  config?: Partial<PipelineConfig>
): Promise<PipelineExecutionResult> {
  const pipeline = createPipeline(config);
  return pipeline.execute(
    runtime,
    memory,
    state,
    handlers.gather,
    handlers.action,
    handlers.verify
  );
}
