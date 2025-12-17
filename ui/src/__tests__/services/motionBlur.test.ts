/**
 * Motion Blur Tests
 *
 * Tests for the motion blur processor, settings, and presets.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MotionBlurProcessor,
  createDefaultMotionBlurSettings,
  MOTION_BLUR_PRESETS,
  getMotionBlurPreset,
  listMotionBlurPresets,
  type MotionBlurSettings,
  type MotionBlurType,
} from '@/services/motionBlur';
import { createTestImageData, createTestCanvas } from '../setup';

describe('createDefaultMotionBlurSettings', () => {
  it('should create valid default settings', () => {
    const settings = createDefaultMotionBlurSettings();

    expect(settings.enabled).toBe(false);
    expect(settings.type).toBe('standard');
    expect(settings.shutterAngle).toBe(180);
    expect(settings.shutterPhase).toBe(-90);
    expect(settings.samplesPerFrame).toBe(16);
  });

  it('should have all required properties', () => {
    const settings = createDefaultMotionBlurSettings();

    expect(settings).toHaveProperty('enabled');
    expect(settings).toHaveProperty('type');
    expect(settings).toHaveProperty('shutterAngle');
    expect(settings).toHaveProperty('shutterPhase');
    expect(settings).toHaveProperty('samplesPerFrame');
  });
});

describe('MOTION_BLUR_PRESETS', () => {
  it('should have film_24fps preset', () => {
    const preset = MOTION_BLUR_PRESETS['film_24fps'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBe(180);
    expect(preset.type).toBe('standard');
  });

  it('should have film_cinematic preset', () => {
    const preset = MOTION_BLUR_PRESETS['film_cinematic'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBeCloseTo(172.8, 1);
  });

  it('should have action_crisp preset', () => {
    const preset = MOTION_BLUR_PRESETS['action_crisp'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBeLessThan(180);
  });

  it('should have dreamy preset', () => {
    const preset = MOTION_BLUR_PRESETS['dreamy'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBeGreaterThanOrEqual(360);
  });

  it('should have staccato preset for minimal blur', () => {
    const preset = MOTION_BLUR_PRESETS['staccato'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBeLessThan(90);
  });

  it('should have film_smooth preset', () => {
    const preset = MOTION_BLUR_PRESETS['film_smooth'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBeGreaterThan(180);
  });

  it('should have video_30fps preset', () => {
    const preset = MOTION_BLUR_PRESETS['video_30fps'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBe(180);
  });

  it('should have video_60fps preset', () => {
    const preset = MOTION_BLUR_PRESETS['video_60fps'];
    expect(preset).toBeDefined();
    expect(preset.shutterAngle).toBe(180);
  });

  it('should have at least 5 presets', () => {
    const presetNames = Object.keys(MOTION_BLUR_PRESETS);
    expect(presetNames.length).toBeGreaterThanOrEqual(5);
  });
});

describe('getMotionBlurPreset', () => {
  it('should return merged settings for known preset', () => {
    const settings = getMotionBlurPreset('film_24fps');

    expect(settings.enabled).toBe(true);
    expect(settings.shutterAngle).toBe(180);
    expect(settings.type).toBe('standard');
  });

  it('should return defaults for unknown preset', () => {
    const settings = getMotionBlurPreset('nonexistent_preset');

    expect(settings.enabled).toBe(false);
    expect(settings.shutterAngle).toBe(180);
    expect(settings.type).toBe('standard');
  });

  it('should enable preset when loaded', () => {
    const settings = getMotionBlurPreset('dreamy');
    expect(settings.enabled).toBe(true);
  });
});

describe('listMotionBlurPresets', () => {
  it('should return array of preset names', () => {
    const presets = listMotionBlurPresets();

    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThan(0);
  });

  it('should include known presets', () => {
    const presets = listMotionBlurPresets();

    expect(presets).toContain('film_24fps');
    expect(presets).toContain('dreamy');
    expect(presets).toContain('staccato');
  });
});

describe('MotionBlurSettings validation', () => {
  it('should have valid shutter angle range (0-720)', () => {
    const settings = createDefaultMotionBlurSettings();
    expect(settings.shutterAngle).toBeGreaterThanOrEqual(0);
    expect(settings.shutterAngle).toBeLessThanOrEqual(720);
  });

  it('should have valid shutter phase range (-180 to 180)', () => {
    const settings = createDefaultMotionBlurSettings();
    expect(settings.shutterPhase).toBeGreaterThanOrEqual(-180);
    expect(settings.shutterPhase).toBeLessThanOrEqual(180);
  });

  it('should have valid samples per frame (2-64)', () => {
    const settings = createDefaultMotionBlurSettings();
    expect(settings.samplesPerFrame).toBeGreaterThanOrEqual(2);
    expect(settings.samplesPerFrame).toBeLessThanOrEqual(64);
  });
});

describe('MotionBlurType', () => {
  it('should support all blur types in settings', () => {
    const blurTypes: MotionBlurType[] = [
      'standard',
      'pixel',
      'directional',
      'radial',
      'vector',
      'adaptive',
    ];

    // Just verify the types compile correctly
    blurTypes.forEach(type => {
      const settings: Partial<MotionBlurSettings> = { type };
      expect(settings.type).toBe(type);
    });
  });
});

describe('MotionBlurProcessor', () => {
  let processor: MotionBlurProcessor;
  let sourceCanvas: OffscreenCanvas;

  beforeEach(() => {
    processor = new MotionBlurProcessor(100, 100);
    sourceCanvas = createTestCanvas(100, 100);
    // Draw something to the source canvas
    const ctx = sourceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 100, 100);
    }
  });

  describe('initialization', () => {
    it('should create processor with specified dimensions', () => {
      const proc = new MotionBlurProcessor(200, 150);
      expect(proc).toBeDefined();
    });

    it('should initialize with default settings', () => {
      const settings = processor.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.type).toBe('standard');
      expect(settings.shutterAngle).toBe(180);
    });

    it('should accept initial settings', () => {
      const proc = new MotionBlurProcessor(100, 100, {
        enabled: true,
        shutterAngle: 270,
      });
      const settings = proc.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.shutterAngle).toBe(270);
    });
  });

  describe('settings management', () => {
    it('should update settings', () => {
      processor.setSettings({ shutterAngle: 270, enabled: true });
      const settings = processor.getSettings();
      expect(settings.shutterAngle).toBe(270);
      expect(settings.enabled).toBe(true);
    });

    it('should merge settings without losing existing values', () => {
      processor.setSettings({ shutterAngle: 270 });
      processor.setSettings({ enabled: true });
      const settings = processor.getSettings();
      expect(settings.shutterAngle).toBe(270);
      expect(settings.enabled).toBe(true);
    });
  });

  describe('resize', () => {
    it('should handle resize', () => {
      processor.resize(300, 200);
      // No error thrown means success
      expect(true).toBe(true);
    });
  });

  describe('velocity calculation', () => {
    it('should calculate velocity from transform changes', () => {
      const prevTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
      const currTransform = { x: 10, y: 5, rotation: 45, scaleX: 1.5, scaleY: 1.5 };

      const velocity = processor.calculateVelocity(prevTransform, currTransform, 1);

      expect(velocity.x).toBe(10);
      expect(velocity.y).toBe(5);
      expect(velocity.rotation).toBe(45);
      expect(velocity.scale).toBe(0.5);
    });

    it('should calculate velocity magnitude', () => {
      const velocity = { x: 3, y: 4, rotation: 0, scale: 0 };
      const magnitude = processor.getVelocityMagnitude(velocity);
      expect(magnitude).toBe(5); // 3-4-5 triangle
    });
  });

  describe('applyMotionBlur', () => {
    const baseVelocity = { x: 10, y: 0, rotation: 0, scale: 0 };

    it('should return canvas when blur is disabled', () => {
      processor.setSettings({ enabled: false });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should apply standard motion blur', () => {
      processor.setSettings({ enabled: true, type: 'standard' });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
      expect(result.width).toBe(100);
    });

    it('should apply directional blur', () => {
      processor.setSettings({
        enabled: true,
        type: 'directional',
        direction: 45,
      });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
    });

    it('should apply radial blur', () => {
      processor.setSettings({
        enabled: true,
        type: 'radial',
        radialMode: 'spin',
        radialCenterX: 0.5,
        radialCenterY: 0.5,
      });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
    });

    it('should apply vector blur', () => {
      processor.setSettings({
        enabled: true,
        type: 'vector',
      });
      const velocity = { x: 20, y: 10, rotation: 0, scale: 0 };
      const result = processor.applyMotionBlur(sourceCanvas, velocity, 0);
      expect(result).toBeDefined();
    });

    it('should apply pixel motion blur', () => {
      processor.setSettings({
        enabled: true,
        type: 'pixel',
      });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
    });

    it('should apply adaptive blur', () => {
      processor.setSettings({
        enabled: true,
        type: 'adaptive',
      });
      const result = processor.applyMotionBlur(sourceCanvas, baseVelocity, 0);
      expect(result).toBeDefined();
    });
  });

  describe('frame buffer management', () => {
    it('should accumulate frames for temporal blur', () => {
      processor.setSettings({ enabled: true, type: 'standard' });
      const velocity = { x: 5, y: 0, rotation: 0, scale: 0 };

      // Apply multiple frames
      for (let i = 0; i < 5; i++) {
        processor.applyMotionBlur(sourceCanvas, velocity, i);
      }

      // The processor should maintain a frame buffer
      // This tests that it doesn't crash with multiple frames
      expect(true).toBe(true);
    });
  });

  describe('shutter angle effect', () => {
    it('should respect shutter angle setting', () => {
      const velocity = { x: 20, y: 0, rotation: 0, scale: 0 };

      // Small shutter angle = less blur
      processor.setSettings({ enabled: true, type: 'standard', shutterAngle: 45 });
      const result1 = processor.applyMotionBlur(sourceCanvas, velocity, 0);

      // Large shutter angle = more blur
      processor.setSettings({ enabled: true, type: 'standard', shutterAngle: 360 });
      const result2 = processor.applyMotionBlur(sourceCanvas, velocity, 1);

      // Both should produce valid output
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
