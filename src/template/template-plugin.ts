/**
 * Template Plugin
 * Плагин для управления пользовательскими шаблонами подсказок
 */

import { logger, type IAgentRuntime, type Plugin, Service } from '@elizaos/core';
import { TemplateService, type Template } from './TemplateService';

logger.info('📝 [TEMPLATE PLUGIN] Module loaded - exporting plugin');

/**
 * Сервис для обработки команд шаблонов
 */
class TemplateCommandsService extends Service {
  static serviceType = 'template-commands';

  private templateService: TemplateService | null = null;
  private userStates: Map<string, any> = new Map();

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TemplateCommandsService] 🔧 Initializing...');

    // Получаем TemplateService
    this.templateService = runtime.getService('template-manager') as TemplateService;
    if (!this.templateService) {
      logger.error('[TemplateCommandsService] ❌ TemplateService not found');
      return;
    }

    // Слушаем сообщения от Telegram
    runtime.on('TELEGRAM_MESSAGE_RECEIVED', this.handleMessage.bind(this));

    logger.info('[TemplateCommandsService] ✅ Template commands ready');
  }

  private async handleMessage(runtime: IAgentRuntime, message: any): Promise<void> {
    const text = message.content?.text?.trim();
    if (!text) return;

    const chatId = message.roomId;
    const userId = message.senderId;

    // Проверяем команды
    if (text.startsWith('/template')) {
      await this.handleTemplateCommand(runtime, chatId, userId, text);
    }
  }

  private async handleTemplateCommand(
    runtime: IAgentRuntime,
    chatId: string,
    userId: string,
    text: string
  ): Promise<void> {
    const parts = text.split(' ');
    const command = parts[1]?.toLowerCase();

    switch (command) {
      case 'create':
        await this.handleCreate(runtime, chatId, userId, text);
        break;
      case 'list':
        await this.handleList(chatId, userId);
        break;
      case 'use':
        await this.handleUse(chatId, userId, parts[2]);
        break;
      case 'edit':
        await this.handleEdit(chatId, userId, parts[2]);
        break;
      case 'delete':
        await this.handleDelete(chatId, userId, parts[2]);
        break;
      case 'preview':
        await this.handlePreview(chatId, userId, parts[2]);
        break;
      case 'help':
        await this.handleHelp(chatId);
        break;
      default:
        await this.sendMessage(chatId,
          '📝 **Управление шаблонами подсказок**\n\n' +
          'Доступные команды:\n' +
          '• `/template create` - создать новый шаблон\n' +
          '• `/template list` - показать мои шаблоны\n' +
          '• `/template preview <имя>` - посмотреть шаблон\n' +
          '• `/template use <имя>` - использовать шаблон\n' +
          '• `/template edit <имя>` - редактировать шаблон\n' +
          '• `/template delete <имя>` - удалить шаблон\n' +
          '• `/template help` - показать справку\n\n' +
          '💡 **Переменные в шаблонах:**\n' +
          'Используй `{имя_переменной}` в тексте, например:\n' +
          '`Привет, {name}! Расскажи о {topic}.`'
        );
    }
  }

  private async handleCreate(runtime: IAgentRuntime, chatId: string, userId: string, fullText: string): Promise<void> {
    const state = this.userStates.get(userId) || { step: 'name' };

    if (state.step === 'name') {
      // Получаем название из команды
      const nameStartIndex = fullText.toLowerCase().indexOf('/template create');
      const name = nameStartIndex >= 0
        ? fullText.substring(nameStartIndex + '/template create'.length).trim()
        : '';

      if (!name) {
        this.userStates.set(userId, { step: 'name' });
        await this.sendMessage(chatId,
          '📝 **Создание нового шаблона**\n\n' +
          'Шаг 1 из 3: Введи название шаблона\n' +
          'Например: "Объяснение кода", "Создание TODO", "Code Review"\n\n' +
          'Или используй: `/template create МоёНазвание`'
        );
        return;
      }

      state.name = this.sanitizeName(name);
      state.step = 'description';
      this.userStates.set(userId, state);
      await this.sendMessage(chatId,
        `✅ Название: "${state.name}"\n\n` +
        'Шаг 2 из 3: Введи описание шаблона\n' +
        'Например: "Шаблон для объяснения сложного кода новичкам"'
      );
    } else if (state.step === 'description') {
      state.description = fullText.trim();
      state.step = 'content';
      this.userStates.set(userId, state);
      await this.sendMessage(chatId,
        `✅ Название: "${state.name}"\n` +
        `✅ Описание: "${state.description}"\n\n` +
        'Шаг 3 из 3: Введи содержимое шаблона\n\n' +
        '💡 **Используй переменные в фигурных скобках:**\n' +
        '`{name}` - имя\n' +
        '`{topic}` - тема\n' +
        '`{style}` - стиль\n\n' +
        '**Пример:**\n' +
        '`Привет, {name}! Объясни {topic} простыми словами в стиле {style}.`'
      );
    } else if (state.step === 'content') {
      const content = fullText.trim();
      if (!content) {
        await this.sendMessage(chatId, '❌ Введи содержимое шаблона');
        return;
      }

      const template = this.templateService!.createTemplate(
        userId,
        state.name!,
        state.description!,
        content
      );

      this.userStates.delete(userId);
      await this.sendMessage(chatId,
        `✅ **Шаблон создан!**\n\n` +
        this.templateService!.getTemplatePreview(template)
      );
    }
  }

  private async handleList(chatId: string, userId: string): Promise<void> {
    const templates = this.templateService!.getUserTemplates(userId);

    if (templates.length === 0) {
      await this.sendMessage(chatId,
        '📭 У тебя пока нет шаблонов.\n' +
        'Создай первый: `/template create`'
      );
      return;
    }

    let message = '📚 **Твои шаблоны:**\n\n';
    templates.forEach((t, i) => {
      message += `${i + 1}. **${t.name}**\n`;
      message += `   📄 ${t.description}\n`;
      message += `   📝 Переменных: ${t.variables.length}\n\n`;
    });

    message += '💡 Используй: `/template use <имя>`';
    await this.sendMessage(chatId, message);
  }

  private async handlePreview(chatId: string, userId: string, name: string): Promise<void> {
    if (!name) {
      await this.sendMessage(chatId, '❌ Укажи имя шаблона: `/template preview <имя>`');
      return;
    }

    const template = this.templateService!.getTemplateByName(userId, name);
    if (!template) {
      await this.sendMessage(chatId, `❌ Шаблон "${name}" не найден`);
      return;
    }

    await this.sendMessage(chatId, this.templateService!.getTemplatePreview(template));
  }

  private async handleUse(chatId: string, userId: string, name: string): Promise<void> {
    if (!name) {
      await this.sendMessage(chatId, '❌ Укажи имя шаблона: `/template use <имя>`');
      return;
    }

    const template = this.templateService!.getTemplateByName(userId, name);
    if (!template) {
      await this.sendMessage(chatId, `❌ Шаблон "${name}" не найден`);
      return;
    }

    if (template.variables.length > 0) {
      const state = { template, step: 'variables', variables: {} };
      this.userStates.set(userId, state);

      const firstVar = template.variables[0];
      await this.sendMessage(chatId,
        `🎯 **Шаблон: ${template.name}**\n\n` +
        `Введи значение для \`{${firstVar}}\`:`
      );
    } else {
      const result = this.templateService!.applyTemplate(template, {});
      await this.sendMessage(chatId,
        `✅ **Результат шаблона "${template.name}":**\n\n` +
        `${result}`
      );
    }
  }

  private async handleEdit(chatId: string, userId: string, name: string): Promise<void> {
    if (!name) {
      await this.sendMessage(chatId, '❌ Укажи имя шаблона: `/template edit <имя>`');
      return;
    }

    const template = this.templateService!.getTemplateByName(userId, name);
    if (!template) {
      await this.sendMessage(chatId, `❌ Шаблон "${name}" не найден`);
      return;
    }

    const state = { template, step: 'field' };
    this.userStates.set(userId, state);

    await this.sendMessage(chatId,
      `✏️ **Редактирование шаблона: ${template.name}**\n\n` +
      'Что хочешь изменить?\n' +
      '1. Описание\n' +
      '2. Содержимое\n\n' +
      'Отправь номер пункта (1 или 2)'
    );
  }

  private async handleDelete(chatId: string, userId: string, name: string): Promise<void> {
    if (!name) {
      await this.sendMessage(chatId, '❌ Укажи имя шаблона: `/template delete <имя>`');
      return;
    }

    const success = this.templateService!.deleteTemplate(userId, name);
    if (success) {
      await this.sendMessage(chatId, `✅ Шаблон "${name}" удалён`);
    } else {
      await this.sendMessage(chatId, `❌ Шаблон "${name}" не найден`);
    }
  }

  private async handleHelp(chatId: string): Promise<void> {
    await this.sendMessage(chatId,
      '📚 **Справка по шаблонам подсказок**\n\n' +
      '🎯 **Что это?**\n' +
      'Шаблоны - это готовые подсказки, которые ты можешь использовать для разных задач.\n\n' +
      '📝 **Переменные**\n' +
      'В шаблоне можно использовать переменные в фигурных скобках:\n' +
      '`{name}` - имя пользователя\n' +
      '`{topic}` - тема разговора\n' +
      '`{style}` - стиль ответа\n' +
      '`{level}` - уровень сложности\n\n' +
      '🚀 **Пример создания:**\n' +
      '1. `/template create`\n' +
      '2. Вводишь название\n' +
      '3. Вводишь описание\n' +
      '4. Вводишь содержимое с переменными\n\n' +
      '💡 **Пример шаблона:**\n' +
      'Название: "Объяснение кода"\n' +
      'Содержимое: "Привет! Объясни мне {topic} простыми словами для {level}."'
    );
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^\w\s-]/g, '').trim();
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    // Здесь был бы вызов API Telegram
    // Для тестов используем logger
    logger.info(`[TemplateCommandsService] 📤 To ${chatId}: ${text.substring(0, 100)}...`);
  }

  static async start(runtime: IAgentRuntime): Promise<TemplateCommandsService> {
    const service = new TemplateCommandsService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TemplateCommandsService] Stopping...');
  }
}

export const templatePlugin: Plugin = {
  name: 'template-manager',
  description: 'User prompt templates management',
  services: [TemplateService, TemplateCommandsService],
};

logger.info('📝 [TEMPLATE PLUGIN] Plugin exported');

export default templatePlugin;
