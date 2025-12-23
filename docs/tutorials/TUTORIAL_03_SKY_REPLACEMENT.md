# Tutorial 3: Sky Replacement with AI Layer Decomposition

**Complexity:** Advanced
**Requirements:** GPU with 16GB+ VRAM, Qwen model (28.8GB)

---

## Overview

Use AI-powered layer decomposition to automatically separate an image into depth-sorted layers, then replace the sky with seamless compositing.

---

## 1. Model Setup (First Time Only)

1. Open **Layer Decomposition Panel** (right sidebar)
2. If model not installed, click **Download Model**
   - Downloads 28.8GB Qwen Image Layered model
   - Progress shown in panel
3. Wait for download and verification

---

## 2. Decompose Your Image

1. **Upload image** - drag to panel or click Upload
2. Set **Number of Layers** (3-10 recommended)
3. Enable **Auto Depth Estimation**
4. Click **Decompose**

**Result:** Image splits into RGBA layers with automatic depth ordering

---

## 3. Review Decomposed Layers

Each layer includes:
- Preview thumbnail
- AI-generated label (e.g., "Sky", "Mountains", "Foreground")
- Depth estimate (0-100)
- Suggested Z-position

**Adjust if needed** by editing Z-position in Properties Panel

---

## 4. Create Compositor Layers

1. Click **Create Layers**
2. Options:
   - **Group Layers** - wraps in control layer
   - **Z-Space Scale** - range for 3D positioning
3. Layers appear in Timeline, sorted by depth

---

## 5. Replace the Sky

1. **Import** new sky image/video (`Ctrl+I`)
2. Find the sky layer (usually labeled "Sky" or "Background")
3. **Select** the sky layer
4. In Properties Panel, click **Replace Source**
5. Choose your new sky asset

---

## 6. Refine Edges

If edges between layers are harsh:

1. Select foreground layer
2. Add **Matte Edge** effect:
   - **Feather**: Soften edges (1-5px typical)
   - **Choke**: Shrink/expand edge (-5 to +5px)
   - **Spill Suppress**: Remove color spill

---

## 7. Color Match

Apply color effects to match new sky to scene:

1. **Hue/Saturation** - match overall warmth
2. **Curves** - adjust contrast and color balance
3. **Exposure** - match brightness levels

---

## 8. Add Atmosphere

For realistic compositing:

1. Add **Solid Layer** with sky-matched color
2. Set **Blend Mode** to Screen or Add
3. Lower **Opacity** to 10-20%
4. Position behind foreground, above new sky

---

## 9. Animate (Optional)

For parallax/3D effect:

1. Select **Camera** layer (or create one)
2. Animate camera position slowly
3. Layers move at different speeds due to Z-depth

---

## 10. Export

1. Press `Ctrl+M`
2. Choose format:
   - **PNG Sequence** for AI workflows
   - **MP4** for video
3. Export

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model download fails | Check disk space (28GB needed) |
| Decomposition slow | Normal: 30-60 seconds on good GPU |
| Poor layer separation | Try different layer count |
| Harsh edges | Increase feather, check alpha |
| Colors don't match | Use Curves on foreground layers |

---

## Key Endpoints (For Developers)

```
POST /lattice/decomposition/decompose   # Run decomposition
POST /lattice/decomposition/download    # Download model
GET  /lattice/decomposition/status      # Check model status
```

---

*Compatibility: 90% - Core features complete*
