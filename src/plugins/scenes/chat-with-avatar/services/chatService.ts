/**
 * Chat with Avatar Service
 * Handles avatar conversations
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class ChatService {
  async sendMessage(
    runtime: IAgentRuntime,
    avatarId: string,
    message: string,
    conversation: ChatMessage[],
    settings: ChatSettings
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      logger.info(`💬 Chat with avatar: ${avatarId}`);

      const openaiKey = runtime.getSetting('OPENROUTER_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      // Build prompt from settings and conversation
      const systemPrompt = this.buildSystemPrompt(avatarId, settings);

      // Convert conversation to OpenAI format
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

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
          messages,
          temperature: settings.temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const assistantMessage = result.choices?.[0]?.message?.content || '';

      logger.info('✅ Chat response generated');
      return {
        success: true,
        response: assistantMessage,
      };
    } catch (error) {
      logger.error('❌ Chat error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildSystemPrompt(avatarId: string, settings: ChatSettings): string {
    const modeDescription = {
      friendly: 'Отвечай дружелюбно и непринужденно. Используй смайлики и эмодзи.',
      professional: 'Отвечай профессионально и по делу. Избегай жаргона.',
      creative: 'Отвечай креативно и нестандартно. Предлагай необычные идеи.',
      educational: 'Отвечай как учитель - объясняй понятно и подробно.',
      entertainment: 'Отвечай весело и с юмором. Играй в игры и развлекай.',
    };

    return `Ты - ${settings.avatarName}, AI-аватар с ID ${avatarId}.

ЛИЧНОСТЬ: ${settings.personality}

РЕЖИМ ОБЩЕНИЯ: ${modeDescription[settings.mode as keyof typeof modeDescription] || modeDescription.friendly}

ПРАВИЛА:
- Отвечай на русском языке
- Будь естественным в общении
- Поддерживай контекст разговора
- Отвечай на вопросы в рамках своей личности
- Максимум 200 слов в ответе`;
  }

  async loadBrainConfig(
    runtime: IAgentRuntime,
    avatarId: string
  ): Promise<{ success: boolean; config?: string; error?: string }> {
    try {
      logger.info(`🧠 Loading brain config for: ${avatarId}`);

      // Get brain config from memory
      const memories = await runtime.getMemories({
        where: [
          { type: 'brain_config' },
          { avatarId },
        ],
        limit: 1,
      });

      if (memories.length > 0) {
        return {
          success: true,
          config: memories[0].content?.text || '',
        };
      }

      // Generate default config if not found
      const defaultConfig = {
        name: avatarId,
        personality: 'Дружелюбный AI-помощник',
        speaking_style: 'casual',
      };

      return {
        success: true,
        config: JSON.stringify(defaultConfig, null, 2),
      };
    } catch (error) {
      logger.error('❌ Brain config loading failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Import types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSettings {
  avatarName: string;
  personality: string;
  mode: string;
  temperature: number;
}
