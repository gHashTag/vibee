# Avatar Faces System

**Персонализированная генерация изображений с LoRA моделями для ElizaOS**

> Расширяемая система управления "лицами" аватара, где каждое лицо = обученная LoRA модель

---

## Возможности

- **Множественные лица** - Каждый пользователь может иметь несколько персонализированных LoRA
- **Тренировка моделей** - Встроенная поддержка обучения через fal.ai
- **Гибкая генерация** - Использование конкретного лица или raw режим
- **Отслеживание статуса** - Мониторинг процесса обучения в реальном времени
- **История генерации** - Сохранение всех созданных изображений
- **MCP интеграция** - Доступ к любым моделям fal.ai через Model Context Protocol

---

## Архитектура

```
src/faces/
├── types.ts                      # TypeScript определения
├── database.ts                   # SQL схема и адаптер
├── services/
│   ├── FaceManagerService.ts     # CRUD для лиц
│   ├── LoraTrainingService.ts    # Обучение LoRA
│   └── FalMcpService.ts          # Генерация через MCP
├── actions/
│   ├── ManageFacesAction.ts      # Команды /face
│   ├── TrainLoraAction.ts        # Команды /face train
│   └── EnhancedNeurophotoAction.ts  # Улучшенный /neurophoto
└── index.ts                      # Экспорт плагина
```

---

## Быстрый старт

### 1. Установка

Система уже интегрирована в проект. Просто добавьте плагин:

```typescript
// src/character.ts
import avatarFacesPlugin from './faces';

export const character: Character = {
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    avatarFacesPlugin, // ✨ Добавьте это
  ],
};
```

### 2. Настройка

Убедитесь, что у вас есть FAL.AI API ключ:

```bash
# .env
FAL_KEY=fal_key_your_key_here
```

### 3. Использование

```bash
# Добавить готовую LoRA
/face add Professional https://storage.fal.ai/lora/xyz.safetensors prof_me

# Установить как default
/face use Professional

# Генерировать изображение
/neurophoto sunset over ocean

# Использовать конкретное лицо
/neurophoto face:Professional in a business suit
```

---

## Команды

### Управление лицами

| Команда                                       | Описание                      |
| --------------------------------------------- | ----------------------------- |
| `/faces`                                      | Список всех лиц               |
| `/face add <name> <lora_url> <trigger>`       | Добавить готовую LoRA         |
| `/face use <name>`                            | Установить как default        |
| `/face delete <name>`                         | Удалить лицо                  |
| `/face status [name]`                         | Проверить статус обучения     |

### Обучение LoRA

| Команда                                              | Описание                      |
| ---------------------------------------------------- | ----------------------------- |
| `/face train <name> <zip_url> <trigger>`             | Обучить новую LoRA            |

### Генерация изображений

| Команда                                          | Описание                          |
| ------------------------------------------------ | --------------------------------- |
| `/neurophoto <prompt>`                           | С default лицом                   |
| `/neurophoto face:<name> <prompt>`               | С конкретным лицом                |
| `/neurophoto raw <prompt>`                       | Без LoRA                          |
| `/neurophoto size:portrait_16_9 <prompt>`        | С кастомным размером              |

---

## Примеры использования

### Добавление лица

```bash
/face add Professional https://storage.fal.ai/lora/abc123.safetensors prof_me "Мой профессиональный образ"
```

**Ответ:**
```
Face "Professional" added successfully!

**Professional**
   - Trigger: `prof_me`
   - Status: ✅ Ready
   - My professional look

Use `/face use Professional` to make it your default face.
```

### Обучение нового лица

```bash
/face train Casual https://my-storage.com/photos.zip me "Casual photos"
```

**Ответ:**
```
Training started for "Casual"!

⏱️ Estimated time: 15-20 minutes
🔄 Status: Training
🎯 Trigger word: `me`

I'll notify you when training completes. You can check progress with:
`/face status Casual`
```

### Генерация с конкретным лицом

```bash
/neurophoto face:Professional at a conference, giving presentation
```

