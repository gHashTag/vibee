import { describe, it, expect, vi } from 'vitest';
import { lipSyncPlugin } from '../../../src/plugins/scenes/lip-sync-scene/plugin';

describe('Lip Sync Scene', () => {
  it('should have correct plugin metadata', () => {
    expect(lipSyncPlugin.name).toBe('lip-sync-scene');
    expect(lipSyncPlugin.type).toBe('scene');
    expect(lipSyncPlugin.description).toContain('синхронизация губ');
  });

  it('should have sceneId', () => {
    expect(lipSyncPlugin.sceneId).toBe('lipSync');
  });

  it('should create scene', () => {
    const scene = lipSyncPlugin.createScene();
    expect(scene).toBeDefined();
  });

  it('should have actions', () => {
    expect(lipSyncPlugin.actions).toBeDefined();
  });
});
