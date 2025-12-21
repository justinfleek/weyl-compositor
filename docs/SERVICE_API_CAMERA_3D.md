# SERVICE API - Camera & 3D Services

**Weyl Compositor - 3D Math, Camera, and Visualization Services**

---

## 3.1 math3d.ts

**Purpose**: 3D math utilities (vectors, matrices, quaternions).

**Location**: `ui/src/services/math3d.ts`

**Size**: ~18KB

### Exports

```typescript
// Types
export type Vec3 = [number, number, number];
export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];
export type Quat = [number, number, number, number];  // x, y, z, w

// Vector operations
export function vec3(x: number, y: number, z: number): Vec3;
export function addVec3(a: Vec3, b: Vec3): Vec3;
export function subVec3(a: Vec3, b: Vec3): Vec3;
export function scaleVec3(v: Vec3, s: number): Vec3;
export function lengthVec3(v: Vec3): number;
export function normalizeVec3(v: Vec3): Vec3;
export function crossVec3(a: Vec3, b: Vec3): Vec3;
export function dotVec3(a: Vec3, b: Vec3): number;
export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3;
export function distanceVec3(a: Vec3, b: Vec3): number;

// Matrix operations
export function identityMat4(): Mat4;
export function multiplyMat4(a: Mat4, b: Mat4): Mat4;
export function perspectiveMat4(
  fovY: number,      // Field of view in radians
  aspect: number,    // Aspect ratio
  near: number,      // Near plane
  far: number        // Far plane
): Mat4;
export function orthographicMat4(
  left: number, right: number,
  bottom: number, top: number,
  near: number, far: number
): Mat4;
export function lookAtMat4(
  eye: Vec3,         // Camera position
  target: Vec3,      // Look-at point
  up: Vec3           // Up vector
): Mat4;
export function translateMat4(m: Mat4, v: Vec3): Mat4;
export function rotateXMat4(m: Mat4, angle: number): Mat4;
export function rotateYMat4(m: Mat4, angle: number): Mat4;
export function rotateZMat4(m: Mat4, angle: number): Mat4;
export function scaleMat4(m: Mat4, s: Vec3): Mat4;
export function transformPoint(m: Mat4, p: Vec3): Vec3;
export function transformDirection(m: Mat4, d: Vec3): Vec3;
export function invertMat4(m: Mat4): Mat4 | null;

// Quaternion operations
export function quatIdentity(): Quat;
export function quatFromEuler(x: number, y: number, z: number): Quat;
export function quatToEuler(q: Quat): Vec3;
export function slerpQuat(a: Quat, b: Quat, t: number): Quat;

// Utility conversions
export function focalLengthToFOV(focalLength: number, sensorWidth?: number): number;
export function fovToFocalLength(fov: number, sensorWidth?: number): number;
export function zoomToFocalLength(zoom: number, baseFocalLength?: number): number;
export function focalLengthToZoom(focalLength: number, baseFocalLength?: number): number;
export function degToRad(degrees: number): number;
export function radToDeg(radians: number): number;
```

---

## 3.2 cameraTrajectory.ts

**Purpose**: Camera trajectory presets and path generation.

**Location**: `ui/src/services/cameraTrajectory.ts`

**Size**: ~20KB

### Exports

