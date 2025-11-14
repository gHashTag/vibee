/**
 * Image Upscaler Scene Types
 * Enhance and upscale images
 */

export interface UpscalerContext {
  step: string;
  imageUrl?: string;
  settings: {
    scale: number;
    enhancement: string;
    outputFormat: string;
  };
  result?: {
    originalSize: string;
    newSize: string;
    upscaledUrl: string;
  };
}

export interface UpscaleModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  emoji: string;
  maxScale: number;
}

export const UPSCALE_MODELS: UpscaleModel[] = [
  {
    id: 'real-esrgan',
    name: 'Real-ESRGAN',
    provider: 'Fal AI',
    description: 'Лучший для реальных фото',
    strengths: ['Фотореализм', 'Детали', 'Лица'],
    emoji: '📸',
    maxScale: 4,
  },
  {
    id: 'swin2sr',
    name: 'Swin2SR',
    provider: 'Replicate',
    description: 'Универсальный апскейлер',
    strengths: ['Универсальность', 'Скорость', 'Качество'],
    emoji: '⚡',
    maxScale: 4,
  },
  {
    id: 'esrgan',
    name: 'ESRGAN',
    provider: 'Replicate',
    description: 'Классический апскейлер',
    strengths: ['Проверенность', 'Совместимость'],
    emoji: '🎯',
    maxScale: 4,
  },
  {
    id: 'latent-upscaler',
    name: 'Latent Upscaler',
    provider: 'Fal AI',
    description: 'AI-латентное увеличение',
    strengths: ['AI улучшение', 'Стиль', 'Художественность'],
    emoji: '🎨',
    maxScale: 2,
  },
];

export const SCALE_OPTIONS = [
  { id: '2x', name: '2x увеличение', emoji: '⬆️', value: 2 },
  { id: '3x', name: '3x увеличение', emoji: '⬆️⬆️', value: 3 },
  { id: '4x', name: '4x увеличение', emoji: '⬆️⬆️⬆️', value: 4 },
  { id: '8x', name: '8x увеличение', emoji: '⬆️⬆️⬆️⬆️', value: 8 },
];

export const ENHANCEMENT_TYPES = [
  { id: 'none', name: 'Без улучшений', emoji: '🚫', description: 'Только увеличение' },
  { id: 'sharpen', name: 'Резкость', emoji: '🔍', description: 'Повышение четкости' },
  { id: 'denoise', name: 'Шумоподавление', emoji: '🧹', description: 'Удаление шумов' },
  { id: 'colorize', name: 'Цветокоррекция', emoji: '🎨', description: 'Улучшение цветов' },
  { id: 'hq', name: 'Высокое качество', emoji: '✨', description: 'Комплексное улучшение' },
];

export const OUTPUT_FORMATS = [
  { id: 'png', name: 'PNG', emoji: '🖼️', description: 'Без потерь, поддержка прозрачности' },
  { id: 'jpeg', name: 'JPEG', emoji: '📷', description: 'Сжатие, меньший размер' },
  { id: 'webp', name: 'WebP', emoji: '🌐', description: 'Оптимизация для веба' },
];
