/**
 * Пример интеграции Scene плагинов в character.ts
 */

import { type Character } from '@elizaos/core';
import { scenesPlugin } from '../scenes-plugin';
import { trainingPlugin } from '../../training-plugin';
import { aiPhotoshopPlugin } from '../../ai-photoshop';

/**
 * Пример character с подключенными Scene плагинами
 */
export const characterWithScenes: Character = {
  name: 'Vibee',
  plugins: [
    // Core plugins
    '@elizaos/plugin-sql',

    // LLM Providers
    ...(process.env.ANTHROPIC_API_KEY?.trim() ? ['@elizaos/plugin-anthropic'] : []),
    ...(process.env.OPENROUTER_API_KEY?.trim() ? ['@elizaos/plugin-openrouter'] : []),
    ...(process.env.OPENAI_API_KEY?.trim() ? ['@elizaos/plugin-openai'] : []),

    // Platform plugins
    ...(process.env.TELEGRAM_BOT_TOKEN?.trim() ? ['@elizaos/plugin-telegram'] : []),

    // Custom plugins
    trainingPlugin,
    aiPhotoshopPlugin,

    // 💎 Scene Plugins - подключаем здесь
    scenesPlugin,

    // Bootstrap
    ...(!process.env.IGNORE_BOOTSTRAP ? ['@elizaos/plugin-bootstrap'] : []),
  ],

  settings: {
    modelProvider: process.env.ANTHROPIC_API_KEY ? 'anthropic' :
                   process.env.OPENROUTER_API_KEY ? 'openrouter' : 'openai',
    voice: process.env.ANTHROPIC_API_KEY ? 'verse' : 'nova',
    price: '1',
  },

  system: `Вы - Vibee, ИИ-наставник по современной разработке...`,
};

/**
 * Альтернативная интеграция - вручную через Service
 * Полезно для динамического включения/выключения сцен
 */
import { IAgentRuntime } from '@elizaos/core';
import { ScenesService } from '../scenes-plugin';

export async function initializeScenes(runtime: IAgentRuntime): Promise<void> {
  await ScenesService.start(runtime);
}

/**
 * Пример использования сцен в custom plugin
 */
import { Plugin } from '@elizaos/core';
import { ScenesService } from '../scenes-plugin';

export const customPluginWithScenes: Plugin = {
  name: 'custom-plugin',
  description: 'Custom plugin with scene integration',

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Сначала инициализируем Scene плагины
    const scenesService = await ScenesService.start(runtime);

    // Затем инициализируем остальной функционал
    // ...
  },

  services: [ScenesService],
};

/**
 * Пример программного перехода к сцене
 * Использование в handler или action
 */
import { Telegraf } from 'telegraf';
import type { SceneContext } from '../types';

export function registerCustomHandlers(bot: Telegraf<SceneContext>): void {
  // Переход к сцене баланса по callback
  bot.action('go_balance', (ctx) => {
    ctx.scene.enter('balanceScene');
  });

  // Переход к сцене помощи по тексту
  bot.hears(/помощь|help/i, (ctx) => {
    ctx.scene.enter('helpScene');
  });

  // Динамический выбор сцены
  bot.action(/^go_scene_(.+)$/, (ctx) => {
    const sceneName = ctx.match[1];
    ctx.scene.enter(`${sceneName}Scene`);
  });
}

/**
 * Пример проверки состояния Scene в middleware
 */
import { Middleware } from 'telegraf';

export const sceneGuardMiddleware: Middleware<SceneContext> = async (ctx, next) => {
  // Проверяем, что пользователь не в процессе выполнения сцены
  if (ctx.scene?.current?.id && ctx.scene.current.id !== 'default') {
    // Если в сцене, перенаправляем обработку в сцену
    return;
  }

  // Иначе продолжаем обработку
  await next();
};

/**
 * Пример интеграции Scene с базой данных
 */
import { getUserBalance, updateUserBalance } from '../../services/balance-service';

export async function handlePayment(sceneContext: SceneContext): Promise<void> {
  const userId = sceneContext.from.id.toString();
  const paymentAmount = sceneContext.session.wizardData.amount;

  // Получаем текущий баланс
  const balance = await getUserBalance(userId);

  // Обновляем баланс
  await updateUserBalance(userId, {
    rubles: balance.rubles + paymentAmount,
  });

  // Отправляем уведомление
  await sceneContext.reply(
    `✅ Баланс пополнен на ${paymentAmount}₽\n` +
    `💰 Текущий баланс: ${balance.rubles + paymentAmount}₽`
  );
}

