/**
 * NeuroPhoto Scene Types
 * AI image generation with detailed prompts
 */

export interface NeuroPhotoContext {
  step: string;
  model: string;
  prompt: string;
  imageUrl?: string;
  settings: {
    style?: string;
    quality?: string;
    size?: string;
  };
}

export interface NeuroPhotoModel {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const AVAILABLE_MODELS: NeuroPhotoModel[] = [
  {
    id: 'seedream-4',
    name: 'SeedDream 4',
    description: 'Реалистичные изображения высокого качества',
    emoji: '🎨',
  },
  {
    id: 'flux-multi',
    name: 'Flux Multi-Kontext',
    description: 'Быстрая генерация с поддержкой стилей',
    emoji: '⚡',
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    description: 'Легковесная модель для простых задач',
    emoji: '🍌',
  },
];

export const IMAGE_STYLES = [
  { id: 'photorealistic', name: 'Фотореализм', emoji: '📸' },
  { id: 'anime', name: 'Аниме', emoji: '🎭' },
  { id: 'digital-art', name: 'Цифровое искусство', emoji: '🖌️' },
  { id: 'watercolor', name: 'Акварель', emoji: '🎨' },
  { id: 'oil-painting', name: 'Масляная живопись', emoji: '🖼️' },
];

export const IMAGE_SIZES = [
  { id: '512x512', name: '512x512 (Квадрат)', emoji: '⬜' },
  { id: '768x768', name: '768x768 (Большой)', emoji: '🟫' },
  { id: '1024x1024', name: '1024x1024 (XL)', emoji: '🟪' },
];
