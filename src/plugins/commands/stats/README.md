# Stats Command Plugin

Команда для отображения подробной статистики бота.

## Функции

- 📊 Показ общей статистики бота
- 📈 Детальная статистика с метриками производительности
- 💾 Экспорт данных в различных форматах
- 🔄 Обновление данных в реальном времени

## Команды

- `/stats` - Показать основную статистику

## Кнопки

- `📈 Детально` - Показать подробную статистику
- `💾 Export` - Экспорт данных
- `🔄 Обновить` - Обновить статистику
- `🔙 Назад` - Вернуться в меню

## Использование

```typescript
import { createStatsCommand } from './stats';

const plugin = createStatsCommand();
```

## Типы данных

```typescript
interface BotStats {
  totalUsers: number;
  activeBots: number;
  totalRevenue: number;
  uptime: string;
  todayOperations: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
}
```
