/**
 * Neurophoto Service
 * Integrates multi-provider image generation into ElizaOS
 */

import { Service, IAgentRuntime, ServiceType, logger } from '@elizaos/core';
import { ImageGenerationService } from './services/ImageGenerationService';
import { initializeNeurophotoSchema, migrateNeurophotoSchema } from './database/schema';

export class NeurophotoService extends Service {
  static serviceType: ServiceType = 'neurophoto' as ServiceType;
  capabilityDescription = 'Multi-provider image generation service with LoRA support';

  private imageService: ImageGenerationService;
  private initialized = false;

  constructor() {
    super();
    this.imageService = new ImageGenerationService();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.initialized) {
      logger.info('[NeurophotoService] Already initialized');
      return;
    }

    logger.info('[NeurophotoService] Initializing...');

    try {
      // Initialize image generation service
      logger.info('[NeurophotoService] Initializing image generation service...');
      await this.imageService.initialize(runtime);

      // Note: Database schema will be initialized on first use through the action
      logger.info('[NeurophotoService] Database schema will be initialized on first use');

      this.initialized = true;
      logger.info('[NeurophotoService] ✅ Initialized successfully');
    } catch (error) {
      logger.error('[NeurophotoService] ❌ Initialization failed:', error);
      throw error;
    }
  }

  getImageService(): ImageGenerationService {
    if (!this.initialized) {
      throw new Error('NeurophotoService not initialized. Call initialize() first.');
    }
    return this.imageService;
  }

  static async start(runtime: IAgentRuntime): Promise<NeurophotoService> {
    logger.info('*** Starting Neurophoto Service ***');
    const service = new NeurophotoService();
    await service.initialize(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    logger.info('*** Stopping Neurophoto Service ***');
    const service = runtime.getService<NeurophotoService>(NeurophotoService.serviceType);
    if (service) {
      await service.stop();
    }
  }

  async stop(): Promise<void> {
    logger.info('[NeurophotoService] Stopping...');
    this.initialized = false;
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
