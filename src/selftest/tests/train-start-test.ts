/**
 * 🧪 Тест: /train start
 *
 * Проверяет, что команда /train start создаёт сессию обучения.
 */

import { IAgentRuntime } from '@elizaos/core';
import { BaseTest, TestResult } from '../base-test';

export class TrainStartTest extends BaseTest {
  id = 'train-start';
  name = '/train start';
  description = 'Tests that /train start command creates a training session';

  protected async run(
    runtime: IAgentRuntime,
    chatId: string
  ): Promise<Omit<TestResult, 'timestamp' | 'duration' | 'testId' | 'testName'>> {
    // Ждём появления Telegram client (может инициализироваться позже)
    let telegramClient: any = null;

    for (let i = 0; i < 10; i++) {
      telegramClient = runtime.clients?.find(
        (client: any) => client.constructor.name === 'TelegramClientInterface'
      );

      if (telegramClient) break;

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!telegramClient) {
      return this.failure('Telegram client not found after waiting 5s');
    }

    // Отправляем команду
    await telegramClient.sendMessage(
      chatId,
      '/train start TestModel test_trigger'
    );

    // Ждём обработки
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Проверяем создание сессии
    const photoCollectorService = runtime.getService('photoCollector') as any;

    if (!photoCollectorService) {
      return this.failure('PhotoCollectorService not found');
    }

    const session = photoCollectorService.getSession?.(chatId);

    if (!session) {
      return this.failure('Session not created');
    }

    return this.success(`Session created: ${session.modelName}`, {
      modelName: session.modelName,
      triggerWord: session.triggerWord,
      quality: session.quality,
    });
  }
}
