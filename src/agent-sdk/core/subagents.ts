/**
 * Subagent System for Parallel Execution
 *
 * Enables parallelization and context isolation for complex tasks.
 * Each subagent maintains a separate context window and returns
 * only relevant excerpts to the orchestrator.
 *
 * @see https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 */

import { elizaLogger, type IAgentRuntime } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import type {
  OrchestrationResult,
  SubagentDefinition,
  SubagentResult,
  SubagentTask,
  ToolDefinition,
} from '../types';

/**
 * Default subagent definitions for common tasks
 */
export const DEFAULT_SUBAGENTS: SubagentDefinition[] = [
  {
    id: 'code-searcher',
    name: 'Code Searcher',
    specialty: 'Searching and analyzing code patterns',
    tools: [],
    maxContextTokens: 50000,
  },
  {
    id: 'file-processor',
    name: 'File Processor',
    specialty: 'Reading and processing files',
    tools: [],
    maxContextTokens: 100000,
  },
  {
    id: 'api-caller',
    name: 'API Caller',
    specialty: 'Making API calls and processing responses',
    tools: [],
    maxContextTokens: 50000,
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    specialty: 'Analyzing and summarizing data',
    tools: [],
    maxContextTokens: 75000,
  },
];

/**
 * Subagent Manager for orchestrating parallel tasks
 */
export class SubagentManager {
  private subagents: Map<string, SubagentDefinition> = new Map();
  private runtime: IAgentRuntime | null = null;
  private activeTasks: Map<string, SubagentTask> = new Map();

  constructor(subagents: SubagentDefinition[] = DEFAULT_SUBAGENTS) {
    for (const subagent of subagents) {
      this.subagents.set(subagent.id, subagent);
    }
  }

  /**
   * Set the runtime for subagent execution
   */
  setRuntime(runtime: IAgentRuntime): void {
    this.runtime = runtime;
  }

  /**
   * Register a new subagent
   */
  registerSubagent(definition: SubagentDefinition): void {
    this.subagents.set(definition.id, definition);
    elizaLogger.info(`[SubagentManager] Registered subagent: ${definition.name}`);
  }

  /**
   * Get available subagents
   */
  getAvailableSubagents(): SubagentDefinition[] {
    return Array.from(this.subagents.values());
  }

  /**
   * Create a task for a subagent
   */
  createTask(
    subagentId: string,
    task: string,
    context: Record<string, unknown> = {},
    options: { priority?: number; timeout?: number } = {}
  ): SubagentTask | null {
    const subagent = this.subagents.get(subagentId);
    if (!subagent) {
      elizaLogger.error(`[SubagentManager] Subagent not found: ${subagentId}`);
      return null;
    }

    const taskObj: SubagentTask = {
      id: uuidv4(),
      subagentId,
      task,
      context,
      priority: options.priority ?? 1,
      timeout: options.timeout ?? 60000,
    };

    this.activeTasks.set(taskObj.id, taskObj);
    return taskObj;
  }

