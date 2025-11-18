/**
 * Sandbox Configuration for Secure Execution
 *
 * Implements Anthropic's dual-boundary approach to sandboxing:
 * - Filesystem isolation
 * - Network isolation
 *
 * @see https://www.anthropic.com/engineering/claude-code-sandboxing
 */

import { elizaLogger } from '@elizaos/core';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import type { SandboxConfig, SandboxEnvironment, SandboxMetrics } from '../types';

const execAsync = promisify(exec);

/**
 * Default sandbox configuration for cloud development
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  enabled: true,

  filesystem: {
    allowedPaths: [
      process.cwd(),
      '/tmp',
      '/var/tmp',
    ],
    blockedPaths: [
      '/etc',
      '/root',
      '/home',
      '~/.ssh',
      '~/.gnupg',
      '~/.aws',
      '~/.config',
    ],
    workingDirectory: process.cwd(),
    readOnly: false,
  },

  network: {
    allowedDomains: [
      'api.openai.com',
      'api.anthropic.com',
      'api.telegram.org',
      'generativelanguage.googleapis.com',
      'api.replicate.com',
      'fal.run',
      'api.stability.ai',
      'api.elevenlabs.io',
      'huggingface.co',
      'api.infisical.com',
      'github.com',
      'api.github.com',
      'registry.npmjs.org',
      'bun.sh',
    ],
    blockedDomains: [],
    allowLocalhost: true,
    proxyUrl: undefined,
  },

  resources: {
    maxMemoryMb: 2048,
    maxCpuPercent: 80,
    maxDiskMb: 5120,
    timeoutMs: 300000, // 5 minutes
  },

  git: {
    allowedBranches: ['main', 'master', 'develop', 'feature/*', 'claude/*'],
    blockedBranches: [],
    allowForcePush: false,
    signCommits: false,
  },
};

/**
 * Sandbox Manager for secure execution
 */
