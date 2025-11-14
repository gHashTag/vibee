/**
 * User-Friendly Error Handler
 * Показывает понятные ошибки пользователю с предложениями действий
 */

type ErrorType = 'NETWORK_ERROR' | 'RATE_LIMITED' | 'INVALID_INPUT' | 'SERVICE_UNAVAILABLE' | 'GENERIC';

interface ErrorInfo {
  text: string;
  suggestions: string[];
  logLevel: 'error' | 'warn' | 'info';
}

export class UserFriendlyErrorHandler {
  private static errorMessages: Record<ErrorType, ErrorInfo> = {
    NETWORK_ERROR: {
      text: '🌐 Сетевая ошибка. Попробуйте еще раз через несколько секунд.',
      suggestions: ['Повторить', 'Проверить подключение'],
      logLevel: 'warn'
    },
    RATE_LIMITED: {
      text: '⏳ Слишком много запросов. Подождите немного.',
      suggestions: ['Подождать', 'Попробовать позже'],
      logLevel: 'info'
    },
    INVALID_INPUT: {
      text: '❌ Неверные данные. Проверьте ввод и попробуйте снова.',
      suggestions: ['Изменить данные', 'Посмотреть примеры'],
      logLevel: 'warn'
    },
    SERVICE_UNAVAILABLE: {
      text: '🚫 Сервис временно недоступен. Мы работаем над решением.',
      suggestions: ['Попробовать позже', 'Связаться с поддержкой'],
      logLevel: 'error'
    },
    GENERIC: {
      text: '❌ Произошла ошибка. Мы уже уведомлены.',
      suggestions: ['Попробовать снова', 'Связаться с поддержкой'],
      logLevel: 'error'
    }
  };

  static async handleError(ctx: any, error: Error): Promise<void> {
    const errorType = this.classifyError(error);
    const info = this.errorMessages[errorType];

    // Логируем для разработчиков
    this.logError(error, ctx, errorType);

    // Показываем пользователю понятное сообщение
    await ctx.reply(info.text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: info.suggestions.map(s => [
          { text: s, callback_data: `error_action_${s.toLowerCase().replace(' ', '_')}` }
        ])
      }
    });
  }

  private static classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return 'RATE_LIMITED';
    }
    if (message.includes('invalid') || message.includes('validation') || message.includes('bad request')) {
      return 'INVALID_INPUT';
    }
    if (message.includes('unavailable') || message.includes('503') || message.includes('maintenance')) {
      return 'SERVICE_UNAVAILABLE';
    }

    return 'GENERIC';
  }

  private static logError(error: Error, ctx: any, type: ErrorType): void {
    const logger = console; // Заменить на реальный logger

    const logData = {
      error: error.message,
      stack: error.stack,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      username: ctx.from?.username,
      timestamp: Date.now()
    };

    const info = this.errorMessages[type];
    if (info.logLevel === 'error') {
      logger.error('User-friendly error', logData);
    } else if (info.logLevel === 'warn') {
      logger.warn('User-friendly error', logData);
    } else {
      logger.info('User-friendly error', logData);
    }
  }
}
