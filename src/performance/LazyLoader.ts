/**
 * Lazy Loading for Services
 * Ленивая загрузка сервисов для оптимизации памяти и времени запуска
 */

import { IAgentRuntime, Service } from '@elizaos/core';

export interface LazyServiceConfig {
  name: string;
  factory: () => Promise<Service>;
  dependencies?: string[]; // Service names this service depends on
  preloadOnInit?: boolean; // Whether to preload immediately
  preloadDelayMs?: number; // Delay before preloading
}

export class LazyServiceLoader {
  private services = new Map<string, LazyServiceConfig>();
  private loadedServices = new Map<string, Service>();
  private loadingPromises = new Map<string, Promise<Service>>();
  private runtime: IAgentRuntime | null = null;

  /**
   * Register a service for lazy loading
   */
  register(config: LazyServiceConfig): void {
    this.services.set(config.name, config);

    // Auto-preload if configured
    if (config.preloadOnInit && this.runtime) {
      this.preload(config.name, config.preloadDelayMs || 0);
    }
  }

  /**
   * Set the runtime (called during initialization)
   */
  setRuntime(runtime: IAgentRuntime): void {
    this.runtime = runtime;

    // Preload services marked for auto-preload
    for (const config of this.services.values()) {
      if (config.preloadOnInit) {
        this.preload(config.name, config.preloadDelayMs || 0);
      }
    }
  }

  /**
   * Get a service (loads it if not already loaded)
   */
  async get<T extends Service>(name: string): Promise<T> {
    // Check if already loaded
    if (this.loadedServices.has(name)) {
      return this.loadedServices.get(name) as T;
    }

    // Check if currently loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)! as Promise<T>;
    }

    // Load the service
    const service = await this.loadService(name);
    return service as T;
  }

  /**
   * Check if a service is loaded
   */
  isLoaded(name: string): boolean {
    return this.loadedServices.has(name);
  }

  /**
   * Preload a service
   */
  async preload(name: string, delayMs = 0): Promise<void> {
    if (this.loadedServices.has(name) || this.loadingPromises.has(name)) {
      return; // Already loaded or loading
    }

    const config = this.services.get(name);
    if (!config) {
      throw new Error(`Service ${name} not registered`);
    }

    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Start loading in background
    this.loadService(name).catch(error => {
      console.error(`[LazyLoader] Failed to preload service ${name}:`, error);
    });
  }

  /**
   * Load a service and its dependencies
   */
  private async loadService(name: string): Promise<Service> {
    const config = this.services.get(name);
    if (!config) {
      throw new Error(`Service ${name} not registered`);
    }

    // Start loading
    const loadingPromise = (async () => {
      try {
        // Load dependencies first
        if (config.dependencies) {
          await Promise.all(
            config.dependencies.map(dep => this.get(dep))
          );
        }

        // Create the service
        const service = await config.factory();

        // Store in runtime if available
        if (this.runtime) {
          // Register with ElizaOS runtime
          this.runtime.registerService(service);
        }

        // Mark as loaded
        this.loadedServices.set(name, service);

        return service;
      } finally {
        this.loadingPromises.delete(name);
      }
    })();

    this.loadingPromises.set(name, loadingPromise);
    return loadingPromise;
  }

  /**
   * Unload a service (for memory management)
   */
  async unload(name: string): Promise<void> {
    const service = this.loadedServices.get(name);
    if (!service) {
      return; // Not loaded
    }

    try {
      // Call cleanup if available
      if ('cleanup' in service && typeof service.cleanup === 'function') {
        await service.cleanup();
      }

      // Call stop if available
      if ('stop' in service && typeof service.stop === 'function') {
        await service.stop();
      }

      // Remove from runtime
      if (this.runtime) {
        this.runtime.unregisterService(name);
      }

      // Remove from loaded services
      this.loadedServices.delete(name);
    } catch (error) {
      console.error(`[LazyLoader] Error unloading service ${name}:`, error);
    }
  }

  /**
   * Get all loaded services
   */
  getLoadedServices(): string[] {
    return Array.from(this.loadedServices.keys());
  }

  /**
   * Get all registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    return {
      registered: this.services.size,
      loaded: this.loadedServices.size,
      loading: this.loadingPromises.size,
      services: Array.from(this.loadedServices.keys()).map(name => ({
        name,
        serviceType: (this.loadedServices.get(name) as any)?.serviceType || 'unknown',
      })),
    };
  }

  /**
   * Preload multiple services
   */
  async preloadAll(): Promise<void> {
    const promises = Array.from(this.services.values())
      .filter(config => !config.preloadOnInit)
      .map(config => this.preload(config.name));

    await Promise.all(promises);
  }

  /**
   * Unload all loaded services
   */
  async unloadAll(): Promise<void> {
    const unloadPromises = Array.from(this.loadedServices.keys())
      .map(name => this.unload(name));

    await Promise.all(unloadPromises);
  }

  /**
   * Clear all services (for shutdown)
   */
  async shutdown(): Promise<void> {
    // Cancel all loading promises
    this.loadingPromises.clear();

    // Unload all services
    await this.unloadAll();

    // Clear references
    this.loadedServices.clear();
  }
}

// Export singleton lazy loader
export const lazyServiceLoader = new LazyServiceLoader();

/**
 * Decorator for lazy service registration
 */
export function LazyService(config: Omit<LazyServiceConfig, 'name' | 'factory'>) {
  return function<T extends { new(...args: any[]): Service }>(constructor: T) {
    return class extends constructor {
      static serviceName = config.name;
      static serviceConfig = config;
    };
  };
}

/**
 * Helper to register a service
 */
export function registerLazyService(config: LazyServiceConfig): void {
  lazyServiceLoader.register(config);
}

/**
 * Helper to get a lazy service
 */
export function getLazyService<T extends Service>(name: string): Promise<T> {
  return lazyServiceLoader.get<T>(name);
}

/**
 * Hook for React components (if using React)
 */
export function useLazyService<T extends Service>(name: string) {
  const [service, setService] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    getLazyService<T>(name)
      .then(svc => {
        if (isMounted) {
          setService(svc);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [name]);

  return { service, loading, error };
}

// Import React hooks (optional)
declare function useState<T>(initial: T): [T, (value: T) => void];
declare function useEffect(effect: () => void | (() => void)): void;
