/**
 * Vector LOD Service Tests
 *
 * Tests for level-of-detail management for complex vectors:
 * - Path simplification
 * - LOD generation
 * - LOD selection
 * - Viewport culling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  simplifyControlPoints,
  generateLODLevels,
  selectLODLevel,
  cullOffScreenPoints,
  VectorLODService,
  vectorLOD,
  DEFAULT_LOD_CONFIG,
  type LODLevel,
  type LODContext,
  type LODConfig,
  type Rect,
} from '@/services/vectorLOD';
import type { ControlPoint } from '@/types/project';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a control point
 */
function createControlPoint(x: number, y: number): ControlPoint {
  return {
    id: `cp_${x}_${y}`,
    x,
    y,
    handleIn: null,
    handleOut: null,
    selected: false,
    cornerType: 'smooth',
    group: undefined,
  };
}

/**
 * Create a simple line of control points
 */
function createLinePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  numPoints: number
): ControlPoint[] {
  const points: ControlPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = numPoints > 1 ? i / (numPoints - 1) : 0;
    points.push(createControlPoint(
      start.x + (end.x - start.x) * t,
      start.y + (end.y - start.y) * t
    ));
  }
  return points;
}

/**
 * Create a zigzag path that can be simplified
 */
function createZigzagPath(width: number, height: number, numZigs: number): ControlPoint[] {
  const points: ControlPoint[] = [];
  const zigWidth = width / numZigs;

  for (let i = 0; i <= numZigs; i++) {
    const x = i * zigWidth;
    const y = i % 2 === 0 ? 0 : height;
    points.push(createControlPoint(x, y));
  }

  return points;
}

/**
 * Create a square path
 */
function createSquarePath(size: number, center: { x: number; y: number } = { x: 0, y: 0 }): ControlPoint[] {
  const half = size / 2;
  return [
    createControlPoint(center.x - half, center.y - half),
    createControlPoint(center.x + half, center.y - half),
    createControlPoint(center.x + half, center.y + half),
    createControlPoint(center.x - half, center.y + half),
  ];
}

/**
 * Create a circle approximation
 */
function createCirclePath(radius: number, center: { x: number; y: number }, numPoints: number): ControlPoint[] {
  const points: ControlPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    points.push(createControlPoint(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius
    ));
  }
  return points;
}

/**
 * Create a default LOD context
 */
function createLODContext(overrides: Partial<LODContext> = {}): LODContext {
  return {
    zoom: 1,
    isPlaying: false,
    isScrubbing: false,
    targetFps: 60,
    actualFps: 60,
    viewport: { width: 1920, height: 1080 },
    ...overrides,
  };
}

// ============================================================================
// SIMPLIFICATION TESTS
// ============================================================================

describe('simplifyControlPoints', () => {
  it('should return original points when less than 3', () => {
    const single = [createControlPoint(0, 0)];
    const double = [createControlPoint(0, 0), createControlPoint(100, 100)];

    expect(simplifyControlPoints(single, 10)).toHaveLength(1);
    expect(simplifyControlPoints(double, 10)).toHaveLength(2);
  });

  it('should simplify collinear points to just endpoints', () => {
    // Points on a straight line should simplify to just start and end
    const linePoints = createLinePath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
    const simplified = simplifyControlPoints(linePoints, 0.1);

    expect(simplified.length).toBe(2);
    expect(simplified[0].x).toBe(0);
    expect(simplified[1].x).toBe(100);
  });

  it('should keep points that deviate beyond tolerance', () => {
    // Create a V shape - middle point is far from the line
    const vShape = [
      createControlPoint(0, 0),
      createControlPoint(50, 100),
      createControlPoint(100, 0),
    ];

    // With tolerance 10, the middle point (100 units away) should be kept
    const simplified = simplifyControlPoints(vShape, 10);
    expect(simplified.length).toBe(3);
  });

  it('should remove points within tolerance', () => {
    // Create points that deviate only slightly
    const almostLine = [
      createControlPoint(0, 0),
      createControlPoint(50, 1), // Only 1 unit off the line
      createControlPoint(100, 0),
    ];

    // With tolerance 5, the middle point should be removed
    const simplified = simplifyControlPoints(almostLine, 5);
    expect(simplified.length).toBe(2);
  });

  it('should preserve points with higher deviation', () => {
    const zigzag = createZigzagPath(100, 50, 4); // Creates 5 points

    // Low tolerance - keep more points
    const lowTolerance = simplifyControlPoints(zigzag, 1);

    // High tolerance - remove intermediate points
    const highTolerance = simplifyControlPoints(zigzag, 100);

    expect(lowTolerance.length).toBeGreaterThan(highTolerance.length);
  });

  it('should clone points instead of referencing', () => {
    const original = [createControlPoint(0, 0), createControlPoint(100, 100)];
    const simplified = simplifyControlPoints(original, 10);

    // Modify simplified point
    simplified[0].x = 999;

    // Original should be unchanged
    expect(original[0].x).toBe(0);
  });
});

