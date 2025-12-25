/**
 * Expression Evaluator
 *
 * Core expression evaluation functions including evaluateExpression,
 * evaluateCustomExpression, and preset/function evaluation.
 */

import type { ExpressionContext, Expression } from './types';
import type { LoopType } from './loopExpressions';
import { inertia, bounce, elastic } from './motionExpressions';
import { jitter } from './jitterExpressions';
import { repeatAfter, repeatBefore } from './loopExpressions';
import { valueAtTime } from './audioExpressions';
import {
  vectorAdd, vectorSub, vectorMul, vectorDiv,
  vectorNormalize, vectorDot, vectorCross, noise
} from './vectorMath';
import {
  toComp, fromComp, toWorld, fromWorld, lookAt,
  type LayerTransform
} from './coordinateConversion';

// Import time and math expressions (will be created)
// For now, inline the implementations

// ============================================================
// TIME EXPRESSIONS
// ============================================================

export const timeExpressions = {
  timeRamp(startTime: number, endTime: number, startValue: number, endValue: number, time: number): number {
    if (time <= startTime) return startValue;
    if (time >= endTime) return endValue;
    const t = (time - startTime) / (endTime - startTime);
    return startValue + (endValue - startValue) * t;
  },

  periodic(time: number, period: number): number {
    return (time % period) / period;
  },

  sawtooth(time: number, frequency: number, amplitude: number = 1): number {
    const t = time * frequency;
    return amplitude * 2 * (t - Math.floor(t + 0.5));
  },

  triangle(time: number, frequency: number, amplitude: number = 1): number {
    const t = time * frequency;
    return amplitude * (2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1);
  },

  square(time: number, frequency: number, amplitude: number = 1): number {
    const t = time * frequency;
    return amplitude * (t - Math.floor(t) < 0.5 ? 1 : -1);
  },

  sine(time: number, frequency: number, amplitude: number = 1, phase: number = 0): number {
    return amplitude * Math.sin(2 * Math.PI * frequency * time + phase);
  },

  pulse(time: number, frequency: number, dutyCycle: number = 0.5, amplitude: number = 1): number {
    const t = (time * frequency) % 1;
    return amplitude * (t < dutyCycle ? 1 : 0);
  },
};

// ============================================================
// MATH EXPRESSIONS
// ============================================================

