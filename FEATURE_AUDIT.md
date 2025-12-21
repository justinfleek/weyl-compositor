# WEYL COMPOSITOR - FEATURE & UI AUDIT

**Last Updated:** December 21, 2025

This document maps all implemented features to their UI access points.
Features marked with **NO UI** are implemented but inaccessible to users.

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ | Full UI access |
| ⚠️ | Partial UI / Missing some access |
| ❌ | NO UI - Feature exists but is hidden |
| 🎹 | Keyboard shortcut available |
| 🖱️ | Mouse/click interaction |
| 📋 | Menu item |
| 🎚️ | Panel control (slider, input, etc.) |

---

## 1. LAYER MANAGEMENT

### Create Layer Types (17 total)

| Layer Type | UI Access | Icon | Location |
|------------|-----------|------|----------|
| Image | ✅ 📋 | 🖼️ | Create menu → Image |
| Video | ✅ 📋 | 🎬 | Create menu → Video |
| Solid | ✅ 📋 | ⬛ | Create menu → Solid |
| Text | ✅ 📋 🎹 `T key` | T | Create menu → Text |
| Spline/Shape | ✅ 📋 🎹 `P key` | ✒ | Create menu → Shape |
| Null/Control | ✅ 📋 | ⊕ | Create menu → Control |
| Camera | ✅ 📋 | 📷 | Create menu → Camera |
| Light | ✅ 📋 | 💡 | Create menu → Light |
| Particle | ✅ 📋 | ✨ | Create menu → Particle |
| Precomp/Nested | ✅ 📋 🎹 `Ctrl+Shift+C` | 📦 | Create menu → Nested Comp |
| Adjustment/Effect | ✅ 📋 | 🔧 | Create menu → Effect Layer |
| Audio | ✅ 📋 | 🔊 | Create menu → Audio |
| Procedural Matte | ✅ 📋 | 🎭 | Create menu → Procedural Matte |
| Depth | ✅ 📋 | 📊 | Create menu → Depth |
| Normal | ✅ 📋 | 🧭 | Create menu → Normal |
| Generated | ✅ 📋 | 🤖 | Create menu → Generated |
| Group | ✅ 📋 | 📁 | Create menu → Group |
| Path | ✅ 📋 | 〰️ | Create menu → Path |
| Model (3D) | ✅ 📋 | 🎲 | Create menu → 3D Model |

### Layer Operations

| Operation | UI Access | Shortcut | Location |
|-----------|-----------|----------|----------|
| Delete Layer | ✅ 🎹 | `Delete`/`Backspace` | Timeline right-click |
| Duplicate Layer | ✅ 🎹 | `Ctrl+D` | Edit menu |
| Copy Layer | ✅ 🎹 | `Ctrl+C` | Edit menu |
| Paste Layer | ✅ 🎹 | `Ctrl+V` | Edit menu |
| Cut Layer | ✅ 🎹 | `Ctrl+X` | Edit menu |
| Rename Layer | ✅ 🖱️ | Double-click | Timeline layer name |
| Lock Layer | ✅ 🎹 | `Ctrl+L` | Layer panel icon |
| Solo/Isolate | ✅ 🖱️ | Click | Layer panel icon |
| Enable/Disable | ✅ 🖱️ | Click | Layer panel eye icon 👁️ |
| Toggle 3D | ✅ 🖱️ | Click | Layer panel 3D icon |
| Parent Layer | ✅ 🎚️ | Dropdown | Properties panel |
| Reorder Layers | ✅ 🖱️ | Drag | Timeline |
| Pre-compose | ✅ 🎹 | `Ctrl+Shift+C` | Layer menu |

---

## 2. TIME MANIPULATION

| Operation | UI Access | Shortcut | Location |
|-----------|-----------|----------|----------|
| Split Layer | ✅ 🎹 | `Ctrl+Shift+D` | Edit menu |
| Time Stretch | ✅ 🎹 | `Ctrl+Alt+T` | Dialog |
| Reverse Layer | ✅ 🎹 | `Ctrl+Alt+R` | - |
| Freeze Frame | ✅ 🎹 | `Ctrl+Shift+F` | - |
| Set In Point | ✅ 🎹 | `[` | - |
| Set Out Point | ✅ 🎹 | `]` | - |
| Trim to In Point | ✅ 🎹 | `Alt+[` | - |
| Trim to Out Point | ✅ 🎹 | `Alt+]` | - |
| Go to In Point | ✅ 🎹 | `I` | - |
| Go to Out Point | ✅ 🎹 | `O` | - |
| Timewarp Enable | ✅ 🎚️ | - | Video Properties |
| Timewarp Speed | ✅ 🎚️ | - | Video Properties |
| Timewarp Presets | ✅ 🖱️ | - | Video Properties buttons |
| SpeedMap/Time Remap | ✅ 🎚️ | - | Video Properties |
| Frame Blending | ✅ 🎚️ | - | Video Properties |

