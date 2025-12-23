# TEST COVERAGE MAP

**Weyl Compositor - Test Suite Documentation**

**Last Updated:** December 23, 2025

---

## Overview

| Metric | Value |
|--------|-------|
| **Test Framework** | Vitest |
| **Total Test Files** | 48 |
| **Tests Passing** | 1777 |
| **Tests Skipped** | 9 |
| **Total Tests** | 1786 |
| **Pass Rate** | 99.5% |

---

## Test File Index

### Engine Tests (7 files)

| Test File | Purpose |
|-----------|---------|
| `AnimatedSpline.test.ts` | Spline animation and interpolation |
| `EasingFunctions.test.ts` | All 35 easing function accuracy |
| `KeyframeEvaluator.test.ts` | Keyframe interpolation logic |
| `MotionEngine.test.ts` | Core frame evaluation (determinism) |
| `ParticleSimulationController.test.ts` | Particle checkpoint system |
| `PathLayer.test.ts` | Path layer evaluation |
| `TextLayerAnimatorIntegration.test.ts` | Text animator integration |

### Integration Tests (4 files)

| Test File | Purpose |
|-----------|---------|
| `effectWorkflows.test.ts` | Effect stack processing |
| `pathAnimation.test.ts` | Path-based animation |
| `realWorkflows.test.ts` | End-to-end workflow tests |
| `ScrubDeterminism.test.ts` | Scrub order independence |

### Service Tests (34 files)

| Test File | Purpose |
|-----------|---------|
| `audioFeatures.test.ts` | FFT, beat detection, BPM analysis |
| `audioReactiveMapping.test.ts` | Audio-to-property mapping |
| `cameraEnhancements.test.ts` | Camera shake, DOF, rack focus |
| `cameraTrajectory.test.ts` | 22 camera trajectory presets |
| `cinematicBloom.test.ts` | Cinematic bloom effect |
| `depthflow.test.ts` | 2.5D parallax system |
| `displacementEffects.test.ts` | Displacement map effects |
| `easing.test.ts` | Easing function library |
| `effectProcessor.test.ts` | Effect pipeline processing |
| `essentialGraphics.test.ts` | Essential graphics panel |
| `expressions.test.ts` | Expression language evaluation |
| `frameCache.test.ts` | LRU frame caching |
| `gaussianSplatting.test.ts` | 3D Gaussian splatting |
| `interpolation.test.ts` | Keyframe interpolation |
| `layerEvaluationCache.test.ts` | Property evaluation cache |
| `layerStyles.test.ts` | Layer styles (drop shadow, glow, etc.) |
| `matteExporter.test.ts` | Matte sequence export |
| `meshDeformation3D.test.ts` | 3D mesh deformation |
| `meshParticleManager.test.ts` | Mesh-based particles |
| `meshWarpDeformation.test.ts` | 2D mesh warp |
| `motionBlur.test.ts` | Motion blur post-process |
| `onionSkinning.test.ts` | Onion skin preview |
| `particleSystem.test.ts` | Deterministic particle simulation |
| `pathMorphing.test.ts` | Path morphing between shapes |
| `poseExport.test.ts` | OpenPose skeleton export |
| `propertyDriver.test.ts` | PropertyLink system |
| `spriteSheet.test.ts` | Sprite animation |
| `svgExport.test.ts` | SVG export service |
| `svgExtrusion.test.ts` | SVG to 3D mesh |
| `textAnimator.test.ts` | Text animation system |
| `textToVector.test.ts` | Text vectorization |
| `timeManipulation.test.ts` | Time stretch, freeze, reverse |
| `vaceControlExport.test.ts` | VACE control export |
| `webgpuRenderer.test.ts` | WebGPU rendering |

### Store Tests (3 files)

| Test File | Purpose |
|-----------|---------|
| `historyStore.test.ts` | Undo/redo functionality |
| `playbackStore.test.ts` | Playback state management |
| `selectionStore.test.ts` | Selection state management |

---

## Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Engine** | 7 | Core evaluation, determinism |
| **Integration** | 4 | End-to-end workflows |
| **Services** | 34 | Business logic |
| **Stores** | 3 | State management |

---

## Running Tests

```bash
# Run all tests
cd ui && npm test

# Run with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- audioFeatures.test.ts

# Run tests matching pattern
npm test -- --grep "particle"

# Watch mode
npm test -- --watch
```

---

## Key Test Assertions

### Determinism Tests
- Frame evaluation produces identical results regardless of scrub order
- Particle positions are reproducible with SeededRandom
- Audio analysis is frame-independent

### Performance Tests
- Frame cache hit rate > 80%
- Interpolation < 1ms per property
- Particle simulation < 16ms for 10k particles

---

*Generated: December 23, 2025*
