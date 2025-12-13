# Weyl Compositor - Competitive Analysis

Comprehensive analysis of 9 competitor repositories for feature gap identification and architecture inspiration.

## Executive Summary

| Competitor | Language | Key Strength | Status |
|------------|----------|--------------|--------|
| **ComfyUI-AE-Animation** | Python/Vue | Full AE paradigm, 3D camera, WebGPU | Direct competitor |
| **mojs** | JavaScript | Comprehensive easing library | Animation reference |
| **astrofox** | JavaScript | Audio reactivity, effects pipeline | Audio features |
| **friction** | C++ | Professional animation software | Architecture reference |
| **movis** | Python | Protocol-based extensibility | Clean API design |
| **motiongfx** | Rust | Type-erased ECS animations | Performance patterns |
| **motionblur** | Python | Procedural motion blur | Algorithm reference |
| **nanim** | Nim | GPU rendering, tween system | Rendering patterns |
| **motionity** | JavaScript | Web motion graphics editor | UX reference |

---

## Feature Matrix

### Core Animation Features

| Feature | Weyl | ComfyUI-AE | mojs | friction | movis | nanim |
|---------|------|------------|------|----------|-------|-------|
| Keyframe animation | Partial | Full | Full | Full | Full | Full |
| Linear interpolation | Yes | Yes | Yes | Yes | Yes | Yes |
| Easing functions | No | No | **35+** | Bezier | **35+** | **10+** |
| Bezier curves (easing) | No | No | Yes | Yes | Yes | Yes |
| Path animation | No | Yes | Yes | Yes | No | Yes |
| Expression system | No | No | No | Yes | No | No |
| Graph editor | No | No | No | Yes | No | No |

### Layer System

| Feature | Weyl | ComfyUI-AE | friction | movis | astrofox |
|---------|------|------------|----------|-------|----------|
| Layer hierarchy | Flat | Flat | **Tree** | Flat | Tree |
| Layer groups | No | No | Yes | No | Yes |
| Blend modes | No | No | Yes | **15+** | **30+** |
| Layer masks | No | Yes | Yes | No | Yes |
| Alpha compositing | No | Yes | Yes | Yes | Yes |
| Z-depth sorting | No | Yes (3D) | No | No | No |

### Transform System

| Feature | Weyl | ComfyUI-AE | friction | nanim |
|---------|------|------------|----------|-------|
| Position (X, Y) | Yes | Yes | Yes | Yes |
| Position Z (depth) | Partial | Yes | No | Yes |
| Scale | Yes | Yes | Yes | Yes |
| Rotation | Yes | Yes | Yes | Yes |
| Anchor point | Partial | Yes | Yes | Yes |
| 3D rotation (X, Y, Z) | No | **Yes** | No | No |
| Perspective projection | No | **Yes** | No | No |
| Camera system | No | **Full 3D** | No | No |

### Effects System

| Feature | Weyl | astrofox | friction | movis |
|---------|------|----------|----------|-------|
| Blur | No | Yes | Yes | Yes |
| Glow/Bloom | No | Yes | No | Yes |
| Color adjust | No | No | Yes | Yes |
| Drop shadow | No | No | Yes | Yes |
| Custom shaders | No | **Yes** | Yes | No |
| Path effects | No | No | **Yes** | No |
| Motion blur | No | No | Yes | No |

### Audio Features

| Feature | Weyl | astrofox | movis |
|---------|------|----------|-------|
| Audio import | No | Yes | Yes |
| Waveform display | No | Yes | No |
| Audio reactivity | No | **Full** | No |
| FFT analysis | No | **Yes** | No |
| Audio-driven animation | No | **Yes** | No |

### Rendering

| Feature | Weyl | ComfyUI-AE | nanim | astrofox |
|---------|------|------------|-------|----------|
| Canvas 2D | Yes | Yes | No | Yes |
| WebGL | No | Fallback | No | Yes |
| WebGPU | No | **Yes** | No | No |
| NanoVG/OpenGL | No | No | **Yes** | No |
| Video export | No | Yes | Yes | Yes |
| Frame caching | No | Yes | No | Yes |

