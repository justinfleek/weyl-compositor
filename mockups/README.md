# Lattice UI Mockups

Interactive HTML/CSS mockups based on the reference screenshots in `screenshots/new-ui/`.

## How to View

Open any `.html` file in a web browser:

```bash
# Windows
start mockups/01-workspace-layout.html

# macOS
open mockups/01-workspace-layout.html

# Linux
xdg-open mockups/01-workspace-layout.html
```

## Mockup Files

| File | Description |
|------|-------------|
| `01-workspace-layout.html` | Full workspace with floating panels, toolbar, timeline, AI widget |
| `02-graph-editor.html` | Graph editor, easing dropdown, snapping options, keyframe shapes legend |
| `03-timeline-clips.html` | Timeline with pill-shaped clips, node connections, waveforms |
| `04-components.html` | Buttons, inputs, sliders, toggles, segmented controls, color picker |

## Design Specifications

### Color Palette
- **Void** (background): `#050505`
- **Surface 1** (panels): `#121212`
- **Accent**: `#8B5CF6` (purple)
- **Accent Gradient**: `linear-gradient(135deg, #8B5CF6, #EC4899)`

### Key Principles
1. **Floating Islands**: Panels float with 20px gaps
2. **16px Border Radius**: Heavy rounding on panels
3. **No Borders**: Separation via surface brightness and shadows
4. **Purple-Pink Gradient**: Used for accents, sliders, curves
5. **Semantic Keyframe Shapes**: 16 distinct shapes encode easing type

### Reference Screenshots
- `screenshots/new-ui/ref-2.png` - Main UI layout
- `screenshots/new-ui/original-*.webp` - Component details and keyframe shapes
