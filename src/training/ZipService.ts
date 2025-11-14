/**
 * ZIP Service
 * Создание ZIP архивов из фото Telegram для отправки на fal.ai
 */

import { Service, IAgentRuntime, ServiceType, logger } from '@elizaos/core';
import AdmZip from 'adm-zip';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

export class ZipService extends Service {
  static serviceType: ServiceType = 'zip-service' as ServiceType;
  capabilityDescription = 'Creates ZIP archives from Telegram photos';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Создаём временную папку если её нет
    const tempDir = '/tmp/vibee-training';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    logger.info('[ZipService] Initialized');
  }

  static async start(runtime: IAgentRuntime): Promise<ZipService> {
    const service = new ZipService(runtime);
    await service.initialize(runtime);
    return service;
  }

  /**
   * Скачать фото из Telegram
   */
  private async downloadPhoto(botToken: string, filePath: string, retries = 3): Promise<Buffer> {
    const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 seconds timeout
        });
        return Buffer.from(response.data);
      } catch (error) {
        logger.error(`[ZipService] Download attempt ${attempt}/${retries} failed:`, error);

        if (attempt === retries) {
          throw new Error(`Failed to download photo after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }

    throw new Error('Download failed unexpectedly');
  }

  /**
   * Создать ZIP из фото Telegram
   */
  async createZipFromTelegramPhotos(
    photos: Array<{ fileId: string; filePath: string }>,
    sessionId: string
  ): Promise<string> {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not found in environment');
    }

    if (!photos || photos.length === 0) {
      throw new Error('No photos provided for ZIP creation');
    }

    logger.info(`[ZipService] Creating ZIP for ${photos.length} photos`);

    // Создаём временную папку для сессии
    const tempDir = path.join('/tmp/vibee-training', sessionId);
    let zipPath: string | null = null;

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Скачиваем все фото
      const downloadedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        logger.info(`[ZipService] Downloading photo ${i + 1}/${photos.length}`);

        try {
          const photoData = await this.downloadPhoto(BOT_TOKEN, photo.filePath);
          const filename = `photo_${i + 1}.jpg`;
          const photoPath = path.join(tempDir, filename);
          fs.writeFileSync(photoPath, photoData);
          downloadedPhotos.push(photoPath);
        } catch (error) {
          logger.error(`[ZipService] Failed to download photo ${i + 1}:`, error);
          throw new Error(`Failed to download photo ${i + 1}/${photos.length}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info(`[ZipService] Successfully downloaded ${downloadedPhotos.length} photos`);

      // Создаём ZIP
      logger.info('[ZipService] Creating ZIP archive');
      const zip = new AdmZip();

      // Добавляем файлы по одному для лучшего контроля
      for (const photoPath of downloadedPhotos) {
        zip.addLocalFile(photoPath);
      }

      zipPath = path.join('/tmp/vibee-training', `${sessionId}.zip`);
      zip.writeZip(zipPath);

      // Проверяем что ZIP создался
      if (!fs.existsSync(zipPath)) {
        throw new Error('ZIP file was not created');
      }

      const zipStats = fs.statSync(zipPath);
      logger.info(`[ZipService] ✅ ZIP created: ${zipPath} (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);

      // Очищаем временную папку с фото
      fs.rmSync(tempDir, { recursive: true, force: true });

      return zipPath;
    } catch (error) {
      logger.error('[ZipService] Error creating ZIP:', error);

      // Cleanup: удаляем временные файлы в случае ошибки
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        if (zipPath && fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      } catch (cleanupError) {
        logger.warn('[ZipService] Failed to cleanup temp files:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * Загрузить ZIP на file.io (бесплатный временный хостинг)
   */
  async uploadToFileIo(zipPath: string, retries = 3): Promise<string> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`ZIP file not found: ${zipPath}`);
    }

    const zipStats = fs.statSync(zipPath);
    logger.info(`[ZipService] Uploading ZIP to file.io (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipPath));

        const response = await axios.post('https://file.io', formData, {
          headers: formData.getHeaders(),
          timeout: 60000, // 60 seconds для больших файлов
          maxBodyLength: 100 * 1024 * 1024, // 100 MB max
        });

        if (!response.data || !response.data.success) {
          throw new Error(`Upload failed: ${response.data?.message || 'Unknown error'}`);
        }

        const url = response.data.link;
        if (!url || typeof url !== 'string') {
          throw new Error('Invalid URL received from file.io');
        }

        logger.info(`[ZipService] ✅ Uploaded to: ${url}`);

        // Удаляем локальный ZIP только после успешной загрузки
        try {
          fs.unlinkSync(zipPath);
          logger.info(`[ZipService] ✅ Local ZIP removed: ${zipPath}`);
        } catch (unlinkError) {
          logger.warn(`[ZipService] Failed to remove local ZIP:`, unlinkError);
        }

        return url;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`[ZipService] Upload attempt ${attempt}/${retries} failed:`, error);

        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          logger.info(`[ZipService] Retrying in ${waitTime / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Все попытки провалились
    throw new Error(`Failed to upload to file.io after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  async stop(): Promise<void> {
    logger.info('[ZipService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
