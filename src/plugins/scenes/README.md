# Scene Plugins Documentation

## Обзор

Scene плагины предоставляют пошаговые диалоги (wizard-интерфейс) для сложных операций в Telegram боте. Все сцены построены на базе `telegraf/scenes` и используют единый стиль интерфейса.

## Список Scene плагинов

### 1. 💎 Balance Scene (`balance-scene.ts`)
**Назначение:** Управление балансом пользователя

**Функции:**
- Просмотр баланса в рублях и Stars
- Пополнение баланса (различные суммы)
- История операций с фильтрами
- Управление подпиской
- Вывод средств

**Команды:**
```
/balance - открыть сцену баланса
```

**UX особенности:**
- Карточки с информацией о балансе
- Калькулятор пополнения
- Детализация истории операций
- Статус подписки с таймером

---

### 2. 🎤 Lip-Sync Scene (`lip-sync-scene.ts`)
**Назначение:** Синхронизация губ с аудио

**Функции:**
- 3 режима: авто, ручной, реальное время
- Загрузка аудио и видео файлов
- Выбор качества обработки
- Оплата услуги

**Команды:**
```
/lipsync - открыть сцену синхронизации губ
```

**UX особенности:**
- Сравнение режимов
- Требования к файлам
- Индикатор прогресса загрузки
- Калькулятор стоимости

---

### 3. 🎬 AI Reels Scene (`ai-reels-scene.ts`)
**Назначение:** Создание ИИ рилсов

**Функции:**
- 5 типов эффектов (морфинг, звёздная пыль, трендовые и т.д.)
- Загрузка фото/видео
- Настройка параметров
- Оплата и обработка

**Команды:**
```
/reels - открыть сцену создания рилсов
```

**UX особенности:**
- Галерея примеров эффектов
- Сравнение качества
- Прогресс-бар обработки
- Предпросмотр результата

---

### 4. 💫 Subscription Scene (`subscription-scene.ts`)
**Назначение:** Оформление подписки

**Функции:**
- 4 тарифа: NEUROTESTER, NEUROVIDEO, Stars-пакеты, пробный период
- Детальная информация о тарифах
- Сравнение тарифов
- Оплата картой или Stars

**Команды:**
```
/subscribe - открыть сцену оформления подписки
```

**UX особенности:**
- Карточки тарифов с badge "ХИТ"
- Чекбоксы функций
- Калькулятор экономии
- Социальное доказательство

---

### 5. ⭐ Star Payment Scene (`star-payment-scene.ts`)
**Назначение:** Оплата через Telegram Stars

**Функции:**
- Каталог услуг в Stars
- Конвертер валют
- Инструкция по покупке Stars
- Быстрая оплата

**Команды:**
```
/pay_stars - открыть сцену оплаты Stars
```

**UX особенности:**
- Курс Stars в реальном времени
- Инструкции по покупке Stars
- Быстрые кнопки
- Подтверждение транзакции

---

### 6. 💰 Ruble Payment Scene (`ruble-payment-scene.ts`)
**Назначение:** Оплата банковской картой

**Функции:**
- Каталог услуг в рублях
- Интеграция с Robokassa
- Множество способов оплаты
- Чек и квитанция

**Команды:**
```
/pay_rub - открыть сцену оплаты картой
```

**UX особенности:**
- Безопасность PCI DSS
- Множество способов оплаты
- Статус транзакции
- Инструкции по оплате

---

### 7. 👥 Invite Scene (`invite-scene.ts`)
**Назначение:** Реферальная программа

**Функции:**
- Создание пригласительных ссылок
- Приглашение по username
- Реферальный код
- Статистика приглашений

**Команды:**
```
/invite - открыть сцену приглашений
```

**UX особенности:**
- Генерация уникальных кодов
- Социальный шаринг
- Статистика в реальном времени
- Множественные награды

---

### 8. 💬 Help Scene (`help-scene.ts`)
**Назначение:** Техническая поддержка

**Функции:**
- FAQ с детализацией
- Пошаговые инструкции
- Онлайн-чат с оператором
- Багрепорты

**Команды:**
```
/help - открыть сцену помощи
```

**UX особенности:**
- Категоризированный FAQ
- Интерактивные инструкции
- Эскалация к оператору
- База знаний

---

## Интеграция в character.ts

