/**
 * Digital Avatar Scene Types
 * Create digital avatar from photos
 */

export interface DigitalAvatarContext {
  step: string;
  photos: string[]; // Array of photo URLs
  avatarSettings: {
    gender?: string;
    age?: string;
    style?: string;
    background?: string;
  };
  createdAvatar?: string;
}

export interface AvatarStyle {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const GENDER_OPTIONS = [
  { id: 'male', name: 'Мужской', emoji: '👨' },
  { id: 'female', name: 'Женский', emoji: '👩' },
  { id: 'non-binary', name: 'Не указывать', emoji: '🧑' },
];

export const AGE_RANGES = [
  { id: '18-25', name: '18-25 лет', emoji: '🧑‍🎓' },
  { id: '26-35', name: '26-35 лет', emoji: '👨‍💼' },
  { id: '36-45', name: '36-45 лет', emoji: '👩‍🔬' },
  { id: '46-60', name: '46-60 лет', emoji: '👨‍💻' },
];

export const AVATAR_STYLES: AvatarStyle[] = [
  {
    id: 'realistic',
    name: 'Реалистичный',
    description: 'Фотореалистичный цифровой двойник',
    emoji: '🎭',
  },
  {
    id: 'anime',
    name: 'Аниме',
    description: 'Стиль аниме/мультфильма',
    emoji: '🎌',
  },
  {
    id: 'cartoon',
    name: 'Карикатура',
    description: 'Мультяшный стиль',
    emoji: '🖍️',
  },
  {
    id: 'cyberpunk',
    name: 'Киберпанк',
    description: 'Научно-фантастический стиль',
    emoji: '🤖',
  },
  {
    id: 'fantasy',
    name: 'Фэнтези',
    description: 'Волшебный/мистический стиль',
    emoji: '🧙',
  },
];

export const BACKGROUND_OPTIONS = [
  { id: 'transparent', name: 'Прозрачный', emoji: '⬜' },
  { id: 'white', name: 'Белый', emoji: '⚪' },
  { id: 'gradient', name: 'Градиент', emoji: '🌈' },
  { id: 'studio', name: 'Студийный', emoji: '📸' },
  { id: 'nature', name: 'Природа', emoji: '🌿' },
  { id: 'cyber', name: 'Кибер', emoji: '⚡' },
];
