/**
 * 3D Mesh Deformation Service Tests
 *
 * PRODUCTION-LEVEL TESTS ONLY
 * Each test verifies actual computed values, math correctness, and behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSquashStretch,
  calculateVelocityAtFrame,
  calculateBounceOffset,
  calculateImpactSquash,
  calculate3DPinWeight,
  deform3DPosition,
  createDefault3DPin,
  MeshDeformation3DService,
  DEFAULT_SQUASH_STRETCH,
  DEFAULT_BOUNCE,
  type SquashStretchConfig,
  type BounceConfig,
  type Deformation3DPin,
} from '@/services/meshDeformation3D';
import type { AnimatableProperty, Vec3, Keyframe } from '@/types/project';

// Helper to create valid keyframes with required fields
function createKeyframe<T>(frame: number, value: T, interpolation: 'linear' | 'bezier' | 'hold' = 'linear'): Keyframe<T> {
  return {
    id: `kf_${frame}`,
    frame,
    value,
    interpolation,
    inHandle: { frame: -5, value: 0, enabled: false },
    outHandle: { frame: 5, value: 0, enabled: false },
    controlMode: 'smooth',
  };
}

// ============================================================================
// SQUASH/STRETCH TESTS
// ============================================================================

describe('calculateSquashStretch', () => {
  it('should return identity scale for zero velocity', () => {
    const scale = calculateSquashStretch({ x: 0, y: 0, z: 0 });

    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
    expect(scale.z).toBe(1);
  });

  it('should return identity scale when velocity below threshold', () => {
    const config: SquashStretchConfig = {
      ...DEFAULT_SQUASH_STRETCH,
      velocityThreshold: 50,
    };

    const scale = calculateSquashStretch({ x: 10, y: 10, z: 10 }, config);

    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
    expect(scale.z).toBe(1);
  });

  it('should stretch along Y axis for vertical upward motion', () => {
    const scale = calculateSquashStretch({ x: 0, y: 300, z: 0 });

    // Y should stretch (> 1), X and Z should squash (< 1)
    expect(scale.y).toBeGreaterThan(1);
    expect(scale.x).toBeLessThan(1);
    expect(scale.z).toBeLessThan(1);
  });

  it('should stretch along Y axis for vertical downward motion', () => {
    const scale = calculateSquashStretch({ x: 0, y: -300, z: 0 });

    // Direction doesn't matter, only magnitude - stretch along Y
    expect(scale.y).toBeGreaterThan(1);
    expect(scale.x).toBeLessThan(1);
    expect(scale.z).toBeLessThan(1);
  });

  it('should stretch along X axis for horizontal motion', () => {
    const scale = calculateSquashStretch({ x: 400, y: 0, z: 0 });

    expect(scale.x).toBeGreaterThan(1);
    expect(scale.y).toBeLessThan(1);
    expect(scale.z).toBeLessThan(1);
  });

  it('should stretch along Z axis for depth motion', () => {
    const scale = calculateSquashStretch({ x: 0, y: 0, z: 500 });

    expect(scale.z).toBeGreaterThan(1);
    expect(scale.x).toBeLessThan(1);
    expect(scale.y).toBeLessThan(1);
  });

  it('should preserve volume when preserveVolume is true', () => {
    const config: SquashStretchConfig = {
      ...DEFAULT_SQUASH_STRETCH,
      preserveVolume: true,
    };

    const scale = calculateSquashStretch({ x: 0, y: 400, z: 0 }, config);

    // Volume = x * y * z should be approximately 1
    const volume = scale.x * scale.y * scale.z;
    expect(volume).toBeCloseTo(1, 1);
  });

  it('should not exceed maxStretch', () => {
    const config: SquashStretchConfig = {
      ...DEFAULT_SQUASH_STRETCH,
      maxStretch: 1.3,
    };

    // Very high velocity
    const scale = calculateSquashStretch({ x: 0, y: 10000, z: 0 }, config);

    expect(scale.y).toBeLessThanOrEqual(config.maxStretch);
  });

  it('should not go below maxSquash', () => {
    const config: SquashStretchConfig = {
      ...DEFAULT_SQUASH_STRETCH,
      maxSquash: 0.8,
    };

    // Very high velocity
    const scale = calculateSquashStretch({ x: 0, y: 10000, z: 0 }, config);

    expect(scale.x).toBeGreaterThanOrEqual(config.maxSquash);
    expect(scale.z).toBeGreaterThanOrEqual(config.maxSquash);
  });

  it('should increase stretch with higher velocity', () => {
    const slowScale = calculateSquashStretch({ x: 0, y: 100, z: 0 });
    const fastScale = calculateSquashStretch({ x: 0, y: 400, z: 0 });

    expect(fastScale.y).toBeGreaterThan(slowScale.y);
  });

  it('should return identity when disabled', () => {
    const config: SquashStretchConfig = {
      ...DEFAULT_SQUASH_STRETCH,
      enabled: false,
    };

    const scale = calculateSquashStretch({ x: 1000, y: 1000, z: 1000 }, config);

    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
    expect(scale.z).toBe(1);
  });
});

// ============================================================================
// VELOCITY CALCULATION TESTS
// ============================================================================

describe('calculateVelocityAtFrame', () => {
  it('should return zero velocity for static position', () => {
    const position: AnimatableProperty<Vec3> = {
      id: 'test_pos',
      name: 'Position',
      type: 'position',
      value: { x: 100, y: 200, z: 0 },
      animated: false,
      keyframes: [],
    };

    const velocity = calculateVelocityAtFrame(position, 10, 30);

    expect(velocity.x).toBe(0);
    expect(velocity.y).toBe(0);
    expect(velocity.z).toBe(0);
  });

  it('should calculate correct velocity for linear motion', () => {
    const position: AnimatableProperty<Vec3> = {
      id: 'test_pos',
      name: 'Position',
      type: 'position',
      value: { x: 0, y: 0, z: 0 },
      animated: true,
      keyframes: [
        createKeyframe(0, { x: 0, y: 0, z: 0 }),
        createKeyframe(30, { x: 300, y: 0, z: 0 }),
      ],
    };

    // At frame 15 (middle), moving 300 pixels over 30 frames at 30fps = 1 second
    // Velocity = 300 pixels/second = 10 pixels/frame
    const velocity = calculateVelocityAtFrame(position, 15, 30);

    // Per-frame velocity at 30fps: 300/30 = 10 px/frame
    // Converted to per-second: 10 * 30 = 300 px/s
    expect(velocity.x).toBeCloseTo(300, 0);
    expect(velocity.y).toBe(0);
    expect(velocity.z).toBe(0);
  });

  it('should handle Y velocity for vertical motion', () => {
    const position: AnimatableProperty<Vec3> = {
      id: 'test_pos',
      name: 'Position',
      type: 'position',
      value: { x: 0, y: 0, z: 0 },
      animated: true,
      keyframes: [
        createKeyframe(0, { x: 0, y: 0, z: 0 }),
        createKeyframe(15, { x: 0, y: 150, z: 0 }),
      ],
    };

    const velocity = calculateVelocityAtFrame(position, 8, 30);

    // 150 pixels over 15 frames = 10 px/frame * 30 fps = 300 px/s
    expect(velocity.y).toBeCloseTo(300, 0);
    expect(velocity.x).toBe(0);
  });
});

// ============================================================================
// BOUNCE PHYSICS TESTS
// ============================================================================

describe('calculateBounceOffset', () => {
  const fps = 30;

  it('should return zero before impact', () => {
    const offset = calculateBounceOffset(30, -500, 20, fps);

    expect(offset).toBe(0);
  });

  it('should return positive offset after impact (bouncing up)', () => {
    const offset = calculateBounceOffset(0, -300, 5, fps);

    expect(offset).toBeGreaterThan(0);
  });

  it('should return to zero at apex then come back down', () => {
    // With gravity 980 and initial velocity 300, time to apex ≈ 300/980 ≈ 0.3s
    // At apex, offset is maximum
    const config: BounceConfig = {
      ...DEFAULT_BOUNCE,
      elasticity: 0.7,
      gravity: 980,
    };

    const offsetAtImpact = calculateBounceOffset(0, -300, 0, fps, config);
    const offsetAtApex = calculateBounceOffset(0, -300, 9, fps, config); // ~0.3s after
    const offsetAfterApex = calculateBounceOffset(0, -300, 15, fps, config);

    expect(offsetAtImpact).toBe(0);
    expect(offsetAtApex).toBeGreaterThan(0);
    // After apex, should be coming back down (lower than apex)
    expect(offsetAfterApex).toBeLessThan(offsetAtApex);
  });

  it('should decrease bounce height with each bounce due to elasticity', () => {
    const config: BounceConfig = {
      ...DEFAULT_BOUNCE,
      elasticity: 0.5,
      gravity: 980,
    };

    // First bounce apex (around frame 9-10)
    const firstBounceApex = calculateBounceOffset(0, -490, 10, fps, config);

    // After one full bounce cycle, second bounce apex should be lower
    // Time for first bounce: 2 * v/g = 2 * 490/980 = 1s = 30 frames
    const secondBounceApex = calculateBounceOffset(0, -490, 45, fps, config);

    expect(secondBounceApex).toBeLessThan(firstBounceApex);
  });

  it('should settle to ground after max bounces', () => {
    const config: BounceConfig = {
      ...DEFAULT_BOUNCE,
      maxBounces: 3,
      elasticity: 0.5,
    };

    // Very late frame, should be settled
    const offset = calculateBounceOffset(0, -300, 200, fps, config);

    expect(offset).toBe(0);
  });
});

describe('calculateImpactSquash', () => {
  const fps = 30;

  it('should return identity before impact', () => {
    const scale = calculateImpactSquash(10, 5, fps);

    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
    expect(scale.z).toBe(1);
  });

  it('should return identity after recovery (5+ frames)', () => {
    const scale = calculateImpactSquash(0, 10, fps);

    expect(scale.x).toBe(1);
    expect(scale.y).toBe(1);
    expect(scale.z).toBe(1);
  });

  it('should squash vertically at impact', () => {
    const scale = calculateImpactSquash(0, 2, fps);

    // Y should be compressed (< 1), X and Z should expand (> 1)
    expect(scale.y).toBeLessThan(1);
    expect(scale.x).toBeGreaterThan(1);
    expect(scale.z).toBeGreaterThan(1);
  });

  it('should preserve approximate volume during squash', () => {
    const scale = calculateImpactSquash(0, 2, fps);

    const volume = scale.x * scale.y * scale.z;
    // Volume should be approximately preserved (within reasonable tolerance)
    expect(volume).toBeGreaterThan(0.7);
    expect(volume).toBeLessThan(1.3);
  });
});

// ============================================================================
// 3D PIN TESTS
// ============================================================================

describe('calculate3DPinWeight', () => {
  it('should return 1 for vertex at pin position', () => {
    const pin = createDefault3DPin('test', { x: 100, y: 100, z: 100 });
    const weight = calculate3DPinWeight(
      { x: 100, y: 100, z: 100 },
      pin,
      { x: 100, y: 100, z: 100 }
    );

    expect(weight).toBeCloseTo(1, 1);
  });

  it('should return 0 for vertex far from pin', () => {
    const pin = createDefault3DPin('test', { x: 0, y: 0, z: 0 });
    pin.radius = 50; // Small radius

    const weight = calculate3DPinWeight(
      { x: 500, y: 500, z: 500 },
      pin,
      { x: 0, y: 0, z: 0 }
    );

    expect(weight).toBe(0);
  });

  it('should decrease weight with distance', () => {
    const pin = createDefault3DPin('test', { x: 0, y: 0, z: 0 });
    pin.radius = 100;

    const closeWeight = calculate3DPinWeight(
      { x: 20, y: 0, z: 0 },
      pin,
      { x: 0, y: 0, z: 0 }
    );

    const farWeight = calculate3DPinWeight(
      { x: 80, y: 0, z: 0 },
      pin,
      { x: 0, y: 0, z: 0 }
    );

    expect(closeWeight).toBeGreaterThan(farWeight);
  });

  it('should respect stiffness - high stiffness means low deformation', () => {
    const stiffPin = createDefault3DPin('stiff', { x: 0, y: 0, z: 0 });
    stiffPin.stiffness = 0.9;
    stiffPin.radius = 100;

    const softPin = createDefault3DPin('soft', { x: 0, y: 0, z: 0 });
    softPin.stiffness = 0;
    softPin.radius = 100;

    const stiffWeight = calculate3DPinWeight(
      { x: 30, y: 0, z: 0 },
      stiffPin,
      { x: 0, y: 0, z: 0 }
    );

    const softWeight = calculate3DPinWeight(
      { x: 30, y: 0, z: 0 },
      softPin,
      { x: 0, y: 0, z: 0 }
    );

    expect(stiffWeight).toBeLessThan(softWeight);
  });
});

describe('deform3DPosition', () => {
  it('should return original position when no pins', () => {
    const original: Vec3 = { x: 100, y: 200, z: 300 };
    const result = deform3DPosition(original, [], 0);

    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
    expect(result.z).toBe(300);
  });

  it('should move vertex when pin moves', () => {
    const pin = createDefault3DPin('test', { x: 50, y: 50, z: 0 });
    pin.radius = 200; // Large radius

    // Pin has moved from rest position
    pin.position.value = { x: 100, y: 100, z: 0 }; // Moved +50, +50

    const original: Vec3 = { x: 60, y: 60, z: 0 }; // Near the pin
    const result = deform3DPosition(original, [pin], 0);

    // Should have moved somewhat with the pin
    expect(result.x).toBeGreaterThan(original.x);
    expect(result.y).toBeGreaterThan(original.y);
  });

  it('should not affect distant vertices', () => {
    const pin = createDefault3DPin('test', { x: 0, y: 0, z: 0 });
    pin.radius = 50;
    pin.position.value = { x: 100, y: 100, z: 0 }; // Big move

    const original: Vec3 = { x: 500, y: 500, z: 0 }; // Far from pin
    const result = deform3DPosition(original, [pin], 0);

    // Should not have moved (too far from pin influence)
    expect(result.x).toBe(original.x);
    expect(result.y).toBe(original.y);
    expect(result.z).toBe(original.z);
  });

  it('should blend influence from multiple pins', () => {
    const pin1 = createDefault3DPin('pin1', { x: 0, y: 0, z: 0 });
    pin1.radius = 100;
    pin1.position.value = { x: 30, y: 20, z: 0 }; // Moved right and up

    const pin2 = createDefault3DPin('pin2', { x: 100, y: 0, z: 0 });
    pin2.radius = 100;
    pin2.position.value = { x: 130, y: 20, z: 0 }; // Also moved right and up

    // Vertex in between should be influenced by both
    const original: Vec3 = { x: 50, y: 0, z: 0 };
    const result = deform3DPosition(original, [pin1, pin2], 0);

    // Both pins moved in same direction (right and up), so result should move that way
    expect(result.x).toBeGreaterThan(original.x);
    expect(result.y).toBeGreaterThan(original.y);
  });
});

// ============================================================================
// SERVICE CLASS TESTS
// ============================================================================

describe('MeshDeformation3DService', () => {
  let service: MeshDeformation3DService;

  beforeEach(() => {
    service = new MeshDeformation3DService();
  });

  it('should initialize layer with default configs', () => {
    service.initializeLayer('layer1');

    const pins = service.getPins('layer1');
    expect(pins).toHaveLength(0);
  });

  it('should add pins to layer', () => {
    service.initializeLayer('layer1');

    const pin1 = service.addPin('layer1', { x: 100, y: 100, z: 0 });
    const pin2 = service.addPin('layer1', { x: 200, y: 200, z: 0 });

    const pins = service.getPins('layer1');
    expect(pins).toHaveLength(2);
    expect(pins[0].restPosition.x).toBe(100);
    expect(pins[1].restPosition.x).toBe(200);
  });

  it('should evaluate squash/stretch based on velocity', () => {
    service.initializeLayer('layer1');

    const position: AnimatableProperty<Vec3> = {
      id: 'pos',
      name: 'Position',
      type: 'position',
      value: { x: 0, y: 0, z: 0 },
      animated: true,
      keyframes: [
        createKeyframe(0, { x: 0, y: 0, z: 0 }),
        createKeyframe(30, { x: 0, y: 500, z: 0 }),
      ],
    };

    const result = service.evaluate('layer1', 15, position, 30);

    // Moving upward, should stretch in Y
    expect(result.scale.y).toBeGreaterThan(1);
    expect(result.scale.x).toBeLessThan(1);
  });

  it('should clear layer data', () => {
    service.initializeLayer('layer1');
    service.addPin('layer1', { x: 0, y: 0, z: 0 });

    service.clearLayer('layer1');

    const pins = service.getPins('layer1');
    expect(pins).toHaveLength(0);
  });
});
