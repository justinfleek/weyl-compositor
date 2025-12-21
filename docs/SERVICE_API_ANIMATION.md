# SERVICE API - Animation Services

**Weyl Compositor - Animation & Interpolation Services**

---

## 1.1 interpolation.ts

**Purpose**: Core keyframe interpolation engine. PURE MODULE - all functions are deterministic.

**Location**: `ui/src/services/interpolation.ts`

**Size**: ~21KB | **Lines**: ~700

### Exports

```typescript
// Main interpolation function
export function interpolateProperty<T>(
  property: AnimatableProperty<T>,
  frame: number,
  fps?: number,          // Default: 30
  layerId?: string       // For expression context
): T;

// Easing presets (normalized 0-1 range)
export const EASING_PRESETS_NORMALIZED: Record<string, {
  x1: number;  // First control point X
  y1: number;  // First control point Y
  x2: number;  // Second control point X
  y2: number;  // Second control point Y
}>;

// Alias for EASING_PRESETS_NORMALIZED
export const EASING_PRESETS: typeof EASING_PRESETS_NORMALIZED;

// Create bezier handles for a preset
export function createHandlesForPreset(
  preset: string,
  frameDuration: number,
  valueDelta: number
): { outHandle: BezierHandle; inHandle: BezierHandle };

// Apply preset to keyframe pair
export function applyEasingPreset(
  keyframe1: Keyframe<any>,
  keyframe2: Keyframe<any>,
  preset: string
): void;

// Get point on bezier curve
export function getBezierCurvePoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number;

// Normalized version (0-1 range)
export function getBezierCurvePointNormalized(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number;

// Apply easing function by name
export function applyEasing(
  t: number,
  easingName: EasingName
): number;

// Cache management
export function clearBezierCache(): void;
export function getBezierCacheStats(): { size: number; maxSize: number };
```

### Easing Presets Available

| Preset | Description | Cubic Bezier |
|--------|-------------|--------------|
| `linear` | No easing | (0.33, 0.33, 0.67, 0.67) |
| `ease` | Smooth start/end | (0.25, 0.1, 0.25, 1.0) |
| `ease-in` | Slow start | (0.42, 0, 1.0, 1.0) |
| `ease-out` | Slow end | (0, 0, 0.58, 1.0) |
| `ease-in-out` | Slow both | (0.42, 0, 0.58, 1.0) |
| `ease-in-quad` | Quadratic in | (0.55, 0.085, 0.68, 0.53) |
| `ease-out-quad` | Quadratic out | (0.25, 0.46, 0.45, 0.94) |
| `ease-in-cubic` | Cubic in | (0.55, 0.055, 0.675, 0.19) |
| `ease-out-cubic` | Cubic out | (0.215, 0.61, 0.355, 1.0) |
| `ease-in-back` | Overshoot start | (0.6, -0.28, 0.735, 0.045) |
| `ease-out-back` | Overshoot end | (0.175, 0.885, 0.32, 1.275) |

### Usage Example

```typescript
import { interpolateProperty, EASING_PRESETS } from '@/services/interpolation';

const opacityProp: AnimatableProperty<number> = {
  value: 1,
  animated: true,
  keyframes: [
    { frame: 0, value: 0, interpolation: 'ease-out' },
    { frame: 30, value: 1, interpolation: 'linear' }
  ]
};

const value = interpolateProperty(opacityProp, 15); // Returns ~0.75
```

---

## 1.2 easing.ts

**Purpose**: Standalone easing functions (object-based, not individual exports).

**Location**: `ui/src/services/easing.ts`

**Size**: ~8KB

### Exports

```typescript
// Type definitions
export type EasingFunction = (t: number) => number;
export type EasingName = keyof typeof easings;

// All easing functions as object
export const easings: Record<string, EasingFunction>;

// List of easing names
export const easingNames: string[];

// Grouped by category
export const easingGroups: Record<string, string[]>;

// Get easing function by name
export function getEasing(name: string): EasingFunction;

// Apply easing by name
export function applyEasing(t: number, name: string): number;

// Interpolate with easing
export function interpolateWithEasing(
  from: number,
  to: number,
  t: number,
  easing: string
): number;
```

### Available Easings

```
easingGroups = {
  "Linear": ["linear"],
  "Quad": ["easeInQuad", "easeOutQuad", "easeInOutQuad"],
  "Cubic": ["easeInCubic", "easeOutCubic", "easeInOutCubic"],
  "Quart": ["easeInQuart", "easeOutQuart", "easeInOutQuart"],
  "Quint": ["easeInQuint", "easeOutQuint", "easeInOutQuint"],
  "Sine": ["easeInSine", "easeOutSine", "easeInOutSine"],
  "Expo": ["easeInExpo", "easeOutExpo", "easeInOutExpo"],
  "Circ": ["easeInCirc", "easeOutCirc", "easeInOutCirc"],
  "Back": ["easeInBack", "easeOutBack", "easeInOutBack"],
  "Elastic": ["easeInElastic", "easeOutElastic", "easeInOutElastic"],
  "Bounce": ["easeInBounce", "easeOutBounce", "easeInOutBounce"]
}
```

---

## 1.3 expressions.ts

**Purpose**: Expression evaluation system for dynamic property values.

**Location**: `ui/src/services/expressions.ts`

**Size**: ~15KB

### Exports

