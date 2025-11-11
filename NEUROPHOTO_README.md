# 🎭 Neurophoto с LoRA NEURO_SAGE - Готово!

## ✅ Что сделано

### 1. Установлены зависимости
- `@fal-ai/client` v1.7.2 - клиент для Fal.ai API

### 2. Создан Action для генерации изображений
- **Файл**: `/Users/playra/vibee/src/neurophoto-action.ts`
- **Action**: `GENERATE_NEUROPHOTO`
- **Модель**: `fal-ai/flux-lora`
- **LoRA**: NEURO_SAGE (автоматически добавляется к промпту)
- **Формат**: 9:16 (768×1365) - вертикально для соцсетей

### 3. Интегрирован в plugin
- Добавлен импорт в `src/plugin.ts`
- Добавлен в массив `actions`

### 4. FAL_KEY
- ✅ Уже настроен в Infisical (показано на скриншоте)
- ✅ Загружается автоматически через `src/infisical.ts`

---

## 🚀 Как использовать

### Запуск бота:
```bash
bun run dev
```

### Команды для генерации:
```
/neurophoto красивый закат над океаном
нарисуй меня на пляже
создай изображение города
покажи как выглядит дракон
```

### Естественный язык:
Бот понимает естественные запросы на русском и английском:
- "нарисуй..."
- "создай изображение..."
- "покажи как выглядит..."
- "сделай фото..."
- "generate image..."
- "draw..."

---

## 🎨 Что делает

1. **Извлекает промпт** из сообщения
2. **Добавляет триггер** `NEURO_SAGE` автоматически
3. **Генерирует изображение** с твоей LoRA через Fal.ai
4. **Возвращает результат** с красивым форматированием (стиль Midjourney/DALL-E):
   - Промпт
   - Персонализация (LoRA триггер)
   - Модель
   - Размер
   - Время генерации
   - Техническая информация

---

## ⚙️ Конфигурация (опционально)

Если хочешь кастомизировать, добавь в Infisical:

```bash
# Опционально (есть дефолтные значения)
FAL_DEFAULT_LORA_PATH=https://v3b.fal.media/files/b/elephant/YpfnIK7JlNO7vZTsGanfo_pytorch_lora_weights.safetensors
FAL_LORA_TRIGGER=NEURO_SAGE
FAL_DEFAULT_LORA_SCALE=1.0  # 0.5-2.0
```

**Дефолтные значения** (если не указаны):
- `FAL_DEFAULT_LORA_PATH`: твоя LoRA (уже настроена)
- `FAL_LORA_TRIGGER`: NEURO_SAGE
- `FAL_DEFAULT_LORA_SCALE`: 1.0

---

## 📊 Пример результата

Когда пользователь пишет: `/neurophoto superman`

Бот отвечает:
```
🎨 Генерирую изображение с твоей LoRA, это займёт 20-40 секунд...

✨ Изображение создано!

━━━━━━━━━━━━━━━━━━━━
📝 Промпт
superman

🎨 Детали генерации
├ 🎭 Персонализация: NEURO_SAGE
├ 🤖 Модель: Flux LoRA 🎭
├ 📐 Размер: 768×1365 (9:16)
├ ⏱ Время: 25с
└ 🔗 Provider: Fal.ai

━━━━━━━━━━━━━━━━━━━━
🔍 Техническая информация
LoRA: `NEURO_SAGE`
Model ID: `fal-ai/flux-lora`
Сгенерировано: 12.11.2025, 03:00:00

Создано с помощью AI • Vibee
```

+ Прикреплено изображение

---

## 🔍 Проверка работы

### 1. Проверь что FAL_KEY загружается:
```bash
bun run dev
# В логах должно быть:
# ✅ Successfully loaded X secrets from Infisical Cloud
# 🔑 Secret keys preview: FAL_KEY...
```

### 2. Протестируй в Telegram:
```
/neurophoto тест
```

Если всё настроено, бот ответит через 20-40 секунд с изображением.

---

## 🐛 Troubleshooting

### Ошибка "FAL_KEY not found"
- Проверь что FAL_KEY есть в Infisical dev environment
- Перезапусти бота: `bun run dev`

### Ошибка "Unexpected Fal.ai response format"
- Проверь баланс на https://fal.ai/dashboard
- Добавь кредиты (~$10-20 для начала)

### Изображение не похоже на тебя
- Увеличь `FAL_DEFAULT_LORA_SCALE` до 1.5 в Infisical
- Проверь что триггер `NEURO_SAGE` добавляется к промпту (смотри логи)

---

## 📚 Полезные ссылки

- **Fal.ai Dashboard**: https://fal.ai/dashboard
- **Fal.ai Docs**: https://fal.ai/docs
- **Flux LoRA Model**: https://fal.ai/models/fal-ai/flux-lora

---

**Статус**: ✅ Готово к использованию
**Дата**: 2025-11-12
**LoRA**: NEURO_SAGE активирована
**Формат**: 9:16 (768×1365) для соцсетей
