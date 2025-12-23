# SERVICE API - Effect Services

**Lattice Compositor - Effect Processing and Rendering Services**

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

## 6.2 gpuEffectDispatcher.ts

**Purpose**: Routes effects to optimal renderer (WebGPU, WebGL2, or Canvas2D).

**Location**: `ui/src/services/gpuEffectDispatcher.ts`

### Exports

```typescript
export type RenderBackend = 'webgpu' | 'webgl2' | 'canvas2d';

export interface DispatchConfig {
  effect: string;
  input: ImageData | HTMLCanvasElement;
  params: Record<string, any>;
  preferredBackend?: RenderBackend;
}

export interface DispatchResult {
  output: ImageData;
  backend: RenderBackend;
  timingMs: number;
}

// Dispatch effect to optimal backend
export async function dispatchEffect(config: DispatchConfig): Promise<DispatchResult>;

// Check backend availability
export function isWebGPUAvailable(): boolean;
export function isWebGL2Available(): boolean;

// Get optimal backend for effect
export function getOptimalBackend(effectType: string): RenderBackend;

// Backend initialization
export async function initializeBackends(): Promise<void>;
export function disposeBackends(): void;

// Statistics
export function getDispatchStats(): {
  webgpu: { calls: number; avgMs: number };
  webgl2: { calls: number; avgMs: number };
  canvas2d: { calls: number; avgMs: number };
};
```

### Usage

```typescript
import { dispatchEffect } from '@/services/gpuEffectDispatcher';

// Automatically selects best available backend
const result = await dispatchEffect({
  effect: 'gaussian-blur',
  input: imageData,
  params: { radius: 10 }
});

console.log(`Rendered via ${result.backend} in ${result.timingMs}ms`);
```

---

## 6.3 effects/blurRenderer.ts

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

## 6.4 effects/colorRenderer.ts

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

## 6.5 effects/distortRenderer.ts

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

## 6.6 effects/generateRenderer.ts

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

## 6.7 effects/stylizeRenderer.ts

**Purpose**: Stylize effects (emboss, find edges, mosaic, etc.)

**Location**: `ui/src/services/effects/stylizeRenderer.ts`

### Exports

```typescript
export function registerStylizeEffects(): void;

export const embossRenderer: EffectRenderer;
export const findEdgesRenderer: EffectRenderer;
export const mosaicRenderer: EffectRenderer;
```

---

## 6.8 effects/cinematicBloom.ts

**Purpose**: Cinematic bloom/glow effect with anamorphic options.

**Location**: `ui/src/services/effects/cinematicBloom.ts`

### Exports

```typescript
export interface BloomConfig {
  threshold: number;
  intensity: number;
  radius: number;
  anamorphic: boolean;
  anamorphicRatio: number;
}

export function applyBloom(
  input: ImageData,
  config: BloomConfig
): ImageData;
```

---

## 6.9 effects/layerStyleRenderer.ts

**Purpose**: Layer styles (drop shadow, outer glow, inner shadow, stroke, etc.)

**Location**: `ui/src/services/effects/layerStyleRenderer.ts`

### Exports

```typescript
export function renderLayerStyles(
  inputCanvas: HTMLCanvasElement,
  styles: LayerStyles,
  frame: number
): HTMLCanvasElement;

// Individual style renderers
export function renderDropShadow(...): HTMLCanvasElement;
export function renderOuterGlow(...): HTMLCanvasElement;
export function renderInnerShadow(...): HTMLCanvasElement;
export function renderStroke(...): HTMLCanvasElement;
```

---

## 6.10 effects/timeRenderer.ts

**Purpose**: Time-based effects (pixel motion, optical flow).

**Location**: `ui/src/services/effects/timeRenderer.ts`

### Exports

```typescript
export function renderPixelMotion(
  prevFrame: ImageData,
  nextFrame: ImageData,
  t: number
): ImageData;

export function computeOpticalFlow(
  frame1: ImageData,
  frame2: ImageData
): Float32Array;
```

---

## 6.11 effects/maskRenderer.ts

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
| **Stylize** | Emboss, Find Edges, Mosaic | Visual stylization |
| **Time** | Pixel Motion, Optical Flow | Frame interpolation |
| **Layer Styles** | Drop Shadow, Outer Glow, Inner Shadow, Stroke | Photoshop-style layer effects |
| **Mask** | Mask Render, Combine, Track Matte | Compositing and masking |
| **Cinematic** | Bloom, HDR, Color Grading | Film-look effects |

**Total Effect Files: 16 (15 renderers + index.ts)**

---

**See also**:
- [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories
- [EFFECT_PARAMETERS.md](./EFFECT_PARAMETERS.md) for detailed parameter documentation

*Generated: December 23, 2025*
