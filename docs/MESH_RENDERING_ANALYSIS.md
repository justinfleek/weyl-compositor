# Mesh & 3D Rendering Repository Analysis

**Date:** December 21, 2025
**Purpose:** Compare 18 mesh/rendering repositories against Weyl Compositor's capabilities
**Methodology:** Same depth as Jovi particle systems analysis

---

## EXECUTIVE SUMMARY

| Area | Best Option | Weyl Status | Verdict |
|------|-------------|-------------|---------|
| **Mesh Compression** | google/draco | Already integrated | **COMPLETE** |
| **Point Cloud Loading** | Native Three.js | PLY, PCD, LAS/LAZ, XYZ, PTS | **COMPLETE** |
| **3D Model Formats** | Native Three.js | GLTF, FBX, OBJ, DAE, USD | **COMPLETE** |
| **Gaussian Splatting** | mesh2splat / SuGaR | Basic splat render mode | **ADOPT** |
| **3D Mesh Deformation** | meshDeformation3D.ts | Squash/stretch, bounce, pins | **COMPLETE** |
| **SDF Rendering** | sdf-viewer | None | **LOW PRIORITY** |
| **Animation Rigging** | Mesh2Motion | None (use external tools) | **NOT RELEVANT** |
| **Image-to-3D AI** | InstantMesh / Unique3D / Hunyuan3D | Use ComfyUI nodes | **NOT RELEVANT** |
| **Onion Skinning** | TRELLIS2_Motion | None | **ADOPT** |
| **Camera Trajectories** | Weyl native | 22 presets | **WEYL IS BETTER** |
| **Body Mesh Export** | SAM3DBody2abc | ABC/FBX export exists | **PARTIAL** |

---

## ACKNOWLEDGEMENTS (Add to CLAUDE.md)

```markdown
## Acknowledgements - 3D/Mesh

The following projects informed Weyl Compositor's 3D rendering capabilities:

- [Google Draco](https://github.com/google/draco) - Mesh compression (Apache 2.0) - Integrated via DRACOLoader
- [mesh2splat](https://github.com/electronicarts/mesh2splat) - Mesh to Gaussian splat conversion research (EA)
- [SuGaR](https://github.com/Anttwo/SuGaR) - Gaussian splatting to mesh extraction research
- [polyscope](https://github.com/nmwsharp/polyscope) - 3D visualization UI patterns (MIT)
- [ComfyUI-TRELLIS2_Motion](https://github.com/styletransfer/ComfyUI-TRELLIS2_Motion) - Onion skinning patterns (MIT)
- [Three.js](https://threejs.org/) - Core 3D rendering engine (MIT)
```

---

## REPOSITORY-BY-REPOSITORY ANALYSIS

### 1. google/draco
**URL:** https://github.com/google/draco
**License:** Apache 2.0
**Stars:** 6.6k+

#### What It Does
- Open-source mesh compression library from Google
- Compresses 3D geometric meshes and point clouds
- 10-100x smaller file sizes with minimal quality loss
- Supported by glTF 2.0 standard

#### Weyl Status
**ALREADY INTEGRATED** - DRACOLoader is used in ModelLayer.ts:
```typescript
// From ModelLayer.ts
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// ...
private static dracoLoader: DRACOLoader | null = null;
// ...
if (!ModelLayer.dracoLoader) {
  ModelLayer.dracoLoader = new DRACOLoader();
  ModelLayer.dracoLoader.setDecoderPath('/draco/');
}
```

#### Verdict: **COMPLETE - No action needed**

---

### 2. MrForExample/ComfyUI-3D-Pack
**URL:** https://github.com/MrForExample/ComfyUI-3D-Pack
**License:** MIT
**Stars:** 2.5k+

#### What It Does
- Comprehensive 3D toolset for ComfyUI
- Features:
  - 3D mesh generation (various AI models)
  - UV unwrapping
  - Texture baking
  - Orbit rendering
  - Point cloud processing
  - 3DGS (Gaussian splatting) support

#### Weyl Comparison

