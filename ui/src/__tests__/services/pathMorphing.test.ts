/**
 * Path Morphing Service Tests
 *
 * Tests for shape morphing between bezier paths including:
 * - Point count matching via subdivision and resampling
 * - Optimal correspondence finding
 * - Smooth vertex interpolation
 * - Type guards and utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  prepareMorphPaths,
  morphPaths,
  morphPathsAuto,
  getCorrespondence,
  isBezierPath,
  PathMorphing,
  DEFAULT_MORPH_CONFIG,
  type MorphConfig,
  type PreparedMorphPaths,
} from '@/services/pathMorphing';
import type { BezierPath, BezierVertex, Point2D } from '@/types/shapes';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a simple closed square path
 */
function createSquarePath(size: number = 100, center: Point2D = { x: 0, y: 0 }): BezierPath {
  const half = size / 2;
  return {
    vertices: [
      createVertex(center.x - half, center.y - half), // Top-left
      createVertex(center.x + half, center.y - half), // Top-right
      createVertex(center.x + half, center.y + half), // Bottom-right
      createVertex(center.x - half, center.y + half), // Bottom-left
    ],
    closed: true,
  };
}

/**
 * Create a simple closed triangle path
 */
function createTrianglePath(size: number = 100, center: Point2D = { x: 0, y: 0 }): BezierPath {
  const half = size / 2;
  const height = size * Math.sqrt(3) / 2;
  return {
    vertices: [
      createVertex(center.x, center.y - height / 2),           // Top
      createVertex(center.x + half, center.y + height / 2),    // Bottom-right
      createVertex(center.x - half, center.y + height / 2),    // Bottom-left
    ],
    closed: true,
  };
}

/**
 * Create a simple open line path
 */
function createLinePath(start: Point2D, end: Point2D): BezierPath {
  return {
    vertices: [
      createVertex(start.x, start.y),
      createVertex(end.x, end.y),
    ],
    closed: false,
  };
}

/**
 * Create a bezier vertex with default handles
 */
function createVertex(x: number, y: number, handleScale: number = 0): BezierVertex {
  return {
    point: { x, y },
    inHandle: { x: -handleScale, y: 0 },
    outHandle: { x: handleScale, y: 0 },
  };
}

/**
 * Create a circular path approximation
 */
function createCirclePath(radius: number, center: Point2D = { x: 0, y: 0 }, segments: number = 4): BezierPath {
  const vertices: BezierVertex[] = [];
  const handleLength = radius * 0.5523; // Bezier approximation of circle

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
    const prevAngle = ((i - 1) / segments) * Math.PI * 2 - Math.PI / 2;

    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;

    // Tangent direction for handles
    const inAngle = angle - Math.PI / 2;
    const outAngle = angle + Math.PI / 2;

    vertices.push({
      point: { x, y },
      inHandle: {
        x: Math.cos(inAngle) * handleLength,
        y: Math.sin(inAngle) * handleLength,
      },
      outHandle: {
        x: Math.cos(outAngle) * handleLength,
        y: Math.sin(outAngle) * handleLength,
      },
    });
  }

  return { vertices, closed: true };
}

/**
 * Calculate distance between two points
 */
