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

**Purpose**: Expression evaluation system for dynamic property values with AE-compatible syntax.

**Location**: `ui/src/services/expressions.ts`

**Size**: ~90KB | **Lines**: ~3000

### Exports

```typescript
// Types
export interface ExpressionContext {
  // Time
  time: number;           // Current time in seconds
  frame: number;          // Current frame number
  fps: number;            // Frames per second
  duration: number;       // Composition duration

  // Composition info
  compWidth?: number;
  compHeight?: number;

  // Layer info
  layerId: string;
  layerIndex: number;
  layerName: string;
  inPoint: number;
  outPoint: number;

  // Property info
  propertyName: string;
  value: number | number[];
  velocity: number | number[];
  numKeys: number;
  keyframes: Keyframe<any>[];

  // Layer data (for thisLayer/thisComp)
  layerTransform?: {
    position: number[];
    rotation: number[];
    scale: number[];
    opacity: number;
    origin: number[];
  };
  layerEffects?: Array<{
    name: string;
    effectKey: string;
    enabled: boolean;
    parameters: Record<string, any>;
  }>;
  allLayers?: Array<{ id: string; name: string; index: number }>;

  // External data
  footage?: (name: string) => FootageDataAccessor | null;
  getLayerProperty?: (layerId: string, path: string) => any;
  getLayerEffectParam?: (layerId: string, effect: string, param: string) => any;
}

// Main evaluation functions
export function evaluateExpression(
  expression: Expression,
  context: ExpressionContext
): number | number[] | string;

export function evaluateCustomExpression(
  code: string,
  context: ExpressionContext
): number | number[] | string;

// Validation
export interface ExpressionValidationResult {
  valid: boolean;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export function validateExpression(code: string): ExpressionValidationResult;
export function getExpressionFunctions(): Array<{
  name: string;
  description: string;
  syntax: string;
}>;
```

### thisLayer / thisComp / thisProperty

Full AE-compatible expression objects available in custom expressions:

```typescript
// thisLayer - current layer
thisLayer.name                    // Layer name
thisLayer.index                   // Layer index (1-based)
thisLayer.inPoint                 // Start time
thisLayer.outPoint                // End time
thisLayer.transform.position      // [x, y, z]
thisLayer.transform.rotation      // [x, y, z]
thisLayer.transform.scale         // [x, y, z]
thisLayer.transform.opacity       // 0-100
thisLayer.transform.origin        // [x, y, z] (anchor point)
thisLayer.effect("name")("param") // Effect parameter access
thisLayer.toComp([x, y, z])       // Convert to comp space
thisLayer.fromComp([x, y, z])     // Convert from comp space

// thisComp - composition
thisComp.width                    // Composition width
thisComp.height                   // Composition height
thisComp.duration                 // Duration in seconds
thisComp.frameDuration            // 1/fps
thisComp.numLayers                // Number of layers
thisComp.layer("Name")            // Get layer by name
thisComp.layer(1)                 // Get layer by index (1-based)

// thisProperty - current property being evaluated
thisProperty.value                // Current interpolated value
thisProperty.velocity             // Current velocity
thisProperty.numKeys              // Number of keyframes
thisProperty.key(n)               // Get keyframe by index (1-based)
thisProperty.nearestKey(t)        // Get nearest keyframe to time
thisProperty.valueAtTime(t)       // Value at time t
thisProperty.velocityAtTime(t)    // Velocity at time t
```

### Effect Access

```typescript
// Access effect on current layer
thisLayer.effect("Blur Amount")("Slider")
thisLayer.effect("Blur").param("radius")

// Access effect on another layer
thisComp.layer("Control Layer").effect("Slider Control")("Slider")

// Common expression control properties
thisLayer.effect("MySlider").value
thisLayer.effect("MySlider").slider
thisLayer.effect("MyAngle").angle
thisLayer.effect("MyCheckbox").checkbox
thisLayer.effect("MyColor").color
thisLayer.effect("MyPoint").point
```

### Built-in Functions

```typescript
// Motion
wiggle(frequency, amplitude)          // Random oscillation
inertia(amplitude, frequency, decay)  // Overshoot after keyframes
bounce(elasticity, gravity)           // Bouncing ball
elastic(amplitude, frequency, decay)  // Spring-like motion

// Looping
loopOut("cycle" | "pingpong" | "offset" | "continue")
loopIn("cycle" | "pingpong" | "offset" | "continue")
repeatAfter("cycle" | "pingpong" | "offset")  // Weyl alias
repeatBefore("cycle" | "pingpong" | "offset") // Weyl alias

// Interpolation
ease(t, tMin, tMax, vMin, vMax)
easeIn(t, tMin, tMax, vMin, vMax)
easeOut(t, tMin, tMax, vMin, vMax)
linear(t, tMin, tMax, vMin, vMax)

// Math
clamp(value, min, max)
lerp(a, b, t)
map(value, inMin, inMax, outMin, outMax)
random()                 // Deterministic seeded random
random(min, max)
noise(value)             // Perlin-like noise
noise([x, y, z])

// Vector
add([a], [b])
sub([a], [b])
mul([a], scalar)
normalize([v])
length([v])
dot([a], [b])
cross([a], [b])

// Data access
footage("filename.csv").dataValue([row, col])
footage("filename.json").sourceData.path.to.value
```

### Expression Examples

```typescript
// Wiggle position
wiggle(2, 10)

// Follow another layer with offset
thisComp.layer("Control").transform.position + [100, 0]

// Scale based on effect slider
value * thisLayer.effect("Scale Amount")("Slider") / 100

// Bounce after keyframes
bounce(0.7, 980)

// Loop keyframes
loopOut("pingpong")

// Data-driven animation
footage("animation.csv").dataValue([frame, "rotation"])
```

### Validation Example

```typescript
import { validateExpression } from '@/services/expressions';

// Valid expression
const result = validateExpression('wiggle(2, 10)');
// { valid: true }

// Invalid expression (syntax error)
const badResult = validateExpression('wiggle(2,');
// { valid: false, error: "Unexpected end of input" }
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
