# CLAUDE.md

## PROTOCOL: SYSTEM RESET & HANDOVER

### 1. THE MISSION
Building a pixel-perfect Adobe After Effects Clone for ComfyUI using Vue 3. I am the "Human in the Loop" managing Claude Code (an autonomous CLI agent). You are the Lead Architect.

### 2. THE CURRENT ARCHITECTURE

**Framework**: Vue 3 + TypeScript + Pinia Store + Three.js

**Timeline Logic**: We recently refactored from a percentage-based system to a `pixelsPerFrame` system to support true zooming.

**Layout**: Split-Pane architecture:
- **Left Pane (Sidebar)**: Layer Names, Icons, Properties, and Values
- **Right Pane (Track)**: Duration Bars, Keyframe Diamonds, and Time Ruler

**Scroll Sync**: Parent container handles vertical scrolling to keep Left and Right panes aligned.

---

## 3. BUILD COMMANDS

```bash
cd ui
npm install
npm run dev          # Development server
npm run build        # Production build (outputs to web/js/)
npm test             # Run Vitest tests (851 passing)
npx tsc --noEmit     # Type check (0 errors)
```

---

## 4. RECENT WORK (Last 24-48 Hours)

### 4.1 Expression System (`ui/src/services/expressions.ts`) - 1288 lines
Complete After Effects-style expression engine:
- **Easing**: All Penner functions (Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce)
- **Cubic Bezier**: With Newton-Raphson solving
- **Motion**: `inertia()`, `bounce()`, `elastic()`
- **Loops**: `loopIn()`, `loopOut()` with cycle/pingpong/offset/continue modes
- **Wiggle**: `wiggle()`, `temporalWiggle()` with octaves
- **Time**: timeRamp, periodic, sawtooth, triangle, square, sine, pulse
- **Math**: lerp, clamp, map, smoothstep, smootherstep, seedRandom
- **Presets**: Named expression presets (inertiaLight, bounceGentle, wiggleSubtle, etc.)

### 4.2 View Options Toolbar (`ui/src/components/viewport/ViewOptionsToolbar.vue`)
Viewport control toolbar with:
- Grid/Axes/Rulers/Bounds toggles
- Layer handles and paths toggles
- Camera wireframe display modes (never/selected/always)
- View presets (Front, Right, Top, Camera)
- Reset view and focus selected buttons

### 4.3 Store Actions Refactoring (`ui/src/stores/actions/`)
Started decomposing the monolithic compositorStore (5000+ lines):
- `cameraActions.ts` (7.8KB) - Camera CRUD, keyframes, interpolation
- `effectActions.ts` (4.8KB) - Effect management
- `segmentationActions.ts` (7.3KB) - SAM2/vision model integration
- `index.ts` - Barrel exports

### 4.4 Camera System (`ui/src/engine/core/CameraController.ts`)
Enhanced 3D camera with:
- Orbit, pan, dolly controls
- DOF (depth of field) support
- SSAO integration
- View preset support (front/right/top/custom)

### 4.5 Service Exports Fix (`ui/src/services/index.ts`)
Complete rewrite to match actual module exports (was causing 100+ TypeScript errors)

### 4.6 Test Infrastructure (`ui/src/__tests__/setup.ts`)
Browser API mocks for Node.js test environment:
- MockImageData, MockOffscreenCanvas
- mockCreateImageBitmap, mockRequestAnimationFrame
- Test utilities: createTestImageData, createTestCanvas

---

## 5. THE CRITICAL BUGS (Current Focus)

### Bug A (The Bleed)
Inputs from the Sidebar are visually rendering inside the Timeline Track area. `PropertyTrack.vue` is failing to respect the `layoutMode` split.

### Bug B (Playhead Desync)
The playhead triangle (in ruler) and the red line (in track) are disconnected or moving at different rates.

### Bug C (UX Failures)
- Twirl-down arrows misaligned/floating
- Font sizes too small (need 14px/16px)
- Missing columns: "Mode", "TrkMat", "Parent"
- "+ Layer" menu floats in wrong place

---

## 6. KEY FILE LOCATIONS

