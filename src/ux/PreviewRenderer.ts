/**
 * Preview Renderer
 * Показывает предпросмотр перед генерацией
 */

interface PreviewParams {
  prompt: string;
  model: string;
  size: string;
  style?: string;
  quality?: string;
  duration?: number;
}

export class PreviewRenderer {
  static async showImagePreview(
    ctx: any,
    params: PreviewParams,
    estimatedCost: number,
    estimatedTime: number
  ): Promise<void> {
    const preview = `🎬 <b>Предпросмотр генерации изображения</b>\n\n` +
                   `📝 <b>Промпт:</b>\n<code>${params.prompt}</code>\n\n` +
                   `🎨 <b>Модель:</b> ${params.model}\n` +
                   `📐 <b>Размер:</b> ${params.size}\n\n` +
                   `💰 <b>Стоимость:</b> ${estimatedCost} звезд (~${Math.round(estimatedCost * 0.5)} ₽)\n` +
                   `⏱️ <b>Время:</b> ~${estimatedTime} сек\n\n` +
                   `⚙️ <b>Настройки:</b>\n` +
                   `• Стиль: ${params.style || 'не указан'}\n` +
                   `• Качество: ${params.quality || 'стандартное'}\n\n` +
                   `Подтверждаете генерацию?`;

    await ctx.reply(preview, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: 'confirm_generation' },
            { text: '✏️ Изменить', callback_data: 'edit_params' }
          ],
          [
            { text: '💾 Сохранить как шаблон', callback_data: 'save_template' },
            { text: '💡 Улучшить промпт', callback_data: 'improve_prompt' }
          ]
        ]
      }
    });
  }

  static async showVideoPreview(
    ctx: any,
    params: PreviewParams & { motionPrompt?: string },
    estimatedCost: number,
    estimatedTime: number
  ): Promise<void> {
    const preview = `🎥 <b>Предпросмотр генерации видео</b>\n\n` +
                   `📝 <b>Промпт:</b>\n<code>${params.prompt}</code>\n\n` +
                   `🎬 <b>Движение:</b>\n<code>${params.motionPrompt || 'стандартное'}</code>\n\n` +
                   `🎨 <b>Модель:</b> ${params.model}\n` +
                   `📐 <b>Размер:</b> ${params.size}\n` +
                   `⏱️ <b>Длительность:</b> ${params.duration || 5} сек\n\n` +
                   `💰 <b>Стоимость:</b> ${estimatedCost} звезд (~${Math.round(estimatedCost * 0.5)} ₽)\n` +
                   `⏱️ <b>Время:</b> ~${estimatedTime} сек\n\n` +
                   `⚙️ <b>Настройки:</b>\n` +
                   `• Стиль: ${params.style || 'не указан'}\n` +
                   `• Качество: ${params.quality || 'стандартное'}\n\n` +
                   `Подтверждаете генерацию?`;

    await ctx.reply(preview, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: 'confirm_generation' },
            { text: '✏️ Изменить', callback_data: 'edit_params' }
          ],
          [
            { text: '💾 Сохранить как шаблон', callback_data: 'save_template' },
            { text: '💡 Улучшить промпт', callback_data: 'improve_prompt' }
          ]
        ]
      }
    });
  }

  static async showCostPreview(
    ctx: any,
    type: string,
    params: any,
    estimatedCost: number
  ): Promise<void> {
    const userBalance = await this.getUserBalance(ctx.from.id);
    const canAfford = estimatedCost <= userBalance;

    const preview = `💰 <b>Расчет стоимости</b>\n\n` +
                   `📊 <b>Операция:</b> ${this.getOperationName(type)}\n` +
                   `⭐ <b>Стоимость:</b> ${estimatedCost} звезд\n` +
                   `💵 <b>В рублях:</b> ~${Math.round(estimatedCost * 0.5)} ₽\n\n` +
                   `💳 <b>Ваш баланс:</b> ${userBalance} звезд\n\n` +
                   (canAfford
                     ? `✅ <b>Средств достаточно!</b>\n\nМожете продолжать.`
                     : `⚠️ <b>Недостаточно средств!</b>\n\nПополните баланс для продолжения.`);

    await ctx.reply(preview, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💎 Пополнить баланс', callback_data: 'topup_balance' },
            { text: '💰 Тарифы', callback_data: 'view_pricing' }
          ],
          [
            { text: '💡 Сэкономить', callback_data: 'cost_tips' },
            { text: '📊 История расходов', callback_data: 'expense_history' }
          ]
        ]
      }
    });
  }

  private static getOperationName(type: string): string {
    const names: Record<string, string> = {
      'neuro-photo': 'Генерация изображения',
      'video-generation': 'Генерация видео',
      'avatar-training': 'Обучение аватара',
      'text-to-speech': 'Синтез речи',
      'ai-photoshop': 'ИИ обработка',
      'image-upscaler': 'Увеличение качества'
    };
    return names[type] || type;
  }

  private static async getUserBalance(userId: string): Promise<number> {
    // Получаем из БД или кэша
    // Здесь должна быть реальная логика
    return 100;
  }
}
