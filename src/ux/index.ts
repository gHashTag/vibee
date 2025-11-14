/**
 * UX Components Index
 * Экспортирует все UX компоненты
 */

export { ProgressIndicator } from './ProgressIndicator';
export { UserFriendlyErrorHandler } from './ErrorHandler';
export { PromptAssistant } from './PromptAssistant';
export { PreviewRenderer } from './PreviewRenderer';
export { CostCalculator } from './CostCalculator';
export { UserHistory } from './UserHistory';

// Типы
export interface UXContext {
  ctx: any;
  userId: string;
  chatId: number;
}

// Утилиты для быстрого старта
export class QuickStart {
  static createProgress(ctx: any, steps: string[]): ProgressIndicator {
    return new ProgressIndicator(ctx, { steps });
  }

  static showError(ctx: any, error: Error): Promise<void> {
    return UserFriendlyErrorHandler.handleError(ctx, error);
  }

  static showCostPreview(ctx: any, type: string, params: any): Promise<void> {
    return CostCalculator.showCostPreview(ctx, type, params);
  }

  static showPromptHelp(ctx: any, prompt: string): Promise<void> {
    return PromptAssistant.showExamples(ctx);
  }

  static addToHistory(userId: string, operation: any): Promise<void> {
    return UserHistory.add(userId, operation);
  }
}
