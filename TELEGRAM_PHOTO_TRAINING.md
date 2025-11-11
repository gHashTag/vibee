# 📸 Система обучения LoRA через Telegram фото

**Дата**: 2025-11-12
**Цель**: Пользователь отправляет фото в Telegram → бот создаёт ZIP → обучает LoRA

---

## 🎯 Как это работает

### Процесс для пользователя:

```
1. Пользователь: /train start МоёЛицо my_face
   Бот: "Отправь 10-20 фотографий лица. Когда закончишь, напиши /train confirm"

2. Пользователь: [отправляет фото] [отправляет фото] [отправляет фото]...
   Бот: "Фото 1/20 сохранено ✅"
   Бот: "Фото 2/20 сохранено ✅"
   ...

3. Пользователь: /train confirm
   Бот: "Создаю ZIP архив из 15 фотографий..."
   Бот: "Отправляю на обучение... ⏱️ Ожидание 15-30 минут"

4. [30 минут спустя]
   Бот: "✅ Обучение завершено! Лицо 'МоёЛицо' готово к использованию"

5. Пользователь: /neurophoto face:МоёЛицо на пляже
   Бот: [генерирует изображение с твоим лицом]
```

---

## 🔧 Технический план

### Telegram Bot API - Получение файлов

Telegram предоставляет файлы через Bot API:

```typescript
// Когда пользователь отправляет фото
message.photo // массив размеров фото
message.photo[0].file_id // ID файла в Telegram

// Получаем информацию о файле
const file = await bot.telegram.getFile(file_id)
// Результат:
// {
//   file_id: "AgACAgIAAxkBAAI...",
//   file_unique_id: "AQADWqoxG74...",
//   file_size: 89581,
//   file_path: "photos/file_123.jpg"
// }

// Скачиваем файл
const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
```

**Никакого S3 не нужно!** Telegram хранит файлы 1 год.

---

## 📋 Архитектура решения

### Компоненты:

```
src/faces/
├── actions/
│   └── TrainWithPhotosAction.ts       # NEW: /train команды
├── services/
│   ├── PhotoCollectorService.ts       # NEW: Сбор фото из Telegram
│   ├── ZipCreatorService.ts           # NEW: Создание ZIP
│   └── LoraTrainingService.ts         # EXISTING: Отправка на fal.ai
└── database.ts                        # Хранение состояния сбора
```

---

## 📝 Новые таблицы БД

```sql
-- Сессии сбора фото
CREATE TABLE training_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  face_name TEXT NOT NULL,
  trigger_word TEXT NOT NULL,
  status TEXT CHECK(status IN ('collecting', 'ready', 'training', 'completed', 'failed')),
  photos_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 20,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Собранные фото
CREATE TABLE training_photos (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  telegram_file_id TEXT NOT NULL,
  telegram_file_path TEXT NOT NULL,
  file_size INTEGER,
  order_index INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id)
);
```

---

## 🎬 Пошаговая реализация

### Шаг 1: PhotoCollectorService

```typescript
// src/faces/services/PhotoCollectorService.ts

export class PhotoCollectorService extends Service {
  static serviceType = 'photo-collector' as ServiceType;

  // Создать новую сессию
  async createSession(userId: string, faceName: string, trigger: string) {
    const session = {
      id: uuidv4(),
      user_id: userId,
      face_name: faceName,
      trigger_word: trigger,
      status: 'collecting',
      photos_count: 0,
      target_count: 20,
      created_at: Date.now(),
    };

    await runtime.run(`INSERT INTO training_sessions ...`, [session]);
    return session;
  }

  // Добавить фото к сессии
  async addPhoto(sessionId: string, fileId: string, filePath: string, fileSize: number) {
    const session = await this.getSession(sessionId);

    const photo = {
      id: uuidv4(),
      session_id: sessionId,
      telegram_file_id: fileId,
      telegram_file_path: filePath,
      file_size: fileSize,
      order_index: session.photos_count + 1,
      created_at: Date.now(),
    };

    await runtime.run(`INSERT INTO training_photos ...`, [photo]);
    await runtime.run(`UPDATE training_sessions SET photos_count = photos_count + 1 ...`);

    return photo;
  }

  // Получить все фото сессии
  async getPhotos(sessionId: string) {
    return await runtime.all(`SELECT * FROM training_photos WHERE session_id = ?`, [sessionId]);
  }
}
```

---

### Шаг 2: ZipCreatorService

