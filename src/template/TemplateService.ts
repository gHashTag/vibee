/**
 * Template Service
 * Управляет пользовательскими шаблонами подсказок
 */

import { Service, logger, type IAgentRuntime } from '@elizaos/core';

export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  createdAt: number;
  updatedAt: number;
}

export class TemplateService extends Service {
  static serviceType = 'template-manager';

  private templates: Map<string, Template[]> = new Map();

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[TemplateService] 🔧 Initializing template management...');
    // В продакшене здесь была бы загрузка из базы данных
    logger.info('[TemplateService] ✅ Template service ready');
  }

  /**
   * Создать новый шаблон
   */
  createTemplate(
    userId: string,
    name: string,
    description: string,
    content: string
  ): Template {
    const template: Template = {
      id: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description,
      content,
      variables: this.extractVariables(content),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const userTemplates = this.templates.get(userId) || [];
    userTemplates.push(template);
    this.templates.set(userId, userTemplates);

    logger.info(`[TemplateService] ✅ Created template "${name}" for user ${userId}`);
    return template;
  }

  /**
   * Получить шаблоны пользователя
   */
  getUserTemplates(userId: string): Template[] {
    return this.templates.get(userId) || [];
  }

  /**
   * Получить шаблон по имени
   */
  getTemplateByName(userId: string, name: string): Template | undefined {
    const templates = this.templates.get(userId) || [];
    return templates.find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Обновить шаблон
   */
  updateTemplate(
    userId: string,
    name: string,
    updates: Partial<Pick<Template, 'description' | 'content'>>
  ): Template | null {
    const templates = this.templates.get(userId) || [];
    const templateIndex = templates.findIndex(
      t => t.name.toLowerCase() === name.toLowerCase()
    );

    if (templateIndex === -1) {
      return null;
    }

    const template = templates[templateIndex];
    const updatedTemplate: Template = {
      ...template,
      ...updates,
      variables: updates.content ? this.extractVariables(updates.content) : template.variables,
      updatedAt: Date.now(),
    };

    templates[templateIndex] = updatedTemplate;
    this.templates.set(userId, templates);

    logger.info(`[TemplateService] ✅ Updated template "${name}" for user ${userId}`);
    return updatedTemplate;
  }

  /**
   * Удалить шаблон
   */
  deleteTemplate(userId: string, name: string): boolean {
    const templates = this.templates.get(userId) || [];
    const filteredTemplates = templates.filter(
      t => t.name.toLowerCase() !== name.toLowerCase()
    );

    if (filteredTemplates.length === templates.length) {
      return false; // Шаблон не найден
    }

    this.templates.set(userId, filteredTemplates);
    logger.info(`[TemplateService] ✅ Deleted template "${name}" for user ${userId}`);
    return true;
  }

  /**
   * Применить шаблон с переменными
   */
  applyTemplate(template: Template, variables: Record<string, string>): string {
    let result = template.content;

    // Заменяем все переменные
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Извлечь переменные из контента
   */
  private extractVariables(content: string): string[] {
    const regex = /{(\w+)}/g;
    const matches = content.matchAll(regex);
    const variables = new Set<string>();

    for (const match of matches) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Получить предпросмотр шаблона
   */
  getTemplatePreview(template: Template): string {
    const variablesText = template.variables.length > 0
      ? `📝 **Переменные:** ${template.variables.map(v => `\`{${v}}\``).join(', ')}`
      : '📝 **Переменных нет**';

    return `📋 **Шаблон: ${template.name}**

${template.description}

${variablesText}

📄 **Содержимое:**
\`\`\`
${template.content}
\`\`\`

Создан: ${new Date(template.createdAt).toLocaleString('ru-RU')}
Обновлён: ${new Date(template.updatedAt).toLocaleString('ru-RU')}`;
  }

  static async start(runtime: IAgentRuntime): Promise<TemplateService> {
    const service = new TemplateService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[TemplateService] Stopping...');
  }
}
