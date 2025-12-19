/**
 * @deprecated This file is deprecated. Import from './meshWarp' instead.
 *
 * This file re-exports all types from meshWarp.ts for backwards compatibility.
 * The "Puppet" naming has been replaced with "Mesh Warp" / "Warp" terminology.
 */

export * from './meshWarp';

// Re-export the deprecated aliases as primary exports for backwards compat
export {
  type PuppetPin,
  type PuppetMesh,
  type PinType,
  type PinRestState,
  type DeformationResult,
  type WeightMethod,
  type WeightOptions,
  DEFAULT_WEIGHT_OPTIONS,
  createDefaultPuppetPin,
  createEmptyPuppetMesh,
} from './meshWarp';
