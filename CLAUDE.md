# CLAUDE.md - WEYL COMPOSITOR

**Version:** 4.0 | **Last Updated:** December 19, 2024

---

## EXECUTIVE SUMMARY

Weyl is an **After Effects-caliber motion graphics compositor** embedded as a ComfyUI extension. It enables spline drawing on depth maps, text animation along paths, particle systems, 3D camera control, and matte export for AI video generation workflows (Wan 2.1, etc.).

**Target Output**: 81 frames at 16fps (5.0625 seconds), dimensions divisible by 8.

---

## PROJECT METRICS

| Metric | Current | Notes |
|--------|---------|-------|
| **Total Lines of Code** | 128,114 | TypeScript + Vue |
| **Source Files** | 215 | .ts + .vue |
| **Test Files** | 29 | Vitest |
| **Tests Passing** | 1011/1055 (96%) | 1 timeout, 43 skipped (GPU/canvas) |
| **TypeScript Errors** | 26 | Test files (see HANDOFF.md Part 1) |
| **Services** | 42 | See docs/SERVICE_API_REFERENCE.md |
| **Vue Components** | 55 | See docs/COMPONENT_STORE_SERVICE_MAP.md |
| **Layer Types** | 17 | See Layer Types below |
| **Effects** | 22 | 4 categories |
| **Feature Completion** | 87% | See HANDOFF.md |

---

## BUILD COMMANDS

