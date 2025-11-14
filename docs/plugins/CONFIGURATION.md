# Конфигурация плагинов

## Введение

Плагины Vibee могут быть сконфигурированы через переменные окружения, файлы конфигурации или программно. Система конфигурации обеспечивает валидацию, типизацию и безопасность.

## Методы конфигурации

### 1. Переменные окружения

Самый распространенный способ настройки:

```bash
# .env файл
MY_PLUGIN_API_KEY=your-api-key-here
MY_PLUGIN_TIMEOUT=30000
MY_PLUGIN_DEBUG=true
```

```typescript
// В плагине
export const myPlugin: Plugin = {
  name: 'my-plugin',
  config: {
    API_KEY: process.env.MY_PLUGIN_API_KEY,
    TIMEOUT: parseInt(process.env.MY_PLUGIN_TIMEOUT || '30000'),
    DEBUG: process.env.MY_PLUGIN_DEBUG === 'true'
  },

  async init(config, runtime) {
    // Используем config
    logger.info('API Key:', config.API_KEY?.substring(0, 8) + '...');
  }
};
```

### 2. Character Settings

Конфигурация в персонаже:

```typescript
// src/character.ts
export const vibeeCharacter: Character = {
  name: 'Vibee',
  plugins: [myPlugin],
  settings: {
    secrets: {
      MY_PLUGIN_API_KEY: process.env.MY_PLUGIN_API_KEY,
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    },
    plugins: {
      'my-plugin': {
        timeout: 30000,
        retryCount: 3,
        cacheTTL: 300
      }
    }
  }
};
```

### 3. Runtime Settings

Динамическая конфигурация:

```typescript
// Получение настройки из runtime
const apiKey = runtime.getSetting('MY_PLUGIN_API_KEY');

// Если настройки нет, используем значение по умолчанию
const timeout = runtime.getSetting('MY_PLUGIN_TIMEOUT') || 30000;
```

## Валидация конфигурации

### Схема Zod

Рекомендуется использовать Zod для валидации:

```typescript
import { z } from 'zod';

// Определяем схему
const configSchema = z.object({
  API_KEY: z.string().min(1, 'API_KEY обязателен'),
  TIMEOUT: z.number().min(1000).max(60000).default(30000),
  DEBUG: z.boolean().default(false),
  RETRY_COUNT: z.number().min(0).max(5).default(3),
  ENDPOINT: z.string().url('Должен быть валидным URL')
});

export const myPlugin: Plugin = {
  name: 'my-plugin',

  async init(config, runtime) {
    try {
      // Валидация
      const validated = await configSchema.parseAsync(config);

      // Сохраняем в environment для использования
      Object.entries(validated).forEach(([key, value]) => {
        process.env[key] = String(value);
      });

      logger.info('[MyPlugin] Конфигурация валидна');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(i => `${i.path}: ${i.message}`).join(', ');
        throw new Error(`Ошибка валидации конфигурации: ${messages}`);
      }
      throw error;
    }
  }
};
```

### Кастомная валидация

```typescript
import { z } from 'zod';

const configSchema = z.object({
  API_KEY: z.string()
    .min(1, 'API_KEY обязателен')
    .refine(val => val.startsWith('sk-'), 'API_KEY должен начинаться с sk-'),

  TELEGRAM_TOKEN: z.string()
    .min(1, 'TELEGRAM_TOKEN обязателен')
    .regex(/^\d+:[A-Za-z0-9_-]+$/, 'Некорректный формат токена'),

  NUM_WORKERS: z.number()
    .int('Должно быть целым числом')
    .min(1, 'Минимум 1 воркер')
    .max(10, 'Максимум 10 воркеров')
});
```

## Типы конфигурации

### 1. Простые типы

```typescript
const simpleConfigSchema = z.object({
  STRING_VALUE: z.string(),
  NUMBER_VALUE: z.number(),
  BOOLEAN_VALUE: z.boolean(),
  ARRAY_VALUE: z.array(z.string())
});
```

### 2. Сложные объекты

```typescript
const complexConfigSchema = z.object({
  API_CONFIG: z.object({
    endpoint: z.string().url(),
    timeout: z.number().default(30000),
    headers: z.record(z.string()).optional()
  }),

  CACHE_CONFIG: z.object({
    enabled: z.boolean(),
    ttl: z.number().default(300),
    maxSize: z.number().default(100)
  }),

  PLUGINS: z.array(
    z.object({
      name: z.string(),
      enabled: z.boolean().default(true)
    })
  )
});
```

