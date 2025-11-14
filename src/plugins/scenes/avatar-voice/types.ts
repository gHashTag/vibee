/**
 * Avatar Voice Scene Types
 * Configure voice for avatars
 */

export interface AvatarVoiceContext {
  step: string;
  avatarId: string;
  voiceSettings: {
    voiceId: string;
    language: string;
    speed: number;
    pitch: number;
    emotion: string;
  };
  audioFile?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  language: string;
  emoji: string;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    gender: 'Нейтральный',
    language: 'ru',
    emoji: '🎭',
    description: 'Нейтральный мужской голос',
  },
  {
    id: 'echo',
    name: 'Echo',
    gender: 'Мужской',
    language: 'ru',
    emoji: '🎤',
    description: 'Глубокий мужской голос',
  },
  {
    id: 'fable',
    name: 'Fable',
    gender: 'Мужской',
    language: 'en',
    emoji: '🗣️',
    description: 'Британский акцент',
  },
  {
    id: 'onyx',
    name: 'Onyx',
    gender: 'Мужской',
    language: 'ru',
    emoji: '🔊',
    description: 'Громкий и четкий',
  },
  {
    id: 'nova',
    name: 'Nova',
    gender: 'Женский',
    language: 'ru',
    emoji: '🎀',
    description: 'Мягкий женский голос',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'Женский',
    language: 'ru',
    emoji: '✨',
    description: 'Звонкий женский голос',
  },
];

export const LANGUAGES = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
];

export const EMOTIONS = [
  { id: 'neutral', name: 'Нейтральный', emoji: '😐' },
  { id: 'happy', name: 'Радостный', emoji: '😊' },
  { id: 'sad', name: 'Грустный', emoji: '😢' },
  { id: 'excited', name: 'Возбужденный', emoji: '🤩' },
  { id: 'calm', name: 'Спокойный', emoji: '😌' },
  { id: 'angry', name: 'Сердитый', emoji: '😠' },
];
