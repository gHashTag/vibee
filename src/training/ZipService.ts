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
  private async downloadPhoto(botToken: string, filePath: string): Promise<Buffer> {
    const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
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
      throw new Error('TELEGRAM_BOT_TOKEN not found');
    }

    logger.info(`[ZipService] Creating ZIP for ${photos.length} photos`);

    // Создаём временную папку для сессии
    const tempDir = path.join('/tmp/vibee-training', sessionId);
    fs.mkdirSync(tempDir, { recursive: true });

    // Скачиваем все фото
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      logger.info(`[ZipService] Downloading photo ${i + 1}/${photos.length}`);

      const photoData = await this.downloadPhoto(BOT_TOKEN, photo.filePath);
      const filename = `photo_${i + 1}.jpg`;
      fs.writeFileSync(path.join(tempDir, filename), photoData);
    }

    // Создаём ZIP
    logger.info('[ZipService] Creating ZIP archive');
    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);

    const zipPath = path.join('/tmp/vibee-training', `${sessionId}.zip`);
    zip.writeZip(zipPath);

    // Очищаем временную папку с фото
    fs.rmSync(tempDir, { recursive: true });

    logger.info(`[ZipService] ✅ ZIP created: ${zipPath}`);
    return zipPath;
  }

  /**
   * Загрузить ZIP на file.io (бесплатный временный хостинг)
   */
  async uploadToFileIo(zipPath: string): Promise<string> {
    logger.info('[ZipService] Uploading ZIP to file.io');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(zipPath));

    const response = await axios.post('https://file.io', formData, {
      headers: formData.getHeaders(),
    });

    if (!response.data.success) {
      throw new Error('Failed to upload to file.io');
    }

    const url = response.data.link;
    logger.info(`[ZipService] ✅ Uploaded to: ${url}`);

    // Удаляем локальный ZIP
    fs.unlinkSync(zipPath);

    return url;
  }

  async stop(): Promise<void> {
    logger.info('[ZipService] Stopping...');
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}
