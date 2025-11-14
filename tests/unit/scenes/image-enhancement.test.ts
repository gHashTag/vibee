import { describe, it, expect, vi } from 'vitest';
import { imageEnhancementPlugin } from '../../../src/plugins/scenes/image-enhancement/plugin';

describe('Image Enhancement Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(imageEnhancementPlugin.name).toBe('image-enhancement-scene');
    expect(imageEnhancementPlugin.type).toBe('scene');
    expect(imageEnhancementPlugin.description).toContain('улучшение изображений');
  });

  it('should have sceneId', () => {
    expect(imageEnhancementPlugin.sceneId).toBe('imageEnhancement');
  });

  it('should create scene', () => {
    const scene = imageEnhancementPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(imageEnhancementPlugin.actions).toBeDefined();
  });
});