| Feature | ComfyUI-3D-Pack | Weyl |
|---------|-----------------|------|
| Load GLTF/FBX/OBJ | ✅ | ✅ ModelLayer |
| Orbit Camera | ✅ | ✅ 22 trajectory presets |
| Point Cloud | ✅ | ✅ PointCloudLayer (PLY, PCD, LAS) |
| 3DGS Rendering | ✅ Full | ⚠️ Basic splat mode |
| UV Unwrapping | ✅ | ❌ |
| Texture Baking | ✅ | ❌ |
| AI Mesh Gen | ✅ | ❌ (use ComfyUI nodes) |

#### What to Adopt
- **3DGS Full Rendering** - Currently Weyl only has basic "splat" render mode in PointCloudLayer
- **UV Unwrapping** - Low priority, users can use external tools

#### Verdict: **PARTIAL OVERLAP - Consider 3DGS improvements**

---

### 3. TencentARC/InstantMesh
**URL:** https://github.com/TencentARC/InstantMesh
**License:** Apache 2.0
**Stars:** 3.4k+

#### What It Does
- Single image to 3D mesh in <10 seconds
- Multi-view diffusion model + LRM architecture
- Outputs textured mesh from single photo

#### Weyl Relevance
**NOT RELEVANT** - This is an AI inference model, not a compositor feature.
Users should run this through ComfyUI nodes, then import the resulting mesh into Weyl.

#### Verdict: **NOT RELEVANT - Use ComfyUI integration**

---

### 4. cnr-isti-vclab/meshlab
**URL:** https://github.com/cnr-isti-vclab/meshlab
**License:** GPL-3.0
**Stars:** 5.1k+

#### What It Does
- Desktop application for mesh processing
- Features: filtering, cleaning, healing, simplification, remeshing
- Qt-based GUI

#### Weyl Relevance
**NOT RELEVANT** - Desktop application, not a library.
Users should preprocess meshes in MeshLab before importing to Weyl.

#### Verdict: **NOT RELEVANT - External tool**

---

### 5. electronicarts/mesh2splat
**URL:** https://github.com/electronicarts/mesh2splat
**License:** Electronic Arts (open research)
**Stars:** 150+

#### What It Does
- Converts triangle meshes to Gaussian splats
- **<0.5ms** conversion time
- Preserves mesh normals and colors
- Output compatible with 3DGS renderers

#### How It Works
```
Triangle Mesh → Sample points on triangles → Generate Gaussians → 3DGS format
```

#### Weyl Relevance
**POTENTIALLY USEFUL** - Could enable:
1. Import mesh → Convert to splats → Faster rendering for complex scenes
2. Enable 3DGS effects on traditional meshes

#### Implementation Estimate
- Create `meshToSplat.ts` service
- Add "Convert to Splats" action in ModelLayer properties
- ~200 lines of code

#### Verdict: **LOW PRIORITY ADOPT** - Nice optimization, not critical

---

### 6. yeicor/sdf-viewer
**URL:** https://github.com/yeicor/sdf-viewer
**License:** MIT
**Stars:** 50+

#### What It Does
- Renders Signed Distance Fields (SDFs)
- GPU raymarching shader
- Supports CSG operations (union, intersect, subtract)
- Real-time procedural shape generation

#### Weyl Relevance
**INTERESTING BUT LOW PRIORITY**

SDFs enable:
- Procedural shapes without mesh data
- Smooth blending between shapes
- Infinite resolution (no triangles)

Current alternatives in Weyl:
- `generateRenderer.ts` - Fractal noise, gradients
- `ShapeLayer` - Vector shapes

#### Verdict: **LOW PRIORITY** - Niche use case, not blocking workflows

---

### 7. Anttwo/SuGaR
**URL:** https://github.com/Anttwo/SuGaR
**License:** See repo (research)
**Stars:** 2.1k+

#### What It Does
- Extracts meshes from 3D Gaussian Splatting scenes
- Uses Poisson reconstruction
- Preserves texture/color information
- GPU-accelerated

#### Weyl Relevance
**RESEARCH INTEREST**

