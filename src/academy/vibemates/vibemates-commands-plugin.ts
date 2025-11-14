/**
 * VibeMates Commands Plugin
 * Команды для работы с VibeMates - специализированными учителями
 * /mate [agents|prompts|react|music|list|help]
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';
import { TopicRouterService } from './topic-router-plugin';
import { vibeMatesRegistry } from './vibemates-registry';

logger.info('💬 [VIBEMATES COMMANDS PLUGIN] Module loaded - exporting plugin');

class VibeMatesCommandsService extends Service {
  static serviceType = 'vibemates-commands';
  public capabilityDescription = 'Commands for managing VibeMate specialists';

  private topicRouter: TopicRouterService;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[VibeMatesCommandsService] 💬 Initializing VibeMates Commands...');

    this.topicRouter = runtime.getService('topic-router') as TopicRouterService;

    if (!this.topicRouter) {
      logger.warn('[VibeMatesCommandsService] ⚠️ TopicRouterService not found');
    }
  }

  /**
   * Обработчик команд /mate
   */
  async handleMateCommand(runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> {
    if (!this.topicRouter) {
      await this.sendMessage(runtime, message.userId, '❌ Сервис VibeMates недоступен');
      return true;
    }

    const text = message.content?.text?.toLowerCase().trim() || '';
    const userId = message.userId || 'unknown';

    // Парсим команду
    const parts = text.split(' ');
    const subcommand = parts[1]?.toLowerCase();

    try {
      switch (subcommand) {
        case 'agents':
          return this.switchToAgentsGuru(runtime, userId);

        case 'prompts':
        case 'prompt':
          return this.switchToPromptMaster(runtime, userId);

        case 'react':
        case 'frontend':
          return this.switchToReactWizard(runtime, userId);

        case 'music':
          return this.switchToMusicMage(runtime, userId);

        case 'docs':
        case 'documentation':
        case 'doc':
          return this.switchToDocuMaster(runtime, userId);

        case 'list':
        case 'all':
          return this.listAllMates(runtime, userId);

        case 'current':
        case 'who':
          return this.showCurrentMate(runtime, userId);

        case 'help':
          return this.showHelp(runtime, userId);

        case 'random':
        case 'r':
          return this.switchToRandomMate(runtime, userId);

        case 'stats':
          return this.showStats(runtime, userId);

        default:
          // Если команда без параметров - показать текущего VibeMate
          return this.showCurrentMate(runtime, userId);
      }
    } catch (error) {
      logger.error('[VibeMatesCommandsService] ❌ Error handling mate command:', error);
      await this.sendMessage(runtime, userId, '❌ Произошла ошибка. Попробуйте позже.');
      return true;
    }
  }

  /**
   * Переключиться на AgentsGuru
   */
  private async switchToAgentsGuru(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = await this.topicRouter.setMateForUser(userId, 'agents');

    if (result.success) {
      const mateInfo = this.getMateInfo('agents');
      const message = `${mateInfo.emoji} **${mateInfo.name}** подключен!

${result.message}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

**Темы для обсуждения:**
• Создание первого AI-агента
• Архитектура мультиагентных систем
• Паттерны координации агентов
• Инструменты: ElizaOS, LangChain, AutoGen

💬 *Просто задавай вопросы по AI-агентам!*`;

      await this.sendMessage(runtime, userId, message);
    } else {
      await this.sendMessage(runtime, userId, result.message);
    }

    return true;
  }

  /**
   * Переключиться на PromptMaster
   */
  private async switchToPromptMaster(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = await this.topicRouter.setMateForUser(userId, 'prompts');

    if (result.success) {
      const mateInfo = this.getMateInfo('prompts');
      const message = `${mateInfo.emoji} **${mateInfo.name}** подключен!

${result.message}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

**Темы для обсуждения:**
• Эффективные промпты
• Chain-of-Thought техника
• Ролейплей в AI
• Few-shot и Zero-shot подходы

💬 *Покажи свой промпт - улучшим его вместе!*`;

      await this.sendMessage(runtime, userId, message);
    } else {
      await this.sendMessage(runtime, userId, result.message);
    }

    return true;
  }

  /**
   * Переключиться на ReactWizard
   */
  private async switchToReactWizard(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = await this.topicRouter.setMateForUser(userId, 'react');

    if (result.success) {
      const mateInfo = this.getMateInfo('react');
      const message = `${mateInfo.emoji} **${mateInfo.name}** подключен!

${result.message}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

**Темы для обсуждения:**
• Основы React и компоненты
• Hooks и State Management
• TypeScript + React
• Next.js и оптимизация

💬 *Готов к магии фронтенда! Покажи код - помогу!*`;

      await this.sendMessage(runtime, userId, message);
    } else {
      await this.sendMessage(runtime, userId, result.message);
    }

    return true;
  }

  /**
   * Переключиться на MusicMage
   */
  private async switchToMusicMage(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = await this.topicRouter.setMateForUser(userId, 'music');

    if (result.success) {
      const mateInfo = this.getMateInfo('music');
      const message = `${mateInfo.emoji} **${mateInfo.name}** подключен!

${result.message}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

**Темы для обсуждения:**
• Создание треков в Suno
• AI-генерация обложек
• Продвижение в соцсетях
• Дистрибуция музыки

💬 *Создадим музыкальную магию вместе!*`;

      await this.sendMessage(runtime, userId, message);
    } else {
      await this.sendMessage(runtime, userId, result.message);
    }

    return true;
  }

  /**
   * Переключиться на DocuMaster
   */
  private async switchToDocuMaster(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = await this.topicRouter.setMateForUser(userId, 'docu-master-vibemate');

    if (result.success) {
      const mateInfo = this.getMateInfo('docu-master-vibemate');
      const message = `${mateInfo.emoji} **${mateInfo.name}** подключен!

${result.message}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

**Темы для обсуждения:**
• Создание персонажей (Character Interface)
• Архитектура плагинов
• Настройка окружения и секретов
• Автообновление документации
• Лучшие практики разработки

💬 *Изучим документацию как профессионалы!*`;

      await this.sendMessage(runtime, userId, message);
    } else {
      await this.sendMessage(runtime, userId, result.message);
    }

    return true;
  }

  /**
   * Показать всех доступных VibeMates
   */
  private async listAllMates(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const mates = this.topicRouter.listAllMates();

    let message = '🎓 **VibeMates - Специализированные учителя:**\n\n';

    mates.forEach(mate => {
      message += `${mate.emoji} **${mate.name}**\n`;
      message += `   ${mate.description}\n`;
      message += `   Специализации: ${mate.specialties.join(', ')}\n`;
      message += `   Команда: \`${mate.command}\`\n\n`;
    });

    message += '💡 **Как это работает:**\n';
    message += '1. Выбери специалиста командой /mate [name]\n';
    message += '2. Или просто задай вопрос - я сам подберу специалиста!\n';
    message += '3. Каждый VibeMate - эксперт в своей области\n\n';
    message += '🔥 *Качество обучения выше, когда учитель - специалист!*';

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Показать текущего VibeMate
   */
  private async showCurrentMate(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const currentMateId = this.topicRouter.getCurrentMate(userId);

    if (!currentMateId) {
      const message = `👋 **Привет! Я помогу тебе выбрать VibeMate!**

🤖 **Специализированные учителя по темам:**

${this.formatMateList()}

💡 **Просто выбери специалиста:**
\`/mate agents\` - для AI-агентов
\`/mate prompts\` - для промптинга
\`/mate react\` - для фронтенда
\`/mate music\` - для AI-музыки

Или задай вопрос - я сам подберу нужного специалиста! 🚀`;

      await this.sendMessage(runtime, userId, message);
      return true;
    }

    const mateInfo = this.getMateInfo(currentMateId);

    const message = `${mateInfo.emoji} **Текущий VibeMate: ${mateInfo.name}**

${mateInfo.description}

**Специализации:**
${mateInfo.specialties.map(s => `• ${s}`).join('\n')}

*Команды:*
\`/mate list\` - все VibeMates
\`/mate agents\` - переключиться на AgentsGuru
\`/mate prompts\` - переключиться на PromptMaster
\`/mate react\` - переключиться на ReactWizard
\`/mate music\` - переключиться на MusicMage
\`/mate random\` - случайный VibeMate`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Показать справку
   */
  private async showHelp(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const message = `🎓 **VibeMates - Справочник**

🔥 **Концепция:**
Каждый курс имеет своего специализированного учителя!
Вместо одного общего бота - команда экспертов.

**Команды:**

🤖 **Выбор VibeMate:**
\`/mate agents\` - AgentsGuru (AI-агенты)
\`/mate prompts\` - PromptMaster (промптинг)
\`/mate react\` - ReactWizard (фронтенд)
\`/mate music\` - MusicMage (AI-музыка)

📋 **Информация:**
\`/mate list\` - показать всех VibeMates
\`/mate current\` - текущий VibeMate
\`/mate stats\` - статистика использования

🎲 **Разное:**
\`/mate random\` - случайный VibeMate
\`/mate help\` - эта справка

**Как работает:**
1. Выбираешь VibeMate по теме
2. Общаешься с ним как с обычным ботом
3. Он знает ВСЁ по своей специализации
4. Можешь переключаться в любой момент

💡 **Авто-подбор:**
Просто задай вопрос - я сам пойму, кто нужен!

🚀 *Качество обучения выше с VibeMates!*`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Случайный VibeMate
   */
  private async switchToRandomMate(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const mates = ['agents', 'prompts', 'react', 'music'];
    const randomMate = mates[Math.floor(Math.random() * mates.length)];

    const switchMethods = {
      agents: () => this.switchToAgentsGuru(runtime, userId),
      prompts: () => this.switchToPromptMaster(runtime, userId),
      react: () => this.switchToReactWizard(runtime, userId),
      music: () => this.switchToMusicMage(runtime, userId),
    };

    await switchMethods[randomMate as keyof typeof switchMethods]();

    await this.sendMessage(
      runtime,
      userId,
      `\n\n🎲 *Случайный выбор! Иногда лучший способ узнать что-то новое - поговорить с неожиданным специалистом! 😉*`
    );

    return true;
  }

  /**
   * Показать статистику
   */
  private async showStats(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const stats = this.topicRouter.getUsageStats();

    let message = `📊 **Статистика VibeMates:**

👥 Всего пользователей: ${stats.totalUsers}

📈 Популярность VibeMates:\n`;

    const matesInfo = {
      agents: { name: 'AgentsGuru', emoji: '🤖' },
      prompts: { name: 'PromptMaster', emoji: '🎨' },
      react: { name: 'ReactWizard', emoji: '⚛️' },
      music: { name: 'MusicMage', emoji: '🎵' }
    };

    Object.entries(stats.matesUsage).forEach(([mateId, count]) => {
      const info = matesInfo[mateId as keyof typeof matesInfo];
      if (info) {
        message += `${info.emoji} ${info.name}: ${count} пользователей\n`;
      }
    });

    if (stats.topMate) {
      const topInfo = matesInfo[stats.topMate as keyof typeof matesInfo];
      message += `\n🏆 **Самый популярный:** ${topInfo.emoji} ${topInfo.name}`;
    }

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Отправить сообщение пользователю
   */
  private async sendMessage(runtime: IAgentRuntime, userId: string, text: string): Promise<void> {
    try {
      await runtime.messageManager.create({
        userId,
        content: { text },
        roomId: `direct-${userId}`,
      });
    } catch (error) {
      logger.error('[VibeMatesCommandsService] ❌ Error sending message:', error);
    }
  }

  /**
   * Получить информацию о VibeMate
   */
  private getMateInfo(mateId: string): {
    name: string;
    emoji: string;
    description: string;
    specialties: string[];
  } {
    const infoMap: Record<string, any> = {
      agents: {
        name: 'AgentsGuru',
        emoji: '🤖',
        description: 'Гуру по AI-агентам и мультиагентным системам',
        specialties: ['AI-агенты', 'Мультиагентные системы', 'ElizaOS', 'LangChain']
      },
      prompts: {
        name: 'PromptMaster',
        emoji: '🎨',
        description: 'Мастер промпт-инжиниринга',
        specialties: ['Prompt Engineering', 'Chain-of-Thought', 'ReAct', 'Few-shot']
      },
      react: {
        name: 'ReactWizard',
        emoji: '⚛️',
        description: 'Волшебник React и фронтенда',
        specialties: ['React 18+', 'TypeScript', 'Next.js', 'State Management']
      },
      music: {
        name: 'MusicMage',
        emoji: '🎵',
        description: 'Маг AI-музыки и творчества',
        specialties: ['AI-музыка', 'Suno', 'Обложки', 'Продвижение']
      },
      'docu-master-vibemate': {
        name: 'DocuMaster',
        emoji: '📚',
        description: 'Мастер документации и обучения по ElizaOS',
        specialties: ['Character Interface', 'Plugin Architecture', 'Secrets', 'Auto-update']
      }
    };

    return infoMap[mateId] || {
      name: 'Unknown',
      emoji: '❓',
      description: 'Неизвестный специалист',
      specialties: []
    };
  }

  /**
   * Форматированный список VibeMates
   */
  private formatMateList(): string {
    return `🤖 **AgentsGuru** - AI-агенты и мультиагентные системы
\`/mate agents\`

🎨 **PromptMaster** - промпт-инжиниринг и техники
\`/mate prompts\`

⚛️ **ReactWizard** - React, TypeScript, фронтенд
\`/mate react\`

🎵 **MusicMage** - AI-музыка и творчество
\`/mate music\`

📚 **DocuMaster** - документация и обучение ElizaOS
\`/mate docs\``;
  }

  /**
   * Регистрация событий для обработки сообщений
   */
  async onMessage(runtime: IAgentRuntime, message: Memory, state: State): Promise<void> {
    const text = message.content?.text?.toLowerCase().trim() || '';

    // Обрабатываем только команды /mate
    if (text.startsWith('/mate')) {
      await this.handleMateCommand(runtime, message, state);
    }
  }

  static async start(runtime: IAgentRuntime): Promise<VibeMatesCommandsService> {
    const service = new VibeMatesCommandsService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[VibeMatesCommandsService] Stopping...');
  }
}

export const vibematesCommandsPlugin: Plugin = {
  name: 'vibemates-commands',
  description: 'Commands for managing VibeMate specialists',
  services: [VibeMatesCommandsService],
};

logger.info('💬 [VIBEMATES COMMANDS PLUGIN] Plugin exported');

export default vibematesCommandsPlugin;
export { VibeMatesCommandsService };