**Ответ:**
```
✨ Image created!

━━━━━━━━━━━━━━━━━━━━
📝 Prompt
at a conference, giving presentation

🎭 Face Details
├ 👤 Face: Professional
├ 🎯 Trigger: `prof_me`
├ 🤖 Model: Flux LoRA
└ ⏱ Time: 25s

[Generated Image]
```

### Raw генерация (без LoRA)

```bash
/neurophoto raw beautiful mountain landscape at sunset
```

---

## База данных

### Таблица: avatar_faces

Хранит информацию о всех лицах пользователей.

| Поле                  | Тип     | Описание                          |
| --------------------- | ------- | --------------------------------- |
| id                    | TEXT    | UUID                              |
| user_id               | TEXT    | ID пользователя                   |
| name                  | TEXT    | Название лица                     |
| trigger_word          | TEXT    | Триггерное слово LoRA             |
| lora_url              | TEXT    | URL к обученной модели            |
| training_status       | TEXT    | pending/training/ready/failed     |
| is_default            | INTEGER | Активное лицо? (0/1)              |
| usage_count           | INTEGER | Сколько раз использовалось        |

### Таблица: face_generations

История всех генераций.

| Поле              | Тип     | Описание                          |
| ----------------- | ------- | --------------------------------- |
| id                | TEXT    | UUID                              |
| face_id           | TEXT    | ID лица                           |
| user_id           | TEXT    | ID пользователя                   |
| prompt            | TEXT    | Промпт генерации                  |
| image_url         | TEXT    | URL результата                    |
| generation_time_ms| INTEGER | Время генерации (мс)              |

---

## API Services

### FaceManagerService

CRUD операции для лиц.

```typescript
const faceManager = runtime.getService<FaceManagerService>('face-manager');

// Создать лицо
await faceManager.createFace({
  userId: 'user-123',
  name: 'Professional',
  triggerWord: 'prof_me',
  loraUrl: 'https://...',
  setAsDefault: true,
});

// Получить default лицо
const result = await faceManager.getDefaultFace('user-123');

// Список лиц
const faces = await faceManager.listFaces({ userId: 'user-123' });
```

### LoraTrainingService

Управление обучением LoRA.

```typescript
const loraTrainer = runtime.getService<LoraTrainingService>('lora-training');

// Начать обучение
await loraTrainer.startTraining({
  userId: 'user-123',
  name: 'Casual',
  imagesZipUrl: 'https://...',
  triggerWord: 'me',
});

// Проверить прогресс
const progress = await loraTrainer.getTrainingProgress('face-id');
```

### FalMcpService

Генерация изображений через MCP.

```typescript
const falMcp = runtime.getService<FalMcpService>('fal-mcp');

// Генерация с лицом
const result = await falMcp.generateWithFace({
  userId: 'user-123',
  faceName: 'Professional',
  prompt: 'at a conference',
  imageSize: 'portrait_4_3',
});

// Raw генерация
const raw = await falMcp.generateRaw('beautiful landscape');
```

---

## Workflow

### 1. Добавление готовой LoRA

```
User → /face add → FaceManagerService → Database
                                      ↓
                                   Success ✓
```

### 2. Обучение новой LoRA

```
User → /face train → LoraTrainingService → FAL.AI API
                                          ↓
                    Database ← Training Job Created
                                          ↓
                    [Background Polling Every 10s]
                                          ↓
                    FAL.AI Status Check → COMPLETED
                                          ↓
                    Database ← LoRA URL Saved
                                          ↓
                    User Notification ✓
```

### 3. Генерация изображения

```
User → /neurophoto → EnhancedNeurophotoAction
                              ↓
                    FalMcpService → Get Default Face
                              ↓
                    Inject Trigger Word
                              ↓
                    FAL.AI API → Generate
                              ↓
                    Save to face_generations
                              ↓
                    Return Image URL ✓
```

---

## Конфигурация

### Environment Variables

```bash
# Обязательные
FAL_KEY=fal_key_...              # FAL.AI API ключ

# Опциональные (legacy support)
FAL_DEFAULT_LORA_PATH=...        # Путь к LoRA по умолчанию
FAL_LORA_TRIGGER=NEURO_SAGE      # Триггерное слово
FAL_DEFAULT_LORA_SCALE=1.0       # Масштаб LoRA (игнорируется)
```