function distance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('prepareMorphPaths', () => {
  describe('Point count matching', () => {
    it('should match vertex counts when source has fewer vertices', () => {
      const triangle = createTrianglePath(); // 3 vertices
      const square = createSquarePath();     // 4 vertices

      const result = prepareMorphPaths(triangle, square);

      expect(result.source.vertices.length).toBe(result.target.vertices.length);
      expect(result.source.vertices.length).toBe(4);
    });

    it('should match vertex counts when target has fewer vertices', () => {
      const square = createSquarePath();     // 4 vertices
      const triangle = createTrianglePath(); // 3 vertices

      const result = prepareMorphPaths(square, triangle);

      expect(result.source.vertices.length).toBe(result.target.vertices.length);
      expect(result.source.vertices.length).toBe(4);
    });

    it('should not modify paths with equal vertex counts', () => {
      const square1 = createSquarePath(100);
      const square2 = createSquarePath(200);

      const result = prepareMorphPaths(square1, square2);

      expect(result.source.vertices.length).toBe(4);
      expect(result.target.vertices.length).toBe(4);
    });
  });

  describe('Subdivision strategies', () => {
    it('should subdivide shorter path with default strategy', () => {
      const triangle = createTrianglePath(); // 3 vertices
      const square = createSquarePath();     // 4 vertices

      const result = prepareMorphPaths(triangle, square, {
        pointMatchingStrategy: 'subdivide-shorter',
      });

      // Triangle should be subdivided to have 4 vertices
      expect(result.source.vertices.length).toBe(4);
    });

    it('should subdivide both paths with subdivide-both strategy', () => {
      const triangle = createTrianglePath(); // 3 vertices
      const square = createSquarePath();     // 4 vertices

      const result = prepareMorphPaths(triangle, square, {
        pointMatchingStrategy: 'subdivide-both',
      });

      // Both should have max(3, 4) = 4 vertices
      expect(result.source.vertices.length).toBe(4);
      expect(result.target.vertices.length).toBe(4);
    });

    it('should resample with resample strategy', () => {
      const triangle = createTrianglePath(); // 3 vertices
      const square = createSquarePath();     // 4 vertices

      const result = prepareMorphPaths(triangle, square, {
        pointMatchingStrategy: 'resample',
        resampleCount: 8,
      });

      expect(result.source.vertices.length).toBe(8);
      expect(result.target.vertices.length).toBe(8);
    });
  });

  describe('Correspondence methods', () => {
    it('should find optimal rotation for closed paths', () => {
      const square1 = createSquarePath(100);
      const square2 = createSquarePath(100, { x: 10, y: 10 }); // Slightly offset

      const result = prepareMorphPaths(square1, square2, {
        correspondenceMethod: 'nearest-rotation',
      });

      expect(result.rotationOffset).toBeDefined();
      expect(typeof result.rotationOffset).toBe('number');
    });

    it('should keep original indices with index method', () => {
      const square1 = createSquarePath(100);
      const square2 = createSquarePath(200);

      const result = prepareMorphPaths(square1, square2, {
        correspondenceMethod: 'index',
      });

      expect(result.rotationOffset).toBe(0);
      expect(result.reversed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty source path', () => {
      const empty: BezierPath = { vertices: [], closed: true };
      const square = createSquarePath();

      const result = prepareMorphPaths(empty, square);

      expect(result.source.vertices.length).toBe(0);
    });

    it('should handle empty target path', () => {
      const square = createSquarePath();
      const empty: BezierPath = { vertices: [], closed: true };

      const result = prepareMorphPaths(square, empty);

      expect(result.target.vertices.length).toBe(0);
    });

    it('should handle single vertex paths', () => {
      const single: BezierPath = {
        vertices: [createVertex(50, 50)],
        closed: false,
      };
      const line = createLinePath({ x: 0, y: 0 }, { x: 100, y: 100 });

      const result = prepareMorphPaths(single, line);

      expect(result.source.vertices.length).toBe(result.target.vertices.length);
    });
  });
});

// ============================================================================
// MORPHING INTERPOLATION TESTS
// ============================================================================

describe('morphPaths', () => {
  let preparedSquares: PreparedMorphPaths;

  beforeEach(() => {
    const square1 = createSquarePath(100);
    const square2 = createSquarePath(200);
    preparedSquares = prepareMorphPaths(square1, square2);
  });

  describe('Basic interpolation', () => {
    it('should return source path at t=0', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 0);

      expect(result.vertices.length).toBe(preparedSquares.source.vertices.length);

      for (let i = 0; i < result.vertices.length; i++) {
        expect(result.vertices[i].point.x).toBe(preparedSquares.source.vertices[i].point.x);
        expect(result.vertices[i].point.y).toBe(preparedSquares.source.vertices[i].point.y);
      }
    });

    it('should return target path at t=1', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 1);

      expect(result.vertices.length).toBe(preparedSquares.target.vertices.length);

      for (let i = 0; i < result.vertices.length; i++) {
        expect(result.vertices[i].point.x).toBe(preparedSquares.target.vertices[i].point.x);
        expect(result.vertices[i].point.y).toBe(preparedSquares.target.vertices[i].point.y);
      }
    });

    it('should interpolate linearly at t=0.5', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 0.5);

      for (let i = 0; i < result.vertices.length; i++) {
        const srcV = preparedSquares.source.vertices[i];
        const tgtV = preparedSquares.target.vertices[i];
        const expected = {
          x: (srcV.point.x + tgtV.point.x) / 2,
          y: (srcV.point.y + tgtV.point.y) / 2,
        };

        expect(result.vertices[i].point.x).toBeCloseTo(expected.x, 5);
        expect(result.vertices[i].point.y).toBeCloseTo(expected.y, 5);
      }
    });

    it('should interpolate handles as well as points', () => {
      const source: BezierPath = {
        vertices: [
          { point: { x: 0, y: 0 }, inHandle: { x: -10, y: 0 }, outHandle: { x: 10, y: 0 } },
          { point: { x: 100, y: 0 }, inHandle: { x: -10, y: 0 }, outHandle: { x: 10, y: 0 } },
        ],
        closed: false,
      };
      const target: BezierPath = {
        vertices: [
          { point: { x: 0, y: 100 }, inHandle: { x: -20, y: 0 }, outHandle: { x: 20, y: 0 } },
          { point: { x: 100, y: 100 }, inHandle: { x: -20, y: 0 }, outHandle: { x: 20, y: 0 } },
        ],
        closed: false,
      };

      const result = morphPaths(source, target, 0.5);

      expect(result.vertices[0].outHandle.x).toBeCloseTo(15, 5);
      expect(result.vertices[1].inHandle.x).toBeCloseTo(-15, 5);
    });
  });

  describe('Interpolation at various t values', () => {
    it('should interpolate at t=0.25', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 0.25);

      for (let i = 0; i < result.vertices.length; i++) {
        const srcV = preparedSquares.source.vertices[i];
        const tgtV = preparedSquares.target.vertices[i];
        const expected = {
          x: srcV.point.x + (tgtV.point.x - srcV.point.x) * 0.25,
          y: srcV.point.y + (tgtV.point.y - srcV.point.y) * 0.25,
        };

        expect(result.vertices[i].point.x).toBeCloseTo(expected.x, 5);
        expect(result.vertices[i].point.y).toBeCloseTo(expected.y, 5);
      }
    });

    it('should interpolate at t=0.75', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 0.75);

      for (let i = 0; i < result.vertices.length; i++) {
        const srcV = preparedSquares.source.vertices[i];
        const tgtV = preparedSquares.target.vertices[i];
        const expected = {
          x: srcV.point.x + (tgtV.point.x - srcV.point.x) * 0.75,
          y: srcV.point.y + (tgtV.point.y - srcV.point.y) * 0.75,
        };

        expect(result.vertices[i].point.x).toBeCloseTo(expected.x, 5);
        expect(result.vertices[i].point.y).toBeCloseTo(expected.y, 5);
      }
    });
  });

  describe('Clamping behavior', () => {
    it('should clamp t values below 0', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, -0.5);

      for (let i = 0; i < result.vertices.length; i++) {
        expect(result.vertices[i].point.x).toBe(preparedSquares.source.vertices[i].point.x);
        expect(result.vertices[i].point.y).toBe(preparedSquares.source.vertices[i].point.y);
      }
    });

    it('should clamp t values above 1', () => {
      const result = morphPaths(preparedSquares.source, preparedSquares.target, 1.5);

      for (let i = 0; i < result.vertices.length; i++) {
        expect(result.vertices[i].point.x).toBe(preparedSquares.target.vertices[i].point.x);
        expect(result.vertices[i].point.y).toBe(preparedSquares.target.vertices[i].point.y);
      }
    });
  });

  describe('Closed state preservation', () => {
    it('should preserve closed state from source', () => {
      const closedPath: BezierPath = createSquarePath();
      const openPath: BezierPath = {
        vertices: createSquarePath().vertices,
        closed: false,
      };

      // When morphing, result should use source's closed state
      const result = morphPaths(closedPath, openPath, 0.5);
      expect(result.closed).toBe(true);
    });
  });
});

