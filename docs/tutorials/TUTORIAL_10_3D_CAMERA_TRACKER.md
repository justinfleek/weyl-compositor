# TUTORIAL 10 COMPATIBILITY ANALYSIS
## "3D Camera Tracker" - After Effects VFX Standard

**Analysis Date:** December 22, 2025
**Status:** 55% Compatible (MAJOR IMPROVEMENTS)
**Last Updated:** December 22, 2025

---

## EXECUTIVE SUMMARY

The 3D Camera Tracker is one of After Effects' most powerful VFX features. It analyzes footage to reconstruct the original camera's 3D movement, enabling seamless integration of text, graphics, and 3D elements into real-world footage.

**UPDATE (December 22, 2025):** Significant progress has been made! Weyl now supports:
- ✅ **Shadow Catcher Material** - THREE.ShadowMaterial with opacity/color controls
- ✅ **Camera Tracking Import** - Weyl JSON, COLMAP, and Blender format support
- ✅ **Track Point System** - Manual track point management with visualization
- ✅ **Ground Plane Definition** - 3-point plane fitting from track points
- ✅ **Track Point Visualization** - SVG overlay with selection and motion trails

**REMAINING GAP:** Automatic 3D Camera Tracker effect (requires Structure from Motion backend). For automatic tracking, use external tools (COLMAP, Blender, OpenSfM) and import results.

---

## FEATURE COMPATIBILITY MATRIX

### 3D Camera Tracker Effect (Analysis Engine)

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Effect Application (Animation > Track Camera) | - | ❌ Missing | Requires CV/SfM backend |
| Background Analysis Engine | - | ❌ Missing | Use COLMAP/Blender + import |
| Two-Phase Analysis (detect + solve) | - | ❌ Missing | External tools recommended |
| Progress Indicator | - | ❌ Missing | N/A without tracker |
| Analyze Button | - | ❌ Missing | N/A without tracker |
| Average Error Display | - | ❌ Missing | N/A without tracker |

### Track Points

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Track Point Display in Viewer | TrackPointOverlay.vue | ✅ Full | SVG overlay with crosshairs |
| Track Point Selection (click/shift/marquee) | trackPointService.ts | ✅ Full | Click, shift-click, clearSelection |
| Track Point Deletion | deleteTrack() | ✅ Full | Single and batch delete |
| Track Point Confidence (size) | confidence property | ✅ Full | Visual size varies with confidence |
| Track Point Depth (color) | color property | ✅ Full | Custom colors per track |
| Track Point Size Parameter | pointSize in overlay | ✅ Full | Configurable |
| Render Track Points Toggle | showTrails prop | ✅ Full | Toggle in overlay |
| Plane Preview on Hover | - | ⚠️ Partial | Ground plane visible, no hover preview |

### Ground Plane / Origin Definition

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Set Ground Plane and Origin | defineGroundPlaneFromPoints() | ✅ Full | 3-point plane definition |
| Set Ground Plane Only | setGroundPlane() | ✅ Full | Manual plane setting |
| Set Origin | setOrigin3D() | ✅ Full | From track point |
| RGB Axis Indicator | Canvas reference axes | ✅ Full | Global + per-solve |

### Object Creation from Tracking

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Create Camera from Solve | importCameraTracking() | ✅ Full | From imported solve |
| Create Null and Camera | importCameraTracking({createNulls}) | ✅ Full | Auto-create from import |
| Create Null Only | createTrack() | ✅ Full | Manual creation |
| Create Text and Camera | - | ⚠️ Manual | Requires manual layer creation |
| Create Solid and Camera | - | ⚠️ Manual | Requires manual layer creation |
| Create Shadow Catcher | SolidLayer shadowCatcher mode | ✅ Full | THREE.ShadowMaterial |

### Effect Controls / Solve Settings

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Shot Type Section | - | ❌ Missing | N/A without tracker |
| Fixed Angle of View | CameraIntrinsics.focalLength | ⚠️ Import | From imported data |
| Variable Zoom | - | ❌ Missing | N/A without tracker |
| Specify Angle of View | - | ❌ Missing | N/A without tracker |
| Solve Method (Auto/Typical/Flat/Tripod) | - | ❌ Missing | Use external tools |
| Detailed Analysis Toggle | - | ❌ Missing | N/A without tracker |
| Auto-delete Points Across Time | - | ❌ Missing | N/A without tracker |
| Track Point Filtering | - | ❌ Missing | Manual only |

