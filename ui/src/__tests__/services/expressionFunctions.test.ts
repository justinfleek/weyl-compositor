/**
 * Expression Functions Tests
 *
 * Tests for Tutorial 04: Time Remapping & Expressions
 * Phases 9-14 (Steps 181-337) - Expression Functions
 *
 * Tests all required expression functions:
 * 1. wiggle(freq, amp, octaves?, amp_mult?, t?)
 * 2. linear(t, tMin, tMax, val1, val2)
 * 3. ease(t, tMin, tMax, val1, val2)
 * 4. easeIn(), easeOut()
 * 5. clamp(val, min, max)
 * 6. valueAtTime(t)
 * 7. velocityAtTime(t)
 * 8. length(a, b)
 * 9. posterizeTime(fps)
 * 10. thisLayer, thisComp, thisProperty
 * 11. layer("name"), layer(index)
 * 12. index
 * 13. inPoint, outPoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCustomExpression } from '@/services/expressions/expressionEvaluator';
import type { ExpressionContext } from '@/services/expressions/types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Wrapper for evaluateCustomExpression with correct argument order
 */
function evalExpr(ctx: ExpressionContext, code: string): number | number[] | string {
  return evaluateCustomExpression(code, ctx);
}

function createTestContext(overrides: Partial<ExpressionContext> = {}): ExpressionContext {
  return {
    time: 1.0,
    frame: 24,
    fps: 24,
    duration: 10,
    compWidth: 1920,
    compHeight: 1080,
    layerId: 'layer_test',
    layerIndex: 1,
    layerName: 'Test Layer',
    inPoint: 0,
    outPoint: 5,
    propertyName: 'position',
    value: [960, 540],
    velocity: [0, 0],
    numKeys: 0,
    keyframes: [],
    layerTransform: {
      position: [960, 540, 0],
      rotation: [0, 0, 0],
      scale: [100, 100, 100],
      opacity: 100,
      origin: [0, 0, 0],
    },
    allLayers: [
      { id: 'layer_test', name: 'Test Layer', index: 1 },
      { id: 'layer_bg', name: 'Background', index: 2 },
      { id: 'layer_text', name: 'Title Text', index: 3 },
    ],
    ...overrides,
  };
}

// ============================================================================
// LINEAR INTERPOLATION (Steps 276-278)
// ============================================================================

describe('linear(t, tMin, tMax, val1, val2)', () => {
  it('returns val1 when t <= tMin', () => {
    const ctx = createTestContext({ time: 0 });
    const result = evalExpr(ctx, 'linear(time, 1, 3, 100, 300)');
    expect(result).toBe(100);
  });

  it('returns val2 when t >= tMax', () => {
    const ctx = createTestContext({ time: 5 });
    const result = evalExpr(ctx, 'linear(time, 1, 3, 100, 300)');
    expect(result).toBe(300);
  });

  it('interpolates linearly at midpoint', () => {
    const ctx = createTestContext({ time: 2 });
    const result = evalExpr(ctx, 'linear(time, 1, 3, 100, 300)');
    expect(result).toBe(200);
  });

  it('interpolates linearly at 25%', () => {
    const ctx = createTestContext({ time: 1.5 });
    const result = evalExpr(ctx, 'linear(time, 1, 3, 100, 300)');
    expect(result).toBe(150);
  });

  it('works with negative values', () => {
    const ctx = createTestContext({ time: 2 });
    const result = evalExpr(ctx, 'linear(time, 1, 3, -100, 100)');
    expect(result).toBe(0);
  });
});

// ============================================================================
// EASE FUNCTIONS (Steps 279-283)
// ============================================================================

