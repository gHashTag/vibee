/**
 * Help Command - Refactored with validation and proper architecture
 */

import type { IAgentRuntime, Memory } from '@elizaos/core';
import { TextCommand, type CommandContext, type CommandResult } from '../../core/base-command';
import { ValidationError } from '../../core/errors';
import { z } from 'zod';
import { Markup } from 'telegraf';

// Command validation schema
const HelpCommandSchema = z.object({
  section: z.string().optional(),
  verbose: z.boolean().optional(),
});

/**
 * Help command types
 */
export interface HelpSection {
  id: string;
  title: string;
  description: string;
  commands: string[];
  category: string;
}

export interface HelpContext {
  chatId: string;
  userId: string;
}

export interface HelpResult {
  success: boolean;
  data?: HelpSection[];
  error?: string;
}

/**
 * Help command business logic service
 */
export class HelpService {
  /**
   * Get all help sections
   */
  getHelpSections(): HelpSection[] {
    return [
      {
        id: 'basic',
        title: 'Основы',
        description: 'Базовые команды для начала работы',
        commands: ['/start', '/menu', '/help'],
        category: 'Основы',
      },
      {
        id: 'balance',
        title: 'Баланс',
        description: 'Управление балансом и платежами',
        commands: ['/balance', '/add-balance'],
        category: 'Финансы',
      },
      {
        id: 'subscriptions',
        title: 'Подписки',
        description: 'Управление подписками',
        commands: ['/subscription', '/admin sub'],
        category: 'Финансы',
      },
      {
        id: 'analytics',
        title: 'Аналитика',
        description: 'Статистика и анализ',
        commands: ['/stats', '/expenses', '/monitor'],
        category: 'Аналитика',
      },
      {
        id: 'ai',
        title: 'AI Инструменты',
        description: 'Команды для работы с AI',
        commands: ['/neurophoto', '/tts', '/train'],
        category: 'AI',
      },
      {
        id: 'content',
        title: 'Контент',
        description: 'Создание и управление контентом',
        commands: ['/create', '/reels', '/template'],
        category: 'Контент',
      },
    ];
  }

