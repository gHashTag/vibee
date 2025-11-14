/**
 * Avatar Brain Service
 * Creates AI personality configuration
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class AvatarBrainService {
  async createBrain(
    runtime: IAgentRuntime,
    avatarId: string,
    personality: {
      traits: string[];
      background: string;
      speakingStyle: string;
      expertise: string[];
    },
    knowledge: {
      interests: string[];
      specialties: string[];
      experiences: string[];
    }
  ): Promise<{ success: boolean; brainConfig?: string; error?: string }> {
    try {
      logger.info(`🧠 Creating brain for avatar: ${avatarId}`);

      const openaiKey = runtime.getSetting('OPENROUTER_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      const prompt = this.buildBrainPrompt(avatarId, personality, knowledge);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vibee.chat',
          'X-Title': 'Vibee AI Bot',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const brainConfig = result.choices?.[0]?.message?.content || '';

      logger.info('✅ Brain configuration created');
      return {
        success: true,
        brainConfig,
      };
    } catch (error) {
      logger.error('❌ Brain creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildBrainPrompt(
    avatarId: string,
    personality: any,
    knowledge: any
  ): string {
    const personalityDesc = PERSONALITY_TRAITS
      .filter((t) => personality.traits.includes(t.id))
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    const speakingStyle = SPEAKING_STYLES.find((s) => s.id === personality.speakingStyle)?.name;
    const expertise = EXPERTISE_AREAS
      .filter((e) => personality.expertise.includes(e.id))
      .map((e) => e.name)
      .join(', ');

    const interests = INTERESTS
      .filter((i) => knowledge.interests.includes(i.id))
      .map((i) => i.name)
      .join(', ');

    return `Создайте детальную конфигурацию "мозга" AI-аватара на основе предоставленных данных.

АВАТАР ID: ${avatarId}

ЛИЧНОСТЬ:
Черты характера:
${personalityDesc}

Фон: ${personality.background}

Стиль общения: ${speakingStyle}

Экспертиза: ${expertise}

ЗНАНИЯ:
Интересы: ${interests}

Создайте JSON-конфигурацию со следующими полями:
1. "name" - имя аватара
2. "personality" - детальное описание личности
3. "speaking_style" - особенности речи
4. "knowledge_base" - область знаний
5. "behavior_patterns" - паттерны поведения
6. "response_guidelines" - рекомендации для ответов
7. "conversation_starters" - 5 фраз для начала разговора

Верните только валидный JSON без дополнительного текста.`;
  }
}

// Import missing constants
const PERSONALITY_TRAITS = [
  { id: 'friendly', name: 'Дружелюбный', description: 'Всегда приветливый и позитивный', emoji: '😊' },
  { id: 'professional', name: 'Профессиональный', description: 'Серьезный и компетентный', emoji: '💼' },
  { id: 'creative', name: 'Креативный', description: 'Находчивый и изобретательный', emoji: '🎨' },
  { id: 'analytic', name: 'Аналитический', description: 'Логичный и методичный', emoji: '🧮' },
  { id: 'humorous', name: 'Юмористический', description: 'Любит шутить и веселиться', emoji: '😄' },
  { id: 'wise', name: 'Мудрый', description: 'Опытный и рассудительный', emoji: '🧙' },
  { id: 'energetic', name: 'Энергичный', description: 'Бодрый и активный', emoji: '⚡' },
  { id: 'calm', name: 'Спокойный', description: 'Умиротворенный и терпеливый', emoji: '🧘' },
];

const SPEAKING_STYLES = [
  { id: 'casual', name: 'Неформальный', emoji: '💬' },
  { id: 'formal', name: 'Формальный', emoji: '📜' },
  { id: 'enthusiastic', name: 'Энтузиастичный', emoji: '🎯' },
  { id: 'technical', name: 'Технический', emoji: '⚙️' },
  { id: 'poetic', name: 'Поэтичный', emoji: '📖' },
];

const EXPERTISE_AREAS = [
  { id: 'tech', name: 'Технологии', emoji: '💻' },
  { id: 'art', name: 'Искусство', emoji: '🎭' },
  { id: 'science', name: 'Наука', emoji: '🔬' },
  { id: 'business', name: 'Бизнес', emoji: '💰' },
  { id: 'education', name: 'Образование', emoji: '🎓' },
  { id: 'entertainment', name: 'Развлечения', emoji: '🎪' },
  { id: 'health', name: 'Здоровье', emoji: '🏥' },
  { id: 'sports', name: 'Спорт', emoji: '⚽' },
];

const INTERESTS = [
  { id: 'ai', name: 'Искусственный интеллект', emoji: '🤖' },
  { id: 'design', name: 'Дизайн', emoji: '🎨' },
  { id: 'music', name: 'Музыка', emoji: '🎵' },
  { id: 'gaming', name: 'Игры', emoji: '🎮' },
  { id: 'travel', name: 'Путешествия', emoji: '✈️' },
  { id: 'cooking', name: 'Кулинария', emoji: '👨‍🍳' },
  { id: 'fitness', name: 'Фитнес', emoji: '💪' },
  { id: 'books', name: 'Книги', emoji: '📚' },
];
