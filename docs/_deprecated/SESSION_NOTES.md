# Weyl Compositor - Session Notes

**Last Updated:** December 20, 2025
**Purpose:** Detailed changelog of all development sessions for knowledge transfer

---

## Session: December 20, 2025 (Final Documentation Handoff)

### Objective
Comprehensive documentation update to ensure zero ambiguity for the next Claude Code session. Full UI migration to match mockup design system.

### Changes Made

#### 1. UI Color Migration (Phase 9)

**Problem:** UI was using old blue-tinted colors (`#1a1a2e`) instead of the design system's void black (`#050505`).

**Files Modified:**
- `ui/src/types/project.ts` - Changed default `backgroundColor` from `#1a1a2e` to `#050505`
- `ui/src/stores/compositorStore.ts` - Two locations updated (getter and createDefaultSettings)
- `ui/src/components/canvas/ThreeCanvas.vue` - Engine config backgroundColor fallback
- `ui/src/components/panels/ExportPanel.vue` - Preview canvas fillStyle and gradient
- `web/js/extension.js` - Root container background color
- `ui/src/engine/WeylEngine.ts` - JSDoc comment example

**Design System Colors (from mockups):**
```css
--weyl-void: #050505;        /* App background */
--weyl-surface-0: #0A0A0A;   /* Canvas */
--weyl-surface-1: #121212;   /* Panels */
--weyl-surface-2: #1A1A1A;   /* Cards */
--weyl-surface-3: #222222;   /* Dropdowns */
--weyl-accent: #8B5CF6;      /* Purple */
--weyl-accent-secondary: #EC4899;  /* Pink */
```

#### 2. File Cleanup (Phase 10)

**Deleted Files:**
- `Changes-12-15.md` - Old changelog (superseded by SESSION_NOTES.md)
- `repomix-output.xml` - 4.9MB generated file
- `_archive/` folder - Entire directory with old code
- `specs/SPEC_04_FABRIC.md` - Fabric.js spec (Fabric.js replaced by Three.js)

**Why Deleted:**
- Reduces confusion for future sessions
- Removes outdated information that could mislead developers
- Cleans up repository size

#### 3. Documentation Updates

**CLAUDE.md (v5.1 → v6.0):**
- Added comprehensive UI Design System section with all CSS variables
- Added Known Issues table with critical bugs
- Added Recently Fixed section
- Updated color reference quick guide

**HANDOFF.md (v5.1 → v6.0):**
- Added "CRITICAL: READ THIS SECTION FIRST" at top
- Added Known Broken Features table
- Added Session Changes section
- Updated spec document list (removed SPEC_04_FABRIC.md)

**New File: docs/DESIGN_SYSTEM.md:**
- Complete design token reference
- Color, spacing, typography, shadow tokens
- Component patterns (Panel, Button, Input)
- Semantic keyframe shape reference
- Migration notes for deprecated colors

**New File: SESSION_NOTES.md (this file):**
- Detailed changelog for all sessions
- What was attempted, what worked, what didn't
- Warnings for future sessions

---

## Session: December 19, 2025 (3D System and Particle Overhaul)

### Commit: 08efce1

### Major Changes

1. **MotionEngine.ts** - New pure frame evaluation engine
   - Single source of truth for all frame state
   - `evaluate(frame, project, audio) → FrameState`
   - Deterministic, immutable output

2. **ParticleSimulationController.ts** - Checkpoint-based particle system
   - Saves checkpoint every 30 frames
   - Restores RNG state for scrub-safe playback
   - Uses Mulberry32 seeded RNG

3. **3D Camera System Improvements**
   - Fixed layer centering (anchor 0,0, position comp center)
   - 22 camera trajectory presets working
   - Orbit controls with pan/zoom

4. **PropertyTrack Alignment Fix**
   - Changed from absolute positioning to flexbox
   - Fixed keyframe diamond alignment issues

---

## Session: December 18, 2025 (Sprint 2)

### Commit: e7044be

### Changes

1. **Store Refactoring**
   - Split compositorStore into modular sub-stores
   - playbackStore, selectionStore, historyStore, audioStore, themeStore
   - compositorStore delegates to sub-stores

2. **Testing Infrastructure**
   - Fixed all TypeScript errors in test files
   - Deleted obsolete tests (puppetDeformation, vectorLOD)
   - Rewrote tests for actual API (svgExport, textToVector)

