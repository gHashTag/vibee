import { describe, it, expect, vi } from 'vitest';
import { aiPhotoshopPlugin } from '../../../src/plugins/scenes/ai-photoshop/plugin';

describe('AI Photoshop Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(aiPhotoshopPlugin.name).toBe('ai-photoshop-scene');
    expect(aiPhotoshopPlugin.version).toBe('1.0.0');
    expect(aiPhotoshopPlugin.type).toBe('scene');
    expect(aiPhotoshopPlugin.description).toContain('AI обработка');
  });

  it('should have sceneId', () => {
    expect(aiPhotoshopPlugin.sceneId).toBe('aiPhotoshop');
  });

  it('should create scene', () => {
    const scene = aiPhotoshopPlugin.createScene();
    expect(scene).toBeDefined();
    expect(scene.id).toBe('aiPhotoshop');
  });

  it('should have actions', () => {
    expect(aiPhotoshopPlugin.actions).toBeDefined();
    expect(Array.isArray(aiPhotoshopPlugin.actions)).toBe(true);
  });
});
