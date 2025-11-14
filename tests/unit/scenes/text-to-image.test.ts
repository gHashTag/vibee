import { describe, it, expect, vi } from 'vitest';
import { textToImagePlugin } from '../../../src/plugins/scenes/text-to-image/plugin';

describe('Text to Image Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(textToImagePlugin.name).toBe('text-to-image-scene');
    expect(textToImagePlugin.type).toBe('scene');
    expect(textToImagePlugin.description).toContain('текст в изображение');
  });

  it('should have sceneId', () => {
    expect(textToImagePlugin.sceneId).toBe('textToImage');
  });

  it('should create scene', () => {
    const scene = textToImagePlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(textToImagePlugin.actions).toBeDefined();
  });
});