3. **Performance Optimizations**
   - historyStore now uses structuredClone() instead of JSON
   - frameCache uses O(1) doubly-linked list LRU

---

## Session: December 17, 2025 (Audio Reactivity)

### Commits: 19da64e, 9b2a1a3

### Changes

1. **Enhanced Audio Reactivity**
   - Beat detection algorithm
   - Frequency band analysis (bass, mid, high)
   - Audio-to-property mapping system

2. **Layer Animation Gap Fix**
   - Fixed issue where layers didn't animate between keyframes

---

## Session: December 16, 2025 (Keyframe Selection)

### Commit: 15f1a27

### Changes

1. **Keyframe Box-Select (Marquee Selection)**
   - Draw rectangle to select multiple keyframes
   - Shift+click for additive selection

---

## Known Issues (As of December 20, 2025)

### Critical (Blocking)

| Issue | Description | Workaround |
|-------|-------------|------------|
| **Three.js Multi-Instance** | Other ComfyUI extensions load their own Three.js, causing `Mesh is not a constructor` | try-catch in SceneManager |
| **ScrubableNumber Broken** | Drag-to-adjust number inputs don't respond | Manual input only |
| **Project Panel Drag** | Can't drag items from project panel to timeline | Use add layer buttons |
| **Upper-Left Viewport Controls** | Render mode/transform mode buttons non-functional | No workaround |

### Medium (UX Impact)

| Issue | Description |
|-------|-------------|
| **Video Encoder** | Export to video throws "not implemented" |
| **Depth/Normal Map UI** | Workflow unclear to users |

### Fixed This Session

| Issue | Fix |
|-------|-----|
| **Background Colors** | Changed from `#1a1a2e` to `#050505` |

---

## Warnings for Future Sessions

### Do Not Change

1. **SeededRandom class** - The Mulberry32 algorithm is carefully chosen for determinism
2. **Checkpoint interval (30 frames)** - Changing this breaks scrub-safe playback
3. **Design tokens** - Always use CSS variables, never hardcode colors
4. **Layer anchor point (0,0)** - Changing breaks existing compositions

### Be Careful With

1. **compositorStore.ts** - Very large file (90KB), easy to break things
2. **WeylEngine.ts** - Core rendering, changes affect everything
3. **Three.js imports** - ComfyUI may have conflicting Three.js versions

### Known Traps

1. **`#1a1a2e` vs `#050505`** - The old blue color was scattered everywhere. Search carefully if adding new components.
2. **Fabric.js references** - SPEC_04_FABRIC.md deleted but some docs may still reference Fabric.js. We use Three.js now.
3. **Test mocks** - Test files use incomplete mocks. Check actual service API before writing tests.

---

## Architecture Decisions

### Why Three.js over Fabric.js?
- Better 3D support
- GPU acceleration
- Native particle rendering
- Consistent with ComfyUI ecosystem

### Why Pinia over Vuex?
- Simpler API
- Better TypeScript support
- Composition API friendly

### Why Mulberry32 RNG?
- Fast (important for particles)
- Deterministic from seed
- Well-tested algorithm

### Why 30-frame checkpoints?
- Balance between memory and scrub speed
- Max 30 frames to simulate on scrub
- ~1-2 second simulation time worst case

---

## File Reference

### Most Important Files

| File | Purpose | Size |
|------|---------|------|
| `CLAUDE.md` | Primary developer guide | 50KB |
| `HANDOFF.md` | Detailed knowledge transfer | 40KB |
| `docs/DESIGN_SYSTEM.md` | UI design tokens | 8KB |
| `compositorStore.ts` | Main state management | 90KB |
| `WeylEngine.ts` | Rendering engine | 60KB |
| `MotionEngine.ts` | Frame evaluation | 20KB |
| `particleSystem.ts` | Particle simulation | 76KB |

### File Locations Quick Reference

```
CLAUDE.md                    # Start here
HANDOFF.md                   # Then here
docs/DESIGN_SYSTEM.md        # UI colors/tokens
ui/src/stores/               # All Pinia stores
ui/src/engine/               # Three.js engine
ui/src/services/             # Business logic
ui/src/components/           # Vue components
web/js/extension.js          # ComfyUI entry
```

---

**Document Created:** December 20, 2025
**Last Session:** Final Documentation Handoff
