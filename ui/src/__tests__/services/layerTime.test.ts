/**
 * Layer Time Utilities Tests
 *
 * Tests for time stretch, source time calculation, and related utilities.
 * Verifies determinism and correctness of time calculations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSourceTime,
  getStretchedDuration,
  calculateStretchedEndpoints,
  isLayerVisibleAtFrame,
  getSourceFrame,
  reverseTimeStretch,
  isReversed,
} from '@/services/layerTime';
import type { Layer, AnimatableProperty } from '@/types/project';

// ============================================================================
// HELPERS
// ============================================================================

function createTestLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: 'test-layer',
    name: 'Test Layer',
    type: 'video',
    visible: true,
    locked: false,
    isolate: false,
    threeD: false,
    motionBlur: false,
    startFrame: 0,
    endFrame: 120,
    parentId: null,
    blendMode: 'normal',
    opacity: { value: 100, animated: false, keyframes: [] },
    transform: {
      position: { value: { x: 0, y: 0 }, animated: false, keyframes: [] },
      scale: { value: { x: 100, y: 100 }, animated: false, keyframes: [] },
      rotation: { value: 0, animated: false, keyframes: [] },
      origin: { value: { x: 0, y: 0 }, animated: false, keyframes: [] },
    },
    properties: [],
    effects: [],
    data: null,
    ...overrides,
  };
}

function createSpeedMapProperty(keyframes: Array<{ frame: number; value: number }>): AnimatableProperty<number> {
  return {
    value: keyframes[0]?.value ?? 0,
    animated: keyframes.length > 1,
    keyframes: keyframes.map(kf => ({
      frame: kf.frame,
      value: kf.value,
      interpolation: 'linear' as const,
    })),
  };
}

// ============================================================================
// getSourceTime TESTS
// ============================================================================

describe('getSourceTime', () => {
  describe('default behavior (no stretch)', () => {
    it('returns 1:1 mapping with default timeStretch', () => {
      const layer = createTestLayer();
      const result = getSourceTime(60, layer, { fps: 24 });

      expect(result.sourceFrame).toBe(60);
      expect(result.sourceTime).toBeCloseTo(60 / 24);
      expect(result.effectiveSpeed).toBe(1);
      expect(result.isReversed).toBe(false);
    });

    it('returns 1:1 mapping with explicit timeStretch=100', () => {
      const layer = createTestLayer({ timeStretch: 100 });
      const result = getSourceTime(60, layer, { fps: 24 });

      expect(result.sourceFrame).toBe(60);
      expect(result.effectiveSpeed).toBe(1);
    });

    it('accounts for layer startFrame offset', () => {
      const layer = createTestLayer({ startFrame: 30 });
      const result = getSourceTime(60, layer, { fps: 24 });

      // compFrame 60 - layerStart 30 = 30 source frames
      expect(result.sourceFrame).toBe(30);
    });
  });

  describe('time stretch slow motion (timeStretch > 100)', () => {
    it('200% stretch = half speed', () => {
      const layer = createTestLayer({ timeStretch: 200 });
      const result = getSourceTime(60, layer, { fps: 24 });

      // At 200% stretch, effectiveSpeed = 100/200 = 0.5
      // 60 comp frames * 0.5 = 30 source frames
      expect(result.sourceFrame).toBe(30);
      expect(result.effectiveSpeed).toBe(0.5);
    });

    it('400% stretch = quarter speed', () => {
      const layer = createTestLayer({ timeStretch: 400 });
      const result = getSourceTime(120, layer, { fps: 24 });

      // At 400% stretch, effectiveSpeed = 100/400 = 0.25
      // 120 comp frames * 0.25 = 30 source frames
      expect(result.sourceFrame).toBe(30);
      expect(result.effectiveSpeed).toBe(0.25);
    });
  });

  describe('time stretch fast motion (timeStretch < 100)', () => {
    it('50% stretch = double speed', () => {
      const layer = createTestLayer({ timeStretch: 50 });
      const result = getSourceTime(30, layer, { fps: 24 });

      // At 50% stretch, effectiveSpeed = 100/50 = 2
      // 30 comp frames * 2 = 60 source frames
      expect(result.sourceFrame).toBe(60);
      expect(result.effectiveSpeed).toBe(2);
    });

    it('25% stretch = 4x speed', () => {
      const layer = createTestLayer({ timeStretch: 25 });
      const result = getSourceTime(30, layer, { fps: 24 });

      // At 25% stretch, effectiveSpeed = 100/25 = 4
      // 30 comp frames * 4 = 120 source frames
      expect(result.sourceFrame).toBe(120);
      expect(result.effectiveSpeed).toBe(4);
    });
  });

  describe('reversed playback (negative timeStretch)', () => {
    it('-100% = normal speed reversed', () => {
      const layer = createTestLayer({ timeStretch: -100 });
      const result = getSourceTime(30, layer, { fps: 24, sourceDuration: 120 });

      // Reversed: sourceFrame = sourceDuration - 1 - (compFrame * speed)
      // = 119 - 30 = 89
      expect(result.sourceFrame).toBe(89);
      expect(result.isReversed).toBe(true);
      expect(result.effectiveSpeed).toBe(-1);
    });

    it('-200% = half speed reversed', () => {
      const layer = createTestLayer({ timeStretch: -200 });
      const result = getSourceTime(60, layer, { fps: 24, sourceDuration: 120 });

      // effectiveSpeed = 100/200 = 0.5
      // Normal source frame would be 60 * 0.5 = 30
      // Reversed: 119 - 30 = 89
      expect(result.sourceFrame).toBe(89);
      expect(result.isReversed).toBe(true);
    });
  });

  describe('SpeedMap (time remapping)', () => {
    it('uses SpeedMap when enabled', () => {
      const layer = createTestLayer();
      const speedMap = createSpeedMapProperty([
        { frame: 0, value: 0 },
        { frame: 120, value: 5 },  // 5 seconds of source in 120 frames
      ]);

      const result = getSourceTime(60, layer, {
        fps: 24,
        speedMap,
        speedMapEnabled: true,
      });

      // At frame 60 (halfway), linear interpolation: 2.5 seconds
      expect(result.sourceTime).toBeCloseTo(2.5, 1);
      expect(result.sourceFrame).toBe(60);  // 2.5 * 24 = 60
    });

    it('SpeedMap overrides timeStretch', () => {
      const layer = createTestLayer({ timeStretch: 200 });
      const speedMap = createSpeedMapProperty([
        { frame: 0, value: 0 },
        { frame: 60, value: 2 },
      ]);

      const result = getSourceTime(30, layer, {
        fps: 24,
        speedMap,
        speedMapEnabled: true,
      });

      // SpeedMap value at frame 30 (halfway): 1 second
      // This overrides the 200% timeStretch
      expect(result.sourceTime).toBeCloseTo(1, 1);
    });
  });

  describe('looping', () => {
    it('loops source time when loop=true', () => {
      const layer = createTestLayer();
      const result = getSourceTime(150, layer, {
        fps: 24,
        sourceDuration: 120,
        loop: true,
      });

      // 150 frames with 120 duration: 150 % 120 = 30
      expect(result.sourceFrame).toBe(30);
      expect(result.wasAdjusted).toBe(true);
    });

    it('ping-pong reverses on odd cycles', () => {
      const layer = createTestLayer();

      // First cycle (frames 0-119): forward
      const result1 = getSourceTime(60, layer, {
        fps: 24,
        sourceDuration: 120,
        loop: true,
        pingPong: true,
      });
      expect(result1.sourceFrame).toBe(60);

      // Second cycle (frames 120-239): reverse
      const result2 = getSourceTime(150, layer, {
        fps: 24,
        sourceDuration: 120,
        loop: true,
        pingPong: true,
      });
      // 150 - 120 = 30 into second cycle, reversed: 119 - 30 = 89
      expect(result2.sourceFrame).toBe(89);
    });
  });

  describe('DETERMINISM', () => {
    it('returns identical results for same inputs', () => {
      const layer = createTestLayer({ timeStretch: 150 });
      const options = { fps: 24, sourceDuration: 200 };

      // Evaluate at frame 75
      const result1 = getSourceTime(75, layer, options);

      // Simulate scrubbing around
      getSourceTime(0, layer, options);
      getSourceTime(200, layer, options);
      getSourceTime(50, layer, options);

      // Evaluate at frame 75 again
      const result2 = getSourceTime(75, layer, options);

      // MUST be identical
      expect(result1.sourceFrame).toBe(result2.sourceFrame);
      expect(result1.sourceTime).toBe(result2.sourceTime);
      expect(result1.effectiveSpeed).toBe(result2.effectiveSpeed);
    });

    it('is independent of evaluation order', () => {
      const layer = createTestLayer({ timeStretch: -75 });
      const options = { fps: 30, sourceDuration: 100 };

      const frames = [0, 25, 50, 75, 100, 50, 25, 75];
      const results = frames.map(f => getSourceTime(f, layer, options));

      // Frame 50 appears twice - results should be identical
      expect(results[2].sourceFrame).toBe(results[5].sourceFrame);
      // Frame 25 appears twice
      expect(results[1].sourceFrame).toBe(results[6].sourceFrame);
      // Frame 75 appears twice
      expect(results[3].sourceFrame).toBe(results[7].sourceFrame);
    });
  });
});

// ============================================================================
// getStretchedDuration TESTS
// ============================================================================

describe('getStretchedDuration', () => {
  it('returns same duration at 100% stretch', () => {
    expect(getStretchedDuration(120, 100)).toBe(120);
  });

  it('doubles duration at 200% stretch', () => {
    expect(getStretchedDuration(120, 200)).toBe(240);
  });

  it('halves duration at 50% stretch', () => {
    expect(getStretchedDuration(120, 50)).toBe(60);
  });

  it('handles negative stretch (reversed) same as positive', () => {
    expect(getStretchedDuration(120, -100)).toBe(120);
    expect(getStretchedDuration(120, -200)).toBe(240);
  });

  it('returns source duration when stretch is 0', () => {
    expect(getStretchedDuration(120, 0)).toBe(120);
  });
});

// ============================================================================
// calculateStretchedEndpoints TESTS
// ============================================================================

describe('calculateStretchedEndpoints', () => {
  describe('startFrame anchor (default)', () => {
    it('extends end when stretching slower', () => {
      const layer = createTestLayer({
        startFrame: 0,
        endFrame: 120,
        timeStretch: 100,
        stretchAnchor: 'startFrame',
      });

      const result = calculateStretchedEndpoints(layer, 200);

      expect(result.startFrame).toBe(0);  // Unchanged
      expect(result.endFrame).toBe(240);  // Doubled
    });

    it('shrinks end when stretching faster', () => {
      const layer = createTestLayer({
        startFrame: 0,
        endFrame: 120,
        timeStretch: 100,
        stretchAnchor: 'startFrame',
      });

      const result = calculateStretchedEndpoints(layer, 50);

      expect(result.startFrame).toBe(0);
      expect(result.endFrame).toBe(60);
    });
  });

  describe('endFrame anchor', () => {
    it('extends start when stretching slower', () => {
      const layer = createTestLayer({
        startFrame: 0,
        endFrame: 120,
        timeStretch: 100,
        stretchAnchor: 'endFrame',
      });

      const result = calculateStretchedEndpoints(layer, 200);

      expect(result.startFrame).toBe(-120);  // Moved back
      expect(result.endFrame).toBe(120);     // Unchanged
    });
  });

  describe('currentFrame anchor', () => {
    it('stretches around center', () => {
      const layer = createTestLayer({
        startFrame: 0,
        endFrame: 120,
        timeStretch: 100,
        stretchAnchor: 'currentFrame',
      });

      const result = calculateStretchedEndpoints(layer, 200);

      // Center is 60, new duration is 240
      // New start = 60 - 120 = -60
      // New end = -60 + 240 = 180
      expect(result.startFrame).toBe(-60);
      expect(result.endFrame).toBe(180);
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('isLayerVisibleAtFrame', () => {
  it('returns true for frames within layer bounds', () => {
    const layer = createTestLayer({ startFrame: 10, endFrame: 100 });

    expect(isLayerVisibleAtFrame(layer, 10)).toBe(true);
    expect(isLayerVisibleAtFrame(layer, 50)).toBe(true);
    expect(isLayerVisibleAtFrame(layer, 100)).toBe(true);
  });

  it('returns false for frames outside layer bounds', () => {
    const layer = createTestLayer({ startFrame: 10, endFrame: 100 });

    expect(isLayerVisibleAtFrame(layer, 0)).toBe(false);
    expect(isLayerVisibleAtFrame(layer, 9)).toBe(false);
    expect(isLayerVisibleAtFrame(layer, 101)).toBe(false);
  });
});

describe('getSourceFrame', () => {
  it('convenience wrapper returns correct source frame', () => {
    const layer = createTestLayer({ timeStretch: 200 });

    const sourceFrame = getSourceFrame(60, layer, 24);

    // 200% stretch = half speed
    expect(sourceFrame).toBe(30);
  });
});

describe('reverseTimeStretch', () => {
  it('negates positive stretch', () => {
    const layer = createTestLayer({ timeStretch: 100 });
    expect(reverseTimeStretch(layer)).toBe(-100);
  });

  it('negates negative stretch', () => {
    const layer = createTestLayer({ timeStretch: -200 });
    expect(reverseTimeStretch(layer)).toBe(200);
  });

  it('handles undefined timeStretch (defaults to 100)', () => {
    const layer = createTestLayer();
    expect(reverseTimeStretch(layer)).toBe(-100);
  });
});

describe('isReversed', () => {
  it('returns true for negative stretch', () => {
    expect(isReversed(createTestLayer({ timeStretch: -100 }))).toBe(true);
    expect(isReversed(createTestLayer({ timeStretch: -50 }))).toBe(true);
  });

  it('returns false for positive stretch', () => {
    expect(isReversed(createTestLayer({ timeStretch: 100 }))).toBe(false);
    expect(isReversed(createTestLayer({ timeStretch: 200 }))).toBe(false);
  });

  it('returns false for undefined stretch (defaults to 100)', () => {
    expect(isReversed(createTestLayer())).toBe(false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('edge cases', () => {
  it('handles zero timeStretch gracefully', () => {
    const layer = createTestLayer({ timeStretch: 0 });
    const result = getSourceTime(60, layer, { fps: 24 });

    // effectiveSpeed = 100/0 = Infinity, but we handle this
    expect(result.effectiveSpeed).toBe(0);
    expect(result.sourceFrame).toBe(0);
  });

  it('handles negative composition frames', () => {
    const layer = createTestLayer({ startFrame: 0 });
    const result = getSourceTime(-10, layer, { fps: 24, sourceDuration: 120 });

    // Negative comp frame means before layer start
    expect(result.sourceFrame).toBe(0);
  });

  it('handles very large timeStretch values', () => {
    const layer = createTestLayer({ timeStretch: 10000 });
    const result = getSourceTime(1000, layer, { fps: 24 });

    // 10000% stretch = 0.01x speed
    // 1000 * 0.01 = 10
    expect(result.sourceFrame).toBe(10);
    expect(result.effectiveSpeed).toBeCloseTo(0.01);
  });
});