---

## 3. KEYFRAME OPERATIONS

| Operation | UI Access | Shortcut | Location |
|-----------|-----------|----------|----------|
| Add Keyframe | ✅ 🎹 🖱️ | `*` numpad / Click ◆ | Property row |
| Delete Keyframe | ✅ 🎹 🖱️ | `Delete` / Right-click | Timeline |
| Select Keyframe | ✅ 🖱️ | Click | Timeline/Graph |
| Multi-select | ✅ 🖱️ | Marquee / Shift+Click | Timeline/Graph |
| Move Keyframe | ✅ 🖱️ | Drag | Timeline/Graph |
| Edit Value | ✅ 🎚️ | - | Properties panel |
| Set Interpolation | ✅ 🖱️ | Right-click menu | Graph editor |
| Apply Ease | ✅ 🎹 | `F9` | - |
| Apply Ease In | ✅ 🎹 | `Shift+F9` | - |
| Apply Ease Out | ✅ 🎹 | `Ctrl+Shift+F9` | - |
| Convert to Hold | ✅ 🎹 | `Ctrl+Alt+H` | - |
| Edit Handles | ✅ 🖱️ | Drag handles | Graph editor |
| Reverse Time | ✅ 🎹 | `Ctrl+Shift+R` | (selected keyframes) |
| Toggle Animation | ✅ 🖱️ | Click stopwatch ⏱️ | Property row |

---

## 4. PROPERTY REVEAL/SOLO SHORTCUTS

Press with layer selected:

| Shortcut | Property | Icon |
|----------|----------|------|
| `P` | Position | ↔️ |
| `S` | Scale | ↕️ |
| `R` | Rotation | 🔄 |
| `A` | Anchor/Origin | ⊕ |
| `T` | Opacity | 👁️ |
| `U` | All animated properties | ◆ |
| `UU` | All modified properties | ◇ |
| `E` | Effects | ✨ |
| `EE` | Expressions | fx |
| `M` | Masks | 🎭 |
| `MM` | All mask properties | 🎭+ |
| `Shift+letter` | Add to current reveal | + |

---

## 5. NAVIGATION & PLAYBACK

| Operation | UI Access | Shortcut | Icon |
|-----------|-----------|----------|------|
| Play/Pause | ✅ 🎹 🖱️ | `Space` | ▶ / ⏸ |
| Go to Start | ✅ 🎹 🖱️ | `Home` | ⏮ |
| Go to End | ✅ 🎹 🖱️ | `End` | ⏭ |
| Step Forward | ✅ 🎹 🖱️ | `→` | ⏩ |
| Step Backward | ✅ 🎹 🖱️ | `←` | ⏪ |
| Step 10 Frames | ✅ 🎹 | `Shift+→` / `Shift+←` | - |
| Next Keyframe | ✅ 🎹 | `K` | - |
| Prev Keyframe | ✅ 🎹 | `J` | - |
| Loop Playback | ✅ 🎚️ | - | 🔁 |
| Set Work Area Start | ✅ 🎹 | `B` | - |
| Set Work Area End | ✅ 🎹 | `N` | - |
| Audio-only Playback | ✅ 🎹 | `Ctrl+.` | - |
| Pause Preview Updates | ✅ 🎹 | `Caps Lock` | - |

---

## 6. VIEW & ZOOM

| Operation | UI Access | Shortcut |
|-----------|-----------|----------|
| Timeline Zoom In | ✅ 🎹 | `=` / `+` |
| Timeline Zoom Out | ✅ 🎹 | `-` |
| Timeline Fit | ✅ 🎹 | `;` |
| Viewer Zoom In | ✅ 🎹 | `Ctrl+=` |
| Viewer Zoom Out | ✅ 🎹 | `Ctrl+-` |
| Viewer Fit | ✅ 🎹 | `Ctrl+0` |
| Viewer 100% | ✅ 🎹 | `Ctrl+Shift+0` |
| Toggle Grid | ✅ 🎹 | `Ctrl+'` |
| Toggle Transparency | ✅ 🎹 | `Ctrl+Shift+H` |
| Toggle Rulers | ✅ 🎹 | `Ctrl+Shift+R` |
| Toggle Safe Zones | ✅ 🎚️ | View menu |

---

## 7. TOOL SELECTION

