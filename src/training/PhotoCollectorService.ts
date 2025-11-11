/**
 * Photo Collector Service
 * Простой сервис для сбора фото из Telegram для обучения LoRA
 */

import { Service, IAgentRuntime, ServiceType, logger } from '@elizaos/core';

interface TrainingSession {
  userId: string;
  faceName: string;
  triggerWord: string;
  photos: TelegramPhoto[];
  createdAt: number;
}

interface TelegramPhoto {
  fileId: string;
  filePath: string;
  fileSize: number;
  addedAt: number;
}

export class PhotoCollectorService extends Service {
  static serviceType: ServiceType = 'photo-collector' as ServiceType;
  capabilityDescription = 'Collects photos from Telegram for LoRA training';

  // Храним сессии в памяти (для теста, потом можно в БД)
  private sessions: Map<string, TrainingSession> = new Map();

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[PhotoCollectorService] 🎨 Initialized - ready to collect photos');
    logger.info('[PhotoCollectorService] 📊 Current sessions:', this.sessions.size);
  }

  static async start(runtime: IAgentRuntime): Promise<PhotoCollectorService> {
    const service = new PhotoCollectorService(runtime);
    await service.initialize(runtime);
    return service;
  }

  /**
   * Создать новую сессию сбора фото
   */
  createSession(userId: string, faceName: string, triggerWord: string): TrainingSession {
    const session: TrainingSession = {
      userId,
      faceName,
      triggerWord,
      photos: [],
      createdAt: Date.now(),
    };

    this.sessions.set(userId, session);
    logger.info(`[PhotoCollector] ✅ Created session for ${userId}: ${faceName} (trigger: ${triggerWord})`);
    logger.info(`[PhotoCollector] 📊 Total active sessions: ${this.sessions.size}`);

    return session;
  }

  /**
   * Получить активную сессию пользователя
   */
  getActiveSession(userId: string): TrainingSession | null {
    return this.sessions.get(userId) || null;
  }

  /**
   * Добавить фото к сессии
   */
  addPhoto(userId: string, fileId: string, filePath: string, fileSize: number): number {
    const session = this.sessions.get(userId);
    if (!session) {
      logger.error(`[PhotoCollector] ❌ No active session for user ${userId}`);
      throw new Error('No active session');
    }

    session.photos.push({
      fileId,
      filePath,
      fileSize,
      addedAt: Date.now(),
    });

    logger.info(`[PhotoCollector] 📸 Added photo ${session.photos.length} for ${userId} (fileId: ${fileId.substring(0, 20)}...)`);
    logger.info(`[PhotoCollector] 📊 Session progress: ${session.photos.length}/20 photos`);

    return session.photos.length;
  }

  /**
   * Завершить сессию
   */
  completeSession(userId: string): TrainingSession | null {
    const session = this.sessions.get(userId);
    if (!session) {
      logger.warn(`[PhotoCollector] No active session for ${userId}`);
      return null;
    }

    this.sessions.delete(userId);
    return session;
  }

  /**
   * Отменить сессию
   */
  cancelSession(userId: string): void {
    this.sessions.delete(userId);
    logger.info(`[PhotoCollector] Cancelled session for ${userId}`);
  }

  async stop(): Promise<void> {
    logger.info('[PhotoCollectorService] Stopping...');
    this.sessions.clear();
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