export class SandboxManager {
  private config: SandboxConfig;
  private environments: Map<string, SandboxEnvironment> = new Map();

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_SANDBOX_CONFIG, config);
  }

  /**
   * Create a new sandbox environment
   */
  async createEnvironment(id?: string): Promise<SandboxEnvironment> {
    const envId = id || `sandbox-${Date.now()}`;

    const environment: SandboxEnvironment = {
      id: envId,
      config: this.config,
      status: 'active',
      createdAt: new Date(),
      metrics: {
        memoryUsedMb: 0,
        cpuPercent: 0,
        diskUsedMb: 0,
        networkBytesIn: 0,
        networkBytesOut: 0,
        executionCount: 0,
      },
    };

    this.environments.set(envId, environment);
    elizaLogger.info(`[Sandbox] Created environment ${envId}`);

    return environment;
  }

  /**
   * Validate filesystem access
   */
  validateFilesystemAccess(filepath: string): boolean {
    if (!this.config.enabled) return true;

    const absolutePath = path.resolve(filepath);

    // Check blocked paths first
    for (const blocked of this.config.filesystem.blockedPaths) {
      const resolvedBlocked = this.resolvePath(blocked);
      if (absolutePath.startsWith(resolvedBlocked)) {
        elizaLogger.warn(`[Sandbox] Blocked filesystem access: ${absolutePath}`);
        return false;
      }
    }

    // Check allowed paths
    for (const allowed of this.config.filesystem.allowedPaths) {
      const resolvedAllowed = this.resolvePath(allowed);
      if (absolutePath.startsWith(resolvedAllowed)) {
        return true;
      }
    }

    elizaLogger.warn(`[Sandbox] Filesystem access denied (not in allowed paths): ${absolutePath}`);
    return false;
  }

  /**
   * Validate network access
   */
  validateNetworkAccess(url: string): boolean {
    if (!this.config.enabled) return true;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check localhost
      if (domain === 'localhost' || domain === '127.0.0.1') {
        return this.config.network.allowLocalhost;
      }

      // Check blocked domains
      for (const blocked of this.config.network.blockedDomains) {
        if (domain === blocked || domain.endsWith(`.${blocked}`)) {
          elizaLogger.warn(`[Sandbox] Blocked network access: ${domain}`);
          return false;
        }
      }

      // Check allowed domains
      for (const allowed of this.config.network.allowedDomains) {
        if (domain === allowed || domain.endsWith(`.${allowed}`)) {
          return true;
        }
      }

      elizaLogger.warn(`[Sandbox] Network access denied (not in allowed domains): ${domain}`);
      return false;
    } catch (error) {
      elizaLogger.error(`[Sandbox] Invalid URL: ${url}`);
      return false;
    }
  }

  /**
   * Validate git operation
   */
  validateGitOperation(operation: string, branch?: string): boolean {
    if (!this.config.enabled) return true;

    // Check force push
    if (operation.includes('--force') || operation.includes('-f')) {
      if (!this.config.git.allowForcePush) {
        elizaLogger.warn('[Sandbox] Force push is not allowed');
        return false;
      }
    }

    // Validate branch if provided
    if (branch) {
      // Check blocked branches
      for (const blocked of this.config.git.blockedBranches) {
        if (this.matchBranchPattern(branch, blocked)) {
          elizaLogger.warn(`[Sandbox] Branch ${branch} is blocked`);
          return false;
        }
      }

      // Check allowed branches
      let allowed = false;
      for (const pattern of this.config.git.allowedBranches) {
        if (this.matchBranchPattern(branch, pattern)) {
          allowed = true;
          break;
        }
      }

      if (!allowed) {
        elizaLogger.warn(`[Sandbox] Branch ${branch} is not in allowed list`);
        return false;
      }
    }

    return true;
  }

  /**
   * Execute command in sandbox
   */
  async executeCommand(
    command: string,
    environmentId?: string
  ): Promise<{ stdout: string; stderr: string; success: boolean }> {
    const env = environmentId ? this.environments.get(environmentId) : undefined;

    if (env) {
      env.metrics.executionCount++;
    }

    // Basic command validation
    const blockedCommands = ['rm -rf /', 'mkfs', 'dd if=/dev/zero', ':(){:|:&};:'];
    for (const blocked of blockedCommands) {
      if (command.includes(blocked)) {
        elizaLogger.error(`[Sandbox] Blocked dangerous command: ${command}`);
        return {
          stdout: '',
          stderr: 'Command blocked by sandbox security policy',
          success: false,
        };
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.filesystem.workingDirectory,
        timeout: this.config.resources.timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return { stdout, stderr, success: true };
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message || 'Command execution failed',
        success: false,
      };
    }
  }

  /**
   * Get sandbox metrics
   */
  async getMetrics(environmentId: string): Promise<SandboxMetrics | null> {
    const env = this.environments.get(environmentId);
    if (!env) return null;

    // Update metrics (in production, this would use actual system calls)
    try {
      const memUsage = process.memoryUsage();
      env.metrics.memoryUsedMb = Math.round(memUsage.heapUsed / (1024 * 1024));
    } catch {
      // Ignore metric collection errors
    }

    return env.metrics;
  }

  /**
   * Terminate sandbox environment
   */
  async terminateEnvironment(environmentId: string): Promise<boolean> {
    const env = this.environments.get(environmentId);
    if (!env) return false;

    env.status = 'terminated';
    elizaLogger.info(`[Sandbox] Terminated environment ${environmentId}`);

    return true;
  }

  /**
   * Generate sandbox configuration for cloud deployment
   */
  generateCloudConfig(): Record<string, unknown> {
    return {
      version: '1.0',
      sandbox: {
        enabled: this.config.enabled,
        filesystem: {
          allowed: this.config.filesystem.allowedPaths,
          blocked: this.config.filesystem.blockedPaths,
          workdir: this.config.filesystem.workingDirectory,
        },
        network: {
          allowed: this.config.network.allowedDomains,
          blocked: this.config.network.blockedDomains,
          localhost: this.config.network.allowLocalhost,
        },
        resources: this.config.resources,
        git: this.config.git,
      },
    };
  }

  /**
   * Check if path matches pattern (with wildcards)
   */
  private matchBranchPattern(branch: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(branch);
    }
    return branch === pattern;
  }

  /**
   * Resolve path with home directory expansion
   */
  private resolvePath(filepath: string): string {
    if (filepath.startsWith('~')) {
      const home = process.env.HOME || '/home/user';
      return path.resolve(filepath.replace('~', home));
    }
    return path.resolve(filepath);
  }

  /**
   * Deep merge configuration
   */
  private mergeConfig(base: SandboxConfig, override: Partial<SandboxConfig>): SandboxConfig {
    return {
      enabled: override.enabled ?? base.enabled,
      filesystem: {
        ...base.filesystem,
        ...override.filesystem,
      },
      network: {
        ...base.network,
        ...override.network,
      },
      resources: {
        ...base.resources,
        ...override.resources,
      },
      git: {
        ...base.git,
        ...override.git,
      },
    };
  }
}

/**
 * Create a sandbox manager with default configuration
 */
export function createSandbox(config?: Partial<SandboxConfig>): SandboxManager {
  return new SandboxManager(config);
}

/**
 * Quick validation helpers
 */
export const sandboxValidators = {
  /**
   * Validate file path access
   */
  canAccessFile: (filepath: string, config?: Partial<SandboxConfig>): boolean => {
    const sandbox = createSandbox(config);
    return sandbox.validateFilesystemAccess(filepath);
  },

  /**
   * Validate network URL access
   */
  canAccessNetwork: (url: string, config?: Partial<SandboxConfig>): boolean => {
    const sandbox = createSandbox(config);
    return sandbox.validateNetworkAccess(url);
  },

  /**
   * Validate git operation
   */
  canPerformGitOperation: (
    operation: string,
    branch?: string,
    config?: Partial<SandboxConfig>
  ): boolean => {
    const sandbox = createSandbox(config);
    return sandbox.validateGitOperation(operation, branch);
  },
};