// ============================================================================
// LOD GENERATION TESTS
// ============================================================================

describe('generateLODLevels', () => {
  it('should return empty array for empty points', () => {
    const levels = generateLODLevels([]);
    expect(levels).toHaveLength(0);
  });

  it('should generate specified number of levels', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 20);

    const levels3 = generateLODLevels(points, 3);
    const levels5 = generateLODLevels(points, 5);

    expect(levels3).toHaveLength(3);
    expect(levels5).toHaveLength(5);
  });

  it('should have decreasing point counts at lower levels', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 50);
    const levels = generateLODLevels(points, 4, 5);

    // Lower quality levels should have fewer or equal points
    for (let i = 0; i < levels.length - 1; i++) {
      expect(levels[i].pointCount).toBeLessThanOrEqual(levels[i + 1].pointCount);
    }
  });

  it('should have highest level with original point count', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 30);
    const levels = generateLODLevels(points, 4);

    const highestLevel = levels[levels.length - 1];
    expect(highestLevel.pointCount).toBe(30);
    expect(highestLevel.tolerance).toBe(0);
  });

  it('should assign correct quality values', () => {
    const points = createSquarePath(100);
    const levels = generateLODLevels(points, 4);

    expect(levels[0].quality).toBe(0);
    expect(levels[1].quality).toBe(1);
    expect(levels[2].quality).toBe(2);
    expect(levels[3].quality).toBe(3);
  });

  it('should use exponentially decreasing tolerance', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 20);
    const levels = generateLODLevels(points, 4, 2);

    // Tolerance should decrease: 16, 8, 4, 0 (for 4 levels with base 2)
    // Actually: baseTolerance * 2^(numLevels - 1 - i)
    expect(levels[0].tolerance).toBeGreaterThan(levels[1].tolerance);
    expect(levels[1].tolerance).toBeGreaterThan(levels[2].tolerance);
    expect(levels[3].tolerance).toBe(0);
  });
});

// ============================================================================
// LOD SELECTION TESTS
// ============================================================================

