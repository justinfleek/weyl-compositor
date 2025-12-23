# Lattice Compositor Design System

**Version:** 1.0 | **Date:** December 23, 2025

This document defines the complete design system for the Lattice Compositor UI. All components MUST use these CSS variables - never hardcode colors or spacing values.

---

## Design Philosophy

### "Dense Islands, Empty Ocean"

The UI follows a **floating island architecture**:
- Content-rich panels float on a dark void background
- Generous 20px gutters between panels
- Rounded corners (8px) with soft shadows
- No visible borders - depth conveyed through shadows only
- Creates clear visual hierarchy and reduces cognitive load

---

## Color Tokens

### Surface Hierarchy (5 Levels)

```css
--lattice-void: #050505;        /* App background - THE DARKEST */
--lattice-surface-0: #0A0A0A;   /* Canvas background */
--lattice-surface-1: #121212;   /* Panel backgrounds */
--lattice-surface-2: #1A1A1A;   /* Cards, raised sections */
--lattice-surface-3: #222222;   /* Dropdowns, tooltips */
--lattice-surface-4: #2A2A2A;   /* Highest elevation */
```

### Accent Colors (Purple/Pink Gradient)

```css
--lattice-accent: #8B5CF6;           /* Primary purple */
--lattice-accent-secondary: #EC4899; /* Secondary pink */
--lattice-accent-gradient: linear-gradient(135deg, #8B5CF6, #EC4899);
--lattice-accent-hover: #A78BFA;     /* Lighter purple for hover */
--lattice-accent-muted: rgba(139, 92, 246, 0.2);  /* For backgrounds */
```

### Text Colors

```css
--lattice-text-primary: #E5E5E5;     /* Main text */
--lattice-text-secondary: #9CA3AF;   /* Labels, descriptions */
--lattice-text-muted: #6B7280;       /* Disabled, hints */
--lattice-text-inverse: #050505;     /* Text on light backgrounds */
```

### Border Colors

```css
--lattice-border-subtle: #2A2A2A;    /* Subtle dividers */
--lattice-border-default: #333333;   /* Normal borders */
--lattice-border-hover: #444444;     /* Hover state */
```

### Status Colors

```css
--lattice-success: #10B981;          /* Success green */
--lattice-warning: #F59E0B;          /* Warning amber */
--lattice-error: #EF4444;            /* Error red */
--lattice-info: #3B82F6;             /* Info blue */
```

---

## Spacing Tokens

```css
--lattice-gutter: 20px;              /* Panel separation */
--lattice-gap-xl: 24px;              /* Extra large gaps */
--lattice-gap-lg: 16px;              /* Large gaps */
--lattice-gap-md: 8px;               /* Medium gaps */
--lattice-gap-sm: 4px;               /* Small gaps */
--lattice-gap-xs: 2px;               /* Extra small gaps */
```

---

## Border Radius Tokens

```css
--lattice-radius-xs: 2px;            /* Inputs, small elements */
--lattice-radius-sm: 4px;            /* Buttons, chips */
--lattice-radius-md: 6px;            /* Cards, dropdowns */
--lattice-radius-lg: 8px;            /* Panels */
--lattice-radius-xl: 12px;           /* Large cards */
--lattice-radius-pill: 999px;        /* Pills, fully rounded */
```

---

## Shadow Tokens

```css
--lattice-shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
--lattice-shadow-md: 0 4px 8px rgba(0,0,0,0.3);
--lattice-shadow-lg: 0 8px 16px rgba(0,0,0,0.4);
--lattice-shadow-panel: 0 8px 32px rgba(0,0,0,0.4);
--lattice-shadow-dropdown: 0 4px 12px rgba(0,0,0,0.3);
--lattice-shadow-button: 0 2px 4px rgba(0,0,0,0.2);
```

---

## Typography

### Font Stack

```css
--lattice-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--lattice-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes

```css
--lattice-text-xs: 10px;
--lattice-text-sm: 12px;
--lattice-text-base: 14px;
--lattice-text-lg: 16px;
--lattice-text-xl: 18px;
--lattice-text-2xl: 24px;
```

### Font Weights

```css
--lattice-font-normal: 400;
--lattice-font-medium: 500;
--lattice-font-semibold: 600;
--lattice-font-bold: 700;
```

---

## 6 Gradient Themes

The app supports 6 switchable color themes via `themeStore.ts`:

| Theme | Primary | Secondary | CSS Class |
|-------|---------|-----------|-----------|
| **Violet** (default) | `#8B5CF6` | `#EC4899` | `.theme-violet` |
| **Ocean** | `#06B6D4` | `#3B82F6` | `.theme-ocean` |
| **Sunset** | `#F59E0B` | `#EF4444` | `.theme-sunset` |
| **Forest** | `#10B981` | `#06B6D4` | `.theme-forest` |
| **Ember** | `#EF4444` | `#F97316` | `.theme-ember` |
| **Mono** | `#6B7280` | `#9CA3AF` | `.theme-mono` |

### Theme Usage

