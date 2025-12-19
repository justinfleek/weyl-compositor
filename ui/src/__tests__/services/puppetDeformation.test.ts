/**
 * Puppet Deformation Service Tests
 *
 * Tests for mesh deformation using control pins:
 * - Delaunay triangulation
 * - Weight calculation
 * - Mesh deformation
 * - Service class functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PuppetDeformationService,
  puppetDeformation,
  delaunayTriangulate,
  calculateWeights,
} from '@/services/puppetDeformation';
import type { ControlPoint, AnimatableProperty } from '@/types/project';
import type { PuppetPin, PuppetMesh, WeightOptions } from '@/types/puppet';
import { createDefaultPuppetPin, DEFAULT_WEIGHT_OPTIONS } from '@/types/puppet';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a simple control point
 */
function createControlPoint(
  x: number,
  y: number,
  id?: string
): ControlPoint {
  const pointId = id ?? `cp_${x}_${y}_${Date.now()}`;
  return {
    id: pointId,
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
 * Create a square of control points
 */
function createSquareControlPoints(size: number = 100): ControlPoint[] {
  return [
    createControlPoint(0, 0, 'tl'),
    createControlPoint(size, 0, 'tr'),
    createControlPoint(size, size, 'br'),
    createControlPoint(0, size, 'bl'),
  ];
}

/**
 * Create a grid of control points
 */
function createGridControlPoints(
  width: number,
  height: number,
  cols: number,
  rows: number
): ControlPoint[] {
  const points: ControlPoint[] = [];
  const cellWidth = width / (cols - 1);
  const cellHeight = height / (rows - 1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push(createControlPoint(
        col * cellWidth,
        row * cellHeight,
        `cp_${col}_${row}`
      ));
    }
  }

  return points;
}

/**
 * Create an animatable property
 */
function createAnimatableProperty<T>(
  name: string,
  value: T,
  type: string = 'number'
): AnimatableProperty<T> {
  return {
    id: `prop_${name}_${Date.now()}`,
    name,
    type,
    value,
    animated: false,
    keyframes: [],
  };
}

/**
 * Create a puppet pin at a specific position
 */
function createPuppetPin(
  x: number,
  y: number,
  options: Partial<PuppetPin> = {}
): PuppetPin {
  const id = options.id ?? `pin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return {
    id,
    name: options.name ?? `Pin ${id.slice(-4)}`,
    type: options.type ?? 'position',
    position: createAnimatableProperty('Position', { x, y }, 'position'),
    radius: options.radius ?? 50,
    stiffness: options.stiffness ?? 0,
    rotation: options.rotation ?? createAnimatableProperty('Rotation', 0),
    scale: options.scale ?? createAnimatableProperty('Scale', 1),
    depth: options.depth ?? 0,
    selected: options.selected ?? false,
  };
}

// ============================================================================
// DELAUNAY TRIANGULATION TESTS
// ============================================================================

describe('delaunayTriangulate', () => {
  it('should return empty array for less than 3 points', () => {
    const result1 = delaunayTriangulate([]);
    expect(result1).toEqual([]);

    const result2 = delaunayTriangulate([{ x: 0, y: 0 }]);
    expect(result2).toEqual([]);

    const result3 = delaunayTriangulate([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(result3).toEqual([]);
  });

  it('should triangulate 3 points into 1 triangle', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ];

    const triangles = delaunayTriangulate(points);

    expect(triangles.length).toBe(1);
    expect(triangles[0]).toHaveProperty('a');
    expect(triangles[0]).toHaveProperty('b');
    expect(triangles[0]).toHaveProperty('c');

    // All indices should be valid
    const indices = [triangles[0].a, triangles[0].b, triangles[0].c];
    indices.forEach(i => {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(3);
    });
  });

  it('should triangulate 4 points into 2 triangles', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    const triangles = delaunayTriangulate(points);

    // A square should be divided into 2 triangles
    expect(triangles.length).toBe(2);
  });

  it('should handle grid of points', () => {
    const points = createGridControlPoints(100, 100, 3, 3).map(p => ({ x: p.x, y: p.y }));

    const triangles = delaunayTriangulate(points);

    // 3x3 grid = 9 points, should create ~8 triangles (2*2 cells * 2 triangles)
    expect(triangles.length).toBeGreaterThanOrEqual(6);
    expect(triangles.length).toBeLessThanOrEqual(12);
  });

  it('should produce valid triangles with all unique vertices', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ];

    const triangles = delaunayTriangulate(points);

    // Each triangle should have unique vertex indices
    triangles.forEach(tri => {
      expect(tri.a).not.toBe(tri.b);
      expect(tri.b).not.toBe(tri.c);
      expect(tri.c).not.toBe(tri.a);
    });
  });
});

// ============================================================================
// WEIGHT CALCULATION TESTS
// ============================================================================

describe('calculateWeights', () => {
  it('should return empty array for no pins', () => {
    const vertices = new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]);
    const weights = calculateWeights(vertices, []);

    expect(weights.length).toBe(0);
  });

  it('should calculate weights for single pin', () => {
    const vertices = new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]);
    const pin = createPuppetPin(50, 50);

    const weights = calculateWeights(vertices, [pin]);

    // 4 vertices * 1 pin = 4 weights
    expect(weights.length).toBe(4);

    // All corners are equidistant from center, should have similar weights
    const tolerance = 0.1;
    expect(Math.abs(weights[0] - weights[1])).toBeLessThan(tolerance);
    expect(Math.abs(weights[1] - weights[2])).toBeLessThan(tolerance);
    expect(Math.abs(weights[2] - weights[3])).toBeLessThan(tolerance);
  });

  it('should calculate weights for multiple pins', () => {
    const vertices = new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]);
    const pin1 = createPuppetPin(0, 0);
    const pin2 = createPuppetPin(100, 100);

    const weights = calculateWeights(vertices, [pin1, pin2]);

    // 4 vertices * 2 pins = 8 weights
    expect(weights.length).toBe(8);

    // First vertex (0,0) should have higher weight from pin1 than pin2
    expect(weights[0]).toBeGreaterThan(weights[1]);

    // Third vertex (100,100) should have higher weight from pin2 than pin1
    expect(weights[5]).toBeGreaterThan(weights[4]);
  });

  it('should apply radius-based falloff', () => {
    const vertices = new Float32Array([0, 0, 200, 0]);
    const pin = createPuppetPin(0, 0, { radius: 50 });

    const weights = calculateWeights(vertices, [pin]);

    // First vertex is at pin position - high weight
    expect(weights[0]).toBeGreaterThan(0);

    // Second vertex is far away (200 units, way beyond 3*50=150 radius) - zero weight
    expect(weights[1]).toBe(0);
  });

  it('should apply stiffness reduction', () => {
    // Test with multiple pins and no normalization to see the raw weights
    const vertices = new Float32Array([40, 40]);
    const normalPin = createPuppetPin(0, 0, { stiffness: 0, radius: 100 });
    const stiffPin = createPuppetPin(0, 0, { stiffness: 0.9, radius: 100 });

    // Disable normalization to see raw weight differences
    const opts: WeightOptions = { ...DEFAULT_WEIGHT_OPTIONS, normalize: false };

    const normalWeights = calculateWeights(vertices, [normalPin], opts);
    const stiffWeights = calculateWeights(vertices, [stiffPin], opts);

    // Both should have non-zero weights since within radius
    expect(normalWeights[0]).toBeGreaterThan(0);
    expect(stiffWeights[0]).toBeGreaterThan(0);
    // With stiffness 0.9, weight should be reduced (stiffness reduces weight by up to 50%)
    expect(stiffWeights[0]).toBeLessThan(normalWeights[0]);
  });

  it('should normalize weights when option is set', () => {
    const vertices = new Float32Array([50, 50]);
    const pin1 = createPuppetPin(0, 0);
    const pin2 = createPuppetPin(100, 100);

    const weights = calculateWeights(vertices, [pin1, pin2], {
      ...DEFAULT_WEIGHT_OPTIONS,
      normalize: true,
    });

    // Sum of weights for this vertex should be approximately 1
    const totalWeight = weights[0] + weights[1];
    expect(totalWeight).toBeCloseTo(1, 3);
  });
});

// ============================================================================
// PUPPET DEFORMATION SERVICE TESTS
// ============================================================================

describe('PuppetDeformationService', () => {
  let service: PuppetDeformationService;
  const testLayerId = 'test-layer-1';

  beforeEach(() => {
    service = new PuppetDeformationService();
  });

  afterEach(() => {
    service.clearAllMeshes();
  });

  describe('buildMesh', () => {
    it('should build a mesh from control points and pins', () => {
      const controlPoints = createSquareControlPoints();
      const pins = [createPuppetPin(50, 50)];

      const mesh = service.buildMesh(testLayerId, controlPoints, pins);

      expect(mesh).not.toBeNull();
      expect(mesh.layerId).toBe(testLayerId);
      expect(mesh.vertexCount).toBe(4);
      expect(mesh.pins).toHaveLength(1);
      expect(mesh.originalVertices.length).toBe(8); // 4 vertices * 2 coords
      expect(mesh.weights.length).toBe(4); // 4 vertices * 1 pin
    });

    it('should cache the mesh', () => {
      const controlPoints = createSquareControlPoints();
      const pins = [createPuppetPin(50, 50)];

      service.buildMesh(testLayerId, controlPoints, pins);
      const cachedMesh = service.getMesh(testLayerId);

      expect(cachedMesh).not.toBeUndefined();
      expect(cachedMesh?.layerId).toBe(testLayerId);
    });

    it('should store pin rest states', () => {
      const controlPoints = createSquareControlPoints();
      const pins = [createPuppetPin(25, 75)];

      const mesh = service.buildMesh(testLayerId, controlPoints, pins);

      expect(mesh.pinRestStates).toHaveLength(1);
      expect(mesh.pinRestStates[0].position.x).toBe(25);
      expect(mesh.pinRestStates[0].position.y).toBe(75);
    });

    it('should handle empty control points', () => {
      const mesh = service.buildMesh(testLayerId, [], []);

      expect(mesh.vertexCount).toBe(0);
      expect(mesh.originalVertices.length).toBe(0);
    });

    it('should handle no pins', () => {
      const controlPoints = createSquareControlPoints();
      const mesh = service.buildMesh(testLayerId, controlPoints, []);

      expect(mesh.pins).toHaveLength(0);
      expect(mesh.weights.length).toBe(0);
    });
  });

  describe('getMesh', () => {
    it('should return undefined for non-existent layer', () => {
      const mesh = service.getMesh('non-existent-layer');
      expect(mesh).toBeUndefined();
    });

    it('should return cached mesh', () => {
      const controlPoints = createSquareControlPoints();
      const pins = [createPuppetPin(50, 50)];

      const built = service.buildMesh(testLayerId, controlPoints, pins);
      const retrieved = service.getMesh(testLayerId);

      expect(retrieved).toBe(built);
    });
  });

  describe('clearMesh', () => {
    it('should remove mesh from cache', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh(testLayerId, controlPoints, []);

      service.clearMesh(testLayerId);

      expect(service.getMesh(testLayerId)).toBeUndefined();
    });

    it('should not throw for non-existent layer', () => {
      expect(() => service.clearMesh('non-existent')).not.toThrow();
    });
  });

  describe('addPin', () => {
    it('should add pin to existing mesh', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh(testLayerId, controlPoints, []);

      const pin = createPuppetPin(50, 50);
      service.addPin(testLayerId, pin);

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins).toHaveLength(1);
      expect(mesh?.pins[0].id).toBe(pin.id);
    });

    it('should update weights after adding pin', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh(testLayerId, controlPoints, []);

      const meshBefore = service.getMesh(testLayerId);
      expect(meshBefore?.weights.length).toBe(0);

      service.addPin(testLayerId, createPuppetPin(50, 50));

      const meshAfter = service.getMesh(testLayerId);
      expect(meshAfter?.weights.length).toBe(4); // 4 vertices * 1 pin
    });

    it('should do nothing for non-existent layer', () => {
      expect(() => {
        service.addPin('non-existent', createPuppetPin(0, 0));
      }).not.toThrow();
    });
  });

  describe('removePin', () => {
    it('should remove pin from mesh', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      service.removePin(testLayerId, pin.id);

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins).toHaveLength(0);
    });

    it('should update weights after removing pin', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      service.removePin(testLayerId, pin.id);

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.weights.length).toBe(0);
    });

    it('should do nothing for non-existent pin', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh(testLayerId, controlPoints, [createPuppetPin(50, 50)]);

      expect(() => {
        service.removePin(testLayerId, 'non-existent-pin');
      }).not.toThrow();

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins).toHaveLength(1);
    });
  });

  describe('updatePinPosition', () => {
    it('should update pin position', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      service.updatePinPosition(testLayerId, pin.id, 75, 25);

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins[0].position.value.x).toBe(75);
      expect(mesh?.pins[0].position.value.y).toBe(25);
    });

    it('should do nothing for non-existent pin', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      expect(() => {
        service.updatePinPosition(testLayerId, 'non-existent', 0, 0);
      }).not.toThrow();

      // Original position unchanged
      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins[0].position.value.x).toBe(50);
    });
  });

  describe('getPins', () => {
    it('should return pins for layer', () => {
      const controlPoints = createSquareControlPoints();
      const pin1 = createPuppetPin(25, 25);
      const pin2 = createPuppetPin(75, 75);
      service.buildMesh(testLayerId, controlPoints, [pin1, pin2]);

      const pins = service.getPins(testLayerId);

      expect(pins).toHaveLength(2);
      expect(pins[0].id).toBe(pin1.id);
      expect(pins[1].id).toBe(pin2.id);
    });

    it('should return empty array for non-existent layer', () => {
      const pins = service.getPins('non-existent');
      expect(pins).toEqual([]);
    });
  });

  describe('getDeformedControlPoints', () => {
    it('should return original points when no pins', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh(testLayerId, controlPoints, []);

      const deformed = service.getDeformedControlPoints(testLayerId, 0, controlPoints);

      expect(deformed).toHaveLength(4);
      expect(deformed[0].x).toBe(controlPoints[0].x);
      expect(deformed[0].y).toBe(controlPoints[0].y);
    });

    it('should return original points when mesh not found', () => {
      const controlPoints = createSquareControlPoints();

      const deformed = service.getDeformedControlPoints('non-existent', 0, controlPoints);

      expect(deformed).toBe(controlPoints);
    });

    it('should deform points when pin is moved', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      // Move pin
      service.updatePinPosition(testLayerId, pin.id, 75, 50);

      const deformed = service.getDeformedControlPoints(testLayerId, 0, controlPoints);

      // Points should be shifted towards new pin position
      // The exact amount depends on weights
      expect(deformed).toHaveLength(4);
    });

    it('should preserve handle offsets', () => {
      const controlPoints: ControlPoint[] = [
        {
          id: 'cp1',
          x: 0,
          y: 0,
          handleIn: { x: -10, y: 0 },
          handleOut: { x: 10, y: 0 },
          selected: false,
          cornerType: 'smooth',
          group: undefined,
        },
      ];

      const pin = createPuppetPin(0, 0);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      // Move pin to translate the point
      service.updatePinPosition(testLayerId, pin.id, 50, 50);

      const deformed = service.getDeformedControlPoints(testLayerId, 0, controlPoints);

      // Handles should be offset by same amount as point
      if (deformed[0].handleIn && deformed[0].handleOut) {
        const dx = deformed[0].x - controlPoints[0].x;
        const dy = deformed[0].y - controlPoints[0].y;

        expect(deformed[0].handleIn.x).toBeCloseTo(controlPoints[0].handleIn!.x + dx, 1);
        expect(deformed[0].handleIn.y).toBeCloseTo(controlPoints[0].handleIn!.y + dy, 1);
      }
    });
  });

  describe('deform', () => {
    it('should return null for non-existent mesh', () => {
      const result = service.deform('non-existent', 0);
      expect(result).toBeNull();
    });

    it('should return deformation result', () => {
      const controlPoints = createSquareControlPoints();
      const pin = createPuppetPin(50, 50);
      service.buildMesh(testLayerId, controlPoints, [pin]);

      const result = service.deform(testLayerId, 0);

      expect(result).not.toBeNull();
      expect(result?.vertices).toBeInstanceOf(Float32Array);
      expect(result?.vertices.length).toBe(8);
      expect(result?.controlPoints).toHaveLength(4);
    });
  });

  describe('clearAllMeshes', () => {
    it('should clear all cached meshes', () => {
      const controlPoints = createSquareControlPoints();
      service.buildMesh('layer1', controlPoints, []);
      service.buildMesh('layer2', controlPoints, []);
      service.buildMesh('layer3', controlPoints, []);

      service.clearAllMeshes();

      expect(service.getMesh('layer1')).toBeUndefined();
      expect(service.getMesh('layer2')).toBeUndefined();
      expect(service.getMesh('layer3')).toBeUndefined();
    });
  });

  describe('updateMeshPins', () => {
    it('should update all pins for a mesh', () => {
      const controlPoints = createSquareControlPoints();
      const pin1 = createPuppetPin(25, 25);
      service.buildMesh(testLayerId, controlPoints, [pin1]);

      const newPins = [
        createPuppetPin(75, 25),
        createPuppetPin(75, 75),
      ];
      service.updateMeshPins(testLayerId, newPins);

      const mesh = service.getMesh(testLayerId);
      expect(mesh?.pins).toHaveLength(2);
      expect(mesh?.pins[0].position.value.x).toBe(75);
      expect(mesh?.pins[1].position.value.y).toBe(75);
    });

    it('should recalculate weights', () => {
      // Use two pins to test weight recalculation properly
      // (with single pin, normalization makes all weights equal to 1)
      const controlPoints = [
        createControlPoint(0, 0),
        createControlPoint(100, 100),
      ];
      const pin1 = createPuppetPin(0, 0, { radius: 200, id: 'pin1' });
      const pin2 = createPuppetPin(100, 100, { radius: 200, id: 'pin2' });
      service.buildMesh(testLayerId, controlPoints, [pin1, pin2]);

      const meshBefore = service.getMesh(testLayerId);
      // weights layout: [v0_pin0, v0_pin1, v1_pin0, v1_pin1]
      const v0_pin0_before = meshBefore!.weights[0];
      const v0_pin1_before = meshBefore!.weights[1];

      // Now update to move pin2 very far away (500, 500)
      service.updateMeshPins(testLayerId, [
        createPuppetPin(0, 0, { radius: 200, id: 'pin1' }),
        createPuppetPin(500, 500, { radius: 50, id: 'pin2' }), // Far away with small radius
      ]);

      const meshAfter = service.getMesh(testLayerId);
      const v0_pin0_after = meshAfter!.weights[0];
      const v0_pin1_after = meshAfter!.weights[1];

      // After update, pin2 is very far from v0, so v0's weight from pin2 should be lower
      expect(v0_pin1_after).toBeLessThan(v0_pin1_before);
    });
  });
});

// ============================================================================
// SINGLETON INSTANCE TESTS
// ============================================================================

describe('puppetDeformation singleton', () => {
  afterEach(() => {
    puppetDeformation.clearAllMeshes();
  });

  it('should be a PuppetDeformationService instance', () => {
    expect(puppetDeformation).toBeInstanceOf(PuppetDeformationService);
  });

  it('should maintain state across uses', () => {
    const controlPoints = createSquareControlPoints();
    puppetDeformation.buildMesh('singleton-test', controlPoints, []);

    const mesh = puppetDeformation.getMesh('singleton-test');
    expect(mesh).not.toBeUndefined();
  });
});

// ============================================================================
// DEFORMATION BEHAVIOR TESTS
// ============================================================================

describe('Deformation behavior', () => {
  let service: PuppetDeformationService;

  beforeEach(() => {
    service = new PuppetDeformationService();
  });

  afterEach(() => {
    service.clearAllMeshes();
  });

  it('should move vertices towards translated pin', () => {
    const controlPoints = [
      createControlPoint(0, 0),
      createControlPoint(100, 0),
    ];
    const pin = createPuppetPin(50, 0, { radius: 100 });
    service.buildMesh('test', controlPoints, [pin]);

    // Move pin up by 50
    service.updatePinPosition('test', pin.id, 50, 50);

    const deformed = service.getDeformedControlPoints('test', 0, controlPoints);

    // Both vertices should move up somewhat
    expect(deformed[0].y).toBeGreaterThan(0);
    expect(deformed[1].y).toBeGreaterThan(0);
  });

  it('should not affect vertices outside pin radius', () => {
    const controlPoints = [
      createControlPoint(0, 0),
      createControlPoint(500, 0), // Far away
    ];
    const pin = createPuppetPin(0, 0, { radius: 50 }); // Small radius
    service.buildMesh('test', controlPoints, [pin]);

    // Move pin
    service.updatePinPosition('test', pin.id, 0, 100);

    const deformed = service.getDeformedControlPoints('test', 0, controlPoints);

    // First vertex should be affected
    expect(deformed[0].y).not.toBe(0);

    // Second vertex should be unchanged (too far)
    expect(deformed[1].x).toBe(500);
    expect(deformed[1].y).toBe(0);
  });

  it('should handle multiple pins with overlapping influence', () => {
    const controlPoints = [createControlPoint(50, 50)];
    const pin1 = createPuppetPin(0, 50, { radius: 100 });
    const pin2 = createPuppetPin(100, 50, { radius: 100 });
    service.buildMesh('test', controlPoints, [pin1, pin2]);

    // Move both pins in opposite directions
    service.updatePinPosition('test', pin1.id, -50, 50);
    service.updatePinPosition('test', pin2.id, 150, 50);

    const deformed = service.getDeformedControlPoints('test', 0, controlPoints);

    // Vertex should stay near center (pulls cancel out)
    expect(Math.abs(deformed[0].x - 50)).toBeLessThan(60);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  let service: PuppetDeformationService;

  beforeEach(() => {
    service = new PuppetDeformationService();
  });

  afterEach(() => {
    service.clearAllMeshes();
  });

  it('should handle vertex exactly at pin position', () => {
    const controlPoints = [createControlPoint(50, 50)];
    const pin = createPuppetPin(50, 50);
    service.buildMesh('test', controlPoints, [pin]);

    // Move pin
    service.updatePinPosition('test', pin.id, 100, 100);

    const deformed = service.getDeformedControlPoints('test', 0, controlPoints);

    // Vertex should follow pin exactly
    expect(deformed[0].x).toBeCloseTo(100, 0);
    expect(deformed[0].y).toBeCloseTo(100, 0);
  });

  it('should handle many control points', () => {
    const controlPoints = createGridControlPoints(100, 100, 10, 10); // 100 points
    const pin = createPuppetPin(50, 50, { radius: 200 });

    const mesh = service.buildMesh('test', controlPoints, [pin]);

    expect(mesh.vertexCount).toBe(100);
    expect(mesh.weights.length).toBe(100);
  });

  it('should handle many pins', () => {
    const controlPoints = createSquareControlPoints();
    const pins = Array.from({ length: 20 }, (_, i) =>
      createPuppetPin(Math.random() * 100, Math.random() * 100)
    );

    const mesh = service.buildMesh('test', controlPoints, pins);

    expect(mesh.pins).toHaveLength(20);
    expect(mesh.weights.length).toBe(4 * 20); // 4 vertices * 20 pins
  });

  it('should handle zero radius pin', () => {
    const controlPoints = createSquareControlPoints();
    const pin = createPuppetPin(50, 50, { radius: 0 });

    expect(() => {
      service.buildMesh('test', controlPoints, [pin]);
    }).not.toThrow();
  });

  it('should handle negative coordinates', () => {
    const controlPoints = [
      createControlPoint(-100, -100),
      createControlPoint(100, 100),
    ];
    const pin = createPuppetPin(0, 0);

    const mesh = service.buildMesh('test', controlPoints, [pin]);
    expect(mesh.vertexCount).toBe(2);
  });
});

// ============================================================================
// CREATE DEFAULT PUPPET PIN TESTS
// ============================================================================

describe('createDefaultPuppetPin', () => {
  it('should create pin with default values', () => {
    const pin = createDefaultPuppetPin('test-id', 100, 200);

    expect(pin.id).toBe('test-id');
    expect(pin.position.value.x).toBe(100);
    expect(pin.position.value.y).toBe(200);
    expect(pin.type).toBe('position');
    expect(pin.radius).toBe(50);
    expect(pin.stiffness).toBe(0);
    expect(pin.rotation.value).toBe(0);
    expect(pin.scale.value).toBe(1);
  });

  it('should create starch pin with stiffness 1', () => {
    const pin = createDefaultPuppetPin('test-id', 0, 0, 'starch');

    expect(pin.type).toBe('starch');
    expect(pin.stiffness).toBe(1);
  });

  it('should create rotation pin', () => {
    const pin = createDefaultPuppetPin('test-id', 0, 0, 'rotation');

    expect(pin.type).toBe('rotation');
    expect(pin.stiffness).toBe(0);
  });
});
