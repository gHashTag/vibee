import { describe, it, expect, vi } from 'vitest';
import { imageToVideoPlugin } from '../../../src/plugins/scenes/image-to-video/plugin';

describe('Image to Video Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(imageToVideoPlugin.name).toBe('image-to-video-scene');
    expect(imageToVideoPlugin.type).toBe('scene');
    expect(imageToVideoPlugin.description).toContain('видео из изображения');
  });

  it('should have sceneId', () => {
    expect(imageToVideoPlugin.sceneId).toBe('imageToVideo');
  });

  it('should create scene', () => {
    const scene = imageToVideoPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(imageToVideoPlugin.actions).toBeDefined();
  });
});
