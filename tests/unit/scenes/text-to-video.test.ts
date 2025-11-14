import { describe, it, expect, vi } from 'vitest';
import { textToVideoPlugin } from '../../../src/plugins/scenes/text-to-video/plugin';

describe('Text to Video Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(textToVideoPlugin.name).toBe('text-to-video-scene');
    expect(textToVideoPlugin.type).toBe('scene');
    expect(textToVideoPlugin.description).toContain('текст в видео');
  });

  it('should have sceneId', () => {
    expect(textToVideoPlugin.sceneId).toBe('textToVideo');
  });

  it('should create scene', () => {
    const scene = textToVideoPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(textToVideoPlugin.actions).toBeDefined();
  });
});
