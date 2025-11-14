import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Component Tests для проверки конфигурации разговорного интерфейса
 * Согласно лучшим практикам ElizaOS:
 * https://docs.elizaos.ai/guides/test-a-project
 */

describe('Conversational Interface - Component Tests', () => {
  /**
   * Проверка конфигурации персонажа Vibee
   */
  describe('Character Configuration', () => {
    it('должен иметь корректный character файл', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      // Проверяем что персонаж назван Vibee
      expect(characterContent).toContain("name: 'Vibee'");

      // Проверяем что есть система промпт
      expect(characterContent).toContain('system:');

      // Проверяем что подключены плагины
      expect(characterContent).toContain('plugins:');
    });
  });

  /**
   * Проверка подключения плагинов для разговорного интерфейса
   */
  describe('Plugin Configuration', () => {
    it('должен подключать training плагин', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      expect(characterContent).toContain('trainingPlugin');
      expect(characterContent).toContain('training-plugin');
    });

    it('должен подключать aiPhotoshop плагин', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      expect(characterContent).toContain('aiPhotoshopPlugin');
    });
  });

  /**
   * Проверка наличия секретов и конфигурации
   */
  describe('Environment Configuration', () => {
    it('должен иметь TELEGRAM_BOT_TOKEN в настройках', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      // Проверяем что бот токен указан в secrets
      expect(characterContent).toContain('TELEGRAM_BOT_TOKEN');
    });

    it('должен иметь переменные для AI моделей', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      // Проверяем наличие условий для AI провайдеров
      expect(characterContent).toContain('ANTHROPIC_API_KEY');
      expect(characterContent).toContain('OPENROUTER_API_KEY');
    });

    it('должен иметь FAL_KEY для генерации изображений', () => {
      const characterPath = join(process.cwd(), 'src', 'character.ts');
      const characterContent = readFileSync(characterPath, 'utf-8');

      expect(characterContent).toContain('FAL_KEY');
      expect(characterContent).toContain('FAL_API_KEY');
    });
  });

  /**
   * Проверка файловой структуры плагинов
   */
  describe('Plugin Files Structure', () => {
    it('должен иметь telegram-commands-plugin.ts', () => {
      const commandsPluginPath = join(process.cwd(), 'src', 'telegram-commands-plugin.ts');
      expect(() => readFileSync(commandsPluginPath, 'utf-8')).not.toThrow();
    });

    it('должен иметь training-plugin.ts', () => {
      const trainingPluginPath = join(process.cwd(), 'src', 'training-plugin.ts');
      expect(() => readFileSync(trainingPluginPath, 'utf-8')).not.toThrow();
    });

    it('должен иметь ai-photoshop директорию', () => {
      const aiPhotoshopDir = join(process.cwd(), 'src', 'ai-photoshop');
      const fs = require('fs');
      expect(fs.existsSync(aiPhotoshopDir)).toBe(true);
    });

    it('должен иметь telegram-keyboards директорию', () => {
      const keyboardsDir = join(process.cwd(), 'src', 'telegram-keyboards');
      const fs = require('fs');
      expect(fs.existsSync(keyboardsDir)).toBe(true);
    });
  });
});
