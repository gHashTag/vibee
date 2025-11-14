# UX Components

Компоненты для улучшения пользовательского опыта в Telegram ботах.

## 📦 Компоненты

### ProgressIndicator
Визуальные индикаторы прогресса для долгих операций.

```typescript
const progress = new ProgressIndicator(ctx, {
  steps: ['Анализ...', 'Генерация...', 'Сохранение...'],
  showBar: true,
  showETA: true
});

await progress.show('Начинаем генерацию...');
await progress.update(1, { speed: 5.2, eta: 15 });
await progress.complete({ imageUrl: '...' });
```

### UserFriendlyErrorHandler
Обработка ошибок с понятными сообщениями.

```typescript
try {
  await someOperation();
} catch (error) {
  await UserFriendlyErrorHandler.handleError(ctx, error);
}
```

### PromptAssistant
Помощь в создании промптов для генерации.

```typescript
const suggestions = await PromptAssistant.suggestImprovements(userPrompt);
await ctx.reply(suggestions.join('\n'));

await PromptAssistant.showExamples(ctx, 'landscape');
```

### PreviewRenderer
Показ предпросмотра перед генерацией.

```typescript
await PreviewRenderer.showImagePreview(
  ctx,
  params,
  estimatedCost,
  estimatedTime
);
```

### CostCalculator
Расчет стоимости операций.

```typescript
const cost = CostCalculator.calculateCost('neuro-photo', params);
await CostCalculator.showCostPreview(ctx, 'neuro-photo', params);
```

### UserHistory
История операций пользователя.

```typescript
await UserHistory.add(userId, {
  type: 'neuro-photo',
  operation: 'Генерация изображения',
  data: params
});

await UserHistory.show(ctx, { type: 'neuro-photo', limit: 10 });
```

## 🚀 Быстрый старт

```typescript
import { QuickStart } from '@/ux';

// Показать ошибку
await QuickStart.showError(ctx, error);

// Создать прогресс
const progress = QuickStart.createProgress(ctx, ['Шаг 1', 'Шаг 2', 'Шаг 3']);

// Показать стоимость
await QuickStart.showCostPreview(ctx, 'neuro-photo', params);

// Помощь с промптом
await QuickStart.showPromptHelp(ctx, userPrompt);
```

## 📊 Возможности

- ✅ Прогресс-индикаторы с анимацией
- ✅ Понятные ошибки с предложениями
- ✅ Подсказки для промптов
- ✅ Предпросмотр перед генерацией
- ✅ Расчет стоимости в реальном времени
- ✅ История операций
- ✅ Статистика использования
- ✅ Быстрые действия (QuickStart)

## 💡 Пример использования

```typescript
import { ProgressIndicator, CostCalculator, UserFriendlyErrorHandler } from '@/ux';

async function generateImage(ctx: any, params: any) {
  try {
    // 1. Показываем стоимость
    await CostCalculator.showCostPreview(ctx, 'neuro-photo', params);

    // 2. Создаем прогресс
    const progress = new ProgressIndicator(ctx, {
      steps: ['Анализ промпта...', 'Генерация...', 'Обработка...']
    });

    // 3. Показываем прогресс
    await progress.show('Подготовка к генерации...');
    await progress.update(1);
    await progress.update(2, { speed: 5.2 });

    // 4. Генерируем
    const result = await generate(params);

    // 5. Завершаем
    await progress.complete({ imageUrl: result.url });

    // 6. Добавляем в историю
    await UserHistory.add(ctx.from.id.toString(), {
      type: 'neuro-photo',
      operation: 'Генерация изображения',
      data: params,
      result: result
    });

  } catch (error) {
    await UserFriendlyErrorHandler.handleError(ctx, error);
  }
}
```

## 🎯 Результат

Улучшенный пользовательский опыт:
- Пользователь видит что происходит
- Понятно что делать при ошибке
- Подсказки улучшают результат
- Предпросмотр экономит время
- История повторения
- Прозрачность стоимости
