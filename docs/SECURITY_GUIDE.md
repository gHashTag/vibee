# 🔐 Руководство по безопасности системы Виби

## Обзор

Система безопасности Виби обеспечивает комплексную защиту от различных типов атак:

- ❌ **XSS и инъекции** - валидация и санитизация всех входных данных
- 🚫 **DDoS и спам** - продвинутый rate limiting с адаптивными лимитами
- 🔑 **Утечки ключей** - централизованное управление секретами
- 📊 **Мониторинг атак** - детальное логирование событий безопасности
- 🛡️ **Безопасные HTTP запросы** - валидация URL и обработка ошибок

## Быстрый старт

### 1. Импорт системы безопасности

```typescript
import {
  security,
  secrets,
  secLog,
  http,
  validateWithSchema,
  sanitizeText,
  TextInputSchema,
  RateLimitPresets,
  KeyGenerators,
} from '../security';
```

### 2. Безопасное получение секретов

```typescript
// ❌ Плохо (небезопасно)
const apiKey = process.env.FAL_KEY!;

// ✅ Хорошо (безопасно)
const apiKey = secrets.getSecret('FAL_KEY');
```

### 3. Валидация пользовательского ввода

```typescript
// ❌ Плохо (без валидации)
const message = ctx.message.text;
await ctx.reply(message);

// ✅ Хорошо (с валидацией)
const validation = validateWithSchema(
  TextInputSchema,
  { text: ctx.message.text },
  'user_message'
);

if (!validation.success) {
  await ctx.reply(`❌ Ошибка: ${validation.error}`);
  return;
}

const safeMessage = sanitizeText(validation.data.text);
await ctx.reply(safeMessage);
```

### 4. Rate Limiting

```typescript
import { RateLimiter } from '../security';

// Создаем rate limiter для команд бота
const limiter = new RateLimiter(
  RateLimitPresets.botCommands,
  KeyGenerators.userId
);

// Проверяем перед обработкой
const result = limiter.check(ctx.from.id.toString());

if (!result.allowed) {
  await ctx.reply(
    `⏳ Слишком много запросов. Попробуйте через ${result.retryAfter} сек.`
  );
  return;
}
```

### 5. Безопасный HTTP запрос

```typescript
// ❌ Плохо (безопасность)
const response = await fetch(url, options);

// ✅ Хорошо (с валидацией)
const response = await http.request('GET', url, {
  timeout: 10000,
  maxSize: 1024 * 1024, // 1MB
  allowedStatusCodes: [200, 201],
  validateJson: true,
}, ctx.from.id);
```

## Компоненты системы

### 1. SecretManager - Управление секретами

#### Основные возможности:
- ✅ Валидация формата API ключей
- ✅ Кэширование в памяти (без утечек в логах)
- ✅ Проверка наличия всех необходимых ключей
- ✅ Безопасное логирование

#### Примеры использования:

```typescript
import { SecretManager } from '../security/SecretManager';

const manager = SecretManager.getInstance();

// Получение секрета
const telegramToken = manager.getSecret('TELEGRAM_BOT_TOKEN');

// Безопасное получение нескольких секретов
const secrets = manager.getSecrets(['FAL_KEY', 'OPENAI_API_KEY']);

// Проверка всех необходимых секретов
const validation = manager.validateSecrets([
  'TELEGRAM_BOT_TOKEN',
  'FAL_KEY',
  'OPENAI_API_KEY',
]);

if (!validation.valid) {
  console.error('Missing secrets:', validation.missing);
  console.error('Invalid secrets:', validation.invalid);
}
```

### 2. RateLimiter - Защита от DDoS

#### Предустановленные конфигурации:

```typescript
// Строгий лимит для команд бота
RateLimitPresets.botCommands // 5 запросов в минуту

// Лимит для генерации изображений
RateLimitPresets.imageGeneration // 3 запроса в 5 минут

// Лимит для обучения моделей
RateLimitPresets.modelTraining // 1 запрос в час

// Лимит для пользователя
RateLimitPresets.perUser // 50 запросов в минуту
```

#### Генераторы ключей:

```typescript
// По ID пользователя
KeyGenerators.userId

// По username
KeyGenerators.username

// По IP адресу
KeyGenerators.ipAddress

// Глобальный ключ
KeyGenerators.global

// По команде
KeyGenerators.command
```

#### Middleware для Express/Telegraf:

```typescript
import { createRateLimitMiddleware } from '../security/RateLimiter';

const middleware = createRateLimitMiddleware(
  limiter,
  KeyGenerators.userId,
  RateLimitPresets.botCommands
);

// Использование в обработчике
app.use('/command', middleware, commandHandler);
```

