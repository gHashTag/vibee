# AI Provider Plugins

Модульная система AI провайдеров для Vibee проекта. 10 готовых к использованию провайдеров с fail-over поддержкой и health monitoring.

## 🎯 Провайдеры

### 1. Kie.ai (Видео и Аудио)
- **Файл**: `providers/kie-ai/`
- **Функции**: Генерация видео из текста, text-to-speech
- **Особенности**: Fail-over цепочки, job tracking, webhooks
- **Пример**:
  ```typescript
  const provider = createKieAIProvider({
    apiKey: 'your-key',
    timeout: 60000,
  });
  ```

### 2. Replicate (20+ моделей)
- **Файл**: `providers/replicate/`
- **Функции**: Image, video, audio, text generation
- **Модели**: Flux, SD3, Llama, Mixtral, AudioLDM2, Riffusion и др.
- **Особенности**: Async jobs, prediction management, 20+ моделей
- **Пример**:
  ```typescript
  const imageProvider = createReplicateImageProvider({ apiKey: 'your-key' });
  const videoProvider = createReplicateVideoProvider({ apiKey: 'your-key' });
  ```

### 3. Fal.ai (Изображения, Видео, Аудио)
- **Файл**: `providers/fal/`
- **Модели**: Flux Pro/Dev/Schnell, Video Diffusion, Fish Speech
- **Особенности**: LoRA support, fast inference, safety checker
- **Пример**:
  ```typescript
  const fluxProvider = createFluxProProvider({ apiKey: 'your-key' });
  ```

### 4. ElevenLabs (Голоса и Клонирование)
- **Файл**: `providers/elevenlabs/`
- **Функции**: Text-to-speech, voice cloning, 29 языков
- **Особенности**: 8 premade voices, custom voice cloning
- **Пример**:
  ```typescript
  const voiceProvider = createElevenLabsProvider({ apiKey: 'your-key' });
  const result = await voiceProvider.cloneVoice({
    name: 'Custom Voice',
    files: ['sample1.mp3', 'sample2.mp3'],
  });
  ```

### 5. OpenAI (GPT-4, Vision, TTS)
- **Файл**: `providers/openai/`
- **Функции**: Chat, image analysis, text-to-speech, embeddings
- **Модели**: gpt-4o, gpt-4o-mini, tts-1
- **Пример**:
  ```typescript
  const openaiProvider = createOpenAIProvider({ apiKey: 'your-key' });
  const chatResult = await openaiProvider.chat([
    { role: 'user', content: 'Hello!' }
  ]);
  ```

### 6. HeyGen (Аватары и Lip Sync)
- **Файл**: `providers/heygen/`
- **Функции**: Talking avatars, video generation, live streaming
- **Особенности**: Real-time streaming, lip sync
- **Пример**:
  ```typescript
  const avatarProvider = createHeyGenProvider({ apiKey: 'your-key' });
  const videoResult = await avatarProvider.generate({
    avatar_id: 'custom-avatar',
    script: 'Hello, this is my talking avatar!',
  });
  ```

### 7. HuggingFace (Открытые модели)
- **Файл**: `providers/huggingface/`
- **Функции**: Open source models, text generation
- **Особенности**: Бесплатные модели, community driven
- **Пример**:
  ```typescript
  const hfProvider = createHuggingFaceProvider({ apiKey: 'your-key' });
  const models = await hfProvider.getModels('text-generation');
  ```

### 8. Runway (Генерация видео)
- **Файл**: `providers/runway/`
- **Модели**: Gen-3 Alpha, Gen-3 Alpha Turbo
- **Особенности**: High-quality video generation
- **Пример**:
  ```typescript
  const videoProvider = createRunwayProvider({ apiKey: 'your-key' });
  ```

### 9. Midjourney (Изображения)
- **Файл**: `providers/midjourney/`
- **Функции**: High-quality image generation
- **Модели**: v5, v6, niji
- **Особенности**: Artistic style, multiple versions
- **Пример**:
  ```typescript
  const mjProvider = createMidjourneyProvider({ apiKey: 'your-key' });
  const imageResult = await mjProvider.generate({
    prompt: 'A beautiful sunset over mountains',
    version: 'v6',
    aspectRatio: '16:9',
  });
  ```