```typescript
// src/faces/services/ZipCreatorService.ts
import AdmZip from 'adm-zip';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class ZipCreatorService extends Service {
  static serviceType = 'zip-creator' as ServiceType;

  async createZipFromTelegramPhotos(sessionId: string): Promise<string> {
    const photos = await photoCollector.getPhotos(sessionId);
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // Создаём временную папку
    const tempDir = path.join('/tmp', `training-${sessionId}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Скачиваем все фото
    for (const photo of photos) {
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${photo.telegram_file_path}`;
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const filename = `photo_${photo.order_index}.jpg`;
      fs.writeFileSync(path.join(tempDir, filename), response.data);
    }

    // Создаём ZIP
    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);

    const zipPath = path.join('/tmp', `${sessionId}.zip`);
    zip.writeZip(zipPath);

    // Очищаем временную папку
    fs.rmSync(tempDir, { recursive: true });

    return zipPath;
  }

  // Загрузить ZIP на временный хостинг
  async uploadToTempHost(zipPath: string): Promise<string> {
    // Вариант 1: file.io (бесплатно, 1 скачивание)
    const formData = new FormData();
    formData.append('file', fs.createReadStream(zipPath));

    const response = await axios.post('https://file.io', formData);
    return response.data.link; // https://file.io/abc123

    // Вариант 2: transfer.sh (бесплатно, 14 дней)
    // const response = await axios.put(
    //   `https://transfer.sh/${path.basename(zipPath)}`,
    //   fs.createReadStream(zipPath)
    // );
    // return response.data;
  }
}
```

---

### Шаг 3: TrainWithPhotosAction

```typescript
// src/faces/actions/TrainWithPhotosAction.ts

export const trainWithPhotosAction: Action = {
  name: 'TRAIN_LORA_WITH_PHOTOS',
  similes: ['TRAIN_FACE', 'TRAIN_START', 'TRAIN_CONFIRM'],
  description: 'Train LoRA model by collecting photos from Telegram',

  validate: async (runtime, message) => {
    const text = message.content.text?.toLowerCase();
    return text?.includes('/train') || false;
  },

  handler: async (runtime, message, state, options, callback) => {
    const text = message.content.text;
    const userId = message.entityId;

    // /train start МоёЛицо my_face
    if (text.includes('/train start')) {
      const parts = text.split(' ');
      const faceName = parts[2];
      const trigger = parts[3];

      if (!faceName || !trigger) {
        await callback({ text: '❌ Использование: /train start <название> <триггер>' });
        return;
      }

      // Создаём сессию
      const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector');
      const session = await photoCollector.createSession(userId, faceName, trigger);

      await callback({
        text: `✅ Начинаем обучение лица "${faceName}"!\n\n` +
              `📸 Отправь 10-20 фотографий твоего лица:\n` +
              `   - Разные ракурсы\n` +
              `   - Хорошее освещение\n` +
              `   - Только твоё лицо (без других людей)\n\n` +
              `Когда закончишь, напиши: /train confirm`
      });

      return { success: true };
    }

    // /train confirm
    if (text.includes('/train confirm')) {
      const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector');
      const session = await photoCollector.getActiveSession(userId);

      if (!session) {
        await callback({ text: '❌ Нет активной сессии. Начни с /train start' });
        return;
      }

      if (session.photos_count < 10) {
        await callback({
          text: `⚠️ Недостаточно фото: ${session.photos_count}/10\nОтправь ещё ${10 - session.photos_count} фото`
        });
        return;
      }

      // Создаём ZIP
      await callback({ text: `📦 Создаю архив из ${session.photos_count} фотографий...` });

      const zipCreator = runtime.getService<ZipCreatorService>('zip-creator');
      const zipPath = await zipCreator.createZipFromTelegramPhotos(session.id);
      const zipUrl = await zipCreator.uploadToTempHost(zipPath);

      // Отправляем на обучение
      await callback({ text: `🚀 Отправляю на обучение...\n⏱️ Это займёт 15-30 минут` });

      const loraTrainer = runtime.getService<LoraTrainingService>('lora-trainer');
      const result = await loraTrainer.trainLora({
        imagesUrl: zipUrl,
        triggerWord: session.trigger_word,
        steps: 2500,
      });

      // Сохраняем результат
      await runtime.run(
        `UPDATE training_sessions SET status = 'training', training_job_id = ? WHERE id = ?`,
        [result.requestId, session.id]
      );

      await callback({
        text: `✅ Обучение запущено!\n\n` +
              `🎯 Лицо: ${session.face_name}\n` +
              `🎭 Триггер: \`${session.trigger_word}\`\n` +
              `📊 Фотографий: ${session.photos_count}\n` +
              `⏱️ Примерное время: 20-30 минут\n\n` +
              `Я уведомлю тебя когда обучение завершится!`
      });

      return { success: true };
    }
  }
};
```

---

### Шаг 4: Обработка входящих фото

```typescript
// В Telegram message handler (plugin-telegram)

