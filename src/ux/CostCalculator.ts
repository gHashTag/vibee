/**
 * Cost Calculator
 * Рассчитывает стоимость операций
 */

interface CostCalculation {
  stars: number;
  rubles: number;
  description: string;
  breakdown?: string;
}

export class CostCalculator {
  private static STAR_TO_RUBLES = 0.5; // 1 звезда = 0.5 рубля

  static calculateCost(
    type: string,
    params: any
  ): CostCalculation {
    const costs: Record<string, { base: number; multiplier?: (p: any) => number; description: string; breakdown?: string }> = {
      'neuro-photo': {
        base: 8,
        description: 'Генерация изображения',
        breakdown: 'Базовая стоимость'
      },
      'image-upscaler': {
        base: 4,
        description: 'Увеличение качества',
        breakdown: 'Увеличение 2x/4x'
      },
      'video-generation': {
        base: 25,
        multiplier: (p) => (p.duration || 5),
        description: 'Генерация видео',
        breakdown: `25 звезд × длительность (${params.duration || 5} сек)`
      },
      'avatar-training': {
        base: 150,
        description: 'Обучение аватара',
        breakdown: 'Обучающая модель LoRA'
      },
      'text-to-speech': {
        base: 2,
        multiplier: (p) => Math.ceil((p.text?.length || 100) / 100),
        description: 'Синтез речи',
        breakdown: '2 звезды за каждые 100 символов'
      },
      'ai-photoshop': {
        base: 5,
        description: 'ИИ обработка',
        breakdown: 'За операцию (фон, стиль, улучшение)'
      },
      'face-swap': {
        base: 10,
        description: 'Замена лица',
        breakdown: 'Смена лица на фото'
      },
      'morphing': {
        base: 20,
        multiplier: (p) => Math.ceil((p.duration || 5) / 5),
        description: 'Морфинг',
        breakdown: `20 звезд × количество 5-секундных сегментов`
      }
    };

    const cost = costs[type];
    if (!cost) {
      return { stars: 0, rubles: 0, description: 'Неизвестная операция' };
    }

    const multiplier = cost.multiplier ? cost.multiplier(params) : 1;
    const stars = Math.round(cost.base * multiplier);
    const rubles = Math.round(stars * this.STAR_TO_RUBLES);

    return {
      stars,
      rubles,
      description: cost.description,
      breakdown: cost.breakdown
    };
  }

  static async showCostPreview(
    ctx: any,
    type: string,
    params: any
  ): Promise<void> {
    const cost = this.calculateCost(type, params);
    const userBalance = await this.getUserBalance(ctx.from.id);
    const canAfford = cost.stars <= userBalance;

    const preview = `💰 <b>Расчет стоимости</b>\n\n` +
                   `📊 <b>Операция:</b> ${cost.description}\n` +
                   `⭐ <b>Стоимость:</b> ${cost.stars} звезд\n` +
                   `💵 <b>В рублях:</b> ~${cost.rubles} ₽\n\n` +
                   (cost.breakdown ? `📋 <b>Расчет:</b>\n${cost.breakdown}\n\n` : '') +
                   `💳 <b>Ваш баланс:</b> ${userBalance} звезд\n\n` +
                   (canAfford
                     ? `✅ <b>Средств достаточно!</b>\n\nОстаток после операции: ${userBalance - cost.stars} звезд`
                     : `⚠️ <b>Недостаточно средств!</b>\n\nНужно еще: ${cost.stars - userBalance} звезд`);

    await ctx.reply(preview, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...(canAfford
            ? [[{ text: '✅ Продолжить', callback_data: 'confirm_operation' }]]
            : [[{ text: '💎 Пополнить баланс', callback_data: 'topup_balance' }]]),
          [
            { text: '💰 Тарифы', callback_data: 'view_pricing' },
            { text: '💡 Как сэкономить', callback_data: 'cost_tips' }
          ],
          [
            { text: '📊 История расходов', callback_data: 'expense_history' }
          ]
        ]
      }
    });
  }

  static formatCost(stars: number): string {
    const rubles = Math.round(stars * this.STAR_TO_RUBLES);
    return `${stars}⭐ (${rubles}₽)`;
  }

  static getDiscountInfo(totalCost: number): { discount: number; finalCost: number; reason: string } | null {
    // Скидки за объем
    if (totalCost >= 1000) {
      return {
        discount: 0.1,
        finalCost: Math.round(totalCost * 0.9),
        reason: 'Скидка 10% за крупный заказ'
      };
    }

    if (totalCost >= 500) {
      return {
        discount: 0.05,
        finalCost: Math.round(totalCost * 0.95),
        reason: 'Скидка 5% за оптовый заказ'
      };
    }

    return null;
  }

  private static async getUserBalance(userId: string): Promise<number> {
    // Получаем из БД или кэша
    // Здесь должна быть реальная логика получения баланса
    return 100;
  }
}
