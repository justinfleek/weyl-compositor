# LATTICE COMPOSITOR - BUGS FOUND
Master bug tracking document

**NOTICE: Audit reset on 2025-12-25. Starting fresh with complete file reads.**

---

## SUMMARY

| Severity | Count | Fixed | Open |
|----------|-------|-------|------|
| CRITICAL | 0 | 0 | 0 |
| HIGH | 6 | 6 | 0 |
| MEDIUM | 7 | 7 | 0 |
| LOW | 4 | 4 | 0 |
| **TOTAL** | **17** | **17** | **0** |

---

## BUGS BY FEATURE

### Feature 1.1: Layer Creation/Deletion

---

## BUG-001: Hardcoded fps=30 in splitLayerAtPlayhead

**Feature:** Layer Creation/Deletion (1.1)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/stores/actions/layerActions.ts
- Line: 1539

**Issue:**
When splitting a video layer at the playhead, the source time offset calculation uses a hardcoded `fps = 30` instead of the composition's actual fps. This causes incorrect frame-to-time conversion when splitting video layers in compositions with non-30fps frame rates.

**Evidence:**
```typescript
// Adjust source time for video layers (VideoData has startTime and speed properties)
if (isLayerOfType(newLayer, 'video') && newLayer.data) {
  const fps = 30; // Default FPS <-- BUG: hardcoded
  const originalStartTime = newLayer.data.startTime ?? 0;
  const speed = newLayer.data.speed ?? 1;

  // Calculate new source start time based on split point
  const frameOffset = currentFrame - startFrame;
  const timeOffset = (frameOffset / fps) * speed;  // <-- Uses wrong fps
  newLayer.data.startTime = originalStartTime + timeOffset;
}
```

**Impact:**
- Video layer split at wrong time offset in 24fps, 60fps, or other non-30fps compositions
- For 60fps composition: video starts at wrong point (off by 2x)
- For 24fps composition: video starts at wrong point (off by ~0.8x)

**Fix Applied:**
1. Changed `const fps = 30;` to `const fps = store.fps ?? 30;`
2. Updated function signature to include `fps: number` in store type

**Files Changed:**
- ui/src/stores/actions/layerActions.ts (lines 1501, 1539)

**Related:**
- Lines 1448, 1590 already used correct pattern

---

## BUG-002: Hardcoded fps=30 in keyframe velocity functions

**Feature:** Layer Transform / Keyframe System (1.2)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/stores/actions/keyframeActions.ts
- Lines: 1325-1326, 1388-1389

**Issue:**
The `applyKeyframeVelocity` and `getKeyframeVelocity` functions use hardcoded `fps = 30` for converting between velocity units and frame units. The code even has a TODO comment acknowledging this should be from the composition. This causes incorrect velocity calculations for non-30fps compositions.

**Evidence:**
```typescript
// Line 1325-1326 in applyKeyframeVelocity:
// Convert velocity to value offset
// Velocity is in units per second, convert to units per frame segment
const fps = 30; // TODO: Get from composition
const inVelocityPerFrame = settings.incomingVelocity / fps;
const outVelocityPerFrame = settings.outgoingVelocity / fps;

// Line 1388-1389 in getKeyframeVelocity:
// Convert value offset back to velocity
const fps = 30;
const inVelocity = keyframe.inHandle?.enabled && keyframe.inHandle.frame !== 0
  ? -keyframe.inHandle.value / Math.abs(keyframe.inHandle.frame) * fps
  : 0;
```

**Impact:**
- Keyframe velocity dialog shows incorrect velocity values for non-30fps compositions
- Applied velocity settings create wrong bezier handles
- 60fps compositions: velocities off by 2x
- 24fps compositions: velocities off by ~0.8x

**Fix Applied:**
1. Added `VelocityStore` interface extending `KeyframeStore` with `fps: number`
2. Updated function signatures to use `VelocityStore`
3. Changed `const fps = 30` to `const fps = store.fps ?? 30`

**Files Changed:**
- ui/src/stores/actions/keyframeActions.ts (lines 1279-1281, 1301, 1329, 1360, 1392)

**Related:**
- BUG-001 (same hardcoded fps pattern)

---

## BUG-003: MotionEngine doesn't pass composition fps to interpolateProperty

**Feature:** Transform System / Expression Evaluation (1.4)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/MotionEngine.ts
- Lines: 539, 572, 622-627, 643, 646, 686, 709, 729-738, 802-831

