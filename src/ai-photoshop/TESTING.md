# AI Photoshop Plugin - Testing Guide

Полный гайд по тестированию плагина AI Photoshop.

## 📊 Результаты Тестов

```
✅ 35 тестов - всё прошло
✅ 262 проверки (expect() calls)
✅ 90% покрытие кода
⏱️ Время выполнения: 141ms
```

## 🧪 Способы Тестирования

### 1. Unit Тесты (Самые Быстрые)

Тестируют отдельные компоненты без внешних зависимостей.

```bash
# Тесты типов и констант
bun test tests/unit/ai-photoshop-types.test.ts

# Тесты сервиса
bun test tests/unit/ai-photoshop-service.test.ts

# Все unit тесты
bun test tests/unit/ai-photoshop*.test.ts
```

**Что тестируется:**
- ✅ 12 camera angles с правильными промптами
- ✅ 12 lighting setups
- ✅ 6 frame compositions
- ✅ Инициализация сервиса
- ✅ Валидация запросов
- ✅ Обработка ошибок
- ✅ Quality settings (1K, 2K, 4K)
- ✅ Aspect ratios
- ✅ Enhanced prompt building

### 2. Integration Тесты (С Реальным API)

Если хочешь протестировать с реальным Replicate API:

```bash
# Установи API key
export REPLICATE_API_KEY=r8_your_key_here

# Запусти integration тесты
bun test tests/integration/ai-photoshop-api.test.ts
```

**Важно:** Эти тесты требуют:
- Реальный API ключ Replicate
- Интернет соединение
- Стоят реальные деньги ($0.025-$0.05 за запрос)

### 3. Manual Testing (В Telegram)

#### Способ 1: Через Development Server

```bash
# 1. Запусти сервер
bun run dev

# 2. Открой Telegram бот
# @agent_vibecoder_bot (или твой бот)

# 3. Отправь команду
"I want to edit my photo"

# 4. Выбери модель из меню
# Например: SeeDream-4

# 5. Загрузи изображение
# Любое фото

# 6. Выбери настройки или промпт
# Camera Angle → Close-Up
# Lighting → Golden Hour
# Или напиши: "Make it more dramatic"

# 7. Получи результат
# Через 30-60 секунд придёт обработанное фото
```

#### Способ 2: Через Характер Бота

Добавь плагин в character:

```typescript
// src/character.ts
import { aiPhotoshopPlugin } from './ai-photoshop';

export const character: Character = {
  plugins: [
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openai',
    aiPhotoshopPlugin,  // ✅ Добавь здесь
  ],
};
```

Запусти:
```bash
bun run build
elizaos start
```

### 4. Programmatic Testing (В Коде)

```typescript
import { AIPhotoshopService } from './ai-photoshop';

// Создай mock runtime
const mockRuntime = {
  getSetting: (key: string) => {
    if (key === 'REPLICATE_API_KEY') return process.env.REPLICATE_API_KEY;
  },
};

// Инициализируй сервис
const service = new AIPhotoshopService();
await service.initialize(mockRuntime as any);

// Протестируй обработку
const result = await service.processImage({
  imageUrl: 'https://example.com/test.jpg',
  prompt: 'Make it dramatic',
  model: 'seedream',
  cameraAngle: 'close_up',
  lighting: 'golden_hour',
  quality: '2K',
});

console.log('Success:', result.success);
console.log('Image URL:', result.imageUrl);
console.log('Processing time:', result.processingTime, 'ms');
```

## 🎯 Что Можно Тестировать

### Базовая Функциональность

1. **Инициализация**
   ```bash
   bun test -t "should initialize with API key"
   ```

2. **Список моделей**
   ```bash
   bun test -t "should return all available models"
   ```

3. **Стоимость моделей**
   ```bash
   bun test -t "should return model costs"
   ```

### Промпты и Настройки

4. **Camera angles**
   ```bash
   bun test -t "should have all 12 camera angles"
   ```

5. **Lighting setups**
   ```bash
   bun test -t "should have all 12 lighting setups"
   ```

6. **Frame compositions**
   ```bash
   bun test -t "should have all 6 composition techniques"
   ```

7. **Enhanced prompts**
   ```bash
   bun test -t "should build prompt with all enhancements"
   ```

