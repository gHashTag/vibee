/**
 * Экспорт всех Scene плагинов
 */

export { createLipSyncScene } from './lip-sync-scene';
export { createAiReelsScene } from './ai-reels-scene';
export { createSubscriptionScene } from './subscription-scene';
export { createStarPaymentScene } from './star-payment-scene';
export { createRublePaymentScene } from './ruble-payment-scene';
export { createInviteScene } from './invite-scene';
export { createHelpScene } from './help-scene';
export { createBalanceScene } from './balance-scene';

// Экспорт новых Media Scene плагинов
export { createImageToVideoScene as imageToVideoScene } from './image-to-video';
export { createTextToVideoScene as textToVideoScene } from './text-to-video';
export { createTextToImageScene as textToImageScene } from './text-to-image';
export { createAiPhotoshopScene as aiPhotoshopScene } from './ai-photoshop';
export { createMorphingScene as morphingScene } from './morphing';
export { createFaceSwapScene as faceSwapScene } from './face-swap';
export { createVideoTranscriptionScene as videoTranscriptionScene } from './video-transcription';
export { createUploadVideoScene as uploadVideoScene } from './upload-video';
export { createAiHeroesScene as aiHeroesScene } from './ai-heroes';
export { createImageEnhancementScene as imageEnhancementScene } from './image-enhancement';

// ========================================
// 9 AI Scene Plugins (Новые)
// ========================================

// 1. NeuroPhoto - AI Image Generation
export { neuroPhotoPlugin as neuroPhotoScene } from './neuro-photo';
export * from './neuro-photo';

// 2. Digital Avatar - Create avatars from photos
export { digitalAvatarPlugin as digitalAvatarScene } from './digital-avatar';
export * from './digital-avatar';

// 3. Image to Prompt - Analyze images and generate prompts
export { imageToPromptPlugin as imageToPromptScene } from './image-to-prompt';
export * from './image-to-prompt';

// 4. Avatar Brain - Create AI personality
export { avatarBrainPlugin as avatarBrainScene } from './avatar-brain';
export * from './avatar-brain';

// 5. Chat with Avatar - Interactive conversations
export { chatWithAvatarPlugin as chatWithAvatarScene } from './chat-with-avatar';
export * from './chat-with-avatar';

// 6. Select AI Model - Choose models for tasks
export { selectAIModelPlugin as selectAIModelScene } from './select-ai-model';
export * from './select-ai-model';

// 7. Avatar Voice - Configure voice for avatars
export { avatarVoicePlugin as avatarVoiceScene } from './avatar-voice';
export * from './avatar-voice';

// 8. Text to Speech - Convert text to audio
export { textToSpeechPlugin as textToSpeechScene } from './text-to-speech';
export * from './text-to-speech';

// 9. Image Upscaler - Enhance and upscale images
export { imageUpscalerPlugin as imageUpscalerScene } from './image-upscaler';
export * from './image-upscaler';

export type {
  SceneContext,
  ScenePlugin,
  PaymentPlan,
  InviteData,
  BalanceData
} from './types';

/**
 * Получить все Media Scene плагины (Старые)
 */
export function getAllMediaScenes(): any[] {
  return [
    imageToVideoScene(),
    textToVideoScene(),
    textToImageScene(),
    aiPhotoshopScene(),
    morphingScene(),
    faceSwapScene(),
    videoTranscriptionScene(),
    uploadVideoScene(),
    aiHeroesScene(),
    imageEnhancementScene(),
  ];
}

/**
 * Получить все AI Scene плагинов (Новые)
 */
export function getAllAIScenes(): any[] {
  return [
    neuroPhotoScene(),
    digitalAvatarScene(),
    imageToPromptScene(),
    avatarBrainScene(),
    chatWithAvatarScene(),
    selectAIModelScene(),
    avatarVoiceScene(),
    textToSpeechScene(),
    imageUpscalerScene(),
  ];
}

/**
 * Получить ВСЕ Scene плагины (Старые + Новые)
 */
export function getAllScenes(): any[] {
  return [...getAllMediaScenes(), ...getAllAIScenes()];
}

/**
 * Метаданные Media Scene плагинов
 */