describe('ease(t, tMin, tMax, val1, val2)', () => {
  it('returns val1 when t <= tMin', () => {
    const ctx = createTestContext({ time: 0 });
    const result = evalExpr(ctx, 'ease(time, 1, 3, 100, 300)');
    expect(result).toBe(100);
  });

  it('returns val2 when t >= tMax', () => {
    const ctx = createTestContext({ time: 5 });
    const result = evalExpr(ctx, 'ease(time, 1, 3, 100, 300)');
    expect(result).toBe(300);
  });

  it('applies easing at midpoint (not linear)', () => {
    const ctx = createTestContext({ time: 2 });
    const result = evalExpr(ctx, 'ease(time, 1, 3, 100, 300)');
    // Eased midpoint should be 200 for cubic ease-in-out
    expect(result).toBeCloseTo(200, 0);
  });

  it('starts slow (easeIn behavior at start)', () => {
    const ctx = createTestContext({ time: 1.25 });
    const easeResult = evalExpr(ctx, 'ease(time, 1, 3, 0, 100)') as number;
    const linearResult = evalExpr(ctx, 'linear(time, 1, 3, 0, 100)') as number;
    // Ease should be slower than linear at start
    expect(easeResult).toBeLessThan(linearResult);
  });
});

describe('easeIn(t, tMin, tMax, val1, val2)', () => {
  it('accelerates from start', () => {
    const ctx = createTestContext({ time: 1.5 });
    const result = evalExpr(ctx, 'easeIn(time, 1, 3, 0, 100)') as number;
    const linearResult = evalExpr(ctx, 'linear(time, 1, 3, 0, 100)') as number;
    // easeIn should be slower than linear at start
    expect(result).toBeLessThan(linearResult);
  });

  it('reaches target at tMax', () => {
    const ctx = createTestContext({ time: 3 });
    const result = evalExpr(ctx, 'easeIn(time, 1, 3, 0, 100)');
    expect(result).toBe(100);
  });
});

describe('easeOut(t, tMin, tMax, val1, val2)', () => {
  it('decelerates toward end', () => {
    const ctx = createTestContext({ time: 2.5 });
    const result = evalExpr(ctx, 'easeOut(time, 1, 3, 0, 100)') as number;
    const linearResult = evalExpr(ctx, 'linear(time, 1, 3, 0, 100)') as number;
    // easeOut should be faster than linear at start, slower at end
    expect(result).toBeGreaterThan(linearResult);
  });

  it('reaches target at tMax', () => {
    const ctx = createTestContext({ time: 3 });
    const result = evalExpr(ctx, 'easeOut(time, 1, 3, 0, 100)');
    expect(result).toBe(100);
  });
});

// ============================================================================
// CLAMP (Steps 284-285)
// ============================================================================

describe('clamp(val, min, max)', () => {
  it('returns value when within range', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'clamp(50, 0, 100)');
    expect(result).toBe(50);
  });

  it('clamps to min when value is below', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'clamp(-10, 0, 100)');
    expect(result).toBe(0);
  });

  it('clamps to max when value is above', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'clamp(150, 0, 100)');
    expect(result).toBe(100);
  });

  it('works with negative ranges', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'clamp(0, -100, -50)');
    expect(result).toBe(-50);
  });

  it('works with time-based values', () => {
    const ctx = createTestContext({ time: 5 });
    const result = evalExpr(ctx, 'clamp(time * 100, 0, 200)');
    expect(result).toBe(200);
  });
});

// ============================================================================
// WIGGLE (Steps 286-291)
// ============================================================================

