/**
 * Debug test for keyword matching
 */

import { describe, it, expect } from 'bun:test';
import { vibeMatesRegistry } from '../src/academy/vibemates/vibemates-registry';

describe('Keyword Debug', () => {
  it('should debug keyword matching for "secrets"', () => {
    const result = vibeMatesRegistry.findMateByMessage('secrets');

    console.log('🔍 Keyword Debug for "secrets":');
    console.log('Result:', result);

    // Get all keywords
    const allMates = vibeMatesRegistry.getAllMates();
    console.log('\n📝 All VibeMates:');
    allMates.forEach(mate => {
      console.log(`- ${mate.name} (${mate.id})`);
    });
  });

  it('should test all keywords individually', () => {
    const keywords = ['secrets', 'секрет', 'character', 'plugin'];

    keywords.forEach(keyword => {
      const result = vibeMatesRegistry.findMateByMessage(keyword);
      console.log(`🔍 "${keyword}" -> ${result.mate?.name} (score: ${result.matchScore.toFixed(4)})`);
    });
  });

  it('should test specific failing case', () => {
    const query = 'Как создать персонажа в ElizaOS?';
    const result = vibeMatesRegistry.findMateByMessage(query);

    console.log(`\n🔍 Debugging "${query}":`);
    console.log('Result:', result.mate?.name, 'score:', result.matchScore.toFixed(4));

    // Test individual keywords from DocuMaster
    const docKeywords = ['как создать', 'как настроить', 'character', 'персонаж'];
    docKeywords.forEach(kw => {
      const testResult = vibeMatesRegistry.findMateByMessage(kw);
      console.log(`  "${kw}" -> ${testResult.mate?.name} (score: ${testResult.matchScore.toFixed(4)})`);
    });
  });
});
