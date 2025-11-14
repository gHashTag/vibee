/**
 * Главный файл системы безопасности
 * Экспортирует все компоненты безопасности
 */

// Core components
export { SecretManager, secretManager } from './SecretManager';
export {
  ValidationUtils,
  TextInputSchema,
  UsernameSchema,
  NumberInputSchema,
  UrlSchema,
  EmailSchema,
  TelegramUserIdSchema,
  sanitizeText,
  sanitizeForSql,
  sanitizeFilename,
  sanitizePrompt,
  validateWithSchema,
  safeJsonParse,
  validateTelegramMessage,
  validateBotCommand,
  type TextInput,
  type ValidatedUrl,
  type ValidatedUsername,
} from './ValidationUtils';

export { RateLimiter, RateLimitPresets, KeyGenerators, createRateLimitMiddleware } from './RateLimiter';

export {
  SecurityLogger,
  securityLogger,
  SecurityEventType,
  SecuritySeverity,
  type SecurityEvent,
  type SecurityReport,
} from './SecurityLogger';

export {
  SecureHttpClient,
  httpClient,
  type HttpRequestOptions,
  type HttpResponse,
  type HttpError,
} from './SecureHttpClient';

// Convenience re-exports
export { secretManager as secrets } from './SecretManager';
export { securityLogger as secLog } from './SecurityLogger';
export { httpClient as http } from './SecureHttpClient';

/**
 * Центральный API для всех компонентов безопасности
 */
export class SecurityManager {
  private static instance: SecurityManager;

  // Components
  private secrets: typeof secretManager;
  private logger: typeof securityLogger;
  private http: typeof httpClient;

  private constructor() {
    this.secrets = secretManager;
    this.logger = securityLogger;
    this.http = httpClient;
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Получение секрета
   */
  getSecret(key: string, required: boolean = true): string | null {
    return this.secrets.getSecret(key, required);
  }

  /**
   * Валидация входных данных
   */
  validate<T>(schema: any, data: unknown, context: string): { success: true; data: T } | { success: false; error: string } {
    return validateWithSchema(schema, data, context);
  }

  /**
   * Логирование события безопасности
   */
  log(event: any): void {
    this.logger.log(event);
  }

  /**
   * Выполнение HTTP запроса
   */
  async request<T>(method: string, url: string, options?: any, userId?: string | number): Promise<any> {
    return this.http.request(method, url, options, userId);
  }

  /**
   * Проверка всех секретов
   */
  validateAllSecrets(keys: string[]): any {
    return this.secrets.validateSecrets(keys);
  }

  /**
   * Получение отчета по безопасности
   */
  getSecurityReport(from?: number, to?: number): any {
    return this.logger.getReport(from, to);
  }
}

// Export singleton
export const security = SecurityManager.getInstance();