### 1. Импорт
```typescript
import { scenesPlugin } from './plugins/scenes/scenes-plugin';
```

### 2. Регистрация в character
```typescript
export const character: Character = {
  name: 'Vibee',
  plugins: [
    // ... другие плагины
    scenesPlugin,
    // ... остальные плагины
  ],
  // ...
};
```

### 3. Регистрация вручную (если нужно)
```typescript
import { ScenesService } from './plugins/scenes/scenes-plugin';

// В bootstrap или инициализации
await ScenesService.start(runtime);
```

---

## Архитектура

### Типы (types.ts)
```typescript
interface SceneContext {
  session: {
    wizardData: Record<string, any>; // Данные wizard-сцены
  };
}

interface ScenePlugin {
  scene: Scenes.WizardScene<SceneContext> | Scenes.BaseScene<SceneContext>;
}

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: 'RUB' | 'STARS';
  features: string[];
  description: string;
}
```

### Plugin сервис (scenes-plugin.ts)
- `ScenesService` - главный сервис для управления сценами
- Регистрация всех сцен в `Stage`
- Интеграция с Telegram Bot API
- Команды для перехода к сценам

---

## UX Паттерны

### 1. Навигация
- Кнопка "Назад" на каждом шаге
- Breadcrumbs для длинных сценариев
- Отмена операции в любой момент

### 2. Информация
- Карточки с ключевой информацией
- Иконки для визуального разделения
- Статистика в реальном времени

### 3. Оплата
- Калькулятор стоимости
- Сравнение способов оплаты
- Подтверждение перед оплатой

### 4. Обратная связь
- Статусы операций
- Прогресс-бары
- Уведомления об ошибках

---

## Лучшие практики

### 1. Структура Scene
```typescript
export const createScene = (): Scenes.WizardScene<Context> => {
  const scene = new Scenes.WizardScene<Context>(
    'sceneId',

    // Step 1: Главное меню
    async (ctx) => {
      // Показать главный экран
      return ctx.wizard.next();
    },

    // Step 2: Обработка выбора
    async (ctx) => {
      // Обработать выбор пользователя
      return ctx.wizard.next();
    },

    // ... дополнительные шаги
  );

  return scene;
};
```

### 2. Обработка ошибок
```typescript
try {
  // Операция
} catch (error) {
  await ctx.reply(
    '❌ Произошла ошибка',
    Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Повторить', 'retry')],
      [Markup.button.callback('🏠 В меню', 'menu')]
    ])
  );
}
```

### 3. Валидация данных
```typescript
if (!ctx.message?.text) {
  await ctx.reply('❌ Неверные данные');
  return ctx.wizard.selectStep(currentStep);
}

const value = ctx.message.text.trim();
if (value.length < 5) {
  await ctx.reply('❌ Слишком коротко');
  return ctx.wizard.selectStep(currentStep);
}
```

---

## Тестирование

### Мокирование
```typescript
// Создание mock контекста
const mockCtx = {
  from: { id: '12345', username: 'testuser' },
  reply: jest.fn(),
  wizard: { next: jest.fn(), back: jest.fn() },
  scene: { enter: jest.fn(), leave: jest.fn() },
  session: { wizardData: {} }
};
```

### Тестирование сцен
```typescript
describe('BalanceScene', () => {
  it('should show balance on first step', async () => {
    const scene = createBalanceScene();
    await scene.stepHandlers[0](mockCtx);
    expect(mockCtx.reply).toBeCalledWith(
      expect.stringContaining('💎 Ваш баланс')
    );
  });
});
```

---

## Миграция

### Версия 1.0 (текущая)
- 8 базовых сцен
- Стандартный UX
- Интеграция с основным ботом

### Версия 2.0 (планы)
- Сохранение состояния сцен
- Интеграция с базой данных
- Аналитика по сценам
- Персонализация сцен
- Мультиязычность

---

## Поддержка

### Полезные ссылки
- [Документация telegraf scenes](https://telegraf.js.org/next/#/scene)
- [Руководство по UX в Telegram](https://core.telegram.org/bots/2-0-8-changes)
- [Примеры Scene плагинов](examples/)

### Контакты
- Разработчик: @vibee_dev
- Техподдержка: support@vibee.bot
- Документация: docs.vibee.bot

---

## Лицензия

© 2025 Vibee. Все права защищены.