  /**
   * Execute a single task
   */
  async executeTask(task: SubagentTask): Promise<SubagentResult> {
    const startTime = Date.now();
    const subagent = this.subagents.get(task.subagentId);

    if (!subagent) {
      return {
        taskId: task.id,
        subagentId: task.subagentId,
        success: false,
        output: '',
        excerpt: '',
        duration: 0,
        tokensUsed: 0,
        error: `Subagent not found: ${task.subagentId}`,
      };
    }

    elizaLogger.info(`[SubagentManager] Executing task ${task.id} with ${subagent.name}`);

    try {
      // Execute the task with timeout
      const result = await Promise.race([
        this.performTask(subagent, task),
        this.createTimeout(task.timeout),
      ]);

      const duration = Date.now() - startTime;

      // Create excerpt for orchestrator (summarized output)
      const excerpt = this.createExcerpt(result, subagent.maxContextTokens);

      return {
        taskId: task.id,
        subagentId: task.subagentId,
        success: true,
        output: result,
        excerpt,
        duration,
        tokensUsed: Math.ceil(result.length / 4), // Rough token estimate
      };
    } catch (error) {
      elizaLogger.error(`[SubagentManager] Task ${task.id} failed: ${error}`);

      return {
        taskId: task.id,
        subagentId: task.subagentId,
        success: false,
        output: '',
        excerpt: '',
        duration: Date.now() - startTime,
        tokensUsed: 0,
        error: String(error),
      };
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(tasks: SubagentTask[]): Promise<OrchestrationResult> {
    const startTime = Date.now();

    elizaLogger.info(`[SubagentManager] Executing ${tasks.length} tasks in parallel`);

    // Sort by priority (higher priority first)
    const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

    // Execute all tasks in parallel
    const results = await Promise.all(
      sortedTasks.map((task) => this.executeTask(task))
    );

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const successRate = (successCount / results.length) * 100;

    // Combine outputs from successful tasks
    const combinedOutput = results
      .filter((r) => r.success)
      .map((r) => `[${r.subagentId}]\n${r.excerpt}`)
      .join('\n\n---\n\n');

    elizaLogger.info(
      `[SubagentManager] Parallel execution complete: ${successCount}/${results.length} successful (${successRate.toFixed(1)}%)`
    );

    return {
      tasks: sortedTasks,
      results,
      totalDuration,
      successRate,
      combinedOutput,
    };
  }

  /**
   * Execute tasks with dependency ordering
   */
  async executeWithDependencies(
    tasks: Array<SubagentTask & { dependencies?: string[] }>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: SubagentResult[] = [];
    const completed = new Set<string>();

    elizaLogger.info(`[SubagentManager] Executing ${tasks.length} tasks with dependencies`);

    while (completed.size < tasks.length) {
      // Find tasks that can be executed (all dependencies completed)
      const readyTasks = tasks.filter((task) => {
        if (completed.has(task.id)) return false;
        const deps = task.dependencies || [];
        return deps.every((dep) => completed.has(dep));
      });

      if (readyTasks.length === 0 && completed.size < tasks.length) {
        elizaLogger.error('[SubagentManager] Circular dependency detected');
        break;
      }

      // Execute ready tasks in parallel
      const batchResults = await Promise.all(
        readyTasks.map((task) => this.executeTask(task))
      );

      for (const result of batchResults) {
        results.push(result);
        completed.add(result.taskId);
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const successRate = (successCount / results.length) * 100;

    const combinedOutput = results
      .filter((r) => r.success)
      .map((r) => `[${r.subagentId}]\n${r.excerpt}`)
      .join('\n\n---\n\n');

    return {
      tasks,
      results,
      totalDuration,
      successRate,
      combinedOutput,
    };
  }

  /**
   * Perform the actual task execution
   */
  private async performTask(
    subagent: SubagentDefinition,
    task: SubagentTask
  ): Promise<string> {
    // This is a simplified implementation
    // In production, this would use the LLM to process the task

    const contextStr = JSON.stringify(task.context, null, 2);

    // Simulate task execution based on subagent specialty
    return `[${subagent.name}] Task: ${task.task}\n\nContext:\n${contextStr}\n\nResult: Task completed successfully by ${subagent.specialty} specialist.`;
  }

  /**
   * Create excerpt from full output for orchestrator
   */
  private createExcerpt(output: string, maxTokens: number): string {
    const maxChars = maxTokens * 4; // Rough token-to-char conversion

    if (output.length <= maxChars) {
      return output;
    }

    // Truncate and add summary note
    const truncated = output.substring(0, maxChars - 100);
    return `${truncated}\n\n[Excerpt truncated. Full output: ${output.length} characters]`;
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Task timeout after ${ms}ms`)), ms);
    });
  }
}

/**
 * Create a subagent manager with default subagents
 */
export function createSubagentManager(
  subagents?: SubagentDefinition[]
): SubagentManager {
  return new SubagentManager(subagents);
}

/**
 * Quick parallel execution helper
 */
export async function executeParallelTasks(
  runtime: IAgentRuntime,
  tasks: Array<{
    subagentId: string;
    task: string;
    context?: Record<string, unknown>;
  }>
): Promise<OrchestrationResult> {
  const manager = createSubagentManager();
  manager.setRuntime(runtime);

  const subagentTasks = tasks
    .map((t) => manager.createTask(t.subagentId, t.task, t.context))
    .filter((t): t is SubagentTask => t !== null);

  return manager.executeParallel(subagentTasks);
}