export const mathExpressions = {
  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  },

  map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },

  normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  },

  smoothstep(edge0: number, edge1: number, x: number): number {
    const t = mathExpressions.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  smootherstep(edge0: number, edge1: number, x: number): number {
    const t = mathExpressions.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  mod(a: number, b: number): number {
    return ((a % b) + b) % b;
  },

  distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  angleBetween(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  },

  radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  },

  seedRandom(seed: number, min: number = 0, max: number = 1): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    const rand = x - Math.floor(x);
    return min + rand * (max - min);
  },

  gaussRandom(mean: number = 0, stdDev: number = 1, seed: number = 12345): number {
    const seededRand = (s: number) => {
      const x = Math.sin(s * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    const u1 = Math.max(0.0001, seededRand(seed));
    const u2 = seededRand(seed + 1);
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  },
};

// ============================================================
// EXPRESSION EASE FUNCTIONS
// ============================================================

/**
 * Ease function for expressions (count-up animations)
 * Compatible with After Effects ease()
 */
export function expressionEase(
  t: number,
  tMin: number,
  tMax: number,
  vMin: number | number[],
  vMax: number | number[]
): number | number[] {
  let normalized = (t - tMin) / (tMax - tMin);
  normalized = Math.max(0, Math.min(1, normalized));

  const eased = normalized < 0.5
    ? 4 * normalized * normalized * normalized
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;

  if (Array.isArray(vMin) && Array.isArray(vMax)) {
    return vMin.map((v, i) => v + (vMax[i] - v) * eased);
  }

  return (vMin as number) + ((vMax as number) - (vMin as number)) * eased;
}

/**
 * easeIn function for expressions
 */
export function expressionEaseIn(
  t: number,
  tMin: number,
  tMax: number,
  vMin: number | number[],
  vMax: number | number[]
): number | number[] {
  let normalized = (t - tMin) / (tMax - tMin);
  normalized = Math.max(0, Math.min(1, normalized));

  const eased = normalized * normalized * normalized;

  if (Array.isArray(vMin) && Array.isArray(vMax)) {
    return vMin.map((v, i) => v + (vMax[i] - v) * eased);
  }

  return (vMin as number) + ((vMax as number) - (vMin as number)) * eased;
}

/**
 * easeOut function for expressions
 */
export function expressionEaseOut(
  t: number,
  tMin: number,
  tMax: number,
  vMin: number | number[],
  vMax: number | number[]
): number | number[] {
  let normalized = (t - tMin) / (tMax - tMin);
  normalized = Math.max(0, Math.min(1, normalized));

  const eased = 1 - Math.pow(1 - normalized, 3);

  if (Array.isArray(vMin) && Array.isArray(vMax)) {
    return vMin.map((v, i) => v + (vMax[i] - v) * eased);
  }

  return (vMin as number) + ((vMax as number) - (vMin as number)) * eased;
}

// ============================================================
// EXPRESSION EVALUATOR
// ============================================================

/**
 * Evaluate an expression on a property
 */
export function evaluateExpression(
  expression: Expression,
  ctx: ExpressionContext
): number | number[] | string {
  if (!expression.enabled) return ctx.value;

  switch (expression.type) {
    case 'preset':
      return evaluatePreset(expression.name, ctx, expression.params);
    case 'function':
      return evaluateFunction(expression.name, ctx, expression.params);
    case 'custom':
      return evaluateCustomExpression(expression.code || '', ctx);
    default:
      return ctx.value;
  }
}

function evaluatePreset(name: string, ctx: ExpressionContext, params: Record<string, any>): number | number[] {
  switch (name) {
    case 'inertia':
      return inertia(ctx, params.amplitude, params.frequency, params.decay);
    case 'bounce':
      return bounce(ctx, params.elasticity, params.gravity);
    case 'elastic':
      return elastic(ctx, params.amplitude, params.period);
    case 'jitter':
      return jitter(ctx, params.frequency, params.amplitude, params.octaves);
    case 'repeatAfter':
      return repeatAfter(ctx, params.type, params.numKeyframes);
    case 'repeatBefore':
      return repeatBefore(ctx, params.type, params.numKeyframes);
    default:
      return ctx.value;
  }
}

function evaluateFunction(name: string, ctx: ExpressionContext, params: Record<string, any>): number | number[] {
  // Time functions
  if (name in timeExpressions) {
    const fn = (timeExpressions as any)[name];
    return fn(ctx.time, ...Object.values(params));
  }

  // Math functions
  if (name in mathExpressions) {
    const fn = (mathExpressions as any)[name];
    const val = typeof ctx.value === 'number' ? ctx.value : ctx.value[0];
    return fn(val, ...Object.values(params));
  }

  return ctx.value;
}

/**
 * Evaluate a custom JavaScript expression string
 */
export function evaluateCustomExpression(
  code: string,
  ctx: ExpressionContext
): number | number[] | string {
  if (!code || code.trim() === '') {
    return ctx.value;
  }

  try {
    // Helper: Get keyframe at index (1-based like AE)
    const key = (n: number) => {
      const kfs = ctx.keyframes || [];
      if (n < 1 || n > kfs.length) return { time: 0, value: ctx.value };
      const kf = kfs[n - 1];
      return { time: kf.frame / ctx.fps, value: kf.value };
    };

    // Helper: Find nearest keyframe to current time
    const nearestKey = (t: number) => {
      const kfs = ctx.keyframes || [];
      if (kfs.length === 0) return { index: 0, time: 0 };
      let nearest = 0;
      let minDist = Infinity;
      const targetFrame = t * ctx.fps;
      for (let i = 0; i < kfs.length; i++) {
        const dist = Math.abs(kfs[i].frame - targetFrame);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      return { index: nearest + 1, time: kfs[nearest].frame / ctx.fps };
    };

    // Helper: wiggle (alias for jitter, AE-compatible API)
    const wiggle = (freq: number, amp: number, octaves: number = 1, amp_mult: number = 0.5, t?: number): number | number[] => {
      const targetTime = t ?? ctx.time;
      const noiseFunc = (seed: number, time: number): number => {
        let result = 0;
        let amplitude = 1;
        let frequency = freq;
        for (let i = 0; i < octaves; i++) {
          result += amplitude * Math.sin(time * frequency * Math.PI * 2 + seed * 1000);
          result += amplitude * 0.5 * Math.sin(time * frequency * Math.PI * 2 * 1.618 + seed * 500);
          amplitude *= amp_mult;
          frequency *= 2;
        }
        return result / (1 + (octaves - 1) * amp_mult);
      };

      if (typeof ctx.value === 'number') {
        return ctx.value + noiseFunc(0, targetTime) * amp;
      }
      return (ctx.value as number[]).map((v, i) => v + noiseFunc(i, targetTime) * amp);
    };

    // Helper: loopOut (alias for repeatAfter)
    const loopOut = (type: string = 'cycle', numKf: number = 0): number | number[] => {
      return repeatAfter(ctx, type as LoopType, numKf);
    };

    // Helper: loopIn (alias for repeatBefore)
    const loopIn = (type: string = 'cycle', numKf: number = 0): number | number[] => {
      return repeatBefore(ctx, type as LoopType, numKf);
    };

    // Helper: length (vector distance)
    const length = (a: number | number[], b?: number | number[]): number => {
      if (b === undefined) {
        if (typeof a === 'number') return Math.abs(a);
        return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
      }
      if (typeof a === 'number' && typeof b === 'number') {
        return Math.abs(a - b);
      }
      const arrA = Array.isArray(a) ? a : [a];
      const arrB = Array.isArray(b) ? b : [b];
      let sum = 0;
      for (let i = 0; i < Math.max(arrA.length, arrB.length); i++) {
        const diff = (arrA[i] || 0) - (arrB[i] || 0);
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    };

    // Helper: seedRandom (set random seed for deterministic random)
    const seedRandom = (_seed: number, _timeless: boolean = false): void => {
      // No-op for API compatibility
    };

    // Helper: valueAtTime for expressions
    const valueAtTimeExpr = (t: number): number | number[] => {
      return valueAtTime(ctx, t);
    };

    // Helper: velocityAtTime
    const velocityAtTimeExpr = (t: number): number | number[] => {
      const dt = 1 / ctx.fps;
      const v1 = valueAtTime(ctx, t - dt);
      const v2 = valueAtTime(ctx, t + dt);
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return (v2 - v1) / (2 * dt);
      }
      if (Array.isArray(v1) && Array.isArray(v2)) {
        return v1.map((_, i) => ((v2 as number[])[i] - (v1 as number[])[i]) / (2 * dt));
      }
      return 0;
    };

    // Helper: speedAtTime
    const speedAtTimeExpr = (t: number): number => {
      const velocity = velocityAtTimeExpr(t);
      if (typeof velocity === 'number') {
        return Math.abs(velocity);
      }
      if (Array.isArray(velocity)) {
        return Math.sqrt(velocity.reduce((sum, v) => sum + v * v, 0));
      }
      return 0;
    };

    // Helper: smooth()
    const smoothExpr = (width: number = 0.2, samples: number = 5): number | number[] => {
      if (samples < 1) samples = 1;
      if (samples > 20) samples = 20;

      const halfWidth = width / 2;
      const step = width / (samples - 1 || 1);

      let sum: number | number[] = 0;
      const isArray = Array.isArray(ctx.value);

      if (isArray) {
        sum = new Array((ctx.value as number[]).length).fill(0);
      }

      for (let i = 0; i < samples; i++) {
        const sampleTime = ctx.time - halfWidth + (i * step);
        const sampleValue = valueAtTime(ctx, sampleTime);

        if (isArray && Array.isArray(sampleValue) && Array.isArray(sum)) {
          for (let j = 0; j < sum.length; j++) {
            sum[j] += (sampleValue[j] ?? 0);
          }
        } else if (typeof sampleValue === 'number' && typeof sum === 'number') {
          sum += sampleValue;
        }
      }

      if (isArray && Array.isArray(sum)) {
        return sum.map(v => v / samples);
      }
      return (sum as number) / samples;
    };

    // Helper: posterizeTime()
    const posterizeTimeExpr = (framesPerSecond: number): number => {
      const interval = 1 / framesPerSecond;
      return Math.floor(ctx.time / interval) * interval;
    };

    // Build the expression context variables
    const contextVars = {
      // Time
      time: ctx.time,
      frame: ctx.frame,
      fps: ctx.fps,
      duration: ctx.duration,

      // Layer
      index: ctx.layerIndex,
      layerName: ctx.layerName,
      inPoint: ctx.inPoint,
      outPoint: ctx.outPoint,

      // Property
      value: ctx.value,
      velocity: ctx.velocity,
      numKeys: ctx.numKeys,

      // Keyframe access
      key,
      nearestKey,

      // Math
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,

      // footage() function
      footage: ctx.footage || (() => null),

      // Ease functions (AE-compatible)
      ease: expressionEase,
      easeIn: expressionEaseIn,
      easeOut: expressionEaseOut,

      // linear interpolation
      linear: (t: number, tMin: number, tMax: number, vMin: number, vMax: number): number => {
        if (t <= tMin) return vMin;
        if (t >= tMax) return vMax;
        return vMin + (vMax - vMin) * ((t - tMin) / (tMax - tMin));
      },

      // Clamp
      clamp: (val: number, min: number, max: number): number => {
        return Math.max(min, Math.min(max, val));
      },

      // Random (seeded based on frame for determinism)
      random: (seed?: number): number => {
        const s = seed !== undefined ? seed : ctx.frame;
        const x = Math.sin(s * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      },

      // Motion functions (AE-compatible aliases)
      wiggle,
      loopOut,
      loopIn,

      // Temporal functions
      smooth: smoothExpr,
      posterizeTime: posterizeTimeExpr,

      // Utility functions
      length,
      seedRandom,
      valueAtTime: valueAtTimeExpr,
      velocityAtTime: velocityAtTimeExpr,
      speedAtTime: speedAtTimeExpr,

      // Angle conversion
      radiansToDegrees: (rad: number): number => rad * 180 / Math.PI,
      degreesToRadians: (deg: number): number => deg * Math.PI / 180,

      // Time conversion
      timeToFrames: (t: number = ctx.time): number => Math.round(t * ctx.fps),
      framesToTime: (f: number): number => f / ctx.fps,

      // Vector math functions
      add: (a: number | number[], b: number | number[]): number | number[] => {
        if (typeof a === 'number' && typeof b === 'number') return a + b;
        const arrA = Array.isArray(a) ? a : [a];
        const arrB = Array.isArray(b) ? b : [b];
        return vectorAdd(arrA, arrB);
      },
      sub: (a: number | number[], b: number | number[]): number | number[] => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        const arrA = Array.isArray(a) ? a : [a];
        const arrB = Array.isArray(b) ? b : [b];
        return vectorSub(arrA, arrB);
      },
      mul: (a: number | number[], b: number | number[]): number | number[] => {
        if (typeof a === 'number' && typeof b === 'number') return a * b;
        return vectorMul(a, b);
      },
      div: (a: number | number[], b: number | number[]): number | number[] => {
        if (typeof a === 'number' && typeof b === 'number') return a / (b || 1);
        return vectorDiv(a, b);
      },
      normalize: (vec: number[]): number[] => vectorNormalize(vec),
      dot: (a: number[], b: number[]): number => vectorDot(a, b),
      cross: (a: number[], b: number[]): number[] => vectorCross(a, b),

      // Coordinate conversion
      toComp: (point: number[]): number[] => point,
      fromComp: (point: number[]): number[] => point,
      toWorld: (point: number[]): number[] => point,
      fromWorld: (point: number[]): number[] => point,

      // 3D orientation
      lookAt: (fromPoint: number[], atPoint: number[]): number[] => lookAt(fromPoint, atPoint),

      // Noise
      noise: (val: number | number[]): number => noise(val),

      // Degree-based trig
      sinDeg: (deg: number): number => Math.sin(deg * Math.PI / 180),
      cosDeg: (deg: number): number => Math.cos(deg * Math.PI / 180),
      tanDeg: (deg: number): number => Math.tan(deg * Math.PI / 180),

      // thisComp / thisLayer simulation
      thisComp: createThisCompObject(ctx),
      thisLayer: createThisLayerObject(ctx),
      thisProperty: {
        value: ctx.value,
        velocity: ctx.velocity,
        numKeys: ctx.numKeys,
        key,
        nearestKey: () => nearestKey(ctx.time),
        valueAtTime: valueAtTimeExpr,
        velocityAtTime: velocityAtTimeExpr,
        speedAtTime: speedAtTimeExpr
      }
    };

    // Create a safe function that returns the expression result
    const paramNames = Object.keys(contextVars);
    const paramValues = Object.values(contextVars);

    // Auto-return the last expression if code doesn't contain explicit return
    // This makes expressions like "linear(time, 0, 5, 0, 100)" work without "return"
    const needsReturn = !code.includes('return ') && !code.includes('return;');
    const processedCode = needsReturn
      ? code.trim().split('\n').map((line, i, arr) =>
          i === arr.length - 1 && !line.trim().startsWith('//') && line.trim().length > 0
            ? `return ${line}`
            : line
        ).join('\n')
      : code;

    const wrappedCode = `
      "use strict";
      try {
        return (function() {
          ${processedCode}
        })();
      } catch(e) {
        return "Error: " + e.message;
      }
    `;

    const fn = new Function(...paramNames, wrappedCode);
    const result = fn(...paramValues);

    return result;
  } catch (error) {
    console.error('[Expressions] Custom expression error:', error);
    return ctx.value;
  }
}

// Helper to create thisComp object
function createThisCompObject(ctx: ExpressionContext) {
  return {
    duration: ctx.duration,
    frameDuration: 1 / ctx.fps,
    width: ctx.compWidth ?? 1920,
    height: ctx.compHeight ?? 1080,
    numLayers: ctx.allLayers?.length ?? 0,
    layer: (nameOrIndex: string | number) => {
      const getLayerProperty = ctx.getLayerProperty;
      const getLayerEffectParam = ctx.getLayerEffectParam;
      let layerId: string;

      if (typeof nameOrIndex === 'number') {
        const layerInfo = ctx.allLayers?.find(l => l.index === nameOrIndex);
        layerId = layerInfo?.id ?? `layer_${nameOrIndex}`;
      } else {
        const layerInfo = ctx.allLayers?.find(l => l.name === nameOrIndex);
        layerId = layerInfo?.id ?? nameOrIndex;
      }

      const getTransform = (): LayerTransform => ({
        position: (getLayerProperty?.(layerId, 'transform.position') as number[]) ?? [0, 0, 0],
        scale: (getLayerProperty?.(layerId, 'transform.scale') as number[]) ?? [100, 100, 100],
        rotation: (getLayerProperty?.(layerId, 'transform.rotation') as number[]) ?? [0, 0, 0],
        anchor: (getLayerProperty?.(layerId, 'transform.anchorPoint') as number[]) ?? [0, 0, 0],
      });

      const createEffectAccessor = (effectName: string) => {
        const accessor = (paramName: string) => {
          return getLayerEffectParam?.(layerId, effectName, paramName) ?? 0;
        };
        accessor.param = accessor;
        // Slider Control
        accessor.value = getLayerEffectParam?.(layerId, effectName, 'value') ?? 0;
        accessor.slider = getLayerEffectParam?.(layerId, effectName, 'slider') ??
                          getLayerEffectParam?.(layerId, effectName, 'Slider') ?? 0;
        // Angle Control
        accessor.angle = getLayerEffectParam?.(layerId, effectName, 'angle') ??
                         getLayerEffectParam?.(layerId, effectName, 'Angle') ?? 0;
        // Checkbox Control
        accessor.checkbox = getLayerEffectParam?.(layerId, effectName, 'checkbox') ??
                            getLayerEffectParam?.(layerId, effectName, 'Checkbox') ?? false;
        // Color Control
        accessor.color = getLayerEffectParam?.(layerId, effectName, 'color') ??
                         getLayerEffectParam?.(layerId, effectName, 'Color') ?? [1, 1, 1, 1];
        // Point Control (2D and 3D)
        accessor.point = getLayerEffectParam?.(layerId, effectName, 'point') ??
                         getLayerEffectParam?.(layerId, effectName, 'Point') ?? [0, 0];
        accessor.point3D = getLayerEffectParam?.(layerId, effectName, 'point3D') ??
                           getLayerEffectParam?.(layerId, effectName, '3D Point') ?? [0, 0, 0];
        // Dropdown Menu Control
        accessor.menu = getLayerEffectParam?.(layerId, effectName, 'menu') ??
                        getLayerEffectParam?.(layerId, effectName, 'Menu') ?? 1;
        // Layer Control
        accessor.layer = getLayerEffectParam?.(layerId, effectName, 'layer') ??
                         getLayerEffectParam?.(layerId, effectName, 'Layer') ?? null;
        return accessor;
      };

      return {
        name: ctx.allLayers?.find(l => l.id === layerId)?.name ?? '',
        index: ctx.allLayers?.find(l => l.id === layerId)?.index ?? 0,
        position: getLayerProperty?.(layerId, 'transform.position') ?? [0, 0],
        scale: getLayerProperty?.(layerId, 'transform.scale') ?? [100, 100],
        rotation: getLayerProperty?.(layerId, 'transform.rotation') ?? 0,
        opacity: getLayerProperty?.(layerId, 'transform.opacity') ?? 100,
        anchorPoint: getLayerProperty?.(layerId, 'transform.anchorPoint') ?? [0, 0],
        origin: getLayerProperty?.(layerId, 'transform.origin') ?? [0, 0],
        transform: {
          position: getLayerProperty?.(layerId, 'transform.position') ?? [0, 0, 0],
          rotation: getLayerProperty?.(layerId, 'transform.rotation') ?? [0, 0, 0],
          scale: getLayerProperty?.(layerId, 'transform.scale') ?? [100, 100, 100],
          opacity: getLayerProperty?.(layerId, 'transform.opacity') ?? 100,
          anchorPoint: getLayerProperty?.(layerId, 'transform.anchorPoint') ?? [0, 0, 0],
          origin: getLayerProperty?.(layerId, 'transform.origin') ?? [0, 0, 0],
        },
        toComp: (point: number[]) => toComp(point, getTransform()),
        fromComp: (point: number[]) => fromComp(point, getTransform()),
        toWorld: (point: number[]) => toWorld(point, getTransform()),
        fromWorld: (point: number[]) => fromWorld(point, getTransform()),
        effect: createEffectAccessor
      };
    }
  };
}

// Helper to create thisLayer object
function createThisLayerObject(ctx: ExpressionContext) {
  return {
    name: ctx.layerName,
    index: ctx.layerIndex,
    inPoint: ctx.inPoint,
    outPoint: ctx.outPoint,
    position: ctx.layerTransform?.position ?? [0, 0, 0],
    rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
    scale: ctx.layerTransform?.scale ?? [100, 100, 100],
    opacity: ctx.layerTransform?.opacity ?? 100,
    anchorPoint: ctx.layerTransform?.origin ?? [0, 0, 0],
    origin: ctx.layerTransform?.origin ?? [0, 0, 0],
    transform: {
      position: ctx.layerTransform?.position ?? [0, 0, 0],
      rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
      scale: ctx.layerTransform?.scale ?? [100, 100, 100],
      opacity: ctx.layerTransform?.opacity ?? 100,
      anchorPoint: ctx.layerTransform?.origin ?? [0, 0, 0],
      origin: ctx.layerTransform?.origin ?? [0, 0, 0],
    },
    effect: (effectName: string) => {
      const eff = ctx.layerEffects?.find(e => e.name === effectName || e.effectKey === effectName);
      const accessor = (paramName: string) => {
        if (!eff) return 0;
        return eff.parameters[paramName] ?? 0;
      };
      accessor.param = accessor;
      // Slider Control
      accessor.value = eff?.parameters['value'] ?? 0;
      accessor.slider = eff?.parameters['slider'] ?? eff?.parameters['Slider'] ?? 0;
      // Angle Control
      accessor.angle = eff?.parameters['angle'] ?? eff?.parameters['Angle'] ?? 0;
      // Checkbox Control
      accessor.checkbox = eff?.parameters['checkbox'] ?? eff?.parameters['Checkbox'] ?? false;
      // Color Control
      accessor.color = eff?.parameters['color'] ?? eff?.parameters['Color'] ?? [1, 1, 1, 1];
      // Point Control (2D and 3D)
      accessor.point = eff?.parameters['point'] ?? eff?.parameters['Point'] ?? [0, 0];
      accessor.point3D = eff?.parameters['point3D'] ?? eff?.parameters['3D Point'] ?? [0, 0, 0];
      // Dropdown Menu Control
      accessor.menu = eff?.parameters['menu'] ?? eff?.parameters['Menu'] ?? 1;
      // Layer Control
      accessor.layer = eff?.parameters['layer'] ?? eff?.parameters['Layer'] ?? null;
      return accessor;
    },
    sourceRectAtTime: (_t: number = ctx.time, _includeExtents: boolean = false) => {
      return { top: 0, left: 0, width: 100, height: 100 };
    },
    toComp: (point: number[]) => {
      const transform: LayerTransform = {
        position: ctx.layerTransform?.position ?? [0, 0, 0],
        scale: ctx.layerTransform?.scale ?? [100, 100, 100],
        rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
        anchor: ctx.layerTransform?.origin ?? [0, 0, 0],
      };
      return toComp(point, transform);
    },
    fromComp: (point: number[]) => {
      const transform: LayerTransform = {
        position: ctx.layerTransform?.position ?? [0, 0, 0],
        scale: ctx.layerTransform?.scale ?? [100, 100, 100],
        rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
        anchor: ctx.layerTransform?.origin ?? [0, 0, 0],
      };
      return fromComp(point, transform);
    },
    toWorld: (point: number[]) => {
      const transform: LayerTransform = {
        position: ctx.layerTransform?.position ?? [0, 0, 0],
        scale: ctx.layerTransform?.scale ?? [100, 100, 100],
        rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
        anchor: ctx.layerTransform?.origin ?? [0, 0, 0],
      };
      return toWorld(point, transform);
    },
    fromWorld: (point: number[]) => {
      const transform: LayerTransform = {
        position: ctx.layerTransform?.position ?? [0, 0, 0],
        scale: ctx.layerTransform?.scale ?? [100, 100, 100],
        rotation: ctx.layerTransform?.rotation ?? [0, 0, 0],
        anchor: ctx.layerTransform?.origin ?? [0, 0, 0],
      };
      return fromWorld(point, transform);
    },
  };
}
