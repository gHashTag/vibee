import type { IAgentRuntime, Memory } from '@elizaos/core';
import type { ModelContext, ModelResult, AIModel } from './types';
import { logger } from '@elizaos/core';

export async function getAvailableModels(): Promise<AIModel[]> {
  return [
    { id: 'claude-3.5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Лучший для сложных задач', features: ['Анализ кода', 'Креативность', 'Рассуждения'], cost: 0.015, speed: 'medium', quality: 'high', available: true },
    { id: 'gpt-4', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Универсальная модель', features: ['Универсальность', 'Быстрота', 'API'], cost: 0.01, speed: 'fast', quality: 'high', available: true },
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Быстрая и экономная', features: ['Скорость', 'Экономия', 'Простота'], cost: 0.002, speed: 'fast', quality: 'medium', available: true },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Мультимодальная модель', features: ['Изображения', 'Длинные тексты', 'Анализ'], cost: 0.008, speed: 'medium', quality: 'high', available: true }
  ];
}

export async function handleModelCommand(
  runtime: IAgentRuntime,
  message: Memory,
  context: ModelContext
): Promise<ModelResult> {
  try {
    logger.info('🤖 Handling model command');
    const models = await getAvailableModels();

    const telegramService = runtime.getService('telegram');
    if (!telegramService?.bot) throw new Error('Telegram service not available');

    const modelText = `🤖 **Выбор AI-модели**

Текущая модель: Claude 3.5 Sonnet

**Рекомендуемые:**
🤖 **Claude 3.5 Sonnet** (Anthropic)
   Лучший для сложных задач, анализа кода
   ⚡ Скорость: средняя | 🎯 Качество: высокое

🚀 **GPT-3.5 Turbo** (OpenAI)
   Быстрая и экономная
   ⚡ Скорость: высокая | 🎯 Качество: среднее

💰 **Gemini Pro** (Google)
   Мультимодальная модель
   ⚡ Скорость: средняя | 🎯 Качество: высокое`;

    const buttons = {
      inline_keyboard: [
        [{ text: '🤖 Claude 3.5', callback_data: 'model_claude-3.5' }],
        [{ text: '🚀 GPT-3.5', callback_data: 'model_gpt-3.5' }],
        [{ text: '💰 Gemini Pro', callback_data: 'model_gemini-pro' }],
        [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
      ]
    };

    await telegramService.bot.telegram.sendMessage(context.chatId, modelText, {
      parse_mode: 'Markdown',
      reply_markup: buttons
    });

    return { success: true, data: models };
  } catch (error) {
    logger.error('❌ Model failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
