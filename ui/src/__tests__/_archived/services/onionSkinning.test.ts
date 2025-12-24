/**
 * Onion Skinning Service Tests
 *
 * Production-level tests verifying:
 * - Opacity calculations with different falloff modes
 * - Frame calculation logic
 * - Color parsing
 * - Service configuration
 * - Preset application
 * - Edge cases (boundaries, empty inputs)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  OnionSkinningService,
  calculateOpacity,
  parseColor,
  calculateOnionSkinFrames,
  DEFAULT_ONION_SKIN_CONFIG,
  ONION_SKIN_PRESETS,
  type OnionSkinConfig,
  type OnionSkinFrame,
} from '@/services/onionSkinning';

describe('OnionSkinning', () => {
  // ============================================================================
  // OPACITY CALCULATIONS
  // ============================================================================

  describe('calculateOpacity', () => {
    it('should return maxOpacity at distance 0', () => {
      const result = calculateOpacity(0, 5, 'linear', 0.8, 0.1);
      expect(result).toBe(0.8);
    });

    it('should return 0 when distance exceeds maxFrames', () => {
      const result = calculateOpacity(10, 5, 'linear', 0.8, 0.1);
      expect(result).toBe(0);
    });

    it('should calculate linear falloff correctly', () => {
      // At distance 2 of 4 frames, should be 50% of max
      const result = calculateOpacity(2, 4, 'linear', 0.8, 0.1);
      // Linear: 0.8 * (1 - 2/4) = 0.8 * 0.5 = 0.4
      expect(result).toBeCloseTo(0.4, 5);
    });

    it('should calculate exponential falloff correctly', () => {
      // Exponential: maxOpacity * e^(-2 * normalizedDist)
      const result = calculateOpacity(2, 4, 'exponential', 0.8, 0.1);
      // normalizedDist = 2/4 = 0.5
      // 0.8 * e^(-2 * 0.5) = 0.8 * e^-1 ≈ 0.8 * 0.3679 ≈ 0.294
      expect(result).toBeGreaterThan(0.2);
      expect(result).toBeLessThan(0.4);
    });

    it('should return constant opacity regardless of distance', () => {
      const result1 = calculateOpacity(1, 5, 'constant', 0.6, 0.1);
      const result2 = calculateOpacity(4, 5, 'constant', 0.6, 0.1);

      expect(result1).toBe(0.6);
      expect(result2).toBe(0.6);
    });

    it('should clamp to minOpacity', () => {
      // Linear falloff at distance 4 of 5: 0.5 * (1 - 4/5) = 0.5 * 0.2 = 0.1
      // This equals minOpacity, so should still be returned
      const result = calculateOpacity(4, 5, 'linear', 0.5, 0.1);
      expect(result).toBeGreaterThanOrEqual(0.1);
    });

    it('should respect minOpacity floor', () => {
      // Very close to maxFrames should not go below minOpacity
      const result = calculateOpacity(4, 5, 'exponential', 0.8, 0.2);
      expect(result).toBeGreaterThanOrEqual(0.2);
    });
  });

  // ============================================================================
  // COLOR PARSING
  // ============================================================================

  describe('parseColor', () => {
    it('should parse 6-digit hex colors', () => {
      const result = parseColor('#ff4444');
      expect(result.r).toBeCloseTo(1, 2);
      expect(result.g).toBeCloseTo(0.267, 2);
      expect(result.b).toBeCloseTo(0.267, 2);
    });

    it('should parse 3-digit hex colors', () => {
      const result = parseColor('#f00');
      expect(result.r).toBe(1);
      expect(result.g).toBe(0);
      expect(result.b).toBe(0);
    });

    it('should parse rgb() colors', () => {
      const result = parseColor('rgb(128, 64, 255)');
      expect(result.r).toBeCloseTo(0.502, 2);
      expect(result.g).toBeCloseTo(0.251, 2);
      expect(result.b).toBe(1);
    });

    it('should parse rgba() colors', () => {
      const result = parseColor('rgba(255, 128, 0, 0.5)');
      expect(result.r).toBe(1);
      expect(result.g).toBeCloseTo(0.502, 2);
      expect(result.b).toBe(0);
    });

    it('should return white for invalid colors', () => {
      const result = parseColor('invalid');
      expect(result.r).toBe(1);
      expect(result.g).toBe(1);
      expect(result.b).toBe(1);
    });
  });

  // ============================================================================
  // FRAME CALCULATION
  // ============================================================================

  describe('calculateOnionSkinFrames', () => {
    const baseConfig: OnionSkinConfig = {
      ...DEFAULT_ONION_SKIN_CONFIG,
      enabled: true,
      framesBefore: 3,
      framesAfter: 2,
      maxOpacity: 0.5,
      minOpacity: 0.1,
      spacing: 1,
      keyframesOnly: false,
    };

    it('should return empty array when disabled', () => {
      const config = { ...baseConfig, enabled: false };
      const result = calculateOnionSkinFrames(30, 100, config);
      expect(result).toHaveLength(0);
    });

    it('should calculate correct before frames', () => {
      const result = calculateOnionSkinFrames(30, 100, baseConfig);
      const beforeFrames = result.filter(f => f.direction === 'before');

      expect(beforeFrames.length).toBe(3);
      expect(beforeFrames.map(f => f.frame)).toContain(29);
      expect(beforeFrames.map(f => f.frame)).toContain(28);
      expect(beforeFrames.map(f => f.frame)).toContain(27);
    });

    it('should calculate correct after frames', () => {
      const result = calculateOnionSkinFrames(30, 100, baseConfig);
      const afterFrames = result.filter(f => f.direction === 'after');

      expect(afterFrames.length).toBe(2);
      expect(afterFrames.map(f => f.frame)).toContain(31);
      expect(afterFrames.map(f => f.frame)).toContain(32);
    });

    it('should not include frames before frame 0', () => {
      const result = calculateOnionSkinFrames(1, 100, baseConfig);
      const beforeFrames = result.filter(f => f.direction === 'before');

      // At frame 1 with 3 framesBefore, only frame 0 is valid
      expect(beforeFrames.length).toBe(1);
      expect(beforeFrames[0].frame).toBe(0);
    });

    it('should not include frames beyond totalFrames', () => {
      const result = calculateOnionSkinFrames(98, 100, baseConfig);
      const afterFrames = result.filter(f => f.direction === 'after');

      // At frame 98 with totalFrames=100, only frame 99 is valid
      expect(afterFrames.length).toBe(1);
      expect(afterFrames[0].frame).toBe(99);
    });

    it('should apply correct tint colors', () => {
      const config = {
        ...baseConfig,
        beforeColor: '#ff0000',
        afterColor: '#00ff00',
      };
      const result = calculateOnionSkinFrames(30, 100, config);

      const beforeFrames = result.filter(f => f.direction === 'before');
      const afterFrames = result.filter(f => f.direction === 'after');

      beforeFrames.forEach(f => expect(f.tintColor).toBe('#ff0000'));
      afterFrames.forEach(f => expect(f.tintColor).toBe('#00ff00'));
    });

    it('should apply frame spacing correctly', () => {
      const config = { ...baseConfig, spacing: 2, framesBefore: 4 };
      const result = calculateOnionSkinFrames(30, 100, config);
      const beforeFrames = result.filter(f => f.direction === 'before');

      // Spacing 2: frames 28, 26, 24, 22 (offset by 2, 4, 6, 8)
      const frames = beforeFrames.map(f => f.frame).sort((a, b) => b - a);
      expect(frames).toEqual([28, 26, 24, 22]);
    });

    it('should sort frames by distance (furthest first)', () => {
      const result = calculateOnionSkinFrames(30, 100, baseConfig);

      // Should be sorted by distance descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].distance).toBeGreaterThanOrEqual(result[i + 1].distance);
      }
    });

    it('should filter by keyframes when keyframesOnly is true', () => {
      const config = { ...baseConfig, keyframesOnly: true, framesBefore: 10 };
      const keyframeFrames = [10, 20, 25, 40, 50];

      const result = calculateOnionSkinFrames(30, 100, config, keyframeFrames);
      const beforeFrames = result.filter(f => f.direction === 'before');

      // Only keyframes before 30: 10, 20, 25
      beforeFrames.forEach(f => {
        expect(keyframeFrames).toContain(f.frame);
        expect(f.frame).toBeLessThan(30);
      });
    });

    it('should calculate decreasing opacity with distance', () => {
      const config = { ...baseConfig, opacityFalloff: 'linear' as const };
      const result = calculateOnionSkinFrames(30, 100, config);

      const beforeFrames = result
        .filter(f => f.direction === 'before')
        .sort((a, b) => a.distance - b.distance);

      // Closer frames should have higher opacity
      for (let i = 0; i < beforeFrames.length - 1; i++) {
        expect(beforeFrames[i].opacity).toBeGreaterThanOrEqual(beforeFrames[i + 1].opacity);
      }
    });
  });

  // ============================================================================
  // SERVICE CLASS
  // ============================================================================

  describe('OnionSkinningService', () => {
    let service: OnionSkinningService;

    beforeEach(() => {
      service = new OnionSkinningService();
    });

    afterEach(() => {
      service.reset();
    });

    it('should initialize with default config', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.framesBefore).toBe(DEFAULT_ONION_SKIN_CONFIG.framesBefore);
      expect(config.framesAfter).toBe(DEFAULT_ONION_SKIN_CONFIG.framesAfter);
    });

    it('should update config partially', () => {
      service.setConfig({ framesBefore: 5, maxOpacity: 0.7 });
      const config = service.getConfig();

      expect(config.framesBefore).toBe(5);
      expect(config.maxOpacity).toBe(0.7);
      // Other values should remain default
      expect(config.framesAfter).toBe(DEFAULT_ONION_SKIN_CONFIG.framesAfter);
    });

    it('should enable/disable via convenience method', () => {
      expect(service.isEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);

      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);
    });

    it('should apply preset correctly', () => {
      service.applyPreset('traditional');
      const config = service.getConfig();

      expect(config.framesBefore).toBe(ONION_SKIN_PRESETS.traditional.framesBefore);
      expect(config.framesAfter).toBe(ONION_SKIN_PRESETS.traditional.framesAfter);
    });

    it('should not crash on unknown preset', () => {
      expect(() => service.applyPreset('nonexistent')).not.toThrow();
    });

    it('should cache keyframes correctly', () => {
      service.cacheKeyframes('layer1', [0, 10, 20, 30]);
      service.cacheKeyframes('layer2', [5, 15, 25]);

      const allKeyframes = service.getAllKeyframeFrames();

      expect(allKeyframes).toContain(0);
      expect(allKeyframes).toContain(5);
      expect(allKeyframes).toContain(10);
      expect(allKeyframes).toContain(15);
      expect(allKeyframes).toContain(20);
      expect(allKeyframes).toContain(25);
      expect(allKeyframes).toContain(30);
    });

    it('should return sorted unique keyframes', () => {
      service.cacheKeyframes('layer1', [30, 10, 20]);
      service.cacheKeyframes('layer2', [20, 40, 10]); // Has duplicates with layer1

      const allKeyframes = service.getAllKeyframeFrames();

      // Should be sorted and unique
      expect(allKeyframes).toEqual([10, 20, 30, 40]);
    });

    it('should clear keyframe cache', () => {
      service.cacheKeyframes('layer1', [0, 10, 20]);
      service.clearKeyframeCache();

      const allKeyframes = service.getAllKeyframeFrames();
      expect(allKeyframes).toHaveLength(0);
    });

    it('should get render data with correct structure', () => {
      service.setEnabled(true);
      service.setConfig({ framesBefore: 2, framesAfter: 1 });

      const renderData = service.getRenderData(30, 100);

      expect(renderData.currentFrame).toBe(30);
      expect(renderData.frames.length).toBeGreaterThan(0);
      expect(renderData.config.enabled).toBe(true);
    });

    it('should return empty frames when disabled', () => {
      service.setEnabled(false);

      const renderData = service.getRenderData(30, 100);

      expect(renderData.frames).toHaveLength(0);
    });

    it('should reset to defaults', () => {
      service.setConfig({ enabled: true, framesBefore: 10 });
      service.cacheKeyframes('layer1', [0, 10, 20]);

      service.reset();

      const config = service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.framesBefore).toBe(DEFAULT_ONION_SKIN_CONFIG.framesBefore);
      expect(service.getAllKeyframeFrames()).toHaveLength(0);
    });
  });

  // ============================================================================
  // PRESETS
  // ============================================================================

  describe('Presets', () => {
    it('should have all expected presets', () => {
      expect(ONION_SKIN_PRESETS).toHaveProperty('traditional');
      expect(ONION_SKIN_PRESETS).toHaveProperty('keyframes');
      expect(ONION_SKIN_PRESETS).toHaveProperty('light');
      expect(ONION_SKIN_PRESETS).toHaveProperty('heavy');
      expect(ONION_SKIN_PRESETS).toHaveProperty('motionArc');
      expect(ONION_SKIN_PRESETS).toHaveProperty('cycle');
    });

    it('traditional preset should focus on past frames', () => {
      const preset = ONION_SKIN_PRESETS.traditional;
      expect(preset.framesBefore).toBeGreaterThan(preset.framesAfter!);
    });

    it('keyframes preset should set keyframesOnly true', () => {
      const preset = ONION_SKIN_PRESETS.keyframes;
      expect(preset.keyframesOnly).toBe(true);
    });

    it('motionArc preset should have spacing > 1', () => {
      const preset = ONION_SKIN_PRESETS.motionArc;
      expect(preset.spacing).toBeGreaterThan(1);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle frame 0 correctly', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        framesBefore: 3,
        framesAfter: 3,
      };

      const result = calculateOnionSkinFrames(0, 100, config);

      // No before frames should exist
      const beforeFrames = result.filter(f => f.direction === 'before');
      expect(beforeFrames).toHaveLength(0);

      // After frames should still be present
      const afterFrames = result.filter(f => f.direction === 'after');
      expect(afterFrames.length).toBe(3);
    });

    it('should handle last frame correctly', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        framesBefore: 3,
        framesAfter: 3,
      };

      const result = calculateOnionSkinFrames(99, 100, config);

      // Before frames should exist
      const beforeFrames = result.filter(f => f.direction === 'before');
      expect(beforeFrames.length).toBe(3);

      // No after frames (99 is last valid frame in 0-99 range)
      const afterFrames = result.filter(f => f.direction === 'after');
      expect(afterFrames).toHaveLength(0);
    });

    it('should handle very short compositions', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        framesBefore: 5,
        framesAfter: 5,
      };

      // 3 total frames: 0, 1, 2
      const result = calculateOnionSkinFrames(1, 3, config);

      // Should only have frame 0 before and frame 2 after
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle zero framesBefore and framesAfter', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        framesBefore: 0,
        framesAfter: 0,
      };

      const result = calculateOnionSkinFrames(30, 100, config);
      expect(result).toHaveLength(0);
    });

    it('should handle empty keyframe array', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        keyframesOnly: true,
        framesBefore: 5,
        framesAfter: 5,
      };

      const result = calculateOnionSkinFrames(30, 100, config, []);
      expect(result).toHaveLength(0);
    });

    it('should handle keyframes all after current frame', () => {
      const config: OnionSkinConfig = {
        ...DEFAULT_ONION_SKIN_CONFIG,
        enabled: true,
        keyframesOnly: true,
        framesBefore: 5,
        framesAfter: 5,
      };

      const keyframes = [50, 60, 70];
      const result = calculateOnionSkinFrames(30, 100, config, keyframes);

      const beforeFrames = result.filter(f => f.direction === 'before');
      expect(beforeFrames).toHaveLength(0);
    });
  });

  // ============================================================================
  // OPACITY DISTRIBUTION
  // ============================================================================

  describe('Opacity Distribution', () => {
    it('linear falloff should decrease uniformly', () => {
      const maxFrames = 4;
      const maxOpacity = 1.0;

      const opacities = [1, 2, 3, 4].map(d =>
        calculateOpacity(d, maxFrames, 'linear', maxOpacity, 0)
      );

      // Differences between consecutive opacities should be roughly equal
      const diffs = [];
      for (let i = 0; i < opacities.length - 1; i++) {
        diffs.push(opacities[i] - opacities[i + 1]);
      }

      // All differences should be similar (within tolerance)
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      diffs.forEach(d => {
        expect(Math.abs(d - avgDiff)).toBeLessThan(0.01);
      });
    });

    it('exponential falloff should decrease faster at distance', () => {
      const maxFrames = 4;
      const maxOpacity = 1.0;

      const opacities = [1, 2, 3, 4].map(d =>
        calculateOpacity(d, maxFrames, 'exponential', maxOpacity, 0)
      );

      // First drop should be larger than later drops
      const drop1to2 = opacities[0] - opacities[1];
      const drop3to4 = opacities[2] - opacities[3];

      expect(drop1to2).toBeGreaterThan(drop3to4);
    });
  });
});