// Когда приходит фото
if (message.photo) {
  const photoCollector = runtime.getService<PhotoCollectorService>('photo-collector');
  const activeSession = await photoCollector.getActiveSession(userId);

  if (activeSession && activeSession.status === 'collecting') {
    // Пользователь в режиме сбора фото
    const largestPhoto = message.photo[message.photo.length - 1]; // Берём самый большой размер
    const file = await bot.telegram.getFile(largestPhoto.file_id);

    await photoCollector.addPhoto(
      activeSession.id,
      largestPhoto.file_id,
      file.file_path,
      file.file_size
    );

    await bot.telegram.sendMessage(
      message.chat.id,
      `✅ Фото ${activeSession.photos_count + 1}/20 сохранено`
    );
  }
}
```

---

## 📦 Зависимости

```bash
# ZIP архивирование
bun add adm-zip
bun add @types/adm-zip --dev

# HTTP запросы
bun add axios

# Работа с файлами (встроено в Node.js)
# fs, path
```

---

## ⏱️ Таймлайн обучения

```
1. Пользователь отправляет 15 фото          [2-3 минуты]
2. Бот скачивает фото из Telegram           [10-15 секунд]
3. Создание ZIP архива                      [2-3 секунды]
4. Загрузка ZIP на file.io                  [5-10 секунд]
5. Отправка на fal.ai                       [1 секунда]
6. Обучение LoRA модели                     [15-30 минут]
7. Получение готовой модели                 [1 секунда]
ИТОГО: ~20-35 минут
```

---

## 🎯 Пример использования

```bash
# Шаг 1: Начать обучение
/train start Casual me

# Бот: "Отправь 10-20 фотографий..."

# Шаг 2: Отправить фото (в Telegram)
[фото 1]
[фото 2]
...
[фото 15]

# Бот после каждого: "✅ Фото 1/20 сохранено"

# Шаг 3: Подтвердить
/train confirm

# Бот: "📦 Создаю архив... 🚀 Отправляю на обучение..."

# Шаг 4: Подождать
[20 минут]

# Бот: "✅ Обучение завершено! Лицо 'Casual' готово"

# Шаг 5: Использовать
/neurophoto face:Casual на пляже в закате

# Бот: [генерирует изображение с твоим лицом]
```

---

## 🔄 Мониторинг обучения

```typescript
// Периодическая проверка статуса (каждые 2 минуты)
setInterval(async () => {
  const sessions = await runtime.all(
    `SELECT * FROM training_sessions WHERE status = 'training'`
  );

  for (const session of sessions) {
    const loraTrainer = runtime.getService<LoraTrainingService>('lora-trainer');
    const status = await loraTrainer.checkStatus(session.training_job_id);

    if (status === 'COMPLETED') {
      // Обучение завершено
      const loraUrl = await loraTrainer.getResultUrl(session.training_job_id);

      // Сохраняем лицо в базу
      await runtime.run(
        `INSERT INTO avatar_faces (id, user_id, name, trigger_word, lora_url, status)
         VALUES (?, ?, ?, ?, ?, 'ready')`,
        [uuidv4(), session.user_id, session.face_name, session.trigger_word, loraUrl]
      );

      // Уведомляем пользователя
      await bot.telegram.sendMessage(
        session.user_id,
        `✅ Обучение лица "${session.face_name}" завершено!\n\n` +
        `Теперь можешь использовать:\n` +
        `/neurophoto face:${session.face_name} <твой промпт>`
      );
    }
  }
}, 120000); // Каждые 2 минуты
```

---

## 🚀 План реализации

### Фаза 1: Базовая инфраструктура (30 минут)
- [x] PhotoCollectorService
- [x] ZipCreatorService
- [x] Database tables

### Фаза 2: Action handlers (20 минут)
- [x] /train start
- [x] /train confirm
- [x] Обработка входящих фото

### Фаза 3: Интеграция с fal.ai (10 минут)
- [x] Отправка ZIP на обучение
- [x] Мониторинг статуса

### Фаза 4: Уведомления (10 минут)
- [x] Уведомление о завершении
- [x] Сохранение готовой LoRA

**ИТОГО**: ~1 час чистого кода

---

## ✅ Готово к реализации!

**Всё что нужно**:
1. Telegram Bot API (уже есть ✅)
2. Базовые Node.js библиотеки (fs, path)
3. adm-zip для создания архивов
4. axios для HTTP запросов
5. fal.ai API (уже настроен ✅)

**Никакого S3, никаких сложных интеграций!**

Начинаем реализацию? 🚀