### Timeline Components (5 Core Files)
```
ui/src/components/timeline/
├── TimelinePanel.vue       # Layout Controller (split-pane)
├── EnhancedLayerTrack.vue  # Layer Row Router
├── PropertyTrack.vue       # Property Row Renderer
├── GraphEditorCanvas.vue   # Graph Mode Logic
└── Playhead.vue            # Playhead component
```

### Store
```
ui/src/stores/
├── compositorStore.ts      # Main store (~5000 lines)
└── actions/                # Extracted action modules
    ├── cameraActions.ts
    ├── effectActions.ts
    └── segmentationActions.ts
```

### Engine
```
ui/src/engine/
├── WeylEngine.ts           # Main facade
├── MotionEngine.ts         # Pure frame evaluation (TIME AUTHORITY)
├── core/
│   ├── CameraController.ts
│   ├── LayerManager.ts
│   ├── RenderPipeline.ts
│   └── SceneManager.ts
└── layers/                 # Layer type implementations
```

### Services (32 total)
```
ui/src/services/
├── expressions.ts          # NEW - Expression system
├── interpolation.ts        # Keyframe interpolation
├── easing.ts              # Penner easing functions
├── particleSystem.ts       # CPU particles (has determinism issue)
├── audioFeatures.ts        # Web Worker audio analysis
├── motionBlur.ts          # Multi-type motion blur
└── ... 26 more
```

---

## 7. ARCHITECTURE RULES

### MotionEngine is Time Authority
```typescript
// CORRECT
const frameState = motionEngine.evaluate(frame, project, audioAnalysis);
engine.applyFrameState(frameState);

// DEPRECATED - bypasses MotionEngine
engine.setFrame(frame);
```

### layoutMode Must Be Respected
```vue
<!-- Sidebar: Show inputs -->
<div v-if="layoutMode === 'sidebar'" class="prop-sidebar">
  <input ... />
</div>

<!-- Track: Show keyframes ONLY -->
<div v-else class="prop-track">
  <KeyframeDiamond ... />
</div>
```

### pixelsPerFrame System
```typescript
const playheadPosition = currentFrame * pixelsPerFrame;
const barLeft = layer.inPoint * pixelsPerFrame;
const barWidth = (layer.outPoint - layer.inPoint + 1) * pixelsPerFrame;
```

---

## 8. CURRENT PROJECT STATUS

| Metric | Value |
|--------|-------|
| Tests | 851 passing |
| TypeScript Errors | 0 |
| Services | 32 |
| Vue Components | 45 |
| Layer Types Working | 10/13 |

### What's Working
- Expression system (complete)
- All 32 services properly exported
- MotionEngine (pure frame evaluation)
- Camera system with store integration
- Audio analysis (Web Worker)
- Motion blur processor
- Effect processor

### P0 Bugs (Blocking)
1. Timeline input bleed (Bug A)
2. Playhead desync (Bug B)
3. Particle Math.random() determinism

### P1 Remaining
4. Keyframe dragging (selection only, no movement)
5. Delete layer UI button
6. Graph editor handle dragging

---

## 9. OUTPUT RULES (Non-Negotiable)

1. **Agent-Ready Specs**: Frame solutions as "Instructions for Claude Code"
2. **Zero Abbreviations**: Never output `// ... existing code`. Full, complete file content.
3. **Check Your Math**: Verify width calculations include `pixelsPerFrame` logic
4. **Test Before Commit**: `npm test && npx tsc --noEmit` must pass

---

## 10. SCREENSHOTS & REFERENCE IMAGES

**IMPORTANT**: When looking for screenshots or reference images, ONLY check this repository's folders:
- `/screenshots/` - Bug reports and current state screenshots
- `/reference_images/` - After Effects UI reference images
- `/screenshots/ground-truths/` - Expected UI appearance

**NEVER** search in ~/Downloads, ~/Desktop, /tmp, or other system folders for screenshots.

---

## 11. DETERMINISM REQUIREMENTS

For diffusion model compatibility:
- `evaluate(frame)` must return identical results every call
- No `Math.random()` in render path (only for ID generation)
- No `Date.now()` in render path (only for metrics)
- Particle system must use seeded PRNG

**Current Violation**: `particleSystem.ts:1196,1212,1219-1220` uses `Math.random()` in spawn positions
