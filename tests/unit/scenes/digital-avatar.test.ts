import { describe, it, expect, vi } from 'vitest';
import { digitalAvatarPlugin } from '../../../src/plugins/scenes/digital-avatar/plugin';

describe('Digital Avatar Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(digitalAvatarPlugin.name).toBe('digital-avatar-scene');
    expect(digitalAvatarPlugin.type).toBe('scene');
    expect(digitalAvatarPlugin.description).toContain('цифровой аватар');
  });

  it('should have sceneId', () => {
    expect(digitalAvatarPlugin.sceneId).toBe('digitalAvatar');
  });

  it('should create scene', () => {
    const scene = digitalAvatarPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(digitalAvatarPlugin.actions).toBeDefined();
    expect(Array.isArray(digitalAvatarPlugin.actions)).toBe(true);
  });
});
