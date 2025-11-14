/**
 * Система логирования безопасности
 * Отслеживает подозрительную активность, атаки и нарушения
 */

import { logger } from '@elizaos/core';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  userId?: string | number;
  username?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  action?: string;
}

export enum SecurityEventType {
  // Аутентификация и авторизация
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DDOS_DETECTED = 'ddos_detected',
  SPAM_DETECTED = 'spam_detected',

  // Валидация данных
  VALIDATION_FAILED = 'validation_failed',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  INVALID_INPUT = 'invalid_input',

  // Безопасность API
  SUSPICIOUS_API_CALL = 'suspicious_api_call',
  API_ABUSE = 'api_abuse',
  UNAUTHORIZED_API_ACCESS = 'unauthorized_api_access',

  // Файлы и загрузки
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
  FILE_SIZE_EXCEEDED = 'file_size_exceeded',
  UNAUTHORIZED_FILE_ACCESS = 'unauthorized_file_access',

  // Системные события
  CONFIG_CHANGED = 'config_changed',
  SECRET_ACCESSED = 'secret_accessed',
  PRIVILEGE_ESCALATION = 'privilege_escalation',

  // Подозрительная активность
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  BOT_DETECTED = 'bot_detected',
  AUTOMATED_REQUEST = 'automated_request',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityReport {
  timeRange: {
    from: number;
    to: number;
  };
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  topThreats: Array<{
    type: SecurityEventType;
    count: number;
  }>;
  affectedUsers: number;
  blockedRequests: number;
}

/**
 * Основной класс для логирования событий безопасности
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private eventBuffer: SecurityEvent[] = [];
  private maxBufferSize = 1000;
  private flushInterval = 60000; // 1 минута
  private lastFlush = Date.now();

  // Счетчики для статистики
  private eventCounters = new Map<SecurityEventType, number>();
  private severityCounters = new Map<SecuritySeverity, number>();
  private userEventCounters = new Map<string, number>();

  // Пороговые значения для алертов
  private thresholds = {
    rateLimitViolations: 10,
    validationFailures: 5,
    suspiciousActivity: 3,
  };

  private constructor() {
    // Запускаем периодическую очистку буфера
    setInterval(() => this.flush(), this.flushInterval);
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Логирование события безопасности
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Добавляем в буфер
    this.eventBuffer.push(fullEvent);

    // Обновляем счетчики
    this.incrementCounters(fullEvent);

    // Проверяем на алерты
    this.checkThresholds(fullEvent);

    // Ограничиваем размер буфера
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.flush();
    }

    // Логируем в консоль в зависимости от серьезности
    this.logToConsole(fullEvent);
  }

  /**
   * Логирование успешной аутентификации
   */
  logAuthSuccess(userId: string | number, details: Record<string, any> = {}): void {
    this.log({
      type: SecurityEventType.AUTH_SUCCESS,
      severity: SecuritySeverity.LOW,
      userId,
      details: { ...details, method: 'telegram' },
      action: 'login',
    });
  }

  /**
   * Логирование неудачной аутентификации
   */
  logAuthFailure(userId: string | number, reason: string, details: Record<string, any> = {}): void {
    this.log({
      type: SecurityEventType.AUTH_FAILURE,
      severity: SecuritySeverity.MEDIUM,
      userId,
      details: { ...details, reason },
      action: 'login_failed',
    });
  }

  /**
   * Логирование превышения rate limit
   */
  logRateLimitExceeded(
    userId: string | number,
    key: string,
    limit: number,
    window: number,
    violations: number
  ): void {
    this.log({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: violations > 3 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
      userId,
      details: {
        key,
        limit,
        window,
        violations,
      },
      action: 'rate_limit_exceeded',
    });
  }

  /**
   * Логирование ошибок валидации
   */
  logValidationFailed(
    userId: string | number,
    field: string,
    value: string,
    reason: string,
    context: string
  ): void {
    this.log({
      type: SecurityEventType.VALIDATION_FAILED,
      severity: SecuritySeverity.MEDIUM,
      userId,
      details: {
        field,
        valuePreview: value.substring(0, 50),
        reason,
        context,
      },
      action: 'validation_failed',
    });
  }

  /**
   * Логирование попытки XSS атаки
   */
  logXssAttempt(userId: string | number, payload: string, context: string): void {
    this.log({
      type: SecurityEventType.XSS_ATTEMPT,
      severity: SecuritySeverity.HIGH,
      userId,
      details: {
        payloadPreview: payload.substring(0, 100),
        context,
      },
      action: 'xss_attack',
    });
  }

  /**
   * Логирование подозрительного API вызова
   */
  logSuspiciousApiCall(
    userId: string | number,
    endpoint: string,
    method: string,
    reason: string
  ): void {
    this.log({
      type: SecurityEventType.SUSPICIOUS_API_CALL,
      severity: SecuritySeverity.MEDIUM,
      userId,
      details: {
        endpoint,
        method,
        reason,
      },
      action: 'suspicious_api',
    });
  }