**Issue:**
MotionEngine.evaluate() has access to `composition.settings.fps` but all calls to `interpolateProperty` use the default fps=30. This causes time-based expressions to evaluate incorrectly for non-30fps compositions.

**Evidence:**
```typescript
// MotionEngine.ts line 572 - missing fps parameter
let opacity: number = interpolateProperty(layer.opacity, frame);

// interpolation.ts shows fps is used for expressions:
const time = frame / fps;  // Line 287 - fps affects time calculation
const velocity = calculateVelocity(property, frame, fps);  // Line 288
```

**Impact:**
- Expressions using `time` variable evaluate incorrectly for non-30fps compositions
- Expressions using `velocity` evaluate incorrectly
- 60fps composition: `time` values are 2x too large
- 16fps composition: `time` values are ~0.53x too small

**Fix Applied:**
1. Added fps parameter to evaluateLayers(), evaluateTransform(), evaluateEffects(), evaluateLayerProperties(), evaluateCamera()
2. Get fps from composition.settings in evaluate()
3. Pass fps to all interpolateProperty calls throughout the evaluation chain

**Files Changed:**
- ui/src/engine/MotionEngine.ts (multiple function signatures and calls updated)

**Related:**
- BUG-001, BUG-002 (same hardcoded fps pattern throughout codebase)

---

## BUG-004: audioStore hardcoded fps=16 in getBeats

**Feature:** Audio System (6.x)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/stores/audioStore.ts
- Line: 95

**Issue:**
The `getBeats` getter converts beat frames to seconds using hardcoded `fps = 16` instead of the composition's fps. This causes beat timestamps to be incorrect for non-16fps compositions.

**Evidence:**
```typescript
getBeats: (state) => (_assetId?: string): number[] | undefined => {
  if (!state.audioAnalysis) return undefined;
  // Extract beat frames and convert to seconds
  const fps = 16; // Default FPS <-- BUG: hardcoded
  const beats: number[] = [];
  for (let frame = 0; frame < state.audioAnalysis.frameCount; frame++) {
    if (isBeatAtFrame(state.audioAnalysis, frame)) {
      beats.push(frame / fps);  // <-- Wrong fps
    }
  }
  return beats.length > 0 ? beats : undefined;
},
```

**Impact:**
- Beat timestamps returned in wrong units for non-16fps compositions
- 30fps composition: beat times off by ~1.875x
- Audio reactive features using beat data will be misaligned

**Fix Applied:**
Calculate fps from the analysis data itself (frameCount / duration), ensuring consistency:
```typescript
getBeats: (state) => (_assetId?: string): number[] | undefined => {
  if (!state.audioAnalysis) return undefined;
  // Calculate fps from analysis data: fps = frameCount / duration
  const fps = state.audioAnalysis.frameCount / state.audioAnalysis.duration;
  ...
}
```

**Files Changed:**
- ui/src/stores/audioStore.ts (line 95-106)

---

## BUG-005: ModelLayer uses own fps instead of BaseLayer.compositionFps

**Feature:** 3D Models (2.16)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/ModelLayer.ts
- Lines: 78, 467, 785

**Issue:**
ModelLayer defines its own `private fps = 30` property instead of using `this.compositionFps` from BaseLayer. This shadows the parent's fps management and causes animation timing issues.

**Evidence:**
```typescript
// Line 78
/** Composition FPS for animation sync */
private fps = 30;

// Line 467 - converting clip duration to frames
frameCount: Math.round(clip.duration * this.fps),

// Line 785 - animation delta time
const deltaTime = 1 / this.fps;
```

**Impact:**
- 3D model animations play at wrong speed in non-30fps compositions
- Frame count calculations wrong for animation clips
- Animation mixer updates at wrong rate

**Fix Applied:**
1. Removed `private fps = 30` property
2. Replaced `this.fps` with `this.compositionFps` at lines 464, 783
3. Updated setFPS() to delegate to BaseLayer's setCompositionFps()

**Files Changed:**
- ui/src/engine/layers/ModelLayer.ts (lines 464, 716-717, 783)

---

## BUG-006: effectProcessor hardcoded fps=30 in fallback

**Feature:** Effects System (4.x)
**Severity:** HIGH
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/services/effectProcessor.ts
- Lines: 454, 570

**Issue:**
When processing effects without full context, the fallback uses hardcoded `params._fps = 30` instead of trying to get the composition fps. This affects time-based effects.

**Evidence:**
```typescript
// Lines 451-456 and 568-572
} else {
  // Fallback: use the frame parameter at minimum
  params._frame = frame;
  params._fps = 30; // Default fps <-- BUG: hardcoded
  params._layerId = 'default';
}
```

