/**
 * Avatar Brain Scene Types
 * Create AI brain/personality for avatars
 */

export interface AvatarBrainContext {
  step: string;
  avatarId: string;
  personality: {
    traits: string[];
    background: string;
    speakingStyle: string;
    expertise: string[];
  };
  knowledge: {
    interests: string[];
    specialties: string[];
    experiences: string[];
  };
  brainConfig?: string;
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const PERSONALITY_TRAITS: PersonalityTrait[] = [
  {
    id: 'friendly',
    name: 'Дружелюбный',
    description: 'Всегда приветливый и позитивный',
    emoji: '😊',
  },
  {
    id: 'professional',
    name: 'Профессиональный',
    description: 'Серьезный и компетентный',
    emoji: '💼',
  },
  {
    id: 'creative',
    name: 'Креативный',
    description: 'Находчивый и изобретательный',
    emoji: '🎨',
  },
  {
    id: 'analytic',
    name: 'Аналитический',
    description: 'Логичный и методичный',
    emoji: '🧮',
  },
  {
    id: 'humorous',
    name: 'Юмористический',
    description: 'Любит шутить и веселиться',
    emoji: '😄',
  },
  {
    id: 'wise',
    name: 'Мудрый',
    description: 'Опытный и рассудительный',
    emoji: '🧙',
  },
  {
    id: 'energetic',
    name: 'Энергичный',
    description: 'Бодрый и активный',
    emoji: '⚡',
  },
  {
    id: 'calm',
    name: 'Спокойный',
    description: 'Умиротворенный и терпеливый',
    emoji: '🧘',
  },
];

export const SPEAKING_STYLES = [
  { id: 'casual', name: 'Неформальный', emoji: '💬' },
  { id: 'formal', name: 'Формальный', emoji: '📜' },
  { id: 'enthusiastic', name: 'Энтузиастичный', emoji: '🎯' },
  { id: 'technical', name: 'Технический', emoji: '⚙️' },
  { id: 'poetic', name: 'Поэтичный', emoji: '📖' },
];

export const EXPERTISE_AREAS = [
  { id: 'tech', name: 'Технологии', emoji: '💻' },
  { id: 'art', name: 'Искусство', emoji: '🎭' },
  { id: 'science', name: 'Наука', emoji: '🔬' },
  { id: 'business', name: 'Бизнес', emoji: '💰' },
  { id: 'education', name: 'Образование', emoji: '🎓' },
  { id: 'entertainment', name: 'Развлечения', emoji: '🎪' },
  { id: 'health', name: 'Здоровье', emoji: '🏥' },
  { id: 'sports', name: 'Спорт', emoji: '⚽' },
];

export const INTERESTS = [
  { id: 'ai', name: 'Искусственный интеллект', emoji: '🤖' },
  { id: 'design', name: 'Дизайн', emoji: '🎨' },
  { id: 'music', name: 'Музыка', emoji: '🎵' },
  { id: 'gaming', name: 'Игры', emoji: '🎮' },
  { id: 'travel', name: 'Путешествия', emoji: '✈️' },
  { id: 'cooking', name: 'Кулинария', emoji: '👨‍🍳' },
  { id: 'fitness', name: 'Фитнес', emoji: '💪' },
  { id: 'books', name: 'Книги', emoji: '📚' },
];