| Tool | Shortcut | Icon | Description |
|------|----------|------|-------------|
| Select | `V` | ↖ | Select and move layers |
| Pen | `P` | ✒ | Draw paths and shapes |
| Text | `T` | T | Add text layers |
| Hand/Pan | `H` | ✋ | Pan the viewport |
| Zoom | `Z` | 🔍 | Zoom in/out |
| AI Segment | `S` | ✨ | Auto-select objects |

---

## 8. EFFECTS (22 Total)

All effects accessible via Effects panel → Add Effect dropdown.

### Blur Category
| Effect | Icon | Parameters |
|--------|------|------------|
| Gaussian Blur | 🌫️ | radius, direction |
| Box Blur | ⬜ | radius, iterations |
| Directional Blur | → | angle, distance |
| Radial Blur | ◎ | amount, center, type |
| Sharpen | 🔺 | amount, radius, threshold |

### Color Category
| Effect | Icon | Parameters |
|--------|------|------------|
| Brightness/Contrast | ☀️ | brightness, contrast |
| Hue/Saturation | 🎨 | hue, saturation, lightness |
| Levels | 📊 | input black/white, gamma, output |
| Curves | 📈 | per-channel curves |
| Tint | 🎨 | black point, white point |
| Glow | ✨ | radius, intensity, threshold |
| Color Balance | ⚖️ | shadows/mids/highlights |
| Exposure | 📷 | exposure stops |
| Vibrance | 💎 | vibrance, saturation |
| Invert | 🔄 | invert channels |
| Posterize | 🎯 | levels |
| Threshold | ◐ | threshold value |
| Drop Shadow | 🌑 | offset, blur, color, opacity |

### Distort Category
| Effect | Icon | Parameters |
|--------|------|------------|
| Transform | ↔️ | position, scale, rotation |
| Warp | 🌀 | mesh control |
| Displacement Map | 🗺️ | source, scale |

### Generate Category
| Effect | Icon | Parameters |
|--------|------|------------|
| Fill | 🎨 | color |
| Gradient Ramp | 🌈 | start/end color/position |
| Fractal Noise | 🌊 | scale, octaves, evolution |

---

## 9. PANELS (Right Sidebar)

| Tab | Panel | Icon | Status |
|-----|-------|------|--------|
| Properties | PropertiesPanel | 🎚️ | ✅ Full |
| Effects | EffectControlsPanel | ✨ | ✅ Full |
| Camera | CameraProperties | 📷 | ✅ Full |
| Audio | AudioPanel | 🔊 | ✅ Full |
| Export | ExportPanel | 📤 | ✅ Full |
| Preview | PreviewPanel | 👁️ | ✅ Full |
| AI Chat | AIChatPanel | 🤖 | ✅ Full |
| AI Generate | AIGeneratePanel | 🎨 | ✅ Full |
| Align | AlignPanel | ⬚ | ✅ Full |

---

## 10. DIALOGS

| Dialog | Trigger | Shortcut |
|--------|---------|----------|
| Composition Settings | Menu | `Ctrl+K` |
| Export | Menu | `Ctrl+M` |
| Pre-compose | Menu | `Ctrl+Shift+C` |
| Keyframe Interpolation | Menu | `Ctrl+Shift+K` |
| Time Stretch | Menu | `Ctrl+Alt+T` |
| Font Picker | Properties | Click font name |
| Path Suggestion | AI | Auto-triggered |

---

## 11. ❌ FEATURES WITHOUT UI ACCESS

### HIGH PRIORITY - Core Animation Features

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Enable Spline Animation** | `layerActions.ts:910` | Enable keyframing on spline control points |
| **Add Spline Point Keyframe** | `layerActions.ts:946` | Keyframe individual spline points |
| **Simplify Spline** | `layerActions.ts:1202` | Reduce spline complexity (Ramer-Douglas-Peucker) |
| **Smooth Spline Handles** | `layerActions.ts:1305` | Auto-smooth handles for natural curves |
| **Convert Text to Splines** | `layerActions.ts:1581` | Convert text layer to editable path |
| **Copy Path to Position** | `layerActions.ts:1772` | Use spline as motion path |

### HIGH PRIORITY - Property Linking

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Add Property Driver** | `compositorStore.ts:2754` | Link properties together |
| **Create Audio Property Driver** | `compositorStore.ts:2757` | Drive properties from audio |
| **DriverList Panel** | `panels/DriverList.vue` | **UI exists but not mounted!** |

### MEDIUM PRIORITY - Audio Path Animation

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Create Path Animator** | `audioActions.ts` | Create audio-driven path animation |
| **Set Path Animator Path** | `audioActions.ts` | Assign path to animator |
| **Update Path Animator Config** | `audioActions.ts` | Configure animation params |

