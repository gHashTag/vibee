# Expense Analysis Command Plugin

Команда для анализа расходов и получения рекомендаций по управлению бюджетом.

## Функции

- 💰 Анализ расходов по категориям
- 📊 Графики и тренды
- 💡 Персональные советы по экономии
- 📈 Прогнозирование трат

## Команды

- `/expenses` - Показать анализ расходов за месяц
- `/expenses week` - Расходы за неделю
- `/expenses year` - Расходы за год

## Кнопки

- `📊 Детально` - Подробная аналитика
- `📅 Период` - Выбор периода анализа
- `💡 Совет` - Персональные рекомендации
- `📈 Тренды` - Графики динамики

## Использование

```typescript
import { createExpenseAnalysisCommand } from './expense-analysis';

const plugin = createExpenseAnalysisCommand();
```

## Типы данных

```typescript
interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  tags: string[];
}

interface ExpenseAnalysis {
  totalAmount: number;
  categoryBreakdown: { [category: string]: number };
  monthlyTotal: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  trends: Array<{ period: string; amount: number; change: number }>;
  suggestions: string[];
}
```
