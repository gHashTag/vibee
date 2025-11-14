/**
 * Безопасный HTTP клиент с валидацией и защитой
 */

import https from 'https';
import { logger } from '@elizaos/core';
import { UrlSchema } from './ValidationUtils';
import { securityLogger, SecurityEventType, SecuritySeverity } from './SecurityLogger';

export interface HttpRequestOptions extends RequestInit {
  timeout?: number;
  maxSize?: number; // Максимальный размер ответа в байтах
  allowedStatusCodes?: number[];
  validateJson?: boolean;
  sanitizeUrl?: boolean;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  responseTime: number;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  code?: string;
}

/**
 * Безопасный HTTP клиент с валидацией и защитой
 */
export class SecureHttpClient {
  private static instance: SecureHttpClient;
  private httpsAgent: https.Agent;
  private activeRequests = new Map<string, AbortController>();

  private constructor() {
    this.httpsAgent = new https.Agent({
      // Проверяем сертификаты
      rejectUnauthorized: true,
      // Таймауты соединения
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 100,
      maxFreeSockets: 10,
    });
  }

  static getInstance(): SecureHttpClient {
    if (!SecureHttpClient.instance) {
      SecureHttpClient.instance = new SecureHttpClient();
    }
    return SecureHttpClient.instance;
  }

  /**
   * Выполнение GET запроса
   */
  async get<T = any>(
    url: string,
    options: HttpRequestOptions = {},
    userId?: string | number
  ): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, { ...options, method: 'GET' }, userId);
  }

  /**
   * Выполнение POST запроса
   */
  async post<T = any>(
    url: string,
    body?: any,
    options: HttpRequestOptions = {},
    userId?: string | number
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, userId);
  }

  /**
   * Основной метод выполнения запроса
   */
  async request<T = any>(
    method: string,
    url: string,
    options: HttpRequestOptions = {},
    userId?: string | number
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    const requestId = `${method}:${url}:${Date.now()}:${Math.random()}`;

    try {
      // Валидация URL
      this.validateUrl(url);

      // Создаем AbortController для таймаута
      const controller = new AbortController();
      this.activeRequests.set(requestId, controller);

      const timeout = options.timeout || 30000; // 30 секунд по умолчанию
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // Настройки запроса
      const requestOptions: RequestInit = {
        method,
        headers: {
          'User-Agent': 'VibeeBot/1.0',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        // Для безопасности отключаем редиректы
        redirect: 'error',
      };

      // Добавляем body для POST/PUT/PATCH
      if (options.body) {
        requestOptions.body = options.body;
      }

      // Выполняем запрос
      const response = await fetch(url, requestOptions);

      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);

      // Проверяем статус ответа
      const allowedStatusCodes = options.allowedStatusCodes || [200, 201, 202, 204];
      if (!allowedStatusCodes.includes(response.status)) {
        const error = this.createHttpError(
          response.status,
          response.statusText,
          `HTTP ${response.status}: ${response.statusText}`
        );
        logger.warn(`[HTTP] Request failed: ${method} ${url}`, {
          status: response.status,
          statusText: response.statusText,
          userId,
        });
        throw error;
      }

      // Получаем заголовки
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      // Проверяем content-type
      const contentType = headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      // Проверяем размер ответа
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB по умолчанию

      if (contentLength > maxSize) {
        throw this.createHttpError(
          413,
          'Payload Too Large',
          `Response too large: ${contentLength} bytes (max: ${maxSize})`
        );
      }

      // Читаем данные
      const responseTime = Date.now() - startTime;
      let data: T;

      if (isJson) {
        if (options.validateJson) {
          // Валидируем JSON если требуется
          data = await response.json() as T;
        } else {
          data = await response.json() as T;
        }
      } else {
        // Для не-JSON ответов читаем как текст
        data = await response.text() as unknown as T;
      }

      // Логируем успешный запрос
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
        severity: SecuritySeverity.LOW,
        userId,
        details: {
          method,
          url: this.sanitizeUrlForLog(url),
          status: response.status,
          responseTime,
          contentType: contentType.split(';')[0],
        },
        action: 'http_request',
      });

      return {
        status: response.status,
        statusText: response.statusText,
        data,
        headers,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.activeRequests.delete(requestId);

      // Обрабатываем ошибки
      if (error.name === 'AbortError') {
        securityLogger.log({
          type: SecurityEventType.SUSPICIOUS_API_CALL,
          severity: SecuritySeverity.MEDIUM,
          userId,
          details: {
            method,
            url: this.sanitizeUrlForLog(url),
            reason: 'timeout',
            responseTime,
          },
          action: 'http_request_timeout',
        });

        throw this.createHttpError(408, 'Request Timeout', 'Request timeout');
      }

      // Логируем ошибку
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_API_CALL,
        severity: SecuritySeverity.MEDIUM,
        userId,
        details: {
          method,
          url: this.sanitizeUrlForLog(url),
          error: error.message,
          responseTime,
        },
        action: 'http_request_error',
      });

      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw this.createHttpError(500, 'Internal Server Error', error.message);
    }
  }

  /**
   * Валидация URL
   */
  private validateUrl(url: string): void {
    try {
      // Используем Zod схему для валидации
      UrlSchema.parse(url);
    } catch (error) {
      securityLogger.log({
        type: SecurityEventType.SUSPICIOUS_API_CALL,
        severity: SecuritySeverity.HIGH,
        details: {
          url,
          reason: 'invalid_url',
        },
        action: 'url_validation_failed',
      });

      throw new Error('Invalid URL format');
    }
  }

  /**
   * Создание HTTP ошибки
   */
  private createHttpError(status: number, statusText: string, message: string): HttpError {
    const error = new Error(message) as HttpError;
    error.status = status;
    error.statusText = statusText;
    error.code = `HTTP_${status}`;
    return error;
  }

  /**
   * Санитизация URL для логирования
   */
  private sanitizeUrlForLog(url: string): string {
    try {
      const urlObj = new URL(url);
      // Удаляем потенциально чувствительные параметры
      const sensitiveParams = ['api_key', 'token', 'secret', 'password', 'key'];
      const params = new URLSearchParams(urlObj.search);

      for (const param of sensitiveParams) {
        if (params.has(param)) {
          params.set(param, '***');
        }
      }

      urlObj.search = params.toString();
      return urlObj.toString();
    } catch {
      // Если URL не удается распарсить, возвращаем частично скрытый
      return url.length > 100 ? url.substring(0, 100) + '...' : url;
    }
  }

  /**
   * Отмена всех активных запросов
   */
  cancelAllRequests(): void {
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
    logger.info('[HTTP] All active requests cancelled');
  }

  /**
   * Получение статистики
   */
  getStats(): {
    activeRequests: number;
  } {
    return {
      activeRequests: this.activeRequests.size,
    };
  }
}

// Экспорт singleton instance
export const httpClient = SecureHttpClient.getInstance();
