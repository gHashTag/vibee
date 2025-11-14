/**
 * Progress Indicator для Telegram бота
 * Визуальная обратная связь о ходе выполнения операций
 */

interface ProgressOptions {
  steps: string[];
  showBar?: boolean;
  showPercentage?: boolean;
  showETA?: boolean;
}

export class ProgressIndicator {
  private ctx: any;
  private messageId?: number;
  private steps: string[];
  private currentStep = 0;
  private startTime: number;
  private options: Required<ProgressOptions>;

  constructor(ctx: any, options: ProgressOptions) {
    this.ctx = ctx;
    this.steps = options.steps;
    this.options = {
      showBar: options.showBar ?? true,
      showPercentage: options.showPercentage ?? true,
      showETA: options.showETA ?? true,
    };
    this.startTime = Date.now();
  }

  async show(initialMessage?: string): Promise<void> {
    const text = this.generateProgressText(initialMessage);

    const message = await this.ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '⏸️ Пауза', callback_data: 'pause_progress' },
          { text: '❌ Отмена', callback_data: 'cancel_progress' }
        ]]
      }
    });

    this.messageId = message.message_id;
  }

  async update(step: number, data?: any): Promise<void> {
    if (step < 0 || step >= this.steps.length) return;

    this.currentStep = step;
    const text = this.generateProgressText(undefined, data);

    if (this.messageId) {
      await this.ctx.telegram.editMessageText(
        this.ctx.chat.id,
        this.messageId,
        undefined,
        text,
        { parse_mode: 'HTML' }
      );
    }
  }

  async complete(result?: any): Promise<void> {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const text = `✅ <b>Завершено!</b>\n\n` +
                 `⏱️ Время выполнения: ${duration} сек\n\n` +
                 (result ? `📊 Результат: ${JSON.stringify(result)}` : '');

    if (this.messageId) {
      await this.ctx.telegram.editMessageText(
        this.ctx.chat.id,
        this.messageId,
        undefined,
        text,
        { parse_mode: 'HTML' }
      );
    }
  }

  private generateProgressText(initialMessage?: string, data?: any): string {
    const progress = Math.round((this.currentStep / this.steps.length) * 100);
    const bar = this.options.showBar ? this.createProgressBar(progress) : '';

    let text = `⏳ <b>Обработка...</b>\n\n`;
    if (this.options.showBar) text += `${bar} ${progress}%\n\n`;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const prefix = i < this.currentStep ? '✅' :
                     i === this.currentStep ? '🔄' : '⏳';
      text += `${prefix} ${step}\n`;
    }

    if (initialMessage) {
      text += `\n📝 ${initialMessage}`;
    }

    if (data?.speed && this.options.showETA) {
      text += `\n\n⚡ Скорость: ${data.speed} итераций/сек`;
    }

    if (data?.eta && this.options.showETA) {
      text += `\n⏱️ Осталось: ~${Math.ceil(data.eta)} сек`;
    }

    return text;
  }

  private createProgressBar(percent: number): string {
    const total = 20;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;

    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }
}