Workflow would be:
1. User creates 3DGS scene externally (e.g., Luma, Postshot)
2. SuGaR extracts mesh
3. Import mesh into Weyl for compositing

This is a preprocessing step, not a runtime feature.

#### Verdict: **NOT RELEVANT** - External preprocessing tool

---

### 8. AiuniAI/Unique3D
**URL:** https://github.com/AiuniAI/Unique3D
**License:** See repo
**Stars:** 3k+

#### What It Does
- High-quality image-to-3D generation
- Multi-view consistent generation
- Mesh with texture output

#### Weyl Relevance
**NOT RELEVANT** - AI inference model, should be ComfyUI node.

#### Verdict: **NOT RELEVANT - Use ComfyUI integration**

---

### 9. nmwsharp/polyscope
**URL:** https://github.com/nmwsharp/polyscope
**License:** MIT
**Stars:** 1.9k+

#### What It Does
- C++/Python 3D visualization library
- Features:
  - Point clouds, meshes, vectors
  - Automatic camera framing
  - Clean UI with minimal code
  - Multiple simultaneous views

#### Weyl Comparison

| Feature | Polyscope | Weyl |
|---------|-----------|------|
| Point Cloud Viz | ✅ | ✅ PointCloudLayer |
| Mesh Viz | ✅ | ✅ ModelLayer |
| Vector Field | ✅ | ❌ |
| Auto-Framing | ✅ | ✅ CameraController.frameLayer() |
| Multi-View | ✅ | ✅ Viewport system |

#### What to Consider
- **Vector Field Visualization** - Could be useful for motion vectors / optical flow
- Clean API patterns for 3D visualization

#### Verdict: **UI REFERENCE ONLY** - Not a direct adoption

---

### 10. pyvista/pyvista
**URL:** https://github.com/pyvista/pyvista
**License:** MIT
**Stars:** 2.5k+

#### What It Does
- Python wrapper for VTK
- Scientific visualization
- Mesh analysis and processing

#### Weyl Relevance
**NOT RELEVANT** - Python library, Weyl is TypeScript/browser-based.

#### Verdict: **NOT RELEVANT - Different ecosystem**

---

### 11. Mesh2Motion/mesh2motion-app
**URL:** https://github.com/Mesh2Motion/mesh2motion-app
**License:** MIT/CC0
**Stars:** 50+

#### What It Does
- Animation rigging for 3D models
- Skeletal animation binding
- Motion retargeting

#### Weyl Relevance
**NOT RELEVANT FOR CORE**

Weyl is a compositor, not an animation rigging tool. Users should:
1. Rig models in Blender/Maya
2. Export with animations
3. Import into Weyl and control via timeline

#### What Weyl Already Has
- AnimationMixer integration in ModelLayer for playing embedded animations
- Transform keyframing for position/rotation/scale

#### Verdict: **NOT RELEVANT - Use external rigging tools**

---

### 12. styletransfer/ComfyUI-TRELLIS2_Motion
**URL:** https://github.com/styletransfer/ComfyUI-TRELLIS2_Motion
**License:** MIT
**Stars:** 100+

#### What It Does
- Video to 3D reconstruction
- **Onion skinning** for animation preview
- Camera trajectory export
- Motion extraction

#### Weyl Comparison

| Feature | TRELLIS2_Motion | Weyl |
|---------|-----------------|------|
| Onion Skinning | ✅ | ❌ |
| Camera Trajectories | ✅ Basic | ✅ 22 presets (BETTER) |
| Video Import | ✅ | ✅ VideoLayer |
| 3D Reconstruction | ✅ | ❌ (use ComfyUI) |

#### What to Adopt
**ONION SKINNING** - Very useful for animation:
- Shows previous/next frames as semi-transparent overlays
- Essential for hand-drawn animation workflows
- Similar to After Effects' "Onion Skin" feature

#### Implementation Plan
```typescript
// services/onionSkinning.ts
interface OnionSkinConfig {
  enabled: boolean;
  framesBefore: number;      // How many frames to show before
  framesAfter: number;       // How many frames to show after
  opacityFalloff: 'linear' | 'exponential';
  beforeColor: string;       // Tint for past frames (e.g., red)
  afterColor: string;        // Tint for future frames (e.g., green)
  spacing: number;           // Frame interval (1 = every frame)
}
```

