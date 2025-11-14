/**
 * Select AI Model Scene Types
 * Choose AI models for different tasks
 */

export interface AIModelContext {
  step: string;
  category: string;
  selectedModel?: AIModel;
  preferences: {
    speed: string;
    quality: string;
    cost: string;
  };
  comparison?: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  category: string;
  provider: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  speed: number;
  quality: number;
  cost: number;
  emoji: string;
  pricing: string;
}

export const MODEL_CATEGORIES = [
  { id: 'image', name: 'Изображения', emoji: '🎨', description: 'Генерация и редактирование' },
  { id: 'text', name: 'Текст', emoji: '📝', description: 'Генерация и анализ текста' },
  { id: 'voice', name: 'Голос', emoji: '🎤', description: 'Синтез речи' },
  { id: 'video', name: 'Видео', emoji: '🎬', description: 'Создание видео' },
  { id: 'multimodal', name: 'Мультимодальные', emoji: '🧠', description: 'Понимание изображений и текста' },
];

export const AI_MODELS: AIModel[] = [
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

export const SPEED_PRESETS = [
  { id: 'fast', name: 'Быстро', emoji: '⚡', value: 'fast' },
  { id: 'balanced', name: 'Сбалансированно', emoji: '⚖️', value: 'balanced' },
  { id: 'quality', name: 'Качество', emoji: '✨', value: 'quality' },
];

export const QUALITY_LEVELS = [
  { id: 'standard', name: 'Стандарт', emoji: '📊', value: 'standard' },
  { id: 'high', name: 'Высокое', emoji: '⭐', value: 'high' },
  { id: 'premium', name: 'Премиум', emoji: '💎', value: 'premium' },
];
