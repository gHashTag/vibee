/**
 * AI Tutor Plugin
 * AI-преподаватель для ответов на вопросы с использованием векторной БД курсов
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';

logger.info('🤖 [AI TUTOR PLUGIN] Module loaded - exporting plugin');

interface TutorResponse {
  answer: string;
  sources: Array<{
    title: string;
    course: string;
    section: string;
    content: string;
  }>;
  suggestions: string[];
}

class AiTutorService extends Service {
  static serviceType = 'ai-tutor';
  public capabilityDescription = 'AI Tutor that answers questions using vectorized course knowledge';

  private vectorDbService: any = null;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[AiTutorService] 🎓 Initializing AI Tutor...');

    try {
      // Получаем ссылку на Vector Database Service
      this.vectorDbService = runtime.getService('vector-database');

      if (!this.vectorDbService) {
        logger.warn('[AiTutorService] ⚠️ Vector Database Service not found. Tutor will work in basic mode.');
      } else {
        logger.info('[AiTutorService] ✅ Vector Database Service connected');
      }
    } catch (error) {
      logger.error('[AiTutorService] ❌ Error initializing:', error);
    }
  }

  /**
   * Ответ на вопрос пользователя
   */
  async answerQuestion(
    question: string,
    userId: string,
    runtime: IAgentRuntime,
    message?: Memory
  ): Promise<TutorResponse> {
    try {
      logger.info(`[AiTutorService] 🤔 Answering question: "${question}"`);

      // Поиск релевантной информации в векторной БД
      let relevantInfo = '';
      let sources: TutorResponse['sources'] = [];

      if (this.vectorDbService) {
        const searchResults = await this.vectorDbService.search(question, 5);

        if (searchResults && searchResults.length > 0) {
          relevantInfo = searchResults
            .map((r: any) => r.content)
            .join('\n\n');

          sources = searchResults.map((r: any) => ({
            title: r.metadata.title,
            course: r.metadata.course,
            section: r.metadata.section,
            content: r.content.substring(0, 200) + '...',
          }));

          logger.info(`[AiTutorService] 📚 Found ${searchResults.length} relevant sources`);
        }
      }

      // Генерируем ответ через LLM
      const answer = await this.generateAnswer(question, relevantInfo, runtime);

      // Предлагаем следующие вопросы
      const suggestions = this.generateSuggestions(question, sources);

      logger.info('[AiTutorService] ✅ Answer generated successfully');

      return {
        answer,
        sources,
        suggestions,
      };
    } catch (error) {
      logger.error('[AiTutorService] ❌ Error answering question:', error);
      return {
        answer: 'Извини, произошла ошибка при поиске ответа. Попробуй переформулировать вопрос.',
        sources: [],
        suggestions: ['Что такое AI-агенты?', 'Как создать Telegram бота?', 'Объясни промптинг'],
      };
    }
  }

  /**
   * Генерация ответа через LLM
   */
  private async generateAnswer(
    question: string,
    relevantInfo: string,
    runtime: IAgentRuntime
  ): Promise<string> {
    try {
      // Системный промпт для AI-преподавателя
      const systemPrompt = `Ты - AI-преподаватель академии Vibee. Объясняй сложные темы простыми словами на русском языке.

Твоя задача:
- Отвечай на вопросы студентов
- Используй только достоверную информацию из курсов
- Если информации недостаточно, честно скажи об этом
- Приводи примеры из практики
- Будь дружелюбным и поддерживающим

Стиль общения:
- Используй простой русский язык
- Структурируй ответы (заголовки, списки)
- Добавляй практические примеры
- Задавай уточняющие вопросы для лучшего понимания`;

      // Подготавливаем контекст
      const context = relevantInfo
        ? `Контекст из курсов:\n\n${relevantInfo}`
        : 'Контекст не найден в курсах. Используй свои знания, но укажи, что это общеизвестная информация.';

      // Создаем промпт для LLM
      const fullPrompt = `${systemPrompt}\n\n${context}\n\nВопрос студента: ${question}\n\nДай подробный и понятный ответ:`;

      // Получаем ответ от LLM через generateText
      const response = await runtime.generateText(fullPrompt);

      if (!response) {
        throw new Error('No response from LLM');
      }

      return String(response);
    } catch (error) {
      logger.error('[AiTutorService] ❌ Error generating answer:', error);

      // Fallback ответ без LLM
      return `Я нашел информацию по твоему вопросу в курсах академии.

Попробуй задать вопрос более конкретно, чтобы я мог дать более точный ответ.

Например:
- "Что такое промптинг?" вместо "Как работает AI?"
- "Как создать первого агента?" вместо "Как программировать?"

Или изучи разделы:
📚 Agentic VibeCoding - основы создания AI-агентов
📚 AI Music Production - работа с AI в творчестве`;
    }
  }

  /**
   * Генерация предложений для следующих вопросов
   */
  private generateSuggestions(
    question: string,
    sources: TutorResponse['sources']
  ): string[] {
    const suggestions: string[] = [];

    // Анализируем ключевые слова в вопросе
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('agent') || lowerQuestion.includes('аген')) {
      suggestions.push('Как создать первого AI-агента?');
      suggestions.push('Что такое промптинг для агентов?');
      suggestions.push('Какие есть типы AI-агентов?');
    }

    if (lowerQuestion.includes('telegram') || lowerQuestion.includes('телеграм')) {
      suggestions.push('Как настроить Telegram бота?');
      suggestions.push('Какие команды есть у бота?');
      suggestions.push('Как добавить кнопки в бота?');
    }

    if (lowerQuestion.includes('ai') || lowerQuestion.includes('ии') || lowerQuestion.includes('нейро')) {
      suggestions.push('Что такое машинное обучение?');
      suggestions.push('Как работают нейросети?');
      suggestions.push('Что такое LLM модели?');
    }

    if (lowerQuestion.includes('музык') || lowerQuestion.includes('music')) {
      suggestions.push('Как создать музыку с помощью AI?');
      suggestions.push('Что такое дистрибуция треков?');
      suggestions.push('Как создать обложку для трека?');
    }

    // Если нет специфичных предложений, добавляем общие
    if (suggestions.length === 0) {
      suggestions.push('Что такое vibe-coding?');
      suggestions.push('Как начать изучать AI?');
      suggestions.push('Какие курсы доступны в академии?');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Объяснение темы из курса
   */
  async explainTopic(
    topic: string,
    userId: string,
    runtime: IAgentRuntime
  ): Promise<TutorResponse> {
    const question = `Объясни подробно тему: ${topic}`;
    return this.answerQuestion(question, userId, runtime);
  }

  /**
   * Помощь с уроком
   */
  async helpWithLesson(
    lessonPath: string,
    question: string,
    userId: string,
    runtime: IAgentRuntime
  ): Promise<TutorResponse> {
    const fullQuestion = `Урок: ${lessonPath}\nВопрос: ${question}`;
    return this.answerQuestion(fullQuestion, userId, runtime);
  }

  /**
   * Получение рекомендаций по обучению
   */
  async getRecommendations(
    userId: string,
    runtime: IAgentRuntime
  ): Promise<string[]> {
    try {
      const recommendations = [
        '📚 Начни с курса "Agentic VibeCoding" - основы создания AI-агентов',
        '🎵 Изучи "AI Music Production" - создание музыки с помощью ИИ',
        '🤖 Практикуйся с созданием Telegram ботов',
        '💡 Изучи промптинг - искусство общения с AI',
        '🔧 Попробуй обучить свою LoRA модель',
      ];

      return recommendations;
    } catch (error) {
      logger.error('[AiTutorService] ❌ Error getting recommendations:', error);
      return ['Попробуй изучить курсы академии Vibee'];
    }
  }

  static async start(runtime: IAgentRuntime): Promise<AiTutorService> {
    const service = new AiTutorService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[AiTutorService] Stopping...');
    this.vectorDbService = null;
  }
}

export const aiTutorPlugin: Plugin = {
  name: 'ai-tutor',
  description: 'AI Tutor for answering questions using vectorized course knowledge',
  services: [AiTutorService],
};

logger.info('🤖 [AI TUTOR PLUGIN] Plugin exported');

export default aiTutorPlugin;
export { AiTutorService };
