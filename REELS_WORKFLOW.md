# 🎬 Reels Creation Workflow - Полная логика

## Обзор системы

Автоматизированная система создания Reels из RSS новостей с пошаговым согласованием через Telegram.

## Полный workflow (6 шагов)

### Шаг 0: RSS Feed → Telegram Post
**Триггер:** Новая релевантная новость в RSS ленте
**Действие:**
1. RSS Monitor получает новость
2. LLM генерирует профессиональный пост на русском языке:
   - 🔥 Цепляющий заголовок
   - Краткая суть (2-3 предложения)
   - 💡 Почему это важно
   - ✨ Практическая ценность
   - 🔗 Ссылка
3. Пост отправляется в Telegram админу

**Кнопки:**
- `📝 Создать сценарий для Reels` → Шаг 1
- `❌ Пропустить` → Завершение

**Данные сохраняются:**
- `newsId` (base64 hash ссылки)
- `newsCache[newsId]` = { title, link, contentSnippet }

---

### Шаг 1: Генерация сценария для Reels
**Триггер:** Нажатие кнопки "Создать сценарий для Reels"
**Действие:**
1. Из кеша извлекаются данные новости по `newsId`
2. LLM генерирует текст для Reels (150-200 слов, 30-40 сек):
   - 🔥 **ХУК** (первые 3 секунды) - цепляющее начало
   - 💡 **СУТЬ** - главная информация (2-3 предложения)
   - ✨ **ИНСАЙТ** - почему это важно
   - 🎯 **CALL TO ACTION** - призыв к действию
3. Текст отправляется пользователю

**Кнопки:**
- `✅ Одобрить текст` → Шаг 2
- `🔄 Перегенерировать` → Повтор Шага 1
- `❌ Отменить` → Завершение

**Данные сохраняются:**
- `session[userId].step = 'text'`
- `session[userId].reelsText = generatedText`

---

### Шаг 2: Генерация аудио (TTS)
**Триггер:** Одобрение текста
**Действие:**
1. Текст из session отправляется в OpenAI TTS API:
   - Model: `tts-1-hd`
   - Voice: `nova` (женский, энергичный)
   - Speed: `1.1x` (для Reels)
2. Аудио файл сохраняется в `/tmp/audio_{timestamp}.mp3`
3. Аудио отправляется пользователю для прослушивания

**Кнопки:**
- `✅ Одобрить аудио` → Шаг 3
- `🔄 Перегенерировать` → Повтор Шага 2 (другой voice/speed)
- `❌ Отменить` → Завершение

**Данные сохраняются:**
- `session[userId].step = 'audio'`
- `session[userId].audioUrl = '/tmp/audio_xxx.mp3'`

---

### Шаг 3: Генерация промпта для изображения
**Триггер:** Одобрение аудио
**Действие:**
1. LLM генерирует промпт на английском для AI генератора:
   - Main subject (что изобразить)
   - Style & mood
   - Technical details (composition, lighting, colors)
   - Portrait orientation (9:16)
   - Quality tags
2. Промпт отправляется пользователю

**Кнопки:**
- `✅ Использовать этот промпт` → Шаг 4
- `✏️ Редактировать промпт` → Telegram ждёт текст от пользователя → Шаг 4
- `❌ Отменить` → Завершение

**Данные сохраняются:**
- `session[userId].step = 'image_prompt'`
- `session[userId].imagePrompt = generatedPrompt`

---

### Шаг 4: Генерация изображения
**Триггер:** Одобрение/редактирование промпта
**Действие:**
1. Промпт отправляется в Fal.ai `flux-pro` model:
   - Size: 720x1280 (9:16 для Reels)
   - Inference steps: 28
   - Guidance scale: 3.5
2. Изображение генерируется (~20-30 секунд)
3. Изображение отправляется пользователю

**Кнопки:**
- `✅ Одобрить изображение` → Шаг 5
- `🔄 Перегенерировать` → Повтор Шага 4 (новый seed)
- `✏️ Изменить промпт` → Возврат к Шагу 3
- `❌ Отменить` → Завершение