### Camera Tracking Import (NEW!)

| Feature | Weyl Compositor | Status | Notes |
|---------|-----------------|--------|-------|
| Weyl JSON Format | parseWeylTrackingJSON() | ✅ Full | Native format |
| COLMAP Import | parseCOLMAPOutput() | ✅ Full | cameras.txt, images.txt, points3D.txt |
| Blender Import | parseBlenderTrackingJSON() | ✅ Full | Motion tracking export |
| Auto-format Detection | detectTrackingFormat() | ✅ Full | Automatic |
| Scale/Offset Transform | CameraTrackingImportOptions | ✅ Full | Full control |
| Flip Y/Z Axis | flipY, flipZ options | ✅ Full | Coordinate conversion |
| Create Point Cloud | pointCloud option | ✅ Full | From 3D points |
| Keyboard Shortcut | Ctrl+Shift+I | ✅ Full | Quick import |

### 3D Camera (Manual - NOT from tracking)

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Camera Layer Creation | `type: 'camera'` | ✅ Full | Manual creation |
| Camera Position Keyframes | CameraLayer + Camera3D | ✅ Full | Manual keyframes |
| Camera POI (Point of Interest) | Camera3D.pointOfInterest | ✅ Full | Two-node camera |
| Camera Angle of View | Camera3D.angleOfView | ✅ Full | FOV in degrees |
| Camera Focal Length | Camera3D.focalLength | ✅ Full | In mm |
| Camera Zoom | Camera3D.zoom | ✅ Full | Internal pixels |
| Depth of Field | Camera3D.depthOfField | ✅ Full | Focus, aperture, f-stop |
| Camera Presets (15mm-135mm) | CAMERA_PRESETS | ✅ Full | 8 presets |
| Camera Wireframe | CameraLayer wireframe | ✅ Full | Visual editor |
| Frustum Visualization | frustumHelper | ✅ Full | FOV cone |

### 3D Layers

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| 3D Layer Toggle | `layer.threeD` | ✅ Full | Per-layer flag |
| 3D Position (X, Y, Z) | transform.position.z | ✅ Full | Full 3D |
| 3D Rotation (X, Y, Z) | rotationX, rotationY, rotationZ | ✅ Full | Separate axes |
| Orientation | transform.orientation | ✅ Full | Combined XYZ |
| 3D Scale | transform.scale | ✅ Full | XYZ scale |
| Parent to Null | layer.parentId | ✅ Full | Full parenting |
| 3D Anchor Point | transform.anchor | ✅ Full | Origin point |

### Control/Null Layer

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Null Object Creation | `type: 'control'` | ✅ Full | ControlLayer |
| 3D Null | ControlLayer + threeD | ✅ Full | 3D crosshair |
| Parent Hierarchy | parentId | ✅ Full | Full support |
| Transform Inheritance | BaseLayer | ✅ Full | Position, rotation, scale |

### Lighting / Shadows

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Light Layer Creation | `type: 'light'` | ✅ Full | LightLayer |
| Point Light | lightType: 'point' | ✅ Full | Full support |
| Spot Light | lightType: 'spot' | ✅ Full | Cone angle, penumbra |
| Parallel/Directional Light | lightType: 'parallel' | ✅ Full | Full support |
| Ambient Light | lightType: 'ambient' | ✅ Full | Full support |
| Area Light | lightType: 'area' | ✅ Full | RectAreaLight |
| Cast Shadows Toggle | shadow.enabled | ✅ Full | Per-light |
| Shadow Darkness | shadow.darkness | ✅ Full | 0-100% |
| Shadow Diffusion/Softness | shadow.radius | ✅ Full | Soft shadows |
| Shadow Map Size | shadow.mapSize | ✅ Full | Resolution |
| Shadow Bias | shadow.bias, normalBias | ✅ Full | Artifact control |
| Accepts Shadows (Material) | acceptsShadows | ✅ Full | Layer property |
| Accepts Lights (Material) | - | ⚠️ Implicit | All 3D layers lit |
| **Shadow Catcher Material** | SolidLayer.shadowCatcher | ✅ Full | THREE.ShadowMaterial |

### Export