export const mediaScenesMetadata = [
  {
    id: 'imageToVideo',
    name: 'Image to Video',
    emoji: '🎥',
    description: 'Преобразование фотографии в видео с эффектами движения',
    category: 'video',
    command: '/video-from-photo',
  },
  {
    id: 'textToVideo',
    name: 'Text to Video',
    emoji: '🎥',
    description: 'Генерация видео из текстового описания',
    category: 'video',
    command: '/video-from-text',
  },
  {
    id: 'textToImage',
    name: 'Text to Image',
    emoji: '🖼️',
    description: 'Генерация изображений из текстового описания',
    category: 'image',
    command: '/image-from-text',
  },
  {
    id: 'aiPhotoshop',
    name: 'AI Photoshop',
    emoji: '🎨',
    description: 'Профессиональная обработка изображений с ИИ',
    category: 'image',
    command: '/ai-photoshop',
  },
  {
    id: 'morphing',
    name: 'Morphing',
    emoji: '🌀',
    description: 'Бесконечные морфинги между изображениями',
    category: 'video',
    command: '/morphing',
  },
  {
    id: 'faceSwap',
    name: 'Face Swap',
    emoji: '🎭',
    description: 'Замена лица на изображении',
    category: 'image',
    command: '/face-swap',
  },
  {
    id: 'videoTranscription',
    name: 'Video Transcription',
    emoji: '📝',
    description: 'Транскрипция видео с распознаванием речи',
    category: 'audio',
    command: '/transcribe-video',
  },
  {
    id: 'uploadVideo',
    name: 'Upload Video',
    emoji: '📤',
    description: 'Загрузка и управление видеофайлами',
    category: 'video',
    command: '/upload-video',
  },
  {
    id: 'aiHeroes',
    name: 'AI Heroes',
    emoji: '🦸‍♂️',
    description: 'Создание супергероев с ИИ',
    category: 'image',
    command: '/ai-heroes',
  },
  {
    id: 'imageEnhancement',
    name: 'Image Enhancement',
    emoji: '✨',
    description: 'Улучшение качества изображений с ИИ',
    category: 'image',
    command: '/enhance-image',
  },
];

/**
 * Получить Media Scene по имени
 */
export function getMediaSceneByName(name: string): any | undefined {
  const sceneMap: Record<string, () => any> = {
    imageToVideo: imageToVideoScene,
    textToVideo: textToVideoScene,
    textToImage: textToImageScene,
    aiPhotoshop: aiPhotoshopScene,
    morphing: morphingScene,
    faceSwap: faceSwapScene,
    videoTranscription: videoTranscriptionScene,
    uploadVideo: uploadVideoScene,
    aiHeroes: aiHeroesScene,
    imageEnhancement: imageEnhancementScene,
  };

  const sceneFactory = sceneMap[name];
  return sceneFactory ? sceneFactory() : undefined;
}

/**
 * Количество Media Scene плагинов
 */
export const mediaSceneCount = mediaScenesMetadata.length;

/**
 * Все команды Media Scene плагинов
 */
export const mediaSceneCommands = mediaScenesMetadata.map(m => m.command);

/**
 * Метаданные AI Scene плагинов (Новые)
 */
export const aiScenesMetadata = [
  {
    id: 'neuroPhoto',
    name: 'NeuroPhoto',
    emoji: '📸',
    description: 'Генерация изображений с AI',
    category: 'image',
    command: '/neurophoto',
  },
  {
    id: 'digitalAvatar',
    name: 'Digital Avatar',
    emoji: '🤖',
    description: 'Создание цифрового аватара',
    category: 'avatar',
    command: '/avatar',
  },
  {
    id: 'imageToPrompt',
    name: 'Image to Prompt',
    emoji: '🔍',
    description: 'Анализ изображений и создание промптов',
    category: 'analysis',
    command: '/analyze',
  },
  {
    id: 'avatarBrain',
    name: 'Avatar Brain',
    emoji: '🧠',
    description: 'Создание "мозга" аватара',
    category: 'avatar',
    command: '/brain',
  },
  {
    id: 'chatWithAvatar',
    name: 'Chat with Avatar',
    emoji: '💬',
    description: 'Интерактивный чат с аватарами',
    category: 'chat',
    command: '/chat',
  },
  {
    id: 'selectAIModel',
    name: 'Select AI Model',
    emoji: '⚙️',
    description: 'Выбор AI моделей',
    category: 'tools',
    command: '/models',
  },
  {
    id: 'avatarVoice',
    name: 'Avatar Voice',
    emoji: '🎤',
    description: 'Настройка голоса для аватаров',
    category: 'voice',
    command: '/voice',
  },
  {
    id: 'textToSpeech',
    name: 'Text to Speech',
    emoji: '🎙️',
    description: 'Преобразование текста в речь',
    category: 'voice',
    command: '/tts',
  },
  {
    id: 'imageUpscaler',
    name: 'Image Upscaler',
    emoji: '⬆️',
    description: 'Улучшение и увеличение изображений',
    category: 'image',
    command: '/upscale',
  },
];

/**
 * Все AI Scene команды
 */
export const aiSceneCommands = aiScenesMetadata.map(m => m.command);

/**
 * Все команды Scene плагинов (Старые + Новые)
 */
export const allSceneCommands = [...mediaSceneCommands, ...aiSceneCommands];

/**
 * Количество AI Scene плагинов
 */
export const aiSceneCount = aiScenesMetadata.length;

/**
 * Общее количество Scene плагинов
 */
export const totalSceneCount = mediaSceneCount + aiSceneCount;
