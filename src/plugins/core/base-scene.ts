/**
 * Base classes for plugin scenes
 */

import type { Scenes, Context } from 'telegraf';
import type { IAgentRuntime, Logger } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { SceneError, ValidationError } from './errors';
import { withRetry, type RetryOptions } from './retry';
import { CacheService } from './cache';

/**
 * Scene step handler
 */
export type SceneStepHandler<T extends Context> = (ctx: T) => Promise<void>;

/**
 * Scene transition handler
 */
export type SceneTransitionHandler<T extends Context> = (ctx: T, next: () => void) => Promise<void>;

/**
 * Scene configuration
 */
export interface SceneConfig {
  name: string;
  ttl?: number;
  maxSteps?: number;
  retries?: number;
  enableCache?: boolean;
  cacheTtl?: number;
}

/**
 * Scene state
 */
export interface SceneState<T = any> {
  step: number;
  data: T;
  startedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

/**
 * Scene step definition
 */
export interface SceneStep<T extends Context> {
  handler: SceneStepHandler<T>;
  validator?: (ctx: T) => boolean | Promise<boolean>;
  transition?: SceneTransitionHandler<T>;
  onError?: (ctx: T, error: Error) => Promise<void>;
  cacheKey?: (ctx: T) => string;
}

/**
 * Abstract base scene handler
 */
export abstract class BaseSceneHandler<T extends Context & { scene?: any; session?: any }> {
  protected runtime: IAgentRuntime;
  protected logger: Logger;
  protected config: SceneConfig;
  protected cache: CacheService;
  private retryOptions: Required<Pick<RetryOptions, 'retries' | 'delay'>>;

  constructor(runtime: IAgentRuntime, config: SceneConfig) {
    this.runtime = runtime;
    this.logger = logger;
    this.config = config;
    this.cache = new CacheService({
      ttl: config.cacheTtl ?? 300000, // 5 minutes default
      maxSize: 100,
    });
    this.retryOptions = {
      retries: config.retries ?? 2,
      delay: 500,
    };
  }

  /**
   * Validate input for current step
   */
  abstract validateInput(ctx: T): boolean | Promise<boolean>;

  /**
   * Process input for current step
   */
  abstract processInput(ctx: T): Promise<void>;

  /**
   * Handle errors in scene
   */
  async handleError(ctx: T, error: Error | string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    this.logger.error(`[${this.constructor.name}] Scene error:`, error);

    await ctx.reply(
      `❌ Ошибка в сцене "${this.config.name}": ${errorMessage}\n\n` +
      'Попробуйте ещё раз или отмените операцию командой /cancel.'
    );

    if (ctx.scene) {
      await ctx.scene.leave();
    }
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry(
    operation: () => Promise<void>,
    context?: string
  ): Promise<void> {
    return withRetry(operation, {
      ...this.retryOptions,
      retries: this.config.retries ?? 2,
    });
  }

  /**
   * Get or create scene state
   */
  protected getSceneState(ctx: T, defaultData?: any): SceneState {
    const session = (ctx.session as any) || {};
    const key = `scene_${this.config.name}_${ctx.from?.id}`;

    if (!session[key]) {
      session[key] = {
        step: 0,
        data: defaultData || {},
        startedAt: new Date(),
        lastActivity: new Date(),
      };
    } else {
      session[key].lastActivity = new Date();
    }

    return session[key];
  }

  /**
   * Update scene state
   */
  protected updateSceneState(ctx: T, updates: Partial<SceneState>): void {
    const session = (ctx.session as any) || {};
    const key = `scene_${this.config.name}_${ctx.from?.id}`;

    if (!session[key]) {
      throw new SceneError('Scene state not initialized', this.config.name);
    }

    session[key] = {
      ...session[key],
      ...updates,
      lastActivity: new Date(),
    };
  }

  /**
   * Leave scene
   */
  protected async leaveScene(ctx: T): Promise<void> {
    const session = (ctx.session as any) || {};
    const key = `scene_${this.config.name}_${ctx.from?.id}`;

    delete session[key];

    if (ctx.scene) {
      await ctx.scene.leave();
    }
  }

  /**
   * Get cache key for context
   */
  protected getCacheKey(ctx: T, suffix?: string): string {
    const base = `${this.config.name}_${ctx.from?.id}`;
    return suffix ? `${base}_${suffix}` : base;
  }

  /**
   * Get from cache
   */
  protected getCached<T>(key: string): T | null {
    return this.cache.get(key);
  }

  /**
   * Set cache
   */
  protected setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, data, ttl);
  }

