# SERVICE API REFERENCE

**Weyl Compositor - Complete Service Layer Documentation Index**

**HYPER-CRITICAL FOR HANDOFF**: This is the index to all 42 services across 10 categories.

---

## Quick Navigation

| Category | Services | Doc Link |
|----------|----------|----------|
| **Animation** | interpolation, easing, expressions, propertyDriver | [SERVICE_API_ANIMATION.md](./SERVICE_API_ANIMATION.md) |
| **Audio** | audioFeatures, audioReactiveMapping, audioPathAnimator, audioWorkerClient | [SERVICE_API_AUDIO.md](./SERVICE_API_AUDIO.md) |
| **Camera & 3D** | math3d, cameraTrajectory, camera3DVisualization, cameraExport, cameraEnhancements | [SERVICE_API_CAMERA_3D.md](./SERVICE_API_CAMERA_3D.md) |
| **Particle** | particleSystem, gpuParticleRenderer, meshParticleManager, spriteSheet | [SERVICE_API_PARTICLE.md](./SERVICE_API_PARTICLE.md) |
| **Shape & Geometry** | arcLength, textOnPath, shapeOperations, imageTrace | [SERVICE_API_SHAPE.md](./SERVICE_API_SHAPE.md) |
| **Effect** | effectProcessor, blur/color/distort/generate/maskRenderer | [SERVICE_API_EFFECT.md](./SERVICE_API_EFFECT.md) |
| **Export** | matteExporter, modelExport, projectStorage | [SERVICE_API_EXPORT.md](./SERVICE_API_EXPORT.md) |
| **Cache** | frameCache, layerEvaluationCache | [SERVICE_API_CACHE.md](./SERVICE_API_CACHE.md) |
| **Asset & Storage** | fontService, lazyLoader | [SERVICE_API_ASSET.md](./SERVICE_API_ASSET.md) |
| **Utility** | gpuDetection, workerPool, motionBlur, timelineSnap | [SERVICE_API_UTILITY.md](./SERVICE_API_UTILITY.md) |

---

## Service Summary

### 1. Animation Services (4 services)
Core keyframe interpolation and expression evaluation.

| Service | Size | Purpose |
|---------|------|---------|
| `interpolation.ts` | 21KB | Keyframe interpolation, bezier easing |
| `easing.ts` | 8KB | Standalone easing functions |
| `expressions.ts` | 15KB | Expression evaluation system |
| `propertyDriver.ts` | 25KB | Property linking (pickwhip) |

### 2. Audio Services (4 services)
Audio analysis and reactive animation.

| Service | Size | Purpose |
|---------|------|---------|
| `audioFeatures.ts` | 36KB | Audio analysis, feature extraction |
| `audioReactiveMapping.ts` | 22KB | Map audio to animation params |
| `audioPathAnimator.ts` | 15KB | Audio-driven path animation |
| `audioWorkerClient.ts` | 5KB | Background audio analysis |

### 3. Camera & 3D Services (5 services)
3D math, camera trajectories, and visualization.

| Service | Size | Purpose |
|---------|------|---------|
| `math3d.ts` | 18KB | Vectors, matrices, quaternions |
| `cameraTrajectory.ts` | 20KB | 22 trajectory presets |
| `camera3DVisualization.ts` | 15KB | Frustum and helper geometry |
| `cameraExport.ts` | 12KB | Export to Uni3C, AE script |
| `cameraEnhancements.ts` | 20KB | Shake, rack focus, auto-focus |

### 4. Particle Services (4 services)
Deterministic particle simulation and rendering.

| Service | Size | Purpose |
|---------|------|---------|
| `particleSystem.ts` | 65KB | Core particle simulation |
| `gpuParticleRenderer.ts` | 20KB | GPU-accelerated rendering |
| `meshParticleManager.ts` | 12KB | Custom mesh particles |
| `spriteSheet.ts` | 15KB | Sprite animation system |

### 5. Shape & Geometry Services (4 services)
Path manipulation and text on path.

| Service | Size | Purpose |
|---------|------|---------|
| `arcLength.ts` | 8KB | Arc-length parameterization |
| `textOnPath.ts` | 12KB | Text along bezier paths |
| `shapeOperations.ts` | 45KB | Path manipulation ops |
| `imageTrace.ts` | 15KB | Raster to vector conversion |

### 6. Effect Services (6 renderers)
Image processing effects.

| Service | Purpose |
|---------|---------|
| `effectProcessor.ts` | Effect stack processing |
| `effects/blurRenderer.ts` | Blur effects (5 types) |
| `effects/colorRenderer.ts` | Color correction (13 types) |
| `effects/distortRenderer.ts` | Transform effects (3 types) |
| `effects/generateRenderer.ts` | Procedural generation (3 types) |
| `effects/maskRenderer.ts` | Mask compositing |

### 7. Export Services (3 services)
Matte export and model integration.

| Service | Size | Purpose |
|---------|------|---------|
| `matteExporter.ts` | 20KB | Matte sequence export |
| `modelExport.ts` | 35KB | AI model export (Wan, ATI, TTM) |
| `projectStorage.ts` | 10KB | Project save/load |

### 8. Cache Services (2 services)
Frame and evaluation caching.

| Service | Size | Purpose |
|---------|------|---------|
| `frameCache.ts` | 12KB | Rendered frame cache |
| `layerEvaluationCache.ts` | 8KB | Layer evaluation cache |

### 9. Asset & Storage Services (2 services)
Font and asset management.

| Service | Size | Purpose |
|---------|------|---------|
| `fontService.ts` | 8KB | Font loading and measurement |
| `lazyLoader.ts` | 5KB | Lazy asset loading |

### 10. Utility Services (4 services)
GPU detection and timeline utilities.

| Service | Size | Purpose |
|---------|------|---------|
| `gpuDetection.ts` | 5KB | GPU capability detection |
| `workerPool.ts` | 10KB | Web Worker pool |
| `motionBlur.ts` | 15KB | Motion blur processing |
| `timelineSnap.ts` | 6KB | Beat/marker snapping |

---

## Service Dependencies Diagram

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
│  effectProcessor.ts ───▶ effects/*Renderer.ts              │
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

## Import Patterns

### From Central Index
```typescript
import {
  interpolateProperty,
  ParticleSystem,
  AudioReactiveMapper,
  matteExporter,
  fontService,
} from '@/services';
```

### From Specific Service
```typescript
import { interpolateProperty, EASING_PRESETS } from '@/services/interpolation';
import { analyzeAudio, loadAudioFile } from '@/services/audioFeatures';
import { ParticleSystem, SeededRandom } from '@/services/particleSystem';
```

---

## Related Documentation

- [EFFECT_PARAMETERS.md](./EFFECT_PARAMETERS.md) - Detailed effect parameter documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DOCS_REVIEW.md](./DOCS_REVIEW.md) - Spec compliance audit

---

**Total Services**: 42
**Total Lines of Code**: ~350KB
**Split into**: 10 category files for easier reading

*Generated: December 23, 2025*