### Database Configuration

```bash
# SQLite (по умолчанию)
DATABASE_URL=sqlite://./data/db.sqlite

# PostgreSQL (для продакшна)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## Troubleshooting

### Проблема: "FAL_KEY not configured"

**Решение:**
```bash
# Убедитесь, что FAL_KEY установлен
echo $FAL_KEY

# Или добавьте в .env
echo "FAL_KEY=fal_key_..." >> .env
```

### Проблема: "No default face set"

**Решение:**
```bash
# Добавьте и установите лицо
/face add Default https://... default_trigger
/face use Default
```

### Проблема: Training failed

**Решение:**
```bash
# Проверьте статус
/face status <name>

# Попробуйте заново
# (Retry будет добавлен автоматически)
```

### Проблема: Database errors

**Решение:**
```bash
# Проверьте, что таблицы созданы
sqlite3 data/db.sqlite ".tables"

# Должно быть: avatar_faces, face_generations

# Если нет, запустите миграцию
# (Автоматически при старте плагина)
```

---

## Ограничения

### Текущая версия (v1.0)

- ✅ Множественные лица на пользователя
- ✅ Асинхронная тренировка
- ✅ История генераций
- ❌ Шаринг лиц между пользователями
- ❌ Категории лиц
- ❌ Кастомные параметры тренировки
- ❌ Смешивание лиц (face mixing)

### Планируется (v2.0)

- Face categories
- Face sharing/marketplace
- Advanced training parameters
- Face mixing
- Generation presets
- Analytics dashboard

---

## Производительность

### Оптимизация базы данных

- Индексы на `user_id`, `training_status`, `is_default`
- Pagination для больших списков
- Connection pooling

### Оптимизация тренировки

- Background polling (non-blocking)
- Exponential backoff для API calls
- Queue для множественных тренировок

### Оптимизация генерации

- Кеширование часто используемых лиц
- Переиспользование LoRA URLs
- Batch запросы (планируется)

---

## Безопасность

### API Keys

- Храните FAL_KEY в переменных окружения
- Никогда не логируйте ключи
- Ротация ключей периодически

### User Data

- Валидация всех входных данных
- Санитизация URL
- Защита от SQL injection
- Rate limiting на тренировку

### Access Control

- Пользователь видит только свои лица
- Cascade delete при удалении пользователя
- Audit trail для тренировок

---

## Мониторинг

### Метрики

- Training success rate
- Training duration
- Generation latency
- Face usage statistics
- Error rates

### Логирование

```typescript
// Structured logging with context
logger.info('[FACE_MANAGER] Creating face', { userId, name });
logger.error('[LORA_TRAINING] Training failed', { faceId, error });
```

### Алерты

- Training failures > 10%
- API quota exceeded
- Database errors
- High latency (>60s for generation)

---

## Contributing

### Code Style

```typescript
// Prefer async/await
async function createFace(input: CreateFaceInput): Promise<ServiceResult<AvatarFace>> {
  // ...
}

// Use ServiceResult pattern
return {
  success: true,
  data: face,
};

// Error handling with codes
return {
  success: false,
  error: {
    code: FaceErrorCode.NOT_FOUND,
    message: 'Face not found',
  },
};
```

### Testing

```bash
# Run tests
bun test src/faces

# Run specific test
bun test src/faces/services/FaceManager.test.ts

# Coverage
bun test --coverage
```

---

## Документация

Полная документация доступна в:

- [Architecture Guide](../../docs/avatar-faces-architecture.md)
- [Migration Guide](../../docs/avatar-faces-migration.md)

---

## License

Часть проекта Vibee. Все права защищены.

---

## Support

Если у вас возникли вопросы:

1. Проверьте [FAQ](../../docs/avatar-faces-migration.md#faq)
2. Посмотрите [Troubleshooting](#troubleshooting)
3. Откройте issue в репозитории

---

**Version:** 1.0.0
**Last Updated:** 2025-11-12
**Status:** Production Ready ✓