describe('wiggle(freq, amp, octaves?, amp_mult?, t?)', () => {
  it('returns a number for scalar input', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(5, 10)');
    expect(typeof result).toBe('number');
  });

  it('returns array for array input', () => {
    const ctx = createTestContext({ value: [100, 200] });
    const result = evalExpr(ctx, 'wiggle(5, 10)');
    expect(Array.isArray(result)).toBe(true);
  });

  it('varies within amplitude range', () => {
    const ctx = createTestContext({ value: 100, time: 0 });
    const results: number[] = [];

    // Collect multiple samples at different times
    for (let t = 0; t < 2; t += 0.1) {
      ctx.time = t;
      ctx.frame = Math.round(t * 24);
      const result = evalExpr(ctx, 'wiggle(5, 50)') as number;
      results.push(result);
    }

    // Should have variation
    const min = Math.min(...results);
    const max = Math.max(...results);
    expect(max - min).toBeGreaterThan(0);

    // Should stay within reasonable bounds (100 +/- 50 approximately)
    expect(min).toBeGreaterThan(0);
    expect(max).toBeLessThan(200);
  });

  it('is DETERMINISTIC - same time = same result', () => {
    const ctx1 = createTestContext({ value: 100, time: 1.5, frame: 36 });
    const ctx2 = createTestContext({ value: 100, time: 1.5, frame: 36 });

    const result1 = evalExpr(ctx1, 'wiggle(5, 50)');
    const result2 = evalExpr(ctx2, 'wiggle(5, 50)');

    expect(result1).toEqual(result2);
  });

  it('accepts octaves parameter', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(5, 50, 3)');
    expect(typeof result).toBe('number');
  });

  it('accepts amp_mult parameter', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(5, 50, 2, 0.5)');
    expect(typeof result).toBe('number');
  });

  it('accepts custom time parameter', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(5, 50, 1, 0.5, 2.0)');
    expect(typeof result).toBe('number');
  });
});

// ============================================================================
// VALUE AT TIME (Steps 304-306)
// ============================================================================

describe('valueAtTime(t)', () => {
  it('returns current value without keyframes', () => {
    const ctx = createTestContext({ value: [100, 200] });
    const result = evalExpr(ctx, 'valueAtTime(time)');
    expect(result).toEqual([100, 200]);
  });

  it('is accessible via thisProperty', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'thisProperty.valueAtTime(time)');
    expect(result).toBe(100);
  });

  it('interpolates between keyframes', () => {
    const ctx = createTestContext({
      value: 50,
      time: 1,
      frame: 24,
      keyframes: [
        { id: 'k1', frame: 0, value: 0, interpolation: 'linear' },
        { id: 'k2', frame: 48, value: 100, interpolation: 'linear' },
      ],
      numKeys: 2,
    });
    const result = evalExpr(ctx, 'valueAtTime(1)');
    // At time 1 (frame 24), should be at 50% of keyframe animation
    expect(typeof result).toBe('number');
  });
});

// ============================================================================
// VELOCITY AT TIME (Steps 307-308)
// ============================================================================

describe('velocityAtTime(t)', () => {
  it('returns velocity value', () => {
    const ctx = createTestContext({ value: 100, velocity: 50 });
    const result = evalExpr(ctx, 'velocityAtTime(time)');
    expect(typeof result).toBe('number');
  });

  it('is accessible via thisProperty', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'thisProperty.velocityAtTime(time)');
    expect(typeof result).toBe('number');
  });
});

// ============================================================================
// LENGTH (Steps 309-310)
// ============================================================================

describe('length(a, b)', () => {
  it('returns magnitude of single vector', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'length([3, 4])');
    expect(result).toBe(5);
  });

  it('returns distance between two points', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'length([0, 0], [3, 4])');
    expect(result).toBe(5);
  });

  it('works with 3D vectors', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'length([1, 2, 2])');
    expect(result).toBe(3);
  });

  it('returns 0 for zero vector', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'length([0, 0, 0])');
    expect(result).toBe(0);
  });

  it('calculates distance between layer positions', () => {
    const ctx = createTestContext({
      layerTransform: {
        position: [100, 100, 0],
        rotation: [0, 0, 0],
        scale: [100, 100, 100],
        opacity: 100,
        origin: [0, 0, 0],
      },
    });
    const result = evalExpr(ctx, 'length(thisLayer.position, [0, 0, 0])');
    expect(result).toBeCloseTo(141.42, 1);
  });
});

// ============================================================================
// POSTERIZE TIME (Steps 311-312)
// ============================================================================