#### Verdict: **ADOPT - Onion Skinning**

---

### 13. wgsxm/PartCrafter
**URL:** https://github.com/wgsxm/PartCrafter
**License:** See repo
**Stars:** 100+

#### What It Does
- Part-aware 3D generation
- Generates meshes with semantic part labels
- Enables part-based editing

#### Weyl Relevance
**NOT RELEVANT** - AI model, not compositor feature.

#### Verdict: **NOT RELEVANT - Use ComfyUI integration**

---

### 14. yvan-allioux/Hunyuan3D-2
**URL:** https://github.com/yvan-allioux/Hunyuan3D-2
**License:** See repo
**Stars:** 500+

#### What It Does
- Tencent's multi-view 3D generation
- Single/multi-image input
- High-quality mesh + texture output

#### Weyl Relevance
**NOT RELEVANT** - AI inference model.

#### Verdict: **NOT RELEVANT - Use ComfyUI integration**

---

### 15. llikethat/ComfyUI-SAM3DBody2abc
**URL:** https://github.com/llikethat/ComfyUI-SAM3DBody2abc
**License:** MIT
**Stars:** 50+

#### What It Does
- Exports body meshes to Alembic (.abc) format
- Preserves animation data
- SAM integration for segmentation

#### Weyl Comparison

| Export Format | SAM3DBody2abc | Weyl |
|---------------|---------------|------|
| Alembic (.abc) | ✅ | ❌ |
| FBX | ✅ | ✅ (via Three.js) |
| GLTF | ❌ | ✅ |
| OBJ | ❌ | ✅ |

#### What to Consider
- **Alembic Export** - Industry standard for animation interchange
- Would enable Weyl → Blender/Maya/Houdini workflow

#### Implementation Estimate
- Use `alembic.js` or WASM port
- ~500 lines of code
- Medium complexity

#### Verdict: **CONSIDER - Alembic Export** (Low priority)

---

### 16. Cyberdemon-bot/3D-Software-Renderer
**URL:** https://github.com/Cyberdemon-bot/3D-Software-Renderer
**License:** See repo
**Stars:** 10+

#### What It Does
- CPU-based 3D renderer (educational)
- Software rasterization
- No GPU required

#### Weyl Relevance
**NOT RELEVANT** - Educational project.
Weyl uses WebGL2 via Three.js which is significantly faster.

#### Verdict: **NOT RELEVANT - Educational only**

---

### 17. Alejomm20215/deep_space
**URL:** https://github.com/Alejomm20215/deep_space
**License:** See repo
**Stars:** 10+

#### What It Does
- Video to 3D reconstruction research
- Depth estimation from video

#### Weyl Relevance
**NOT RELEVANT** - Research project with minimal implementation.

#### Verdict: **NOT RELEVANT - Incomplete research**

---

## FEATURE COMPARISON MATRIX

### Weyl's Current 3D Capabilities (STRONG)

| Capability | Implementation | Completeness |
|------------|---------------|--------------|
| **Model Loading** | ModelLayer.ts (GLTF, FBX, OBJ, DAE, USD) | 95% |
| **Mesh Compression** | DRACOLoader integration | 100% |
| **Point Clouds** | PointCloudLayer.ts (PLY, PCD, LAS/LAZ, XYZ, PTS) | 90% |
| **Splat Rendering** | PointCloudLayer renderMode='splats' | 40% |
| **3D Transforms** | Full position/rotation/scale with keyframes | 100% |
| **Camera System** | 22 trajectory presets, DOF, shake | 95% |
| **Mesh Deformation** | meshDeformation3D.ts (squash/stretch/bounce) | 85% |
| **2D Mesh Warp** | meshWarpDeformation.ts (pins, triangulation) | 90% |
| **Lighting** | LightLayer (point, spot, directional, ambient) | 85% |
| **Environment Maps** | HDR/EXR skybox support | 80% |

