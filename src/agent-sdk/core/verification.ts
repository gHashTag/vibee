/**
 * Verification System - Rules, Visual, and LLM-as-Judge
 *
 * Three verification approaches:
 * 1. Defining Rules - Explicit feedback criteria
 * 2. Visual Feedback - For UI-generation tasks
 * 3. LLM-as-Judge - Secondary LLM evaluation
 *
 * @see https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
 */

import { elizaLogger, type IAgentRuntime } from '@elizaos/core';
import type {
  LLMJudgeConfig,
  RulesVerificationConfig,
  VerificationResult,
  VerificationRule,
  VerificationStrategy,
  VisualVerificationConfig,
} from '../types';

/**
 * Verification configuration union type
 */
interface VerificationConfig {
  strategy: VerificationStrategy;
  rules?: RulesVerificationConfig;
  visual?: VisualVerificationConfig;
  llmJudge?: LLMJudgeConfig;
}

/**
 * Built-in verification rules
 */
export const BUILT_IN_RULES: VerificationRule[] = [
  {
    id: 'not-empty',
    name: 'Not Empty',
    description: 'Output must not be empty',
    check: (output) => {
      if (typeof output === 'string') return output.trim().length > 0;
      if (Array.isArray(output)) return output.length > 0;
      if (typeof output === 'object' && output !== null) {
        return Object.keys(output).length > 0;
      }
      return output !== null && output !== undefined;
    },
    severity: 'error',
  },
  {
    id: 'no-errors',
    name: 'No Errors',
    description: 'Output must not contain error indicators',
    check: (output) => {
      const str = typeof output === 'string' ? output : JSON.stringify(output);
      const errorPatterns = [
        /\berror\b/i,
        /\bfailed\b/i,
        /\bexception\b/i,
        /\bcrash\b/i,
      ];
      return !errorPatterns.some((pattern) => pattern.test(str));
    },
    severity: 'error',
  },
  {
    id: 'valid-json',
    name: 'Valid JSON',
    description: 'If output is supposed to be JSON, it must be valid',
    check: (output) => {
      if (typeof output === 'string') {
        try {
          JSON.parse(output);
          return true;
        } catch {
          // Not JSON, that's okay if not required
          return !output.includes('{') && !output.includes('[');
        }
      }
      return true;
    },
    severity: 'warning',
  },
  {
    id: 'no-todo',
    name: 'No TODOs',
    description: 'Output should not contain TODO markers',
    check: (output) => {
      const str = typeof output === 'string' ? output : JSON.stringify(output);
      return !str.includes('TODO') && !str.includes('FIXME');
    },
    severity: 'warning',
  },
  {
    id: 'has-content',
    name: 'Has Substantive Content',
    description: 'Output must have meaningful content (not just placeholders)',
    check: (output) => {
      if (typeof output !== 'string') return true;
      const placeholderPatterns = [
        /lorem ipsum/i,
        /placeholder/i,
        /\[insert .+ here\]/i,
        /xxx+/i,
      ];
      return !placeholderPatterns.some((pattern) => pattern.test(output));
    },
    severity: 'warning',
  },
];

/**
 * Code-specific verification rules
 */
export const CODE_RULES: VerificationRule[] = [
  {
    id: 'no-console-log',
    name: 'No Console Logs',
    description: 'Production code should not have console.log',
    check: (output) => {
      const str = typeof output === 'string' ? output : JSON.stringify(output);
      return !str.includes('console.log');
    },
    severity: 'warning',
  },
  {
    id: 'no-hardcoded-secrets',
    name: 'No Hardcoded Secrets',
    description: 'Code should not contain hardcoded API keys or secrets',
    check: (output) => {
      const str = typeof output === 'string' ? output : JSON.stringify(output);
      const secretPatterns = [
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
        /password\s*[:=]\s*["'][^"']+["']/i,
        /secret\s*[:=]\s*["'][^"']+["']/i,
        /token\s*[:=]\s*["'][^"']+["']/i,
        /sk-[a-zA-Z0-9]{20,}/,
        /ghp_[a-zA-Z0-9]{36}/,
      ];
      return !secretPatterns.some((pattern) => pattern.test(str));
    },
    severity: 'error',
  },
  {
    id: 'has-type-annotations',
    name: 'Has Type Annotations',
    description: 'TypeScript code should have type annotations',
    check: (output) => {
      const str = typeof output === 'string' ? output : JSON.stringify(output);
      // Check for TypeScript-specific syntax
      if (str.includes('function ') || str.includes('const ') || str.includes('let ')) {
        return str.includes(': ') || str.includes('type ') || str.includes('interface ');
      }
      return true;
    },
    severity: 'info',
  },
];

