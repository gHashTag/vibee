/**
 * Tutor Switcher Plugin
 * Плагин для переключения между учителями курсов
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';
import { tutorsSystem } from './tutors-system';

logger.info('👨‍🏫 [TUTOR SWITCHER PLUGIN] Module loaded - exporting plugin');

interface TutorSwitch {
  userId: string;
  tutor: string;
  timestamp: number;
}

class TutorSwitcherService extends Service {
  static serviceType = 'tutor-switcher';
  public capabilityDescription = 'Manages switching between different course tutors';

  private userTutors: Map<string, string> = new Map();

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TutorSwitcherService] 🔄 Initializing Tutor Switcher...');
  }

  /**
   * Переключить учителя для пользователя
   */
  switchTutor(userId: string, tutorType: 'main' | 'agentic' | 'music'): {
    success: boolean;
    message: string;
    tutorName?: string;
  } {
    try {
      const tutor = tutorsSystem.switchTutor(tutorType);
      this.userTutors.set(userId, tutorType);

      logger.info(`[TutorSwitcherService] 👤 User ${userId} switched to tutor: ${tutorType}`);

      return {
        success: true,
        message: `✅ Переключен на учителя: ${tutor.name}`,
        tutorName: tutor.name,
      };
    } catch (error) {
      logger.error('[TutorSwitcherService] ❌ Error switching tutor:', error);
      return {
        success: false,
        message: '❌ Ошибка при переключении учителя',
      };
    }
  }

  /**
   * Получить текущего учителя пользователя
   */
  getCurrentTutor(userId: string): string | null {
    return this.userTutors.get(userId) || null;
  }

  /**
   * Рекомендовать учителя на основе сообщения пользователя
   */
  async recommendTutor(userId: string, userMessage: string): Promise<{
    recommended: string;
    confidence: number;
  }> {
    const tutor = tutorsSystem.recommendTutor(userMessage);
    const tutorType = this.getTutorType(tutor.name);

    // Устанавливаем рекомендованного учителя
    if (tutorType) {
      this.userTutors.set(userId, tutorType);
    }

    return {
      recommended: tutor.name,
      confidence: this.calculateConfidence(userMessage, tutorType),
    };
  }

  /**
   * Получить описание учителя
   */
  getTutorDescription(tutorType: 'main' | 'agentic' | 'music'): {
    name: string;
    description: string;
    specialties: string[];
    emoji: string;
  } {
    switch (tutorType) {
      case 'agentic':
        return {
          name: 'AgenticVibeCodingTutor',
          description: 'Специалист по созданию AI-агентов и современной разработке',
          specialties: ['AI-агенты', 'TypeScript', 'React', 'ElizaOS', 'Мультиагентные системы'],
          emoji: '🤖',
        };
      case 'music':
        return {
          name: 'AIMusicProductionTutor',
          description: 'Эксперт по созданию музыки с помощью ИИ',
          specialties: ['AI-музыка', 'Suno', 'Обложки', 'Продвижение', 'Дистрибуция'],
          emoji: '🎵',
        };
      default:
        return {
          name: 'Vibee',
          description: 'Главный наставник Академии',
          specialties: ['Рекомендации курсов', 'Общие вопросы', 'Помощь в выборе'],
          emoji: '👨‍🏫',
        };
    }
  }

  /**
   * Показать список доступных учителей
   */
  listTutors(): Array<{
    type: 'main' | 'agentic' | 'music';
    name: string;
    description: string;
    emoji: string;
    command: string;
  }> {
    return [
      {
        type: 'main',
        name: 'Vibee',
        description: 'Главный наставник - поможет выбрать курс',
        emoji: '👨‍🏫',
        command: '/tutor main',
      },
      {
        type: 'agentic',
        name: 'AgenticVibeCodingTutor',
        description: 'Специалист по AI-агентам и разработке',
        emoji: '🤖',
        command: '/tutor agentic',
      },
      {
        type: 'music',
        name: 'AIMusicProductionTutor',
        description: 'Эксперт по AI-музыке и продвижению',
        emoji: '🎵',
        command: '/tutor music',
      },
    ];
  }

  /**
   * Получить тип учителя по имени
   */
  private getTutorType(tutorName: string): 'main' | 'agentic' | 'music' | null {
    if (tutorName === 'AgenticVibeCodingTutor') return 'agentic';
    if (tutorName === 'AIMusicProductionTutor') return 'music';
    if (tutorName === 'Vibee') return 'main';
    return null;
  }

  /**
   * Вычислить уверенность рекомендации
   */
  private calculateConfidence(message: string, tutorType: string | null): number {
    if (!tutorType) return 0;

    const msg = message.toLowerCase();

    const agenticKeywords = [
      'agent', 'аген', 'ai', 'ии', 'разработк', 'код', 'программирован',
      'typescript', 'react', 'eliza', 'bot', 'бот', 'automation', 'автоматизац'
    ];

    const musicKeywords = [
      'музык', 'music', 'трек', 'композ', 'sound', 'suno', 'spotify',
      'artist', 'артист', 'soundcloud', 'продюсер', 'producer', 'beat'
    ];

    let confidence = 0.5; // Базовая уверенность

    if (tutorType === 'agentic') {
      const matches = agenticKeywords.filter(kw => msg.includes(kw)).length;
      confidence = Math.min(0.9, 0.5 + matches * 0.1);
    } else if (tutorType === 'music') {
      const matches = musicKeywords.filter(kw => msg.includes(kw)).length;
      confidence = Math.min(0.9, 0.5 + matches * 0.1);
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Получить статистику по учителям
   */
  getStats(): {
    totalUsers: number;
    tutorDistribution: Record<string, number>;
  } {
    const distribution: Record<string, number> = {
      main: 0,
      agentic: 0,
      music: 0,
    };

    this.userTutors.forEach(tutorType => {
      distribution[tutorType]++;
    });

    return {
      totalUsers: this.userTutors.size,
      tutorDistribution: distribution,
    };
  }

  static async start(runtime: IAgentRuntime): Promise<TutorSwitcherService> {
    const service = new TutorSwitcherService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TutorSwitcherService] Stopping...');
    this.userTutors.clear();
  }
}

export const tutorSwitcherPlugin: Plugin = {
  name: 'tutor-switcher',
  description: 'Manages switching between different course tutors',
  services: [TutorSwitcherService],
};

logger.info('👨‍🏫 [TUTOR SWITCHER PLUGIN] Plugin exported');

export default tutorSwitcherPlugin;
export { TutorSwitcherService };