**Данные сохраняются:**
- `session[userId].step = 'image'`
- `session[userId].imageUrl = 'https://fal.ai/...'`

---

### Шаг 5: Генерация финального видео (Lip Sync)
**Триггер:** Одобрение изображения
**Действие:**
1. Аудио файл загружается в Fal.ai CDN: `fal.storage.upload(audioFile)`
2. Запрос в Fal.ai `lipsync` model:
   - `video_url`: imageUrl (изображение используется как первый кадр)
   - `audio_url`: uploadedAudioUrl
3. Видео генерируется (~60-90 секунд)
4. Готовое видео отправляется пользователю

**Кнопки:**
- `📤 Опубликовать в Instagram` → Публикация
- `📤 Опубликовать в TikTok` → Публикация
- `💾 Сохранить` → Сохранение в базу
- `🔄 Перегенерировать видео` → Повтор Шага 5
- `✅ Готово` → Завершение, очистка session

**Данные сохраняются:**
- `session[userId].step = 'lipsync'`
- `session[userId].videoUrl = 'https://fal.ai/...'`

---

## Обработка ошибок

### Таймауты и retry logic:
- **LLM генерация**: 3 попытки с экспоненциальным backoff
- **Fal.ai генерация**: Polling каждые 2 секунды до `status === 'COMPLETED'`
- **TTS генерация**: 2 попытки

### Fallback значения:
- **Текст для Reels**: Простой шаблон с заголовком новости
- **Image prompt**: "A modern futuristic AI technology concept..."
- **Аудио**: Пропуск шага, использование только изображения

---

## Хранение состояния

### Session Management
```typescript
interface ContentSession {
  newsTitle: string;
  newsLink: string;
  newsContent?: string;
  step: 'text' | 'audio' | 'image_prompt' | 'image' | 'lipsync';
  reelsText?: string;
  audioUrl?: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
}

// In-memory storage (Map)
private sessions: Map<string, ContentSession> = new Map();
```

### News Cache
```typescript
// Global cache для хранения данных новостей
(global as any).newsCache = new Map<string, {
  title: string;
  link: string;
  contentSnippet?: string;
}>();
```

---

## Callback Data Format

Telegram ограничивает callback_data до 64 байт. Используем короткие форматы:

```typescript
// Шаг 0 → 1
'reels:{newsId}'           // newsId = base64(url).slice(0, 32)

// Шаг 1 → 2
'approve_text'
'regen_text'

// Шаг 2 → 3
'approve_audio'
'regen_audio'

// Шаг 3 → 4
'approve_prompt'
'edit_prompt'

// Шаг 4 → 5
'approve_image'
'regen_image'
'edit_prompt_back'

// Шаг 5 → Завершение
'approve_video'
'regen_video'
'publish_instagram'
'publish_tiktok'
'save_video'

// Общие
'cancel'
'skip'
```

---

## Используемые API

1. **OpenAI API**
   - Text generation (GPT-4o-mini)
   - TTS (tts-1-hd, voice: nova)

2. **Fal.ai API**
   - Image generation (flux-pro)
   - Lip sync (lipsync model)
   - Storage (CDN для аудио/изображений)

3. **Telegram Bot API**
   - sendMessage с inline keyboards
   - sendPhoto
   - sendAudio
   - sendVideo
   - answerCallbackQuery

---

## Логи и мониторинг

```typescript
logger.info('[ContentCreation] 🎬 Initializing...')
logger.info('[ContentCreation] ✅ Ready')
logger.info('[CallbackHandler] 🎛️ Handling: approve_text')
logger.info('[RSSMonitor] 📰 New item: {title}')
logger.info('[RSSMonitor] ✅ Posted to Telegram')
logger.error('[ContentCreation] ❌ Failed: {error}')
```

---

## Тестовые сценарии

См. `/Users/playra/vibee/tests/reels-workflow.test.ts`