---

## Gap Analysis

### Critical Gaps (Priority 1)

1. **No Easing Functions**
   - Current: Linear interpolation only
   - Competitors: mojs has 35+ easings, nanim has 10+, movis has 35+
   - Impact: Animations feel robotic and unnatural

2. **No Blend Modes**
   - Current: No layer compositing
   - Competitors: astrofox has 30+ modes, movis has 15+
   - Impact: Can't create professional compositions

3. **No Effects Pipeline**
   - Current: No effects
   - Competitors: All have blur, glow, color effects minimum
   - Impact: Limited creative capability

4. **No Alpha Compositing**
   - Current: Layers overwrite, no transparency blending
   - Impact: Can't create layered compositions

### Important Gaps (Priority 2)

5. **No Bezier Curve Easing**
   - mojs: Custom bezier via `easing.bezier(cp1x, cp1y, cp2x, cp2y)`
   - friction: GraphKey with control handles
   - Impact: Can't match industry-standard easing curves

6. **No Graph Editor**
   - friction: Full curve editor for keyframe interpolation
   - Impact: Limited precision control over animations

7. **No 3D Camera System**
   - ComfyUI-AE: Full MVP matrix, perspective projection
   - Impact: Limited to 2D compositions

8. **No Path Animation**
   - ComfyUI-AE: Bezier path motion
   - mojs: SVG path-based motion
   - Impact: Objects can only animate along straight lines

### Nice-to-Have Gaps (Priority 3)

9. **No Audio Reactivity**
   - astrofox: FFT-based reactor system
   - Impact: Can't create music visualizations

10. **No Expression System**
    - friction: JavaScript-like expressions for properties
    - Impact: Can't create procedural animations

11. **No WebGPU Rendering**
    - ComfyUI-AE: GPU-accelerated rendering
    - Impact: Performance limited on complex compositions

---

## Better Approaches Found

### 1. Animation/Easing System

**Best Practice: mojs easing implementation**
```javascript
// From mojs/src/easing/easing.coffee
sine:
  in:     (k) -> 1 - Math.cos(k * PI / 2)
  out:    (k) -> sin(k * PI / 2)
  inout:  (k) -> 0.5 * (1 - Math.cos(PI * k))

// Custom bezier support
easing.bezier(cp1x, cp1y, cp2x, cp2y)

// SVG path as easing curve
easing.path('M0,0 C0.1,0.5 0.2,0.8 1,1')
```

**Why Better:** Declarative easing definitions, custom bezier support, path-based easing for complex curves.

### 2. Timeline Architecture

**Best Practice: motiongfx track system**
```rust
// Span-based O(1) lookups
pub struct Track {
    field_lookups: Box<[(UntypedField, Span)]>,
    sequence_spans: Box<[(ActionKey, Span)]>,
    clip_arena: Box<[ActionClip]>,  // Dense contiguous storage
}

// Binary search for clips
clips.binary_search_by(|clip| {
    if target_time < clip.start { Ordering::Greater }
    else if target_time > clip.end { Ordering::Less }
    else { Ordering::Equal }
})
```

**Why Better:** Memory-efficient dense storage, O(log n) clip lookup, span-based indexing.

### 3. Effects Pipeline

**Best Practice: astrofox shader pass system**
```javascript
// Multi-pass composition
class Composer {
  render(renderer, writeBuffer, readBuffer) {
    for (const pass of this.passes) {
      if (pass.needsSwap) {
        [readBuffer, writeBuffer] = [writeBuffer, readBuffer];
      }
      pass.render(renderer, writeBuffer, readBuffer);
    }
  }
}
```

**Why Better:** Composable shader passes, automatic buffer swapping, clean separation of concerns.

### 4. Property Animation

**Best Practice: movis protocol-based design**
```python
class Effect(Protocol):
    def __call__(self, prev_image: ndarray, time: float) -> ndarray:
        """Apply effect to image at time t"""

    def get_key(self, time: float) -> Hashable:
        """Return cache key for frame caching"""
```

