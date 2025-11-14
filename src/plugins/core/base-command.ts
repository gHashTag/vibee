/**
 * Base classes for plugin commands
 */

import type { IAgentRuntime, Logger } from '@elizaos/core';
import type { Context } from 'telegraf';
import { CommandError, ValidationError } from './errors';
import { logger } from '@elizaos/core';
import { withRetry, type RetryOptions } from './retry';
import { CacheService } from './cache';
import { RateLimiter, createRateLimitMiddleware } from './rate-limiter';

/**
 * Command result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Command configuration
 */
export interface CommandConfig {
  name: string;
  description: string;
  aliases?: string[];
  cooldown?: number; // in seconds
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  adminOnly?: boolean;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
  retries?: number;
}

/**
 * Command context
 */
export interface CommandContext extends Context {
  runtime: IAgentRuntime;
  logger: Logger;
  args: string[];
  userId: string;
  chatId: string;
}

/**
 * Abstract base command class
 */
export abstract class BaseCommand {
  protected runtime: IAgentRuntime;
  protected logger: Logger;
  protected config: CommandConfig;
  protected cache: CacheService;
  protected rateLimiter?: RateLimiter;
  private retryOptions: Required<Pick<RetryOptions, 'retries' | 'delay'>>;

  constructor(runtime: IAgentRuntime, config: CommandConfig) {
    this.runtime = runtime;
    this.logger = logger;
    this.config = config;
    this.cache = new CacheService({
      ttl: config.cache?.ttl ?? 60000,
      maxSize: 100,
    });
    this.retryOptions = {
      retries: config.retries ?? 2,
      delay: 500,
    };

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit);
    }
  }

  /**
   * Execute command
   */
  abstract execute(ctx: CommandContext): Promise<CommandResult>;

  /**
   * Handle text input (for TextCommand and CompositeCommand)
   */
  async handleText(text: string, ctx: CommandContext): Promise<CommandResult> {
    return this.execute(ctx);
  }

  /**
   * Validate command arguments
   */
  protected validateArgs(args: string[]): void {
    // Override in subclasses for custom validation
  }

  /**
   * Pre-execution hooks
   */
  protected async beforeExecute(ctx: CommandContext): Promise<void> {
    // Check rate limit
    if (this.rateLimiter) {
      const result = this.rateLimiter.check(ctx.userId);
      if (!result.allowed) {
        throw new CommandError(
          `Rate limit exceeded. Try again in ${Math.ceil(result.resetTime / 1000)} seconds.`,
          this.config.name
        );
      }
    }

    // Check admin permissions
    if (this.config.adminOnly && !this.isAdmin(ctx)) {
      throw new CommandError('Admin access required', this.config.name);
    }

    // Validate arguments
    try {
      this.validateArgs(ctx.args);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : 'Invalid arguments'
      );
    }
  }

  /**
   * Post-execution hooks
   */
  protected async afterExecute(ctx: CommandContext, result: CommandResult): Promise<void> {
    // Override in subclasses for custom logic
  }

  /**
   * Execute with hooks and error handling
   */
  async run(ctx: CommandContext): Promise<CommandResult> {
    try {
      await this.beforeExecute(ctx);

      const result = await withRetry(
        () => this.execute(ctx),
        this.retryOptions
      );

      await this.afterExecute(ctx, result);

      return result;
    } catch (error) {
      this.logger.error(`[${this.constructor.name}] Command failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user is admin
   */
  protected isAdmin(ctx: CommandContext): boolean {
    // Check if user is in admin list
    const admins = process.env.ADMIN_USER_IDS?.split(',') || [];
    return admins.includes(ctx.userId);
  }

  /**
   * Get from cache or execute
   */
  protected async getOrExecute<T>(
    key: string,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await operation();
    this.cache.set(key, result, ttl);
    return result;
  }

  /**
   * Create rate limit middleware
   */
  createMiddleware() {
    if (!this.rateLimiter) {
      return undefined;
    }

    return createRateLimitMiddleware(this.rateLimiter, (ctx: Context) => {
      return String(ctx.from?.id || 'anonymous');
    });
  }

  /**
   * Get command info
   */
  getInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      aliases: this.config.aliases || [],
      cooldown: this.config.cooldown || 0,
      rateLimited: !!this.rateLimiter,
      adminOnly: this.config.adminOnly || false,
    };
  }
}

/**
 * Text command handler
 */
export abstract class TextCommand extends BaseCommand {
  /**
   * Handle text command
   */
  abstract handleText(text: string, ctx: CommandContext): Promise<CommandResult>;
}

/**
 * Callback query command handler
 */
export abstract class CallbackCommand extends BaseCommand {
  /**
   * Handle callback query
   */
  abstract handleCallback(queryData: string, ctx: CommandContext): Promise<CommandResult>;
}

/**
 * Media command handler
 */
export abstract class MediaCommand extends BaseCommand {
  /**
   * Handle media upload
   */
  abstract handleMedia(ctx: CommandContext): Promise<CommandResult>;
}

/**
 * Composite command that handles multiple types
 */
export abstract class CompositeCommand extends BaseCommand {
  /**
   * Handle text input
   */
  abstract handleText(text: string, ctx: CommandContext): Promise<CommandResult>;

  /**
   * Handle callback query
   */
  abstract handleCallback(queryData: string, ctx: CommandContext): Promise<CommandResult>;

  /**
   * Handle media upload
   */
  abstract handleMedia(ctx: CommandContext): Promise<CommandResult>;
}

/**
 * Command builder utility
 */
export class CommandBuilder {
  private config: CommandConfig;

  constructor(name: string, description: string) {
    this.config = {
      name,
      description,
    };
  }

  addAlias(alias: string): CommandBuilder {
    if (!this.config.aliases) {
      this.config.aliases = [];
    }
    this.config.aliases.push(alias);
    return this;
  }

  setCooldown(seconds: number): CommandBuilder {
    this.config.cooldown = seconds;
    return this;
  }

  setRateLimit(windowMs: number, max: number): CommandBuilder {
    this.config.rateLimit = { windowMs, max };
    return this;
  }

  requireAdmin(): CommandBuilder {
    this.config.adminOnly = true;
    return this;
  }

  enableCache(ttl: number = 60000): CommandBuilder {
    this.config.cache = { enabled: true, ttl };
    return this;
  }

  setRetries(retries: number): CommandBuilder {
    this.config.retries = retries;
    return this;
  }

  build(): CommandConfig {
    return { ...this.config };
  }
}

/**
 * Command registry
 */
export class CommandRegistry {
  private commands = new Map<string, BaseCommand>();

  register(command: BaseCommand): void {
    const info = command.getInfo();
    this.commands.set(info.name, command);

    // Register aliases
    info.aliases.forEach(alias => {
      this.commands.set(alias, command);
    });
  }

  get(name: string): BaseCommand | undefined {
    return this.commands.get(name);
  }

  list(): BaseCommand[] {
    return Array.from(this.commands.values());
  }

  listUnique(): BaseCommand[] {
    const unique = new Map<string, BaseCommand>();
    for (const command of this.commands.values()) {
      const info = command.getInfo();
      if (!unique.has(info.name)) {
        unique.set(info.name, command);
      }
    }
    return Array.from(unique.values());
  }
}

/**
 * Command dispatcher
 */
export class CommandDispatcher {
  private registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  async dispatch(commandName: string, ctx: CommandContext): Promise<CommandResult> {
    const command = this.registry.get(commandName);
    if (!command) {
      return {
        success: false,
        error: `Unknown command: ${commandName}`,
      };
    }

    return command.run(ctx);
  }

  async dispatchText(text: string, ctx: CommandContext): Promise<CommandResult> {
    const [commandName, ...args] = text.trim().split(' ');
    const command = this.registry.get(commandName);

    if (!command) {
      return {
        success: false,
        error: `Unknown command: ${commandName}`,
      };
    }

    const commandContext: CommandContext = {
      ...ctx,
      args,
      userId: String(ctx.from?.id || 'unknown'),
      chatId: String(ctx.chat?.id || 'unknown'),
      runtime: ctx.runtime,
      logger: ctx.logger,
    };

    if (command instanceof TextCommand || command instanceof CompositeCommand) {
      return command.run(commandContext);
    }

    return {
      success: false,
      error: `Command ${commandName} does not support text input`,
    };
  }

  async dispatchCallback(queryData: string, ctx: CommandContext): Promise<CommandResult> {
    const command = this.registry.get(queryData);
    if (!command) {
      return {
        success: false,
        error: `Unknown callback: ${queryData}`,
      };
    }

    const commandContext: CommandContext = {
      ...ctx,
      args: [],
      userId: String(ctx.from?.id || 'unknown'),
      chatId: String(ctx.chat?.id || 'unknown'),
      runtime: ctx.runtime,
      logger: ctx.logger,
    };

    if (command instanceof CallbackCommand || command instanceof CompositeCommand) {
      return command.run(commandContext);
    }

    return {
      success: false,
      error: `Command does not support callback queries`,
    };
  }
}
