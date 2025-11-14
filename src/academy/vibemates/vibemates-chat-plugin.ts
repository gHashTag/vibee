/**
 * VibeMates Chat Plugin
 * Межагентное общение - VibeMates общаются между собой как живые люди!
 * Как в учительской - обсуждают новости, тренды, делятся опытом
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';
import { vibeMatesRegistry, type VibeMateSpec } from './vibemates-registry';

logger.info('💬 [VIBEMATES CHAT PLUGIN] Module loaded - exporting plugin');

/**
 * Сообщение от VibeMate
 */
interface VibeMateMessage {
  id: string;
  from: string; // mateId
  to: string; // mateId или 'all'
  content: string;
  timestamp: number;
  type: 'discussion' | 'question' | 'news' | 'trend' | 'advice';
  context?: string; // контекст сообщения
}

/**
 * Обсуждение между VibeMates
 */
interface Discussion {
  id: string;
  topic: string;
  participants: string[]; // mateIds
  messages: VibeMateMessage[];
  startedAt: number;
  lastActivity: number;
  status: 'active' | 'paused' | 'completed';
}

class VibeMatesChatService extends Service {
  static serviceType = 'vibemates-chat';
  public capabilityDescription = 'Inter-agent communication system for VibeMates';

  private discussions: Map<string, Discussion> = new Map();
  private chatRoomId = 'vibemates-teachers-room';
  private readonly MAX_DISCUSSIONS = 5;
  private readonly MAX_MESSAGES_PER_DISCUSSION = 50;

  // Шаблоны обсуждений
  private discussionTemplates = [
    {
      topic: 'AI тренды 2025',
      type: 'trend' as const,
      prompts: [
        {
          from: 'agents',
          content: 'Ребят, видели новость про GPT-5? Говорят, он будет автономнее наших агентов! 😅',
        },
        {
          from: 'prompts',
          content: 'Да, читал! Кстати, а как вы думаете - нужен ли новый подход к промптингу для таких моделей?',
        },
        {
          from: 'react',
          content: 'Однозначно! Нам уже сейчас сложно объяснить студентам разницу между prompt engineering и program engineering...',
        },
      ]
    },
    {
      topic: 'Обмен опытом обучения',
      type: 'advice' as const,
      prompts: [
        {
          from: 'music',
          content: 'Коллеги, подскажите - как мотивировать студентов, которые боятся создавать музыку?',
        },
        {
          from: 'react',
          content: 'Я всегда говорю: "Сначала копируй, потом творь!" Может, и вам такой подход подойдет?',
        },
        {
          from: 'agents',
          content: 'Согласен! Главное - первый успех. Пусть создадут простого агента, который что-то делает, а потом понеслось!',
        },
      ]
    },
    {
      topic: 'Инструменты и фреймворки',
      type: 'question' as const,
      prompts: [
        {
          from: 'prompts',
          content: 'Что думаете о новом LangGraph? Кто-нибудь пробовал для сложных промптов?',
        },
        {
          from: 'agents',
          content: 'Юзаю! Очень удобно для оркестрации мультиагентных систем. Визуализация workflow - топ!',
        },
        {
          from: 'react',
          content: 'А есть аналог для фронтенда? TypeScript плагины какие-то или инструменты для промптинга React компонентов?',
        },
      ]
    },
    {
      topic: 'Новости индустрии',
      type: 'news' as const,
      prompts: [
        {
          from: 'music',
          content: 'Слушайте, Suno объявили о новой модели v4! Говорят, качество вокала стало лучше на 300%',
        },
        {
          from: 'prompts',
          content: 'Ого! А что с генерацией текста? Можно ли использовать для lyric generation?',
        },
        {
          from: 'music',
          content: 'Да, теперь треки звучат более естественно. И главное - лучше понимает стиль!',
        },
      ]
    },
    {
      topic: 'Методики обучения',
      type: 'discussion' as const,
      prompts: [
        {
          from: 'agents',
          content: 'Как думаете - стоит ли начинать обучение с теории или сразу практики?',
        },
        {
          from: 'react',
          content: 'Я за практику! Студенты лучше понимают через код. Теория потом сама ложится.',
        },
        {
          from: 'prompts',
          content: 'Согласен! Но нужно давать сразу задачу с понятным результатом. Пусть видят "вау-эффект"!',
        },
      ]
    },
  ];

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[VibeMatesChatService] 💬 Initializing VibeMates Chat...');