### 3. ValidationUtils - Валидация данных

#### Схемы валидации:

```typescript
import { z } from 'zod';
import {
  TextInputSchema,
  UsernameSchema,
  NumberInputSchema,
  UrlSchema,
  EmailSchema,
  TelegramUserIdSchema,
} from '../security';

// Текстовый ввод (с защитой от XSS)
TextInputSchema.parse({ text: 'Hello world' });

// Username
UsernameSchema.parse('user123');

// Числовой ввод
NumberInputSchema.parse(42);

// URL (только http/https)
UrlSchema.parse('https://example.com');

// Email
EmailSchema.parse('user@example.com');

// ID пользователя Telegram
TelegramUserIdSchema.parse('123456789');
```

#### Санитизация:

```typescript
import { sanitizeText, sanitizeForSql, sanitizeFilename } from '../security';

// Защита от XSS
const safeText = sanitizeText('<script>alert(1)</script>Hello');
// Результат: 'Hello'

// Защита от SQL injection
const safeSql = sanitizeForSql("user'; DROP TABLE users; --");
// Результат: 'user DROP TABLE users --'

// Безопасные имена файлов
const safeFilename = sanitizeFilename('../../../etc/passwd');
// Результат: '__etc_passwd'
```

#### Безопасный JSON.parse:

```typescript
import { safeJsonParse } from '../security';
import { z } from 'zod';

const DataSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const json = '{"name": "John", "age": 30}';
const data = safeJsonParse(json, DataSchema, { name: 'Unknown' }, 'user_data');
```

### 4. SecurityLogger - Мониторинг безопасности

#### Типы событий безопасности:

```typescript
enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  VALIDATION_FAILED = 'validation_failed',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  SUSPICIOUS_API_CALL = 'suspicious_api_call',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload',
}
```

#### Логирование событий:

```typescript
import { securityLogger } from '../security';

// Простое логирование
securityLogger.log({
  type: SecurityEventType.AUTH_SUCCESS,
  severity: SecuritySeverity.LOW,
  userId: '123',
  details: { method: 'telegram' },
  action: 'login',
});

// Специализированные методы
securityLogger.logAuthSuccess('123', { method: 'telegram' });
securityLogger.logAuthFailure('123', 'Invalid credentials');
securityLogger.logRateLimitExceeded('123', 'user:123', 5, 60000, 1);
securityLogger.logXssAttempt('123', '<script>alert(1)</script>', 'telegram_command');
```

#### Получение отчетов:

```typescript
// Отчет за последний час
const report = securityLogger.getReport();

// Отчет за произвольный период
const from = Date.now() - 24 * 60 * 60 * 1000; // 24 часа назад
const to = Date.now();
const dailyReport = securityLogger.getReport(from, to);

console.log('Total events:', dailyReport.totalEvents);
console.log('Top threats:', dailyReport.topThreats);
console.log('Affected users:', dailyReport.affectedUsers);
```

### 5. SecureHttpClient - Безопасные HTTP запросы

#### Основные возможности:
- ✅ Валидация URL (только http/https)
- ✅ Таймауты соединения
- ✅ Ограничение размера ответа
- ✅ Проверка статус-кодов
- ✅ Валидация JSON
- ✅ Санитизация URL в логах

#### Примеры использования:

```typescript
import { http } from '../security';

// GET запрос
const response = await http.get('https://api.example.com/data', {
  timeout: 10000,
  maxSize: 1024 * 1024, // 1MB
}, userId);

// POST запрос
const result = await http.post('https://api.example.com/submit', {
  data: { value: 'test' }
}, {
  timeout: 5000,
  allowedStatusCodes: [200, 201],
}, userId);

// Обработка ошибок
try {
  const data = await http.get(url, {}, userId);
  console.log('Success:', data);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Интеграция с Telegram

### Готовое middleware:

```typescript
import {
  createTelegramSecurityMiddleware,
  secureReply,
} from '../security/integrations/telegram-security';

// Применяем ко всем обработчикам
bot.use(createTelegramSecurityMiddleware({
  enableRateLimit: true,
  enableMessageValidation: true,
  enableCommandValidation: true,
  maxMessageLength: 4096,
}));

// Безопасный ответ
await secureReply(ctx, '<script>alert(1)</script>Привет!');
// Результат: 'Привет!' (теги удалены)
```

## Лучшие практики

### 1. Валидация ВСЕГДА

```typescript
// ❌ Никогда так не делайте
ctx.reply(ctx.message.text);

// ✅ Всегда валидируйте
const validation = validateWithSchema(TextInputSchema, {
  text: ctx.message.text,
}, 'handler');

