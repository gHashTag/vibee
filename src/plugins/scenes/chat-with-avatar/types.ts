/**
 * Chat with Avatar Scene Types
 * Interactive chat interface with AI avatars
 */

export interface ChatContext {
  step: string;
  avatarId: string;
  brainConfig?: string;
  conversation: {
    messages: ChatMessage[];
    settings: ChatSettings;
  };
  active: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSettings {
  avatarName: string;
  personality: string;
  mode: string;
  temperature: number;
}

export interface ChatMode {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const CHAT_MODES: ChatMode[] = [
  {
    id: 'friendly',
    name: 'Дружеский',
    description: 'Непринужденная беседа',
    emoji: '💬',
  },
  {
    id: 'professional',
    name: 'Деловой',
    description: 'Серьезный разговор',
    emoji: '💼',
  },
  {
    id: 'creative',
    name: 'Креативный',
    description: 'Мозговой штурм и идеи',
    emoji: '🎨',
  },
  {
    id: 'educational',
    name: 'Обучение',
    description: 'Объяснение и советы',
    emoji: '🎓',
  },
  {
    id: 'entertainment',
    name: 'Развлечения',
    description: 'Игры и веселье',
    emoji: '🎮',
  },
];

export const TEMPERATURE_OPTIONS = [
  { id: '0.3', name: 'Точный', emoji: '🎯', value: 0.3 },
  { id: '0.5', name: 'Сбалансированный', emoji: '⚖️', value: 0.5 },
  { id: '0.7', name: 'Креативный', emoji: '🌟', value: 0.7 },
  { id: '0.9', name: 'Хаотичный', emoji: '🌪️', value: 0.9 },
];

export const QUICK_QUESTIONS = [
  'Как дела?',
  'Расскажи о себе',
  'Что ты умеешь?',
  'Дай совет',
  'Пошути',
  'Объясни сложное',
];