```bash
# Development
cd ui
npm install
npm run dev          # Dev server at localhost:5173

# Production
npm run build        # Outputs to web/js/

# Testing
npm test             # Run all tests
npm test -- --reporter=verbose

# Type Check
npx tsc --noEmit     # Shows 26 errors (test files)
```

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│  Vue 3.5 Components (55 total) + PrimeVue 4 UI Framework                   │
│  Canvas (4) | Controls (8) | Dialogs (5) | Panels (10) | Timeline (9)       │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STATE LAYER (Pinia 2.2)                          │
│  compositorStore (main) → playbackStore, selectionStore, historyStore       │
│  + assetStore, audioStore, uiStore                                          │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENGINE LAYER (Three.js r170)                      │
│  WeylEngine.ts (2400+ lines) | MotionEngine.ts | LayerManager.ts            │
│  17 Layer Types: Image, Video, Text, Spline, Particle, Camera, Light...    │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER (42 services)                       │
│  Animation (5) | Audio (4) | Camera/3D (5) | Particles (4) | Effects (6)   │
│  Geometry (5) | Caching (2) | Export (3) | Utilities (8)                    │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTEGRATION LAYER                                   │
│  ComfyUI Extension: web/js/extension.js | nodes/*.py                        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## KEY FILE LOCATIONS

### Core Engine
```
ui/src/engine/
├── WeylEngine.ts                # Main engine class (2400+ lines)
├── MotionEngine.ts              # Pure frame evaluation (TIME AUTHORITY)
├── core/
│   ├── CameraController.ts      # 3D camera controls
│   ├── LayerManager.ts          # Layer management
│   └── RenderPipeline.ts        # Render pass management
└── layers/                      # 17 layer implementations
    ├── BaseLayer.ts             # Abstract base class (54KB)
    ├── ImageLayer.ts
    ├── VideoLayer.ts
    ├── TextLayer.ts
    ├── SplineLayer.ts
    ├── ParticleLayer.ts
    ├── CameraLayer.ts
    ├── LightLayer.ts
    └── ... (10 more)
```

### State Management
```
ui/src/stores/
├── compositorStore.ts           # Main store (90KB)
├── playbackStore.ts             # Timeline playback
├── selectionStore.ts            # Selection state
├── historyStore.ts              # Undo/redo
├── audioStore.ts                # Audio playback
├── assetStore.ts                # Asset management
└── actions/                     # Extracted action modules
    ├── cameraActions.ts
    ├── layerActions.ts
    └── effectActions.ts
```

### Services (Top 10 by Size)
```
ui/src/services/
├── particleSystem.ts            # 76KB - CPU particle simulation
├── depthflow.ts                 # 47KB - 2.5D parallax
├── shapeOperations.ts           # 43KB - Path booleans
├── audioFeatures.ts             # 36KB - Audio analysis
├── expressions.ts               # 35KB - Expression language
├── modelExport.ts               # 34KB - 3D model export
├── propertyDriver.ts            # 25KB - Property linking
├── audioReactiveMapping.ts      # 22KB - Audio-to-property
├── interpolation.ts             # 21KB - Keyframe interp
└── motionBlur.ts                # 21KB - Motion blur
```

### Vue Components
```
ui/src/components/
├── canvas/                      # ThreeCanvas, SplineEditor, MaskEditor
├── controls/                    # AngleDial, ColorPicker, Pickwhip
├── dialogs/                     # ExportDialog, FontPicker
├── panels/                      # LayerPanel, EffectsPanel, AudioPanel
├── properties/                  # Per-layer-type property editors
├── timeline/                    # TimelinePanel, LayerTrack, GraphEditor
└── layout/                      # WorkspaceLayout (main container)
```

---

## LAYER TYPES (17 Total)

| Type | Completion | Key File |
|------|------------|----------|
| `image` | 100% | ImageLayer.ts |
| `solid` | 100% | SolidLayer.ts |
| `null` | 100% | NullLayer.ts |
| `text` | 95% | TextLayer.ts |
| `spline` | 95% | SplineLayer.ts |
| `camera` | 95% | CameraLayer.ts |
| `particle` | 90% | ParticleLayer.ts |
| `video` | 90% | VideoLayer.ts |
| `precomp` | 90% | PrecompLayer.ts |
| `light` | 90% | LightLayer.ts |
| `procedural_matte` | 85% | ProceduralMatteLayer.ts |
| `adjustment` | 85% | AdjustmentLayer.ts |
| `shape` | 80% | ShapeLayer.ts |
| `model` | 75% | ModelLayer.ts (USD placeholder) |
| `depthflow` | 70% | DepthflowLayer.ts |
| `point_cloud` | 60% | PointCloudLayer.ts (LAS placeholder) |

---

## CRITICAL LIBRARY NOTES

### Fabric.js 6.x (Historical - Now Three.js)
- Originally used Fabric.js, migrated to Three.js for 3D support
- **Uses ES6 classes**, NOT `createClass()` (removed in v6)

### Bezier.js
- `.get(t)`, `.derivative(t)`, `.length()`, `.project(point)` - all work
- **`.getPointAtDistance(d)` does NOT exist** - use `ui/src/services/arcLength.ts`

### Three.js r170
- WebGL2 renderer (WebGPU path incomplete)
- EffectComposer for post-processing
- Custom layer implementations extend Three.js Object3D

### troika-three-text
- Used for 3D text rendering
- Note: May not be fully deterministic across browsers (spec violation)

---

## DETERMINISM REQUIREMENTS (HYPER-CRITICAL)

For diffusion model compatibility and scrub-safe playback:

```typescript
// RULE 1: evaluate(frame) must return IDENTICAL results every call
const state1 = motionEngine.evaluate(frame, project);
const state2 = motionEngine.evaluate(frame, project);
// state1 must === state2 (deep equality)

// RULE 2: NO Math.random() in render path
// WRONG: const pos = Math.random() * 100;
// CORRECT: const rng = new SeededRandom(seed); const pos = rng.next() * 100;

// RULE 3: NO Date.now() in render path
// Only use for metrics/logging, never for animation values

// RULE 4: Seeded RNG for particles
// Using Mulberry32 algorithm (see particleSystem.ts)
```

### Particle Checkpointing
- Checkpoints saved every 30 frames
- Scrubbing to frame N loads checkpoint at floor(N/30)*30
- Simulates forward from checkpoint to N
- **This is why scrubbing works deterministically**

---

## DOCUMENTATION INDEX

### Root Directory
| Document | Size | Purpose |
|----------|------|---------|
| `CLAUDE.md` | 12KB | **THIS FILE** - Primary instructions |
| `HANDOFF.md` | 38KB | Complete knowledge transfer (20 parts) |
| `README.md` | 12KB | Project overview (Maps/Masks/Mattes) |
| `PROJECT_STATUS.md` | 10KB | Status summary |

### /docs/ Directory (38 files)
| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | System architecture diagrams |
| `DOCS_REVIEW.md` | Spec compliance review |
| `SERVICE_API_REFERENCE.md` | Service API index |
| `SERVICE_API_ANIMATION.md` | Interpolation, easing, expressions |
| `SERVICE_API_AUDIO.md` | Audio analysis, reactive mapping |
| `SERVICE_API_CAMERA_3D.md` | 3D math, trajectories |
| `SERVICE_API_PARTICLE.md` | Particle system |
| `SERVICE_API_EFFECT.md` | Effect processor |
| `SERVICE_API_EXPORT.md` | Export pipeline |
| `SERVICE_API_CACHE.md` | Frame/layer caching |
| `EFFECT_PARAMETERS.md` | Effect parameters |
| `COMPONENT_STORE_SERVICE_MAP.md` | Component dependencies |
| `TEST_COVERAGE_MAP.md` | Test coverage |
| `DEBUG_TROUBLESHOOTING.md` | Common issues |
| `GLOSSARY.md` | 150+ term definitions |
| `00_MASTER_GROUND_TRUTH.md` | Core requirements |
| `01_TYPE_DEFINITIONS.md` - `16_*.md` | Detailed specs |

### /specs/ Directory (8 files)
| Document | Purpose |
|----------|---------|
| `SPEC_01_FOUNDATION.md` | Requirements, architecture |
| `SPEC_02_TYPES.md` | TypeScript definitions |
| `SPEC_03_COMFYUI.md` | ComfyUI integration |
| `SPEC_05_SERVICES.md` | Core services |
| `SPEC_06_UI.md` | Vue components |
| `SPEC_08_PARTICLE_SYSTEM.md` | Particle system (with Vue code) |

### /ui/ Directory
| Document | Purpose |
|----------|---------|
| `AFTER_EFFECTS_FEATURES_REFERENCE.md` | AE feature comparison |
| `FEATURE_ROADMAP.md` | Future enhancements |

---

## READING ORDER FOR NEW SESSIONS

1. **This file** (`CLAUDE.md`) - Quick overview
2. **HANDOFF.md** - Comprehensive knowledge transfer
3. **docs/DOCS_REVIEW.md** - Spec compliance status
4. **docs/ARCHITECTURE.md** - System diagrams
5. **Specific docs as needed** for your task

---

## WHAT WORKS (Production Ready)

- Full timeline with keyframe animation (Bezier curves, easing)
- 17 layer types including particles, 3D models, point clouds
- Audio reactivity system with beat detection
- Spline/path editing with text-on-path
- 3D camera with 22 trajectory presets and DOF
- Depthflow 2.5D parallax
- Effects pipeline (blur, color correction, distort, generate)
- Export to matte sequences (PNG)
- Deterministic particle simulation (scrub-safe)
- ComfyUI integration nodes
- Property drivers (pickwhip-style linking)

## WHAT'S INCOMPLETE

- Particle UI only exposes ~40% of backend features
- LAS/LAZ point cloud parsing (placeholder)
- USD/USDZ model loading (placeholder)
- Boolean shape operations (simplified)
- Preset save/load system
- Text animator UI incomplete
- Missing keyboard shortcuts (Delete, Ctrl+C/V)
- Accessibility (0 ARIA attributes)

---

## CURRENT ISSUES

### TypeScript Errors (26 total)
All in test files. See HANDOFF.md Part 1 for specific fixes:
- Missing `category` on EffectInstance
- Missing `controlMode` on Keyframes
- Wrong import for ControlPoint type

### Security Issues (6 total)
- API keys in client code (MotionIntentResolver.ts)
- File extension-only validation
- Unsanitized font URLs
See HANDOFF.md Part 2.

### Performance Issues (5 critical)
- JSON.parse/stringify for history (use structuredClone)
- O(n) LRU cache removal (use Set + LinkedList)
See HANDOFF.md Part 3.

---

## QUICK REFERENCE: COMMON TASKS

| Task | Files to Modify |
|------|-----------------|
| Add new layer type | `engine/layers/`, `stores/compositorStore.ts` |
| Add new effect | `services/effects/`, `services/effectProcessor.ts` |
| Modify animation | `services/interpolation.ts`, `services/easing.ts` |
| Change UI layout | `components/layout/WorkspaceLayout.vue` |
| Add keyboard shortcut | `components/layout/WorkspaceLayout.vue` |
| Modify timeline | `components/timeline/TimelinePanel.vue` |
| Change camera behavior | `engine/core/CameraController.ts` |
| Add export format | `services/matteExporter.ts`, `services/modelExport.ts` |
| Modify particle system | `services/particleSystem.ts`, `engine/particles/` |

---

## COMFYUI INTEGRATION

```
web/js/
├── extension.js               # Sidebar registration
├── weyl-compositor.js         # Main bundle
├── weyl-compositor.css        # Styles
├── weyl-three-vendor.js       # Three.js
├── weyl-vue-vendor.js         # Vue
└── worker-audioWorker.js      # Audio worker

nodes/
├── __init__.py                # Node registration
└── compositor_node.py         # Compositor node
```

Routes: `/weyl/compositor/*`

---

## OUTPUT RULES (Non-Negotiable)

1. **Full File Content**: Never output `// ... existing code`. Always complete files.
2. **Check Your Math**: Verify width calculations include `pixelsPerFrame`
3. **Test Before Commit**: `npm test && npx tsc --noEmit` should pass
4. **No Screenshots Outside Repo**: Only check `/screenshots/`, `/reference_images/`
5. **Determinism First**: Any animation/evaluation code must be deterministic

---

## GIT STATUS (Snapshot)

```
Branch: master

Modified (uncommitted):
  - ui/src/engine/WeylEngine.ts
  - ui/src/engine/core/CameraController.ts
  - ui/src/engine/core/LayerManager.ts
  - ui/src/engine/layers/BaseLayer.ts
  - ui/src/services/audioFeatures.ts
  - ui/src/services/effects/blurRenderer.ts
  - ui/src/services/interpolation.ts
  - ui/src/services/particleSystem.ts
  - ui/src/stores/compositorStore.ts
  - web/js/weyl-compositor.js

Untracked:
  - ui/src/engine/MotionEngine.ts
  - ui/src/engine/ParticleSimulationController.ts
  - ui/src/__tests__/engine/*.test.ts

Recent commits:
  08efce1 3D System and Particle Overhaul
  e7044be Sprint 2: Store refactoring, testing
  5e19f17 Documentation: Split SERVICE_API_REFERENCE.md
```

---

## TECH STACK SUMMARY

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Vue | 3.5.x |
| State | Pinia | 2.2.x |
| UI Components | PrimeVue | 4.2.x |
| 3D Rendering | Three.js | r170 |
| Build | Vite | 5.x |
| Testing | Vitest | 1.x |
| Language | TypeScript | 5.x |
| Curves | Bezier.js | 6.1.x |
| Text | troika-three-text | 0.52.x |
| Noise | simplex-noise | 4.0.x |

---

## CONTACT & PURPOSE

This project is for the **open source ComfyUI community**. The goal is professional-grade motion graphics capabilities accessible to everyone.

**Repository**: `/mnt/c/Users/justi/Desktop/Compositor`

---

**Document Version:** 4.0 | **December 19, 2024**