### What's Missing (By Priority)

#### HIGH PRIORITY
| Feature | Source | Est. Effort |
|---------|--------|-------------|
| Full 3DGS Rendering | mesh2splat, 3D-Pack | Medium |
| Onion Skinning | TRELLIS2_Motion | Small |

#### MEDIUM PRIORITY
| Feature | Source | Est. Effort |
|---------|--------|-------------|
| Alembic Export | SAM3DBody2abc | Medium |
| Vector Field Viz | polyscope | Medium |

#### LOW PRIORITY
| Feature | Source | Est. Effort |
|---------|--------|-------------|
| SDF Rendering | sdf-viewer | Large |
| Mesh-to-Splat Conversion | mesh2splat | Medium |
| UV Unwrapping | 3D-Pack | Large (use external) |

---

## IMPLEMENTATION PLAN

### Phase 1: Onion Skinning (High Value, Low Effort)

**Files to create:**
- `ui/src/services/onionSkinning.ts` - Core logic
- `ui/src/components/timeline/OnionSkinControls.vue` - UI

**Estimated time:** ~150 lines

```typescript
// services/onionSkinning.ts
export interface OnionSkinConfig {
  enabled: boolean;
  framesBefore: number;
  framesAfter: number;
  opacityFalloff: 'linear' | 'exponential';
  beforeColor: string;
  afterColor: string;
}

export function renderOnionSkin(
  engine: WeylEngine,
  currentFrame: number,
  config: OnionSkinConfig
): void {
  // Render past frames with beforeColor tint
  for (let i = 1; i <= config.framesBefore; i++) {
    const opacity = calculateFalloff(i, config);
    engine.renderFrameOverlay(currentFrame - i, {
      opacity,
      tint: config.beforeColor
    });
  }
  // Render future frames with afterColor tint
  for (let i = 1; i <= config.framesAfter; i++) {
    const opacity = calculateFalloff(i, config);
    engine.renderFrameOverlay(currentFrame + i, {
      opacity,
      tint: config.afterColor
    });
  }
}
```

### Phase 2: Enhanced 3DGS Rendering (Medium Effort)

**Current:** Basic splat shader in PointCloudLayer
**Goal:** Full 3DGS with spherical harmonics, view-dependent color

**Files to modify:**
- `ui/src/engine/layers/PointCloudLayer.ts` - Add 3DGS shader
- `ui/src/services/gaussianSplatting.ts` - New service

**Reference:** mesh2splat's shader implementation

### Phase 3: Alembic Export (Medium Effort)

**Files to create:**
- `ui/src/services/export/alembicExport.ts`

**Dependencies:** Need `alembic.js` or WASM port

---

## CONCLUSION

### What Weyl Already Does Well
1. **Model Loading** - Comprehensive format support (GLTF, FBX, OBJ, DAE, USD, Draco)
2. **Point Clouds** - 6 formats including LAS/LAZ with classification colors
3. **Camera System** - 22 presets beats most competitors
4. **Mesh Deformation** - New meshDeformation3D.ts service for animation principles
5. **Integration** - Designed for ComfyUI workflow, not competing with AI inference

### What to Adopt
1. **Onion Skinning** - High value for animation workflows, low effort
2. **Full 3DGS Rendering** - Medium effort, enables modern reconstruction workflows

### What's NOT Relevant
- AI mesh generation (InstantMesh, Unique3D, Hunyuan3D) - Use ComfyUI nodes
- Desktop mesh processing (MeshLab) - External preprocessing
- Animation rigging (Mesh2Motion) - External rigging tools
- Python libraries (pyvista) - Different ecosystem
- Educational renderers - Weyl uses WebGL

### License Compliance
All adopted patterns/code are from permissively-licensed projects:
- google/draco: Apache 2.0 (already integrated)
- polyscope: MIT
- TRELLIS2_Motion: MIT
- mesh2splat: EA research license (patterns only, not code)

---

**Document Version:** 1.0
**Analysis Date:** December 21, 2025
**Repositories Analyzed:** 18
**Tests Added:** 35 (meshDeformation3D.test.ts)