```typescript
// Types
export interface ExpressionContext {
  frame: number;
  time: number;       // frame / fps
  fps: number;
  layerId: string;
  composition?: {
    width: number;
    height: number;
    frameCount: number;
    duration: number;
  };
}

export interface Expression {
  code: string;
  enabled: boolean;
}

// Main evaluation function
export function evaluateExpression(
  expression: Expression,
  context: ExpressionContext,
  currentValue: any
): any;

// Built-in expression helpers (available in expression code)
export const easing: {
  linear: (t: number) => number;
  easeIn: (t: number) => number;
  easeOut: (t: number) => number;
  // ... all easings
};

export const motion: {
  wiggle: (frequency: number, amplitude: number, time: number) => number;
  bounce: (elasticity: number, gravity: number, time: number) => number;
};

export const loop: {
  cycle: (value: number, min: number, max: number) => number;
  pingPong: (value: number, min: number, max: number) => number;
};

export const time: {
  seconds: (frame: number, fps: number) => number;
  frames: (seconds: number, fps: number) => number;
};

export const math: {
  clamp: (value: number, min: number, max: number) => number;
  lerp: (a: number, b: number, t: number) => number;
  map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  random: (seed: number) => number;  // Deterministic!
};
```

### Expression Example

```typescript
// In layer property expression:
const expr: Expression = {
  code: `
    const t = time.seconds(frame, fps);
    const wiggleAmount = motion.wiggle(2, 10, t);
    return currentValue + wiggleAmount;
  `,
  enabled: true
};
```

---

## 1.4 propertyDriver.ts

**Purpose**: Property linking system (pickwhip-style) with audio reactivity.

**Location**: `ui/src/services/propertyDriver.ts`

**Size**: ~25KB

### Exports

```typescript
// Types
export type DriverSourceType =
  | 'property'      // Another layer's property
  | 'audio'         // Audio analysis feature
  | 'expression';   // Custom expression

export type PropertyPath =
  | 'position.x' | 'position.y' | 'position.z'
  | 'rotation.x' | 'rotation.y' | 'rotation.z'
  | 'scale.x' | 'scale.y' | 'scale.z'
  | 'opacity'
  | 'anchor.x' | 'anchor.y' | 'anchor.z'
  | `spline.cp.${number}.${'x' | 'y'}`  // Spline control points
  | 'light.intensity' | 'light.range' | 'light.color.r'
  // ... more paths

export type AudioFeatureType =
  | 'amplitude'
  | 'bass'
  | 'mid'
  | 'high'
  | 'beat'
  | 'spectralCentroid';

export interface PropertyDriver {
  id: string;
  name: string;
  sourceType: DriverSourceType;
  sourceLayerId?: string;
  sourceProperty?: PropertyPath;
  audioFeature?: AudioFeatureType;
  targetLayerId: string;
  targetProperty: PropertyPath;
  transform: DriverTransform;
  enabled: boolean;
}

export interface DriverTransform {
  scale: number;        // Multiply source value
  offset: number;       // Add to result
  min: number;          // Clamp minimum
  max: number;          // Clamp maximum
  invert: boolean;      // Flip direction
  smoothing: number;    // Temporal smoothing (0-1)
  curve?: 'linear' | 'exponential' | 'logarithmic';
}

// Main class
export class PropertyDriverSystem {
  constructor(
    propertyGetter: PropertyGetter,
    propertySetter: PropertySetter
  );

  addDriver(driver: PropertyDriver): void;
  removeDriver(id: string): void;
  getDriver(id: string): PropertyDriver | undefined;
  getAllDrivers(): PropertyDriver[];

  // Core evaluation
  evaluate(frame: number, audioAnalysis?: AudioAnalysis): void;

  // Dependency graph
  buildDependencyGraph(): void;
  hasCycle(): boolean;
  getEvaluationOrder(): string[];
}

// Factory functions
export function createPropertyDriver(
  sourceLayerId: string,
  sourceProperty: PropertyPath,
  targetLayerId: string,
  targetProperty: PropertyPath,
  transform?: Partial<DriverTransform>
): PropertyDriver;

export function createAudioDriver(
  audioFeature: AudioFeatureType,
  targetLayerId: string,
  targetProperty: PropertyPath,
  transform?: Partial<DriverTransform>
): PropertyDriver;

export function createPropertyLink(
  sourceLayerId: string,
  sourceProperty: PropertyPath,
  targetLayerId: string,
  targetProperty: PropertyPath
): PropertyDriver;

export function createGearDriver(
  sourceLayerId: string,
  targetLayerId: string,
  ratio?: number  // Default: 1.0
): PropertyDriver;

// Light-specific drivers
export function createAudioLightDriver(
  audioFeature: AudioFeatureType,
  lightLayerId: string
): PropertyDriver;

export function createAudioColorTempDriver(
  lightLayerId: string,
  coldTemp?: number,   // Default: 6500
  warmTemp?: number    // Default: 3200
): PropertyDriver;

export function createLightFollowDriver(
  lightLayerId: string,
  targetLayerId: string
): PropertyDriver;

// Utility
export function getPropertyPathDisplayName(path: PropertyPath): string;
export function getAllPropertyPaths(): PropertyPath[];
export function getLightPropertyPaths(): PropertyPath[];
export function getPropertyPathsForLayerType(layerType: string): PropertyPath[];
export function isSplineControlPointPath(path: string): boolean;
export function isLightPropertyPath(path: string): boolean;
export function parseSplineControlPointPath(path: string): { index: number; axis: 'x' | 'y' } | null;
export function createSplineControlPointPath(index: number, axis: 'x' | 'y'): PropertyPath;
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2025*