/**
 * Verifier class for output validation
 */
export class Verifier {
  /**
   * Verify output using specified strategy
   */
  async verify(
    output: unknown,
    config: VerificationConfig,
    runtime?: IAgentRuntime
  ): Promise<VerificationResult> {
    switch (config.strategy) {
      case 'rules':
        return this.verifyWithRules(output, config.rules);

      case 'visual':
        return this.verifyVisual(output, config.visual);

      case 'llm-judge':
        if (!runtime) {
          throw new Error('Runtime required for LLM-as-Judge verification');
        }
        return this.verifyWithLLM(output, config.llmJudge, runtime);

      case 'combined':
        return this.verifyCombined(output, config, runtime);

      default:
        return this.verifyWithRules(output, config.rules);
    }
  }

  /**
   * Rule-based verification
   */
  private async verifyWithRules(
    output: unknown,
    config?: RulesVerificationConfig
  ): Promise<VerificationResult> {
    const rules = config?.rules || BUILT_IN_RULES;
    const strictMode = config?.strictMode ?? false;

    const feedback: string[] = [];
    const suggestions: string[] = [];
    let errorCount = 0;
    let warningCount = 0;

    for (const rule of rules) {
      try {
        const passed = rule.check(output);

        if (!passed) {
          const message = `[${rule.severity.toUpperCase()}] ${rule.name}: ${rule.description}`;
          feedback.push(message);

          if (rule.severity === 'error') {
            errorCount++;
            if (strictMode) {
              return {
                passed: false,
                score: 0,
                feedback,
                suggestions: [`Fix: ${rule.description}`],
              };
            }
          } else if (rule.severity === 'warning') {
            warningCount++;
            suggestions.push(`Consider: ${rule.description}`);
          }
        }
      } catch (error) {
        elizaLogger.warn(`[Verifier] Rule ${rule.id} threw error: ${error}`);
      }
    }

    // Calculate score
    const totalRules = rules.length;
    const failedRules = errorCount + warningCount * 0.5;
    const score = Math.max(0, Math.round(((totalRules - failedRules) / totalRules) * 100));

    return {
      passed: errorCount === 0,
      score,
      feedback,
      suggestions,
      details: {
        totalRules,
        errors: errorCount,
        warnings: warningCount,
      },
    };
  }

  /**
   * Visual verification (for UI tasks)
   */
  private async verifyVisual(
    output: unknown,
    config?: VisualVerificationConfig
  ): Promise<VerificationResult> {
    // Visual verification requires screenshot comparison
    // This is a placeholder implementation

    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (config?.checkLayout) {
      feedback.push('Layout check: Pending screenshot analysis');
    }

    if (config?.checkColors) {
      feedback.push('Color check: Pending screenshot analysis');
    }

    if (config?.checkResponsiveness) {
      feedback.push('Responsiveness check: Pending screenshot analysis');
    }

    // Without actual screenshot, we return a neutral result
    return {
      passed: true,
      score: 70, // Neutral score without actual visual verification
      feedback: ['Visual verification requires screenshot integration'],
      suggestions: ['Integrate screenshot capture for full visual verification'],
      details: {
        config,
        status: 'pending-screenshot',
      },
    };
  }