### Обработка Изображений

8. **Quality settings**
   ```bash
   bun test -t "should handle 2K quality"
   ```

9. **Aspect ratios**
   ```bash
   bun test -t "should use custom aspect ratio"
   ```

### Обработка Ошибок

10. **Network errors**
    ```bash
    bun test -t "should handle network errors"
    ```

11. **API errors**
    ```bash
    bun test -t "should handle API errors"
    ```

12. **Validation**
    ```bash
    bun test -t "should fail with unknown model"
    ```

## 🔍 Debug Режим

Включи verbose логи:

```bash
# В тестах
bun test --verbose tests/unit/ai-photoshop*.test.ts

# В runtime
LOG_LEVEL=debug elizaos start
```

## 📈 Coverage Report

Посмотри покрытие кода:

```bash
bun test --coverage tests/unit/ai-photoshop*.test.ts
```

Результаты:
```
File                         | % Funcs | % Lines |
-----------------------------|---------|---------|
src/ai-photoshop/service.ts |   80.00 |   80.11 |
src/ai-photoshop/types.ts   |  100.00 |  100.00 |
All files                    |   90.00 |   90.06 |
```

## 🐛 Troubleshooting

### Тесты не запускаются

```bash
# Переустанови зависимости
rm -rf node_modules bun.lockb
bun install

# Проверь что vitest установлен
bun add -d vitest
```

### "Cannot find module"

```bash
# Собери проект
bun run build

# Проверь пути в tsconfig.json
```

### "REPLICATE_API_KEY not found"

Это ОК для unit тестов - они мокают API.

Для integration тестов:
```bash
export REPLICATE_API_KEY=r8_your_key
```

### "Timeout" в тестах

```bash
# Увеличь timeout
bun test --timeout 30000
```

## 🎨 Примеры Тестовых Случаев

### Пример 1: Базовая обработка

```typescript
it('should process image with basic settings', async () => {
  const result = await service.processImage({
    imageUrl: 'https://example.com/photo.jpg',
    prompt: 'Enhance colors',
    model: 'seedream',
  });

  expect(result.success).toBe(true);
  expect(result.imageUrl).toBeDefined();
});
```

### Пример 2: С улучшениями

```typescript
it('should process with camera + lighting', async () => {
  const result = await service.processImage({
    imageUrl: 'https://example.com/photo.jpg',
    prompt: 'Make professional',
    model: 'flux_kontext_pro',
    cameraAngle: 'close_up',
    lighting: 'studio',
    composition: 'rule_thirds',
  });

  expect(result.success).toBe(true);
});
```

### Пример 3: Обработка ошибок

```typescript
it('should handle invalid model gracefully', async () => {
  const result = await service.processImage({
    imageUrl: 'https://example.com/photo.jpg',
    prompt: 'Edit',
    model: 'unknown' as any,
  });

  expect(result.success).toBe(false);
  expect(result.error).toContain('Unknown model');
});
```

## 📝 Best Practices

1. **Всегда мокай внешние API** в unit тестах
2. **Тестируй граничные случаи** (пустые строки, null, undefined)
3. **Проверяй типы** (TypeScript помогает, но runtime проверки важны)
4. **Используй descriptive names** для тестов
5. **Группируй связанные тесты** в describe блоки
6. **Cleanup после тестов** (особенно если создаёшь файлы)

## 🚀 CI/CD Integration

Добавь в `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test tests/unit/ai-photoshop*.test.ts
```

## 📊 Performance Benchmarks

```bash
# Запусти бенчмарки
bun test --bench tests/benchmarks/ai-photoshop.bench.ts
```

Ожидаемые результаты:
- Unit тесты: < 200ms
- Service init: < 1ms
- Prompt building: < 1ms
- API call (mocked): < 10ms

## ✅ Checklist для Нового Функционала

Перед добавлением нового функционала в плагин:

- [ ] Добавлены типы в `types.ts`
- [ ] Реализована логика в `service.ts` или `action.ts`
- [ ] Написаны unit тесты
- [ ] Все тесты проходят (`bun test`)
- [ ] Coverage > 80%
- [ ] Обновлена документация
- [ ] Проверено вручную в Telegram

---

**Готово! Теперь ты знаешь как тестировать AI Photoshop плагин** 🎉
