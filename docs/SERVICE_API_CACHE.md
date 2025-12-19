# SERVICE API - Cache Services

**Weyl Compositor - Frame Caching and Evaluation Cache Services**

---

## 8.1 frameCache.ts

**Purpose**: Frame caching for smooth timeline scrubbing.

**Location**: `ui/src/services/frameCache.ts`

**Size**: ~12KB

### Exports

```typescript
export interface CachedFrame {
  frame: number;
  compositionId: string;
  data: ImageData | Blob;
  compressed: boolean;
  width: number;
  height: number;
  timestamp: number;
  size: number;
  stateHash: string;
}

export interface FrameCacheConfig {
  maxFrames: number;
  maxMemoryBytes: number;
  compression: boolean;
  compressionQuality: number;
  preCacheWindow: number;
  predictivePreCache: boolean;
}

export interface CacheStats {
  cachedFrames: number;
  memoryUsed: number;
  hitRatio: number;
  hits: number;
  misses: number;
}

export class FrameCache {
  constructor(config?: Partial<FrameCacheConfig>);

  // Configuration
  setConfig(config: Partial<FrameCacheConfig>): void;
  getConfig(): FrameCacheConfig;

  // Cache operations
  get(
    compositionId: string,
    frame: number,
    stateHash: string
  ): CachedFrame | null;

  set(
    compositionId: string,
    frame: number,
    data: ImageData,
    stateHash: string
  ): Promise<void>;

  has(compositionId: string, frame: number): boolean;

  invalidate(compositionId: string, frame?: number): void;
  invalidateAll(): void;

  // Pre-caching
  schedulePreCache(
    compositionId: string,
    currentFrame: number,
    direction: 1 | -1,
    renderFn: (frame: number) => Promise<ImageData>
  ): void;

  cancelPreCache(): void;

  // Statistics
  getStats(): CacheStats;

  // Cleanup
  dispose(): void;
}

// Singleton access
export function getFrameCache(): FrameCache;
export function initializeFrameCache(config?: Partial<FrameCacheConfig>): void;
```

### Cache Configuration Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxFrames` | 300 | Maximum frames to cache |
| `maxMemoryBytes` | 512MB | Memory limit |
| `compression` | true | Enable JPEG compression |
| `compressionQuality` | 0.85 | JPEG quality (0-1) |
| `preCacheWindow` | 10 | Frames to pre-cache |
| `predictivePreCache` | true | Predict playback direction |

---

## 8.2 layerEvaluationCache.ts

**Purpose**: Differential layer evaluation with version tracking.

**Location**: `ui/src/services/layerEvaluationCache.ts`

**Size**: ~8KB

### Exports

```typescript
// Version tracking
export function markLayerDirty(layerId: string): void;
export function markAllLayersDirty(): void;
export function getLayerVersion(layerId: string): number;
export function getGlobalVersion(): number;

// Cache access
export function getCachedEvaluation(
  layerId: string,
  frame: number
): EvaluatedLayer | null;

export function setCachedEvaluation(
  layerId: string,
  frame: number,
  evaluatedLayer: EvaluatedLayer
): void;

// Utility
export function invalidateLayerCache(layerId: string): void;
export function invalidateAllCaches(): void;
export function getCacheStats(): {
  entries: number;
  maxSize: number;
  hitRate: number;
};

// Layer evaluation (uses cache)
export function evaluateLayerCached(
  layer: Layer,
  frame: number,
  evaluateFn: (layer: Layer, frame: number) => EvaluatedLayer
): EvaluatedLayer;
```

### Version Tracking System

The layer evaluation cache uses a version-based invalidation system:

1. **Layer Version**: Each layer has a version number that increments when any property changes
2. **Global Version**: Increments on any change for bulk invalidation detection
3. **Cache Key**: `${layerId}:${frame}` with version validation

```typescript
// Example usage
import { markLayerDirty, getCachedEvaluation } from '@/services/layerEvaluationCache';

// When layer property changes
markLayerDirty(layerId);

// Cache automatically invalidates for this layer
const result = getCachedEvaluation(layerId, frame); // Returns null after change
```

---

## Cache Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │  Frame Cache    │    │  Layer Eval     │               │
│  │  (ImageData)    │    │  Cache          │               │
│  ├─────────────────┤    ├─────────────────┤               │
│  │ Key: comp:frame │    │ Key: layer:frame│               │
│  │ LRU eviction    │    │ Version check   │               │
│  │ Compression     │    │ Frozen output   │               │
│  │ Pre-caching     │    │ O(1) lookup     │               │
│  └────────┬────────┘    └────────┬────────┘               │
│           │                      │                         │
│           └──────────┬───────────┘                         │
│                      │                                     │
│           ┌──────────▼──────────┐                         │
│           │    Render Pipeline   │                         │
│           │    (WeylEngine.ts)   │                         │
│           └─────────────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Characteristics

| Operation | Frame Cache | Layer Eval Cache |
|-----------|-------------|------------------|
| Cache Hit | O(1) | O(1) |
| Cache Miss | Full render | Layer evaluation |
| Invalidation (single) | O(n) frames | O(n) frames |
| Invalidation (all) | O(1) clear | O(1) clear |
| Memory | Configurable | ~5000 entries |

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2024*