// ============================================================================
// CONVENIENCE FUNCTION TESTS
// ============================================================================

describe('morphPathsAuto', () => {
  it('should combine preparation and morphing', () => {
    const triangle = createTrianglePath();
    const square = createSquarePath();

    const result = morphPathsAuto(triangle, square, 0.5);

    // Should return a valid path with interpolated vertices
    expect(result.vertices.length).toBeGreaterThan(0);
    expect(result.closed).toBe(true);
  });

  it('should accept custom configuration', () => {
    const triangle = createTrianglePath();
    const square = createSquarePath();

    const result = morphPathsAuto(triangle, square, 0.5, {
      pointMatchingStrategy: 'resample',
      resampleCount: 10,
    });

    expect(result.vertices.length).toBe(10);
  });

  it('should produce identical results at t=0 as source', () => {
    const triangle = createTrianglePath();
    const square = createSquarePath();

    const result = morphPathsAuto(triangle, square, 0);
    const prepared = prepareMorphPaths(triangle, square);

    // Should match prepared source
    expect(result.vertices.length).toBe(prepared.source.vertices.length);
  });
});

// ============================================================================
// CORRESPONDENCE TESTS
// ============================================================================

describe('getCorrespondence', () => {
  it('should return correspondence pairs', () => {
    const square1 = createSquarePath();
    const square2 = createSquarePath();

    const correspondence = getCorrespondence(square1, square2);

    expect(correspondence.length).toBeGreaterThan(0);
    expect(correspondence[0]).toHaveProperty('sourceIndex');
    expect(correspondence[0]).toHaveProperty('targetIndex');
  });

  it('should have matching vertex count in correspondence', () => {
    const triangle = createTrianglePath();
    const square = createSquarePath();

    const correspondence = getCorrespondence(triangle, square);

    // After preparation, both paths have same count
    const prepared = prepareMorphPaths(triangle, square);
    expect(correspondence.length).toBe(prepared.source.vertices.length);
  });
});

