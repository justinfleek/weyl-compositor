# SERVICE API - Particle Services

**Weyl Compositor - Deterministic Particle System Services**

---

## 4.1 particleSystem.ts

**Purpose**: Deterministic particle simulation with seeded RNG.

**Location**: `ui/src/services/particleSystem.ts`

**Size**: ~65KB | **Lines**: ~2400

### Exports

```typescript
// Reset ID counter (for determinism)
export function resetIdCounter(value?: number): void;

// Seeded random number generator (Mulberry32)
export class SeededRandom {
  constructor(seed: number);
  next(): number;                    // 0-1
  nextRange(min: number, max: number): number;
  nextInt(min: number, max: number): number;
  nextBool(probability?: number): boolean;
  nextVec2(range: number): { x: number; y: number };
  nextVec3(range: number): { x: number; y: number; z: number };
  nextColor(): { r: number; g: number; b: number; a: number };
  getSeed(): number;
  setSeed(seed: number): void;
}

// Particle structure
export interface Particle {
  id: number;
  position: Vec3;
  velocity: Vec3;
  acceleration: Vec3;
  age: number;                       // Current age in frames
  lifetime: number;                  // Max lifetime in frames
  size: number;
  sizeStart: number;
  sizeEnd: number;
  color: { r: number; g: number; b: number; a: number };
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  rotation: number;
  rotationSpeed: number;
  mass: number;
  alive: boolean;
  emitterId: string;
  spriteIndex: number;
  custom: Record<string, number>;    // Custom data
}

// Emitter shape types
export type EmitterShape = 'point' | 'line' | 'circle' | 'box' | 'sphere' | 'ring' | 'spline';

// Spline emission configuration
export interface SplinePathEmission {
  layerId: string;                   // SplineLayer to emit from
  distribution: 'uniform' | 'random' | 'sequential';
  alignToPath: boolean;
  spreadAngle: number;
}

// Sprite configuration
export interface SpriteConfig {
  enabled: boolean;
  textureUrl: string;
  columns: number;
  rows: number;
  startFrame: number;
  endFrame: number;
  animationMode: 'loop' | 'once' | 'pingPong' | 'random';
  frameRate: number;
}

// Full emitter configuration
export interface EmitterConfig {
  id: string;
  name: string;
  enabled: boolean;

  // Emission
  emissionRate: number;              // Particles per frame
  burstCount: number;                // Particles per burst
  burstInterval: number;             // Frames between bursts
  maxParticles: number;

  // Shape
  shape: EmitterShape;
  shapeRadius: number;
  shapeWidth: number;
  shapeHeight: number;
  shapeDepth: number;
  splinePath?: SplinePathEmission;

  // Initial values
  lifetime: { min: number; max: number };
  speed: { min: number; max: number };
  direction: Vec3;
  spread: number;                    // Cone angle in degrees

  // Size
  sizeStart: { min: number; max: number };
  sizeEnd: { min: number; max: number };

  // Color
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };

  // Rotation
  rotationStart: { min: number; max: number };
  rotationSpeed: { min: number; max: number };

  // Physics
  mass: { min: number; max: number };

  // Sprite
  sprite: SpriteConfig;
}

// Force configurations
export interface GravityWellConfig {
  id: string;
  enabled: boolean;
  position: Vec3;
  strength: number;
  radius: number;
  falloff: 'linear' | 'quadratic' | 'none';
}

export interface VortexConfig {
  id: string;
  enabled: boolean;
  position: Vec3;
  axis: Vec3;
  strength: number;
  radius: number;
  pull: number;                      // Inward force
}

export interface TurbulenceConfig {
  id: string;
  enabled: boolean;
  strength: number;
  scale: number;                     // Noise frequency
  speed: number;                     // Animation speed
  octaves: number;
}

// Collision configuration
export interface CollisionConfig {
  enabled: boolean;
  bounce: number;                    // 0-1 elasticity
  friction: number;
  killOnCollision: boolean;
  planes: Array<{ normal: Vec3; distance: number }>;
  spheres: Array<{ center: Vec3; radius: number }>;
}

// Sub-emitter configuration
export interface SubEmitterConfig {
  id: string;
  enabled: boolean;
  trigger: 'birth' | 'death' | 'collision' | 'lifetime';
  lifetimeThreshold?: number;        // For 'lifetime' trigger
  emitterConfig: EmitterConfig;
  inheritVelocity: number;           // 0-1
  inheritColor: boolean;
}

// Connection configuration (particle trails/lines)
export interface ConnectionConfig {
  enabled: boolean;
  maxDistance: number;
  maxConnections: number;
  lineWidth: number;
  opacity: number;
}

// Full system configuration
export interface ParticleSystemConfig {
  seed: number;
  gravity: Vec3;
  wind: Vec3;
  damping: number;
  worldScale: number;
  bounds?: { min: Vec3; max: Vec3 };
  killOutOfBounds: boolean;
}

// Render options
export interface RenderOptions {
  mode: 'points' | 'sprites' | 'trails' | 'mesh';
  blendMode: string;
  depthTest: boolean;
  depthWrite: boolean;
  sortByDepth: boolean;
  trailLength: number;
  trailWidth: number;
  meshGeometry?: 'quad' | 'triangle' | 'custom';
}

// Default creators
export function createDefaultSpriteConfig(): SpriteConfig;
export function createDefaultSplinePathEmission(layerId?: string): SplinePathEmission;
export function createDefaultCollisionConfig(): CollisionConfig;
export function createDefaultEmitterConfig(id?: string): EmitterConfig;
export function createDefaultTurbulenceConfig(id?: string): TurbulenceConfig;
export function createDefaultConnectionConfig(): ConnectionConfig;
export function createDefaultSubEmitterConfig(id?: string): SubEmitterConfig;
export function createDefaultGravityWellConfig(id?: string): GravityWellConfig;
export function createDefaultVortexConfig(id?: string): VortexConfig;
export function createDefaultSystemConfig(): ParticleSystemConfig;
export function createDefaultRenderOptions(): RenderOptions;

// Main particle system class
export class ParticleSystem {
  constructor(config?: Partial<ParticleSystemConfig>);

  // Configuration
  setConfig(config: Partial<ParticleSystemConfig>): void;
  getConfig(): ParticleSystemConfig;

  // Emitter management
  addEmitter(config: EmitterConfig): void;
  removeEmitter(id: string): void;
  updateEmitter(id: string, config: Partial<EmitterConfig>): void;
  getEmitter(id: string): EmitterConfig | undefined;
  getAllEmitters(): EmitterConfig[];

  // Force management
  addGravityWell(config: GravityWellConfig): void;
  removeGravityWell(id: string): void;
  addVortex(config: VortexConfig): void;
  removeVortex(id: string): void;
  addTurbulence(config: TurbulenceConfig): void;
  removeTurbulence(id: string): void;

  // Collision
  setCollision(config: CollisionConfig): void;

  // Sub-emitters
  addSubEmitter(config: SubEmitterConfig): void;
  removeSubEmitter(id: string): void;

  // Simulation - DETERMINISTIC
  reset(): void;
  evaluate(frame: number): Particle[];
  evaluateRange(startFrame: number, endFrame: number): Map<number, Particle[]>;

  // Checkpoint system (for scrubbing)
  saveCheckpoint(frame: number): void;
  loadCheckpoint(frame: number): boolean;
  getNearestCheckpoint(frame: number): number | null;

  // Particle access
  getParticles(): Particle[];
  getParticleCount(): number;
  getAliveCount(): number;

  // Statistics
  getStats(): {
    totalEmitted: number;
    totalDied: number;
    currentAlive: number;
    checkpoints: number;
  };
}
```

