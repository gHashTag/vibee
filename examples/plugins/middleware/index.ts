/**
 * Middleware Example
 *
 * Этот плагин демонстрирует создание middleware для перехвата и обработки запросов.
 * Middleware используется для cross-cutting concerns: аутентификация, логирование,
 * rate limiting, валидация и т.д.
 */

import { Plugin, Service, IAgentRuntime, Memory } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Типы для middleware
 */
interface MiddlewareContext {
  message: Memory;
  userId: string;
  roomId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (userId: string) => string;
}

/**
 * Сервис аутентификации
 */
class AuthService extends Service {
  static serviceType = 'auth-service';
  capabilityDescription: string = 'Аутентификация и авторизация пользователей';

  private authorizedUsers = new Set<string>();
  private tokens = new Map<string, { userId: string; expiresAt: number }>();

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  /**
   * Проверяет, авторизован ли пользователь
   */
  isAuthorized(userId: string): boolean {
    return this.authorizedUsers.has(userId);
  }

  /**
   * Авторизует пользователя
   */
  authorize(userId: string): void {
    this.authorizedUsers.add(userId);
    logger.info('[AuthService] User authorized', { userId });
  }

  /**
   * Разлогинивает пользователя
   */
  deauthorize(userId: string): void {
    this.authorizedUsers.delete(userId);
    // Удаляем токены
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId) {
        this.tokens.delete(token);
      }
    }
    logger.info('[AuthService] User deauthorized', { userId });
  }

  /**
   * Генерирует токен доступа
   */
  generateToken(userId: string, ttlMs: number = 3600000): string {
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.tokens.set(token, {
      userId,
      expiresAt: Date.now() + ttlMs
    });

    logger.info('[AuthService] Token generated', { userId, token });

    return token;
  }

  /**
   * Проверяет токен
   */
  validateToken(token: string): string | null {
    const data = this.tokens.get(token);

    if (!data) {
      return null;
    }

    if (Date.now() > data.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    return data.userId;
  }

  static async start(runtime: IAgentRuntime): Promise<AuthService> {
    logger.info('[AuthService] Starting...');
    return new AuthService(runtime);
  }

  async stop(): Promise<void> {
    logger.info('[AuthService] Stopping...');
    this.authorizedUsers.clear();
    this.tokens.clear();
  }
}

/**
 * Сервис rate limiting
 */
class RateLimitService extends Service {
  static serviceType = 'rate-limit-service';
  capabilityDescription: string = 'Ограничение количества запросов';

  private requests = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(runtime: IAgentRuntime) {
    super(runtime);

    this.config = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 минута
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10')
    };
  }

  /**
   * Проверяет, не превышен ли лимит
   */
  checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = userId;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Получаем существующие запросы
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Обновляем список запросов
    this.requests.set(key, [...recentRequests, now]);

    const remaining = this.config.maxRequests - recentRequests.length;
    const resetTime = now + this.config.windowMs;

    const allowed = remaining > 0;

    if (!allowed) {
      logger.warn('[RateLimitService] Rate limit exceeded', {
        userId,
        requests: recentRequests.length,
        limit: this.config.maxRequests
      });
    }

    return { allowed, remaining, resetTime };
  }

  /**
   * Получает количество оставшихся запросов
   */
  getRemainingRequests(userId: string): number {
    const key = userId;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  static async start(runtime: IAgentRuntime): Promise<RateLimitService> {
    logger.info('[RateLimitService] Starting...');
    return new RateLimitService(runtime);
  }

  async stop(): Promise<void> {
    logger.info('[RateLimitService] Stopping...');
    this.requests.clear();
  }
}

/**
 * Сервис логирования
 */
class LoggingService extends Service {
  static serviceType = 'logging-service';
  capabilityDescription: string = 'Логирование запросов и ответов';

  private logBuffer: Array<{
    timestamp: number;
    userId: string;
    action: string;
    data: any;
  }> = [];

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  /**
   * Логирует запрос
   */
  logRequest(userId: string, action: string, data: any): void {
    const logEntry = {
      timestamp: Date.now(),
      userId,
      action,
      data
    };

    this.logBuffer.push(logEntry);

    // Ограничиваем размер буфера
    if (this.logBuffer.length > 1000) {
      this.logBuffer.shift();
    }

    logger.debug('[LoggingService] Request logged', logEntry);
  }

  /**
   * Получает логи пользователя
   */
  getUserLogs(userId: string, limit: number = 50): any[] {
    return this.logBuffer
      .filter(entry => entry.userId === userId)
      .slice(-limit);
  }

  /**
   * Очищает логи
   */
  clearLogs(): void {
    this.logBuffer = [];
    logger.info('[LoggingService] Logs cleared');
  }

  static async start(runtime: IAgentRuntime): Promise<LoggingService> {
    logger.info('[LoggingService] Starting...');
    return new LoggingService(runtime);
  }

  async stop(): Promise<void> {
    logger.info('[LoggingService] Stopping...');
    this.logBuffer = [];
  }
}

/**
 * Middleware для проверки авторизации
 */