### 3. Условная конфигурация

```typescript
const conditionalSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url().optional(),

  // Обязательно только в production
  PRODUCTION_API_KEY: z.string().optional()
}).refine(data => {
  if (data.MODE === 'production' && !data.PRODUCTION_API_KEY) {
    return false;
  }
  return true;
}, {
  message: 'PRODUCTION_API_KEY обязателен в production режиме',
  path: ['PRODUCTION_API_KEY']
});
```

### 4. Ограничения значений

```typescript
const limitedConfigSchema = z.object({
  PORT: z.number()
    .int()
    .min(1024, 'Порты < 1024 требуют root')
    .max(65535, 'Максимальный порт 65535')
    .default(3000),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug'])
    .default('info'),

  COLORS: z.array(
    z.enum(['red', 'green', 'blue', 'yellow'])
  ).max(5, 'Максимум 5 цветов')
});
```

## Чтение конфигурации

### Из переменных окружения

```typescript
export const readFromEnv = () => {
  return {
    API_KEY: process.env.MY_API_KEY,
    TIMEOUT: parseInt(process.env.TIMEOUT || '30000'),
    DEBUG: process.env.DEBUG === 'true',
    ENDPOINT: process.env.ENDPOINT
  };
};
```

### Из файла

```typescript
import fs from 'fs';
import path from 'path';

export const readFromFile = (filePath: string) => {
  const configPath = path.resolve(filePath);
  const configData = fs.readFileSync(configPath, 'utf-8');

  try {
    const config = JSON.parse(configData);
    return config;
  } catch (error) {
    throw new Error(`Ошибка парсинга файла конфигурации: ${error.message}`);
  }
};

// Использование
const config = readFromFile('./config/my-plugin.json');
```

### Из нескольких источников

```typescript
export const mergeConfigs = (...configs: any[]) => {
  return configs.reduce((acc, config) => {
    return { ...acc, ...config };
  }, {});
};

// Приоритет: CLI > env > file > defaults
export const loadConfig = () => {
  const defaultConfig = {
    timeout: 30000,
    debug: false
  };

  const fileConfig = fs.existsSync('./config.json')
    ? JSON.parse(fs.readFileSync('./config.json', 'utf-8'))
    : {};

  const envConfig = {
    timeout: parseInt(process.env.TIMEOUT || '0'),
    debug: process.env.DEBUG === 'true'
  };

  const cliConfig = process.argv.includes('--debug') ? { debug: true } : {};

  return mergeConfigs(defaultConfig, fileConfig, envConfig, cliConfig);
};
```

## Безопасность конфигурации

### 1. Секреты

```typescript
// Никогда не логируем секреты
const config = {
  API_KEY: process.env.API_KEY,
  // ...
};

// Логируем с маскировкой
logger.info('Loaded config', {
  apiKey: config.API_KEY?.substring(0, 8) + '...', // Показываем только начало
  hasApiKey: !!config.API_KEY,
  timeout: config.TIMEOUT
});
```

### 2. Валидация секретов

```typescript
const secretSchema = z.object({
  API_KEY: z.string()
    .min(10, 'API_KEY слишком короткий')
    .max(100, 'API_KEY слишком длинный')
    .refine(val => !val.includes(' '), 'API_KEY не должен содержать пробелы')
});

const validateSecret = (key: string, value: string) => {
  try {
    secretSchema.parse({ [key]: value });
    return true;
  } catch {
    return false;
  }
};
```

### 3. Шифрование

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

## Динамическая конфигурация

### Обновление в runtime

```typescript
class ConfigService extends Service {
  private config: Record<string, any> = {};
  private listeners: Function[] = [];

  constructor(runtime: IAgentRuntime) {
    super(runtime);
    this.loadConfig();
  }

  updateConfig(newConfig: Record<string, any>) {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
  }

  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  get(key: string, defaultValue?: any): any {
    return this.config[key] ?? defaultValue;
  }

  onChange(listener: Function) {
    this.listeners.push(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }
}
```

### Hot Reload

