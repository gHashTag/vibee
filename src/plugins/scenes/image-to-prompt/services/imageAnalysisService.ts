/**
 * Image Analysis Service
 * Analyzes images and generates prompts
 */

import { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

export class ImageAnalysisService {
  async analyzeImage(
    runtime: IAgentRuntime,
    imageUrl: string,
    analysisType: string
  ): Promise<{
    success: boolean;
    description?: string;
    style?: string;
    composition?: string;
    colors?: string[];
    mood?: string;
    error?: string;
  }> {
    try {
      logger.info(`🔍 Analyzing image with type: ${analysisType}`);

      // Get OpenAI API key
      const openaiKey = runtime.getSetting('OPENROUTER_API_KEY');
      if (!openaiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      // Create prompt for analysis
      const analysisPrompt = this.getAnalysisPrompt(analysisType);

      // Use OpenAI Vision API
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
              content: [
                {
                  type: 'text',
                  text: analysisPrompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysisText = result.choices?.[0]?.message?.content || '';

      logger.info('✅ Image analysis completed');
      return {
        success: true,
        description: analysisText,
      };
    } catch (error) {
      logger.error('❌ Image analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getAnalysisPrompt(analysisType: string): string {
    const prompts = {
      basic: 'Опишите это изображение кратко и понятно.',
      detailed: 'Проанализируйте изображение детально: опишите все объекты, людей, предметы, фон, освещение.',
      artistic: 'Проанализируйте художественный стиль: техника, стиль художника, композиция, цветовая гамма.',
      photography: 'Проанализируйте как фотограф: композиция, ракурс, глубина резкости, освещение, настроение.',
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.basic;
  }

  async generatePrompt(
    analysis: string,
    style: string,
    colorPalette: string
  ): Promise<{ success: boolean; prompt?: string; error?: string }> {
    try {
      logger.info('📝 Generating prompt from analysis');

      const styleGuidance = {
        simple: 'Создайте простой, понятный промпт.',
        detailed: 'Создайте детальный промпт с описанием всех элементов.',
        cinematic: 'Создайте кинематографический промпт с драматическим описанием.',
        fantasy: 'Создайте промпт в стиле фэнтези с магическими элементами.',
        realistic: 'Создайте реалистичный промпт без преувеличений.',
      };

      const colorGuidance = {
        vibrant: 'Используйте яркие, насыщенные цвета.',
        muted: 'Используйте приглушенные, мягкие цвета.',
        monochrome: 'Используйте черно-белые или монохромные цвета.',
        warm: 'Используйте теплые оттенки (оранжевый, красный, желтый).',
        cool: 'Используйте холодные оттенки (синий, зеленый, фиолетовый).',
      };

      const prompt = `На основе анализа изображения создайте промпт для AI-генерации:\n\n` +
                     `АНАЛИЗ:\n${analysis}\n\n` +
                     `СТИЛЬ: ${styleGuidance[style as keyof typeof styleGuidance] || styleGuidance.simple}\n` +
                     `ЦВЕТА: ${colorGuidance[colorPalette as keyof typeof colorGuidance] || colorGuidance.vibrant}\n\n` +
                     `Промпт:`;

      logger.info('✅ Prompt generated successfully');
      return {
        success: true,
        prompt,
      };
    } catch (error) {
      logger.error('❌ Prompt generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