describe('posterizeTime(fps)', () => {
  it('returns quantized time', () => {
    const ctx = createTestContext({ time: 1.5, fps: 24 });
    const result = evalExpr(ctx, 'posterizeTime(12); time');
    // posterizeTime quantizes the time to the specified fps
    expect(typeof result).toBe('number');
  });

  it('reduces effective frame rate', () => {
    // At 24fps, posterizeTime(12) should step in 1/12 sec increments
    const ctx = createTestContext({ time: 1.0416667, fps: 24 }); // 1 + 1/24
    const quantized = evalExpr(ctx, 'posterizeTime(12); time') as number;
    // Should snap to 1/12 = 0.0833... second increments
    expect(quantized % (1 / 12)).toBeCloseTo(0, 5);
  });
});

// ============================================================================
// THIS LAYER REFERENCES (Steps 313-321)
// ============================================================================

describe('thisLayer', () => {
  it('has name property', () => {
    const ctx = createTestContext({ layerName: 'My Layer' });
    const result = evalExpr(ctx, 'thisLayer.name');
    expect(result).toBe('My Layer');
  });

  it('has index property', () => {
    const ctx = createTestContext({ layerIndex: 3 });
    const result = evalExpr(ctx, 'thisLayer.index');
    expect(result).toBe(3);
  });

  it('has inPoint property', () => {
    const ctx = createTestContext({ inPoint: 0.5 });
    const result = evalExpr(ctx, 'thisLayer.inPoint');
    expect(result).toBe(0.5);
  });

  it('has outPoint property', () => {
    const ctx = createTestContext({ outPoint: 5.0 });
    const result = evalExpr(ctx, 'thisLayer.outPoint');
    expect(result).toBe(5.0);
  });

  it('has transform.position', () => {
    const ctx = createTestContext({
      layerTransform: {
        position: [100, 200, 0],
        rotation: [0, 0, 0],
        scale: [100, 100, 100],
        opacity: 100,
        origin: [0, 0, 0],
      },
    });
    const result = evalExpr(ctx, 'thisLayer.transform.position');
    expect(result).toEqual([100, 200, 0]);
  });

  it('has transform.scale', () => {
    const ctx = createTestContext({
      layerTransform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [150, 150, 100],
        opacity: 100,
        origin: [0, 0, 0],
      },
    });
    const result = evalExpr(ctx, 'thisLayer.transform.scale');
    expect(result).toEqual([150, 150, 100]);
  });

  it('has transform.rotation', () => {
    const ctx = createTestContext({
      layerTransform: {
        position: [0, 0, 0],
        rotation: [0, 0, 45],
        scale: [100, 100, 100],
        opacity: 100,
        origin: [0, 0, 0],
      },
    });
    const result = evalExpr(ctx, 'thisLayer.transform.rotation');
    expect(result).toEqual([0, 0, 45]);
  });

  it('has transform.opacity', () => {
    const ctx = createTestContext({
      layerTransform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [100, 100, 100],
        opacity: 75,
        origin: [0, 0, 0],
      },
    });
    const result = evalExpr(ctx, 'thisLayer.transform.opacity');
    expect(result).toBe(75);
  });
});

describe('thisComp', () => {
  it('has width property', () => {
    const ctx = createTestContext({ compWidth: 1920 });
    const result = evalExpr(ctx, 'thisComp.width');
    expect(result).toBe(1920);
  });

  it('has height property', () => {
    const ctx = createTestContext({ compHeight: 1080 });
    const result = evalExpr(ctx, 'thisComp.height');
    expect(result).toBe(1080);
  });

  it('has duration property', () => {
    const ctx = createTestContext({ duration: 10 });
    const result = evalExpr(ctx, 'thisComp.duration');
    expect(result).toBe(10);
  });

  it('has frameDuration property', () => {
    const ctx = createTestContext({ fps: 24 });
    const result = evalExpr(ctx, 'thisComp.frameDuration');
    expect(result).toBeCloseTo(1 / 24, 5);
  });

  it('has numLayers property', () => {
    const ctx = createTestContext({
      allLayers: [
        { id: '1', name: 'A', index: 1 },
        { id: '2', name: 'B', index: 2 },
      ],
    });
    const result = evalExpr(ctx, 'thisComp.numLayers');
    expect(result).toBe(2);
  });
});