async function authMiddleware(context: MiddlewareContext, runtime: IAgentRuntime): Promise<boolean> {
  const authService = runtime.getService(AuthService.serviceType);

  if (!authService) {
    logger.warn('[AuthMiddleware] AuthService not available');
    return true; // Пропускаем, если сервис недоступен
  }

  const isAuthorized = authService.isAuthorized(context.userId);

  if (!isAuthorized) {
    logger.warn('[AuthMiddleware] Unauthorized request', { userId: context.userId });

    // В реальном приложении здесь можно отправить сообщение пользователю
    // Но для middleware лучше просто логировать и продолжать
  }

  return true; // Возвращаем true чтобы продолжить обработку
}

/**
 * Middleware для rate limiting
 */
async function rateLimitMiddleware(context: MiddlewareContext, runtime: IAgentRuntime): Promise<boolean> {
  const rateLimitService = runtime.getService(RateLimitService.serviceType);

  if (!rateLimitService) {
    logger.warn('[RateLimitMiddleware] RateLimitService not available');
    return true; // Пропускаем, если сервис недоступен
  }

  const { allowed, remaining, resetTime } = rateLimitService.checkRateLimit(context.userId);

  context.metadata.rateLimit = { allowed, remaining, resetTime };

  if (!allowed) {
    logger.warn('[RateLimitMiddleware] Rate limit exceeded', {
      userId: context.userId,
      resetTime
    });
    // Можно добавить задержку или отклонить запрос
  }

  return true; // Всегда продолжаем обработку
}

/**
 * Middleware для логирования
 */
async function loggingMiddleware(context: MiddlewareContext, runtime: IAgentRuntime): Promise<boolean> {
  const loggingService = runtime.getService(LoggingService.serviceType);

  if (!loggingService) {
    logger.warn('[LoggingMiddleware] LoggingService not available');
    return true;
  }

  loggingService.logRequest(context.userId, 'message_received', {
    messageId: context.message.id,
    hasText: !!context.message.content.text,
    timestamp: context.timestamp
  });

  return true;
}

/**
 * Middleware для валидации
 */
async function validationMiddleware(context: MiddlewareContext, runtime: IAgentRuntime): Promise<boolean> {
  // Простая валидация сообщения
  if (!context.message.content) {
    logger.warn('[ValidationMiddleware] Message has no content', {
      messageId: context.message.id
    });
    return false;
  }

  // Проверяем длину текста
  if (context.message.content.text && context.message.content.text.length > 4000) {
    logger.warn('[ValidationMiddleware] Message too long', {
      userId: context.userId,
      length: context.message.content.text.length
    });
    return false;
  }

  return true;
}

/**
 * Действие для авторизации
 */