```typescript
import chokidar from 'chokidar';

class FileConfigService extends Service {
  private watcher: any;

  constructor(runtime: IAgentRuntime, private configPath: string) {
    super(runtime);
  }

  async start(runtime: IAgentRuntime) {
    // Наблюдаем за файлом
    this.watcher = chokidar.watch(this.configPath);

    this.watcher.on('change', async () => {
      logger.info('[ConfigService] Config file changed, reloading...');
      await this.loadConfig();
    });

    return this;
  }

  private async loadConfig() {
    const config = await readFromFile(this.configPath);
    this.updateConfig(config);
  }
}
```

## Конфигурация по окружениям

### Файлы для разных окружений

```
config/
├── default.json      # По умолчанию
├── development.json  # Разработка
├── test.json         # Тесты
└── production.json   # Продакшен
```

```typescript
export const getConfigForEnv = (env: string) => {
  const baseConfig = JSON.parse(fs.readFileSync('./config/default.json', 'utf-8'));

  const envConfigPath = `./config/${env}.json`;
  if (fs.existsSync(envConfigPath)) {
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));
    return { ...baseConfig, ...envConfig };
  }

  return baseConfig;
};
```

### Переменные окружения по окружениям

```bash
# .env.development
DEBUG=true
LOG_LEVEL=debug
API_ENDPOINT=https://dev-api.example.com

# .env.production
DEBUG=false
LOG_LEVEL=error
API_ENDPOINT=https://api.example.com
```

```typescript
export const loadEnvConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const envFile = `.env.${env}`;

  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
};
```

## Проверка конфигурации

### Health Check

```typescript
export const checkConfig = async (config: any) => {
  const checks = [];

  // Проверка обязательных полей
  if (!config.API_KEY) {
    checks.push({ field: 'API_KEY', status: 'error', message: 'Не указан' });
  } else {
    checks.push({ field: 'API_KEY', status: 'ok' });
  }

  // Проверка доступности endpoint
  if (config.API_ENDPOINT) {
    try {
      const response = await fetch(config.API_ENDPOINT + '/health');
      checks.push({
        field: 'API_ENDPOINT',
        status: response.ok ? 'ok' : 'error',
        message: response.ok ? 'Доступен' : 'Недоступен'
      });
    } catch (error) {
      checks.push({
        field: 'API_ENDPOINT',
        status: 'error',
        message: 'Ошибка подключения'
      });
    }
  }

  return checks;
};
```

### Предзагрузочная проверка

```typescript
export const preflightCheck = async () => {
  const errors: string[] = [];

  // Проверяем переменные окружения
  const requiredEnvVars = ['API_KEY', 'DATABASE_URL'];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Не установлена переменная окружения: ${varName}`);
    }
  });

  // Проверяем права доступа к файлам
  const requiredFiles = ['./config.json'];
  requiredFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      errors.push(`Файл не найден: ${filePath}`);
    }
  });

  if (errors.length > 0) {
    logger.error('Ошибки конфигурации:', errors);
    throw new Error(`Pre-flight check failed: ${errors.join(', ')}`);
  }

  logger.info('Pre-flight check passed');
};
```

## Примеры конфигурации

### 1. Простой плагин

```typescript
import { z } from 'zod';

const configSchema = z.object({
  API_KEY: z.string().min(1)
});

export const simplePlugin: Plugin = {
  name: 'simple-plugin',
  config: {
    API_KEY: process.env.SIMPLE_PLUGIN_API_KEY
  },

  async init(config, runtime) {
    await configSchema.parseAsync(config);
    logger.info('[SimplePlugin] Initialized');
  }
};
```

### 2. Продвинутый плагин

```typescript
import { z } from 'zod';

const configSchema = z.object({
  API_KEY: z.string().min(1),
  API_SECRET: z.string().min(1),
  ENDPOINT: z.string().url(),
  TIMEOUT: z.number().min(1000).max(60000).default(30000),
  RETRY_COUNT: z.number().min(0).max(5).default(3),
  CACHE_TTL: z.number().min(0).max(3600).default(300),
  DEBUG: z.boolean().default(false),
  HEADERS: z.record(z.string()).optional()
});

export const advancedPlugin: Plugin = {
  name: 'advanced-plugin',

  async init(config, runtime) {
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Сохраняем в environment
      Object.entries(validatedConfig).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = String(value);
        }
      });

      // Логируем с маскировкой секретов
      logger.info('[AdvancedPlugin] Config loaded', {
        hasApiKey: !!validatedConfig.API_KEY,
        endpoint: validatedConfig.ENDPOINT,
        timeout: validatedConfig.TIMEOUT,
        retryCount: validatedConfig.RETRY_COUNT
      });
    } catch (error) {
      logger.error('[AdvancedPlugin] Config validation failed:', error);
      throw error;
    }
  }
};
```

### 3. Плагин с сервисами

```typescript
const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_KEY: z.string().min(1)
});

