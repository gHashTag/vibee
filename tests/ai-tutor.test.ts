/**
 * Тест AI Tutor Plugin
 */

import { describe, test, expect } from 'bun:test';
import { AiTutorService } from '../src/academy/ai-tutor-plugin';

describe('AI Tutor Plugin', () => {
  let service: AiTutorService;
  let mockRuntime: any;

  test('Create AI Tutor Service', () => {
    service = new AiTutorService();
    expect(service).toBeDefined();
    expect(AiTutorService.serviceType).toBe('ai-tutor');
  });

  test('Initialize AI Tutor Service', async () => {
    mockRuntime = {
      getService: () => null,
    };

    await service.initialize(mockRuntime);

    expect(service).toBeDefined();
  });

  test('Generate suggestions for different topics', () => {
    const agentSuggestions = service['generateSuggestions']('Что такое AI-агенты?', []);
    expect(agentSuggestions).toContain('Как создать первого AI-агента?');

    const telegramSuggestions = service['generateSuggestions']('Как создать Telegram бота?', []);
    expect(telegramSuggestions).toContain('Как настроить Telegram бота?');

    const musicSuggestions = service['generateSuggestions']('Как создать AI музыку?', []);
    expect(musicSuggestions).toContain('Как создать музыку с помощью AI?');
  });

  test('Get recommendations', async () => {
    const recommendations = await service.getRecommendations('test-user', mockRuntime);

    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0]).toContain('Agentic VibeCoding');
  });

  test('Explain topic', async () => {
    const explanation = await service.explainTopic('AI agents', 'test-user', mockRuntime);

    expect(explanation).toBeDefined();
    expect(explanation.answer).toBeDefined();
    expect(Array.isArray(explanation.suggestions)).toBe(true);
  });

  test('Help with lesson', async () => {
    const help = await service.helpWithLesson(
      '00-ВВЕДЕНИЕ',
      'What is vibe-coding?',
      'test-user',
      mockRuntime
    );

    expect(help).toBeDefined();
    expect(help.answer).toBeDefined();
    expect(help.answer).toContain('вопрос');
  });
});