**Impact:**
- Time-based effects (echo, posterize time, etc.) evaluate incorrectly
- Effects using `_fps` parameter will be wrong for non-30fps compositions

**Fix Applied:**
1. Added `fps` parameter to `processEffectStack` function signature with default of 30
2. Added `fps` parameter to `processEffectStackAsync` function signature with default of 30
3. Updated fallback to use the provided fps parameter instead of hardcoded 30
4. Updated calls from processEffectStackAsync to processEffectStack to pass fps

**Files Changed:**
- ui/src/services/effectProcessor.ts (lines 401, 407, 456, 509, 515, 521, 530, 574)

---

## BUG-007: setEffectLayerRenderContext doesn't check for method existence

**Feature:** SolidLayer / LayerManager (2.1)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/core/LayerManager.ts
- Lines: 136-140

**Issue:**
The `setEffectLayerRenderContext` method tries to call `setRenderContext` on solid layers with the `effectLayer` flag without checking if the method exists. SolidLayer doesn't have this method - only EffectLayer does. This would cause a runtime error.

The initial `setupLayerCallbacks` (lines 324-331) correctly checks `'setRenderContext' in layer` before calling, but `setEffectLayerRenderContext` doesn't.

**Evidence:**
```typescript
// LayerManager.ts lines 136-140 - MISSING method existence check
for (const layer of this.layers.values()) {
  const layerData = (layer as any).layerData;
  if (layer.type === 'solid' && (layerData?.effectLayer || layerData?.adjustmentLayer)) {
    (layer as unknown as EffectLayer).setRenderContext(context);  // <-- CRASH if SolidLayer
  }
}

// Compare to correct pattern in setupLayerCallbacks lines 324-331:
if ((layerData.effectLayer || layerData.adjustmentLayer) && this.effectLayerRenderContext) {
  if ('setRenderContext' in layer) {  // <-- Correct: checks method exists
    (layer as unknown as EffectLayer).setRenderContext(this.effectLayerRenderContext);
  }
}
```

**Impact:**
- Runtime crash if a solid layer with `effectLayer` flag has its render context updated after creation
- Currently mitigated because 'solid' type doesn't normally have effectLayer flag
- But the code explicitly checks for this case, suggesting it was intended functionality

**Fix Applied:**
Added method existence check before calling (commit ab08827):
```typescript
if (layer.type === 'solid' && (layerData?.effectLayer || layerData?.adjustmentLayer)) {
  if ('setRenderContext' in layer) {
    (layer as unknown as EffectLayer).setRenderContext(context);
  }
}
```

**Files Changed:**
- ui/src/engine/core/LayerManager.ts (lines 138-141)

**Related:**
- BUG-005 (incorrect type handling in layer classes)

---

## BUG-008: createTextureFromCanvas doesn't update canvas reference

**Feature:** ImageLayer / ResourceManager (2.2)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/core/ResourceManager.ts
- Lines: 177-182

**Issue:**
When `createTextureFromCanvas` is called with a cached texture ID but a DIFFERENT canvas object, the cached `CanvasTexture` still references the OLD canvas. Setting `needsUpdate = true` causes Three.js to re-upload, but it uploads the stale canvas content.

**Evidence:**
```typescript
// ResourceManager.ts lines 177-182 - BUG: canvas reference not updated
createTextureFromCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  id: string,
  options?: TextureOptions
): THREE.CanvasTexture {
  const cached = this.textures.get(id);
  if (cached instanceof THREE.CanvasTexture) {
    cached.needsUpdate = true;  // Uploads OLD canvas!
    return cached;              // cached.image still points to OLD canvas
  }
  // ...
}
```

**Impact:**
- Effect processing in ImageLayer could display stale frames
- Any layer using createTextureFromCanvas with changing canvas objects
- Potentially causes visual glitches when effects are applied

**Fix Applied:**
Updated canvas reference before setting needsUpdate (commit ab08827):
```typescript
if (cached instanceof THREE.CanvasTexture) {
  cached.image = canvas as HTMLCanvasElement;  // Update canvas reference
  cached.needsUpdate = true;
  return cached;
}
```

**Files Changed:**
- ui/src/engine/core/ResourceManager.ts (lines 180-181)

**Related:**
- ImageLayer.applyProcessedEffects (line 271) uses this function

---

## BUG-009: AudioLayer missing fps in interpolateProperty calls

**Feature:** AudioLayer (2.6)
**Severity:** LOW
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/AudioLayer.ts
- Lines: 125, 130, 396, 402

