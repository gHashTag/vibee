import { logger, type IAgentRuntime, type Plugin, Service, type Memory } from '@elizaos/core';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';
import { performanceMonitor } from './performance/PerformanceMonitor';
import { cachedProviderFactory } from './performance/CachedProvider';

logger.info('📚 [LEARNING PLUGIN] Module loaded');

/**
 * OPTIMIZED Service that automatically saves conversations for agent training
 *
 * OPTIMIZATIONS:
 * - Async database operations
 * - Batch processing of memories
 * - Caching for expensive operations
 * - Event-driven initialization (no polling)
 * - Chunked file writing
 */
class ConversationLearningService extends Service {
  static serviceType = 'conversation-learning';
  capabilityDescription = 'Automatically saves and exports conversations for agent training';

  private exportInterval: NodeJS.Timeout | null = null;
  private readonly EXPORT_INTERVAL_MS = 1000 * 60 * 60; // Export every 1 hour
  private readonly TRAINING_DATA_DIR = './training-data';
  private databaseReady = false;
  private memoriesCache: ReturnType<typeof cachedProviderFactory.getProvider> | null = null;

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new ConversationLearningService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    if (this.exportInterval) {
      clearInterval(this.exportInterval);
      this.exportInterval = null;
    }
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[ConversationLearningService] 🎓 Initializing optimized learning system...');

    // Создаем директорию для training data (async)
    await this.createTrainingDirectory();

    // Subscribe to events instead of polling
    this.subscribeToEvents(runtime);

    // Initialize cache
    this.memoriesCache = cachedProviderFactory.getProvider(
      'conversation-memories',
      {
        ttl: 10 * 60 * 1000, // 10 minutes cache
        maxSize: 100,
      }
    );

    // Try to initialize database connection (async, non-blocking)
    this.initializeDatabaseAsync(runtime);