### MEDIUM PRIORITY - Asset Management

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Find Used Asset IDs** | `projectActions.ts:385` | Find which assets are in use |
| **Remove Unused Assets** | `projectActions.ts:434` | Clean up unused assets |
| **Get Asset Usage Stats** | `projectActions.ts:462` | Show asset usage statistics |

### LOW PRIORITY - AI Features

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Layer Decomposition** | `layerDecompositionActions.ts` | AI layer separation |
| **LayerDecompositionPanel** | `panels/LayerDecompositionPanel.vue` | **UI exists but not mounted!** |
| **Depth Estimation** | `services/ai/depthEstimation.ts` | AI depth map generation |
| **Matte Edge Effects** | `services/effects/matteEdge.ts` | Advanced matte processing |

---

## 12. UNMOUNTED PANELS (UI exists but hidden)

These Vue components exist but are NOT added to WorkspaceLayout.vue:

| Panel | File | Purpose |
|-------|------|---------|
| **DriverList** | `panels/DriverList.vue` | Property driver management |
| **LayerDecompositionPanel** | `panels/LayerDecompositionPanel.vue` | AI layer decomposition |

**ACTION:** Add these to right sidebar tabs!

---

## 13. EXPRESSION SYSTEM

| Feature | UI Access | Location |
|---------|-----------|----------|
| Enable Expression | ✅ 🖱️ | Property → Expression icon |
| Expression Presets | ✅ 🎚️ | Dropdown menu |
| Custom Expression | ✅ 🎚️ | Text input |

### Available Expressions
| Expression | Syntax |
|------------|--------|
| Wiggle | `wiggle(freq, amp)` |
| repeatAfter | `repeatAfter("cycle")` |
| repeatBefore | `repeatBefore("cycle")` |
| Inertia | `inertia(friction)` |
| Bounce | `bounce()` |
| Elastic | `elastic()` |
| Math | sin, cos, abs, clamp, etc. |

---

## 14. EXPORT OPTIONS

All accessible via Export dialog (`Ctrl+M`):

| Format | Status | Icon |
|--------|--------|------|
| PNG Sequence | ✅ | 🖼️ |
| JPEG Sequence | ✅ | 🖼️ |
| WebP Sequence | ✅ | 🖼️ |
| MP4 Video | ✅ | 🎬 |
| WebM Video | ✅ | 🎬 |
| GIF | ✅ | 🎞️ |
| Camera Data (JSON) | ✅ | 📷 |
| Depth Maps | ✅ | 📊 |
| Normal Maps | ✅ | 🧭 |
| Motion Vectors | ✅ | ↔️ |
| ComfyUI Workflow | ✅ | 🔗 |

---

## 15. CAMERA TRAJECTORY PRESETS (22 Total)

All accessible via Camera Properties panel:

### Orbital
| Preset | Description |
|--------|-------------|
| orbit | Horizontal orbit around subject |
| orbitTilt | Tilted orbital path |
| orbitVertical | Vertical orbit |
| figurEight | Figure-8 pattern |

### Linear
| Preset | Description |
|--------|-------------|
| dollyIn | Push in towards subject |
| dollyOut | Pull back from subject |
| truckLeft | Move left |
| truckRight | Move right |
| pedestalUp | Move up |
| pedestalDown | Move down |

### Crane
| Preset | Description |
|--------|-------------|
| craneUp | Crane up with tilt |
| craneDown | Crane down with tilt |
| craneArc | Arc crane move |

### Cinematic
| Preset | Description |
|--------|-------------|
| reveal | Reveal from behind object |
| pushIn | Dramatic push in |
| pullBack | Pull back reveal |
| whipPan | Fast pan transition |

### Dynamic
| Preset | Description |
|--------|-------------|
| spiral | Spiral toward/away |
| zigzag | Zigzag movement |
| bounce | Bouncing motion |
| shake | Camera shake |

---

## RECOMMENDATIONS

### Immediate Actions (Wire up existing UI)

1. **Mount DriverList panel** to right sidebar
2. **Mount LayerDecompositionPanel** to right sidebar
3. **Add spline animation controls** to SplineEditor toolbar
4. **Add "Convert Text to Path"** to text layer context menu
5. **Add "Use as Motion Path"** to spline layer context menu

### New UI Needed

1. **Asset Cleanup Dialog** - Show unused assets, allow deletion
2. **Path Tools Toolbar** - Simplify, smooth, convert operations
3. **Audio Path Animator Panel** - Configure audio-driven paths

---

## VERSION HISTORY

| Date | Changes |
|------|---------|
| 2025-12-21 | Complete rewrite with comprehensive audit |
| 2025-12-20 | Original version (now outdated) |