if (!validation.success) {
  await ctx.reply(`❌ ${validation.error}`);
  return;
}

await ctx.reply(validation.data.text);
```

### 2. Санитизация входных данных

```typescript
// ❌ Опасно
const userInput = ctx.message.text;
console.log('User said:', userInput);

// ✅ Безопасно
const safeInput = sanitizeText(ctx.message.text);
console.log('User said:', safeInput);
```

### 3. Rate Limiting для всех операций

```typescript
// Генерация изображений
const imageLimiter = new RateLimiter(
  RateLimitPresets.imageGeneration,
  KeyGenerators.userId
);

// Проверяем перед генерацией
if (!imageLimiter.check(ctx.from.id.toString()).allowed) {
  await ctx.reply('⏳ Слишком часто используете генерацию. Попробуйте через 5 минут.');
  return;
}
```

### 4. Логирование событий безопасности

```typescript
// Всегда логируйте подозрительную активность
if (suspiciousPattern) {
  securityLogger.log({
    type: SecurityEventType.SUSPICIOUS_BEHAVIOR,
    severity: SecuritySeverity.HIGH,
    userId: ctx.from.id,
    details: { pattern: suspiciousPattern },
    action: 'suspicious_activity',
  });
}
```

### 5. Безопасные секреты

```typescript
// ❌ Никогда так не делайте
const apiKey = '1234567890abcdef'; // захардкоженный ключ

// ✅ Всегда из переменных окружения
const apiKey = secrets.getSecret('API_KEY');

// ✅ Проверяйте валидность
try {
  const key = secrets.getSecret('FAL_KEY');
} catch (error) {
  logger.error('FAL_KEY not configured');
  await ctx.reply('❌ Сервис временно недоступен');
  return;
}
```

### 6. Безопасные HTTP запросы

```typescript
// ❌ Небезопасно
const response = await fetch(url);

// ✅ Безопасно
const response = await http.request('GET', url, {
  timeout: 10000,
  maxSize: 1024 * 1024,
  allowedStatusCodes: [200, 201],
}, userId);
```

## Тестирование безопасности

### Запуск тестов:

```bash
# Все тесты безопасности
npm test src/__tests__/security/

# Отдельный компонент
npm test src/__tests__/security/security-system.test.ts
```

### Примеры тестов:

```typescript
// Тест валидации
it('должен отклонять XSS атаки', () => {
  const result = validateWithSchema(
    TextInputSchema,
    { text: '<script>alert(1)</script>' },
    'test'
  );

  expect(result.success).toBe(false);
});

// Тест rate limiting
it('должен блокировать после превышения лимита', () => {
  const limiter = new RateLimiter(
    { limit: 1, window: 60000 },
    KeyGenerators.global
  );

  limiter.check();
  const result = limiter.check();

  expect(result.allowed).toBe(false);
});
```

## Мониторинг и алерты

### Автоматические алерты:

Система автоматически генерирует алерты при:
- Превышении порога rate limit (10+ нарушений)
- Обнаружении XSS атак
- Множественных ошибках валидации (5+)
- Подозрительной активности

### Просмотр логов:

```typescript
// Получение отчета
const report = securityLogger.getReport();

console.log('🚨 Критические события:', report.eventsBySeverity[SecuritySeverity.CRITICAL]);
console.log('⚠️ Высокий приоритет:', report.eventsBySeverity[SecuritySeverity.HIGH]);
console.log('📊 Топ угроз:', report.topThreats);
```

## Отладка

### Включение debug режима:

```typescript
import { logger } from '@elizaos/core';

logger.level = 'debug'; // Включаем подробные логи
```

### Проверка состояния системы:

```typescript
// Статистика секретов
const secretStats = secrets.getStats();
console.log('Секретов в кэше:', secretStats.cachedSecrets);

// Статистика rate limiter
const limiterStats = limiter.getStats('user:123');
console.log('Нарушений у пользователя:', limiterStats.violations);

// Статистика HTTP клиента
const httpStats = http.getStats();
console.log('Активных запросов:', httpStats.activeRequests);
```

## Заключение

Система безопасности Виби обеспечивает:
- 🛡️ **Комплексную защиту** от всех основных типов атак
- 📊 **Детальный мониторинг** подозрительной активности
- 🔧 **Простую интеграцию** с существующим кодом
- ✅ **Надежную валидацию** всех входных данных
- ⚡ **Высокую производительность** с минимальными накладными расходами

**Помните**: Безопасность - это непрерывный процесс. Всегда валидируйте, санитизируйте и логируйте!
