/**
 * Тест системы шаблонов подсказок
 */

import { describe, test, expect } from 'bun:test';
import { TemplateService } from '../src/template/TemplateService';

describe('Template System', () => {
  const service = new TemplateService();
  const userId = 'test_user_123';

  test('Create template', () => {
    const template = service.createTemplate(
      userId,
      'Code Review',
      'Шаблон для code review',
      'Привет! Сделай code review кода {code} в стиле {style}.'
    );

    expect(template.name).toBe('Code Review');
    expect(template.description).toBe('Шаблон для code review');
    expect(template.content).toBe('Привет! Сделай code review кода {code} в стиле {style}.');
    expect(template.variables).toEqual(['code', 'style']);
    expect(template.userId).toBe(userId);
  });

  test('Get user templates', () => {
    const templates = service.getUserTemplates(userId);
    expect(templates.length).toBe(1);
    expect(templates[0].name).toBe('Code Review');
  });

  test('Get template by name', () => {
    const template = service.getTemplateByName(userId, 'Code Review');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Code Review');
  });

  test('Apply template with variables', () => {
    const template = service.getTemplateByName(userId, 'Code Review')!;
    const result = service.applyTemplate(template, {
      code: 'function foo() {}',
      style: 'friendly'
    });

    expect(result).toBe('Привет! Сделай code review кода function foo() {} в стиле friendly.');
  });

  test('Update template', () => {
    const updated = service.updateTemplate(userId, 'Code Review', {
      description: 'Обновлённый шаблон для code review'
    });

    expect(updated).toBeDefined();
    expect(updated?.description).toBe('Обновлённый шаблон для code review');
  });

  test('Delete template', () => {
    const success = service.deleteTemplate(userId, 'Code Review');
    expect(success).toBe(true);

    const templates = service.getUserTemplates(userId);
    expect(templates.length).toBe(0);
  });

  test('Delete non-existent template', () => {
    const success = service.deleteTemplate(userId, 'NonExistent');
    expect(success).toBe(false);
  });

  test('Get template preview', () => {
    const template = service.createTemplate(
      userId,
      'Test',
      'Description',
      'Content with {var1} and {var2}'
    );

    const preview = service.getTemplatePreview(template);
    expect(preview).toContain('Шаблон: Test');
    expect(preview).toContain('Description');
    expect(preview).toContain('Переменные:');
    expect(preview).toContain('{var1}');
    expect(preview).toContain('{var2}');
    expect(preview).toContain('Content with {var1} and {var2}');
  });
});