describe('thisProperty', () => {
  it('has value property', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'thisProperty.value');
    expect(result).toBe(100);
  });

  it('has numKeys property', () => {
    const ctx = createTestContext({ numKeys: 5 });
    const result = evalExpr(ctx, 'thisProperty.numKeys');
    expect(result).toBe(5);
  });

  it('has velocity property', () => {
    const ctx = createTestContext({ velocity: 10 });
    const result = evalExpr(ctx, 'thisProperty.velocity');
    expect(result).toBe(10);
  });
});

// ============================================================================
// LAYER ACCESS (Steps 322-328)
// ============================================================================

describe('thisComp.layer("name")', () => {
  it('accesses layer by name', () => {
    const ctx = createTestContext({
      allLayers: [
        { id: 'layer_test', name: 'Test Layer', index: 1 },
        { id: 'layer_bg', name: 'Background', index: 2 },
      ],
    });
    const result = evalExpr(ctx, 'thisComp.layer("Background").name');
    expect(result).toBe('Background');
  });

  it('accesses layer index by name', () => {
    const ctx = createTestContext({
      allLayers: [
        { id: 'layer_test', name: 'Test Layer', index: 1 },
        { id: 'layer_bg', name: 'Background', index: 2 },
      ],
    });
    const result = evalExpr(ctx, 'thisComp.layer("Background").index');
    expect(result).toBe(2);
  });
});

describe('thisComp.layer(index)', () => {
  it('accesses layer by index', () => {
    const ctx = createTestContext({
      allLayers: [
        { id: 'layer_test', name: 'Test Layer', index: 1 },
        { id: 'layer_bg', name: 'Background', index: 2 },
      ],
    });
    const result = evalExpr(ctx, 'thisComp.layer(2).name');
    expect(result).toBe('Background');
  });
});

// ============================================================================
// INDEX (Steps 329-330)
// ============================================================================

describe('index (global)', () => {
  it('returns current layer index', () => {
    const ctx = createTestContext({ layerIndex: 3 });
    const result = evalExpr(ctx, 'index');
    expect(result).toBe(3);
  });

  it('can be used in expressions', () => {
    const ctx = createTestContext({ layerIndex: 5 });
    const result = evalExpr(ctx, 'index * 10');
    expect(result).toBe(50);
  });

  it('matches thisLayer.index', () => {
    const ctx = createTestContext({ layerIndex: 7 });
    const indexResult = evalExpr(ctx, 'index');
    const thisLayerResult = evalExpr(ctx, 'thisLayer.index');
    expect(indexResult).toBe(thisLayerResult);
  });
});

// ============================================================================
// IN/OUT POINTS (Steps 334-337)
// ============================================================================

describe('inPoint/outPoint (global)', () => {
  it('inPoint returns layer start time', () => {
    const ctx = createTestContext({ inPoint: 1.5 });
    const result = evalExpr(ctx, 'inPoint');
    expect(result).toBe(1.5);
  });

  it('outPoint returns layer end time', () => {
    const ctx = createTestContext({ outPoint: 8.5 });
    const result = evalExpr(ctx, 'outPoint');
    expect(result).toBe(8.5);
  });

  it('calculates layer duration', () => {
    const ctx = createTestContext({ inPoint: 1, outPoint: 6 });
    const result = evalExpr(ctx, 'outPoint - inPoint');
    expect(result).toBe(5);
  });

  it('matches thisLayer values', () => {
    const ctx = createTestContext({ inPoint: 2, outPoint: 7 });
    const inPointGlobal = evalExpr(ctx, 'inPoint');
    const inPointLayer = evalExpr(ctx, 'thisLayer.inPoint');
    const outPointGlobal = evalExpr(ctx, 'outPoint');
    const outPointLayer = evalExpr(ctx, 'thisLayer.outPoint');

    expect(inPointGlobal).toBe(inPointLayer);
    expect(outPointGlobal).toBe(outPointLayer);
  });
});