| After Effects Feature | Weyl Compositor | Status | Notes |
|----------------------|-----------------|--------|-------|
| Export Tracking Data (Maya, C4D) | exportCameraToTrackingFormat() | ✅ Full | JSON format |
| Camera Animation Export | cameraExport.ts | ✅ Full | Uni3C, JSON formats |

---

## IMPLEMENTATION CHANGES (December 22, 2025)

### 1. Shadow Catcher Material
- Added to `SolidLayer.ts` using THREE.ShadowMaterial
- Properties: shadowCatcher, shadowOpacity, shadowColor, receiveShadow
- UI controls in `SolidProperties.vue`
- Works with all light types

### 2. Camera Tracking Import System
- **Types:** `types/cameraTracking.ts`
  - CameraTrackingSolve, CameraPose, TrackPoint2D, TrackPoint3D
  - CameraIntrinsics, GroundPlane, ImportOptions
  - COLMAPFormat, BlenderFormat namespaces
- **Service:** `services/cameraTrackingImport.ts`
  - parseWeylTrackingJSON(), parseBlenderTrackingJSON(), parseCOLMAPOutput()
  - importCameraTracking() - creates layers with keyframes
  - exportCameraToTrackingFormat() - export camera to JSON
- **UI:** `components/dialogs/CameraTrackingImportDialog.vue`
  - Drag-drop file upload
  - Format auto-detection
  - Import options (scale, offset, flip, create nulls)
  - Keyboard shortcut: Ctrl+Shift+I

### 3. Track Point Management Service
- **Service:** `services/trackPointService.ts`
  - createTrack(), deleteTrack(), setTrackPosition()
  - selectTrack(), deselectTrack(), clearSelection()
  - setGroundPlane(), defineGroundPlaneFromPoints()
  - importTrackPoints2D(), importTrackPoints3D()
  - getTrackStats() for analytics

### 4. Track Point Visualization
- **Component:** `components/canvas/TrackPointOverlay.vue`
  - SVG overlay on canvas
  - Crosshair markers with confidence rings
  - Motion trail paths
  - Click/shift-click selection
  - Drag-to-move (editable mode)

---

## FILES CREATED/MODIFIED

| File | Type | Purpose |
|------|------|---------|
| `types/cameraTracking.ts` | Created | Camera tracking type definitions |
| `services/cameraTrackingImport.ts` | Created | Import parser service |
| `services/trackPointService.ts` | Created | Track point management |
| `components/dialogs/CameraTrackingImportDialog.vue` | Created | Import UI dialog |
| `components/canvas/TrackPointOverlay.vue` | Created | Track point visualization |
| `engine/layers/SolidLayer.ts` | Modified | Shadow catcher support |
| `types/project.ts` | Modified | SolidLayerData shadow props |
| `components/properties/SolidProperties.vue` | Created | Solid layer UI |
| `components/panels/PropertiesPanel.vue` | Modified | Wire up SolidProperties |
| `composables/useKeyboardShortcuts.ts` | Modified | Ctrl+Shift+I shortcut |
| `components/layout/WorkspaceLayout.vue` | Modified | Dialog integration |

---

## COMPATIBILITY SUMMARY

| Category | Features Available | Features Missing | % Complete |
|----------|-------------------|------------------|------------|
| 3D Camera Tracker Effect | 0 | 6 | 0% |
| Track Points | 7 | 1 | 88% |
| Ground Plane/Origin | 4 | 0 | 100% |
| Object Creation from Tracking | 4 | 2 | 67% |
| Effect Controls/Solve | 1 | 7 | 13% |
| Camera Tracking Import | 8 | 0 | 100% (NEW!) |
| 3D Camera (Manual) | 10 | 0 | 100% |
| 3D Layers | 6 | 0 | 100% |
| Control/Null Layer | 4 | 0 | 100% |
| Lighting/Shadows | 13 | 0 | 100% |
| Export | 2 | 0 | 100% |

**Overall Tutorial 10 Compatibility: 55%** (up from 15%)

---

## RECOMMENDED WORKFLOW

Since automatic 3D Camera Tracking requires Structure from Motion algorithms (CPU-intensive, typically done server-side), we recommend this workflow:

### Option 1: Blender Motion Tracking (Free)
1. Import footage into Blender
2. Use Blender's motion tracking (Track > Solve Camera Motion)
3. Export tracking data as JSON
4. Import into Weyl (Ctrl+Shift+I)

