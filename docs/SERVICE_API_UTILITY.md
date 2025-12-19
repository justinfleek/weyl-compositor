# SERVICE API - Utility Services

**Weyl Compositor - GPU Detection, Worker Pool, and Timeline Utilities**

---

## 10.1 gpuDetection.ts

**Purpose**: Detect GPU capabilities and tier.

**Location**: `ui/src/services/gpuDetection.ts`

**Size**: ~5KB

### Exports

```typescript
export interface GPUTier {
  tier: 'cpu' | 'webgl' | 'webgpu' | 'blackwell';
  webglVersion: 1 | 2 | null;
  webgpuSupported: boolean;
  maxTextureSize: number;
  extensions: string[];
  renderer: string;
  vendor: string;
}

export function detectGPUTier(): GPUTier;
```

### GPU Tier Capabilities

| Tier | Description | Features Available |
|------|-------------|-------------------|
| `cpu` | Software rendering | Basic 2D canvas only |
| `webgl` | WebGL 1.0/2.0 | Effects, 3D, particles |
| `webgpu` | WebGPU API | Compute shaders, advanced particles |
| `blackwell` | NVIDIA Blackwell | Full AI acceleration |

### Usage Example

```typescript
import { detectGPUTier } from '@/services/gpuDetection';

const gpu = detectGPUTier();

if (gpu.tier === 'webgpu') {
  // Enable WebGPU compute path
  enableWebGPUParticles();
} else if (gpu.tier === 'webgl' && gpu.webglVersion === 2) {
  // Use Transform Feedback for particles
  enableWebGL2Particles();
} else {
  // Fall back to CPU simulation
  enableCPUParticles();
}

console.log(`GPU: ${gpu.renderer} (${gpu.vendor})`);
console.log(`Max texture: ${gpu.maxTextureSize}px`);
```

---

## 10.2 workerPool.ts

**Purpose**: Web Worker pool for parallel processing.

**Location**: `ui/src/services/workerPool.ts`

**Size**: ~10KB

### Exports

```typescript
export interface WorkerPoolConfig {
  maxWorkers: number;
  workerUrl: string;
  idleTimeout: number;
}

export class WorkerPool {
  constructor(config?: Partial<WorkerPoolConfig>);

  // Task execution
  execute<T, R>(
    task: T,
    transferables?: Transferable[]
  ): Promise<R>;

  // Batch execution
  executeAll<T, R>(
    tasks: T[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]>;

  // Pool management
  getActiveCount(): number;
  getIdleCount(): number;

  // Cleanup
  terminate(): void;
}

// Singleton access
export function getWorkerPool(): WorkerPool;
export function disposeWorkerPool(): void;
```

### Usage Example

```typescript
import { getWorkerPool } from '@/services/workerPool';

const pool = getWorkerPool();

// Single task
const result = await pool.execute({ type: 'blur', imageData, radius: 5 });

// Batch processing with progress
const results = await pool.executeAll(
  frames.map(frame => ({ type: 'process', frame })),
  (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
);
```

---

## 10.3 motionBlur.ts

**Purpose**: Motion blur post-processing.

**Location**: `ui/src/services/motionBlur.ts`

**Size**: ~15KB

### Exports

```typescript
export type MotionBlurType =
  | 'temporal'      // Frame averaging
  | 'directional'   // Direction-based
  | 'radial'        // Zoom blur
  | 'object';       // Per-object velocity

export type RadialBlurMode = 'zoom' | 'spin';

export interface MotionBlurSettings {
  enabled: boolean;
  type: MotionBlurType;
  samples: number;              // Number of blur samples
  shutterAngle: number;         // Degrees (0-360)
  shutterPhase: number;         // Phase offset
  adaptiveSampling: boolean;
  threshold: number;            // Velocity threshold
}

export interface VelocityData {
  dx: Float32Array;
  dy: Float32Array;
  width: number;
  height: number;
}

export interface MotionBlurFrame {
  frame: number;
  data: ImageData;
  velocity: VelocityData;
}

export class MotionBlurProcessor {
  constructor(settings?: Partial<MotionBlurSettings>);

  setSettings(settings: Partial<MotionBlurSettings>): void;
  getSettings(): MotionBlurSettings;

  // Calculate velocity between frames
  calculateVelocity(
    currentFrame: ImageData,
    previousFrame: ImageData
  ): VelocityData;

  // Apply motion blur
  apply(
    currentFrame: ImageData,
    previousFrames: ImageData[],  // For temporal
    velocity?: VelocityData        // For velocity-based
  ): ImageData;

  // Directional blur
  applyDirectional(
    frame: ImageData,
    angle: number,
    length: number
  ): ImageData;

  // Radial blur
  applyRadial(
    frame: ImageData,
    centerX: number,
    centerY: number,
    amount: number,
    mode: RadialBlurMode
  ): ImageData;
}

// Presets
export const MOTION_BLUR_PRESETS: Record<string, Partial<MotionBlurSettings>>;
export function createDefaultMotionBlurSettings(): MotionBlurSettings;
export function getMotionBlurPreset(name: string): MotionBlurSettings;
export function listMotionBlurPresets(): string[];
```

### Motion Blur Presets