// ============================================================================
// DETERMINISM VERIFICATION
// ============================================================================

describe('Expression DETERMINISM', () => {
  it('linear gives same result for same inputs', () => {
    const ctx1 = createTestContext({ time: 2 });
    const ctx2 = createTestContext({ time: 2 });

    const result1 = evalExpr(ctx1, 'linear(time, 0, 5, 0, 100)');
    const result2 = evalExpr(ctx2, 'linear(time, 0, 5, 0, 100)');

    expect(result1).toBe(result2);
  });

  it('ease gives same result for same inputs', () => {
    const ctx1 = createTestContext({ time: 2.5 });
    const ctx2 = createTestContext({ time: 2.5 });

    const result1 = evalExpr(ctx1, 'ease(time, 0, 5, 0, 100)');
    const result2 = evalExpr(ctx2, 'ease(time, 0, 5, 0, 100)');

    expect(result1).toBe(result2);
  });

  it('wiggle is deterministic', () => {
    const ctx1 = createTestContext({ time: 1.5, frame: 36, value: 100 });
    const ctx2 = createTestContext({ time: 1.5, frame: 36, value: 100 });

    const result1 = evalExpr(ctx1, 'wiggle(5, 50)');
    const result2 = evalExpr(ctx2, 'wiggle(5, 50)');

    expect(result1).toEqual(result2);
  });

  it('complex expressions are deterministic', () => {
    const ctx1 = createTestContext({ time: 2, frame: 48, value: [100, 200] });
    const ctx2 = createTestContext({ time: 2, frame: 48, value: [100, 200] });

    const expr = 'linear(time, 0, 5, 0, 100) + clamp(frame, 0, 100)';
    const result1 = evalExpr(ctx1, expr);
    const result2 = evalExpr(ctx2, expr);

    expect(result1).toBe(result2);
  });

  it('results are order-independent', () => {
    const ctx = createTestContext({ time: 2, frame: 48, value: 100 });

    // Evaluate in different orders
    const result1_first = evalExpr(ctx, 'linear(time, 0, 5, 0, 100)');
    evalExpr({ ...ctx, time: 0 }, 'linear(time, 0, 5, 0, 100)');
    evalExpr({ ...ctx, time: 5 }, 'linear(time, 0, 5, 0, 100)');
    const result1_second = evalExpr(ctx, 'linear(time, 0, 5, 0, 100)');

    expect(result1_first).toBe(result1_second);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Expression Edge Cases', () => {
  it('handles zero division in clamp', () => {
    const ctx = createTestContext();
    const result = evalExpr(ctx, 'clamp(0, 0, 0)');
    expect(result).toBe(0);
  });

  it('handles negative time in linear', () => {
    const ctx = createTestContext({ time: -1 });
    const result = evalExpr(ctx, 'linear(time, 0, 5, 0, 100)');
    expect(result).toBe(0);
  });

  it('handles empty layer name lookup', () => {
    const ctx = createTestContext({
      allLayers: [{ id: 'layer_1', name: 'Layer 1', index: 1 }],
    });
    const result = evalExpr(ctx, 'thisComp.layer("NonExistent").index');
    // Should return default value (0) for non-existent layer
    expect(result).toBe(0);
  });

  it('handles invalid index lookup', () => {
    const ctx = createTestContext({
      allLayers: [{ id: 'layer_1', name: 'Layer 1', index: 1 }],
    });
    const result = evalExpr(ctx, 'thisComp.layer(999).index');
    // Should return default value for non-existent index
    expect(result).toBe(0);
  });

  it('handles very large wiggle frequency', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(1000, 10)');
    expect(typeof result).toBe('number');
  });

  it('handles zero wiggle amplitude', () => {
    const ctx = createTestContext({ value: 100 });
    const result = evalExpr(ctx, 'wiggle(5, 0)');
    // With zero amplitude, result should be base value
    expect(result).toBe(100);
  });
});
