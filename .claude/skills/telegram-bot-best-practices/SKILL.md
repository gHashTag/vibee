# Telegram Bot Best Practices - Skill

## Skill Overview

**Name**: Telegram Bot Best Practices
**Type**: Development Patterns & UX Guidelines
**Domain**: Telegram Bot Development with ElizaOS
**Level**: Expert

**Purpose**: Comprehensive patterns and best practices for building professional Telegram bots with excellent UX, based on real-world experience fixing production issues.

---

## Core Principles

### 1. Always Answer Callback Queries

**Pattern**: Every `callback_query` must receive `answerCbQuery()` - no exceptions.

**Why**: Telegram shows a loading spinner on buttons until answered. Not answering = stuck buttons = broken UX.

**Implementation**:
```typescript
// ✅ CORRECT - Always answer, even on error
telegramService.bot.on('callback_query', async (ctx: any) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    await handleCallback(callbackData);
    await ctx.answerCbQuery(); // Success
  } catch (error) {
    // STILL answer on error
    try {
      await ctx.answerCbQuery('❌ Ошибка обработки', { show_alert: true });
    } catch {}
  }
});
```

**Anti-pattern**:
```typescript
// ❌ WRONG - Button stays in loading state if handler fails
telegramService.bot.on('callback_query', async (ctx: any) => {
  await handleCallback(ctx.callbackQuery.data);
  await ctx.answerCbQuery(); // Never reached if error occurs
});
```

**Testing**: Click button → Spinner should disappear within 1s

---

### 2. Use sendChatAction for Long Operations

**Pattern**: Show typing/uploading indicators during operations > 2 seconds.

**Why**: Reduces perceived wait time by 40-60%, improves user confidence.

**Available Actions**:
- `typing` - Bot is typing
- `upload_photo` - Bot is uploading photo
- `upload_video` - Bot is uploading video
- `upload_document` - Bot is uploading document
- `find_location` - Bot is finding location
- `record_video` - Bot is recording video
- `record_voice` - Bot is recording voice

**Implementation**:
```typescript
// Before slow operation
await ctx.replyWithChatAction('upload_document');

// Slow operation (ZIP creation, API call, etc.)
const result = await slowOperation();

// Send result
await ctx.reply('Done!');
```

**Best Practices**:
- Use `upload_document` for file operations
- Use `typing` for API calls/processing
- Call it RIGHT BEFORE the operation
- Don't await it (fire and forget)

**Example Flow**:
```typescript
await ctx.reply('📦 Создаю архив...');
await ctx.replyWithChatAction('upload_document');
const zipPath = await createZip(); // 10-30s

await ctx.reply('📤 Загружаю на сервер...');
await ctx.replyWithChatAction('upload_document');
const url = await uploadFile(); // 20-60s

await ctx.reply('✅ Готово!');
```

---

### 3. Direct bot.on() Registration

**Pattern**: For custom plugins, always register handlers directly via `bot.on()`, not custom events.

**Why**: ElizaOS may not emit custom events for all Telegram updates.

**Implementation**:
```typescript
class TelegramPhotoService extends Service {
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Wait for TelegramService
    let telegramService = null;
    for (let i = 0; i < 20; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService?.bot) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // ✅ Register directly with bot
    telegramService.bot.on('photo', async (ctx: any) => {
      await handlePhoto(ctx);
    });
  }
}
```

**Anti-pattern**:
```typescript
// ❌ May not receive events if ElizaOS doesn't emit them
runtime.on('TELEGRAM_PHOTO', async (data) => {
  await handlePhoto(data);
});
```

**Supported Events**:
- `message` - All messages
- `photo` - Photo messages
- `callback_query` - Button clicks
- `text` - Text messages
- `document` - File uploads

---

### 4. Error Recovery with Retry Buttons

**Pattern**: On error, show specific message + retry button. Preserve user session.

**Why**: Users hate re-doing work. One-click retry = happy users.

**Implementation**:
```typescript
try {
  await performOperation();
} catch (error) {
  // Create retry keyboard
  const keyboard = new KeyboardBuilder()
    .callback('🔄 Попробовать снова', 'retry_operation', 0)
    .callback('❌ Отменить', 'cancel_operation', 0)
    .buildInline();

  // Context-aware error messages
  let errorHint = '';
  if (error.message.includes('network')) {
    errorHint = '\n\n💡 Проверь интернет-соединение';
  } else if (error.message.includes('rate limit')) {
    errorHint = '\n\n💡 Подожди 1-2 минуты и попробуй снова';
  }

  await ctx.reply(
    `❌ **Ошибка**\n\n` +
    `Причина: ${error.message}${errorHint}\n\n` +
    `⚠️ **Твоя сессия НЕ потеряна!**\n` +
    `Выбери действие:`,
    { reply_markup: keyboard }
  );
}
```