/**
 * Пример интеграции Scene с webhook
 */
import type { Request, Response } from 'express';

export function handlePaymentWebhook(req: Request, res: Response): void {
  const { order_id, status, amount } = req.body;

  // Обновляем статус платежа в базе
  // await updatePaymentStatus(order_id, status);

  // Отправляем уведомление пользователю
  if (status === 'success') {
    // const telegramService = getTelegramService();
    // telegramService.bot.telegram.sendMessage(
    //   order_id,
    //   `✅ Платёж на сумму ${amount}₽ успешно завершён!`
    // );
  }

  res.status(200).json({ success: true });
}

/**
 * Пример интеграции с очередью обработки
 */
import { Queue } from 'bullmq';

const processingQueue = new Queue('video-processing');

export async function queueVideoProcessing(sceneContext: SceneContext): Promise<void> {
  const { videoUrl, effectType } = sceneContext.session.wizardData;

  // Добавляем задачу в очередь
  await processingQueue.add('process-video', {
    userId: sceneContext.from.id,
    videoUrl,
    effectType,
  });

  // Отправляем уведомление
  await sceneContext.reply(
    '⏳ Видео добавлено в очередь обработки\n' +
    '📊 Статус: В обработке\n' +
    '⏱️ Ориентировочное время: 2-5 минут'
  );
}

/**
 * Пример интеграции с внешними API
 */
import axios from 'axios';

export async function validatePayment(paymentData: any): Promise<boolean> {
  try {
    // Проверяем платёж через API провайдера
    const response = await axios.post('https://api.robokassa.ru/CheckPayment', {
      order_id: paymentData.orderId,
    });

    return response.data.status === 'success';
  } catch (error) {
    console.error('Payment validation failed:', error);
    return false;
  }
}

/**
 * Пример интеграции с кешем
 */
import Redis from 'ioredis';

const redis = new Redis();

export async function cacheUserData(userId: string, data: any): Promise<void> {
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(data));
}

export async function getCachedUserData(userId: string): Promise<any> {
  const cached = await redis.get(`user:${userId}`);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Пример интеграции с логированием
 */
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'scenes.log' }),
    new winston.transports.Console(),
  ],
});

export function logSceneAction(sceneId: string, userId: string, action: string): void {
  logger.info('Scene action', {
    sceneId,
    userId,
    action,
    timestamp: Date.now(),
  });
}

/**
 * Пример интеграции с метриками
 */
import { promClient } from 'prom-client';

const sceneUsageCounter = new promClient.Counter({
  name: 'scene_usage_total',
  help: 'Number of scene usages',
  labelNames: ['scene_id', 'user_action'],
});

export function trackSceneUsage(sceneId: string, action: string): void {
  sceneUsageCounter.inc({ scene_id: sceneId, user_action: action });
}

/**
 * Пример интеграции с аутентификацией
 */
export function checkUserAccess(sceneContext: SceneContext): boolean {
  const userId = sceneContext.from.id;

  // Проверяем, что пользователь авторизован
  // const user = await getUserById(userId);
  // return user && user.isActive;

  return true; // Заглушка
}

/**
 * Пример интеграции с rate limiting
 */
import rateLimit from 'express-rate-limit';

const sceneLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // максимум 30 запросов в минуту
  message: 'Слишком много запросов. Попробуйте позже.',
});

export function rateLimitMiddleware(sceneContext: SceneContext): boolean {
  // Простая проверка на уровне пользователя
  const userId = sceneContext.from.id;
  const key = `rate_limit:${userId}`;
  // const value = await redis.incr(key);
  // if (value === 1) await redis.expire(key, 60);
  // return value <= 30;

  return true; // Заглушка
}

/**
 * Пример интеграции с тестированием
 */
export async function testSceneFlow(sceneId: string): Promise<void> {
  const sceneContext = createMockContext();

  // Выполняем сценарий
  // await scenes[sceneId].middleware()(sceneContext, async () => {});

  // Проверяем результаты
  // expect(sceneContext.reply).toBeCalledWith(...);
}
