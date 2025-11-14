/**
 * AI Model Selection Service
 * Filters and recommends models
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import type { AIModel } from '../types';

export class ModelService {
  async getModel(
    runtime: IAgentRuntime,
    category: string,
    preferences: {
      speed: string;
      quality: string;
      cost: string;
    }
  ): Promise<{ success: boolean; models?: AIModel[]; error?: string }> {
    try {
      logger.info(`🎯 Finding models for category: ${category}`);

      // Filter models by category
      let filteredModels = AI_MODELS.filter((m) => m.category === category);

      // Apply speed preference
      if (preferences.speed === 'fast') {
        filteredModels = filteredModels.filter((m) => m.speed >= 8);
      } else if (preferences.speed === 'quality') {
        filteredModels = filteredModels.filter((m) => m.quality >= 9);
      }

      // Apply cost preference
      if (preferences.cost === 'budget') {
        filteredModels = filteredModels.filter((m) => m.cost >= 7);
      } else if (preferences.cost === 'premium') {
        filteredModels = filteredModels.filter((m) => m.cost <= 6);
      }

      logger.info(`✅ Found ${filteredModels.length} models`);
      return {
        success: true,
        models: filteredModels,
      };
    } catch (error) {
      logger.error('❌ Model selection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getModelDetails(
    runtime: IAgentRuntime,
    modelId: string
  ): Promise<{ success: boolean; model?: AIModel; error?: string }> {
    try {
      const model = AI_MODELS.find((m) => m.id === modelId);

      if (!model) {
        throw new Error('Model not found');
      }

      return {
        success: true,
        model,
      };
    } catch (error) {
      logger.error('❌ Model details failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async compareModels(
    runtime: IAgentRuntime,
    modelIds: string[]
  ): Promise<{ success: boolean; models?: AIModel[]; error?: string }> {
    try {
      const models = modelIds
        .map((id) => AI_MODELS.find((m) => m.id === id))
        .filter((m): m is AIModel => m !== undefined);

      logger.info(`✅ Comparing ${models.length} models`);
      return {
        success: true,
        models,
      };
    } catch (error) {
      logger.error('❌ Model comparison failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Import types
const AI_MODELS: AIModel[] = [
  // Image Models
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    category: 'image',
    provider: 'Fal AI',
    description: 'Лучший баланс качества и скорости',
    strengths: ['Фотореализм', 'Детализация', 'Быстрая генерация'],
    weaknesses: ['Высокая цена'],
    speed: 8,
    quality: 10,
    cost: 7,
    emoji: '⚡',
    pricing: '$0.05/изобр',
  },
  {
    id: 'seedream-4',
    name: 'SeedDream 4',
    category: 'image',
    provider: 'ByteDance',
    description: 'Реалистичные изображения высокого качества',
    strengths: ['Реализм', 'Портреты', 'Сцены'],
    weaknesses: ['Медленнее'],
    speed: 7,
    quality: 9,
    cost: 8,
    emoji: '🎨',
    pricing: '$0.03/изобр',
  },
  // Text Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    category: 'text',
    provider: 'OpenAI',
    description: 'Мультимодальная языковая модель',
    strengths: ['Логика', 'Код', 'Анализ'],
    weaknesses: ['Дорогая'],
    speed: 8,
    quality: 10,
    cost: 6,
    emoji: '🧠',
    pricing: '$0.005/1K токенов',
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    category: 'text',
    provider: 'Anthropic',
    description: 'Безопасная и полезная AI',
    strengths: ['Безопасность', 'Рассуждения', 'Создание'],
    weaknesses: ['Ограничения'],
    speed: 8,
    quality: 9,
    cost: 7,
    emoji: '🤖',
    pricing: '$0.003/1K токенов',
  },
];
