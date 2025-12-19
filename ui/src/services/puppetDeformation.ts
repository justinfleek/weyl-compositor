/**
 * @deprecated This file is deprecated. Import from './meshWarpDeformation' instead.
 *
 * This file re-exports all exports from meshWarpDeformation.ts for backwards compatibility.
 * The "Puppet" naming has been replaced with "Mesh Warp" / "Warp" terminology.
 */

export * from './meshWarpDeformation';

// Re-export the main service with the old name
export {
  MeshWarpDeformationService as PuppetDeformationService,
  meshWarpDeformation as puppetDeformation,
  delaunayTriangulate,
  calculateWeights,
  deformMesh,
} from './meshWarpDeformation';

export { meshWarpDeformation as default } from './meshWarpDeformation';