describe('selectLODLevel', () => {
  let levels: LODLevel[];

  beforeEach(() => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 50);
    levels = generateLODLevels(points, 4);
  });

  it('should return null for empty levels', () => {
    const result = selectLODLevel([], createLODContext());
    expect(result).toBeNull();
  });

  it('should return highest quality when not playing and at full zoom', () => {
    const context = createLODContext({
      zoom: 1,
      isPlaying: false,
    });

    const result = selectLODLevel(levels, context);

    expect(result).not.toBeNull();
    expect(result?.quality).toBe(levels.length - 1);
  });

  it('should return lower quality during playback', () => {
    const normalContext = createLODContext({ isPlaying: false });
    const playingContext = createLODContext({ isPlaying: true, actualFps: 60 });

    const normalResult = selectLODLevel(levels, normalContext);
    const playingResult = selectLODLevel(levels, playingContext);

    expect(playingResult!.quality).toBeLessThanOrEqual(normalResult!.quality);
  });

  it('should return lowest quality during scrubbing', () => {
    const context = createLODContext({
      isScrubbing: true,
    });

    const result = selectLODLevel(levels, context);

    expect(result?.quality).toBe(0);
  });

  it('should return lower quality when frame rate drops', () => {
    const goodFpsContext = createLODContext({
      isPlaying: true,
      targetFps: 60,
      actualFps: 60,
    });

    const badFpsContext = createLODContext({
      isPlaying: true,
      targetFps: 60,
      actualFps: 30, // Less than 80% of target
    });

    const goodResult = selectLODLevel(levels, goodFpsContext);
    const badResult = selectLODLevel(levels, badFpsContext);

    expect(badResult!.quality).toBeLessThan(goodResult!.quality);
  });

  it('should return lower quality when zoomed out', () => {
    const fullZoomContext = createLODContext({ zoom: 1 });
    const zoomedOutContext = createLODContext({ zoom: 0.25 });

    const fullResult = selectLODLevel(levels, fullZoomContext);
    const zoomedResult = selectLODLevel(levels, zoomedOutContext);

    expect(zoomedResult!.quality).toBeLessThanOrEqual(fullResult!.quality);
  });

  it('should handle zoom levels correctly', () => {
    const veryZoomedOut = createLODContext({ zoom: 0.1 });
    const slightlyZoomedOut = createLODContext({ zoom: 0.75 });
    const zoomedIn = createLODContext({ zoom: 2 });

    const veryZoomedResult = selectLODLevel(levels, veryZoomedOut);
    const slightlyResult = selectLODLevel(levels, slightlyZoomedOut);
    const zoomedInResult = selectLODLevel(levels, zoomedIn);

    // Very zoomed out should be lowest quality
    expect(veryZoomedResult!.quality).toBe(0);

    // Zoomed in should allow highest quality
    expect(zoomedInResult!.quality).toBe(levels.length - 1);
  });
});

// ============================================================================
// VIEWPORT CULLING TESTS
// ============================================================================

describe('cullOffScreenPoints', () => {
  const viewport: Rect = { x: 0, y: 0, width: 100, height: 100 };

  it('should return empty array for empty points', () => {
    const result = cullOffScreenPoints([], viewport);
    expect(result).toHaveLength(0);
  });

  it('should keep single point inside viewport', () => {
    const points = [createControlPoint(50, 50)];
    const result = cullOffScreenPoints(points, viewport);

    expect(result).toHaveLength(1);
  });

  it('should remove single point outside viewport', () => {
    const points = [createControlPoint(500, 500)];
    const result = cullOffScreenPoints(points, viewport, 0);

    expect(result).toHaveLength(0);
  });

  it('should keep points within margin', () => {
    const points = [createControlPoint(-25, 50)]; // Outside viewport but within margin
    const result = cullOffScreenPoints(points, viewport, 50);

    expect(result).toHaveLength(1);
  });

  it('should keep segment that crosses viewport', () => {
    // Line from outside to outside that passes through viewport
    const points = [
      createControlPoint(-50, 50),
      createControlPoint(150, 50),
    ];

    const result = cullOffScreenPoints(points, viewport);

    // Both points should be kept because segment crosses viewport
    expect(result).toHaveLength(2);
  });

  it('should remove segment entirely outside viewport', () => {
    const points = [
      createControlPoint(200, 200),
      createControlPoint(300, 300),
    ];

    const result = cullOffScreenPoints(points, viewport, 0);

    expect(result).toHaveLength(0);
  });

  it('should keep visible portion of path', () => {
    const points = [
      createControlPoint(50, 50),   // Inside
      createControlPoint(150, 50),  // Outside
      createControlPoint(150, 150), // Outside
      createControlPoint(50, 150),  // Outside
      createControlPoint(50, 50),   // Inside (closing)
    ];

    const result = cullOffScreenPoints(points, viewport, 10);

    // Should keep some points, but not all
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(points.length);
  });

  it('should clone returned points', () => {
    const original = [createControlPoint(50, 50)];
    const result = cullOffScreenPoints(original, viewport);

    result[0].x = 999;

    expect(original[0].x).toBe(50);
  });
});

// ============================================================================
// SERVICE CLASS TESTS
// ============================================================================