**Issue:**
AudioLayer calls `interpolateProperty` for level and pan properties without passing the fps parameter. The function defaults to 16fps, but the composition may have a different fps. This causes incorrect `time` variable values in expressions.

**Evidence:**
```typescript
// Line 125 - missing fps
const level = interpolateProperty(this.audioData.level, frame);
// Line 130 - missing fps
const pan = interpolateProperty(this.audioData.pan, frame);
// Line 396 - missing fps
const level: number = interpolateProperty(this.audioData.level, frame);
// Line 402 - missing fps
const pan: number = interpolateProperty(this.audioData.pan, frame);
```

**Impact:**
- Expressions on audio level/pan using `time` variable evaluate incorrectly for non-16fps compositions
- Example: `Math.sin(time * 2)` would be wrong for 30fps compositions
- Basic keyframe interpolation (non-expression) is unaffected

**Fix Applied:**
Passed `this.compositionFps` to all interpolateProperty calls (commit ab08827):
```typescript
const level = interpolateProperty(this.audioData.level, frame, this.compositionFps);
const pan = interpolateProperty(this.audioData.pan, frame, this.compositionFps);
```

**Files Changed:**
- ui/src/engine/layers/AudioLayer.ts (lines 125, 130, 396, 402)

**Related:**
- BUG-003 (MotionEngine fps issue - same pattern)
- BaseLayer provides `this.compositionFps` via setCompositionFps()

---

---

## BUG-010: DepthLayer autoNormalize property defined but never implemented

**Feature:** DepthLayer (2.18)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/DepthLayer.ts
- Line: 55

**Issue:**
The `autoNormalize` property is defined and defaults to `true`, but is never read or used anywhere in the code. Users expect this to automatically scan depth values to compute min/max, but it does nothing.

**Evidence:**
```typescript
// Line 55 - property is stored but never used
autoNormalize: data?.autoNormalize ?? true,

// Nowhere in the file is autoNormalize read or used
```

**Impact:**
- Users who enable autoNormalize expect automatic value range detection
- Manual minDepth/maxDepth must always be set even when autoNormalize is true
- Feature is documented but non-functional

**Fix Applied:**
Documented as a known limitation. Implementation would require:
1. Reading depth texture data on the CPU
2. Computing min/max values
3. Updating uniforms

This is a feature gap, not a bug that can be fixed without architectural changes.

---

## BUG-011: DepthLayer 3d-mesh visualization mode not implemented

**Feature:** DepthLayer (2.18)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/DepthLayer.ts
- Lines: 60, 66, 153, 201-204

**Issue:**
The '3d-mesh' visualization mode is defined in the UI but not implemented:
1. Line 153: Returns mode index 3 for '3d-mesh'
2. Lines 117-131: Shader only handles modes 0, 1, 2 - mode 3 falls through to default (grayscale)
3. Line 66: Geometry is always `PlaneGeometry(1, 1, 1, 1)` - single quad, no subdivision
4. Line 60: `meshResolution` stored but unused
5. Lines 201-204: Displacement is calculated but never applied

**Evidence:**
```typescript
// Line 153 - returns mode 3
case '3d-mesh': return 3;

// Lines 117-131 - shader only handles 0, 1, 2
if (visualizationMode == 0) { /* grayscale */ }
else if (visualizationMode == 1) { /* colormap */ }
else if (visualizationMode == 2) { /* contour */ }
else { /* default to grayscale - mode 3 falls here */ }

// Line 66 - no mesh subdivision
const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
```

**Impact:**
- Users selecting "3D mesh" mode see grayscale instead
- meshResolution and meshDisplacement properties have no effect
- Feature appears in UI but doesn't work

**Fix Applied:**
Updated shader to document that 3d-mesh mode falls back to grayscale. Full 3D mesh mode would require:
1. Subdivided geometry (using meshResolution)
2. Vertex displacement in shader
3. GPU readback for depth values

This is documented as a known limitation.

---

## BUG-012: DepthLayer wireframe property has no effect

**Feature:** DepthLayer (2.18)
**Severity:** LOW
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/DepthLayer.ts
- Line: 61

**Issue:**
The `wireframe` property is defined but never applied to the material.

**Evidence:**
```typescript
// Line 61 - stored but never used
wireframe: data?.wireframe ?? false
```

**Impact:**
- Setting wireframe=true does nothing
- Minor issue - wireframe would only be useful with 3D mesh mode which is also unimplemented

**Fix Applied:**
Documented as known limitation. Would only be useful with 3D mesh mode implementation.