  /**
   * Логирование доступа к секретам
   */
  logSecretAccess(secretName: string, success: boolean, userId?: string | number): void {
    this.log({
      type: SecurityEventType.SECRET_ACCESSED,
      severity: SecuritySeverity.HIGH,
      userId,
      details: {
        secretName,
        success,
        preview: secretName.substring(0, 4) + '***',
      },
      action: 'secret_access',
    });
  }

  /**
   * Получение отчета по безопасности
   */
  getReport(from?: number, to?: number): SecurityReport {
    const now = Date.now();
    const timeFrom = from || now - 3600000; // По умолчанию последний час
    const timeTo = to || now;

    const events = this.eventBuffer.filter(
      (e) => e.timestamp >= timeFrom && e.timestamp <= timeTo
    );

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecuritySeverity, number>;

    // Подсчитываем события
    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }

    // Топ угроз
    const topThreats = Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }));

    // Затронутые пользователи
    const uniqueUsers = new Set(events.map((e) => e.userId).filter(Boolean)).size;

    // Заблокированные запросы (примерная оценка)
    const blockedRequests = events.filter(
      (e) =>
        e.type === SecurityEventType.RATE_LIMIT_EXCEEDED ||
        e.type === SecurityEventType.VALIDATION_FAILED
    ).length;

    return {
      timeRange: { from: timeFrom, to: timeTo },
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topThreats,
      affectedUsers: uniqueUsers,
      blockedRequests,
    };
  }

  /**
   * Очистка буфера и сброс счетчиков
   */
  reset(): void {
    this.eventBuffer = [];
    this.eventCounters.clear();
    this.severityCounters.clear();
    this.userEventCounters.clear();
    this.lastFlush = Date.now();
    logger.info('[SECURITY] Security logger reset');
  }

  /**
   * Принудительная запись буфера
   */
  private flush(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const now = Date.now();

    // Группируем события по типу для компактного логирования
    const groupedEvents = this.eventBuffer.reduce((acc, event) => {
      const key = event.type;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {} as Record<SecurityEventType, SecurityEvent[]>);

    // Логируем группы
    for (const [type, events] of Object.entries(groupedEvents)) {
      logger.warn(`[SECURITY] ${type}: ${events.length} events`, {
        events: events.map((e) => ({
          userId: e.userId,
          severity: e.severity,
          timestamp: e.timestamp,
        })),
      });
    }

    // Очищаем буфер
    this.eventBuffer = [];
    this.lastFlush = now;
  }

  /**
   * Обновление счетчиков
   */
  private incrementCounters(event: SecurityEvent): void {
    this.eventCounters.set(event.type, (this.eventCounters.get(event.type) || 0) + 1);
    this.severityCounters.set(event.severity, (this.severityCounters.get(event.severity) || 0) + 1);

    if (event.userId) {
      const userKey = event.userId.toString();
      this.userEventCounters.set(userKey, (this.userEventCounters.get(userKey) || 0) + 1);
    }
  }

  /**
   * Проверка пороговых значений для алертов
   */
  private checkThresholds(event: SecurityEvent): void {
    const userId = event.userId?.toString();

    switch (event.type) {
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        if (userId) {
          const userViolations = Array.from(this.eventBuffer)
            .filter((e) => e.userId?.toString() === userId && e.type === event.type)
            .length;

          if (userViolations >= this.thresholds.rateLimitViolations) {
            logger.error(`[SECURITY] CRITICAL: User ${userId} exceeded rate limit violations threshold`, {
              violations: userViolations,
              threshold: this.thresholds.rateLimitViolations,
            });
          }
        }
        break;

      case SecurityEventType.VALIDATION_FAILED:
        if (userId) {
          const userFailures = Array.from(this.eventBuffer)
            .filter((e) => e.userId?.toString() === userId && e.type === event.type)
            .length;

          if (userFailures >= this.thresholds.validationFailures) {
            logger.warn(`[SECURITY] User ${userId} has multiple validation failures`, {
              failures: userFailures,
              threshold: this.thresholds.validationFailures,
            });
          }
        }
        break;

      case SecurityEventType.XSS_ATTEMPT:
        logger.error('[SECURITY] CRITICAL: XSS attack attempt detected', {
          userId: event.userId,
          payloadPreview: event.details.payloadPreview,
          context: event.details.context,
        });
        break;
    }
  }

  /**
   * Вывод в консоль в зависимости от серьезности
   */
  private logToConsole(event: SecurityEvent): void {
    const logData = {
      type: event.type,
      userId: event.userId,
      username: event.username,
      details: event.details,
    };

    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
        logger.error(`🚨 [SECURITY] ${event.type}`, logData);
        break;
      case SecuritySeverity.HIGH:
        logger.warn(`⚠️ [SECURITY] ${event.type}`, logData);
        break;
      case SecuritySeverity.MEDIUM:
        logger.warn(`⚠️ [SECURITY] ${event.type}`, logData);
        break;
      case SecuritySeverity.LOW:
        logger.info(`ℹ️ [SECURITY] ${event.type}`, logData);
        break;
    }
  }
}

// Экспорт singleton instance
export const securityLogger = SecurityLogger.getInstance();
