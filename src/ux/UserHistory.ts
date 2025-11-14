/**
 * User History Manager
 * Управляет историей операций пользователя
 */

interface HistoryItem {
  id: string;
  type: string;
  operation: string;
  data: any;
  result?: any;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
}

export class UserHistory {
  private static HISTORY_KEY = 'user_history';
  private static MAX_ITEMS = 50;

  static async add(userId: string, operation: Partial<HistoryItem>): Promise<void> {
    const history = await this.get(userId);

    const item: HistoryItem = {
      id: Date.now().toString(),
      type: operation.type || 'unknown',
      operation: operation.operation || 'Неизвестная операция',
      data: operation.data || {},
      result: operation.result,
      timestamp: Date.now(),
      status: operation.status || 'success'
    };

    history.unshift(item);

    // Оставляем только последние MAX_ITEMS операций
    if (history.length > this.MAX_ITEMS) {
      history.splice(this.MAX_ITEMS);
    }

    await this.set(userId, history);
  }

  static async get(userId: string): Promise<HistoryItem[]> {
    // Получаем из БД или кэша
    // Здесь должна быть реальная логика
    return [];
  }

  static async set(userId: string, history: HistoryItem[]): Promise<void> {
    // Сохраняем в БД или кэш
    // Здесь должна быть реальная логика сохранения
  }

  static async show(ctx: any, filter?: { type?: string; limit?: number }): Promise<void> {
    const history = await this.get(ctx.from.id.toString());
    const filtered = this.filterHistory(history, filter);

    if (filtered.length === 0) {
      await ctx.reply(
        '📭 <b>История пуста</b>\n\nВыполните первую операцию, чтобы увидеть историю здесь.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const recent = filtered.slice(0, filter?.limit || 5);

    const message = `📚 <b>История операций</b>${filter?.type ? ` (${filter.type})` : ''}\n\n` +
                   recent.map((item, i) => {
                     const date = new Date(item.timestamp).toLocaleString('ru-RU', {
                       day: '2-digit',
                       month: '2-digit',
                       hour: '2-digit',
                       minute: '2-digit'
                     });
                     const icon = this.getOperationIcon(item.type);
                     const status = this.getStatusIcon(item.status);
                     return `${i + 1}. ${status} ${icon} ${item.operation}\n   📅 ${date}`;
                   }).join('\n\n');

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Полная история', callback_data: 'full_history' },
            { text: '📋 По типам', callback_data: 'history_by_type' }
          ],
          [
            { text: '🔍 Поиск', callback_data: 'history_search' },
            { text: '🗑️ Очистить', callback_data: 'clear_history' }
          ]
        ]
      }
    });
  }

  static async getByType(userId: string, type: string): Promise<HistoryItem[]> {
    const history = await this.get(userId);
    return history.filter(item => item.type === type);
  }

  static async search(userId: string, query: string): Promise<HistoryItem[]> {
    const history = await this.get(userId);
    const lowercaseQuery = query.toLowerCase();

    return history.filter(item =>
      item.operation.toLowerCase().includes(lowercaseQuery) ||
      JSON.stringify(item.data).toLowerCase().includes(lowercaseQuery)
    );
  }

  static async getStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    successRate: number;
    mostUsed: string;
  }> {
    const history = await this.get(userId);

    const byType: Record<string, number> = {};
    let successCount = 0;

    history.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      if (item.status === 'success') {
        successCount++;
      }
    });

    const mostUsed = Object.entries(byType)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'нет данных';

    return {
      total: history.length,
      byType,
      successRate: history.length > 0 ? Math.round((successCount / history.length) * 100) : 0,
      mostUsed
    };
  }

  static async clear(userId: string): Promise<void> {
    await this.set(userId, []);
  }

  private static filterHistory(
    history: HistoryItem[],
    filter?: { type?: string; limit?: number }
  ): HistoryItem[] {
    let filtered = history;

    if (filter?.type) {
      filtered = filtered.filter(item => item.type === filter.type);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  private static getOperationIcon(type: string): string {
    const icons: Record<string, string> = {
      'neuro-photo': '📸',
      'video-generation': '🎬',
      'avatar-training': '🤖',
      'text-to-speech': '🎙️',
      'ai-photoshop': '🎨',
      'image-upscaler': '⬆️',
      'face-swap': '🎭',
      'morphing': '🌀',
      'subscription': '💫',
      'payment': '💰'
    };
    return icons[type] || '❓';
  }

  private static getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'success': '✅',
      'pending': '⏳',
      'error': '❌',
      'cancelled': '🚫'
    };
    return icons[status] || '❓';
  }
}
