/**
 * Временный плагин для отладки Telegram токена
 */

import { Plugin, IAgentRuntime, Service, logger } from '@elizaos/core';

class TelegramDebugService extends Service {
  static serviceType = 'telegram-debug';

  static async start(runtime: IAgentRuntime): Promise<TelegramDebugService> {
    const service = new TelegramDebugService();
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🔍 [DEBUG] TelegramDebugService initialize called');

    const token = runtime.getSetting('TELEGRAM_BOT_TOKEN');
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const secretsToken = runtime.character.settings?.secrets?.TELEGRAM_BOT_TOKEN;
    const envSettingToken = runtime.character.settings?.env?.TELEGRAM_BOT_TOKEN;

    logger.info(`🔍 [DEBUG] runtime.getSetting('TELEGRAM_BOT_TOKEN'): ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    logger.info(`🔍 [DEBUG] process.env.TELEGRAM_BOT_TOKEN: ${envToken ? envToken.substring(0, 10) + '...' : 'undefined'}`);
    logger.info(`🔍 [DEBUG] character.settings.secrets.TELEGRAM_BOT_TOKEN: ${secretsToken ? secretsToken.substring(0, 10) + '...' : 'undefined'}`);
    logger.info(`🔍 [DEBUG] character.settings.env.TELEGRAM_BOT_TOKEN: ${envSettingToken ? envSettingToken.substring(0, 10) + '...' : 'undefined'}`);
  }
}

export const telegramDebugPlugin: Plugin = {
  name: 'telegram-debug',
  description: 'Debug plugin для проверки токена Telegram',
  services: [TelegramDebugService],
  actions: [],
};

export default telegramDebugPlugin;
