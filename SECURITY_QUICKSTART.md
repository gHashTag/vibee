# 🚀 Быстрый старт: Внедрение системы безопасности

## 1️⃣ БАЗОВАЯ ИНТЕГРАЦИЯ (5 минут)

### Добавьте импорт в любой плагин:
```typescript
import {
  security as sec,
  validateWithSchema,
  TextInputSchema,
  sanitizeText,
} from '../security';
```

### Добавьте валидацию в обработчик:
```typescript
// ❌ Было (небезопасно)
handler: async (ctx) => {
  const text = ctx.message.text;
  await ctx.reply(text);
}

// ✅ Стало (безопасно)
handler: async (ctx) => {
  const validation = validateWithSchema(
    TextInputSchema,
    { text: ctx.message.text },
    'my_handler'
  );

  if (!validation.success) {
    await ctx.reply(`❌ Ошибка: ${validation.error}`);
    return;
  }

  const safeText = sanitizeText(validation.data.text);
  await ctx.reply(safeText);
}
```

---

## 2️⃣ RATE LIMITING (3 минуты)

### Добавьте в начало файла:
```typescript
import { RateLimiter, RateLimitPresets, KeyGenerators } from '../security';

const limiter = new RateLimiter(
  RateLimitPresets.botCommands, // 5 запросов в минуту
  KeyGenerators.userId
);
```

### Проверяйте перед обработкой:
```typescript
const result = limiter.check(ctx.from.id.toString());
if (!result.allowed) {
  await ctx.reply(`⏳ Попробуйте через ${result.retryAfter} сек.`);
  return;
}
```

---

## 3️⃣ БЕЗОПАСНЫЕ СЕКРЕТЫ (2 минуты)

### ❌ Не делайте так:
```typescript
const apiKey = process.env.FAL_KEY!; // Небезопасно
```

### ✅ Делайте так:
```typescript
import { secrets } from '../security';

try {
  const apiKey = secrets.getSecret('FAL_KEY');
  // Используйте apiKey
} catch (error) {
  await ctx.reply('❌ Сервис недоступен (нет API ключа)');
  return;
}
```

---

## 4️⃣ БЕЗОПАСНЫЕ HTTP ЗАПРОСЫ (2 минуты)

### ❌ Не делайте так:
```typescript
const response = await fetch(url);
```

### ✅ Делайте так:
```typescript
import { http } from '../security';

const response = await http.request('GET', url, {
  timeout: 10000,
  maxSize: 1024 * 1024,
}, ctx.from.id);
```

---

## 5️⃣ ЛОГИРОВАНИЕ (1 минута)

### Добавьте логирование подозрительной активности:
```typescript
import { securityLogger } from '../security';

if (suspiciousPattern) {
  securityLogger.logXssAttempt(
    ctx.from.id,
    ctx.message.text,
    'my_handler'
  );
  return;
}
```

---

## 📋 ГОТОВЫЕ MIDDLEWARE

### Для Telegram ботов:
```typescript
import {
  createTelegramSecurityMiddleware,
  secureReply,
} from '../security/integrations/telegram-security';

// Применить ко всем обработчикам
bot.use(createTelegramSecurityMiddleware());

// Безопасный ответ
await secureReply(ctx, '<script>alert(1)</script>Привет!');
// Результат: 'Привет!' (теги удалены)
```

---

## ✅ ЧЕКЛИСТ ВНЕДРЕНИЯ

- [ ] Импортировать систему безопасности
- [ ] Добавить валидацию TextInputSchema
- [ ] Добавить rate limiting
- [ ] Заменить process.env на secrets.getSecret
- [ ] Заменить fetch на http.request
- [ ] Добавить логирование подозрительной активности
- [ ] Протестировать изменения

---

## 🆘 ЧАСТЫЕ ОШИБКИ

### ❌ Забыли про валидацию
```typescript
// Плохо
const text = ctx.message.text;
```

### ✅ Хорошо
```typescript
// Проверяем схему
const validation = validateWithSchema(TextInputSchema, {
  text: ctx.message.text,
}, 'handler');
if (!validation.success) return;
const text = validation.data.text;
```

---

## 📚 ДОКУМЕНТАЦИЯ

- 📖 **Полное руководство:** `docs/SECURITY_GUIDE.md`
- 🧪 **Тесты:** `src/__tests__/security/security-system.test.ts`
- 📊 **Отчет:** `SECURITY_IMPROVEMENT_REPORT.md`

---

## 🎯 ПРИОРИТЕТЫ

### ВЫСОКИЙ (сделать первым):
1. Валидация всех пользовательских вводов
2. Rate limiting для команд бота
3. Безопасные секреты

### СРЕДНИЙ:
4. Безопасные HTTP запросы
5. Логирование событий безопасности

### НИЗКИЙ:
6. Детальные отчеты по безопасности
7. Расширенные схемы валидации

---

## 💡 СОВЕТЫ

### Используйте готовые схемы:
```typescript
TextInputSchema      // Текст с защитой от XSS
UsernameSchema       // Username пользователя
UrlSchema           // Только http/https
EmailSchema         // Email адрес
NumberInputSchema   // Числовые значения
```

### Санитизируйте входные данные:
```typescript
sanitizeText('<script>alert(1)</script>') // 'alert(1))'
sanitizeFilename('../../../etc/passwd')   // '__etc_passwd'
```

### Проверяйте лимиты:
```typescript
// Предустановленные конфигурации
RateLimitPresets.botCommands      // 5/мин
RateLimitPresets.imageGeneration  // 3/5 мин
RateLimitPresets.modelTraining    // 1/час
RateLimitPresets.perUser          // 50/мин
```

---

## 🆘 ПОДДЕРЖКА

При возникновении проблем:
1. Проверьте `docs/SECURITY_GUIDE.md`
2. Запустите тесты: `npm test security-system.test`
3. Изучите примеры в `src/security/examples/`

**Система безопасности готова к использованию! 🚀**