```typescript
export interface SphericalCoords {
  radius: number;       // Distance from target
  theta: number;        // Horizontal angle (azimuth)
  phi: number;          // Vertical angle (elevation)
  target: Vec3;         // Look-at target
}

export type TrajectoryType =
  // Orbital
  | 'orbit-horizontal'
  | 'orbit-vertical'
  | 'orbit-diagonal'
  | 'orbit-spiral'
  | 'orbit-figure8'
  // Linear
  | 'dolly-in'
  | 'dolly-out'
  | 'truck-left'
  | 'truck-right'
  | 'pedestal-up'
  | 'pedestal-down'
  | 'push-pull'
  // Complex
  | 'crane-up'
  | 'crane-down'
  | 'arc-left'
  | 'arc-right'
  | 'reveal'
  | 'flythrough'
  | 'zoom-crash'
  | 'parallax-shift'
  | 'dutch-tilt'
  | 'vertigo';

export interface TrajectoryConfig {
  type: TrajectoryType;
  duration: number;           // In frames
  easing: string;             // Easing function name
  intensity: number;          // Movement amount (0-2)
  startPosition: SphericalCoords;
  endPosition?: SphericalCoords;  // Auto-calculated if not set
  loops: number;              // For orbital moves
  reverse: boolean;           // Play backwards
}

export interface TrajectoryKeyframes {
  position: Array<{ frame: number; value: Vec3 }>;
  rotation: Array<{ frame: number; value: Vec3 }>;
  fov?: Array<{ frame: number; value: number }>;
}

// Default values
export const DEFAULT_SPHERICAL: SphericalCoords;
export const DEFAULT_TRAJECTORY: TrajectoryConfig;

// Presets for each trajectory type
export const TRAJECTORY_PRESETS: Record<TrajectoryType, Partial<TrajectoryConfig>>;

// Coordinate conversions
export function sphericalToCartesian(
  coords: SphericalCoords
): Vec3;

export function cartesianToSpherical(
  position: Vec3,
  target?: Vec3
): SphericalCoords;

// Get position at normalized time (0-1)
export function getTrajectoryPosition(
  config: TrajectoryConfig,
  t: number
): SphericalCoords;

// Generate keyframes for full trajectory
export function generateTrajectoryKeyframes(
  config: TrajectoryConfig,
  keyframeInterval?: number  // Default: 5 frames
): TrajectoryKeyframes;

// Apply to existing camera layer
export function applyCameraTrajectory(
  cameraLayerId: string,
  config: TrajectoryConfig,
  startFrame?: number
): void;

// Create from preset with overrides
export function createTrajectoryFromPreset(
  type: TrajectoryType,
  overrides?: Partial<TrajectoryConfig>
): TrajectoryConfig;

// Metadata
export function getTrajectoryDescription(type: TrajectoryType): string;
export function getTrajectoryCategory(type: TrajectoryType): string;
export function getTrajectoryTypesByCategory(): Record<string, TrajectoryType[]>;
```

### Trajectory Categories

```
{
  "Orbital": ["orbit-horizontal", "orbit-vertical", "orbit-diagonal", "orbit-spiral", "orbit-figure8"],
  "Linear": ["dolly-in", "dolly-out", "truck-left", "truck-right", "pedestal-up", "pedestal-down", "push-pull"],
  "Complex": ["crane-up", "crane-down", "arc-left", "arc-right", "reveal", "flythrough", "zoom-crash", "parallax-shift", "dutch-tilt", "vertigo"]
}
```

---

## 3.3 camera3DVisualization.ts

**Purpose**: Generate 3D visualization geometry for camera frustum and helpers.

**Location**: `ui/src/services/camera3DVisualization.ts`

**Size**: ~15KB

### Exports

```typescript
export interface LineSegment {
  start: Vec3;
  end: Vec3;
  color?: string;
}

export interface CameraVisualization {
  body: LineSegment[];          // Camera body wireframe
  frustum: LineSegment[];       // View frustum
  poi: LineSegment | null;      // Point of interest line
  focalPlane: LineSegment[];    // DOF focal plane
}

export interface ViewMatrices {
  view: Mat4;
  projection: Mat4;
  viewProjection: Mat4;
}

// Generate camera body wireframe
export function generateCameraBody(camera: Camera3D): LineSegment[];

// Generate frustum visualization
export function generateFrustum(
  camera: Camera3D,
  near?: number,
  far?: number,
  aspectRatio?: number
): LineSegment[];

// Generate composition bounds rectangle
export function generateCompositionBounds(
  width: number,
  height: number,
  depth: number
): LineSegment[];

// Point of interest line
export function generatePOILine(camera: Camera3D): LineSegment | null;

// DOF focal plane visualization
export function generateFocalPlane(
  camera: Camera3D,
  width: number,
  height: number
): LineSegment[];

// All visualizations combined
export function generateCameraVisualization(
  camera: Camera3D,
  compositionWidth: number,
  compositionHeight: number
): CameraVisualization;

// Get view/projection matrices for rendering
export function getCameraViewMatrices(
  camera: Camera3D,
  aspectRatio: number
): ViewMatrices;

// Orthographic view matrices (for 2D editor views)
export function getOrthoViewMatrices(
  view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom',
  bounds: { left: number; right: number; top: number; bottom: number },
  zoom: number
): ViewMatrices;

// Project 3D point to screen coordinates
export function projectToScreen(
  point: Vec3,
  matrices: ViewMatrices,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; visible: boolean };

// Generate coordinate axes
export function generate3DAxes(
  length?: number,      // Default: 100
  origin?: Vec3         // Default: [0,0,0]
): LineSegment[];

// Generate ground grid
export function generateGrid(
  size?: number,        // Default: 1000
  divisions?: number,   // Default: 10
  y?: number            // Default: 0
): LineSegment[];
```

---

## 3.4 cameraExport.ts

**Purpose**: Export camera data for external tools (AE, ComfyUI, etc.)

**Location**: `ui/src/services/cameraExport.ts`

**Size**: ~12KB