### Option 2: COLMAP (Open Source SfM)
1. Run COLMAP on footage
2. Export cameras.txt, images.txt, points3D.txt
3. Combine into JSON or use directly
4. Import into Weyl

### Option 3: Manual Tracking in Weyl
1. Create manual track points (trackPointService)
2. Define ground plane from 3 points
3. Create camera layer with trajectory presets
4. Use depth maps for parallax (DepthflowLayer)

---

## SUCCESS CRITERIA (Updated)

- [x] Shadow catcher material (THREE.ShadowMaterial)
- [x] Camera tracking import (Weyl JSON, COLMAP, Blender)
- [x] Track point visualization and selection
- [x] Ground plane/origin definition
- [x] Create Camera/Null from imported track points
- [x] Export tracking data (JSON format)
- [ ] 3D Camera Tracker effect (automatic analysis) - EXTERNAL TOOL RECOMMENDED

**Current Status: 55% - Full import/export workflow, manual features complete**

---

## PRIORITY FOR 100% COMPATIBILITY

To reach full parity with AE's 3D Camera Tracker, we would need:

1. **Backend SfM Service** (Python/C++)
   - OpenSfM or COLMAP integration
   - Feature detection and matching
   - Bundle adjustment
   - API endpoint: `/weyl/video/track`

2. **Frontend Integration**
   - Progress indicator UI
   - Real-time track point display
   - Solve quality metrics

This would require significant backend infrastructure and is recommended for a future phase if automatic tracking is deemed essential.

---

## AI/VLM-BASED CAMERA TRACKING (NEW!)

### Overview

An alternative to traditional Structure from Motion is to use Vision Language Models (VLMs) for camera motion understanding. This is especially relevant for **Uni3C** workflows where precise matchmove isn't required.

### Implementation: `services/ai/cameraTrackingAI.ts`

We've implemented a hybrid approach combining:

1. **Semantic Analysis (VLM-based)**
   - Uses CameraBench taxonomy of camera motion primitives
   - VLM classifies video clips into: static, zoom, push/pull, truck, pedestal, arc, pan, tilt, roll, crane, tracking, random
   - Maps detected motion to Weyl trajectory presets

2. **Geometric Analysis (Depth-based)**
   - Uses monocular depth estimation (Depth Anything)
   - Derives camera motion from depth + optical flow
   - Exports to Weyl/COLMAP/Uni3C formats

3. **Uni3C Integration**
   - `parseUni3CFormat()` - Import Uni3C PCDController camera data
   - `exportToUni3CFormat()` - Export to Uni3C format with point clouds
   - Compatible with Uni3C's expected K matrix and 4x4 pose format

### Camera Motion Primitives (from CameraBench)

| Category | Primitives |
|----------|-----------|
| **Static** | static, zoom_in, zoom_out |
| **Translation** | push_in, pull_out, truck_left, truck_right, pedestal_up, pedestal_down, arc_left, arc_right |
| **Rotation** | pan_left, pan_right, tilt_up, tilt_down, roll_clockwise, roll_counter_clockwise |
| **Complex** | tracking_shot, crane_up, crane_down, random_motion |

### Usage

```typescript
import { analyzeWithVLM, parseUni3CFormat, exportToUni3CFormat } from '@/services/ai';

// Analyze video with VLM
const result = await analyzeWithVLM({
  frames: videoFramesBase64,
  fps: 16,
  mode: 'semantic',
});

// Result includes detected motion segments
console.log(result.segments); // [{startFrame: 0, endFrame: 30, motion: 'push_in', confidence: 0.9}]
console.log(result.suggestedPreset); // 'dollyIn'

// Import from Uni3C
const solve = parseUni3CFormat(uni3cData, 16);

// Export to Uni3C
const uni3cData = exportToUni3CFormat(solve);
```

### Limitations

- **VLM Accuracy**: Current VLMs achieve ~54% accuracy on camera motion classification
- **Semantic vs Geometric**: VLM provides motion TYPE, not precise camera path
- **Best Use Case**: Stylized animation, quick prototyping, Uni3C conditioning

### Future Improvements

1. Fine-tune VLM specifically on Weyl's trajectory presets
2. Integrate Depth Anything v3 for geometric enhancement
3. Add ViPE (NVIDIA) for real-time pose estimation
4. Train custom model on cinematography datasets
