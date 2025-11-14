# Admin Subscription Command Plugin

Административная команда для управления подписками пользователей.

## Функции

- 💳 Управление планами подписок
- 📊 Статистика подписок и доходов
- 👥 Список пользователей с подписками
- ⚙️ Создание и изменение подписок

## Команды

- `/admin sub` - Показать панель управления подписками

## Кнопки

- `📋 Список` - Список пользователей с подписками
- `➕ Создать` - Создать новую подписку
- `💰 Доходы` - Отчет по доходам
- `⚙️ Планы` - Управление планами
- `📊 Отчет` - Детальная статистика

## Использование

```typescript
import { createAdminSubscriptionCommand } from './admin-subscription';

const plugin = createAdminSubscriptionCommand();
```

## Типы данных

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
}

interface UserSubscription {
  userId: string;
  userName: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}
```
