/**
 * Plugin для регистрации всех Scene плагинов
 * Интеграция с Telegram ботом
 */

import { Plugin, IAgentRuntime, Service, logger } from '@elizaos/core';
import { Scenes, Stage, Telegraf } from 'telegraf';
import {
  createLipSyncScene,
  createAiReelsScene,
  createSubscriptionScene,
  createStarPaymentScene,
  createRublePaymentScene,
  createInviteScene,
  createHelpScene,
  createBalanceScene,
  type SceneContext
} from './index';

export class ScenesService extends Service {
  static serviceType = 'scenes';
  capabilityDescription = 'Manages Scene plugins for Telegram bot workflows';

  private stage: Stage<SceneContext> | null = null;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[ScenesService] 🔍 Initializing Scene plugins...');

    // Ждём появления TelegramService
    const maxAttempts = 20;
    let telegramService: any = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService && telegramService.bot) {
        logger.info('[ScenesService] ✅ Found TelegramService with active bot');
        break;
      }
      logger.info(`[ScenesService] Waiting for TelegramService... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!telegramService || !telegramService.bot) {
      logger.warn('[ScenesService] ⚠️ TelegramService not found after waiting');
      return;
    }

    // Создаём и настраиваем Stage для сцен
    this.setupScenes(telegramService.bot);

    logger.info('[ScenesService] ✅ Scene plugins registered successfully');
  }

  private setupScenes(bot: Telegraf<SceneContext>): void {
    // Создаём все сцены
    const scenes = [
      createLipSyncScene(),
      createAiReelsScene(),
      createSubscriptionScene(),
      createStarPaymentScene(),
      createRublePaymentScene(),
      createInviteScene(),
      createHelpScene(),
      createBalanceScene()
    ];

    // Регистрируем сцены в Stage
    this.stage = new Stage<SceneContext>(scenes);

    // Регистрируем middleware для всех сцен
    bot.use(this.stage.middleware());

    // Регистрируем команды для перехода к сценам
    this.registerSceneCommands(bot);
  }

  private registerSceneCommands(bot: Telegraf<SceneContext>): void {
    // Команды для перехода к сценам
    bot.command('lipsync', (ctx) => ctx.scene.enter('lipSyncScene'));
    bot.command('reels', (ctx) => ctx.scene.enter('aiReelsScene'));
    bot.command('subscribe', (ctx) => ctx.scene.enter('subscriptionScene'));
    bot.command('pay_stars', (ctx) => ctx.scene.enter('starPaymentScene'));
    bot.command('pay_rub', (ctx) => ctx.scene.enter('rublePaymentScene'));
    bot.command('invite', (ctx) => ctx.scene.enter('inviteScene'));
    bot.command('help', (ctx) => ctx.scene.enter('helpScene'));
    bot.command('balance', (ctx) => ctx.scene.enter('balanceScene'));

    // Команда для возврата в меню
    bot.command('menu', (ctx) => {
      ctx.reply('🏠 Главное меню', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎬 ИИ Рилсы', callback_data: 'menu_reels' },
              { text: '🎤 Синхронизация губ', callback_data: 'menu_lipsync' }
            ],
            [
              { text: '💫 Подписка', callback_data: 'menu_subscription' },
              { text: '💎 Баланс', callback_data: 'menu_balance' }
            ],
            [
              { text: '👥 Пригласить друга', callback_data: 'menu_invite' },
              { text: '💬 Помощь', callback_data: 'menu_help' }
            ],
            [
              { text: '💳 Оплата', callback_data: 'menu_payment' }
            ]
          ]
        }
      });
    });
  }

  static async start(runtime: IAgentRuntime): Promise<ScenesService> {
    const service = new ScenesService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[ScenesService] Stopping...');
    this.stage = null;
  }

  async cleanup(): Promise<void> {
    await this.stop();
  }
}

/**
 * Главный Plugin для Scene плагинов
 */
export const scenesPlugin: Plugin = {
  name: 'scenes-plugin',
  description: 'Scene plugins for system functions',
  services: [ScenesService],

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[ScenesPlugin] 🚀 Initializing...');
    await ScenesService.start(runtime);
    logger.info('[ScenesPlugin] ✅ Initialized successfully');
  }
};
