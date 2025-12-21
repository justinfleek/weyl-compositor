/**
 * Camera Trajectory Service Tests
 *
 * Tests camera trajectory presets, spherical coordinate conversions,
 * and trajectory keyframe generation.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SPHERICAL,
  DEFAULT_TRAJECTORY,
  TRAJECTORY_PRESETS,
  sphericalToCartesian,
  cartesianToSpherical,
  getTrajectoryPosition,
  generateTrajectoryKeyframes,
  createTrajectoryFromPreset,
  getTrajectoryDescription,
  getTrajectoryCategory,
  getTrajectoryTypesByCategory,
  type TrajectoryType,
  type TrajectoryConfig
} from '@/services/cameraTrajectory';

// ============================================================================
// SPHERICAL COORDINATE TESTS
// ============================================================================

describe('Spherical Coordinates', () => {
  describe('sphericalToCartesian', () => {
    it('should convert zero angles to position on Z axis', () => {
      const spherical = { ...DEFAULT_SPHERICAL, d_r: 1, d_theta: 0, d_phi: 0 };
      const center = { x: 0, y: 0, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(-100, 5); // Camera behind center
    });

    it('should handle 90 degree azimuth (phi)', () => {
      const spherical = { ...DEFAULT_SPHERICAL, d_r: 1, d_theta: 0, d_phi: 90 };
      const center = { x: 0, y: 0, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(0, 1);
    });

    it('should handle elevation (theta)', () => {
      const spherical = { ...DEFAULT_SPHERICAL, d_r: 1, d_theta: 90, d_phi: 0 };
      const center = { x: 0, y: 0, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(100, 5);
      expect(result.z).toBeCloseTo(0, 1);
    });

    it('should apply distance multiplier', () => {
      const spherical = { ...DEFAULT_SPHERICAL, d_r: 2, d_theta: 0, d_phi: 0 };
      const center = { x: 0, y: 0, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      expect(result.z).toBeCloseTo(-200, 5);
    });

    it('should offset from center', () => {
      const spherical = { ...DEFAULT_SPHERICAL };
      const center = { x: 500, y: 300, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      expect(result.x).toBeCloseTo(500, 5);
      expect(result.y).toBeCloseTo(300, 5);
    });

    it('should apply x/y/z offsets', () => {
      const spherical = {
        ...DEFAULT_SPHERICAL,
        x_offset: 0.5,
        y_offset: -0.5,
        z_offset: 0.1
      };
      const center = { x: 0, y: 0, z: 0 };
      const result = sphericalToCartesian(spherical, center, 100);

      // Offsets are multiplied by baseDistance
      expect(result.x).toBeCloseTo(50, 5);
      expect(result.y).toBeCloseTo(-50, 5);
      expect(result.z).toBeCloseTo(-100 + 10, 5);
    });
  });

  describe('cartesianToSpherical', () => {
    it('should convert position on Z axis to zero angles', () => {
      const position = { x: 0, y: 0, z: -100 };
      const center = { x: 0, y: 0, z: 0 };
      const result = cartesianToSpherical(position, center, 100);

      expect(result.d_r).toBeCloseTo(1, 5);
      expect(result.d_theta).toBeCloseTo(0, 5);
      expect(result.d_phi).toBeCloseTo(0, 5);
    });

    it('should round-trip conversion', () => {
      const original = { ...DEFAULT_SPHERICAL, d_r: 1.5, d_theta: 30, d_phi: 45 };
      const center = { x: 500, y: 300, z: 0 };
      const cartesian = sphericalToCartesian(original, center, 100);
      const result = cartesianToSpherical(cartesian, center, 100);

      expect(result.d_r).toBeCloseTo(original.d_r, 2);
      expect(result.d_theta).toBeCloseTo(original.d_theta, 2);
      expect(result.d_phi).toBeCloseTo(original.d_phi, 2);
    });
  });
});

// Note: applyEasing is a private function in cameraTrajectory.ts
// Easing is tested indirectly through trajectory positions with different easing configs

// ============================================================================
// TRAJECTORY POSITION TESTS
// ============================================================================

describe('getTrajectoryPosition', () => {
  const baseConfig: TrajectoryConfig = {
    ...DEFAULT_TRAJECTORY,
    baseDistance: 1000,
    center: { x: 960, y: 540, z: 0 },
    duration: 100,
    amplitude: 1,
    loops: 1
  };

  describe('Orbit trajectory', () => {
    it('should return starting position at t=0', () => {
      const config = { ...baseConfig, type: 'orbit' as TrajectoryType };
      const result = getTrajectoryPosition(config, 0);

      expect(result.position.x).toBeCloseTo(960, 1);
      expect(result.position.z).toBeCloseTo(-1000, 1);
    });

    it('should complete full orbit at t=1', () => {
      const config = { ...baseConfig, type: 'orbit' as TrajectoryType };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // Should return to approximately the same position
      expect(end.position.x).toBeCloseTo(start.position.x, 0);
      expect(end.position.z).toBeCloseTo(start.position.z, 0);
    });

    it('should be at 90 degrees at t=0.25', () => {
      const config = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'linear' as const };
      const result = getTrajectoryPosition(config, 0.25);

      // At 90 degrees (t=0.25 of full circle), sin(90°)=1, cos(90°)=0
      // x = center.x + sin(angle) * baseDistance = 960 + 1 * 1000 = 1960
      // z = center.z - cos(angle) * baseDistance = 0 - 0 * 1000 = 0
      // Note: The orbit uses linear easing, so angle = t * 2π = 0.25 * 2π = π/2
      expect(result.position.x).toBeCloseTo(960 + 1000, 0);
      expect(result.position.z).toBeCloseTo(0, 0);
    });
  });

  describe('Dolly trajectory', () => {
    it('should dolly in (closer) at t=1 for dolly_in', () => {
      const config = { ...baseConfig, type: 'dolly_in' as TrajectoryType, amplitude: 0.5 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // End z should be closer to center (less negative)
      expect(Math.abs(end.position.z)).toBeLessThan(Math.abs(start.position.z));
    });

    it('should dolly out (farther) at t=1 for dolly_out', () => {
      const config = { ...baseConfig, type: 'dolly_out' as TrajectoryType, amplitude: 0.5 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // End z should be farther from center (more negative)
      expect(Math.abs(end.position.z)).toBeGreaterThan(Math.abs(start.position.z));
    });
  });

  describe('Pan trajectory', () => {
    it('should only change target for pan_left', () => {
      const config = { ...baseConfig, type: 'pan_left' as TrajectoryType, amplitude: 30 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // Position should remain the same
      expect(end.position.x).toBeCloseTo(start.position.x, 1);
      expect(end.position.z).toBeCloseTo(start.position.z, 1);

      // Target should have changed
      expect(end.target.x).not.toBeCloseTo(start.target.x, 1);
    });
  });

  describe('Swing trajectory', () => {
    it('should swing back and forth for swing1', () => {
      const config = { ...baseConfig, type: 'swing1' as TrajectoryType };
      const start = getTrajectoryPosition(config, 0);
      const mid = getTrajectoryPosition(config, 0.5);
      const end = getTrajectoryPosition(config, 1);

      // Start and end should be similar
      expect(end.position.x).toBeCloseTo(start.position.x, 0);

      // Mid should be at maximum displacement
      expect(Math.abs(mid.position.x - start.position.x)).toBeGreaterThan(0);
    });
  });

  describe('Custom trajectory', () => {
    it('should return base position for custom type', () => {
      const config = { ...baseConfig, type: 'custom' as TrajectoryType };
      const result = getTrajectoryPosition(config, 0.5);

      expect(result.position.x).toBeCloseTo(960, 1);
      expect(result.target.x).toBeCloseTo(960, 1);
    });
  });

  describe('Figure8 trajectory', () => {
    it('should create figure-8 motion in x and y', () => {
      const config = { ...baseConfig, type: 'figure8' as TrajectoryType };
      const positions = [0, 0.25, 0.5, 0.75, 1].map(t =>
        getTrajectoryPosition(config, t)
      );

      // Should have variation in x and y (figure-8 pattern)
      const xValues = positions.map(p => p.position.x);
      const yValues = positions.map(p => p.position.y);

      expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(0);
      expect(Math.max(...yValues) - Math.min(...yValues)).toBeGreaterThan(0);
    });
  });

  describe('Spiral trajectories', () => {
    it('should spiral inward for spiral_in', () => {
      const config = { ...baseConfig, type: 'spiral_in' as TrajectoryType, amplitude: 0.5 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // End distance should be less than start (spiraling in)
      const startDist = Math.sqrt(
        Math.pow(start.position.x - 960, 2) + Math.pow(start.position.z, 2)
      );
      const endDist = Math.sqrt(
        Math.pow(end.position.x - 960, 2) + Math.pow(end.position.z, 2)
      );

      expect(endDist).toBeLessThan(startDist);
    });

    it('should spiral outward for spiral_out', () => {
      const config = { ...baseConfig, type: 'spiral_out' as TrajectoryType, amplitude: 0.5 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // End distance should be greater than start (spiraling out)
      const startDist = Math.sqrt(
        Math.pow(start.position.x - 960, 2) + Math.pow(start.position.z, 2)
      );
      const endDist = Math.sqrt(
        Math.pow(end.position.x - 960, 2) + Math.pow(end.position.z, 2)
      );

      expect(endDist).toBeGreaterThan(startDist);
    });
  });

  describe('Crane trajectories', () => {
    it('should move up for crane_up with positive amplitude', () => {
      const config = { ...baseConfig, type: 'crane_up' as TrajectoryType, amplitude: 500 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      expect(end.position.y).toBeGreaterThan(start.position.y);
    });

    it('should move down for crane_down with negative amplitude', () => {
      const config = { ...baseConfig, type: 'crane_down' as TrajectoryType, amplitude: -500 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      expect(end.position.y).toBeLessThan(start.position.y);
    });
  });

  describe('Truck trajectories', () => {
    it('should move based on amplitude sign for truck_left', () => {
      // truck_left with negative amplitude moves left
      const config = { ...baseConfig, type: 'truck_left' as TrajectoryType, amplitude: -300 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      expect(end.position.x).toBeLessThan(start.position.x);
    });

    it('should move based on amplitude sign for truck_right', () => {
      // truck_right with positive amplitude moves right
      const config = { ...baseConfig, type: 'truck_right' as TrajectoryType, amplitude: 300 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      expect(end.position.x).toBeGreaterThan(start.position.x);
    });
  });

  describe('Arc trajectories', () => {
    it('should arc left for arc_left', () => {
      // amplitude 0.25 = quarter circle arc (preset default)
      // arcAngle = easedT * amplitude * 2π
      // At t=1.0: arcAngle = 1.0 * 0.25 * 2π = π/2 (90 degrees)
      const config = { ...baseConfig, type: 'arc_left' as TrajectoryType, amplitude: 0.25, easing: 'linear' as const };
      const start = getTrajectoryPosition(config, 0);
      const mid = getTrajectoryPosition(config, 0.5);
      const end = getTrajectoryPosition(config, 1);

      // At t=0: arcAngle=0, x=center.x+sin(0)*dist=960, z=center.z-cos(0)*dist=-1000
      expect(start.position.x).toBeCloseTo(960, 1);
      expect(start.position.z).toBeCloseTo(-1000, 1);

      // At t=0.5: arcAngle=π/4 (45°), x=960+sin(45°)*1000≈1667, z=0-cos(45°)*1000≈-707
      expect(mid.position.x).toBeGreaterThan(start.position.x);
      expect(mid.position.z).toBeGreaterThan(start.position.z); // Less negative

      // At t=1.0: arcAngle=π/2 (90°), x=960+sin(90°)*1000=1960, z=0-cos(90°)*1000=0
      expect(end.position.x).toBeCloseTo(1960, 0);
      expect(end.position.z).toBeCloseTo(0, 0);
    });

    it('should arc right for arc_right', () => {
      // arc_right uses negative amplitude (-0.25) to go the other direction
      const config = { ...baseConfig, type: 'arc_right' as TrajectoryType, amplitude: -0.25, easing: 'linear' as const };
      const start = getTrajectoryPosition(config, 0);
      const mid = getTrajectoryPosition(config, 0.5);
      const end = getTrajectoryPosition(config, 1);

      // At t=0: same as arc_left, starts at same position
      expect(start.position.x).toBeCloseTo(960, 1);
      expect(start.position.z).toBeCloseTo(-1000, 1);

      // At t=0.5: arcAngle=-π/4 (-45°), x=960+sin(-45°)*1000≈253
      expect(mid.position.x).toBeLessThan(start.position.x);

      // At t=1.0: arcAngle=-π/2 (-90°), x=960+sin(-90°)*1000=-40
      expect(end.position.x).toBeCloseTo(-40, 0);
      expect(end.position.z).toBeCloseTo(0, 0);
    });
  });

  describe('Zoom trajectories', () => {
    it('should maintain constant position for zoom_in (zoom is focal length change)', () => {
      const config = { ...baseConfig, type: 'zoom_in' as TrajectoryType };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // Zoom doesn't change camera position - it changes focal length
      // Position should remain at base position throughout
      expect(start.position.x).toBeCloseTo(end.position.x, 1);
      expect(start.position.y).toBeCloseTo(end.position.y, 1);
      expect(start.position.z).toBeCloseTo(end.position.z, 1);
    });

    it('should maintain constant position for zoom_out (zoom is focal length change)', () => {
      const config = { ...baseConfig, type: 'zoom_out' as TrajectoryType };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // Zoom doesn't change camera position - it changes focal length
      expect(start.position.x).toBeCloseTo(end.position.x, 1);
      expect(start.position.y).toBeCloseTo(end.position.y, 1);
      expect(start.position.z).toBeCloseTo(end.position.z, 1);
    });
  });

  describe('Tilt trajectories', () => {
    it('should change target Y for tilt_up', () => {
      const config = { ...baseConfig, type: 'tilt_up' as TrajectoryType, amplitude: 30 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      // Target Y should change for tilt
      expect(end.target.y).not.toBeCloseTo(start.target.y, 1);
    });

    it('should change target Y for tilt_down', () => {
      const config = { ...baseConfig, type: 'tilt_down' as TrajectoryType, amplitude: 30 };
      const start = getTrajectoryPosition(config, 0);
      const end = getTrajectoryPosition(config, 1);

      expect(end.target.y).not.toBeCloseTo(start.target.y, 1);
    });
  });

  describe('Easing configurations', () => {
    it('should apply ease-in easing - slower start than linear', () => {
      const linearConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'linear' as const };
      const easeInConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'ease-in' as const };

      // Get positions at t=0.25 (early in animation where ease-in should lag behind linear)
      const linearResult = getTrajectoryPosition(linearConfig, 0.25);
      const easeInResult = getTrajectoryPosition(easeInConfig, 0.25);

      // For orbit, measure distance traveled from start position
      const startPos = getTrajectoryPosition(linearConfig, 0).position;

      const linearDist = Math.sqrt(
        Math.pow(linearResult.position.x - startPos.x, 2) +
        Math.pow(linearResult.position.z - startPos.z, 2)
      );
      const easeInDist = Math.sqrt(
        Math.pow(easeInResult.position.x - startPos.x, 2) +
        Math.pow(easeInResult.position.z - startPos.z, 2)
      );

      // Ease-in should have traveled less distance at early time (slower start)
      expect(easeInDist).toBeLessThan(linearDist);
    });

    it('should apply ease-out easing - faster start than linear', () => {
      const linearConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'linear' as const };
      const easeOutConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'ease-out' as const };

      // Get positions at t=0.25 (early in animation where ease-out should be ahead of linear)
      const linearResult = getTrajectoryPosition(linearConfig, 0.25);
      const easeOutResult = getTrajectoryPosition(easeOutConfig, 0.25);

      const startPos = getTrajectoryPosition(linearConfig, 0).position;

      const linearDist = Math.sqrt(
        Math.pow(linearResult.position.x - startPos.x, 2) +
        Math.pow(linearResult.position.z - startPos.z, 2)
      );
      const easeOutDist = Math.sqrt(
        Math.pow(easeOutResult.position.x - startPos.x, 2) +
        Math.pow(easeOutResult.position.z - startPos.z, 2)
      );

      // Ease-out should have traveled more distance at early time (faster start)
      expect(easeOutDist).toBeGreaterThan(linearDist);
    });

    it('should apply ease-in-out easing - slower start and end than linear', () => {
      const linearConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'linear' as const };
      const easeInOutConfig = { ...baseConfig, type: 'orbit' as TrajectoryType, easing: 'ease-in-out' as const };

      // For ease-in-out: slow at start, fast in middle, slow at end
      // Compare against linear at various time points
      const startPos = getTrajectoryPosition(linearConfig, 0).position;

      // Get positions at t=0.2 (early: ease-in-out should lag behind linear)
      const linear02 = getTrajectoryPosition(linearConfig, 0.2);
      const easeInOut02 = getTrajectoryPosition(easeInOutConfig, 0.2);

      // Calculate arc distance from start (using angular distance in orbit)
      const getArcAngle = (pos: { x: number; z: number }) => {
        const dx = pos.x - 960; // center.x
        const dz = pos.z - 0;   // center.z
        return Math.atan2(dx, -dz);
      };

      const linearAngle02 = getArcAngle(linear02.position);
      const easeInOutAngle02 = getArcAngle(easeInOut02.position);

      // At t=0.2, ease-in-out is in "slow start" phase, should have smaller angle
      expect(Math.abs(easeInOutAngle02)).toBeLessThan(Math.abs(linearAngle02));

      // At t=0.5, both should be at same position (midpoint of ease-in-out)
      const linear05 = getTrajectoryPosition(linearConfig, 0.5);
      const easeInOut05 = getTrajectoryPosition(easeInOutConfig, 0.5);
      const linearAngle05 = getArcAngle(linear05.position);
      const easeInOutAngle05 = getArcAngle(easeInOut05.position);

      // At midpoint, ease-in-out should be caught up with linear (within small tolerance)
      expect(Math.abs(easeInOutAngle05 - linearAngle05)).toBeLessThan(0.5);
    });
  });
});

// ============================================================================
// TRAJECTORY KEYFRAME GENERATION
// ============================================================================

describe('generateTrajectoryKeyframes', () => {
  it('should generate correct number of keyframes', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 100,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const keyframes = generateTrajectoryKeyframes(config, 0, 10);

    // 100 frames / 10 interval + 1 = 11 keyframes
    expect(keyframes.position.length).toBe(11);
    expect(keyframes.pointOfInterest.length).toBe(11);
  });

  it('should start at the specified frame', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 30,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const keyframes = generateTrajectoryKeyframes(config, 50, 10);

    expect(keyframes.position[0].frame).toBe(50);
  });

  it('should end at start + duration', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 30,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const keyframes = generateTrajectoryKeyframes(config, 0, 10);
    const lastKeyframe = keyframes.position[keyframes.position.length - 1];

    expect(lastKeyframe.frame).toBe(30);
  });

  it('should generate zoom keyframes for zoom trajectories', () => {
    const config = createTrajectoryFromPreset('zoom_in', {
      duration: 30,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const keyframes = generateTrajectoryKeyframes(config, 0, 10);

    expect(keyframes.zoom).toBeDefined();
    expect(keyframes.zoom!.length).toBeGreaterThan(0);
  });

  it('should not generate zoom keyframes for non-zoom trajectories', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 30,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const keyframes = generateTrajectoryKeyframes(config, 0, 10);

    expect(keyframes.zoom).toBeUndefined();
  });
});

// ============================================================================
// PRESET CONFIGURATION TESTS
// ============================================================================

describe('Trajectory Presets', () => {
  it('should have all trajectory types defined', () => {
    const expectedTypes: TrajectoryType[] = [
      'custom', 'orbit', 'orbit_reverse', 'swing1', 'swing2',
      'dolly_in', 'dolly_out', 'pan_left', 'pan_right',
      'tilt_up', 'tilt_down', 'zoom_in', 'zoom_out',
      'circle', 'figure8', 'spiral_in', 'spiral_out',
      'crane_up', 'crane_down', 'truck_left', 'truck_right',
      'arc_left', 'arc_right'
    ];

    for (const type of expectedTypes) {
      expect(TRAJECTORY_PRESETS[type]).toBeDefined();
    }
  });

  it('should create valid config from preset', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 60,
      center: { x: 500, y: 500, z: 0 }
    });

    expect(config.type).toBe('orbit');
    expect(config.duration).toBe(60);
    expect(config.center.x).toBe(500);
    // Should have preset defaults merged
    expect(config.loops).toBeDefined();
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Utility Functions', () => {
  describe('getTrajectoryDescription', () => {
    it('should return description for known trajectories', () => {
      const description = getTrajectoryDescription('orbit');
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    });

    it('should return default for unknown trajectory', () => {
      const description = getTrajectoryDescription('unknown' as TrajectoryType);
      expect(description).toBe('Unknown trajectory');
    });
  });

  describe('getTrajectoryCategory', () => {
    it('should categorize orbital trajectories', () => {
      expect(getTrajectoryCategory('orbit')).toBe('Orbital');
      expect(getTrajectoryCategory('circle')).toBe('Orbital');
      expect(getTrajectoryCategory('swing1')).toBe('Orbital');
    });

    it('should categorize dolly trajectories', () => {
      expect(getTrajectoryCategory('dolly_in')).toBe('Dolly');
      expect(getTrajectoryCategory('dolly_out')).toBe('Dolly');
    });

    it('should categorize pan/tilt trajectories', () => {
      expect(getTrajectoryCategory('pan_left')).toBe('Pan/Tilt');
      expect(getTrajectoryCategory('tilt_up')).toBe('Pan/Tilt');
    });
  });

  describe('getTrajectoryTypesByCategory', () => {
    it('should return grouped trajectories', () => {
      const grouped = getTrajectoryTypesByCategory();

      expect(grouped['Orbital']).toBeDefined();
      expect(grouped['Dolly']).toBeDefined();
      expect(grouped['Pan/Tilt']).toBeDefined();
      expect(grouped['Zoom']).toBeDefined();
    });

    it('should include all trajectory types', () => {
      const grouped = getTrajectoryTypesByCategory();
      const allTypes = Object.values(grouped).flat();

      // All types should be present
      expect(allTypes).toContain('orbit');
      expect(allTypes).toContain('dolly_in');
      expect(allTypes).toContain('pan_left');
      expect(allTypes).toContain('zoom_in');
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle zero duration - returns base position', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 0,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });
    const result = getTrajectoryPosition(config, 0);

    // With zero duration, should return base position (starting point)
    expect(result.position.x).toBeCloseTo(960, 1);
    expect(result.position.z).toBeCloseTo(-1000, 1);
    expect(result.target.x).toBeCloseTo(960, 1);
  });

  it('should handle negative amplitude - orbits in opposite direction', () => {
    const positiveConfig = createTrajectoryFromPreset('orbit', {
      duration: 100,
      amplitude: 1,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });
    const negativeConfig = createTrajectoryFromPreset('orbit', {
      duration: 100,
      amplitude: -1,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    // At t=0.25, positive amplitude goes clockwise (x increases)
    // negative amplitude should go counter-clockwise (x decreases)
    const positiveResult = getTrajectoryPosition(positiveConfig, 0.25);
    const negativeResult = getTrajectoryPosition(negativeConfig, 0.25);

    // They should be on opposite sides of center X
    expect(positiveResult.position.x).toBeGreaterThan(960);
    expect(negativeResult.position.x).toBeLessThan(960);
  });

  it('should handle very large loop count - completes multiple orbits', () => {
    const singleLoopConfig = createTrajectoryFromPreset('orbit', {
      duration: 100,
      loops: 1,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });
    const multiLoopConfig = createTrajectoryFromPreset('orbit', {
      duration: 100,
      loops: 4,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    // At t=0.25, single loop is at 90 degrees
    // At t=0.25 with 4 loops, it has completed 1 full orbit (back to start)
    const singleResult = getTrajectoryPosition(singleLoopConfig, 0.25);
    const multiResult = getTrajectoryPosition(multiLoopConfig, 0.25);

    // Single loop at t=0.25 should be at 90 degrees (x offset)
    expect(singleResult.position.x).toBeGreaterThan(960 + 500); // Should be near x=1960

    // Multi loop (4 loops) at t=0.25 = 1 full loop, back near start
    expect(multiResult.position.x).toBeCloseTo(960, 0);
    expect(multiResult.position.z).toBeCloseTo(-1000, 0);
  });

  it('should handle t values outside 0-1 - extrapolates trajectory', () => {
    const config = createTrajectoryFromPreset('orbit', {
      duration: 100,
      center: { x: 960, y: 540, z: 0 },
      baseDistance: 1000
    });

    const atZero = getTrajectoryPosition(config, 0);
    const atOne = getTrajectoryPosition(config, 1);
    const resultNegative = getTrajectoryPosition(config, -0.5);
    const resultOver = getTrajectoryPosition(config, 1.5);

    // For orbit, t=-0.5 should be half-orbit backward from start
    // The position should be valid (not NaN) and continue the trajectory
    expect(Number.isFinite(resultNegative.position.x)).toBe(true);
    expect(Number.isFinite(resultNegative.position.z)).toBe(true);
    expect(Number.isFinite(resultOver.position.x)).toBe(true);
    expect(Number.isFinite(resultOver.position.z)).toBe(true);

    // t=1.5 continues orbit beyond full circle (half way through second orbit)
    // Should be at different position than t=0.5
    const atHalf = getTrajectoryPosition(config, 0.5);
    // Both 0.5 and 1.5 represent same angular position for 1 loop orbit
    expect(resultOver.position.x).toBeCloseTo(atHalf.position.x, 0);
    expect(resultOver.position.z).toBeCloseTo(atHalf.position.z, 0);
  });
});
