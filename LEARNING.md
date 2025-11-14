# 📚 Система Обучения Vibee Agent

## Как ElizaOS Сохраняет Диалоги

ElizaOS **автоматически сохраняет все диалоги** в базу данных в реальном времени:

- ✅ Все сообщения пользователей
- ✅ Все ответы агента
- ✅ Контекст и metadata
- ✅ Vector embeddings для семантического поиска

## Где Хранятся Диалоги

База данных находится здесь:
```
/Users/playra/vibee/.eliza/.elizadb/
```

Все диалоги сохраняются в таблице `messages` в формате SQLite.

## Как Использовать Диалоги для Обучения

### Метод 1: Автоматическое Обучение (Уже Работает!)

ElizaOS **уже использует** все сохраненные диалоги для улучшения ответов:

1. **Semantic Memory** - агент находит похожие прошлые диалоги
2. **Context Awareness** - помнит историю общения с каждым пользователем
3. **Learning from Examples** - улучшает ответы на основе прошлых успешных диалогов

**Это происходит автоматически, без дополнительной настройки!**

### Метод 2: Fine-Tuning LLM (Продвинутый)

Для полноценного fine-tuning модели:

#### Шаг 1: Экспорт Диалогов

Создайте скрипт для экспорта диалогов из базы данных:

```bash
# Запустите в корне проекта
bun run export-conversations
```

Это создаст файл `training-data/conversations.json` с форматом:

```json
{
  "messageExamples": [
    [
      {
        "user": "User",
        "content": { "text": "Привет! Как дела?" }
      },
      {
        "user": "Vibee",
        "content": { "text": "Привет! Отлично, спасибо!" }
      }
    ]
  ],
  "metadata": {
    "exportedAt": "2025-01-12T...",
    "totalExamples": 150
  }
}
```

#### Шаг 2: Обновить Character

Скопируйте примеры в `src/character.ts`:

```typescript
export const character: Character = {
  // ... existing config

  messageExamples: [
    // Добавьте сюда экспортированные примеры из conversations.json
    // Или используйте динамический импорт:
  ],
};
```

#### Шаг 3: Fine-Tune OpenRouter Model (Optional)

Для продвинутого fine-tuning:

```bash
# 1. Подготовьте датасет в формате OpenAI
bun run prepare-training-dataset

# 2. Отправьте на fine-tuning через OpenRouter
# (Требуется API поддержка fine-tuning)
```

## Скрипт Экспорта Диалогов

Создайте файл `scripts/export-conversations.ts`:

```typescript
import Database from 'better-sqlite3';
import { writeFile, mkdir } from 'fs/promises';

async function exportConversations() {
  // Открываем базу данных
  const db = new Database('/Users/playra/vibee/.eliza/.elizadb/db.sqlite');

  // Получаем все сообщения
  const messages = db.prepare(`
    SELECT * FROM messages
    ORDER BY createdAt ASC
  `).all();

  console.log(`📊 Found ${messages.length} messages`);

  // Группируем по комнатам
  const conversations: any = {};
  for (const msg of messages) {
    const roomId = msg.roomId || 'unknown';
    if (!conversations[roomId]) {
      conversations[roomId] = [];
    }
    conversations[roomId].push(msg);
  }

  // Форматируем для character.ts
  const messageExamples = [];
  for (const [roomId, msgs] of Object.entries(conversations)) {
    if (msgs.length < 2) continue;

    const conversation = msgs.map((m: any) => ({
      user: m.userId === '...' ? 'Vibee' : 'User',
      content: JSON.parse(m.content),
    }));

    messageExamples.push(conversation);
  }

  // Сохраняем
  await mkdir('training-data', { recursive: true });
  await writeFile(
    'training-data/conversations.json',
    JSON.stringify({ messageExamples }, null, 2)
  );

  console.log(`✅ Exported ${messageExamples.length} conversations`);
  db.close();
}

exportConversations().catch(console.error);
```

Добавьте в `package.json`:

```json
{
  "scripts": {
    "export-conversations": "bun run scripts/export-conversations.ts"
  }
}
```

## Мониторинг Обучения

### Проверить Количество Сохраненных Диалогов

```bash
# Подключитесь к базе данных
sqlite3 .eliza/.elizadb/db.sqlite

# Посмотрите статистику
SELECT COUNT(*) as total_messages FROM messages;
SELECT COUNT(DISTINCT roomId) as total_conversations FROM messages;
SELECT COUNT(*) as user_messages FROM messages WHERE userId != '...';
```

### Посмотреть Последние Диалоги

```sql
SELECT
  datetime(createdAt/1000, 'unixepoch') as time,
  content
FROM messages
ORDER BY createdAt DESC
LIMIT 10;
```

## Рекомендации

### 1. Регулярный Экспорт

Настройте регулярный экспорт диалогов (например, раз в неделю):

```bash
# Добавьте в crontab
0 0 * * 0 cd /Users/playra/vibee && bun run export-conversations
```

### 2. Фильтрация Качества

Экспортируйте только успешные диалоги:

- ✅ Длинные диалоги (5+ сообщений)
- ✅ Диалоги с положительной обратной связью
- ❌ Исключайте короткие или неполные диалоги

### 3. Приватность

⚠️ **Важно**: Диалоги могут содержать личные данные:

- Храните экспорты безопасно
- Не коммитьте `training-data/` в Git (добавьте в `.gitignore`)
- Анонимизируйте данные перед fine-tuning

## Автоматическое Обучение

ElizaOS уже использует сохраненные диалоги для:

1. **RAG (Retrieval-Augmented Generation)**
   - Находит похожие прошлые диалоги
   - Использует их как context для ответов

2. **Memory Management**
   - Помнит предпочтения пользователей
   - Поддерживает контекст между сессиями

3. **Continuous Learning**
   - Каждый новый диалог улучшает базу знаний
   - Semantic embeddings для лучшего поиска

**Вывод**: Ваш агент уже обучается на диалогах автоматически! 🎉

## Дополнительно

### Twitter Scraper для Fine-Tuning

Если хотите обучить агента на своем Twitter стиле:

```bash
# Клонируйте репозиторий
git clone https://github.com/ai16z/twitter-scraper-finetune

# Соберите данные
bun run scrape --username YourTwitter

# Экспорт в формат для обучения
bun run prepare-dataset
```

### Интеграция с Character

```typescript
// src/character.ts
import trainingData from '../training-data/conversations.json';

export const character: Character = {
  // ... existing config
  messageExamples: trainingData.messageExamples,
};
```

---

**Готово!** 🎓 Теперь вы знаете, как ElizaOS сохраняет и использует диалоги для обучения агента.
