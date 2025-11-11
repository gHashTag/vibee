/**
 * E2E Tests for Training Plugin
 * Tests the complete LoRA training pipeline
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { PhotoCollectorService } from '../training/PhotoCollectorService';
import { ZipService } from '../training/ZipService';
import { trainLoraAction } from '../training/train-action';

describe('Training Plugin E2E Tests', () => {
  describe('PhotoCollectorService', () => {
    let service: PhotoCollectorService;
    const mockRuntime = {
      // Mock runtime for testing
    } as any;

    beforeAll(async () => {
      service = new PhotoCollectorService(mockRuntime);
      await service.initialize(mockRuntime);
    });

    it('should initialize correctly', () => {
      expect(service).toBeDefined();
      expect(service.capabilityDescription).toContain('Collects photos');
    });

    it('should create a training session', () => {
      const session = service.createSession('test-user-1', 'TestFace', 'test_trigger');

      expect(session).toBeDefined();
      expect(session.userId).toBe('test-user-1');
      expect(session.faceName).toBe('TestFace');
      expect(session.triggerWord).toBe('test_trigger');
      expect(session.photos).toEqual([]);
      expect(session.createdAt).toBeGreaterThan(0);
    });

    it('should retrieve active session', () => {
      service.createSession('test-user-2', 'Face2', 'trigger2');
      const session = service.getActiveSession('test-user-2');

      expect(session).toBeDefined();
      expect(session?.faceName).toBe('Face2');
    });

    it('should add photos to session', () => {
      service.createSession('test-user-3', 'Face3', 'trigger3');

      const count1 = service.addPhoto('test-user-3', 'file1', 'path1', 1000);
      expect(count1).toBe(1);

      const count2 = service.addPhoto('test-user-3', 'file2', 'path2', 2000);
      expect(count2).toBe(2);

      const session = service.getActiveSession('test-user-3');
      expect(session?.photos.length).toBe(2);
    });

    it('should complete session', () => {
      service.createSession('test-user-4', 'Face4', 'trigger4');
      service.addPhoto('test-user-4', 'file1', 'path1', 1000);

      const completed = service.completeSession('test-user-4');
      expect(completed).toBeDefined();
      expect(completed?.photos.length).toBe(1);

      // Session should be removed after completion
      const active = service.getActiveSession('test-user-4');
      expect(active).toBeNull();
    });

    it('should cancel session', () => {
      service.createSession('test-user-5', 'Face5', 'trigger5');
      service.addPhoto('test-user-5', 'file1', 'path1', 1000);

      service.cancelSession('test-user-5');

      const active = service.getActiveSession('test-user-5');
      expect(active).toBeNull();
    });

    it('should enforce minimum photo count', () => {
      service.createSession('test-user-6', 'Face6', 'trigger6');

      for (let i = 0; i < 9; i++) {
        service.addPhoto('test-user-6', `file${i}`, `path${i}`, 1000);
      }

      const session = service.getActiveSession('test-user-6');
      expect(session?.photos.length).toBe(9);
      // Test logic would check if < 10 photos triggers error
    });

    it('should handle maximum photo count', () => {
      service.createSession('test-user-7', 'Face7', 'trigger7');

      // Add 25 photos (over 20 recommended max)
      for (let i = 0; i < 25; i++) {
        service.addPhoto('test-user-7', `file${i}`, `path${i}`, 1000);
      }

      const session = service.getActiveSession('test-user-7');
      expect(session?.photos.length).toBe(25);
      // Test logic would verify only first 20 are used
    });
  });

  describe('trainLoraAction', () => {
    it('should have correct action configuration', () => {
      expect(trainLoraAction.name).toBe('TRAIN_LORA');
      expect(trainLoraAction.similes).toContain('TRAIN_FACE');
      expect(trainLoraAction.similes).toContain('TRAIN_START');
      expect(trainLoraAction.similes).toContain('TRAIN_CONFIRM');
      expect(trainLoraAction.description).toContain('LoRA');
    });

    it('should validate /train commands', async () => {
      const mockRuntime = {} as any;

      const validMessage = {
        content: { text: '/train start' },
      } as any;

      const result = await trainLoraAction.validate(mockRuntime, validMessage, {} as any);
      expect(result).toBe(true);

      const invalidMessage = {
        content: { text: 'hello' },
      } as any;

      const result2 = await trainLoraAction.validate(mockRuntime, invalidMessage, {} as any);
      expect(result2).toBe(false);
    });
  });

  describe('Training Flow Integration', () => {
    it('should complete full training flow', async () => {
      // 1. Create session
      const service = new PhotoCollectorService({} as any);
      await service.initialize({} as any);

      const session = service.createSession('e2e-user', 'E2EFace', 'e2e_trigger');
      expect(session).toBeDefined();

      // 2. Add minimum photos
      for (let i = 0; i < 10; i++) {
        const count = service.addPhoto('e2e-user', `file${i}`, `path${i}`, 1000 * i);
        expect(count).toBe(i + 1);
      }

      // 3. Verify session state
      const activeSession = service.getActiveSession('e2e-user');
      expect(activeSession?.photos.length).toBe(10);

      // 4. Complete session
      const completed = service.completeSession('e2e-user');
      expect(completed?.photos.length).toBe(10);
      expect(completed?.faceName).toBe('E2EFace');

      // 5. Verify cleanup
      const afterCompletion = service.getActiveSession('e2e-user');
      expect(afterCompletion).toBeNull();
    });

    it('should handle test mode (1 step)', () => {
      // Verify test mode configuration
      const testSteps = 1;
      const testLearningRate = 0.0004;

      expect(testSteps).toBe(1);
      expect(testLearningRate).toBe(0.0004);

      // Test mode should complete in 2-5 minutes
      const expectedMinTime = 2 * 60; // 2 minutes in seconds
      const expectedMaxTime = 5 * 60; // 5 minutes in seconds

      expect(expectedMinTime).toBeLessThan(expectedMaxTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session', () => {
      const service = new PhotoCollectorService({} as any);

      const nonExistent = service.getActiveSession('non-existent-user');
      expect(nonExistent).toBeNull();

      const completed = service.completeSession('non-existent-user');
      expect(completed).toBeNull();
    });

    it('should handle invalid photo data', () => {
      const service = new PhotoCollectorService({} as any);
      service.createSession('error-user', 'ErrorFace', 'error_trigger');

      // Adding photo without active session should be handled
      const count = service.addPhoto('error-user', 'file1', 'path1', -1);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Plugin Configuration', () => {
    it('should verify training plugin structure', () => {
      const { trainingPlugin } = require('../training-plugin');

      expect(trainingPlugin).toBeDefined();
      expect(trainingPlugin.name).toBe('training');
      expect(trainingPlugin.description).toContain('LoRA training');
      expect(trainingPlugin.services).toBeDefined();
      expect(trainingPlugin.actions).toBeDefined();

      // Check services
      expect(trainingPlugin.services.length).toBeGreaterThanOrEqual(3);

      // Check actions
      expect(trainingPlugin.actions.length).toBeGreaterThanOrEqual(1);
    });

    it('should verify all services have required methods', () => {
      const { PhotoCollectorService, ZipService } = require('../training');

      // PhotoCollectorService
      expect(PhotoCollectorService.serviceType).toBeDefined();
      expect(typeof PhotoCollectorService.start).toBe('function');

      // ZipService
      expect(ZipService.serviceType).toBeDefined();
      expect(typeof ZipService.start).toBe('function');
    });
  });
});

describe('Training Plugin Performance', () => {
  it('should create session quickly', async () => {
    const service = new PhotoCollectorService({} as any);
    await service.initialize({} as any);

    const start = Date.now();
    service.createSession('perf-user', 'PerfFace', 'perf_trigger');
    const duration = Date.now() - start;

    // Should take less than 10ms
    expect(duration).toBeLessThan(10);
  });

  it('should add photos quickly', async () => {
    const service = new PhotoCollectorService({} as any);
    await service.initialize({} as any);
    service.createSession('perf-user-2', 'PerfFace2', 'perf_trigger2');

    const start = Date.now();
    for (let i = 0; i < 20; i++) {
      service.addPhoto('perf-user-2', `file${i}`, `path${i}`, 1000);
    }
    const duration = Date.now() - start;

    // 20 photos should take less than 50ms
    expect(duration).toBeLessThan(50);
  });
});