describe('VectorLODService', () => {
  let service: VectorLODService;
  const testLayerId = 'test-layer';

  beforeEach(() => {
    service = new VectorLODService();
  });

  afterEach(() => {
    service.clearAllLOD();
  });

  describe('generateLODLevels', () => {
    it('should generate and cache LOD levels', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 20);
      service.generateLODLevels(testLayerId, points);

      const cached = service.getLODLevels(testLayerId);
      expect(cached).toBeDefined();
      expect(cached?.length).toBeGreaterThan(0);
    });

    it('should accept custom parameters', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 20);
      const levels = service.generateLODLevels(testLayerId, points, 5, 3);

      expect(levels).toHaveLength(5);
    });
  });

  describe('getLODLevels', () => {
    it('should return undefined for non-existent layer', () => {
      expect(service.getLODLevels('non-existent')).toBeUndefined();
    });

    it('should return cached levels', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 20);
      const generated = service.generateLODLevels(testLayerId, points);
      const retrieved = service.getLODLevels(testLayerId);

      expect(retrieved).toEqual(generated);
    });
  });

  describe('clearLODLevels', () => {
    it('should clear cached levels', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 20);
      service.generateLODLevels(testLayerId, points);

      service.clearLODLevels(testLayerId);

      expect(service.getLODLevels(testLayerId)).toBeUndefined();
    });

    it('should not throw for non-existent layer', () => {
      expect(() => service.clearLODLevels('non-existent')).not.toThrow();
    });
  });

  describe('selectLODLevel', () => {
    it('should select appropriate level', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 30);
      const levels = service.generateLODLevels(testLayerId, points);
      const context = createLODContext();

      const result = service.selectLODLevel(levels, context);

      expect(result).not.toBeNull();
    });
  });

  describe('getControlPointsAtLOD', () => {
    it('should return fallback when no LOD data', () => {
      const fallback = createSquarePath(100);
      const context = createLODContext();

      const result = service.getControlPointsAtLOD('non-existent', context, fallback);

      expect(result).toBe(fallback);
    });

    it('should return LOD points when available', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 30);
      const fallback = createSquarePath(100);
      service.generateLODLevels(testLayerId, points);

      const context = createLODContext();
      const result = service.getControlPointsAtLOD(testLayerId, context, fallback);

      expect(result).not.toBe(fallback);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('cullOffScreenPoints', () => {
    it('should cull points when segment is entirely outside viewport', () => {
      // Both points far outside viewport - segment doesn't cross it
      const points = [
        createControlPoint(500, 500),
        createControlPoint(600, 600),
      ];
      const viewport: Rect = { x: 0, y: 0, width: 100, height: 100 };

      const result = service.cullOffScreenPoints(points, viewport, 0);

      // Both points should be culled since segment doesn't intersect viewport
      expect(result.length).toBe(0);
    });

    it('should keep segment that crosses viewport', () => {
      const points = [
        createControlPoint(50, 50),   // Inside
        createControlPoint(500, 500), // Outside
      ];
      const viewport: Rect = { x: 0, y: 0, width: 100, height: 100 };

      const result = service.cullOffScreenPoints(points, viewport, 0);

      // Both points should be kept because segment crosses viewport
      expect(result.length).toBe(2);
    });
  });

  describe('shouldUseLOD', () => {
    it('should return true when point count exceeds threshold', () => {
      const config: LODConfig = { ...DEFAULT_LOD_CONFIG, maxPointsForPreview: 50 };

      expect(service.shouldUseLOD(100, config)).toBe(true);
      expect(service.shouldUseLOD(30, config)).toBe(false);
    });

    it('should return false when LOD is disabled', () => {
      const config: LODConfig = { ...DEFAULT_LOD_CONFIG, enabled: false };

      expect(service.shouldUseLOD(1000, config)).toBe(false);
    });
  });

  describe('clearAllLOD', () => {
    it('should clear all cached data', () => {
      const points = createCirclePath(50, { x: 0, y: 0 }, 20);
      service.generateLODLevels('layer1', points);
      service.generateLODLevels('layer2', points);
      service.generateLODLevels('layer3', points);

      service.clearAllLOD();

      expect(service.getLODLevels('layer1')).toBeUndefined();
      expect(service.getLODLevels('layer2')).toBeUndefined();
      expect(service.getLODLevels('layer3')).toBeUndefined();
    });
  });
});

