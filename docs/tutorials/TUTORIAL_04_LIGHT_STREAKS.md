# Tutorial 4: Light Streaks Effect

**Based on:** "Light Streaks / iPod Commercial Effect" by Video Copilot
**Complexity:** Intermediate
**Time:** 15-20 minutes

---

## Overview

Create animated light trails with glow effects - the iconic iPod commercial look.

---

## 1. Create the Composition

1. Press `Ctrl+K` for Composition Settings
2. Set: **1920x1080**, **16fps**, **5 seconds** (81 frames)
3. Set background to **dark gradient** (purple to black)

---

## 2. Draw the Light Path

1. Press `P` for Pen tool
2. Draw a flowing curve (will be the light trail path)
3. In Properties Panel:
   - **Stroke Width**: 4-8px
   - **Stroke Color**: Bright color (cyan, magenta, etc.)
   - **Fill**: None

---

## 3. Animate with Trim Paths

1. Select spline layer
2. In Properties Panel, find **Trim Paths**:
   - **Start**: 0%
   - **End**: 0%
3. Enable animation on **End**:
   - Frame 0: End = 0%
   - Frame 40: End = 100%
4. Enable animation on **Start** (delayed):
   - Frame 10: Start = 0%
   - Frame 50: Start = 100%

**Result:** Line draws on, then draws off

---

## 4. Add Glow Effect

1. Select the spline layer
2. Add Effect → **Glow**
3. Settings:
   - **Radius**: 20-30
   - **Intensity**: 1.5-2.0
   - **Threshold**: 0%

---

## 5. Add Motion Trail (Echo Effect)

1. Add Effect → **Echo** (if available)
2. Or create manually:
   - Duplicate layer 3-5 times
   - Offset each 2-3 frames
   - Reduce opacity progressively (80%, 60%, 40%, 20%)
   - Use Add blend mode

---

## 6. Add Motion Blur

1. Enable **Motion Blur** on timeline (switch icon)
2. Enable per-layer motion blur toggle
3. In Composition Settings:
   - **Shutter Angle**: 180° (default)

---

## 7. Create Color Variations

Duplicate the effect with different colors:

1. Duplicate the layer group
2. Change stroke color (pink, yellow, white)
3. Offset timing slightly
4. Stack with Add blend mode

---

## 8. Add Background Gradient

1. Create **Solid Layer**
2. Add Effect → **Gradient Ramp**
3. Settings:
   - **Start Color**: Dark purple (#1a0a2e)
   - **End Color**: Black (#000000)
   - **Type**: Radial
4. Send to back

---

## 9. Add Silhouette (Optional)

For iPod-style:

1. Import silhouette image
2. Add Effect → **Fill** (pure black)
3. Position over light streaks

---

## 10. Polish & Export

1. Add subtle **Vignette** to background
2. Adjust timing with curve editor
3. Press `Ctrl+M` to export

---

## Key Effects Used

| Effect | Purpose |
|--------|---------|
| **Trim Paths** | Animate stroke drawing |
| **Glow** | Light emission look |
| **Echo** | Motion trails |
| **Motion Blur** | Smooth movement |
| **Gradient Ramp** | Background design |
| **Fill** | Silhouette creation |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Glow too harsh | Reduce intensity, increase radius |
| Trail too long | Reduce echo number, increase decay |
| Path jaggy | Increase spline smoothness |
| Colors washed out | Use Add blend mode |

---

*Compatibility: 95% - All core features work*