**Error Hint Patterns**:
- Network errors → "Проверь интернет"
- Rate limiting → "Подожди N минут"
- Invalid input → "Проверь формат"
- File too large → "Уменьши размер"
- Service unavailable → "Попробуй позже"

---

### 5. Exponential Backoff for Retries

**Pattern**: Retry failed operations with exponential backoff: 1s → 2s → 4s → 8s

**Why**: Immediate retries overload failed services. Backoff gives time to recover.

**Implementation**:
```typescript
async function operationWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Wait: 1s, 2s, 4s
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
```

**Usage**:
```typescript
// Download with retry
const photo = await operationWithRetry(() =>
  downloadPhoto(url)
);

// Upload with retry
const uploadUrl = await operationWithRetry(() =>
  uploadToServer(file)
);
```

**Parameters**:
- Light operations (API calls): 3 retries
- Heavy operations (uploads): 2 retries
- Critical operations (payments): 5 retries

---

### 6. Resource Cleanup on Error

**Pattern**: Always cleanup temp files/resources, even on error.

**Why**: Memory leaks, disk space waste, orphaned processes.

**Implementation**:
```typescript
async function processPhotos(photos: Photo[]): Promise<string> {
  const tempDir = `/tmp/session-${Date.now()}`;
  let zipPath: string | null = null;

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Download photos
    for (const photo of photos) {
      const path = await downloadPhoto(photo);
      // ... process
    }

    // Create ZIP
    zipPath = `${tempDir}.zip`;
    await createZip(tempDir, zipPath);

    return zipPath;
  } catch (error) {
    // Cleanup on error
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      if (zipPath && fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    } catch (cleanupError) {
      logger.warn('Cleanup failed:', cleanupError);
    }

    throw error;
  }
}
```

**Key Points**:
- Use try-catch for cleanup itself
- Use `force: true` for rmSync
- Log cleanup failures (don't throw)
- Check file exists before delete

---

### 7. Progress Indicators for Multi-Step Operations

**Pattern**: Show visual progress for operations with multiple steps.

**Implementation**:
```typescript
// Progress bar
function createProgressBar(current: number, total: number, length = 10): string {
  const filled = Math.floor((current / total) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

// Usage
await ctx.reply(
  `📸 Фото ${current}/${total}\n\n` +
  `${createProgressBar(current, total)} ${Math.floor(current/total * 100)}%`
);
```

**Visual Feedback Patterns**:
```
// Discrete progress
✅ Шаг 1/4 завершён
⏳ Шаг 2/4 выполняется...
⏸️ Шаг 3/4 ожидает
⏹️ Шаг 4/4 не начат

// Continuous progress
▓▓▓▓▓░░░░░ 50%
▓▓▓▓▓▓▓░░░ 70%
▓▓▓▓▓▓▓▓▓▓ 100%

// Status badges
🟢 Активно | 🟡 В процессе | 🔴 Ошибка | ⚪ Ожидает
```

---

### 8. Inline Keyboards vs Reply Keyboards

**Pattern**: Choose the right keyboard type for the use case.

**Inline Keyboards** (buttons below message):
- ✅ Temporary actions (confirm/cancel)
- ✅ Multi-step wizards
- ✅ One-time choices
- ✅ Dynamic content

**Reply Keyboards** (bottom of chat):
- ✅ Persistent commands
- ✅ Main menu navigation
- ✅ Frequently used actions
- ✅ App-like interface

**Implementation**:
```typescript
// Inline (temporary)
const inlineKeyboard = new KeyboardBuilder()
  .callback('✅ Подтвердить', 'confirm', 0)
  .callback('❌ Отменить', 'cancel', 0)
  .buildInline();

// Reply (persistent)
const replyKeyboard = new KeyboardBuilder()
  .row(['📸 Обучение', '🎨 Генерация'])
  .row(['⚙️ Настройки', '❓ Помощь'])
  .buildReply({ resize_keyboard: true });
```

---

### 9. Service Initialization Pattern

**Pattern**: Wait for dependencies before registering handlers.

**Implementation**:
```typescript
class MyTelegramService extends Service {
  static serviceType = 'my-telegram-service';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Wait for TelegramService with timeout
    const maxAttempts = 20;
    let telegramService = null;

    for (let i = 0; i < maxAttempts; i++) {
      telegramService = runtime.getService('telegram');
      if (telegramService?.bot) {
        logger.info('Found TelegramService');
        break;
      }
      logger.info(`Waiting for TelegramService... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!telegramService?.bot) {
      logger.warn('TelegramService not found after waiting');
      return; // Fail gracefully
    }

    // Register handlers
    telegramService.bot.on('message', handler);
  }

  static async start(runtime: IAgentRuntime): Promise<MyTelegramService> {
    const service = new MyTelegramService(runtime);
    await service.initialize(runtime);
    return service;
  }
}
```

**Parameters**:
- `maxAttempts: 20` (10 seconds)
- `delay: 500ms`
- Fail gracefully if not found

---

### 10. Comprehensive Logging

**Pattern**: Log every significant operation with context.

**Levels**:
- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Failures (with stack trace)

**Implementation**:
```typescript
// Start of operation
logger.info(`[Service] Starting operation for user ${userId}`);

