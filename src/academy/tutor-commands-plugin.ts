/**
 * Tutor Commands Plugin
 * Команды для работы с системой учителей
 */

import { logger, type IAgentRuntime, type Plugin, Service, type Memory, type State } from '@elizaos/core';
import { TutorSwitcherService } from './tutor-switcher-plugin';

logger.info('📋 [TUTOR COMMANDS PLUGIN] Module loaded - exporting plugin');

class TutorCommandsService extends Service {
  static serviceType = 'tutor-commands';
  public capabilityDescription = 'Commands for managing tutor switching';

  private tutorSwitcher: TutorSwitcherService;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TutorCommandsService] 💬 Initializing Tutor Commands...');

    this.tutorSwitcher = runtime.getService('tutor-switcher') as TutorSwitcherService;

    if (!this.tutorSwitcher) {
      logger.warn('[TutorCommandsService] ⚠️ TutorSwitcherService not found');
    }
  }

  /**
   * Обработчик команд /tutor
   */
  async handleTutorCommand(runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> {
    if (!this.tutorSwitcher) {
      return false;
    }

    const text = message.content?.text?.toLowerCase().trim() || '';
    const userId = message.userId || 'unknown';

    // Парсим команду
    const parts = text.split(' ');
    const subcommand = parts[1]?.toLowerCase();

    try {
      switch (subcommand) {
        case 'main':
          return this.switchToMainTutor(runtime, userId);

        case 'agentic':
        case 'agents':
          return this.switchToAgenticTutor(runtime, userId);

        case 'music':
        case 'ai-music':
          return this.switchToMusicTutor(runtime, userId);

        case 'list':
          return this.listTutors(runtime, userId);

        case 'current':
        case 'who':
          return this.showCurrentTutor(runtime, userId);

        case 'help':
          return this.showHelp(runtime, userId);

        default:
          // Если команда без параметров - показать текущего учителя
          return this.showCurrentTutor(runtime, userId);
      }
    } catch (error) {
      logger.error('[TutorCommandsService] ❌ Error handling tutor command:', error);
      await this.sendMessage(runtime, userId, '❌ Произошла ошибка. Попробуйте позже.');
      return true;
    }
  }

  /**
   * Переключиться на главного наставника
   */
  private async switchToMainTutor(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = this.tutorSwitcher.switchTutor(userId, 'main');

    const message = `👨‍🏫 **Главный наставник**

${result.message}

Я помогу тебе:
🎓 Выбрать подходящий курс
📚 Начать обучение по AI и разработке
🤖 Найти ответы на любые вопросы

У нас есть 2 крутых курса:
1️⃣ **Agentic VibeCoding** - создание AI-агентов
2️⃣ **AI Music Production** - создание музыки с ИИ

Просто расскажи, что тебя интересует!`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Переключиться на учителя AI-агентов
   */
  private async switchToAgenticTutor(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = this.tutorSwitcher.switchTutor(userId, 'agentic');

    const message = `🤖 **Учитель по AI-агентам**

${result.message}

Я помогу тебе освоить:
🤖 Создание AI-агентов с нуля
⚡ Современные технологии разработки
🧠 Архитектуру мультиагентных систем
🎯 Практические проекты и workflow

Готов начать изучение? Задавай вопросы по созданию агентов! 🚀

*Команды:*
/tutor main - вернуться к главному наставнику
/tutor music - переключиться на учителя музыки`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Переключиться на учителя AI-музыки
   */
  private async switchToMusicTutor(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const result = this.tutorSwitcher.switchTutor(userId, 'music');

    const message = `🎵 **Учитель по AI-музыке**

${result.message}

Вместе мы изучим:
🎼 Создание музыки с помощью ИИ
🎨 Генерацию обложек и визуала
📱 Продвижение в соцсетях
🎤 Создание артистов
💰 Дистрибуцию треков

Готов создать свой первый AI-хит? 🎤

*Команды:*
/tutor main - вернуться к главному наставнику
/tutor agentic - переключиться на учителя агентов`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Показать список всех учителей
   */
  private async listTutors(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const tutors = this.tutorSwitcher.listTutors();

    let message = '📚 **Доступные учителя:**\n\n';

    tutors.forEach(tutor => {
      message += `${tutor.emoji} **${tutor.name}**\n`;
      message += `   ${tutor.description}\n`;
      message += `   Команда: \`${tutor.command}\`\n\n`;
    });

    message += 'Просто выбери учителя, который тебе интересен!';

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Показать текущего учителя
   */
  private async showCurrentTutor(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const currentTutorType = this.tutorSwitcher.getCurrentTutor(userId);

    if (!currentTutorType) {
      const message = `👨‍🏫 **Главный наставник (по умолчанию)**

Привет! Я помогу тебе выбрать подходящий курс и начать обучение!

📚 **Доступные курсы:**
1️⃣ Agentic VibeCoding - создание AI-агентов
2️⃣ AI Music Production - создание музыки с ИИ

Расскажи, что тебя интересует, или используй команду:
\`/tutor list\` - посмотреть всех учителей`;

      await this.sendMessage(runtime, userId, message);
      return true;
    }

    const tutorInfo = this.tutorSwitcher.getTutorDescription(currentTutorType);

    const message = `${tutorInfo.emoji} **Текущий учитель: ${tutorInfo.name}**

${tutorInfo.description}

**Специализации:**
${tutorInfo.specialties.map(s => `• ${s}`).join('\n')}

*Команды:*
\`/tutor list\` - посмотреть всех учителей
\`/tutor main\` - главный наставник
\`/tutor agentic\` - учитель AI-агентов
\`/tutor music\` - учитель AI-музыки`;

    await this.sendMessage(runtime, userId, message);
    return true;
  }

  /**
   * Показать справку
   */
  private async showHelp(runtime: IAgentRuntime, userId: string): Promise<boolean> {
    const message = `📋 **Система учителей Академии Vibee**

У каждого курса есть свой специализированный учитель!

**Команды:**

\`/tutor\` - показать текущего учителя
\`/tutor list\` - посмотреть всех учителей
\`/tutor main\` - главный наставник
\`/tutor agentic\` - учитель по AI-агентам
\`/tutor music\` - учитель по AI-музыке

**Как это работает:**
1. Выбираешь учителя по команде
2. Общаешься с ним как с обычным ботом
3. Он знает все материалы своего курса
4. Можешь переключаться между учителями в любой момент

Просто начни общение или выбери команду! 🚀`;

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
      logger.error('[TutorCommandsService] ❌ Error sending message:', error);
    }
  }

  /**
   * Регистрация событий для обработки сообщений
   */
  async onMessage(runtime: IAgentRuntime, message: Memory, state: State): Promise<void> {
    const text = message.content?.text?.toLowerCase().trim() || '';

    // Обрабатываем только команды /tutor
    if (text.startsWith('/tutor')) {
      await this.handleTutorCommand(runtime, message, state);
    }
  }

  static async start(runtime: IAgentRuntime): Promise<TutorCommandsService> {
    const service = new TutorCommandsService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TutorCommandsService] Stopping...');
  }
}

export const tutorCommandsPlugin: Plugin = {
  name: 'tutor-commands',
  description: 'Commands for managing tutor switching',
  services: [TutorCommandsService],
};

logger.info('📋 [TUTOR COMMANDS PLUGIN] Plugin exported');

export default tutorCommandsPlugin;
export { TutorCommandsService };
