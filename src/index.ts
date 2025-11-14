import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import starterPlugin from './plugin.ts';
import telegramUIPlugin from './telegram-ui-plugin.ts';
import telegramCommandsPlugin from './telegram-commands-plugin.ts';
import telegramDebugPlugin from './telegram-debug-plugin.ts';
import telegramStartPlugin from './telegram-start-plugin.ts';
import telegramTypingPlugin from './telegram-typing-plugin.ts';
import conversationLearningPlugin from './conversation-learning-plugin.ts';
import rssMonitorPlugin from './sales/rss-monitor-plugin.ts';
import salesAutomationPlugin from './sales/sales-automation-plugin.ts';
import contentCreationPlugin from './content-creation-pipeline.ts';
import contentCallbackHandlerPlugin from './content-callback-handler.ts';
import { initializeInfisical } from './infisical.ts';
import { aiPhotoshopPlugin } from './ai-photoshop/index.ts';
import { trainingPlugin } from './training-plugin.ts';
import { telegramKeyboardsPlugin } from './telegram-keyboards/plugin.ts';
import { selftestPlugin } from './selftest/index.ts';
import templatePlugin from './template/template-plugin.ts';
import { vectorDbPlugin } from './academy/vector-db-plugin.ts';
import { aiTutorPlugin } from './academy/ai-tutor-plugin.ts';
import { vibematesCommandsPlugin, VibeMatesCommandsService } from './academy/vibemates/vibemates-commands-plugin.ts';
import { topicRouterPlugin, TopicRouterService } from './academy/vibemates/topic-router-plugin.ts';
import {
  agentsGuruCharacter,
  promptMasterCharacter,
  reactWizardCharacter,
  musicMageCharacter,
} from './vibemates-characters.ts';
import newsMonitorPlugin from './news-monitor-plugin.ts';
import agentAgentBridgePlugin from './agent-agent-bridge.ts';
// import avatarFacesPlugin from './faces/index.ts';  // ОТКЛЮЧЁН ДЛЯ ДИАГНОСТИКИ

// 🔐 КРИТИЧНО: Загружаем секреты из Infisical ДО импорта character
await initializeInfisical();

// Динамический импорт character ПОСЛЕ загрузки секретов (избегаем hoisting)
const { character } = await import('./character.js');

const initCharacter = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing character');
  logger.info({ name: character.name }, 'Name:');
};

const initAgentsGuru = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing AgentsGuru');
  logger.info({ name: agentsGuruCharacter.name }, 'Name:');
};

const initPromptMaster = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing PromptMaster');
  logger.info({ name: promptMasterCharacter.name }, 'Name:');
};

const initReactWizard = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing ReactWizard');
  logger.info({ name: reactWizardCharacter.name }, 'Name:');
};

const initMusicMage = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing MusicMage');
  logger.info({ name: musicMageCharacter.name }, 'Name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [
    telegramStartPlugin,          // 🚀 /start command handler (uses events)
    telegramTypingPlugin,         // ⌨️ Typing indicator + streaming
    conversationLearningPlugin,   // 📚 Auto-save conversations for training
    // rssMonitorPlugin,             // 📡 RSS мониторинг AI/vibe-coding новостей (ОТКЛЮЧЁН - зацикливается!)
    salesAutomationPlugin,        // 💼 Автоматизация продаж и лид-генерация
    contentCreationPlugin,        // 🎬 Создание Reels: текст → аудио → изображение → видео
    contentCallbackHandlerPlugin, // 🎛️ Обработчик кнопок для workflow создания контента
    telegramDebugPlugin,
    telegramCommandsPlugin,
    telegramUIPlugin,
    starterPlugin,
    telegramKeyboardsPlugin,      // ⌨️ Telegram кнопки и клавиатуры
    trainingPlugin,               // 🎨 LoRA training через Telegram фото
    aiPhotoshopPlugin,            // 🖼️ AI-обработка изображений (7 моделей)
    selftestPlugin,               // 🌈 РАДУЖНЫЙ МОСТ - Автоматическое самотестирование
    templatePlugin,               // 📝 Пользовательские шаблоны подсказок
    vectorDbPlugin,               // 🧠 Векторная БД для академии (семантический поиск)
    aiTutorPlugin,                // 🎓 AI-преподаватель (ответы на вопросы по курсам)
    topicRouterPlugin,            // 🧭 Роутер для VibeMates (автоподбор специалистов)
    vibematesCommandsPlugin,      // 🎓 VibeMates команды (/mate)
    newsMonitorPlugin,            // 📰 Умный мониторинг новостей (каждый час в личку)
    agentAgentBridgePlugin,       // 🌈 РАДУЖНЫЙ МОСТ - Агент-Агент автономная связь
    // avatarFacesPlugin,            // 👤 Управление лицами через LoRA (ОТКЛЮЧЁН)
  ],
};

// VibeMates - отдельные агенты-специалисты
export const agentsGuruAgent: ProjectAgent = {
  character: agentsGuruCharacter,
  init: async (runtime: IAgentRuntime) => await initAgentsGuru({ runtime }),
  plugins: [
    vectorDbPlugin,
    aiTutorPlugin,
  ],
};

export const promptMasterAgent: ProjectAgent = {
  character: promptMasterCharacter,
  init: async (runtime: IAgentRuntime) => await initPromptMaster({ runtime }),
  plugins: [
    vectorDbPlugin,
    aiTutorPlugin,
  ],
};

export const reactWizardAgent: ProjectAgent = {
  character: reactWizardCharacter,
  init: async (runtime: IAgentRuntime) => await initReactWizard({ runtime }),
  plugins: [
    vectorDbPlugin,
    aiTutorPlugin,
  ],
};

export const musicMageAgent: ProjectAgent = {
  character: musicMageCharacter,
  init: async (runtime: IAgentRuntime) => await initMusicMage({ runtime }),
  plugins: [
    vectorDbPlugin,
    aiTutorPlugin,
  ],
};

const project: Project = {
  agents: [
    projectAgent,
    // agentsGuruAgent,      // TEMPORARILY DISABLED - UUID errors blocking startup
    // promptMasterAgent,    // TEMPORARILY DISABLED
    // reactWizardAgent,     // TEMPORARILY DISABLED
    // musicMageAgent,       // TEMPORARILY DISABLED
  ],
};

// Re-export character (уже импортирован динамически выше)
export { character };

export default project;
