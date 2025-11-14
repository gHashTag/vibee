/**
 * Text to Speech Scene Types
 * Convert text to speech audio
 */

export interface TTSContext {
  step: string;
  text: string;
  settings: {
    voice: string;
    speed: number;
    format: string;
  };
  audioUrl?: string;
}

export interface TTSVoice {
  id: string;
  name: string;
  provider: string;
  quality: string;
  languages: string[];
  emoji: string;
}

export const TTS_VOICES: TTSVoice[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    provider: 'OpenAI',
    quality: 'standard',
    languages: ['ru', 'en'],
    emoji: '🎭',
  },
  {
    id: 'echo',
    name: 'Echo',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['ru', 'en'],
    emoji: '🎤',
  },
  {
    id: 'fable',
    name: 'Fable',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['en', 'fr', 'es'],
    emoji: '🗣️',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    provider: 'OpenAI',
    quality: 'premium',
    languages: ['ru', 'en', 'de'],
    emoji: '🔊',
  },
  {
    id: 'nova',
    name: 'Nova',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['ru', 'en', 'es'],
    emoji: '🎀',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    provider: 'OpenAI',
    quality: 'high',
    languages: ['en', 'fr', 'de'],
    emoji: '✨',
  },
];

export const AUDIO_FORMATS = [
  { id: 'mp3', name: 'MP3', emoji: '🎵', description: 'Универсальный формат' },
  { id: 'opus', name: 'Opus', emoji: '📻', description: 'Высокое качество' },
  { id: 'aac', name: 'AAC', emoji: '🔊', description: 'Apple совместимость' },
  { id: 'flac', name: 'FLAC', emoji: '💎', description: 'Без потерь' },
];

export const SPEED_OPTIONS = [
  { id: '0.5', name: '0.5x (Медленно)', emoji: '🐌', value: 0.5 },
  { id: '0.75', name: '0.75x', emoji: '🚶', value: 0.75 },
  { id: '1.0', name: '1.0x (Нормально)', emoji: '👌', value: 1.0 },
  { id: '1.25', name: '1.25x', emoji: '🚶‍♂️', value: 1.25 },
  { id: '1.5', name: '1.5x (Быстро)', emoji: '🏃', value: 1.5 },
  { id: '2.0', name: '2.0x (Очень быстро)', emoji: '🚀', value: 2.0 },
];