// ============================================================================
// TYPE GUARD TESTS
// ============================================================================

describe('isBezierPath', () => {
  it('should return true for valid BezierPath', () => {
    const path = createSquarePath();
    expect(isBezierPath(path)).toBe(true);
  });

  it('should return true for empty vertices array', () => {
    const path: BezierPath = { vertices: [], closed: true };
    expect(isBezierPath(path)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isBezierPath(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isBezierPath(undefined)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isBezierPath('string')).toBe(false);
    expect(isBezierPath(123)).toBe(false);
    expect(isBezierPath(true)).toBe(false);
  });

  it('should return false for object without vertices', () => {
    expect(isBezierPath({ closed: true })).toBe(false);
  });

  it('should return false for object without closed', () => {
    expect(isBezierPath({ vertices: [] })).toBe(false);
  });

  it('should return false for non-array vertices', () => {
    expect(isBezierPath({ vertices: 'not-array', closed: true })).toBe(false);
  });

  it('should return false for non-boolean closed', () => {
    expect(isBezierPath({ vertices: [], closed: 'yes' })).toBe(false);
  });

  it('should validate vertex structure', () => {
    const invalidVertices = {
      vertices: [{ not: 'a vertex' }],
      closed: true,
    };
    expect(isBezierPath(invalidVertices)).toBe(false);
  });

  it('should validate point x coordinate is number', () => {
    const invalidX = {
      vertices: [{ point: { x: 'not-number', y: 0 }, inHandle: { x: 0, y: 0 }, outHandle: { x: 0, y: 0 } }],
      closed: true,
    };
    expect(isBezierPath(invalidX)).toBe(false);
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('PathMorphing utilities', () => {
  describe('getPathLength', () => {
    it('should calculate length of a line path', () => {
      const line = createLinePath({ x: 0, y: 0 }, { x: 100, y: 0 });
      const length = PathMorphing.getPathLength(line);

      // Horizontal line should be ~100 units
      expect(length).toBeCloseTo(100, 0);
    });

    it('should return 0 for single vertex path', () => {
      const single: BezierPath = {
        vertices: [createVertex(50, 50)],
        closed: false,
      };

      const length = PathMorphing.getPathLength(single);
      expect(length).toBe(0);
    });

    it('should calculate perimeter for closed square', () => {
      const square = createSquarePath(100); // 100x100 square
      const length = PathMorphing.getPathLength(square);

      // Perimeter should be ~400 (100 * 4)
      expect(length).toBeCloseTo(400, -1);
    });
  });

  describe('resamplePath', () => {
    it('should resample to specified vertex count', () => {
      const square = createSquarePath();
      const resampled = PathMorphing.resamplePath(square, 8);

      expect(resampled.vertices.length).toBe(8);
    });

    it('should preserve closed state', () => {
      const closed = createSquarePath();
      const open = createLinePath({ x: 0, y: 0 }, { x: 100, y: 0 });

      const resampledClosed = PathMorphing.resamplePath(closed, 8);
      const resampledOpen = PathMorphing.resamplePath(open, 8);

      expect(resampledClosed.closed).toBe(true);
      expect(resampledOpen.closed).toBe(false);
    });

    it('should handle small vertex count', () => {
      const square = createSquarePath();
      const resampled = PathMorphing.resamplePath(square, 2);

      expect(resampled.vertices.length).toBe(2);
    });

    it('should return clone for count < 2', () => {
      const square = createSquarePath();
      const resampled = PathMorphing.resamplePath(square, 1);

      expect(resampled.vertices.length).toBe(square.vertices.length);
    });
  });

  describe('subdivideToVertexCount', () => {
    it('should subdivide to reach target count', () => {
      const triangle = createTrianglePath();
      const subdivided = PathMorphing.subdivideToVertexCount(triangle, 6);

      expect(subdivided.vertices.length).toBe(6);
    });

    it('should return clone if already at target count', () => {
      const square = createSquarePath();
      const subdivided = PathMorphing.subdivideToVertexCount(square, 4);

      expect(subdivided.vertices.length).toBe(4);
      // Should be a clone, not the same object
      expect(subdivided).not.toBe(square);
    });

    it('should return clone if exceeding target count', () => {
      const square = createSquarePath();
      const subdivided = PathMorphing.subdivideToVertexCount(square, 2);

      expect(subdivided.vertices.length).toBe(4); // Unchanged
    });
  });
});

// ============================================================================
// DEFAULT CONFIG TESTS
// ============================================================================

describe('DEFAULT_MORPH_CONFIG', () => {
  it('should have subdivide-shorter as default strategy', () => {
    expect(DEFAULT_MORPH_CONFIG.pointMatchingStrategy).toBe('subdivide-shorter');
  });

  it('should have nearest-rotation as default correspondence method', () => {
    expect(DEFAULT_MORPH_CONFIG.correspondenceMethod).toBe('nearest-rotation');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Path Morphing Integration', () => {
  it('should morph triangle to square smoothly', () => {
    const triangle = createTrianglePath(100);
    const square = createSquarePath(100);

    // Sample the morph at multiple points
    const samples = [0, 0.25, 0.5, 0.75, 1];
    const results = samples.map(t => morphPathsAuto(triangle, square, t));

    // All results should have same vertex count
    const count = results[0].vertices.length;
    results.forEach(r => expect(r.vertices.length).toBe(count));

    // Results should be progressively different
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];

      // Calculate total difference
      let totalDiff = 0;
      for (let j = 0; j < prev.vertices.length; j++) {
        totalDiff += distance(prev.vertices[j].point, curr.vertices[j].point);
      }

      // Should have some difference between steps (not all zero)
      // except possibly at endpoints if source/target are similar
      if (i > 0 && i < results.length - 1) {
        expect(totalDiff).toBeGreaterThan(0);
      }
    }
  });

  it('should morph circle to square with handle interpolation', () => {
    const circle = createCirclePath(50);
    const square = createSquarePath(100);

    const mid = morphPathsAuto(circle, square, 0.5);

    // Verify handles are interpolated (not zero unless source/target both zero)
    const hasNonZeroHandles = mid.vertices.some(v =>
      Math.abs(v.inHandle.x) > 0.01 ||
      Math.abs(v.inHandle.y) > 0.01 ||
      Math.abs(v.outHandle.x) > 0.01 ||
      Math.abs(v.outHandle.y) > 0.01
    );

    // Circle has curved handles, square has zero handles
    // At t=0.5, we should have some handle values from interpolation
    expect(hasNonZeroHandles).toBe(true);
  });

  it('should handle morphing with different closed states', () => {
    const closedSquare = createSquarePath();
    const openLine: BezierPath = {
      vertices: [
        createVertex(0, 0),
        createVertex(100, 0),
        createVertex(100, 100),
        createVertex(0, 100),
      ],
      closed: false,
    };

    // Should not throw
    const result = morphPathsAuto(closedSquare, openLine, 0.5);
    expect(result.vertices.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should handle paths with many vertices', () => {
    // Create path with many vertices
    const manyVertices: BezierVertex[] = [];
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      manyVertices.push(createVertex(
        Math.cos(angle) * 100,
        Math.sin(angle) * 100
      ));
    }

    const path1: BezierPath = { vertices: manyVertices, closed: true };
    const path2: BezierPath = { vertices: manyVertices.map(v => ({
      ...v,
      point: { x: v.point.x * 2, y: v.point.y * 2 }
    })), closed: true };

    const start = performance.now();
    const prepared = prepareMorphPaths(path1, path2);
    const result = morphPaths(prepared.source, prepared.target, 0.5);
    const duration = performance.now() - start;

    expect(result.vertices.length).toBe(100);
    expect(duration).toBeLessThan(100); // Should complete quickly
  });

  it('should efficiently morph at multiple t values', () => {
    const triangle = createTrianglePath();
    const square = createSquarePath();

    const prepared = prepareMorphPaths(triangle, square);

    const start = performance.now();
    for (let i = 0; i <= 100; i++) {
      morphPaths(prepared.source, prepared.target, i / 100);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50); // 100 morphs should be fast
  });
});
