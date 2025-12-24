/**
 * Frame Evaluation Determinism Integration Tests
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Frame evaluation MUST be deterministic.
 * Same frame + same project state = byte-identical output.
 *
 * This is the foundation of scrub-determinism:
 * - Scrub to frame 50, then 10, then back to 50 → identical output
 * - No accumulated state between frames
 * - No Math.random() or Date.now() in evaluation logic
 *
 * Tests verify:
 * 1. MotionEngine.evaluate() returns identical results for same inputs
 * 2. Interpolation produces consistent values
 * 3. Property evaluation order doesn't affect results
 * 4. Cache behavior doesn't change output
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MotionEngine, type FrameState, type EvaluatedLayer } from '@/engine/MotionEngine';
import { interpolateProperty, clearBezierCache } from '@/services/interpolation';
import { createAnimatableProperty } from '@/types/project';
import type { LatticeProject, Composition, Layer, AnimatableProperty, Keyframe } from '@/types/project';

// Create a minimal valid project for testing
function createTestProject(layers: Layer[] = []): LatticeProject {
  const compId = 'comp_test';

  const composition: Composition = {
    id: compId,
    name: 'Test Comp',
    settings: {
      name: 'Test Comp',
      width: 1920,
      height: 1080,
      frameCount: 81,
      fps: 16,
      backgroundColor: '#000000'
    },
    layers
  };

  return {
    version: '1.0.0',
    mainCompositionId: compId,
    compositions: { [compId]: composition },
    composition: { width: 1920, height: 1080 },
    assets: [],
    meta: {
      name: 'Test Project',
      created: '2025-01-01T00:00:00Z',
      modified: '2025-01-01T00:00:00Z'
    }
  } as LatticeProject;
}

// Create a layer with keyframed position
function createAnimatedLayer(id: string, keyframes: Keyframe<{ x: number; y: number }>[]): Layer {
  const position = createAnimatableProperty('position', { x: 0, y: 0 }, 'vector2');
  position.animated = keyframes.length > 0;
  position.keyframes = keyframes;

  return {
    id,
    name: `Layer ${id}`,
    type: 'solid',
    visible: true,
    locked: false,
    isolate: false,
    threeD: false,
    motionBlur: false,
    startFrame: 0,
    endFrame: 80,
    inPoint: 0,
    outPoint: 80,
    parentId: null,
    blendMode: 'normal',
    opacity: createAnimatableProperty('opacity', 100, 'number'),
    transform: {
      position,
      scale: createAnimatableProperty('scale', { x: 100, y: 100 }, 'vector2'),
      rotation: createAnimatableProperty('rotation', 0, 'number'),
      origin: createAnimatableProperty('origin', { x: 0, y: 0 }, 'vector2')
    },
    properties: [],
    effects: [],
    data: { color: '#808080', width: 1920, height: 1080 }
  } as unknown as Layer;
}

describe('Frame Evaluation Determinism', () => {
  let engine: MotionEngine;

  beforeEach(() => {
    engine = new MotionEngine();
    clearBezierCache();
  });

  describe('Basic Determinism', () => {
    it('returns identical FrameState for same inputs', () => {
      const layer = createAnimatedLayer('layer1', [
        { id: 'kf1', frame: 0, value: { x: 0, y: 0 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 40, value: { x: 500, y: 300 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf3', frame: 80, value: { x: 1000, y: 600 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ]);

      const project = createTestProject([layer]);

      // Evaluate frame 20 twice
      const state1 = engine.evaluate(20, project, null, null, false);
      const state2 = engine.evaluate(20, project, null, null, false);

      // States must be identical
      expect(state1.frame).toBe(state2.frame);
      expect(state1.layers.length).toBe(state2.layers.length);

      const layer1 = state1.layers[0];
      const layer2 = state2.layers[0];

      expect(layer1.transform.position.x).toBe(layer2.transform.position.x);
      expect(layer1.transform.position.y).toBe(layer2.transform.position.y);
      expect(layer1.opacity).toBe(layer2.opacity);
    });

    it('produces identical results regardless of evaluation order', () => {
      const layer = createAnimatedLayer('layer1', [
        { id: 'kf1', frame: 0, value: { x: 0, y: 0 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 80, value: { x: 800, y: 600 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ]);

      const project = createTestProject([layer]);

      // Evaluate in different orders
      engine.invalidateCache();
      const stateA_50 = engine.evaluate(50, project, null, null, false);

      engine.invalidateCache();
      const stateB_10 = engine.evaluate(10, project, null, null, false);
      const stateB_80 = engine.evaluate(80, project, null, null, false);
      const stateB_50 = engine.evaluate(50, project, null, null, false);

      engine.invalidateCache();
      const stateC_80 = engine.evaluate(80, project, null, null, false);
      const stateC_50 = engine.evaluate(50, project, null, null, false);
      const stateC_10 = engine.evaluate(10, project, null, null, false);

      // Frame 50 must be identical regardless of evaluation order
      expect(stateA_50.layers[0].transform.position.x).toBe(stateB_50.layers[0].transform.position.x);
      expect(stateA_50.layers[0].transform.position.y).toBe(stateB_50.layers[0].transform.position.y);
      expect(stateB_50.layers[0].transform.position.x).toBe(stateC_50.layers[0].transform.position.x);
      expect(stateB_50.layers[0].transform.position.y).toBe(stateC_50.layers[0].transform.position.y);
    });

    it('returns identical results with cache enabled vs disabled', () => {
      const layer = createAnimatedLayer('layer1', [
        { id: 'kf1', frame: 0, value: { x: 100, y: 100 }, interpolation: 'bezier', inHandle: { frame: -10, value: 0, enabled: true }, outHandle: { frame: 10, value: 50, enabled: true }, controlMode: 'smooth' },
        { id: 'kf2', frame: 40, value: { x: 500, y: 500 }, interpolation: 'bezier', inHandle: { frame: -10, value: -50, enabled: true }, outHandle: { frame: 10, value: 50, enabled: true }, controlMode: 'smooth' }
      ]);

      const project = createTestProject([layer]);

      // With cache
      const stateWithCache = engine.evaluate(20, project, null, null, true);
      // Without cache
      engine.invalidateCache();
      const stateWithoutCache = engine.evaluate(20, project, null, null, false);

      expect(stateWithCache.layers[0].transform.position.x).toBeCloseTo(stateWithoutCache.layers[0].transform.position.x, 10);
      expect(stateWithCache.layers[0].transform.position.y).toBeCloseTo(stateWithoutCache.layers[0].transform.position.y, 10);
    });
  });

  describe('Interpolation Determinism', () => {
    it('linear interpolation is exact', () => {
      const property = createAnimatableProperty('test', 0, 'number');
      property.animated = true;
      property.keyframes = [
        { id: 'kf1', frame: 0, value: 0, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 100, value: 100, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ];

      // Linear interpolation should be mathematically exact
      expect(interpolateProperty(property, 0)).toBe(0);
      expect(interpolateProperty(property, 25)).toBe(25);
      expect(interpolateProperty(property, 50)).toBe(50);
      expect(interpolateProperty(property, 75)).toBe(75);
      expect(interpolateProperty(property, 100)).toBe(100);
    });

    it('hold interpolation stays at previous value', () => {
      const property = createAnimatableProperty('test', 0, 'number');
      property.animated = true;
      property.keyframes = [
        { id: 'kf1', frame: 0, value: 100, interpolation: 'hold', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 50, value: 200, interpolation: 'hold', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ];

      // Hold should stay at first keyframe value until next keyframe
      expect(interpolateProperty(property, 0)).toBe(100);
      expect(interpolateProperty(property, 25)).toBe(100);
      expect(interpolateProperty(property, 49)).toBe(100);
      expect(interpolateProperty(property, 50)).toBe(200);
      expect(interpolateProperty(property, 100)).toBe(200);
    });

    it('bezier interpolation is consistent', () => {
      const property = createAnimatableProperty('test', 0, 'number');
      property.animated = true;
      property.keyframes = [
        {
          id: 'kf1', frame: 0, value: 0, interpolation: 'bezier',
          inHandle: { frame: 0, value: 0, enabled: false },
          outHandle: { frame: 20, value: 50, enabled: true },
          controlMode: 'smooth'
        },
        {
          id: 'kf2', frame: 80, value: 100, interpolation: 'bezier',
          inHandle: { frame: -20, value: -50, enabled: true },
          outHandle: { frame: 0, value: 0, enabled: false },
          controlMode: 'smooth'
        }
      ];

      // Evaluate same frames multiple times
      const results1: number[] = [];
      const results2: number[] = [];

      for (let f = 0; f <= 80; f += 5) {
        results1.push(interpolateProperty(property, f) as number);
      }

      clearBezierCache(); // Clear cache to test without memoization

      for (let f = 0; f <= 80; f += 5) {
        results2.push(interpolateProperty(property, f) as number);
      }

      // Results must be identical
      results1.forEach((val, idx) => {
        expect(val).toBeCloseTo(results2[idx], 10);
      });
    });

    it('vector interpolation handles both axes correctly', () => {
      const property = createAnimatableProperty('position', { x: 0, y: 0 }, 'vector2');
      property.animated = true;
      property.keyframes = [
        { id: 'kf1', frame: 0, value: { x: 0, y: 100 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 50, value: { x: 200, y: 0 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ];

      const mid = interpolateProperty(property, 25) as { x: number; y: number };

      expect(mid.x).toBe(100);
      expect(mid.y).toBe(50);
    });

    it('returns first keyframe value before first keyframe', () => {
      const property = createAnimatableProperty('test', 0, 'number');
      property.animated = true;
      property.keyframes = [
        { id: 'kf1', frame: 20, value: 50, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 60, value: 100, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ];

      expect(interpolateProperty(property, 0)).toBe(50);
      expect(interpolateProperty(property, 10)).toBe(50);
      expect(interpolateProperty(property, 19)).toBe(50);
    });

    it('returns last keyframe value after last keyframe', () => {
      const property = createAnimatableProperty('test', 0, 'number');
      property.animated = true;
      property.keyframes = [
        { id: 'kf1', frame: 20, value: 50, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
        { id: 'kf2', frame: 60, value: 100, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ];

      expect(interpolateProperty(property, 60)).toBe(100);
      expect(interpolateProperty(property, 70)).toBe(100);
      expect(interpolateProperty(property, 100)).toBe(100);
    });
  });

  describe('Layer Visibility Evaluation', () => {
    it('layer is invisible outside start/end frame range', () => {
      const layer = createAnimatedLayer('layer1', []);
      layer.startFrame = 20;
      layer.endFrame = 60;

      const project = createTestProject([layer]);

      const stateBefore = engine.evaluate(10, project, null, null, false);
      const stateInRange = engine.evaluate(40, project, null, null, false);
      const stateAfter = engine.evaluate(70, project, null, null, false);

      expect(stateBefore.layers[0].inRange).toBe(false);
      expect(stateInRange.layers[0].inRange).toBe(true);
      expect(stateAfter.layers[0].inRange).toBe(false);
    });

    it('layer visibility flag is respected', () => {
      const layer = createAnimatedLayer('layer1', []);
      layer.visible = false;

      const project = createTestProject([layer]);
      const state = engine.evaluate(40, project, null, null, false);

      expect(state.layers[0].visible).toBe(false);
    });
  });

  describe('Multi-Layer Determinism', () => {
    it('evaluates multiple layers consistently', () => {
      const layers = [
        createAnimatedLayer('layer1', [
          { id: 'kf1', frame: 0, value: { x: 0, y: 0 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
          { id: 'kf2', frame: 80, value: { x: 100, y: 100 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
        ]),
        createAnimatedLayer('layer2', [
          { id: 'kf3', frame: 0, value: { x: 200, y: 200 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
          { id: 'kf4', frame: 80, value: { x: 400, y: 400 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
        ]),
        createAnimatedLayer('layer3', [
          { id: 'kf5', frame: 0, value: { x: 500, y: 0 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' },
          { id: 'kf6', frame: 80, value: { x: 500, y: 500 }, interpolation: 'linear', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
        ])
      ];

      const project = createTestProject(layers);

      const state1 = engine.evaluate(40, project, null, null, false);
      engine.invalidateCache();
      const state2 = engine.evaluate(40, project, null, null, false);

      expect(state1.layers.length).toBe(3);
      expect(state2.layers.length).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(state1.layers[i].transform.position.x).toBe(state2.layers[i].transform.position.x);
        expect(state1.layers[i].transform.position.y).toBe(state2.layers[i].transform.position.y);
      }

      // Verify specific values
      expect(state1.layers[0].transform.position.x).toBe(50);
      expect(state1.layers[0].transform.position.y).toBe(50);
      expect(state1.layers[1].transform.position.x).toBe(300);
      expect(state1.layers[1].transform.position.y).toBe(300);
      expect(state1.layers[2].transform.position.x).toBe(500);
      expect(state1.layers[2].transform.position.y).toBe(250);
    });
  });

  describe('FrameState Immutability', () => {
    it('returns frozen FrameState', () => {
      const layer = createAnimatedLayer('layer1', []);
      const project = createTestProject([layer]);
      const state = engine.evaluate(0, project, null, null, false);

      expect(Object.isFrozen(state)).toBe(true);
      expect(Object.isFrozen(state.layers)).toBe(true);
      expect(Object.isFrozen(state.audio)).toBe(true);
    });

    it('returns frozen EvaluatedLayer objects', () => {
      const layer = createAnimatedLayer('layer1', []);
      const project = createTestProject([layer]);
      const state = engine.evaluate(0, project, null, null, false);

      expect(Object.isFrozen(state.layers[0])).toBe(true);
      expect(Object.isFrozen(state.layers[0].transform)).toBe(true);
      expect(Object.isFrozen(state.layers[0].effects)).toBe(true);
    });
  });

  describe('Scrub Pattern Simulation', () => {
    it('forward-backward-forward scrub produces identical results', () => {
      const layer = createAnimatedLayer('layer1', [
        { id: 'kf1', frame: 0, value: { x: 0, y: 0 }, interpolation: 'bezier', inHandle: { frame: 0, value: 0, enabled: false }, outHandle: { frame: 15, value: 80, enabled: true }, controlMode: 'smooth' },
        { id: 'kf2', frame: 40, value: { x: 400, y: 300 }, interpolation: 'bezier', inHandle: { frame: -15, value: -80, enabled: true }, outHandle: { frame: 15, value: 80, enabled: true }, controlMode: 'smooth' },
        { id: 'kf3', frame: 80, value: { x: 800, y: 600 }, interpolation: 'bezier', inHandle: { frame: -15, value: -80, enabled: true }, outHandle: { frame: 0, value: 0, enabled: false }, controlMode: 'smooth' }
      ]);

      const project = createTestProject([layer]);
      const targetFrame = 50;

      // First pass: scrub forward to 50
      const forwardResults: { x: number; y: number }[] = [];
      for (let f = 0; f <= targetFrame; f++) {
        const state = engine.evaluate(f, project, null, null, false);
        if (f === targetFrame) {
          forwardResults.push({
            x: state.layers[0].transform.position.x,
            y: state.layers[0].transform.position.y
          });
        }
      }

      engine.invalidateCache();

      // Second pass: scrub backward from 80, past 50, to 0
      const backwardResults: { x: number; y: number }[] = [];
      for (let f = 80; f >= 0; f--) {
        const state = engine.evaluate(f, project, null, null, false);
        if (f === targetFrame) {
          backwardResults.push({
            x: state.layers[0].transform.position.x,
            y: state.layers[0].transform.position.y
          });
        }
      }

      engine.invalidateCache();

      // Third pass: jump directly to 50
      const directState = engine.evaluate(targetFrame, project, null, null, false);

      // All must be identical
      expect(forwardResults[0].x).toBeCloseTo(backwardResults[0].x, 10);
      expect(forwardResults[0].y).toBeCloseTo(backwardResults[0].y, 10);
      expect(forwardResults[0].x).toBeCloseTo(directState.layers[0].transform.position.x, 10);
      expect(forwardResults[0].y).toBeCloseTo(directState.layers[0].transform.position.y, 10);
    });
  });
});
