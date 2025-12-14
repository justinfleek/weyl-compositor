# Weyl Compositor

Motion graphics compositor for ComfyUI with text animation, 3D camera, and AI video export.

## Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/justinfleek/weyl-compositor.git
pip install -r weyl-compositor/requirements.txt
```

Restart ComfyUI.

**No build step required** - pre-built files are included.

## Usage

Click the video icon in the sidebar, or add the **Weyl Motion Compositor** node to your workflow.

### Node Workflow

1. Connect source image and depth map to the compositor node
2. Queue the workflow - compositor receives inputs
3. Create your motion graphics
4. Export back to ComfyUI for video generation

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Ctrl+Z** | Undo |
| **Ctrl+Shift+Z** or **Ctrl+Y** | Redo |
| **Delete** or **Backspace** | Delete selected layer(s) |
| **Space** | Play/Pause |
| **Home** | Go to start |
| **End** | Go to end |
| V | Select tool |
| P | Pen tool |
| T | Text tool |
| H | Hand tool |
| Space+drag | Pan canvas |

## Development

For contributors modifying the frontend:

```bash
cd ui
npm install
npm run dev      # Development server
npm run build    # Build to web/dist/
```

## License

MIT