// ============================================================================
// SINGLETON TESTS
// ============================================================================

describe('vectorLOD singleton', () => {
  afterEach(() => {
    vectorLOD.clearAllLOD();
  });

  it('should be a VectorLODService instance', () => {
    expect(vectorLOD).toBeInstanceOf(VectorLODService);
  });

  it('should maintain state', () => {
    const points = createSquarePath(100);
    vectorLOD.generateLODLevels('singleton-test', points);

    const levels = vectorLOD.getLODLevels('singleton-test');
    expect(levels).toBeDefined();
  });
});

// ============================================================================
// DEFAULT CONFIG TESTS
// ============================================================================

describe('DEFAULT_LOD_CONFIG', () => {
  it('should have expected defaults', () => {
    expect(DEFAULT_LOD_CONFIG.enabled).toBe(true);
    expect(DEFAULT_LOD_CONFIG.mode).toBe('both');
    expect(DEFAULT_LOD_CONFIG.levels).toEqual([]);
    expect(DEFAULT_LOD_CONFIG.maxPointsForPreview).toBe(100);
    expect(DEFAULT_LOD_CONFIG.simplificationTolerance).toBe(2);
    expect(DEFAULT_LOD_CONFIG.cullingEnabled).toBe(true);
    expect(DEFAULT_LOD_CONFIG.cullMargin).toBe(50);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  it('should handle very small paths', () => {
    const points = [createControlPoint(0, 0), createControlPoint(1, 1)];
    const levels = generateLODLevels(points);

    expect(levels.length).toBeGreaterThan(0);
  });

  it('should handle very large paths', () => {
    const points = createCirclePath(1000, { x: 0, y: 0 }, 500);
    const levels = generateLODLevels(points, 4);

    expect(levels).toHaveLength(4);
    expect(levels[0].pointCount).toBeLessThan(levels[3].pointCount);
  });

  it('should handle negative coordinates', () => {
    const points = [
      createControlPoint(-100, -100),
      createControlPoint(-50, -50),
      createControlPoint(0, 0),
    ];

    const simplified = simplifyControlPoints(points, 1);
    expect(simplified.length).toBeGreaterThan(0);
  });

  it('should handle duplicate points', () => {
    const points = [
      createControlPoint(50, 50),
      createControlPoint(50, 50),
      createControlPoint(100, 100),
    ];

    const simplified = simplifyControlPoints(points, 1);
    expect(simplified.length).toBeGreaterThan(0);
  });

  it('should handle zero tolerance', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 20);
    const simplified = simplifyControlPoints(points, 0);

    // With zero tolerance, should keep most points
    expect(simplified.length).toBeGreaterThan(10);
  });

  it('should handle very high tolerance', () => {
    const points = createCirclePath(50, { x: 0, y: 0 }, 50);
    const simplified = simplifyControlPoints(points, 10000);

    // With very high tolerance, should simplify to just 2 points
    expect(simplified.length).toBe(2);
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should generate LOD levels quickly for large paths', () => {
    const points = createCirclePath(500, { x: 0, y: 0 }, 1000);

    const start = performance.now();
    const levels = generateLODLevels(points, 4);
    const duration = performance.now() - start;

    expect(levels).toHaveLength(4);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should select LOD level quickly', () => {
    const points = createCirclePath(500, { x: 0, y: 0 }, 1000);
    const levels = generateLODLevels(points, 4);
    const context = createLODContext();

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      selectLODLevel(levels, context);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // 1000 selections should be fast
  });

  it('should cull points efficiently', () => {
    const points = createCirclePath(5000, { x: 0, y: 0 }, 500);
    const viewport: Rect = { x: 0, y: 0, width: 100, height: 100 };

    const start = performance.now();
    const culled = cullOffScreenPoints(points, viewport);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    expect(culled.length).toBeLessThan(points.length);
  });
});
