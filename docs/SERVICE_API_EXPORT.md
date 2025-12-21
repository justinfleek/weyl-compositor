# SERVICE API - Export Services

**Weyl Compositor - Matte Export and Model Integration Services**

---

## 7.1 matteExporter.ts

**Purpose**: Export matte sequences for ComfyUI/Wan integration.

**Location**: `ui/src/services/matteExporter.ts`

**Size**: ~20KB

### Exports

```typescript
export interface ExportProgress {
  current: number;
  total: number;
  stage: 'preparing' | 'rendering' | 'encoding' | 'writing';
  layerName?: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

export interface ExportOptions {
  format: 'png' | 'webp' | 'jpeg';
  quality: number;              // 0-1 for lossy formats
  includeAlpha: boolean;
  padding: number;              // Frame padding (e.g., 4 = 0001.png)
  outputDir?: string;
}

export interface DimensionValidation {
  valid: boolean;
  width: number;
  height: number;
  adjustedWidth: number;
  adjustedHeight: number;
  message?: string;
}

class MatteExporter {
  constructor();

  // Validate dimensions (must be divisible by 8)
  validateDimensions(
    width: number,
    height: number
  ): DimensionValidation;

  // Export single layer as matte sequence
  exportLayerMatte(
    composition: Composition,
    layerId: string,
    startFrame: number,
    endFrame: number,
    options?: Partial<ExportOptions>,
    onProgress?: ProgressCallback
  ): Promise<Blob[]>;

  // Export all layers as matte sequences
  exportAllMattes(
    composition: Composition,
    options?: Partial<ExportOptions>,
    onProgress?: ProgressCallback
  ): Promise<Map<string, Blob[]>>;

  // Export combined matte
  exportCombinedMatte(
    composition: Composition,
    layerIds: string[],
    options?: Partial<ExportOptions>,
    onProgress?: ProgressCallback
  ): Promise<Blob[]>;

  // Export as ZIP
  exportAsZip(
    composition: Composition,
    options?: Partial<ExportOptions>,
    onProgress?: ProgressCallback
  ): Promise<Blob>;

  // Cancel export
  cancel(): void;
}

// Singleton
export const matteExporter: MatteExporter;
```

---

## 7.2 modelExport.ts

**Purpose**: Export for AI video models (Wan, ATI, TTM, LightX).

**Location**: `ui/src/services/modelExport.ts`

**Size**: ~35KB

### Exports

```typescript
// Types
export interface CameraMatrix4x4 {
  frame: number;
  matrix: Mat4;
}

export interface CameraTrajectoryExport {
  format: 'weyl' | 'uni3c' | 'nvs';
  fps: number;
  frameCount: number;
  matrices: CameraMatrix4x4[];
}

export interface WanMoveTrajectoryExport {
  type: 'camera' | 'object';
  points: Array<{ frame: number; x: number; y: number }>;
}

export interface PointTrajectory {
  layerId: string;
  points: Array<{ frame: number; x: number; y: number; z?: number }>;
}

export interface ParticleTrajectoryExport {
  emitterId: string;
  particles: Array<{
    id: number;
    frames: Array<{ frame: number; x: number; y: number; z: number }>;
  }>;
}

export type ATITrajectoryType = 'bezier' | 'linear' | 'arc' | 'spiral';

export interface ATITrajectoryInstruction {
  type: ATITrajectoryType;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  controlPoints?: Array<{ x: number; y: number }>;
  description: string;
}

export interface TTMExport {
  layers: TTMLayerExport[];
  frameCount: number;
  fps: number;
}

export interface TTMLayerExport {
  id: string;
  name: string;
  trajectories: PointTrajectory[];
  mask?: string;  // Base64 PNG
}

export type LightXMotionStyle = 'static' | 'pan' | 'zoom' | 'rotate' | 'complex';

export interface LightXExport {
  motionStyle: LightXMotionStyle;
  intensity: number;
  direction?: { x: number; y: number };
  masks: string[];  // Base64 PNGs
}

export type ModelTarget = 'wan' | 'ati' | 'ttm' | 'lightx' | 'comfyui';

export interface UnifiedExportOptions {
  target: ModelTarget;
  includeDepth: boolean;
  includeNormals: boolean;
  includeAudio: boolean;
  compression: boolean;
}

export interface UnifiedExportResult {
  success: boolean;
  files: Map<string, Blob>;
  metadata: Record<string, any>;
  errors: string[];
}

// Camera export
export function camera3DToMatrix4x4(
  camera: Camera3D,
  aspectRatio: number
): Mat4;

export function exportCameraTrajectory(
  camera: CameraLayer,
  format: 'weyl' | 'uni3c' | 'nvs'
): CameraTrajectoryExport;

// Layer trajectory extraction
export function extractLayerTrajectory(
  layer: Layer,
  startFrame: number,
  endFrame: number
): PointTrajectory;

export function extractSplineTrajectories(
  splineLayer: SplineLayer,
  startFrame: number,
  endFrame: number
): PointTrajectory[];

// Model-specific exports
export function exportWanMoveTrajectories(
  composition: Composition
): WanMoveTrajectoryExport[];

export function exportATITrajectory(
  trajectory: PointTrajectory
): ATITrajectoryInstruction;

export function calculatePanSpeed(
  trajectory: PointTrajectory,
  fps: number
): number;

export function exportTTMLayer(
  layer: Layer,
  composition: Composition
): TTMLayerExport;

// Motion mask generation
export function generateMotionMask(
  trajectory: PointTrajectory,
  width: number,
  height: number
): ImageData;

export function generateCombinedMotionMask(
  trajectories: PointTrajectory[],
  width: number,
  height: number
): ImageData;

// Utility
export function imageDataToBase64(imageData: ImageData): string;

export function detectMotionStyle(
  trajectory: PointTrajectory
): LightXMotionStyle;

// NPY format (for ComfyUI)
export function createNpyHeader(
  shape: number[],
  dtype: string
): Uint8Array;

export function trajectoriesToNpy(
  trajectories: PointTrajectory[]
): Blob;
```

---

## 7.3 projectStorage.ts

**Purpose**: Save/load projects to API or local file.

**Location**: `ui/src/services/projectStorage.ts`

**Size**: ~10KB

### Exports

```typescript
export interface ProjectInfo {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  thumbnail?: string;
}

export interface SaveResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  project?: WeylProject;
  error?: string;
}

export interface ListResult {
  success: boolean;
  projects?: ProjectInfo[];
  error?: string;
}

// API-based storage
export async function saveProject(
  project: WeylProject,
  name?: string
): Promise<SaveResult>;

export async function loadProject(
  projectId: string
): Promise<LoadResult>;

export async function listProjects(): Promise<ListResult>;

export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }>;

export function isApiAvailable(): Promise<boolean>;

// File-based storage
export function exportProjectAsFile(
  project: WeylProject,
  filename?: string
): void;

export function importProjectFromFile(
  file: File
): Promise<LoadResult>;
```

---

## Export Target Summary

| Target | Format | Purpose | Key Functions |
|--------|--------|---------|---------------|
| **Wan** | JSON + PNG | Video generation with motion | `exportWanMoveTrajectories`, `generateMotionMask` |
| **ATI** | JSON | Animation instructions | `exportATITrajectory` |
| **TTM** | JSON + Base64 | Time-to-Move trajectories | `exportTTMLayer` |
| **LightX** | JSON + PNG | Motion style detection | `detectMotionStyle` |
| **ComfyUI** | NPY + JSON | Node-based workflow | `trajectoriesToNpy`, `exportToUni3C` |

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2025*
