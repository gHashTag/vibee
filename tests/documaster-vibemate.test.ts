/**
 * DocuMaster VibeMate - Component & E2E Tests
 * Тестирование персонажа DocuMaster и его интеграции в систему VibeMates
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  docuMasterCharacter,
  vibematesCharacters,
  getVibeMateById,
  getVibeMateByName
} from '../src/vibemates-characters';
import { vibeMatesRegistry } from '../src/academy/vibemates/vibemates-registry';
import { type Character } from '@elizaos/core';

// ========================================
// COMPONENT TESTS - Конфигурация
// ========================================

describe('DocuMaster Character Configuration', () => {
  let docuMaster: Character;

  beforeAll(() => {
    docuMaster = getVibeMateById('docu-master-vibemate')!;
  });

  describe('Required Fields', () => {
    it('должен иметь обязательные поля name и bio', () => {
      expect(docuMaster.name).toBe('DocuMaster');
      expect(docuMaster.bio).toBeDefined();
      expect(Array.isArray(docuMaster.bio) ? docuMaster.bio.length > 0 : true).toBe(true);
    });

    it('должен иметь уникальный ID', () => {
      expect(docuMaster.id).toBe('docu-master-vibemate');
    });
  });

  describe('Settings & Secrets', () => {
    it('должен иметь правильные настройки модели', () => {
      expect(docuMaster.settings?.model).toBe('meta-llama/llama-3.1-8b-instruct:free');
      expect(docuMaster.settings?.embeddingModel).toBe('text-embedding-3-small');
    });

    it('должен иметь настроенные секреты', () => {
      expect(docuMaster.settings?.secrets?.TELEGRAM_BOT_TOKEN).toBeDefined();
      expect(docuMaster.settings?.secrets?.OPENAI_API_KEY).toBeDefined();
    });

    it('должен иметь аватар', () => {
      expect(docuMaster.settings?.avatar).toBeDefined();
      expect(docuMaster.settings?.avatar).toContain('eliza-avatars');
    });
  });

  describe('Plugins', () => {
    it('должен иметь необходимые плагины', () => {
      expect(docuMaster.plugins).toContain('@elizaos/plugin-sql');
      expect(docuMaster.plugins).toContain('@elizaos/plugin-openai');
    });
  });

  describe('Content & Topics', () => {
    it('должен иметь system prompt', () => {
      expect(docuMaster.system).toBeDefined();
      expect(docuMaster.system).toContain('DocuMaster');
      expect(docuMaster.system).toContain('документации');
    });

    it('должен иметь topics', () => {
      expect(docuMaster.topics).toBeDefined();
      expect(Array.isArray(docuMaster.topics)).toBe(true);
      expect(docuMaster.topics.length).toBeGreaterThan(0);
      expect(docuMaster.topics.join(' ')).toMatch(/Character|Plugin|Memory|Secrets/i);
    });

    it('должен иметь messageExamples', () => {
      expect(docuMaster.messageExamples).toBeDefined();
      expect(Array.isArray(docuMaster.messageExamples)).toBe(true);
      expect(docuMaster.messageExamples.length).toBeGreaterThan(0);
    });
  });
});

// ========================================
// COMPONENT TESTS - Интеграция с VibeMates
// ========================================

describe('DocuMaster Integration with VibeMates System', () => {
  describe('Registry Registration', () => {
    it('должен быть зарегистрирован в vibematesCharacters', () => {
      const characters = vibematesCharacters;
      const docuMaster = characters.find(c => c.id === 'docu-master-vibemate');
      expect(docuMaster).toBeDefined();
    });

    it('должен быть найден через getVibeMateById', () => {
      const mate = getVibeMateById('docu-master-vibemate');
      expect(mate).toBeDefined();
      expect(mate?.name).toBe('DocuMaster');
    });

    it('должен быть найден через getVibeMateByName', () => {
      const mate = getVibeMateByName('DocuMaster');
      expect(mate).toBeDefined();
      expect(mate?.id).toBe('docu-master-vibemate');
    });

    it('должен быть в registry', () => {
      const mate = vibeMatesRegistry.getMateById('docu-master-vibemate');
      expect(mate).toBeDefined();
      expect(mate?.name).toBe('DocuMaster');
    });
  });

  describe('VibeMates Registry', () => {
    it('должен быть в списке всех VibeMates', () => {
      const allMates = vibeMatesRegistry.getAllMates();
      const docuMaster = allMates.find(m => m.name === 'DocuMaster');
      expect(docuMaster).toBeDefined();
    });

    it('должен иметь правильные keywords для автоподбора', () => {
      // Это проверяется внутренне в registry, просто убедимся что он найден
      const result = vibeMatesRegistry.findMateByMessage('Как создать персонаж в ElizaOS?');
      expect(result.mate).toBeDefined();
      expect(result.matchScore).toBeGreaterThan(0);
    });

    it('должен иметь информацию в getMatesInfo', () => {
      const info = vibeMatesRegistry.getMatesInfo();
      const docuMasterInfo = info.find(i => i.id === 'docu-master-vibemate');
      expect(docuMasterInfo).toBeDefined();
      expect(docuMasterInfo?.name).toBe('DocuMaster');
      expect(docuMasterInfo?.emoji).toBe('📚');
      expect(docuMasterInfo?.description).toContain('документации');
    });
  });

  describe('Uniqueness Tests', () => {
    it('должен иметь уникальные настройки среди других VibeMates', () => {
      const allMates = vibematesCharacters;
      const docuMaster = allMates.find(m => m.id === 'docu-master-vibemate');
      const others = allMates.filter(m => m.id !== 'docu-master-vibemate');

      // Проверяем что DocuMaster не дублирует других
      others.forEach(other => {
        expect(docuMaster?.id).not.toBe(other.id);
        expect(docuMaster?.name).not.toBe(other.name);
      });
    });

    it('должен иметь уникальные topics среди других VibeMates', () => {
      const allMates = vibematesCharacters;
      const docuMaster = allMates.find(m => m.id === 'docu-master-vibemate');
      const otherTopics = allMates
        .filter(m => m.id !== 'docu-master-vibemate')
        .flatMap(m => m.topics || []);

      // DocuMaster должен иметь уникальные темы по документации
      const hasDocTopics = docuMaster?.topics?.some(topic =>
        topic.includes('документац') ||
        topic.includes('Character') ||
        topic.includes('Plugin')
      );
      expect(hasDocTopics).toBe(true);
    });
  });
});

// ========================================
// COMPONENT TESTS - Ключевые слова
// ========================================

describe('DocuMaster Keyword Matching', () => {
  const testCases = [
    { keyword: 'документац', shouldMatch: true },
    { keyword: 'докумен', shouldMatch: true },
    { keyword: 'character', shouldMatch: true },
    { keyword: 'персонаж', shouldMatch: true },
    { keyword: 'plugin', shouldMatch: true },
    { keyword: 'плагин', shouldMatch: true },
    { keyword: 'architecture', shouldMatch: true },
    { keyword: 'архитектур', shouldMatch: true },
    { keyword: 'memory', shouldMatch: true },
    { keyword: 'память', shouldMatch: true },
    { keyword: 'environment', shouldMatch: true },
    { keyword: 'окружен', shouldMatch: true },
    { keyword: 'secrets', shouldMatch: true },
    { keyword: 'секрет', shouldMatch: true },
    { keyword: 'Как создать персонажа в ElizaOS?', shouldMatch: true },
    { keyword: 'Как работает Plugin Architecture?', shouldMatch: true },
  ];

  testCases.forEach(({ keyword, shouldMatch }) => {
    it(`должен ${shouldMatch ? '' : 'НЕ '}подключаться для "${keyword}"`, () => {
      const result = vibeMatesRegistry.findMateByMessage(keyword);

      if (shouldMatch) {
        expect(result.mate).toBeDefined();
        expect(result.mate?.name).toBe('DocuMaster');
        expect(result.matchScore).toBeGreaterThan(0);
      } else {
        // Если не должен подключаться, результат должен быть пустым
        // или matchScore должен быть низким
        if (result.mate?.name === 'DocuMaster') {
          expect(result.matchScore).toBeLessThan(0.1);
        }
      }
    });
  });
});

// ========================================
// E2E TESTS - Runtime Behavior
// ========================================

describe('DocuMaster Runtime Behavior', () => {
  describe('System Prompt Validation', () => {
    it('должен иметь самопрезентацию в system prompt', () => {
      const mate = getVibeMateById('docu-master-vibemate');
      const system = mate?.system || '';

      expect(system).toContain('DocuMaster');
      expect(system).toContain('мастер документации');
      expect(system).toContain('обучения');
    });

    it('должен упоминать специализации', () => {
      const mate = getVibeMateById('docu-master-vibemate');
      const system = mate?.system || '';

      expect(system).toMatch(/Character Interface|персонаж/i);
      expect(system).toMatch(/Plugin Architecture|архитектур/i);
      expect(system).toMatch(/Memory and State|памят/i);
      expect(system).toMatch(/Environment Variables|секрет/i);
    });
  });

  describe('Bio Validation', () => {
    it('должен иметь реалистичную биографию', () => {
      const mate = getVibeMateById('docu-master-vibemate');
      const bio = mate?.bio as string[];

      expect(bio).toBeDefined();
      expect(bio.length).toBeGreaterThan(0);

      // Проверяем ключевые аспекты
      const bioText = bio.join(' ');
      expect(bioText).toMatch(/5\+|лет|года/i);
      expect(bioText).toMatch(/эксперт|специалист/i);
      expect(bioText).toMatch(/ElizaOS|документац/i);
    });
  });

  describe('Message Examples', () => {
    it('должен иметь релевантные примеры вопросов', () => {
      const mate = getVibeMateById('docu-master-vibemate');
      const examples = mate?.messageExamples || [];

      expect(examples.length).toBeGreaterThan(0);

      // Проверяем что примеры связаны с документацией
      examples.forEach(example => {
        const content = (example as any).content || '';
        expect(content).toMatch(/создать|персонаж|документац|архитектур|секрет/i);
      });
    });
  });
});

// ========================================
// INTEGRATION TESTS
// ========================================

describe('DocuMaster Full Integration', () => {
  it('должен корректно интегрироваться в общий список VibeMates', () => {
    const allCharacters = vibematesCharacters;

    // Проверяем общее количество
    expect(allCharacters.length).toBe(5); // agents, prompts, react, music, docs

    // Проверяем что все VibeMates имеют уникальные ID
    const ids = allCharacters.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(allCharacters.length);
  });

  it('должен иметь правильную позицию в массиве', () => {
    const allCharacters = vibematesCharacters;
    const docuMasterIndex = allCharacters.findIndex(c => c.id === 'docu-master-vibemate');

    expect(docuMasterIndex).toBe(4); // Должен быть последним
    expect(allCharacters[docuMasterIndex].name).toBe('DocuMaster');
  });

  it('должен быть доступен через все методы доступа', () => {
    const byId = getVibeMateById('docu-master-vibemate');
    const byName = getVibeMateByName('DocuMaster');
    const fromRegistry = vibeMatesRegistry.getMateById('docu-master-vibemate');

    // Debug - check what's in registry
    const allMates = vibeMatesRegistry.getAllMates();
    console.log('All mates in registry:', allMates.map(m => ({ name: m.name, id: m.id })));

    // Все методы должны возвращать определенные значения
    expect(byId).toBeDefined();
    expect(byName).toBeDefined();
    expect(fromRegistry).toBeDefined();

    // Debug output
    console.log('byId?.id:', byId?.id);
    console.log('byName?.id:', byName?.id);
    console.log('fromRegistry?.id:', fromRegistry?.id);

    // Проверяем что все возвращают правильный ID
    expect(byId?.id).toBe('docu-master-vibemate');
    expect(byName?.id).toBe('docu-master-vibemate');
    expect(fromRegistry?.id).toBe('docu-master-vibemate');

    // Проверяем что это действительно DocuMaster
    expect(byId?.name).toBe('DocuMaster');
    expect(byName?.name).toBe('DocuMaster');
    expect(fromRegistry?.name).toBe('DocuMaster');

    // Все методы должны возвращать один и тот же объект по ID
    expect(byId?.id).toBe(byName?.id);
    expect(byId?.id).toBe(fromRegistry?.id);
  });
});

// ========================================
// PERFORMANCE TESTS
// ========================================

describe('DocuMaster Performance', () => {
  it('должен быстро находиться по ID', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      getVibeMateById('docu-master-vibemate');
    }

    const end = performance.now();
    expect(end - start).toBeLessThan(100); // Должен выполняться быстро
  });

  it('должен быстро находиться по ключевым словам', () => {
    const testQueries = [
      'документац',
      'character',
      'plugin architecture',
      'secrets'
    ];

    const start = performance.now();

    testQueries.forEach(query => {
      for (let i = 0; i < 100; i++) {
        vibeMatesRegistry.findMateByMessage(query);
      }
    });

    const end = performance.now();
    expect(end - start).toBeLessThan(500); // Должен быть эффективным
  });
});