// Progress
logger.info(`[Service] Downloaded ${i+1}/${total} files`);

// Success
logger.info(`[Service] ✅ Operation completed in ${duration}ms`);

// Recoverable error
logger.warn(`[Service] Retry ${attempt}/${maxRetries} failed:`, error);

// Fatal error
logger.error(`[Service] ❌ Operation failed:`, error);
```

**Format**: `[ServiceName] message`
- Easier to filter logs
- Clear component attribution
- Grep-friendly

---

## Common Patterns

### File Upload Progress

```typescript
async function uploadWithProgress(file: string, ctx: any) {
  const totalSize = fs.statSync(file).size;
  let uploaded = 0;

  // Show initial message
  const msg = await ctx.reply('📤 Загружаю... 0%');

  // Upload with progress tracking
  const stream = fs.createReadStream(file);
  stream.on('data', (chunk) => {
    uploaded += chunk.length;
    const percent = Math.floor((uploaded / totalSize) * 100);

    // Update every 10%
    if (percent % 10 === 0) {
      ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `📤 Загружаю... ${percent}%`
      );
    }
  });

  await upload(stream);
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    msg.message_id,
    null,
    '✅ Загружено!'
  );
}
```

### Wizard Pattern (Multi-Step Form)

```typescript
// State machine for multi-step wizard
type WizardState = 'START' | 'COLLECT_NAME' | 'COLLECT_PHOTOS' | 'CONFIRM';

class WizardSession {
  state: WizardState = 'START';
  data: Record<string, any> = {};

  async handleMessage(text: string, ctx: any) {
    switch (this.state) {
      case 'START':
        await ctx.reply('Введи название:');
        this.state = 'COLLECT_NAME';
        break;

      case 'COLLECT_NAME':
        this.data.name = text;
        await ctx.reply('Отправь фото:', {
          reply_markup: new KeyboardBuilder()
            .callback('✅ Готово', 'wizard_next')
            .buildInline()
        });
        this.state = 'COLLECT_PHOTOS';
        break;

      case 'COLLECT_PHOTOS':
        // Collect photos
        break;

      case 'CONFIRM':
        // Final confirmation
        break;
    }
  }
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private limits = new Map<string, number[]>();

  async checkLimit(userId: string, maxRequests = 5, windowMs = 60000): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.limits.get(userId) || [];

    // Remove old requests outside window
    const recent = userRequests.filter(time => now - time < windowMs);

    if (recent.length >= maxRequests) {
      return false; // Rate limited
    }

    recent.push(now);
    this.limits.set(userId, recent);
    return true; // OK
  }
}

// Usage
if (!await rateLimiter.checkLimit(userId, 5, 60000)) {
  await ctx.reply('⏳ Слишком много запросов. Подожди 1 минуту.');
  return;
}
```

---

## Anti-Patterns to Avoid

### 1. ❌ Not Answering Callbacks
```typescript
// WRONG
bot.on('callback_query', async (ctx) => {
  await handleCallback(ctx);
  // Missing: await ctx.answerCbQuery();
});
```

### 2. ❌ Synchronous Blocking Operations
```typescript
// WRONG
const result = heavyComputation(); // Blocks event loop
await ctx.reply(result);

// CORRECT
const result = await performHeavyComputationAsync();
await ctx.reply(result);
```

### 3. ❌ No Error Handling
```typescript
// WRONG
bot.on('message', async (ctx) => {
  const result = await apiCall(); // Can throw
  await ctx.reply(result);
});

