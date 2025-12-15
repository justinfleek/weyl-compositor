/**
 * GPU Particle System Module
 *
 * High-performance particle system for Weyl Compositor featuring:
 * - 100k+ particles via WebGL2 instanced rendering
 * - GPU-accelerated physics (CPU fallback available)
 * - Full 3D simulation with mass, drag, forces
 * - Audio/MIDI reactive parameter modulation
 * - Professional emitter shapes and force fields
 */

// Core system
export {
  GPUParticleSystem,
  createDefaultConfig,
  createDefaultEmitter,
  createDefaultForceField,
} from './GPUParticleSystem';

// Type exports
export type {
  // Core types
  ParticleGPUData,
  GPUParticleSystemConfig,
  ParticleSystemState,
  ParticleEvent,
  ParticleEventHandler,
  ParticleEventType,

  // Emitter types
  EmitterShape,
  EmitterShapeConfig,
  EmitterConfig,

  // Force field types
  ForceFieldType,
  ForceFieldConfig,

  // Behavior types
  FlockingConfig,
  AvoidanceConfig,
  PathFollowConfig,

  // Sub-emitter types
  SubEmitterTrigger,
  SubEmitterConfig,

  // Rendering types
  ParticleRenderMode,
  ParticleTextureConfig,
  ParticleShadowConfig,
  ParticleLightingConfig,
  RenderConfig,

  // Modulation types
  ModulationCurve,
  LifetimeModulation,

  // Audio types
  AudioFeature,
  AudioBinding,
} from './types';
