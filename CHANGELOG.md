# Changelog

All notable changes to Lattice Compositor are documented in this file.

---

## [Unreleased]

### Documentation (December 24, 2025)
- Comprehensive codebase audit completed
- Corrected Project Metrics: 267,121 lines (was 236,000), 493 files (was 286), 146 components (was 112)
- Removed 3 non-existent file references from CLAUDE.md
- Added Large Files section documenting 19 files >1500 lines needing splitting
- Verified all 24 layer types properly registered in LayerManager
- Verified all 160 services properly exported from index.ts
- Confirmed 1,777 tests passing with 0 failures

### Added
- Camera tracking import (COLMAP, Blender, Uni3C formats)
- AI camera motion analysis (VLM-based detection of 20 motion primitives)
- Sapiens integration (Meta AI human depth/pose/segmentation)
- Shadow catcher material for 3D compositing
- Phosphor Icons integration (replacing emoji icons)
- 6 gradient themes (Violet, Ocean, Sunset, Forest, Ember, Mono)
- 16 semantic keyframe shapes for visual easing recognition
- Expression system enhancements (vector math, coordinate conversion)
- Time manipulation features (time stretch, reverse, freeze frame, timewarp)
- Speed ramp presets (slow-fast, fast-slow, impact, rewind)
- Pixel motion optical flow interpolation

### Changed
- UI overhaul: darker backgrounds, larger toolbar, thicker text
- WorkspaceLayout refactored: extracted keyboard shortcuts composable
- File size reduction: WorkspaceLayout.vue 3840→1835 lines (52%)
- Stacked CollapsiblePanels in right sidebar
- Removed redundant Export panel

### Fixed
- ScrubableNumber inputs now fully functional
- Project Panel drag-drop working correctly
- Upper-left viewport controls connected
- Three.js multi-instance conflicts mitigated

---

## [1.0.0] - December 2025

### Core Features
- 25 layer types (image, video, text, spline, particle, camera, etc.)
- 35 easing functions
- 22 camera trajectory presets
- 24 particle presets
- Full expression system (jitter, repeatAfter, bounce, inertia, elastic)
- Audio reactivity with beat detection and BPM analysis
- 22 effects (blur, color correction, distort, generate)

### Animation System
- Keyframe animation with bezier interpolation
- Graph editor with handle editing
- Property linking (pickwhip-style)
- Multi-keyframe selection and manipulation

### Particle System
- Deterministic simulation with seeded RNG
- 7 emitter shapes (point, line, circle, box, sphere, ring, spline)
- Physics: gravity, wind, turbulence, vortices
- Collision detection
- Sub-emitters
- GPU instancing

### 3D System
- Perspective/orthographic cameras
- Depth of field
- 22 trajectory presets
- Motion path visualization
- 3D model import (glTF, OBJ, FBX)
- Point cloud support (PLY, PCD, LAS)

### Audio System
- FFT analysis (amplitude, bass, mid, high)
- Beat detection
- BPM estimation
- Audio-to-property mapping

### Export
- PNG/JPEG/WebP sequences
- MP4/WebM video
- GIF animation
- Camera data (JSON)
- Depth/normal maps
- ComfyUI workflow integration

### UI/UX
- Floating panel architecture
- Dark theme (#050505 void background)
- Design tokens system
- 85+ keyboard shortcuts
- Context menus for layers and keyframes

### Infrastructure
- GPU effects pipeline
- Text system (OpenType.js)
- Shape booleans (Paper.js)
- Video frame accuracy (WebCodecs)
- Render queue with pause/resume
- Color management (ICC profiles)
- Audio waveform display
- Plugin API
- Project versioning with migrations

### Trade Dress Compliance
- Renamed: Pickwhip → PropertyLink
- Renamed: Graph Editor → CurveEditor
- Renamed: Anchor Point → Origin
- Renamed: Time Remap → SpeedMap
- Renamed: Work Area → Render Range
- Renamed: loopOut/loopIn → repeatAfter/repeatBefore

---

## Development Stats (Verified December 24, 2025)

| Metric | Value |
|--------|-------|
| Lines of Code | 267,121 |
| TypeScript/Vue Files | 493 |
| Vue Components | 146 |
| Service Files | 160 |
| Store Actions | 251+ |
| Test Files | 49 |
| Tests Passing | 1,777 |

---

*For detailed development notes, see `docs/_deprecated/HANDOFF.md`*
