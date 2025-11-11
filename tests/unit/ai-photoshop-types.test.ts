/**
 * Unit Tests for AI Photoshop Types
 */

import { describe, it, expect } from 'vitest';
import {
  CAMERA_ANGLE_PROMPTS,
  LIGHTING_SETUP_PROMPTS,
  FRAME_COMPOSITION_PROMPTS,
  type AIPhotoshopModel,
  type CameraAngle,
  type LightingSetup,
  type FrameComposition,
} from '../../src/ai-photoshop/types';

describe('AI Photoshop Types', () => {
  describe('Camera Angle Prompts', () => {
    it('should have all 12 camera angles', () => {
      const angles = Object.keys(CAMERA_ANGLE_PROMPTS);
      expect(angles).toHaveLength(12);
      expect(angles).toContain('medium_shot');
      expect(angles).toContain('close_up');
      expect(angles).toContain('extreme_close_up');
      expect(angles).toContain('wide_shot');
      expect(angles).toContain('high_angle');
      expect(angles).toContain('low_angle');
      expect(angles).toContain('dutch_angle');
      expect(angles).toContain('over_shoulder');
      expect(angles).toContain('profile_shot');
      expect(angles).toContain('three_quarter');
      expect(angles).toContain('bird_eye');
      expect(angles).toContain('macro_beauty');
    });

    it('should have valid prompt strings for all angles', () => {
      Object.entries(CAMERA_ANGLE_PROMPTS).forEach(([angle, prompt]) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('[camera:');
        expect(prompt).toContain(']');
      });
    });

    it('should have descriptive prompts', () => {
      expect(CAMERA_ANGLE_PROMPTS.close_up).toContain('intimate');
      expect(CAMERA_ANGLE_PROMPTS.wide_shot).toContain('environmental');
      expect(CAMERA_ANGLE_PROMPTS.macro_beauty).toContain('luxury');
    });
  });

  describe('Lighting Setup Prompts', () => {
    it('should have all 12 lighting setups', () => {
      const setups = Object.keys(LIGHTING_SETUP_PROMPTS);
      expect(setups).toHaveLength(12);
      expect(setups).toContain('soft_natural');
      expect(setups).toContain('dramatic');
      expect(setups).toContain('golden_hour');
      expect(setups).toContain('studio');
      expect(setups).toContain('rembrandt');
      expect(setups).toContain('butterfly');
      expect(setups).toContain('split');
      expect(setups).toContain('rim');
      expect(setups).toContain('candlelight');
      expect(setups).toContain('neon_noir');
      expect(setups).toContain('morning');
      expect(setups).toContain('sunset');
    });

    it('should have valid prompt strings for all setups', () => {
      Object.entries(LIGHTING_SETUP_PROMPTS).forEach(([setup, prompt]) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('[lighting:');
        expect(prompt).toContain(']');
      });
    });

    it('should have descriptive prompts', () => {
      expect(LIGHTING_SETUP_PROMPTS.golden_hour).toContain('warm');
      expect(LIGHTING_SETUP_PROMPTS.dramatic).toContain('contrast');
      expect(LIGHTING_SETUP_PROMPTS.studio).toContain('professional');
    });
  });

  describe('Frame Composition Prompts', () => {
    it('should have all 6 composition techniques', () => {
      const compositions = Object.keys(FRAME_COMPOSITION_PROMPTS);
      expect(compositions).toHaveLength(6);
      expect(compositions).toContain('center_weighted');
      expect(compositions).toContain('rule_thirds');
      expect(compositions).toContain('golden_ratio');
      expect(compositions).toContain('symmetrical');
      expect(compositions).toContain('negative_space');
      expect(compositions).toContain('leading_lines');
    });

    it('should have valid prompt strings for all compositions', () => {
      Object.entries(FRAME_COMPOSITION_PROMPTS).forEach(([comp, prompt]) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt).toContain('[composition:');
        expect(prompt).toContain(']');
      });
    });

    it('should have descriptive prompts', () => {
      expect(FRAME_COMPOSITION_PROMPTS.rule_thirds).toContain('dynamic');
      expect(FRAME_COMPOSITION_PROMPTS.golden_ratio).toContain('mathematical');
      expect(FRAME_COMPOSITION_PROMPTS.symmetrical).toContain('perfection');
    });
  });

  describe('Type Definitions', () => {
    it('should accept valid AI Photoshop models', () => {
      const validModels: AIPhotoshopModel[] = [
        'seedream',
        'nano_banana',
        'flux_multi_kontext',
        'qwen_edit_plus',
        'flux_kontext_pro',
        'seededit_3',
        'qwen_image_edit',
      ];

      validModels.forEach((model) => {
        expect(typeof model).toBe('string');
      });
    });

    it('should accept valid camera angles', () => {
      const validAngles: CameraAngle[] = [
        'medium_shot',
        'close_up',
        'extreme_close_up',
        'wide_shot',
        'high_angle',
        'low_angle',
        'dutch_angle',
        'over_shoulder',
        'profile_shot',
        'three_quarter',
        'bird_eye',
        'macro_beauty',
      ];

      validAngles.forEach((angle) => {
        expect(CAMERA_ANGLE_PROMPTS[angle]).toBeDefined();
      });
    });

    it('should accept valid lighting setups', () => {
      const validSetups: LightingSetup[] = [
        'soft_natural',
        'dramatic',
        'golden_hour',
        'studio',
        'rembrandt',
        'butterfly',
        'split',
        'rim',
        'candlelight',
        'neon_noir',
        'morning',
        'sunset',
      ];

      validSetups.forEach((setup) => {
        expect(LIGHTING_SETUP_PROMPTS[setup]).toBeDefined();
      });
    });

    it('should accept valid frame compositions', () => {
      const validComps: FrameComposition[] = [
        'center_weighted',
        'rule_thirds',
        'golden_ratio',
        'symmetrical',
        'negative_space',
        'leading_lines',
      ];

      validComps.forEach((comp) => {
        expect(FRAME_COMPOSITION_PROMPTS[comp]).toBeDefined();
      });
    });
  });

  describe('Prompt Format Consistency', () => {
    it('all camera prompts should follow same format', () => {
      Object.values(CAMERA_ANGLE_PROMPTS).forEach((prompt) => {
        expect(prompt).toMatch(/^\[camera:.*\]$/);
      });
    });

    it('all lighting prompts should follow same format', () => {
      Object.values(LIGHTING_SETUP_PROMPTS).forEach((prompt) => {
        expect(prompt).toMatch(/^\[lighting:.*\]$/);
      });
    });

    it('all composition prompts should follow same format', () => {
      Object.values(FRAME_COMPOSITION_PROMPTS).forEach((prompt) => {
        expect(prompt).toMatch(/^\[composition:.*\]$/);
      });
    });
  });
});
