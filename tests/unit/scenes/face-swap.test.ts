import { describe, it, expect, vi } from 'vitest';
import { faceSwapPlugin } from '../../../src/plugins/scenes/face-swap/plugin';

describe('Face Swap Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(faceSwapPlugin.name).toBe('face-swap-scene');
    expect(faceSwapPlugin.type).toBe('scene');
    expect(faceSwapPlugin.description).toContain('замена лица');
  });

  it('should have sceneId', () => {
    expect(faceSwapPlugin.sceneId).toBe('faceSwap');
  });

  it('should create scene', () => {
    const scene = faceSwapPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(faceSwapPlugin.actions).toBeDefined();
  });
});