```typescript
import { useThemeStore } from '@/stores/themeStore';

const themeStore = useThemeStore();
themeStore.setTheme('ocean'); // Switch to ocean theme
```

---

## Component Patterns

### Panel Component

```vue
<template>
  <div class="lattice-panel">
    <div class="lattice-panel-header">
      <h3>Panel Title</h3>
    </div>
    <div class="lattice-panel-content">
      <!-- Content -->
    </div>
  </div>
</template>

<style scoped>
.lattice-panel {
  background: var(--lattice-surface-1);
  border-radius: var(--lattice-radius-lg);
  box-shadow: var(--lattice-shadow-panel);
}

.lattice-panel-header {
  padding: var(--lattice-gap-md) var(--lattice-gap-lg);
  border-bottom: 1px solid var(--lattice-border-subtle);
}

.lattice-panel-content {
  padding: var(--lattice-gap-lg);
}
</style>
```

### Button Variants

```css
/* Primary Button */
.lattice-btn-primary {
  background: var(--lattice-accent-gradient);
  color: white;
  border: none;
  border-radius: var(--lattice-radius-sm);
  padding: var(--lattice-gap-sm) var(--lattice-gap-md);
}

/* Secondary Button */
.lattice-btn-secondary {
  background: var(--lattice-surface-2);
  color: var(--lattice-text-primary);
  border: 1px solid var(--lattice-border-default);
}

/* Ghost Button */
.lattice-btn-ghost {
  background: transparent;
  color: var(--lattice-text-secondary);
  border: none;
}
```

### Input Styling

```css
.lattice-input {
  background: var(--lattice-surface-2);
  border: 1px solid var(--lattice-border-default);
  border-radius: var(--lattice-radius-xs);
  color: var(--lattice-text-primary);
  padding: var(--lattice-gap-sm) var(--lattice-gap-md);
}

.lattice-input:focus {
  border-color: var(--lattice-accent);
  outline: none;
  box-shadow: 0 0 0 2px var(--lattice-accent-muted);
}
```

---

## Semantic Keyframe Shapes

16 unique SVG shapes map to easing types for instant visual recognition:

| Shape | Easing Type | SVG Path |
|-------|-------------|----------|
| Diamond (◆) | Linear | `M0,-6 L6,0 L0,6 L-6,0 Z` |
| Circle | Hold/Step | `circle r=5` |
| Triangle | Ease In | `M0,-6 L6,6 L-6,6 Z` |
| Inverted Triangle | Ease Out | `M-6,-6 L6,-6 L0,6 Z` |
| Hourglass | Ease In-Out | Two triangles |
| Star (5-point) | Bounce | Star path |
| Octagon | Elastic | 8-sided polygon |
| Pentagon | Cubic | 5-sided polygon |
| Hexagon | Expo | 6-sided polygon |
| Sparkle | Back | 4-pointed star |
| Pill | Bezier (custom) | Rounded rectangle |
| Double Diamond | Sine | Two diamonds |
| Slash Diamond | Circ | Rotated diamond |
| Arrow Diamond | Quint | Diamond with arrow |
| Cross | Spring | Plus shape |
| Square | Generic ease | `rect` |

Defined in `styles/keyframe-shapes.ts`.

---

## Color Reference Quick Guide

| Purpose | Variable | Hex |
|---------|----------|-----|
| App background | `--lattice-void` | `#050505` |
| Canvas background | `--lattice-surface-0` | `#0A0A0A` |
| Panel backgrounds | `--lattice-surface-1` | `#121212` |
| Raised elements | `--lattice-surface-2` | `#1A1A1A` |
| Dropdowns | `--lattice-surface-3` | `#222222` |
| Primary accent | `--lattice-accent` | `#8B5CF6` |
| Secondary accent | `--lattice-accent-secondary` | `#EC4899` |
| Main text | `--lattice-text-primary` | `#E5E5E5` |
| Secondary text | `--lattice-text-secondary` | `#9CA3AF` |
| Muted text | `--lattice-text-muted` | `#6B7280` |

---

## File Locations

| File | Purpose |
|------|---------|
| `ui/src/styles/design-tokens.css` | CSS custom properties |
| `ui/src/styles/keyframe-shapes.ts` | Keyframe SVG definitions |
| `ui/src/stores/themeStore.ts` | Theme state management |
| `ui/src/components/ui/ThemeSelector.vue` | Theme picker component |

---

## Migration Notes

### Deprecated Colors (Do Not Use)

| Old Value | Replacement |
|-----------|-------------|
| `#1a1a2e` | `var(--lattice-void)` or `#050505` |
| `#16213e` | `var(--lattice-surface-0)` or `#0A0A0A` |
| `#1a1a38` | `var(--lattice-surface-1)` or `#121212` |

### December 2025 Migration

All hardcoded `#1a1a2e` colors were replaced with `#050505` in:
- `types/project.ts`
- `compositorStore.ts`
- `ThreeCanvas.vue`
- `ExportPanel.vue`
- `extension.js`
- `LatticeEngine.ts`

---

**Document Version:** 1.0
**Last Updated:** December 23, 2025