// CORRECT
bot.on('message', async (ctx) => {
  try {
    const result = await apiCall();
    await ctx.reply(result);
  } catch (error) {
    logger.error('API call failed:', error);
    await ctx.reply('❌ Ошибка. Попробуй позже.');
  }
});
```

### 4. ❌ Leaking Temp Files
```typescript
// WRONG
const tempFile = createTempFile();
await processFile(tempFile);
// File never deleted!

// CORRECT
const tempFile = createTempFile();
try {
  await processFile(tempFile);
} finally {
  fs.unlinkSync(tempFile);
}
```

### 5. ❌ Generic Error Messages
```typescript
// WRONG
await ctx.reply('Error');

// CORRECT
await ctx.reply(
  '❌ Не удалось загрузить файл\n\n' +
  '💡 Проверь размер (макс. 20MB)'
);
```

---

## Testing Checklist

### UX Testing
- [ ] All callback buttons work on first click
- [ ] No buttons stuck in loading state
- [ ] Loading indicators appear during long ops
- [ ] Error messages are clear and actionable
- [ ] Retry buttons preserve user state
- [ ] Progress bars update smoothly
- [ ] No lag/freezing during operations

### Error Handling Testing
- [ ] Network timeout during download
- [ ] Network timeout during upload
- [ ] Invalid user input
- [ ] Rate limiting triggers correctly
- [ ] Temp files cleaned up on error
- [ ] Session preserved after error
- [ ] Retry works after error

### Edge Cases
- [ ] Simultaneous requests from same user
- [ ] Very large files (>100MB)
- [ ] Very long operations (>5min)
- [ ] Bot restart during operation
- [ ] Database unavailable
- [ ] External API down

---

## Skill Application Checklist

When building a new Telegram bot feature:

1. **Handler Registration**
   - [ ] Using `bot.on()` directly (not custom events)
   - [ ] Waiting for TelegramService initialization
   - [ ] Graceful failure if service not found

2. **Callback Queries**
   - [ ] Always calling `answerCbQuery()`
   - [ ] Answering even on error
   - [ ] Error messages shown with `show_alert: true`

3. **Long Operations**
   - [ ] Using `sendChatAction()` before operation
   - [ ] Appropriate action type (typing/upload/etc)
   - [ ] Progress updates every 10-20%

4. **Error Handling**
   - [ ] Try-catch around all async operations
   - [ ] Specific error messages with hints
   - [ ] Retry buttons when applicable
   - [ ] Session preservation on error
   - [ ] Exponential backoff for retries

5. **Resource Management**
   - [ ] Temp files in `/tmp/app-name/`
   - [ ] Cleanup in finally block
   - [ ] Force flags for deletion
   - [ ] Logging cleanup failures

6. **Logging**
   - [ ] Consistent format: `[ServiceName] message`
   - [ ] Info level for normal operations
   - [ ] Warn level for retries
   - [ ] Error level with stack traces
   - [ ] User IDs in sensitive logs are anonymized

7. **User Experience**
   - [ ] Clear visual feedback for all actions
   - [ ] Progress indicators for multi-step ops
   - [ ] Inline keyboards for temporary actions
   - [ ] Reply keyboards for persistent commands
   - [ ] Emoji for better scannability

---

## Performance Optimization

### Parallel Operations
```typescript
// Instead of sequential
const photo1 = await download(url1);
const photo2 = await download(url2);

// Use parallel
const [photo1, photo2] = await Promise.all([
  download(url1),
  download(url2)
]);
```

### Caching
```typescript
class CachedService {
  private cache = new Map<string, { data: any, expires: number }>();

  async get(key: string, fetchFn: () => Promise<any>, ttlMs = 60000) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  }
}
```

### Batch Processing
```typescript
// Process in batches to avoid memory issues
async function processLargeList(items: any[], batchSize = 10) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(item => processItem(item)));

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

---

## Conclusion

These patterns are battle-tested from fixing real production issues. Apply them systematically to build robust, user-friendly Telegram bots.

**Key Takeaways**:
1. Always answer callbacks
2. Show loading indicators
3. Provide clear error messages with recovery
4. Clean up resources
5. Retry with exponential backoff
6. Log everything with context
7. Choose the right keyboard type
8. Test edge cases thoroughly

**Status**: Production-ready patterns ✅

---

**Last Updated**: 2025-11-12
**Source**: Vibee Training Plugin UX Overhaul
**Author**: Claude Code (Autonomous Development)
