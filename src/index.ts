import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import starterPlugin from './plugin.ts';
import telegramUIPlugin from './telegram-ui-plugin.ts';
import telegramCommandsPlugin from './telegram-commands-plugin.ts';
import telegramDebugPlugin from './telegram-debug-plugin.ts';
import telegramStartPlugin from './telegram-start-plugin.ts';
import telegramServiceStarter from './telegram-service-starter.ts';
import { initializeInfisical } from './infisical.ts';

// 🔐 КРИТИЧНО: Загружаем секреты из Infisical ДО импорта character
await initializeInfisical();

// Динамический импорт character ПОСЛЕ загрузки секретов (избегаем hoisting)
const { character } = await import('./character.js');

const initCharacter = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing character');
  logger.info({ name: character.name }, 'Name:');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [
    telegramServiceStarter, // 🔧 Ensures TelegramService is running (must be first!)
    telegramStartPlugin, // 🚀 /start command handler (uses events)
    telegramDebugPlugin,
    telegramCommandsPlugin,
    telegramUIPlugin,
    starterPlugin,
  ],
};

const project: Project = {
  agents: [projectAgent],
};

// Re-export character (уже импортирован динамически выше)
export { character };

export default project;