    // Запускаем периодические обсуждения
    this.startPeriodicDiscussions(runtime);
  }

  /**
   * Запустить периодические обсуждения между VibeMates
   */
  private startPeriodicDiscussions(runtime: IAgentRuntime): void {
    // Каждые 5 минут начинаем новое обсуждение
    setInterval(() => {
      if (this.discussions.size < this.MAX_DISCUSSIONS) {
        this.startRandomDiscussion(runtime);
      }
    }, 5 * 60 * 1000);

    logger.info('[VibeMatesChatService] ✅ Periodic discussions scheduled (every 5 min)');
  }

  /**
   * Начать случайное обсуждение
   */
  private startRandomDiscussion(runtime: IAgentRuntime): void {
    const template = this.discussionTemplates[
      Math.floor(Math.random() * this.discussionTemplates.length)
    ];

    const discussionId = `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const discussion: Discussion = {
      id: discussionId,
      topic: template.topic,
      participants: ['agents', 'prompts', 'react', 'music'],
      messages: [],
      startedAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
    };

    this.discussions.set(discussionId, discussion);

    logger.info(`[VibeMatesChatService] 📢 Starting new discussion: "${template.topic}"`);

    // Запускаем цепочку сообщений
    this.runDiscussionChain(discussionId, template.prompts, runtime);
  }

  /**
   * Запустить цепочку сообщений в обсуждении
   */
  private async runDiscussionChain(
    discussionId: string,
    prompts: Array<{ from: string; content: string }>,
    runtime: IAgentRuntime,
    delay: number = 0
  ): Promise<void> {
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const messageDelay = delay + (i * 3 * 60 * 1000); // 3 минуты между сообщениями

      setTimeout(async () => {
        await this.addMessageToDiscussion(discussionId, {
          from: prompt.from,
          to: 'all',
          content: prompt.content,
          type: 'discussion',
        }, runtime);
      }, messageDelay);
    }

    // Завершаем обсуждение через 30 минут после последнего сообщения
    const totalDuration = delay + (prompts.length * 3 * 60 * 1000) + 30 * 60 * 1000;
    setTimeout(() => {
      this.completeDiscussion(discussionId);
    }, totalDuration);
  }

  /**
   * Добавить сообщение в обсуждение
   */
  private async addMessageToDiscussion(
    discussionId: string,
    message: Omit<VibeMateMessage, 'id' | 'timestamp'>,
    runtime: IAgentRuntime
  ): Promise<void> {
    const discussion = this.discussions.get(discussionId);
    if (!discussion || discussion.status !== 'active') {
      return;
    }

    const fullMessage: VibeMateMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      timestamp: Date.now(),
    };

    discussion.messages.push(fullMessage);
    discussion.lastActivity = Date.now();

    // Ограничиваем количество сообщений
    if (discussion.messages.length > this.MAX_MESSAGES_PER_DISCUSSION) {
      discussion.messages = discussion.messages.slice(-this.MAX_MESSAGES_PER_DISCUSSION);
    }

    // Генерируем ответное сообщение
    await this.generateResponse(discussionId, fullMessage, runtime);
  }

  /**
   * Сгенерировать ответное сообщение
   */
  private async generateResponse(
    discussionId: string,
    originalMessage: VibeMateMessage,
    runtime: IAgentRuntime
  ): Promise<void> {
    // Выбираем случайного VibeMate (не отправителя)
    const possibleResponders = ['agents', 'prompts', 'react', 'music'].filter(
      id => id !== originalMessage.from
    );
    const responder = possibleResponders[Math.floor(Math.random() * possibleResponders.length)];

    // Генерируем ответ
    const response = await this.generateMateResponse(
      responder,
      originalMessage.from,
      originalMessage.content,
      runtime
    );

    if (response) {
      setTimeout(async () => {
        await this.addMessageToDiscussion(discussionId, {
          from: responder,
          to: 'all',
          content: response,
          type: 'question',
        }, runtime);
      }, 1000 + Math.random() * 2000); // 1-3 секунды задержки
    }
  }

  /**
   * Сгенерировать ответ от конкретного VibeMate
   */
  private async generateMateResponse(
    responderId: string,
    fromId: string,
    messageContent: string,
    runtime: IAgentRuntime
  ): Promise<string> {
    const responderInfo = this.getMatePersonality(responderId);
    const fromInfo = this.getMatePersonality(fromId);

    const systemPrompt = `Ты ${responderInfo.name} - ${responderInfo.emoji}
${responderInfo.description}

Ты общаешься с коллегой ${fromInfo.name} в неформальном чате.
${responderInfo.personality}

Отвечай:
• Коротко и по делу (1-2 предложения)
• Дружелюбно и с юмором
• По теме сообщения коллеги
• Можно задавать вопросы или делиться опытом`;

    const contextPrompt = `Коллега ${fromInfo.name} написал:
"${messageContent}"

Твой ответ:`;

    try {
      const response = await runtime.generateText(`${systemPrompt}\n\n${contextPrompt}`);

      // Ограничиваем длину ответа
      const truncatedResponse = String(response).substring(0, 500);

      logger.info(`[VibeMatesChatService] 💬 ${responderInfo.name} responded to ${fromInfo.name}`);

      return truncatedResponse;
    } catch (error) {
      logger.error('[VibeMatesChatService] ❌ Error generating response:', error);
      return this.getFallbackResponse(responderId, fromId);
    }
  }

  /**
   * Получить личность VibeMate
   */
  private getMatePersonality(mateId: string): {
    name: string;
    emoji: string;
    description: string;
    personality: string;
  } {
    const personalities: Record<string, any> = {
      agents: {
        name: 'AgentsGuru',
        emoji: '🤖',
        description: 'Гуру по AI-агентам',
        personality: 'Ты технически подкован, всегда в теме новых фреймворков. Любишь делиться практическими советами.',
      },
      prompts: {
        name: 'PromptMaster',
        emoji: '🎨',
        description: 'Мастер промпт-инжиниринга',
        personality: 'Ты креативный и экспериментируешь с подходами. Обожаешь обсуждать техники и делиться лайфхаками.',
      },
      react: {
        name: 'ReactWizard',
        emoji: '⚛️',
        description: 'Волшебник React',
        personality: 'Ты перфекционист в коде, любишь best practices. Всегда предлагаешь оптимальные решения.',
      },
      music: {
        name: 'MusicMage',
        emoji: '🎵',
        description: 'Маг AI-музыки',
        personality: 'Ты творческий и вдохновляющий. Обожаешь делиться находками и вдохновлять на создание музыки.',
      },
    };

    return personalities[mateId] || personalities.agents;
  }

  /**
   * Запасной ответ
   */
  private getFallbackResponse(responderId: string, fromId: string): string {
    const responses: Record<string, string> = {
      agents: 'Интересная мысль! А как это применить в продакшене? 🤔',
      prompts: 'Согласен! Кстати, а пробовали это в реальных проектах?',
      react: 'Хорошая идея! Но нужно учесть производительность 💡',
      music: 'Крутой инсайт! Это можно развить дальше 🎶',
    };

    return responses[responderId] || 'Интересно! Продолжай рассказывать!';
  }

  /**
   * Завершить обсуждение
   */
  private completeDiscussion(discussionId: string): void {
    const discussion = this.discussions.get(discussionId);
    if (!discussion) return;

    discussion.status = 'completed';
    logger.info(`[VibeMatesChatService] ✅ Discussion "${discussion.topic}" completed`);

    // Удаляем старые обсуждения
    if (this.discussions.size > this.MAX_DISCUSSIONS) {
      const oldestId = Array.from(this.discussions.entries())
        .sort((a, b) => a[1].lastActivity - b[1].lastActivity)[0][0];
      this.discussions.delete(oldestId);
    }
  }

  /**
   * Получить активные обсуждения для отображения
   */
  getActiveDiscussions(): Discussion[] {
    return Array.from(this.discussions.values())
      .filter(d => d.status === 'active')
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Получить последние сообщения из обсуждений
   */
  getRecentMessages(limit: number = 20): VibeMateMessage[] {
    const allMessages: VibeMateMessage[] = [];

    this.discussions.forEach(discussion => {
      allMessages.push(...discussion.messages);
    });

    return allMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Форматировать сообщения для отображения
   */
  formatMessagesForDisplay(messages: VibeMateMessage[]): string {
    if (messages.length === 0) {
      return '💬 Пока нет сообщений. VibeMates еще не начали обсуждение!';
    }

    let output = '💬 **Чат VibeMates - Учительская:**\n\n';

    messages.forEach(msg => {
      const mate = this.getMatePersonality(msg.from);
      const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      output += `${mate.emoji} **${mate.name}** (${time}):\n`;
      output += `${msg.content}\n\n`;
    });

    output += `\n💡 *VibeMates - это ваши специализированные учителя, которые общаются между собой как коллеги!*`;

    return output;
  }

  /**
   * Принудительно начать обсуждение по теме
   */
  async forceStartDiscussion(
    topic: string,
    runtime: IAgentRuntime,
    participants: string[] = ['agents', 'prompts', 'react', 'music']
  ): Promise<boolean> {
    const discussionId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const discussion: Discussion = {
      id: discussionId,
      topic,
      participants,
      messages: [],
      startedAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
    };

    this.discussions.set(discussionId, discussion);

    logger.info(`[VibeMatesChatService] 🚀 Manual discussion started: "${topic}"`);

    // Генерируем первое сообщение
    const firstMessage = this.generateInitialMessage(topic, participants[0]);
    await this.addMessageToDiscussion(discussionId, {
      from: participants[0],
      to: 'all',
      content: firstMessage,
      type: 'discussion',
    }, runtime);

    return true;
  }

  /**
   * Сгенерировать начальное сообщение для темы
   */
  private generateInitialMessage(topic: string, fromId: string): string {
    const starters: Record<string, string> = {
      agents: `Ребята, давайте обсудим: ${topic} Что думаете?`,
      prompts: `Коллеги, вопрос по теме "${topic}" - как вы подходите к этому?`,
      react: `Всем привет! Хочу поговорить про ${topic} - у кого есть опыт?`,
      music: `Слушайте, интересная тема: ${topic} Делитесь мнениями! 🎵`,
    };

    return starters[fromId] || `Давайте обсудим: ${topic}`;
  }

  /**
   * Обработчик команд /chat для просмотра диалогов
   */
  async handleChatCommand(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const messages = this.getRecentMessages(15);
    const formatted = this.formatMessagesForDisplay(messages);

    try {
      await runtime.messageManager.create({
        userId,
        content: { text: formatted },
        roomId: `direct-${userId}`,
      });

      return true;
    } catch (error) {
      logger.error('[VibeMatesChatService] ❌ Error sending chat:', error);
      return false;
    }
  }

  static async start(runtime: IAgentRuntime): Promise<VibeMatesChatService> {
    const service = new VibeMatesChatService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[VibeMatesChatService] Stopping...');
    this.discussions.clear();
  }
}

export const vibematesChatPlugin: Plugin = {
  name: 'vibemates-chat',
  description: 'Inter-agent communication system for VibeMates',
  services: [VibeMatesChatService],
};

logger.info('💬 [VIBEMATES CHAT PLUGIN] Plugin exported');

export default vibematesChatPlugin;
export { VibeMatesChatService };