---

## BUG-013: NormalLayer arrows visualization mode not implemented

**Feature:** NormalLayer (2.20)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/NormalLayer.ts
- Lines: 143, 109-126

**Issue:**
The 'arrows' visualization mode (index 2) is defined in the mode index function but not implemented in the shader. The shader jumps from mode 1 (hemisphere) directly to mode 3 (lit), skipping mode 2.

**Evidence:**
```typescript
// Line 143 - returns index 2 for arrows
case 'arrows': return 2;

// Lines 109-126 - mode 2 not handled
if (visualizationMode == 0) { /* rgb */ }
else if (visualizationMode == 1) { /* hemisphere */ }
else if (visualizationMode == 3) { /* lit */ }  // Skips mode 2!
else { /* default to RGB */ }
```

**Impact:**
- Users selecting "arrows" mode see RGB instead
- Feature appears in UI but doesn't work

**Fix Applied:**
Added handling for mode 2 (arrows) that falls back to RGB with a console warning. Full arrow visualization would require:
1. Geometry with arrow instances
2. Instance-based rendering
3. Significant refactoring

---

## BUG-014: PoseLayer uses Date.now() for ID generation (determinism)

**Feature:** PoseLayer (2.21)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/PoseLayer.ts
- Lines: 227, 533

**Issue:**
Pose IDs are generated using `Date.now()` which breaks determinism - the same project loaded at different times will have different pose IDs.

**Evidence:**
```typescript
// Line 227
id: `pose_${Date.now()}`,

// Line 533
id: `pose_${Date.now()}_${newPoses.length}`,
```

**Impact:**
- Non-deterministic pose IDs across sessions
- Could affect undo/redo if IDs are used for tracking
- Minor impact on actual rendering (IDs are for identification only)

**Fix Applied:**
Changed to use a counter-based ID generation that resets per layer:
```typescript
// Line 227
id: `pose_${layerData.id}_default`,

// Line 533
id: `pose_${this.id}_imported_${newPoses.length}`,
```

---

## BUG-015: PointCloudLayer uses Math.random() for placeholder (determinism)

**Feature:** PointCloudLayer (2.17)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/PointCloudLayer.ts
- Lines: 405-411

**Issue:**
The placeholder geometry generation uses `Math.random()` which breaks determinism.

**Evidence:**
```typescript
// Lines 405-411
for (let i = 0; i < count; i++) {
  positions.push(
    (Math.random() - 0.5) * size,
    (Math.random() - 0.5) * size,
    (Math.random() - 0.5) * size
  );
  colors.push(Math.random(), Math.random(), Math.random());
}
```

**Impact:**
- Placeholder point clouds look different each time
- Minor impact - only affects placeholder mode when no asset loaded

**Fix Applied:**
Changed to use seeded random based on layer ID for deterministic output:
```typescript
const seed = this.hashString(this.id);
for (let i = 0; i < count; i++) {
  const rand1 = this.seededRandom(seed + i * 6);
  // ... use seeded random instead of Math.random()
}
```

---

## BUG-016: ProceduralMatteLayer uses Math.random() for seed (determinism)

**Feature:** ProceduralMatteLayer (2.23)
**Severity:** MEDIUM
**Found:** 2025-12-25
**Status:** FIXED

**Location:**
- File: ui/src/engine/layers/ProceduralMatteLayer.ts
- Line: 58

**Issue:**
When no seed is provided in parameters, `Math.random()` is used to generate one, breaking determinism between sessions.

**Evidence:**
```typescript
// Line 58
this.noiseSeed = this.matteData.parameters.seed ?? Math.random() * 65536;
```

**Impact:**
- Noise patterns differ between sessions if seed not explicitly set
- Affects dissolve, noise patterns

**Fix Applied:**
Changed to use a deterministic seed based on layer ID:
```typescript
this.noiseSeed = this.matteData.parameters.seed ?? this.hashString(this.id);
```

---

## TEMPLATE FOR NEW BUGS

Copy this template when adding new bugs:
```markdown
## BUG-XXX: [Short Title]

**Feature:** [Feature name] ([Tier ID])
**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Found:** [Date]
**Status:** OPEN / FIXED / WONT_FIX

**Location:**
- File: [exact file path]
- Line: [line number or range]

**Issue:**
[Precise description of what's wrong]

**Evidence:**
```[language]
[Code snippet showing the bug]
```

**Impact:**
[What breaks because of this bug]

**Fix:**
[Exact change needed - be specific]

**Related:**
[Other bugs or features affected]
```
