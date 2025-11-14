/**
 * Topic Router Plugin
 * Автоматически подбирает нужного VibeMate специалиста
 * на основе анализа сообщения пользователя
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';
import { vibeMatesRegistry } from './vibemates-registry';

logger.info('🧭 [TOPIC ROUTER PLUGIN] Module loaded - exporting plugin');

class TopicRouterService extends Service {
  static serviceType = 'topic-router';
  public capabilityDescription = 'Automatically routes users to the right VibeMate specialist';

  private userTopics: Map<string, string> = new Map(); // userId -> mateId

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TopicRouterService] 🧭 Initializing Topic Router...');
  }

  /**
   * Найти подходящего VibeMate для пользователя
   */
  async findBestMate(
    userId: string,
    message: string,
    runtime: IAgentRuntime
  ): Promise<{
    mate: any | null;
    confidence: number;
    mateId: string;
    reason: string;
  }> {
    try {
      const result = vibeMatesRegistry.findMateByMessage(message);

      if (!result.mate || result.matchScore < 0.2) {
        return {
          mate: null,
          confidence: 0,
          mateId: '',
          reason: 'Не найден подходящий специалист'
        };
      }

      // Сохраняем выбор пользователя
      this.userTopics.set(userId, result.mateId);

      const mateInfo = this.getMateDisplayInfo(result.mateId);

      return {
        mate: result.mate,
        confidence: Math.round(result.matchScore * 100),
        mateId: result.mateId,
        reason: `Найден специалист: ${mateInfo.name} (${mateInfo.emoji})`
      };
    } catch (error) {
      logger.error('[TopicRouterService] ❌ Error finding best mate:', error);
      return {
        mate: null,
        confidence: 0,
        mateId: '',
        reason: 'Ошибка при поиске специалиста'
      };
    }
  }

  /**
   * Ручной выбор VibeMate пользователем
   */
  async setMateForUser(
    userId: string,
    mateId: string
  ): Promise<{ success: boolean; message: string; mate?: any }> {
    try {
      const mate = vibeMatesRegistry.getMateById(mateId);

      if (!mate) {
        return {
          success: false,
          message: `❌ VibeMate с ID "${mateId}" не найден`
        };
      }

      this.userTopics.set(userId, mateId);

      const info = this.getMateDisplayInfo(mateId);

      logger.info(`[TopicRouterService] 👤 User ${userId} manually selected mate: ${mateId}`);

      return {
        success: true,
        message: `✅ Переключен на ${info.emoji} **${info.name}**\n\n${info.description}`,
        mate
      };
    } catch (error) {
      logger.error('[TopicRouterService] ❌ Error setting mate:', error);
      return {
        success: false,
        message: '❌ Ошибка при переключении специалиста'
      };
    }
  }

  /**
   * Получить текущего VibeMate пользователя
   */
  getCurrentMate(userId: string): string | null {
    return this.userTopics.get(userId) || null;
  }

  /**
   * Получить информацию для отображения VibeMate
   */
  private getMateDisplayInfo(mateId: string): {
    name: string;
    emoji: string;
    description: string;
    specialties: string[];
  } {
    const info = vibeMatesRegistry.getMatesInfo();
    const mate = info.find(m => m.id === mateId);

    if (!mate) {
      return {
        name: 'Unknown',
        emoji: '❓',
        description: 'Неизвестный специалист',
        specialties: []
      };
    }

    // Добавляем специализации для каждого VibeMate
    const specialtiesMap: Record<string, string[]> = {
      agents: [
        'AI-агенты', 'Мультиагентные системы', 'ElizaOS', 'LangChain'
      ],
      prompts: [
        'Prompt Engineering', 'Chain-of-Thought', 'ReAct', 'Few-shot'
      ],
      react: [
        'React 18+', 'TypeScript', 'Next.js', 'State Management'
      ],
      music: [
        'AI-музыка', 'Suno', 'Обложки', 'Продвижение'
      ]
    };

    return {
      name: mate.name,
      emoji: mate.emoji,
      description: mate.description,
      specialties: specialtiesMap[mateId] || []
    };
  }

  /**
   * Получить список всех VibeMates
   */
  listAllMates(): Array<{
    id: string;
    name: string;
    emoji: string;
    description: string;
    specialties: string[];
    command: string;
  }> {
    const matesInfo = vibeMatesRegistry.getMatesInfo();

    return matesInfo.map(mate => {
      const info = this.getMateDisplayInfo(mate.id);
      return {
        id: mate.id,
        name: mate.name,
        emoji: mate.emoji,
        description: mate.description,
        specialties: info.specialties,
        command: `/mate ${mate.id}`
      };
    });
  }

  /**
   * Получить статистику использования VibeMates
   */
  getUsageStats(): {
    totalUsers: number;
    matesUsage: Record<string, number>;
    topMate: string | null;
  } {
    const usage: Record<string, number> = {};
    let totalUsers = this.userTopics.size;

    this.userTopics.forEach(mateId => {
      usage[mateId] = (usage[mateId] || 0) + 1;
    });

    const topMate = Object.keys(usage).reduce((a, b) =>
      usage[a] > usage[b] ? a : b, ''
    ) || null;

    return {
      totalUsers,
      matesUsage: usage,
      topMate
    };
  }

  /**
   * Обработчик входящих сообщений для авто-роутинга
   */
  async onMessage(runtime: IAgentRuntime, message: Memory, state: State): Promise<void> {
    const text = message.content?.text?.trim();
    const userId = message.userId;

    if (!text || !userId) return;

    // Пропускаем команды
    if (text.startsWith('/')) return;

    // Проверяем, есть ли уже выбранный VibeMate
    const currentMate = this.getCurrentMate(userId);

    // Если VibeMate уже выбран, ничего не делаем
    if (currentMate) return;

    // Ищем подходящего VibeMate
    const result = await this.findBestMate(userId, text, runtime);

    // Если найден специалист с высокой уверенностью
    if (result.mate && result.confidence >= 40) {
      logger.info(`[TopicRouterService] 🎯 Auto-routed user ${userId} to ${result.mateId} (${result.confidence}%)`);

      // Отправляем рекомендацию
      const recommendationText = `${result.mateId === 'agents' ? '🤖' :
                                   result.mateId === 'prompts' ? '🎨' :
                                   result.mateId === 'react' ? '⚛️' : '🎵'}

Я определил, что тебе нужен специалист по этой теме!

**${this.getMateDisplayInfo(result.mateId).name}** готов помочь тебе с вопросом!

Хочешь переключиться на него?
Используй команду: \`/mate ${result.mateId}\`

Или продолжи общение - я сам подключу нужного специалиста! 🚀`;

      try {
        await runtime.messageManager.create({
          userId,
          content: { text: recommendationText },
          roomId: `direct-${userId}`,
        });
      } catch (error) {
        logger.error('[TopicRouterService] ❌ Error sending recommendation:', error);
      }
    }
  }

  static async start(runtime: IAgentRuntime): Promise<TopicRouterService> {
    const service = new TopicRouterService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TopicRouterService] Stopping...');
    this.userTopics.clear();
  }
}

export const topicRouterPlugin: Plugin = {
  name: 'topic-router',
  description: 'Automatically routes users to the right VibeMate specialist',
  services: [TopicRouterService],
};

logger.info('🧭 [TOPIC ROUTER PLUGIN] Plugin exported');

export default topicRouterPlugin;
export { TopicRouterService };