  /**
   * Check if scene timed out
   */
  protected isExpired(ctx: T): boolean {
    const state = this.getSceneState(ctx);
    const now = Date.now();

    if (!this.config.ttl) {
      return false;
    }

    return now - state.startedAt.getTime() > this.config.ttl;
  }
}

/**
 * Wizard scene handler for multi-step flows
 */
export abstract class WizardSceneHandler<T extends Context & { scene?: any; session?: any }> extends BaseSceneHandler<T> {
  protected steps: SceneStep<T>[];

  constructor(runtime: IAgentRuntime, config: SceneConfig, steps: SceneStep<T>[]) {
    super(runtime, config);
    this.steps = steps;

    if (!config.maxSteps) {
      config.maxSteps = steps.length;
    }
  }

  /**
   * Get current step
   */
  protected getCurrentStep(ctx: T): SceneStep<T> | null {
    const state = this.getSceneState(ctx);
    return this.steps[state.step] || null;
  }

  /**
   * Move to next step
   */
  protected async nextStep(ctx: T): Promise<void> {
    const state = this.getSceneState(ctx);

    if (state.step >= this.steps.length - 1) {
      await this.leaveScene(ctx);
      return;
    }

    this.updateSceneState(ctx, {
      step: state.step + 1,
    });

    await this.executeCurrentStep(ctx);
  }

  /**
   * Execute current step
   */
  async executeCurrentStep(ctx: T): Promise<void> {
    const step = this.getCurrentStep(ctx);

    if (!step) {
      await this.leaveScene(ctx);
      return;
    }

    // Check expiration
    if (this.isExpired(ctx)) {
      await ctx.reply('⏱️ Сцена истекла. Начните заново.');
      await this.leaveScene(ctx);
      return;
    }

    try {
      // Validate if validator exists
      if (step.validator && !(await step.validator(ctx))) {
        this.logger.warn(`[${this.constructor.name}] Step validation failed`);
        return;
      }

      // Execute with retry
      await this.executeWithRetry(() => step.handler(ctx));
    } catch (error) {
      if (step.onError) {
        await step.onError(ctx, error as Error);
      } else {
        await this.handleError(ctx, error as Error);
      }
    }
  }

  /**
   * Handle callback query (button presses)
   */
  async handleCallback(ctx: T): Promise<void> {
    await this.executeCurrentStep(ctx);
  }

  /**
   * Handle text input
   */
  async handleText(ctx: T): Promise<void> {
    await this.executeCurrentStep(ctx);
  }

  /**
   * Handle scene enter
   */
  async enter(ctx: T): Promise<void> {
    // Initialize state
    this.getSceneState(ctx);

    // Execute first step
    await this.executeCurrentStep(ctx);
  }

  /**
   * Handle scene leave
   */
  async leave(ctx: T): Promise<void> {
    await this.leaveScene(ctx);
  }

  /**
   * Reset to first step
   */
  async reset(ctx: T): Promise<void> {
    this.updateSceneState(ctx, {
      step: 0,
      data: {},
      startedAt: new Date(),
    });

    await this.enter(ctx);
  }
}

/**
 * Simple scene handler for single-step operations
 */
export abstract class SimpleSceneHandler<T extends Context & { scene?: any; session?: any }> extends BaseSceneHandler<T> {
  constructor(runtime: IAgentRuntime, config: SceneConfig) {
    super(runtime, config);
  }

  /**
   * Handle scene enter
   */
  async enter(ctx: T): Promise<void> {
    try {
      await this.executeWithRetry(() => this.processInput(ctx));
      await this.leaveScene(ctx);
    } catch (error) {
      await this.handleError(ctx, error as Error);
    }
  }
}

/**
 * Scene builder utility
 */
export class SceneBuilder<T extends Context> {
  private steps: SceneStep<T>[] = [];

  addStep(step: SceneStep<T>): SceneBuilder<T> {
    this.steps.push(step);
    return this;
  }

  build(): SceneStep<T>[] {
    return [...this.steps];
  }
}
