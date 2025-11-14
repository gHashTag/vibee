/**
 * Image to Prompt Scene Types
 * Analyze images to generate detailed prompts
 */

export interface ImagePromptContext {
  step: string;
  imageUrl?: string;
  analysis: {
    description: string;
    style: string;
    composition: string;
    colors: string[];
    mood: string;
  };
  generatedPrompt?: string;
}

export interface AnalysisType {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const ANALYSIS_TYPES: AnalysisType[] = [
  {
    id: 'basic',
    name: 'Базовый анализ',
    description: 'Простое описание изображения',
    emoji: '📝',
  },
  {
    id: 'detailed',
    name: 'Детальный анализ',
    description: 'Подробное описание всех элементов',
    emoji: '🔍',
  },
  {
    id: 'artistic',
    name: 'Художественный стиль',
    description: 'Анализ стиля и техники',
    emoji: '🎨',
  },
  {
    id: 'photography',
    name: 'Фотография',
    description: 'Технические аспекты фото',
    emoji: '📸',
  },
];

export const PROMPT_STYLES = [
  { id: 'simple', name: 'Простой', emoji: '💬' },
  { id: 'detailed', name: 'Детальный', emoji: '📚' },
  { id: 'cinematic', name: 'Кинематографический', emoji: '🎬' },
  { id: 'fantasy', name: 'Фэнтези', emoji: '✨' },
  { id: 'realistic', name: 'Реалистичный', emoji: '📷' },
];

export const COLOR_PALETTES = [
  { id: 'vibrant', name: 'Яркие', emoji: '🌈' },
  { id: 'muted', name: 'Приглушенные', emoji: '🎨' },
  { id: 'monochrome', name: 'Монохромные', emoji: '⚫' },
  { id: 'warm', name: 'Теплые', emoji: '🔥' },
  { id: 'cool', name: 'Холодные', emoji: '❄️' },
];