const authCommand: Action = {
  name: 'AUTH_COMMAND',
  similes: ['LOGIN', 'ВХОД', 'АВТОРИЗАЦИЯ'],
  description: 'Авторизует пользователя в системе',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'login' ||
      text === 'авторизоваться' ||
      text === 'войти' ||
      text === '/login'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const authService = runtime.getService(AuthService.serviceType);

      if (!authService) {
        throw new Error('AuthService не найден');
      }

      const userId = message.userId;

      // Авторизуем пользователя
      authService.authorize(userId);

      // Генерируем токен
      const token = authService.generateToken(userId, 24 * 3600000); // 24 часа

      await callback({
        text:
          `✅ Вы успешно авторизованы!\n\n` +
          `🔑 Ваш токен доступа:\n` +
          `${token}\n\n` +
          `Токен действителен в течение 24 часов.`
      });

      logger.info('[AUTH_COMMAND] User logged in', { userId });

      return {
        success: true,
        text: 'User authorized',
        data: { userId, token }
      };
    } catch (error) {
      logger.error('[AUTH_COMMAND] Error:', error);

      await callback({
        text: 'Ошибка авторизации 😞'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * Действие для выхода
 */
const logoutCommand: Action = {
  name: 'LOGOUT_COMMAND',
  similes: ['LOGOUT', 'ВЫХОД', 'РАЗЛОГИН'],
  description: 'Разлогинивает пользователя',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return (
      text === 'logout' ||
      text === 'выйти' ||
      text === 'разлогиниться' ||
      text === '/logout'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const authService = runtime.getService(AuthService.serviceType);

      if (!authService) {
        throw new Error('AuthService не найден');
      }

      const userId = message.userId;
      authService.deauthorize(userId);

      await callback({
        text: 'Вы успешно вышли из системы. До свидания! 👋'
      });

      logger.info('[LOGOUT_COMMAND] User logged out', { userId });

      return {
        success: true,
        text: 'User logged out',
        data: { userId }
      };
    } catch (error) {
      logger.error('[LOGOUT_COMMAND] Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * Действие для проверки статуса middleware
 */
const statusCommand: Action = {
  name: 'MIDDLEWARE_STATUS',
  similes: ['STATUS', 'СТАТУС', 'СОСТОЯНИЕ'],
  description: 'Показывает статус middleware сервисов',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text?.toLowerCase().trim() || '';
    return text === 'middleware status' || text === 'статус middleware' || text === '/status';
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: any,
    responses: Memory[]
  ): Promise<any> => {
    try {
      const authService = runtime.getService(AuthService.serviceType);
      const rateLimitService = runtime.getService(RateLimitService.serviceType);
      const loggingService = runtime.getService(LoggingService.serviceType);

      const userId = message.userId;
      let statusText = '🔧 Статус Middleware:\n\n';

      // Auth Service
      if (authService) {
        const isAuthorized = authService.isAuthorized(userId);
        statusText += `✅ AuthService: Активен (ваш статус: ${isAuthorized ? 'авторизован' : 'не авторизован'})\n`;
      } else {
        statusText += `❌ AuthService: Недоступен\n`;
      }

      // Rate Limit Service
      if (rateLimitService) {
        const remaining = rateLimitService.getRemainingRequests(userId);
        statusText += `✅ RateLimitService: Активен (осталось запросов: ${remaining})\n`;
      } else {
        statusText += `❌ RateLimitService: Недоступен\n`;
      }

      // Logging Service
      if (loggingService) {
        statusText += `✅ LoggingService: Активен\n`;
      } else {
        statusText += `❌ LoggingService: Недоступен\n`;
      }

      await callback({
        text: statusText
      });

      return {
        success: true,
        text: 'Status retrieved',
        data: { userId }
      };
    } catch (error) {
      logger.error('[MIDDLEWARE_STATUS] Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * Основной плагин
 */
export const middlewarePlugin: Plugin = {
  name: 'middleware-plugin',
  description: 'Пример плагина middleware для демонстрации cross-cutting concerns',

  // Регистрируем сервисы
  services: [AuthService, RateLimitService, LoggingService],

  // Регистрируем действия
  actions: [authCommand, logoutCommand, statusCommand],

  // Регистрируем события для middleware
  events: {
    MESSAGE_RECEIVED: [
      // Порядок middleware важен!
      async (params) => {
        const context: MiddlewareContext = {
          message: params.message,
          userId: params.message.userId,
          roomId: params.message.roomId,
          timestamp: Date.now(),
          metadata: {}
        };

        // Валидация
        if (!(await validationMiddleware(context, params.runtime))) {
          logger.warn('[Middleware] Message rejected by validation', context);
          return;
        }

        // Rate Limiting
        await rateLimitMiddleware(context, params.runtime);

        // Авторизация
        await authMiddleware(context, params.runtime);

        // Логирование
        await loggingMiddleware(context, params.runtime);

        logger.info('[Middleware] Message processed', {
          userId: context.userId,
          rateLimit: context.metadata.rateLimit
        });
      }
    ]
  },

  // Инициализация
  async init(config, runtime) {
    logger.info('[MiddlewarePlugin] Инициализация...');

    logger.info('[MiddlewarePlugin] Зарегистрированные middleware:', [
      'validation',
      'rateLimit',
      'auth',
      'logging'
    ]);

    logger.info('[MiddlewarePlugin] Конфигурация:', {
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || '60000',
      rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || '10'
    });
  }
};

export default middlewarePlugin;

/**
 * ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
 *
 * Middleware - это компоненты, которые перехватывают и обрабатывают запросы
 * до того, как они дойдут до основного обработчика.
 *
 * TИПЫ MIDDLEWARE:
 *
 * 1. Auth Middleware - проверка авторизации
 * 2. Rate Limiting - ограничение частоты запросов
 * 3. Logging - логирование запросов и ответов
 * 4. Validation - валидация входных данных
 * 5. Security - проверки безопасности
 * 6. Caching - кэширование результатов
 * 7. Metrics - сбор метрик
 *
 * АРХИТЕКТУРА:
 *
 * [Запрос] → [Middleware Chain] → [Handler] → [Ответ]
 *     ↓
 *   Validation
 *     ↓
 *   Rate Limit
 *     ↓
 *     Auth
 *     ↓
 *   Logging
 *     ↓
 *   Business Logic
 *
 * ИСПОЛЬЗОВАНИЕ:
 *
 * 1. В персонаже:
 *    import { middlewarePlugin } from './examples/plugins/middleware';
 *
 * 2. Автоматически активируется при получении сообщения
 * 3. Все сообщения проходят через цепочку middleware
 *
 * ЛУЧШИЕ ПРАКТИКИ:
 *
 * 1. Middleware должны быть быстрыми
 * 2. Порядок middleware имеет значение
 * 3. Обрабатывайте ошибки gracefully
 * 4. Логируйте важные события
 * 5. Не блокируйте основной поток
 * 6. Делайте middleware переиспользуемыми
 * 7. Конфигурируйте через environment
 *
 * СОВЕТЫ:
 *
 * • Используйте события MESSAGE_RECEIVED для middleware
 * • Всегда возвращайте true для продолжения обработки
 * • Добавляйте метаданные в context.metadata
 * • Проверяйте доступность сервисов
 * • Ограничивайте размер буферов логов
 */
