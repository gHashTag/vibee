/**
 * Base types for Provider Plugins
 * Core interfaces and types used by all provider plugins
 */

/**
 * Plugin health status
 */
export type PluginHealthStatus = {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastChecked: Date;
  statusCode?: number;
};

/**
 * Provider type enumeration
 */
export type ProviderType =
  | 'kie'
  | 'replicate'
  | 'fal'
  | 'elevenlabs'
  | 'openai'
  | 'heygen'
  | 'huggingface'
  | 'runway'
  | 'midjourney'
  | 'apify';

/**
 * Content type enumeration
 */
export type ContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'model'
  | 'voice'
  | 'avatar';

/**
 * Generation parameters specific to provider
 */
export interface ProviderGenerationParams {
  prompt: string;
  model?: string;
  [key: string]: any;
}

/**
 * Generation result
 */
export interface ProviderResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  cost?: number;
  executionTime?: number;
}

/**
 * Provider plugin interface
 */
export interface ProviderPlugin {
  id: string;
  name: string;
  version: string;
  type: 'provider';
  providerName: string;
  supportedTypes: ContentType[];
  generate: (params: ProviderGenerationParams) => Promise<ProviderResult>;
  healthCheck: () => Promise<PluginHealthStatus>;
  register: (registry: PluginRegistry) => void;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  modelSettings?: Record<string, any>;
  failOver?: {
    enabled: boolean;
    providers?: string[];
    maxRetries?: number;
  };
}

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  registerProvider(provider: ProviderPlugin): void;
  getProvider(name: string): ProviderPlugin | undefined;
  listProviders(): ProviderPlugin[];
  unregisterProvider(name: string): void;
  healthCheck(name: string): Promise<PluginHealthStatus>;
}

/**
 * Failover chain configuration
 */
export interface FailoverConfig {
  enabled: boolean;
  providers: string[];
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  type: ContentType;
  description?: string;
  supportedFeatures: string[];
  cost?: number;
  latency?: number;
  accuracy?: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokenCost?: number;
}

/**
 * Metrics for provider monitoring
 */
export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  costTotal: number;
  uptime: number;
  lastRequestAt?: Date;
}

/**
 * Logging levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logging interface
 */
export interface LogContext {
  provider: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}