---

## 4.2 gpuParticleRenderer.ts

**Purpose**: GPU-accelerated particle rendering using Transform Feedback or instancing.

**Location**: `ui/src/services/gpuParticleRenderer.ts`

**Size**: ~20KB

### Exports

```typescript
export interface GPUParticleRendererConfig {
  maxParticles: number;
  useTransformFeedback: boolean;
  sortParticles: boolean;
  enableBlending: boolean;
}

export interface GPUParticleData {
  positions: Float32Array;      // xyz per particle
  velocities: Float32Array;     // xyz per particle
  colors: Float32Array;         // rgba per particle
  sizes: Float32Array;          // size per particle
  ages: Float32Array;           // age per particle
  count: number;
}

// Transform Feedback based renderer
export class GPUParticleRenderer {
  constructor(
    gl: WebGL2RenderingContext,
    config?: Partial<GPUParticleRendererConfig>
  );

  setConfig(config: Partial<GPUParticleRendererConfig>): void;
  uploadParticles(particles: Particle[]): void;
  render(viewMatrix: Mat4, projectionMatrix: Mat4): void;
  dispose(): void;

  getStats(): {
    particleCount: number;
    drawCalls: number;
    gpuMemory: number;
  };
}

// Instanced mesh based renderer
export class InstancedParticleRenderer {
  constructor(
    gl: WebGL2RenderingContext,
    config?: Partial<GPUParticleRendererConfig>
  );

  setGeometry(geometry: 'quad' | 'triangle' | 'sphere'): void;
  setTexture(texture: WebGLTexture): void;
  uploadParticles(particles: Particle[]): void;
  render(viewMatrix: Mat4, projectionMatrix: Mat4): void;
  dispose(): void;
}

// Factory functions
export function createGPUParticleRenderer(
  gl: WebGL2RenderingContext,
  config?: Partial<GPUParticleRendererConfig>
): GPUParticleRenderer;

export function createInstancedParticleRenderer(
  gl: WebGL2RenderingContext,
  config?: Partial<GPUParticleRendererConfig>
): InstancedParticleRenderer;
```

