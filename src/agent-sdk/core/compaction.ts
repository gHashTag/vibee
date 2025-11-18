/**
 * Context Compaction for Long-Running Sessions
 *
 * Automatically summarizes conversation history when approaching context limits,
 * preventing context exhaustion during extended agent runs.
 *
 * @see https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 */

import { elizaLogger, type IAgentRuntime } from '@elizaos/core';
import type { CompactionConfig, CompactionResult } from '../types';

/**
 * Default compaction configuration
 */
const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  enabled: true,
  threshold: 100000, // 100k tokens
  targetSize: 70000, // 70k tokens after compaction
  preserveRecent: 10, // Keep last 10 messages intact
  preserveImportant: true, // Keep messages marked as important
};

/**
 * Context Compactor for managing long conversations
 */
export class ContextCompactor {
  private config: CompactionConfig;

  constructor(config: Partial<CompactionConfig> = {}) {
    this.config = { ...DEFAULT_COMPACTION_CONFIG, ...config };
  }

  /**
   * Compact context when it exceeds threshold
   */
  async compact(
    messages: string[],
    runtime: IAgentRuntime
  ): Promise<CompactionResult> {
    if (!this.config.enabled) {
      return {
        originalTokens: this.estimateTokens(messages.join(' ')),
        compactedTokens: this.estimateTokens(messages.join(' ')),
        reduction: 0,
        summary: messages.join('\n'),
        preservedMessages: messages.length,
      };
    }

    const originalContent = messages.join('\n');
    const originalTokens = this.estimateTokens(originalContent);

    elizaLogger.info(`[ContextCompactor] Starting compaction: ${originalTokens} tokens`);

    // Separate messages to preserve from those to compact
    const { toPreserve, toCompact } = this.separateMessages(messages);

    if (toCompact.length === 0) {
      return {
        originalTokens,
        compactedTokens: originalTokens,
        reduction: 0,
        summary: originalContent,
        preservedMessages: messages.length,
      };
    }

    // Create summary of compacted messages
    const summary = await this.createSummary(toCompact, runtime);

    // Combine summary with preserved messages
    const compactedContent = [
      '=== CONTEXT SUMMARY ===',
      summary,
      '=== RECENT CONTEXT ===',
      ...toPreserve,
    ].join('\n');

    const compactedTokens = this.estimateTokens(compactedContent);
    const reduction = Math.round(((originalTokens - compactedTokens) / originalTokens) * 100);

    elizaLogger.info(
      `[ContextCompactor] Compaction complete: ${originalTokens} → ${compactedTokens} tokens (${reduction}% reduction)`
    );

    return {
      originalTokens,
      compactedTokens,
      reduction,
      summary: compactedContent,
      preservedMessages: toPreserve.length,
    };
  }

  /**
   * Check if compaction is needed
   */
  needsCompaction(content: string): boolean {
    if (!this.config.enabled) return false;
    return this.estimateTokens(content) > this.config.threshold;
  }

  /**
   * Separate messages into preserve and compact groups
   */
  private separateMessages(messages: string[]): {
    toPreserve: string[];
    toCompact: string[];
  } {
    const recentCount = Math.min(this.config.preserveRecent, messages.length);
    const splitIndex = messages.length - recentCount;

    return {
      toPreserve: messages.slice(splitIndex),
      toCompact: messages.slice(0, splitIndex),
    };
  }

  /**
   * Create summary of messages using LLM
   */
  private async createSummary(
    messages: string[],
    runtime: IAgentRuntime
  ): Promise<string> {
    const content = messages.join('\n\n---\n\n');

    // Check if we have access to the model service
    const modelService = runtime.getService('model');

    if (modelService && typeof (modelService as { generateText?: Function }).generateText === 'function') {
      try {
        const result = await (modelService as { generateText: Function }).generateText({
          prompt: `Summarize the following conversation context, preserving key information, decisions, and action items. Be concise but comprehensive.

CONTEXT:
${content}

SUMMARY:`,
          maxTokens: 2000,
        });

        return result || this.createFallbackSummary(messages);
      } catch (error) {
        elizaLogger.warn(`[ContextCompactor] LLM summary failed, using fallback: ${error}`);
        return this.createFallbackSummary(messages);
      }
    }

    return this.createFallbackSummary(messages);
  }

  /**
   * Create fallback summary without LLM
   */
  private createFallbackSummary(messages: string[]): string {
    const keyPoints: string[] = [];

    for (const message of messages) {
      // Extract key information patterns
      const lines = message.split('\n').filter((line) => {
        // Keep lines that look important
        return (
          line.includes('TODO') ||
          line.includes('IMPORTANT') ||
          line.includes('ERROR') ||
          line.includes('Result:') ||
          line.includes('Decision:') ||
          line.includes('Action:') ||
          line.startsWith('- ') ||
          line.startsWith('* ') ||
          line.match(/^\d+\./)
        );
      });

      keyPoints.push(...lines);
    }

    // Deduplicate and limit
    const uniquePoints = [...new Set(keyPoints)].slice(0, 50);

    return `Previous context summary (${messages.length} messages):\n${uniquePoints.join('\n')}`;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CompactionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompactionConfig {
    return { ...this.config };
  }
}

/**
 * Create a context compactor with default configuration
 */
export function createCompactor(config?: Partial<CompactionConfig>): ContextCompactor {
  return new ContextCompactor(config);
}

/**
 * Quick compaction helper
 */
export async function compactContext(
  messages: string[],
  runtime: IAgentRuntime,
  config?: Partial<CompactionConfig>
): Promise<CompactionResult> {
  const compactor = createCompactor(config);
  return compactor.compact(messages, runtime);
}
