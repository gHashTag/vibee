import { logger, type IAgentRuntime, type Plugin, Service, type Memory } from '@elizaos/core';
import { targetAudience } from './vibe-coding-knowledge.ts';

logger.info('💼 [SALES] Module loaded');

/**
 * Sales Automation Service - автоматизация продаж Vibee
 *
 * Features:
 * - Квалификация лидов в Telegram
 * - Автоматическая воронка продаж
 * - Персонализированные предложения
 * - Follow-up сообщения
 * - Трекинг конверсии
 */
class SalesAutomationService extends Service {
  static serviceType = 'sales-automation';
  capabilityDescription = 'Automates sales funnel and lead generation for Vibee';

  private readonly SALES_STAGES = {
    NEW_LEAD: 'new_lead',
    QUALIFIED: 'qualified',
    DEMO_SCHEDULED: 'demo_scheduled',
    PROPOSAL_SENT: 'proposal_sent',
    NEGOTIATION: 'negotiation',
    CLOSED_WON: 'closed_won',
    CLOSED_LOST: 'closed_lost',
  };

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new SalesAutomationService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    // Cleanup
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[SalesAutomation] 💼 Initializing sales automation...');

    // Подписываемся на новые сообщения в Telegram
    runtime.on('TELEGRAM_MESSAGE_RECEIVED', async (message: Memory) => {
      await this.handleIncomingMessage(runtime, message);
    });