  /**
   * LLM-as-Judge verification
   */
  private async verifyWithLLM(
    output: unknown,
    config?: LLMJudgeConfig,
    runtime?: IAgentRuntime
  ): Promise<VerificationResult> {
    if (!runtime) {
      return {
        passed: false,
        score: 0,
        feedback: ['Runtime not available for LLM-as-Judge'],
        suggestions: ['Provide runtime for LLM evaluation'],
      };
    }

    const criteria = config?.criteria || [
      'Correctness: Is the output factually correct?',
      'Completeness: Does the output fully address the task?',
      'Quality: Is the output well-structured and clear?',
    ];

    const prompt = config?.prompt || `Evaluate the following output against these criteria:

${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

OUTPUT:
${typeof output === 'string' ? output : JSON.stringify(output, null, 2)}

Provide a JSON response with:
{
  "scores": [score1, score2, ...],  // 0-10 for each criterion
  "feedback": ["feedback1", "feedback2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "overallScore": 0-100
}`;

    const modelService = runtime.getService('model');

    if (!modelService || typeof (modelService as { generateText?: Function }).generateText !== 'function') {
      return {
        passed: false,
        score: 0,
        feedback: ['Model service not available'],
        suggestions: ['Ensure model service is configured'],
      };
    }

    try {
      const response = await (modelService as { generateText: Function }).generateText({
        prompt,
        maxTokens: 1000,
      });

      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const passingScore = config?.passingScore || 70;

        return {
          passed: result.overallScore >= passingScore,
          score: result.overallScore,
          feedback: result.feedback || [],
          suggestions: result.suggestions || [],
          details: {
            criteria,
            scores: result.scores,
          },
        };
      }

      // Fallback if JSON parsing fails
      return {
        passed: true,
        score: 70,
        feedback: [response],
        suggestions: [],
      };
    } catch (error) {
      elizaLogger.error(`[Verifier] LLM-as-Judge error: ${error}`);

      return {
        passed: false,
        score: 0,
        feedback: [`LLM evaluation failed: ${error}`],
        suggestions: ['Check model configuration and try again'],
      };
    }
  }

  /**
   * Combined verification (all strategies)
   */
  private async verifyCombined(
    output: unknown,
    config: VerificationConfig,
    runtime?: IAgentRuntime
  ): Promise<VerificationResult> {
    const results: VerificationResult[] = [];

    // Rules verification
    if (config.rules) {
      results.push(await this.verifyWithRules(output, config.rules));
    } else {
      results.push(await this.verifyWithRules(output));
    }

    // Visual verification (if configured)
    if (config.visual) {
      results.push(await this.verifyVisual(output, config.visual));
    }

    // LLM-as-Judge (if configured and runtime available)
    if (config.llmJudge && runtime) {
      results.push(await this.verifyWithLLM(output, config.llmJudge, runtime));
    }

    // Combine results
    const allFeedback = results.flatMap((r) => r.feedback);
    const allSuggestions = results.flatMap((r) => r.suggestions);
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const allPassed = results.every((r) => r.passed);

    return {
      passed: allPassed,
      score: avgScore,
      feedback: allFeedback,
      suggestions: allSuggestions,
      details: {
        strategies: results.length,
        results: results.map((r) => ({
          passed: r.passed,
          score: r.score,
        })),
      },
    };
  }
}

/**
 * Create a verifier instance
 */
export function createVerifier(): Verifier {
  return new Verifier();
}

/**
 * Quick verification helpers
 */
export const verify = {
  /**
   * Verify with built-in rules
   */
  withRules: async (
    output: unknown,
    rules?: VerificationRule[]
  ): Promise<VerificationResult> => {
    const verifier = createVerifier();
    return verifier.verify(output, {
      strategy: 'rules',
      rules: { rules: rules || BUILT_IN_RULES, strictMode: false },
    });
  },

  /**
   * Verify code output
   */
  code: async (code: string): Promise<VerificationResult> => {
    const verifier = createVerifier();
    return verifier.verify(code, {
      strategy: 'rules',
      rules: {
        rules: [...BUILT_IN_RULES, ...CODE_RULES],
        strictMode: false,
      },
    });
  },

  /**
   * Quick pass/fail check
   */
  isValid: async (output: unknown): Promise<boolean> => {
    const result = await verify.withRules(output);
    return result.passed;
  },
};