### 10. Apify (Instagram Downloader)
- **Файл**: `providers/apify/`
- **Функции**: Instagram content scraping, download
- **Особенности**: User posts, hashtags, stories
- **Пример**:
  ```typescript
  const apifyProvider = createApifyProvider({ apiKey: 'your-key' });
  const downloadResult = await apifyProvider.generate({
    url: 'https://instagram.com/username',
    resultsType: 'posts',
    resultsLimit: 50,
  });
  ```

## 🏗️ Архитектура

```
providers/
├── base/
│   ├── types.ts          # Базовые типы и интерфейсы
│   ├── ProviderFactory.ts # Фабрика и утилиты
│   └── index.ts          # Экспорт базовых модулей
├── kie-ai/
│   ├── types.ts          # Типы Kie.ai
│   ├── generate.ts       # Генерация контента
│   ├── healthCheck.ts    # Проверка здоровья
│   ├── Provider.ts       # Фабрика провайдера
│   ├── README.md         # Документация
│   └── index.ts          # Экспорт
├── replicate/
├── fal/
├── elevenlabs/
├── openai/
├── heygen/
├── huggingface/
├── runway/
├── midjourney/
├── apify/
└── index.ts              # Главный экспорт
```

## 🔧 Базовые компоненты

### ProviderConfig

```typescript
interface ProviderConfig {
  apiKey: string;              // API ключ
  baseUrl?: string;            // Базовый URL API
  timeout?: number;            // Таймаут запроса
  retryAttempts?: number;      // Количество попыток
  headers?: Record<string, string>; // Доп. заголовки
  rateLimit?: {                // Rate limiting
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}
```

### ProviderResult

```typescript
interface ProviderResult {
  success: boolean;            // Успех операции
  data?: any;                  // Данные результата
  error?: string;              // Сообщение об ошибке
  metadata?: Record<string, any>; // Метаданные
  cost?: number;               // Стоимость операции
  executionTime?: number;      // Время выполнения
}
```

### PluginHealthStatus

```typescript
interface PluginHealthStatus {
  healthy: boolean;            // Статус здоровья
  latency?: number;            // Задержка в ms
  error?: string;              // Описание ошибки
  lastChecked: Date;           // Время проверки
  statusCode?: number;         // HTTP код
}
```

## 💡 Использование

### Базовое использование

```typescript
import {
  createKieAIProvider,
  createFalProvider,
  SimplePluginRegistry,
} from '@/plugins/providers';

const registry = new SimplePluginRegistry();

// Создаем провайдеры
const kieProvider = createKieAIProvider({
  apiKey: process.env.KIE_AI_KEY!,
  timeout: 60000,
});

const falProvider = createFalProvider({
  apiKey: process.env.FAL_KEY!,
  timeout: 30000,
});

// Регистрируем в реестре
registry.registerProvider(kieProvider);
registry.registerProvider(falProvider);

// Получаем провайдер
const provider = registry.getProvider('kie');
if (provider) {
  const result = await provider.generate({
    prompt: 'A beautiful landscape',
    contentType: 'image',
  });
}
```

### Fail-over цепочка

```typescript
import {
  createKieAIProviderWithFailover,
  providers,
} from '@/plugins/providers';

const primary = createKieAIProvider({
  apiKey: process.env.KIE_KEY!,
});

const failoverProvider = providers.kie.createWithFailover(
  { apiKey: process.env.KIE_KEY! },
  [
    {
      name: 'fal',
      generate: providers.fal.createImage({ apiKey: process.env.FAL_KEY! }).generate,
    },
    {
      name: 'replicate',
      generate: providers.replicate.create({ apiKey: process.env.REPLICATE_KEY! }).generate,
    },
  ]
);

const result = await failoverProvider.generate({
  prompt: 'Create an image',
  contentType: 'image',
});
```

### Специализированные провайдеры

```typescript
import { providers } from '@/plugins/providers';

// Только изображения
const imageProvider = providers.fal.createImage({
  apiKey: process.env.FAL_KEY!,
});

// Только видео
const videoProvider = providers.replicate.createVideo({
  apiKey: process.env.REPLICATE_KEY!,
});

// Только аудио
const audioProvider = providers.elevenlabs.create({
  apiKey: process.env.ELEVENLABS_KEY!,
});
```

### Health Monitoring

```typescript
const providers = [
  createKieAIProvider({ apiKey: 'key1' }),
  createFalProvider({ apiKey: 'key2' }),
  createOpenAIProvider({ apiKey: 'key3' }),
];

const healthChecks = await Promise.all(
  providers.map(p => p.healthCheck())
);

healthChecks.forEach((health, index) => {
  console.log(`Provider ${index}: ${health.healthy ? 'OK' : health.error}`);
});
```