    logger.info('[SalesAutomation] ✅ Sales automation enabled');
  }

  /**
   * Обработать входящее сообщение
   */
  private async handleIncomingMessage(runtime: IAgentRuntime, message: Memory): Promise<void> {
    const userId = message.userId;
    if (!userId) return;

    // Получаем профиль лида
    const leadProfile = await this.getLeadProfile(runtime, userId);

    // Квалифицируем лида
    const qualification = await this.qualifyLead(runtime, message, leadProfile);

    // Выбираем стратегию ответа
    const strategy = this.selectSalesStrategy(qualification);

    // Генерируем персонализированный ответ
    const response = await this.generateSalesResponse(runtime, message, qualification, strategy);

    logger.info(`[SalesAutomation] 🎯 Lead qualified as: ${qualification.score}/10`);
    logger.info(`[SalesAutomation] 📊 Strategy: ${strategy}`);
  }

  /**
   * Получить профиль лида
   */
  private async getLeadProfile(runtime: IAgentRuntime, userId: string): Promise<any> {
    // Получаем историю диалогов
    const memories = await runtime.databaseAdapter?.getMemories({
      roomId: userId,
      count: 50,
    });

    return {
      userId,
      messagesCount: memories?.length || 0,
      firstMessage: memories?.[0],
      lastMessage: memories?.[memories.length - 1],
      topics: this.extractTopics(memories || []),
    };
  }

  /**
   * Квалифицировать лида (scoring 0-10)
   */
  private async qualifyLead(
    runtime: IAgentRuntime,
    message: Memory,
    profile: any
  ): Promise<{ score: number; signals: string[]; painPoints: string[] }> {
    const text = (message.content as any)?.text?.toLowerCase() || '';
    let score = 0;
    const signals: string[] = [];
    const painPoints: string[] = [];

    // Сигналы покупательского намерения
    const buyerSignals = [
      { keyword: 'купить', points: 3, signal: '💰 Явное намерение покупки' },
      { keyword: 'цена', points: 2, signal: '💵 Интерес к ценообразованию' },
      { keyword: 'попробовать', points: 2, signal: '🔄 Готовность к trial' },
      { keyword: 'демо', points: 3, signal: '🎥 Запрос демо' },
      { keyword: 'как работает', points: 1, signal: '❓ Исследовательский интерес' },
      { keyword: 'фриланс', points: 2, signal: '💼 Целевая аудитория' },
      { keyword: 'разработчик', points: 2, signal: '👨‍💻 Целевая аудитория' },
      { keyword: 'стартап', points: 3, signal: '🚀 Целевая аудитория (высокий budget)' },
      { keyword: 'команда', points: 2, signal: '👥 B2B потенциал' },
      { keyword: 'проект', points: 1, signal: '📊 Активный разработчик' },
    ];

    for (const { keyword, points, signal } of buyerSignals) {
      if (text.includes(keyword)) {
        score += points;
        signals.push(signal);
      }
    }

    // Pain points (боли клиента)
    const painPointsMap = [
      { keyword: 'долго', painPoint: '⏰ Нехватка времени' },
      { keyword: 'сложно', painPoint: '😫 Технические сложности' },
      { keyword: 'не знаю', painPoint: '📚 Пробел в знаниях' },
      { keyword: 'дедлайн', painPoint: '⏰ Pressure дедлайнов' },
      { keyword: 'рутина', painPoint: '🔄 Рутинные задачи' },
      { keyword: 'ошибк', painPoint: '🐛 Проблемы с багами' },
    ];

    for (const { keyword, painPoint } of painPointsMap) {
      if (text.includes(keyword)) {
        painPoints.push(painPoint);
      }
    }

    // Бонус за историю взаимодействия
    if (profile.messagesCount > 5) {
      score += 1;
      signals.push('📈 Активный пользователь');
    }

    return { score, signals, painPoints };
  }

  /**
   * Выбрать стратегию продаж
   */
  private selectSalesStrategy(qualification: { score: number }): string {
    if (qualification.score >= 7) return 'AGGRESSIVE_CLOSE'; // Закрывать сделку
    if (qualification.score >= 4) return 'NURTURE'; // Взращивать лида
    if (qualification.score >= 2) return 'EDUCATE'; // Обучать
    return 'ENGAGE'; // Вовлекать
  }

  /**
   * Сгенерировать ответ с учетом продаж
   */
  private async generateSalesResponse(
    runtime: IAgentRuntime,
    message: Memory,
    qualification: any,
    strategy: string
  ): Promise<string> {
    const userMessage = (message.content as any)?.text || '';

    const strategyPrompts = {
      AGGRESSIVE_CLOSE: `
Лид готов к покупке! Signals: ${qualification.signals.join(', ')}

Твоя задача:
1. Ответь на вопрос кратко и профессионально
2. Предложи бесплатную консультацию или демо
3. Дай ссылку на бронирование demo call
4. Создай срочность (ограниченное предложение)

Пример: "Отлично! Давай покажу тебе, как Vibee решает именно твою задачу. У меня есть слот сегодня в 15:00 - забронируй demo: [ссылка]"
`,

      NURTURE: `
Перспективный лид. Signals: ${qualification.signals.join(', ')}

Твоя задача:
1. Дай ценный ответ на вопрос
2. Покажи value Vibee на конкретном примере
3. Предложи полезный контент (кейс, туториал)
4. Soft CTA - предложи попробовать

Пример: "Кстати, у меня есть готовое решение для этой задачи в Vibee. Покажу как настроить за 5 минут?"
`,

      EDUCATE: `
Лид в исследовании. Pain points: ${qualification.painPoints.join(', ')}

Твоя задача:
1. Обучи - дай глубокий ответ
2. Покажи best practices
3. Тактично упомяни, как Vibee помогает
4. Предложи подписаться на контент

Пример: "Отличный вопрос! Вот как это решается... Кстати, в Vibee это автоматизировано. Хочешь еженедельные tips?"
`,

      ENGAGE: `
Новый лид. Вовлекаем в диалог.

Твоя задача:
1. Дай полезный ответ
2. Задай уточняющий вопрос
3. Узнай больше о задаче
4. Построй rapport

Пример: "Интересная задача! Расскажи больше - что именно ты делаешь? Работаешь над стартапом или фрилансишь?"
`,
    };

    const systemPrompt = `
Ты Vibee - AI-ассистент для разработчиков, эксперт по vibe-coding.

Вопрос пользователя: "${userMessage}"

Стратегия продаж: ${strategy}
${strategyPrompts[strategy as keyof typeof strategyPrompts]}

ВАЖНО:
- Будь естественным, не будь продажником-роботом
- Фокус на value, а не на продаже
- Если не знаешь ответ - признай это
- Используй эмодзи умеренно
`;

    // Генерируем через LLM
    try {
      const response = await runtime.generateText({
        context: systemPrompt,
        modelClass: 'SMALL',
      });

      // Логируем для аналитики
      logger.info(`[SalesAutomation] 📊 Generated ${strategy} response`);

      return response;
    } catch (error) {
      logger.error('[SalesAutomation] Failed to generate response:', error);
      return 'Отличный вопрос! Дай мне минуту подумать над лучшим ответом.';
    }
  }

  /**
   * Извлечь темы из истории
   */
  private extractTopics(memories: Memory[]): string[] {
    const topics = new Set<string>();
    const keywords = ['ai', 'agent', 'coding', 'development', 'telegram', 'bot', 'automation'];

    for (const memory of memories) {
      const text = ((memory.content as any)?.text || '').toLowerCase();
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          topics.add(keyword);
        }
      }
    }

    return Array.from(topics);
  }
}

export const salesAutomationPlugin: Plugin = {
  name: 'sales-automation',
  description: 'Automates sales funnel and lead generation for Vibee',
  services: [SalesAutomationService],
};

logger.info('💼 [SALES] Plugin exported');

export default salesAutomationPlugin;