---

## 4.3 meshParticleManager.ts

**Purpose**: Custom mesh particles (logo particles, 3D shapes).

**Location**: `ui/src/services/meshParticleManager.ts`

**Size**: ~12KB

### Exports

```typescript
export type MeshParticleSource = 'primitive' | 'svg' | 'gltf' | 'custom';

export interface MeshParticleConfig {
  source: MeshParticleSource;
  primitiveType?: 'cube' | 'sphere' | 'tetrahedron' | 'torus';
  svgUrl?: string;
  gltfUrl?: string;
  customGeometry?: THREE.BufferGeometry;
  scale: number;
  randomRotation: boolean;
  lodLevels?: number;
}

export interface RegisteredMeshParticle {
  id: string;
  name: string;
  config: MeshParticleConfig;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export interface InstancedMeshParticles {
  mesh: THREE.InstancedMesh;
  capacity: number;
  activeCount: number;
}

export class MeshParticleManager {
  constructor(scene: THREE.Scene);

  // Registration
  registerMesh(
    id: string,
    name: string,
    config: MeshParticleConfig
  ): Promise<void>;

  unregisterMesh(id: string): void;
  getMesh(id: string): RegisteredMeshParticle | undefined;
  getAllMeshes(): RegisteredMeshParticle[];

  // Instance pool
  createInstancePool(
    meshId: string,
    maxInstances: number
  ): InstancedMeshParticles;

  updateInstances(
    pool: InstancedMeshParticles,
    particles: Particle[]
  ): void;

  disposePool(pool: InstancedMeshParticles): void;
  dispose(): void;
}

// Singleton
export const meshParticleManager: MeshParticleManager;

export function createDefaultMeshParticleConfig(): MeshParticleConfig;
```

---

## 4.4 spriteSheet.ts

**Purpose**: Sprite sheet loading and animation for particle textures.

**Location**: `ui/src/services/spriteSheet.ts`

**Size**: ~15KB

### Exports

```typescript
export interface SpriteFrame {
  x: number;                    // Pixel X in sheet
  y: number;                    // Pixel Y in sheet
  width: number;
  height: number;
  u0: number;                   // UV coordinates
  v0: number;
  u1: number;
  v1: number;
}

export interface SpriteAnimation {
  name: string;
  frames: number[];             // Frame indices
  fps: number;
  loop: boolean;
}

export interface SpriteSheetConfig {
  url: string;
  columns: number;
  rows: number;
  frameWidth?: number;          // Auto-calculated if not set
  frameHeight?: number;
  padding?: number;
  animations?: SpriteAnimation[];
}

export interface SpriteSheetMetadata {
  width: number;
  height: number;
  frameCount: number;
  frames: SpriteFrame[];
  animations: Map<string, SpriteAnimation>;
}

export interface ParticleSpriteConfig {
  spriteSheetId: string;
  animation: string;
  startFrame: 'random' | 'first' | number;
  playOnce: boolean;
  randomOffset: boolean;
}

export class SpriteSheetService {
  constructor();

  // Loading
  loadSpriteSheet(
    id: string,
    config: SpriteSheetConfig
  ): Promise<void>;

  loadFromJSON(
    id: string,
    url: string
  ): Promise<void>;

  unload(id: string): void;

  // Access
  getSpriteSheet(id: string): SpriteSheetMetadata | undefined;
  getTexture(id: string): THREE.Texture | undefined;
  getAllIds(): string[];

  // Frame lookup
  getFrame(id: string, frameIndex: number): SpriteFrame | undefined;
  getAnimationFrame(
    id: string,
    animationName: string,
    time: number,
    fps: number
  ): SpriteFrame | undefined;

  // UV generation for instanced rendering
  generateUVBuffer(
    id: string,
    frameIndices: number[]
  ): Float32Array;

  dispose(): void;
}

// Singleton
export const spriteSheetService: SpriteSheetService;

export function createDefaultParticleSpriteConfig(): ParticleSpriteConfig;
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 19, 2024*
