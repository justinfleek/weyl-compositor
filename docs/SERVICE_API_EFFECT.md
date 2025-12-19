# SERVICE API - Effect Services

**Weyl Compositor - Effect Processing and Rendering Services**

---

## 6.1 effectProcessor.ts

**Purpose**: Effect stack processing and parameter evaluation.

**Location**: `ui/src/services/effectProcessor.ts`

**Size**: ~14KB

### Exports

```typescript
export interface EvaluatedEffectParams {
  [key: string]: any;
}

export interface EffectStackResult {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export type EffectRenderer = (
  input: EffectStackResult,
  params: EvaluatedEffectParams
) => EffectStackResult;

// Register custom effect renderer
export function registerEffectRenderer(
  effectKey: string,
  renderer: EffectRenderer
): void;

// Evaluate effect parameters at frame
export function evaluateEffectParameters(
  effect: EffectInstance,
  frame: number
): EvaluatedEffectParams;

// Process full effect stack
export function processEffectStack(
  effects: EffectInstance[],
  inputCanvas: HTMLCanvasElement,
  frame: number,
  quality?: 'draft' | 'high'
): EffectStackResult;

// Canvas utilities
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement;
export function canvasToImageData(canvas: HTMLCanvasElement): ImageData;
export function createMatchingCanvas(source: HTMLCanvasElement): EffectStackResult;
export function releaseCanvas(canvas: HTMLCanvasElement): void;

// Utility
export function hasEnabledEffects(effects: EffectInstance[]): boolean;
export function getRegisteredEffects(): string[];

// Cache management
export function clearEffectCaches(): void;
export function getEffectProcessorStats(): {
  effectCache: { size: number; maxSize: number };
  canvasPool: { total: number; inUse: number; available: number };
};
export function cleanupEffectResources(): void;
```

---

## 6.2 effects/blurRenderer.ts

**Purpose**: Blur effect implementations (Gaussian, directional, radial, etc.)

**Location**: `ui/src/services/effects/blurRenderer.ts`

### Exports

```typescript
// Register all blur effects
export function registerBlurEffects(): void;

// Individual renderers
export const gaussianBlurRenderer: EffectRenderer;
export const directionalBlurRenderer: EffectRenderer;
export const radialBlurRenderer: EffectRenderer;
export const boxBlurRenderer: EffectRenderer;
export const sharpenRenderer: EffectRenderer;

// WebGL acceleration
export function isWebGLBlurAvailable(): boolean;
export function disposeWebGLBlur(): void;
```

---

## 6.3 effects/colorRenderer.ts

**Purpose**: Color correction and grading effects.

**Location**: `ui/src/services/effects/colorRenderer.ts`

### Exports

```typescript
export function registerColorEffects(): void;

// Renderers
export const brightnessContrastRenderer: EffectRenderer;
export const hueSaturationRenderer: EffectRenderer;
export const levelsRenderer: EffectRenderer;
export const tintRenderer: EffectRenderer;
export const curvesRenderer: EffectRenderer;
export const glowRenderer: EffectRenderer;
export const dropShadowRenderer: EffectRenderer;
export const colorBalanceRenderer: EffectRenderer;
export const exposureRenderer: EffectRenderer;
export const vibranceRenderer: EffectRenderer;
export const invertRenderer: EffectRenderer;
export const posterizeRenderer: EffectRenderer;
export const thresholdRenderer: EffectRenderer;

// Curve utilities
export function createSCurve(contrast: number): number[];
export function createLiftCurve(shadows: number, midtones: number, highlights: number): number[];
```

---

## 6.4 effects/distortRenderer.ts

**Purpose**: Transform and warp effects.

**Location**: `ui/src/services/effects/distortRenderer.ts`

### Exports

```typescript
export function registerDistortEffects(): void;

export const transformRenderer: EffectRenderer;
export const warpRenderer: EffectRenderer;
export const displacementMapRenderer: EffectRenderer;
```

---

## 6.5 effects/generateRenderer.ts

**Purpose**: Procedural generation effects.

**Location**: `ui/src/services/effects/generateRenderer.ts`

### Exports

```typescript
export function registerGenerateEffects(): void;

export const fillRenderer: EffectRenderer;
export const gradientRampRenderer: EffectRenderer;
export const fractalNoiseRenderer: EffectRenderer;

// Cache management
export function clearNoiseTileCache(): void;
export function getNoiseTileCacheStats(): { size: number };
```

---

## 6.6 effects/maskRenderer.ts

**Purpose**: Mask rendering and compositing.

**Location**: `ui/src/services/effects/maskRenderer.ts`

### Exports

```typescript
// Render single mask
export function renderMask(
  mask: MaskData,
  width: number,
  height: number
): HTMLCanvasElement;

// Combine multiple masks
export function combineMasks(
  masks: MaskData[],
  width: number,
  height: number,
  mode: 'add' | 'subtract' | 'intersect'
): HTMLCanvasElement;

// Apply track matte
export function applyTrackMatte(
  layer: HTMLCanvasElement,
  matte: HTMLCanvasElement,
  mode: 'alpha' | 'alphaInverted' | 'luma' | 'lumaInverted'
): HTMLCanvasElement;

// Apply masks to layer
export function applyMasksToLayer(
  layerCanvas: HTMLCanvasElement,
  masks: MaskData[]
): HTMLCanvasElement;
```

---

## Effect Categories Summary

| Category | Effects | Purpose |
|----------|---------|---------|
| **Blur** | Gaussian, Directional, Radial, Box, Sharpen | Image softening/sharpening |
| **Color** | Brightness/Contrast, Hue/Saturation, Levels, Tint, Curves, Glow, Drop Shadow, Color Balance, Exposure, Vibrance, Invert, Posterize, Threshold | Color correction and grading |
| **Distort** | Transform, Warp, Displacement Map | Geometric transformations |
| **Generate** | Fill, Gradient Ramp, Fractal Noise | Procedural content generation |
| **Mask** | Mask Render, Combine, Track Matte | Compositing and masking |

---

**See also**:
- [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories
- [EFFECT_PARAMETERS.md](./EFFECT_PARAMETERS.md) for detailed parameter documentation

*Generated: December 19, 2024*