**Why Better:** No inheritance required, works with any callable, enables automatic caching.

### 5. Keyframe Interpolation

**Best Practice: friction GraphKey with control handles**
```cpp
class GraphKey : public Key {
    ClampedPoint c0Frame;  // Incoming bezier handle
    ClampedPoint c1Frame;  // Outgoing bezier handle
    CtrlsMode ctrlsMode;   // symmetric/corner/smooth

    T getValueAtRelFrame(qreal frame) {
        return gCubicValueAtT(segment, tFromFrame);
    }
};
```

**Why Better:** Full bezier control over interpolation curves, visual graph editing support.

### 6. Transform Matrix Stack

**Best Practice: ComfyUI-AE-Animation 3D transform**
```python
# Transform order (matches After Effects)
# Model matrix: T * A_inv * Rx * Ry * Rz * S * A
# 1. Anchor offset
# 2. Scale
# 3. Rotation (Z -> Y -> X order)
# 4. Translation
```

**Why Better:** Industry-standard transform order, 3D-ready architecture.

---

## Steal List

### Algorithms to Adapt

| Algorithm | Source | File Path | Priority |
|-----------|--------|-----------|----------|
| **Easing functions** | mojs | `/home/nixos/compositor-research/mojs/src/easing/easing.coffee` | P1 |
| **Bezier easing** | mojs | `/home/nixos/compositor-research/mojs/src/easing/approximate.babel.js` | P1 |
| **Blend modes** | astrofox | `/home/nixos/compositor-research/astrofox/src/graphics/Composer.js` | P1 |
| **Gaussian blur** | movis | `/home/nixos/compositor-research/movis/movis/effect/blur.py` | P2 |
| **Drop shadow** | movis | `/home/nixos/compositor-research/movis/movis/effect/style.py` | P2 |
| **FFT parser** | astrofox | `/home/nixos/compositor-research/astrofox/src/audio/FFTParser.js` | P3 |
| **Motion blur kernel** | motionblur | `/home/nixos/compositor-research/motionblur/motionblur.py` | P3 |
| **3D camera matrix** | ComfyUI-AE | `/home/nixos/compositor-research/ComfyUI-AE-Animation/frontend/src/composables/useTransform3D.ts` | P3 |

### Code Patterns to Adopt

| Pattern | Source | Description |
|---------|--------|-------------|
| **Declarative defaults** | mojs | `_declareDefaults()` for clean option handling |
| **Effect protocol** | movis | `__call__(image, time) -> image` interface |
| **Cache key generation** | movis | `get_key()` for automatic frame caching |
| **Pipeline registry** | motiongfx | Type-triple keyed bake/sample functions |
| **Shader pass chaining** | astrofox | `needsSwap` flag for buffer management |
| **Three-phase evaluation** | nanim | Old/current/future tween evaluation |

### Easing Functions to Implement

From mojs `/home/nixos/compositor-research/mojs/src/easing/easing.coffee`:

```typescript
// STEAL: All easing functions
export const ease = {
  linear: (t) => t,

  // Sine
  sineIn: (t) => 1 - Math.cos(t * Math.PI / 2),
  sineOut: (t) => Math.sin(t * Math.PI / 2),
  sineInOut: (t) => 0.5 * (1 - Math.cos(Math.PI * t)),

  // Quad (power of 2)
  quadIn: (t) => t * t,
  quadOut: (t) => t * (2 - t),
  quadInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic (power of 3)
  cubicIn: (t) => t * t * t,
  cubicOut: (t) => (--t) * t * t + 1,
  cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quart (power of 4)
  quartIn: (t) => t * t * t * t,
  quartOut: (t) => 1 - (--t) * t * t * t,
  quartInOut: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quint (power of 5)
  quintIn: (t) => t * t * t * t * t,
  quintOut: (t) => 1 + (--t) * t * t * t * t,
  quintInOut: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Expo (exponential)
  expoIn: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  expoOut: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  expoInOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Circ (circular)
  circIn: (t) => 1 - Math.sqrt(1 - t * t),
  circOut: (t) => Math.sqrt(1 - (--t) * t),
  circInOut: (t) => t < 0.5
    ? 0.5 * (1 - Math.sqrt(1 - 4 * t * t))
    : 0.5 * (Math.sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1),

  // Back (overshoot)
  backIn: (t) => { const c = 1.70158; return t * t * ((c + 1) * t - c); },
  backOut: (t) => { const c = 1.70158; return (--t) * t * ((c + 1) * t + c) + 1; },
  backInOut: (t) => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? 0.5 * (4 * t * t * ((c + 1) * 2 * t - c))
      : 0.5 * ((2 * t - 2) * (2 * t - 2) * ((c + 1) * (2 * t - 2) + c) + 2);
  },

  // Elastic
  elasticIn: (t) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  elasticInOut: (t) => {
    if (t === 0 || t === 1) return t;
    t *= 2;
    if (t < 1) return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
  },

  // Bounce
  bounceOut: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  bounceIn: (t) => 1 - ease.bounceOut(1 - t),
  bounceInOut: (t) => t < 0.5
    ? 0.5 * ease.bounceIn(t * 2)
    : 0.5 * ease.bounceOut(t * 2 - 1) + 0.5,

  // Custom bezier (CSS cubic-bezier compatible)
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    // Implementation from mojs approximate.babel.js
    // Uses Newton-Raphson iteration for x->t mapping
  }
};
```

### Blend Modes to Implement

From astrofox `/home/nixos/compositor-research/astrofox/src/graphics/Composer.js`:

```typescript
export enum BlendMode {
  Normal = 'normal',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  SoftLight = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion',
  Hue = 'hue',
  Saturation = 'saturation',
  Color = 'color',
  Luminosity = 'luminosity',
}
```

---

## Priority Recommendations

### Sprint 2 (Immediate)
1. **Implement easing functions** - Copy mojs easing math
2. **Add basic blend modes** - Normal, Multiply, Screen, Overlay
3. **Alpha compositing** - Proper transparency blending

### Sprint 3 (Short-term)
4. **Bezier easing curves** - Custom bezier support
5. **Blur effect** - Gaussian blur from movis
6. **Drop shadow effect** - From movis style.py
7. **Glow effect** - Blur + additive blend

### Sprint 4 (Medium-term)
8. **Graph editor UI** - Visual curve editing
9. **Path animation** - Bezier motion paths
10. **More blend modes** - Full 15+ set

### Sprint 5+ (Long-term)
11. **3D camera system** - From ComfyUI-AE
12. **Audio reactivity** - FFT-based from astrofox
13. **Expression system** - JavaScript expressions
14. **WebGPU rendering** - GPU acceleration

---

## Architecture Insights

### Recommended Architecture Changes

1. **Property System Refactor**
   - Current: Simple value storage
   - Recommended: Protocol-based with `get_key()` for caching (movis pattern)

2. **Effect Pipeline**
   - Add: `Effect` interface with `apply(canvas, time)` method
   - Add: Effect chaining with buffer management (astrofox pattern)

3. **Keyframe System**
   - Add: Per-keyframe easing selection
   - Add: Bezier control handles for graph editing
   - Add: Interpolation mode per property (stepped, linear, bezier)

4. **Render Pipeline**
   - Add: Multi-pass composition
   - Add: Frame caching with invalidation
   - Consider: WebGL/WebGPU for effects rendering

---

## Conclusion

The competitive analysis reveals significant feature gaps in Weyl Compositor, particularly in:
- Animation quality (no easing)
- Compositing (no blend modes)
- Effects (none implemented)

However, the architecture is sound and can be extended. Priority should be given to easing functions and blend modes as they provide the highest impact for user experience with relatively low implementation effort.

The mojs easing library is production-ready and can be directly adapted. The movis protocol pattern is elegant and should inform the effect system design.