### Модель-менеджмент

```typescript
// Получаем список моделей
const models = await falProvider.getModels();
console.log(`Available models: ${models.length}`);

// Получаем конкретную модель
const model = await falProvider.getModel('fal-ai/flux-pro');
console.log(model?.description);

// Проверяем здоровье модели
const modelHealth = await falProvider.checkModel('fal-ai/flux-pro');
console.log(modelHealth);
```

## 🔍 Health Checks

Все провайдеры поддерживают проверку здоровья:

```typescript
const health = await provider.healthCheck();

if (!health.healthy) {
  console.error('Provider is unhealthy:', health.error);
  console.log('Latency:', health.latency, 'ms');
  console.log('Status code:', health.statusCode);
}
```

## 📊 Мониторинг

### Cost Tracking

```typescript
const cost = await provider.estimate('model-id', {
  prompt: 'Generate image',
  contentType: 'image',
});

console.log(`Estimated cost: $${cost}`);
```

### Usage Stats

```typescript
// Получаем метрики (если доступно)
const subscription = await provider.getSubscriptionInfo();
console.log('Usage:', subscription.used, '/', subscription.limit);
```

## 🛠️ Интеграция с Vibee

```typescript
// В character.ts или plugins
import { providers } from '@/plugins/providers';

export const character: Character = {
  // ...
  plugins: [
    createElevenLabsProvider({
      apiKey: env.ELEVENLABS_API_KEY,
      timeout: 30000,
    }),
  ],
};
```

## 🎨 Примеры реального использования

### Генерация изображения с LoRA

```typescript
const result = await falProvider.generate({
  prompt: 'A portrait in the style of anime',
  contentType: 'image',
  model: 'fal-ai/flux-lora',
  loras: [
    {
      path: 'https://my-lora.safetensors',
      scale: 0.8,
    },
  ],
});
```

### Клонирование голоса

```typescript
const voice = await elevenLabsProvider.cloneVoice({
  name: 'CEO Voice',
  description: 'Voice clone for corporate use',
  files: [
    'https://samples/ceo1.mp3',
    'https://samples/ceo2.mp3',
  ],
});
```

### Генерация видео

```typescript
const video = await kieProvider.generate({
  prompt: 'A cat playing in a garden',
  contentType: 'video',
  duration: 10,
  quality: 'high',
});
```

### Chat с GPT-4

```typescript
const response = await openaiProvider.chat([
  {
    role: 'system',
    content: 'You are a helpful assistant.',
  },
  {
    role: 'user',
    content: 'Explain quantum computing',
  },
], 'gpt-4o');
```

## 🔐 Безопасность

- API ключи читаются из переменных окружения
- Все запросы проходят через единый фабричный слой
- Валидация параметров на каждом уровне
- Rate limiting поддерживается на уровне конфига

## 📈 Performance

- Среднее время генерации: 1-60 секунд (зависит от модели)
- Concurrent requests: Ограничены настройками провайдера
- Cache: Реализован на уровне приложения
- Retry logic: Автоматические повторы при ошибках

## 🧪 Тестирование

```typescript
import { createKieAIProvider } from '@/plugins/providers';

const provider = createKieAIProvider({
  apiKey: 'test-key',
  baseUrl: 'https://test-api.kie.ai',
});

// Тест здоровья
const health = await provider.healthCheck();
expect(health.healthy).toBe(true);
```

## 📝 Логирование

```typescript
const provider = createKieAIProvider(
  { apiKey: 'your-key' },
  (context) => {
    console.log(`[${context.level}] ${context.message}`, context.data);
  }
);
```

## 🚀 Расширение

Чтобы добавить новый провайдер:

1. Создайте директорию `providers/new-provider/`
2. Реализуйте `types.ts`, `generate.ts`, `healthCheck.ts`, `Provider.ts`
3. Экспортируйте фабрику в `index.ts`
4. Добавьте в главный `index.ts`

## 📄 Лицензия

MIT

## 🤝 Контрибьюшен

Следуйте архитектурным паттернам:
- Функциональный стиль
- TypeScript строгая типизация
- Единая система типов
- Health checks для всех провайдеров
- Comprehensive error handling

---

**Все 10 провайдеров готовы к работе! ✅**
