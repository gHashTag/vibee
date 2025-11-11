/**
 * Provider Registry
 * Central registry for managing all image generation providers
 */

import {
  IImageProvider,
  IProviderRegistry,
  ProviderConfig,
  ProviderInfo,
  ProviderSelectionCriteria,
  ProviderStatus,
  ErrorCode,
  ProviderError,
} from '../../types';

/**
 * Provider Registry
 *
 * Responsibilities:
 * - Register and manage providers
 * - Track provider status and health
 * - Select optimal provider based on criteria
 * - Manage provider configurations
 */
export class ProviderRegistry implements IProviderRegistry {
  private providers: Map<string, IImageProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();
  private statuses: Map<string, ProviderStatus> = new Map();
  private activeProviderId: string | null = null;

  // Health check interval (5 minutes)
  private healthCheckInterval = 5 * 60 * 1000;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    // Start periodic health checks
    this.startHealthChecks();
  }

  // ============================================================================
  // Registration
  // ============================================================================

  register(provider: IImageProvider, config: ProviderConfig): void {
    const id = config.id;

    if (this.providers.has(id)) {
      console.warn(`[ProviderRegistry] Provider ${id} is already registered, overwriting`);
    }

    this.providers.set(id, provider);
    this.configs.set(id, config);
    this.statuses.set(id, config.enabled ? 'active' : 'disabled');

    // Initialize provider
    provider
      .initialize(config)
      .then(() => {
        console.log(`[ProviderRegistry] Provider ${id} (${provider.name}) registered successfully`);

        // Set as active if it's the first enabled provider
        if (config.enabled && !this.activeProviderId) {
          this.activeProviderId = id;
          console.log(`[ProviderRegistry] Set ${id} as active provider`);
        }
      })
      .catch((error) => {
        console.error(`[ProviderRegistry] Failed to initialize provider ${id}:`, error);
        this.statuses.set(id, 'error');
      });
  }

  unregister(providerId: string): void {
    if (!this.providers.has(providerId)) {
      console.warn(`[ProviderRegistry] Provider ${providerId} not found`);
      return;
    }

    this.providers.delete(providerId);
    this.configs.delete(providerId);
    this.statuses.delete(providerId);

    // If this was the active provider, select another
    if (this.activeProviderId === providerId) {
      this.activeProviderId = null;
      const nextProvider = this.findNextActiveProvider();
      if (nextProvider) {
        this.activeProviderId = nextProvider;
      }
    }

    console.log(`[ProviderRegistry] Provider ${providerId} unregistered`);
  }

  // ============================================================================
  // Provider Access
  // ============================================================================

  getProvider(providerId: string): IImageProvider | null {
    return this.providers.get(providerId) || null;
  }

  getActiveProvider(): IImageProvider | null {
    if (!this.activeProviderId) {
      return null;
    }

    const provider = this.providers.get(this.activeProviderId);
    const status = this.statuses.get(this.activeProviderId);

    // If active provider is not healthy, try to find another
    if (!provider || status !== 'active') {
      const nextProvider = this.findNextActiveProvider();
      if (nextProvider) {
        this.activeProviderId = nextProvider;
        return this.providers.get(nextProvider) || null;
      }
      return null;
    }

    return provider;
  }

  listProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = [];

    for (const [id, provider] of this.providers.entries()) {
      const config = this.configs.get(id);
      const status = this.statuses.get(id);

      if (config && status) {
        providers.push({
          id,
          type: provider.type,
          name: provider.name,
          enabled: config.enabled,
          status,
          priority: config.priority,
          capabilities: provider.getCapabilities(),
        });
      }
    }

    // Sort by priority (higher first)
    return providers.sort((a, b) => b.priority - a.priority);
  }

  // ============================================================================
  // Provider Selection
  // ============================================================================

  setActiveProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new ProviderError(ErrorCode.PROVIDER_NOT_FOUND, `Provider ${providerId} not found`);
    }

    const config = this.configs.get(providerId);
    if (!config?.enabled) {
      throw new ProviderError(ErrorCode.PROVIDER_DISABLED, `Provider ${providerId} is disabled`);
    }

    const status = this.statuses.get(providerId);
    if (status !== 'active') {
      throw new ProviderError(ErrorCode.PROVIDER_UNAVAILABLE, `Provider ${providerId} is not available`);
    }

    this.activeProviderId = providerId;
    console.log(`[ProviderRegistry] Active provider set to ${providerId}`);
  }

  selectBestProvider(criteria: ProviderSelectionCriteria): IImageProvider | null {
    const providers = this.listProviders();

    // Filter based on criteria
    let candidates = providers.filter((info) => {
      // Must be enabled and active
      if (!info.enabled || info.status !== 'active') {
        return false;
      }

      const capabilities = info.capabilities;

      // Check LoRA requirements
      if (criteria.requiresLora && !capabilities.loraSupport) {
        return false;
      }

      if (criteria.requiresTraining && !capabilities.loraTraining) {
        return false;
      }

      // Check cost constraint
      if (criteria.maxCost !== undefined && capabilities.pricing.generation > criteria.maxCost) {
        return false;
      }

      // Check time constraint
      if (criteria.maxGenerationTime !== undefined && capabilities.averageGenerationTime > criteria.maxGenerationTime) {
        return false;
      }

      // Check model availability
      if (criteria.preferredModels && criteria.preferredModels.length > 0) {
        const hasPreferredModel = criteria.preferredModels.some((model) =>
          capabilities.availableModels.some((available) => available.includes(model))
        );
        if (!hasPreferredModel) {
          return false;
        }
      }

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Sort by priority and cost
    candidates = candidates.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by cost (lower is better)
      return a.capabilities.pricing.generation - b.capabilities.pricing.generation;
    });

    const best = candidates[0];
    return this.providers.get(best.id) || null;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  updateProviderConfig(providerId: string, updates: Partial<ProviderConfig>): void {
    const config = this.configs.get(providerId);
    if (!config) {
      throw new ProviderError(ErrorCode.PROVIDER_NOT_FOUND, `Provider ${providerId} not found`);
    }

    const updatedConfig = { ...config, ...updates };
    this.configs.set(providerId, updatedConfig);

    // Re-initialize provider with new config
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.initialize(updatedConfig).catch((error) => {
        console.error(`[ProviderRegistry] Failed to re-initialize provider ${providerId}:`, error);
        this.statuses.set(providerId, 'error');
      });
    }

    // Update status based on enabled flag
    if (updates.enabled !== undefined) {
      this.statuses.set(providerId, updates.enabled ? 'active' : 'disabled');
    }
  }

  getProviderConfig(providerId: string): ProviderConfig | null {
    return this.configs.get(providerId) || null;
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [id, provider] of this.providers.entries()) {
      const config = this.configs.get(id);

      // Skip disabled providers
      if (!config?.enabled) {
        continue;
      }

      promises.push(
        provider
          .healthCheck()
          .then((healthy) => {
            const newStatus: ProviderStatus = healthy ? 'active' : 'error';
            const oldStatus = this.statuses.get(id);

            if (oldStatus !== newStatus) {
              console.log(`[ProviderRegistry] Provider ${id} status changed: ${oldStatus} -> ${newStatus}`);
              this.statuses.set(id, newStatus);
            }
          })
          .catch((error) => {
            console.error(`[ProviderRegistry] Health check failed for ${id}:`, error);
            this.statuses.set(id, 'error');
          })
      );
    }

    await Promise.all(promises);
  }

  async checkHealth(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    try {
      return await provider.healthCheck();
    } catch (error) {
      console.error(`[ProviderRegistry] Health check error for ${providerId}:`, error);
      return false;
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private findNextActiveProvider(): string | null {
    const providers = this.listProviders();

    for (const info of providers) {
      if (info.enabled && info.status === 'active') {
        return info.id;
      }
    }

    return null;
  }

  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}