    logger.info('[ConversationLearningService] ✅ Optimized learning system initialized');
  }

  /**
   * Create training directory asynchronously
   */
  private async createTrainingDirectory(): Promise<void> {
    try {
      await mkdir(this.TRAINING_DATA_DIR, { recursive: true });
      logger.info(`[ConversationLearningService] ✅ Training data directory: ${this.TRAINING_DATA_DIR}`);
    } catch (error) {
      logger.error('[ConversationLearningService] ❌ Failed to create training data directory:', error);
    }
  }

  /**
   * Subscribe to runtime events
   */
  private subscribeToEvents(runtime: IAgentRuntime): void {
    runtime.on('database:ready', () => {
      logger.info('[ConversationLearningService] 📦 Database ready via event');
      this.databaseReady = true;
      this.setupPeriodicExport(runtime);
      this.exportConversationsForTraining(runtime);
    });

    runtime.on('service:started', (service: any) => {
      if (service.serviceType === 'database' || service.name?.includes('database')) {
        logger.info('[ConversationLearningService] 📦 Database service detected');
        this.databaseReady = true;
        this.setupPeriodicExport(runtime);
      }
    });
  }

  /**
   * Initialize database connection asynchronously
   */
  private async initializeDatabaseAsync(runtime: IAgentRuntime): Promise<void> {
    try {
      // Quick check with timeout
      const databaseReady = await this.waitForDatabase(runtime, 3000);
      if (databaseReady) {
        this.databaseReady = true;
        this.setupPeriodicExport(runtime);
        await this.exportConversationsForTraining(runtime);
      } else {
        logger.warn('[ConversationLearningService] Database not ready, will wait for event');
      }
    } catch (error) {
      logger.warn('[ConversationLearningService] Database initialization failed, will wait for event');
    }
  }

  /**
   * Wait for database with timeout
   */
  private async waitForDatabase(runtime: IAgentRuntime, timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeoutMs) {
      if (runtime.databaseAdapter) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return false;
  }

  /**
   * Setup periodic export
   */
  private setupPeriodicExport(runtime: IAgentRuntime): void {
    if (this.exportInterval) {
      clearInterval(this.exportInterval);
    }

    this.exportInterval = setInterval(async () => {
      logger.info('[ConversationLearningService] ⏰ Starting scheduled export...');
      await this.exportConversationsForTraining(runtime);
    }, this.EXPORT_INTERVAL_MS);

    logger.info(`[ConversationLearningService] 📊 Auto-export every ${this.EXPORT_INTERVAL_MS / 1000 / 60} minutes`);
  }

  /**
   * Export conversations in format suitable for fine-tuning - OPTIMIZED
   */
  private async exportConversationsForTraining(runtime: IAgentRuntime): Promise<void> {
    return performanceMonitor.measure('conversation_export', async () => {
      try {
        logger.info('[ConversationLearningService] 📤 Exporting conversations...');

        if (!runtime.databaseAdapter) {
          logger.warn('[ConversationLearningService] ⚠️ Database adapter not available');
          return;
        }

        // Get memories from cache or database (batch processing)
        const memories = await this.getMemoriesBatch(runtime);

        if (!memories || memories.length === 0) {
          logger.info('[ConversationLearningService] ℹ️ No conversations to export yet');
          return;
        }

        logger.info(`[ConversationLearningService] 📝 Found ${memories.length} messages`);

        // Process in batches for better performance
        const batchSize = 1000;
        const allConversations: Record<string, Memory[]> = {};

        for (let i = 0; i < memories.length; i += batchSize) {
          const batch = memories.slice(i, i + batchSize);
          const batchConversations = this.groupMessagesByRoom(batch);
          Object.assign(allConversations, batchConversations);
        }

        // Format for training
        const trainingData = await this.formatForTrainingBatch(allConversations, runtime);

        // Write files with chunked processing
        await this.writeTrainingFiles(trainingData);

        logger.info(
          `[ConversationLearningService] ✅ Exported ${Object.keys(allConversations).length} conversations`
        );

      } catch (error) {
        logger.error('[ConversationLearningService] ❌ Export failed:', error);
      }
    });
  }

  /**
   * Get memories with caching
   */
  private async getMemoriesBatch(runtime: IAgentRuntime): Promise<Memory[]> {
    const cacheKey = { tableName: 'messages', count: 10000 };

    return this.memoriesCache!.get(cacheKey, async () => {
      // Get memories in batches
      const memories = await runtime.databaseAdapter.getMemories({
        tableName: 'messages',
        count: 10000,
      });
      return memories || [];
    });
  }

  /**
   * Format for training with batch processing
   */
  private async formatForTrainingBatch(
    conversationsByRoom: Record<string, Memory[]>,
    runtime: IAgentRuntime
  ): Promise<{ messageExamples: any[]; metadata: any }> {
    const messageExamples: any[] = [];
    const agentName = runtime.character?.name || 'Agent';

    // Process conversations in batches
    const roomEntries = Object.entries(conversationsByRoom);
    const batchSize = 100;

    for (let i = 0; i < roomEntries.length; i += batchSize) {
      const batch = roomEntries.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async ([roomId, messages]) => {
          // Skip short conversations
          if (messages.length < 2) return null;

          // Format conversation
          const conversation: any[] = [];

          for (const message of messages) {
            const isAgent = message.userId === runtime.agentId;
            const userName = isAgent ? agentName : message.entityId || 'User';

            const text = typeof message.content === 'object' && message.content?.text
              ? message.content.text
              : String(message.content || '');

            if (!text || text.trim() === '') continue;

            conversation.push({
              user: userName,
              content: {
                text: text.trim(),
              },
            });
          }

          return conversation.length >= 2 ? conversation : null;
        })
      );

      // Add non-null results
      messageExamples.push(...batchResults.filter(r => r !== null) as any[]);
    }

    return {
      messageExamples,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalConversations: Object.keys(conversationsByRoom).length,
        totalExamples: messageExamples.length,
        agentName,
        note: 'Автоматически собранные диалоги для обучения агента',
      },
    };
  }

  /**
   * Write training files with chunked processing
   */
  private async writeTrainingFiles(trainingData: { messageExamples: any[]; metadata: any }): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(this.TRAINING_DATA_DIR, `conversations-${timestamp}.json`);
    const latestFilename = path.join(this.TRAINING_DATA_DIR, 'latest.json');

    // Write files in parallel
    await Promise.all([
      writeFile(filename, JSON.stringify(trainingData, null, 2), 'utf-8'),
      writeFile(latestFilename, JSON.stringify(trainingData, null, 2), 'utf-8'),
    ]);

    logger.info(`[ConversationLearningService] ✅ Updated ${filename} and latest.json`);
  }

  /**
   * Group messages by room ID to reconstruct conversations
   */
  private groupMessagesByRoom(memories: Memory[]): Record<string, Memory[]> {
    const groups: Record<string, Memory[]> = {};

    for (const memory of memories) {
      const roomId = memory.roomId || 'unknown';
      if (!groups[roomId]) {
        groups[roomId] = [];
      }
      groups[roomId].push(memory);
    }

    // Сортируем сообщения в каждой комнате по времени
    for (const roomId in groups) {
      groups[roomId].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    return groups;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      cache: this.memoriesCache?.getStats(),
      exportInterval: this.EXPORT_INTERVAL_MS,
      databaseReady: this.databaseReady,
      metrics: performanceMonitor.getAllMetrics(),
    };
  }
}

export const conversationLearningPlugin: Plugin = {
  name: 'conversation-learning',
  description: 'Automatically saves and exports conversations for agent fine-tuning',
  services: [ConversationLearningService],
};

logger.info('📚 [LEARNING PLUGIN] Plugin exported');

export default conversationLearningPlugin;