  /**
   * Get section by ID
   */
  getSection(id: string): HelpSection | undefined {
    return this.getHelpSections().find(s => s.id === id);
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(): Record<string, HelpSection[]> {
    const sections = this.getHelpSections();
    return sections.reduce((acc, section) => {
      const category = section.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(section);
      return acc;
    }, {} as Record<string, HelpSection[]>);
  }

  /**
   * Search commands
   */
  searchCommands(query: string): HelpSection[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getHelpSections().filter(section =>
      section.title.toLowerCase().includes(lowercaseQuery) ||
      section.description.toLowerCase().includes(lowercaseQuery) ||
      section.commands.some(cmd => cmd.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Validate help request
   */
  validateRequest(params: { section?: string; verbose?: boolean }): void {
    if (params.section && typeof params.section !== 'string') {
      throw new ValidationError('Section must be a string');
    }

    if (params.section) {
      const section = this.getSection(params.section);
      if (!section) {
        throw new ValidationError(`Section not found: ${params.section}`);
      }
    }
  }
}

/**
 * Help command UI renderer
 */
export class HelpRenderer {
  /**
   * Render main help message
   */
  renderMainHelp(sections: HelpSection[], verbose = false): string {
    let message = '❓ <b>Помощь и документация</b>\n\n';

    message += '<b>Доступные команды:</b>\n';
    message += '• /start - Начать работу\n';
    message += '• /menu - Главное меню\n';
    message += '• /help - Эта справка\n';
    message += '• /balance - Баланс и платежи\n';
    message += '• /stats - Статистика бота\n';
    message += '• /expenses - Анализ расходов\n';
    message += '• /subscription - Статус подписки\n\n';

    if (verbose) {
      message += '<b>Категории:</b>\n';
      const categories = this.groupByCategory(sections);
      for (const [category, categorySections] of Object.entries(categories)) {
        message += `\n<b>${category}:</b>\n`;
        for (const section of categorySections) {
          message += `  • ${section.title} - ${section.description}\n`;
        }
      }
    } else {
      message += '<b>Категории:</b>\n';
      for (const section of sections) {
        message += `• ${section.category}: ${section.title}\n`;
      }
    }

    message += '\n<b>Как использовать:</b>\n';
    message += 'Просто введите команду или опишите, что вам нужно!\n\n';
    message += '💡 <i>Совет: используйте /help [команда] для получения справки по конкретной команде</i>';

    return message;
  }

  /**
   * Render section help
   */
  renderSectionHelp(section: HelpSection): string {
    let message = `❓ <b>${section.title}</b>\n\n`;
    message += `${section.description}\n\n`;
    message += '<b>Команды:</b>\n';

    for (const command of section.commands) {
      message += `• ${command}\n`;
    }

    message += `\n<i>Используйте /help для возврата к основному меню</i>`;

    return message;
  }

  /**
   * Render search results
   */
  renderSearchResults(query: string, results: HelpSection[]): string {
    let message = `🔍 <b>Результаты поиска:</b> "${query}"\n\n`;

    if (results.length === 0) {
      message += 'Ничего не найдено. Попробуйте другой запрос.\n';
      message += 'Используйте /help для просмотра всех команд.';
      return message;
    }

    message += `<b>Найдено разделов: ${results.length}</b>\n\n`;

    for (const section of results) {
      message += `<b>${section.title}</b> (${section.category})\n`;
      message += `${section.description}\n`;
      message += `Команды: ${section.commands.join(', ')}\n\n`;
    }

    return message;
  }

  /**
   * Render keyboard
   */
  renderKeyboard(sections: HelpSection[]): ReturnType<typeof Markup.inlineKeyboard> {
    const buttons = sections.map(section => [
      Markup.button.callback(
        section.title,
        `help_${section.id}`
      ),
    ]);

    return Markup.inlineKeyboard(buttons);
  }

  /**
   * Group sections by category
   */
  private groupByCategory(sections: HelpSection[]): Record<string, HelpSection[]> {
    return sections.reduce((acc, section) => {
      const category = section.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(section);
      return acc;
    }, {} as Record<string, HelpSection[]>);
  }
}

/**
 * Help Command Implementation
 */
export class HelpCommand extends TextCommand {
  private helpService: HelpService;
  private renderer: HelpRenderer;

  constructor(runtime: IAgentRuntime) {
    super(runtime, {
      name: 'help',
      description: 'Показать справку по командам',
      aliases: ['справка', 'помощь'],
      cooldown: 5,
      retries: 2,
    });

    this.helpService = new HelpService();
    this.renderer = new HelpRenderer();
  }

  /**
   * Validate command arguments
   */
  protected validateArgs(args: string[]): void {
    if (args.length === 0) {
      return;
    }

    const params = {
      section: args[0],
      verbose: args.includes('--verbose') || args.includes('-v'),
    };

    this.helpService.validateRequest(params);
  }

  /**
   * Execute help command
   */
  async execute(ctx: CommandContext): Promise<CommandResult> {
    const telegramService = this.runtime.getService('telegram');
    if (!telegramService?.bot) {
      throw new Error('Telegram service not available');
    }

    // Parse arguments
    const args = ctx.args;
    let sections = this.helpService.getHelpSections();

    if (args.length > 0) {
      // Check if first arg is a section ID
      const section = this.helpService.getSection(args[0]);
      if (section) {
        // Show specific section
        const message = this.renderer.renderSectionHelp(section);
        await telegramService.bot.telegram.sendMessage(ctx.chatId, message, {
          parse_mode: 'HTML',
        });
        return { success: true, message: 'Section help displayed' };
      } else {
        // Search
        const query = args.join(' ');
        const results = this.helpService.searchCommands(query);
        const message = this.renderer.renderSearchResults(query, results);

        await telegramService.bot.telegram.sendMessage(ctx.chatId, message, {
          parse_mode: 'HTML',
        });

        return { success: true, message: 'Search results displayed' };
      }
    } else {
      // Show main help
      const message = this.renderer.renderMainHelp(sections);
      const keyboard = this.renderer.renderKeyboard(sections);

      await telegramService.bot.telegram.sendMessage(ctx.chatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard.reply_markup,
      });

      return { success: true, message: 'Main help displayed' };
    }
  }
}

export default HelpCommand;