| Preset | Shutter Angle | Samples | Description |
|--------|---------------|---------|-------------|
| `film` | 180 | 16 | Standard film motion blur |
| `video` | 360 | 8 | Video camera look |
| `action` | 90 | 32 | Sharp action footage |
| `dreamy` | 270 | 24 | Soft, dreamy look |
| `none` | 0 | 1 | No motion blur |

---

## 10.4 timelineSnap.ts

**Purpose**: Timeline snapping to beats, markers, and keyframes.

**Location**: `ui/src/services/timelineSnap.ts`

**Size**: ~6KB

### Exports

```typescript
export type SnapType =
  | 'beat'
  | 'onset'
  | 'keyframe'
  | 'marker'
  | 'layer-bound'
  | 'work-area';

export interface SnapResult {
  frame: number;
  type: SnapType;
  distance: number;   // Pixels from original position
}

export interface SnapConfig {
  enabled: boolean;
  snapDistance: number;      // Pixels
  snapToBeats: boolean;
  snapToOnsets: boolean;
  snapToKeyframes: boolean;
  snapToMarkers: boolean;
  snapToLayerBounds: boolean;
  snapToWorkArea: boolean;
}

export interface SnapIndicator {
  frame: number;
  type: SnapType;
  color: string;
}

export const DEFAULT_SNAP_CONFIG: SnapConfig;

// Find nearest snap point
export function findNearestSnap(
  frame: number,
  config: SnapConfig,
  context: {
    audioAnalysis?: AudioAnalysis;
    keyframeFrames?: number[];
    markerFrames?: number[];
    layerBounds?: Array<{ inPoint: number; outPoint: number }>;
    workArea?: { start: number; end: number };
  }
): SnapResult | null;

// Get beat frames from analysis
export function getBeatFrames(analysis: AudioAnalysis): number[];

// Get peak frames
export function getPeakFrames(analysis: AudioAnalysis): number[];

// Check if near beat
export function isNearBeat(
  frame: number,
  analysis: AudioAnalysis,
  tolerance: number
): boolean;

// Get nearest beat
export function getNearestBeatFrame(
  frame: number,
  analysis: AudioAnalysis
): number;

// Get snap color for type
export function getSnapColor(type: SnapType): string;
```

### Snap Colors

| Type | Color | Purpose |
|------|-------|---------|
| `beat` | `#ff6b6b` | Audio beat detection |
| `onset` | `#ffa726` | Audio onset detection |
| `keyframe` | `#66bb6a` | Keyframe alignment |
| `marker` | `#42a5f5` | Composition markers |
| `layer-bound` | `#ab47bc` | Layer in/out points |
| `work-area` | `#26c6da` | Work area edges |

---

## Quick Reference: Import Patterns

### Import Everything from Index

```typescript
// Import all services from central index
import {
  interpolateProperty,
  ParticleSystem,
  AudioReactiveMapper,
  matteExporter,
  fontService,
  // ... etc
} from '@/services';
```

### Import Specific Service

```typescript
// Animation
import { interpolateProperty, EASING_PRESETS } from '@/services/interpolation';
import { evaluateExpression, type ExpressionContext } from '@/services/expressions';

// Audio
import { analyzeAudio, loadAudioFile, getFeatureAtFrame } from '@/services/audioFeatures';
import { AudioReactiveMapper, createDefaultAudioMapping } from '@/services/audioReactiveMapping';

// Particles
import { ParticleSystem, SeededRandom, createDefaultEmitterConfig } from '@/services/particleSystem';

// Camera/3D
import { vec3, multiplyMat4, perspectiveMat4 } from '@/services/math3d';
import { generateTrajectoryKeyframes, TRAJECTORY_PRESETS } from '@/services/cameraTrajectory';

// Effects
import { processEffectStack, registerEffectRenderer } from '@/services/effectProcessor';
import { initializeEffects } from '@/services/effects';

// Export
import { matteExporter } from '@/services/matteExporter';
import { exportCameraTrajectory, trajectoriesToNpy } from '@/services/modelExport';
```

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE DEPENDENCIES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  interpolation.ts ───▶ easing.ts                           │
│         │                                                   │
│         └───────────▶ expressions.ts                        │
│                                                             │
│  audioReactiveMapping.ts ───▶ audioFeatures.ts             │
│         │                                                   │
│         └────────────────────▶ propertyDriver.ts            │
│                                                             │
│  particleSystem.ts ───▶ math3d.ts                          │
│         │                                                   │
│         └─────────────▶ gpuParticleRenderer.ts              │
│                                                             │
│  textOnPath.ts ───▶ arcLength.ts                           │
│         │                                                   │
│         └─────────▶ fontService.ts                          │
│                                                             │
│  effectProcessor.ts ───▶ effects/blurRenderer.ts           │
│         │               effects/colorRenderer.ts            │
│         │               effects/distortRenderer.ts          │
│         │               effects/generateRenderer.ts         │
│         │               effects/maskRenderer.ts             │
│         │                                                   │
│         └─────────────▶ interpolation.ts                    │
│                                                             │
│  cameraTrajectory.ts ───▶ math3d.ts                        │
│         │                                                   │
│         └────────────────▶ cameraEnhancements.ts            │
│                                                             │
│  matteExporter.ts ───▶ layerEvaluationCache.ts             │
│         │                                                   │
│         └─────────────▶ frameCache.ts                       │
│                                                             │
│  frameCache.ts ───▶ gpuDetection.ts                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2024*
