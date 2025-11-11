/**
 * IImageProvider Interface
 * Base interface that all image generation providers must implement
 */

import {
  ProviderType,
  ProviderCapabilities,
  GenerationOptions,
  ImageResult,
  TrainingOptions,
  TrainingResult,
  TrainingProgressInfo,
  ModelInfo,
  ProviderConfig,
} from '../../types';

/**
 * Base interface for all image generation providers
 *
 * This interface defines the contract that all providers must implement.
 * Providers can optionally support LoRA training by implementing trainLora and checkTrainingStatus.
 */
export interface IImageProvider {
  /**
   * Provider metadata
   */
  readonly name: string;
  readonly type: ProviderType;
  readonly description: string;

  /**
   * Initialize the provider with configuration
   * Called once when the provider is registered
   *
   * @param config Provider configuration including API keys and settings
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Health check to verify provider is operational
   * Used by the registry to track provider status
   *
   * @returns true if provider is healthy, false otherwise
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get provider capabilities
   * Returns static information about what this provider supports
   *
   * @returns Provider capabilities object
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * List available models
   * Returns dynamic list of models available from this provider
   *
   * @returns Array of model information
   */
  listModels(): Promise<ModelInfo[]>;

  /**
   * Generate image(s) with given options
   * Core method for image generation
   *
   * @param options Generation options including prompt, model, parameters
   * @returns Generated image result
   * @throws ProviderError if generation fails
   */
  generate(options: GenerationOptions): Promise<ImageResult>;

  /**
   * Check if this provider supports LoRA
   *
   * @returns true if LoRA is supported
   */
  supportsLora(): boolean;

  /**
   * Train a LoRA model (optional)
   * Only implemented if provider supports LoRA training
   *
   * @param options Training options including images and parameters
   * @returns Training result with LoRA URL
   * @throws ProviderError if training fails or not supported
   */
  trainLora?(options: TrainingOptions): Promise<TrainingResult>;

  /**
   * Check training status (optional)
   * Only implemented if provider supports LoRA training
   *
   * @param jobId Training job identifier
   * @returns Training progress information
   * @throws ProviderError if status check fails
   */
  checkTrainingStatus?(jobId: string): Promise<TrainingProgressInfo>;

  /**
   * Estimate cost for a generation
   * Used for provider selection based on budget
   *
   * @param options Generation options to estimate cost for
   * @returns Estimated cost in USD
   */
  estimateCost(options: GenerationOptions): number;
}

/**
 * Provider lifecycle hooks (optional)
 * Providers can implement these for additional functionality
 */
export interface IProviderHooks {
  /**
   * Called before generation starts
   * Can modify options or perform validation
   */
  onBeforeGenerate?(options: GenerationOptions): Promise<GenerationOptions>;

  /**
   * Called after generation completes
   * Can modify result or perform cleanup
   */
  onAfterGenerate?(result: ImageResult): Promise<ImageResult>;

  /**
   * Called when generation fails
   * Can implement retry logic or fallback
   */
  onGenerationError?(error: Error, options: GenerationOptions): Promise<void>;

  /**
   * Called periodically to update provider status
   */
  onStatusUpdate?(): Promise<void>;
}