class ConfigService extends Service {
  private config: any;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    const service = new ConfigService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize() {
    const envConfig = {
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      API_KEY: process.env.API_KEY
    };

    this.config = await configSchema.parseAsync(envConfig);
    logger.info('[ConfigService] Config validated');
  }

  get(key: string) {
    return this.config[key];
  }
}

export const pluginWithServices: Plugin = {
  name: 'plugin-with-services',
  services: [ConfigService]
};
```

## Лучшие практики

### 1. Не храните секреты в коде

```typescript
// ❌ Плохо
const API_KEY = 'sk-1234567890abcdef';

// ✅ Хорошо
const API_KEY = process.env.API_KEY;
```

### 2. Валидация обязательна

```typescript
// ✅ Всегда валидируйте конфигурацию
const schema = z.object({ API_KEY: z.string().min(1) });
const config = await schema.parseAsync(rawConfig);
```

### 3. Значения по умолчанию

```typescript
// ✅ Используйте дефолтные значения
const config = {
  TIMEOUT: parseInt(process.env.TIMEOUT || '30000'),
  DEBUG: process.env.DEBUG === 'true'
};
```

### 4. Документируйте конфигурацию

```typescript
/**
 * Конфигурация плагина
 *
 * @param {string} API_KEY - API ключ для доступа к сервису
 * @param {number} TIMEOUT - Таймаут запросов в миллисекундах (по умолчанию: 30000)
 * @param {boolean} DEBUG - Включить отладочные логи (по умолчанию: false)
 */
const configSchema = z.object({
  API_KEY: z.string().min(1),
  TIMEOUT: z.number().default(30000),
  DEBUG: z.boolean().default(false)
});
```

### 5. Безопасное логирование

```typescript
// ✅ Маскируйте секреты в логах
logger.info('Config loaded', {
  hasApiKey: !!config.API_KEY,
  apiKeyPrefix: config.API_KEY?.substring(0, 8),
  timeout: config.TIMEOUT
});

// ❌ Не логируйте секреты
logger.info('Config loaded', config); // ОПАСНО!
```

### 6. Обработка ошибок

```typescript
async init(config, runtime) {
  try {
    await validateAndLoadConfig(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Детальная информация об ошибках валидации
      const messages = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      throw new Error(`Ошибка валидации конфигурации:\n${messages.join('\n')}`);
    }
    throw error;
  }
}
```

## Отладка конфигурации

### Логирование загрузки

```typescript
async init(config, runtime) {
  logger.info('[MyPlugin] Loading config...');

  const envConfig = {
    API_KEY: process.env.API_KEY,
    TIMEOUT: process.env.TIMEOUT
  };

  logger.info('[MyPlugin] Raw config', {
    hasApiKey: !!envConfig.API_KEY,
    timeout: envConfig.TIMEOUT
  });

  const validated = await schema.parseAsync(envConfig);

  logger.info('[MyPlugin] Config loaded successfully', {
    hasApiKey: !!validated.API_KEY,
    timeout: validated.TIMEOUT
  });
}
```

### Отладочные команды

```typescript
// Добавьте в плагин debug action
const debugConfigAction: Action = {
  name: 'DEBUG_CONFIG',
  similes: ['DEBUG', 'CONFIG'],

  validate: async (runtime, message) => {
    return message.content.text?.includes('debug config');
  },

  handler: async (runtime, message, state, options, callback) => {
    const config = runtime.getSetting('MY_PLUGIN_CONFIG');
    await callback({
      text: `Конфигурация: ${JSON.stringify(config, null, 2)}`
    });
  }
};
```

## Заключение

Правильная конфигурация - основа надежных плагинов. Следуйте принципам:
- Валидируйте все входные данные
- Используйте безопасные методы хранения секретов
- Документируйте параметры конфигурации
- Предоставляйте значения по умолчанию
- Обрабатывайте ошибки gracefully
- Логируйте с маскировкой секретов

Более подробную информацию см. в [DEVELOPMENT.md](./DEVELOPMENT.md) и [API.md](./API.md).