### Exports

```typescript
export interface Uni3CTrack {
  name: string;
  frames: Uni3CFrame[];
  fps: number;
  width: number;
  height: number;
}

export interface Uni3CFrame {
  frame: number;
  position: Vec3;
  rotation: Vec3;        // Euler XYZ in degrees
  fov: number;
  near: number;
  far: number;
}

// Export to Uni3C JSON format (ComfyUI compatible)
export function exportToUni3C(
  camera: Camera3D,
  keyframes: CameraKeyframe[],
  compositionSettings: CompositionSettings
): Uni3CTrack;

// Generic JSON export
export function exportCameraJSON(
  camera: Camera3D,
  keyframes: CameraKeyframe[]
): string;

// Import from JSON
export function importCameraJSON(
  json: string
): { camera: Camera3D; keyframes: CameraKeyframe[] } | null;

// Export to After Effects script
export function exportToAEScript(
  camera: Camera3D,
  keyframes: CameraKeyframe[],
  compositionSettings: CompositionSettings
): string;

// Download helper
export function downloadFile(
  content: string,
  filename: string,
  mimeType?: string     // Default: 'application/json'
): void;
```

---

## 3.5 cameraEnhancements.ts

**Purpose**: Camera effects (shake, rack focus, auto-focus).

**Location**: `ui/src/services/cameraEnhancements.ts`

**Size**: ~20KB

### Exports

```typescript
export interface CameraShakeConfig {
  type: 'handheld' | 'earthquake' | 'explosion' | 'vehicle' | 'breathing';
  intensity: number;          // 0-1
  frequency: number;          // Oscillations per second
  decay: number;              // How fast it dampens (0-1)
  seed: number;               // For determinism
  enabled: boolean;
  affectsRotation: boolean;
  affectsPosition: boolean;
}

export interface RackFocusConfig {
  enabled: boolean;
  startDistance: number;      // Focus distance at start
  endDistance: number;        // Focus distance at end
  startFrame: number;
  endFrame: number;
  easing: string;
  holdAtStart: number;        // Frames to hold at start
  holdAtEnd: number;          // Frames to hold at end
}

export interface AutoFocusConfig {
  enabled: boolean;
  targetLayerId: string | null;  // Track this layer
  depthSource: 'layer' | 'manual' | 'click';
  smoothing: number;          // Focus transition smoothing
  offset: number;             // Focus offset from target
}

export interface MotionBlurEstimate {
  shutterAngle: number;       // Degrees
  samples: number;            // Blur samples needed
  velocity: Vec3;             // Camera velocity
}

// Preset configurations
export const SHAKE_PRESETS: Record<CameraShakeConfig['type'], Partial<CameraShakeConfig>>;
export const DEFAULT_SHAKE_CONFIG: CameraShakeConfig;
export const DEFAULT_RACK_FOCUS: RackFocusConfig;
export const DEFAULT_AUTOFOCUS: AutoFocusConfig;

// Camera shake class
export class CameraShake {
  constructor(config?: Partial<CameraShakeConfig>);

  setConfig(config: Partial<CameraShakeConfig>): void;
  getConfig(): CameraShakeConfig;
  reset(): void;

  // Get shake offset at frame
  evaluate(frame: number, fps: number): {
    position: Vec3;
    rotation: Vec3;
  };

  // Apply shake to camera
  applyToCamera(
    camera: Camera3D,
    frame: number,
    fps: number
  ): Camera3D;
}

// Rack focus evaluation
export function getRackFocusDistance(
  config: RackFocusConfig,
  frame: number
): number;

// Generate rack focus keyframes
export function generateRackFocusKeyframes(
  config: RackFocusConfig
): Array<{ frame: number; value: number }>;

// Auto-focus calculation
export function calculateAutoFocusDistance(
  config: AutoFocusConfig,
  targetPosition: Vec3,
  cameraPosition: Vec3,
  previousDistance: number
): number;

// Motion blur estimation
export function estimateMotionBlur(
  camera: Camera3D,
  previousCamera: Camera3D,
  fps: number,
  shutterAngle?: number
): MotionBlurEstimate;

// Generate motion blur keyframes
export function generateMotionBlurKeyframes(
  cameras: Camera3D[],
  fps: number
): Array<{ frame: number; blur: number }>;

// Factory functions
export function createCameraShake(
  type: CameraShakeConfig['type'],
  intensity?: number
): CameraShake;

export function createRackFocus(
  startDistance: number,
  endDistance: number,
  startFrame: number,
  endFrame: number
): RackFocusConfig;

export function createAutoFocus(
  targetLayerId: string
): AutoFocusConfig;
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2025*
