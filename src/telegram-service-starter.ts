import { Service, logger, type IAgentRuntime } from '@elizaos/core';

/**
 * Сервис, который форсированно стартует TelegramService при инициализации.
 *
 * Проблема: ElizaOS не стартует сервисы из плагинов, загруженных как строки
 * в character.plugins. Этот сервис обходит эту проблему, вручную вызывая
 * TelegramService.start() при инициализации.
 */
class TelegramServiceStarter extends Service {
  static serviceType = 'telegram-service-starter';

  static async start(runtime: IAgentRuntime): Promise<TelegramServiceStarter> {
    const service = new TelegramServiceStarter(runtime);
    await service.initialize(runtime);
    return service;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('🚀 TelegramServiceStarter: Checking TelegramService status...');

    try {
      // Проверяем, есть ли уже TelegramService
      const existingService = runtime.getService('telegram');

      if (existingService && existingService.bot) {
        logger.success('✅ TelegramService already exists with active bot - skipping initialization');
        logger.info(`🔍 Service type: ${existingService.constructor.name}`);
        return;
      }

      // Если сервис есть, но бота нет - это проблема с загрузкой плагина из character.plugins
      if (existingService && !existingService.bot) {
        logger.warn('⚠️ TelegramService exists but has no bot! Plugin from character.plugins failed.');
        logger.warn('⚠️ This happens when @elizaos/plugin-telegram is loaded as string in character.plugins');
        logger.warn('⚠️ Skipping force-start to avoid conflicts.');
        return;
      }

      logger.warn('⚠️ TelegramService NOT found in runtime! Will create it manually.');

      // Импортируем TelegramService из плагина
      const telegramPlugin = await import('@elizaos/plugin-telegram');
      const TelegramService = telegramPlugin.TelegramService;

      if (!TelegramService) {
        logger.error('❌ Failed to import TelegramService from @elizaos/plugin-telegram');
        return;
      }

      // Вручную запускаем TelegramService
      logger.info('🔧 Manually starting TelegramService...');

      try {
        const telegramService = await TelegramService.start(runtime);

        if (telegramService && telegramService.bot) {
          logger.success('✅ TelegramService successfully force-started with active bot!');
          logger.success('🤖 Telegram bot is now responding to messages and commands!');

          // Log bot info
          const botInfo = await telegramService.bot.telegram.getMe();
          logger.info(`📱 Bot info: @${botInfo.username} (${botInfo.first_name})`);
        } else {
          logger.error('❌ TelegramService.start() returned service without bot');
          logger.error('❌ Bot will NOT respond to Telegram messages!');
        }
      } catch (startError) {
        logger.error('❌ Failed to start TelegramService.start():', startError);
        logger.error('❌ This is a critical error - bot will not work!');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize TelegramServiceStarter:', error);
    }
  }
}

export default {
  name: 'telegram-service-starter',
  description: 'Force-starts TelegramService on initialization',
  services: [TelegramServiceStarter],
};
