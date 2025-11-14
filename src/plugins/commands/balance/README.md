# Balance Command Plugin

Команды для работы с балансом пользователя: просмотр, пополнение, история операций.

## Функции

- 💰 Просмотр текущего баланса
- 💳 Пополнение баланса
- 📊 История операций
- 💸 Отслеживание списаний

## Команды

- `/balance` - Показать текущий баланс
- `/add-balance` - Пополнить баланс

## Кнопки

- `💳 Пополнить` - Пополнить баланс
- `📊 История` - История операций
- `💸 Списания` - Все списания
- `🎁 Бонусы` - Доступные бонусы
- `🔄 Обновить` - Обновить баланс

## Использование

```typescript
import { createBalanceCommand } from './balance';

const plugin = createBalanceCommand();
```

## Типы данных

```typescript
interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
  lastTransaction: string;
  frozen: boolean;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  balanceAfter: number;
}
```
