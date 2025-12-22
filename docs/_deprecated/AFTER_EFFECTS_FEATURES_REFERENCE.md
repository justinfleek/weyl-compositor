# After Effects Core Features Reference

**Purpose**: Comprehensive reference of Adobe After Effects features relevant to motion graphics compositing for comparison with Weyl Compositor implementation.

**Last Updated**: December 16, 2025

---

## 1. Layer Types

After Effects supports multiple layer types, each with specific functionality:

### Core Layer Types

#### Solid Layer
- Simple colored rectangle layer
- Properties: dimensions, color, basic 2D/3D transform
- Raster-based (vs vector Shape Layers)
- Less CPU-intensive than Shape Layers
- Cannot contain complex vector shapes or strokes
- Used for backgrounds, color overlays, masks

#### Shape Layer
- Vector-based 2D graphics
- Two path varieties: parametric (numerically defined) and Bezier (vertex-based)
- Contains: paths, strokes, fills, gradients
- Properties: Fill, Stroke, Trim Paths, Merge Paths
- Two transform sets: per-shape and per-layer
- Can be scaled infinitely without quality loss
- Supports parametric shapes (rectangle, ellipse, polygon, star)
- Layer order matters for stroke/fill/operators

#### Text Layer
- Renders text with extensive typography controls
- Per-character animation capabilities
- Properties: font family, size, weight, style, color
- Outline width/color, letter spacing, line height
- Text alignment, max width
- Animation presets for text behavior
- Behaves like Solid/Shape layers in composition space

#### Null Object
- Invisible layer (doesn't render)
- Acts as control point for animations
- Used for parenting multiple layers
- Controls transform properties when layers attached via pick whip
- Essential for complex hierarchies
- Useful for animating grouped elements together

#### Adjustment Layer
- Modifies all layers below it in layer stack
- Blank by itself, applies effects to underlying layers
- All effects cascade downward
- Keyboard shortcut: Ctrl+Alt+Y (Win) / Cmd+Opt+Y (Mac)
- Does not affect layers above it
- Can be masked to affect specific regions

#### Camera Layer
- Creates 3D perspective and depth
- Controls viewpoint in 3D space
- Properties: position, target/point of interest, FOV, near/far planes
- Supports depth of field (DOF) with aperture/blur controls
- Can be parented to null objects for control
- Animatable camera movements (dolly, pan, orbit, etc.)

#### Light Layer
- Adds realistic lighting to 3D layers
- Types: Point, Spot, Directional, Ambient, Environment
- Properties: intensity, color, cone angle (spot), shadows
- Supports HDR/EXR for environment lights
- Can cast and receive shadows on 3D layers
- Can be parented for controlled movements

#### Precomposition (Precomp) Layer
- Uses nested compositions as source
- Groups multiple layers into single manageable unit
- Simplifies complex animations
- Can apply effects/transforms to entire group
- Settings: preserve resolution/frame rate when nested
- Limitations: can't apply frame blending to precomp itself

#### Audio Layer
- Contains audio waveform
- Used for audio visualization effects
- Can drive animations via "Convert Audio to Keyframes"
- Waveform display toggleable (LL shortcut)
- Audio levels keyframes (Shift+L)

### Synthetic Layers
- Layers not based on source footage
- Includes: text layers, shape layers
- Generated within After Effects

### 2025 Updates
- FBX import support (3D models, animations, cameras, lights)
- Environment Light Background Layer visualization
- Advanced 3D renderer with physically-based rendering

---

## 2. Transform Properties

Every layer has a Transform property group with five core properties.

### The Five Core Transforms

#### Position (P)
- Moves layer across X, Y (and Z for 3D) axes
- Spatial property - affects composition space location
- 2D: [x, y]
- 3D: [x, y, z]
- Can be split into separate dimensions
- Keyboard shortcut: P

#### Scale (S)
- Increases or decreases layer size
- Percentage-based (100% = original size)
- 2D: [width%, height%] (constrained or independent)
- 3D: [width%, height%, depth%]
- Occurs around anchor point
- Keyboard shortcut: S

#### Rotation (R)
- Rotates layer around anchor point
- 2D: single angle in degrees
- 3D: separate X, Y, Z rotation values
- Order matters for 3D rotations
- Keyboard shortcut: R

#### Anchor Point (A)
- Defines layer's center/pivot for transformations
- Default: center of layer for most layer types
- All rotation and scale occur around this point
- Can be repositioned for off-center transforms
- Keyboard shortcut: A

#### Opacity (T)
- Controls layer transparency
- Range: 0% (fully transparent) to 100% (fully opaque)
- Not affected by parenting (unlike other transforms)
- Keyboard shortcut: T

### 3D Layer Specifics

**Enabling 3D**: Click 3D Layer Switch (cube icon) in timeline

**3D Transform Differences**:
- Position: X, Y, Z axes
- Rotation: X, Y, Z rotation (separate values)
- Scale: 3D scaling
- Anchor Point: 3D pivot point
- **Orientation**: Additional 3D rotation property

**Material Options** (3D layers only):
- Casts Shadows: on/off
- Light Transmission: how light passes through
- Accepts Shadows: can receive shadows from other layers
- Accepts Lights: whether layer responds to lights
- Ambient/Diffuse/Specular: material shading properties
- Metal: metallic reflection properties
- Reflection Intensity/Sharpness: reflective qualities

**Compositing Options**:
- Enable Depth of Field
- Layer Quality (wireframe, draft, best)
- Collapse Transformations

### Parenting Effects
- Affects: Position, Scale, Rotation, Orientation (3D)
- Does NOT affect: Opacity
- Child inherits parent's transformations
- Can create nested hierarchies

---

## 3. Animation System

### Keyframe Types

#### Linear Interpolation
- Constant rate of change between keyframes
- Creates robotic, mechanical motion
- Straight path between keyframes
- No easing or acceleration
- Diamond-shaped keyframe icon

#### Bezier Interpolation
- Manual control via direction handles
- Handles operate independently on both sides
- Most precise control over interpolation
- Can create complex curves
- Used for custom easing

#### Auto Bezier
- Automatic smooth interpolation
- Equal, symmetrical direction handles
- Creates smooth curves automatically
- Good for natural motion paths
- Converts automatically when dragging keyframe

#### Hold Interpolation
- Temporal only (no spatial equivalent)
- Property value stays constant until next keyframe
- Instant jump to new value
- Square keyframe icon
- Used for stepped/discrete animations

### Easy Ease (F9)
- Preset using Bezier interpolation
- Adds acceleration/deceleration
- Makes linear animation feel organic
- Most commonly used easing
- Shortcut: F9

### Spatial vs Temporal Interpolation

**Spatial Interpolation**:
- Relates to motion path shape
- Editable in Composition panel
- Changes path from harsh to smooth
- Affects: Position property paths

**Temporal Interpolation**:
- Relates to speed/timing
- Changed in Graph Editor
- Controls acceleration/deceleration
- Affects: all animatable properties

### Graph Editor

**Two Graph Types**:
1. **Speed Graph**: Controls acceleration/deceleration
2. **Value Graph**: Shows actual property values over time

**Benefits**:
- Precise control over animation timing
- Visual representation of easing
- Fine-tune Bezier handles
- Create professional, fluid motion

### Default Settings
- Default spatial interpolation: Auto Bezier
- Can be changed to Linear in Preferences > General
- Edit > Preferences > General (Win) / After Effects > Preferences > General (Mac)

### Keyboard Shortcuts
- **Ctrl+Alt+K** / **Cmd+Opt+K**: Set keyframe interpolation
- **Ctrl+Alt+H**: Toggle Hold/Auto Bezier
- **Cmd/Ctrl + click keyframe**: Convert to Auto Bezier
- **F9**: Easy Ease
- **Shift+F9**: Easy Ease In
- **Ctrl+Shift+F9** / **Cmd+Shift+F9**: Easy Ease Out

---

## 4. Effects System

After Effects contains hundreds of built-in effects organized into categories.

### Effect Categories

#### Color Correction
- Black and White
- Curves
- Levels
- Hue/Saturation
- Color Balance
- Vibrance
- Change to Color
- Photo Filter
- Tint
- Brightness & Contrast
- Exposure
- Auto Levels/Color/Contrast

#### Blur and Sharpen
- Fast Blur
- Gaussian Blur
- Box Blur
- Channel Blur
- Compound Blur
- Bilateral Blur
- Camera Lens Blur (with DOF simulation)
- Motion Blur (CC Force Motion Blur)
- Radial Blur
- Directional Blur
- Sharpen
- Unsharp Mask

#### Distort
- Bezier Warp
- Bulge
- Twirl
- Mirror
- Offset
- Polar Coordinates
- Ripple
- Wave Warp
- Mesh Warp
- Liquify
- Displacement Map
- Optics Compensation (rolling shutter)
- Transform

#### Stylize
- Glow
- Threshold
- Posterize
- Find Edges
- Emboss
- Mosaic
- Strobe Light
- Roughen Edges
- Scatter
- Motion Tile

#### Generate
- Fill
- Gradient Ramp
- 4-Color Gradient
- Checkerboard
- Circle
- Ellipse
- Grid
- Lens Flare
- Radio Waves
- Fractal Noise
- Cell Pattern
- Stroke
- Write-on
- Audio Spectrum
- Audio Waveform

#### Simulation
- Particle systems
- Shatter
- Card Dance
- Caustics
- Foam
- Wave World

#### Perspective
- 3D Camera Tracker
- Bevel Alpha
- Bevel Edges
- Drop Shadow
- Radial Shadow

#### Channel
- Invert
- Blend
- Calculations
- Minimax
- Shift Channels
- Set Channels
- Compound Arithmetic

#### Time
- Time Displacement
- Timewarp
- Echo
- Posterize Time

#### Transition
- Block Dissolve
- Card Wipe
- Gradient Wipe
- Iris Wipe
- Linear Wipe
- Radial Wipe
- Venetian Blinds

#### Matte
- Matte Choker
- Simple Choker
- Refine Soft Matte
- Refine Hard Matte

#### Noise and Grain
- Add Grain
- Match Grain
- Remove Grain
- Noise
- Fractal Noise
- Turbulent Noise

#### 3D Channel
- Depth Matte
- Depth of Field
- Fog 3D
- ID Matte

#### Utility
- Cineon Converter
- Color Profile Converter
- HDR Compander
- Apply Color LUT

#### Audio Effects
- Bass & Treble
- Delay
- Flange & Chorus
- High-Low Pass
- Modulator
- Parametric EQ
- Reverb
- Stereo Mixer
- Tone

### Effect Application
- Effects stacked in order (top to bottom)
- Order affects final result
- Can be enabled/disabled individually
- Supports keyframe animation of all parameters
- Can be copied between layers
- Effect presets available
- GPU-accelerated effects available
- Multi-Frame Rendering support

---

## 5. Masks and Mattes

### Masks

**Definition**: Path used to modify layer attributes, most commonly alpha channel

**Properties**:
- **Mask Path**: Bezier or parametric shape
- **Mask Feather**: Softens edges (default straddles edge 50/50)
- **Mask Opacity**: Controls mask strength (0-100%)
- **Mask Expansion**: Grows/shrinks mask area

**Mask Modes**:
- None
- Add
- Subtract
- Intersect
- Lighten
- Darken
- Difference

**Feathering**:
- Softens mask edges with gradient
- Measured in pixels
- Keyboard shortcut: F
- Default: half inside, half outside mask edge
- Should not extend to layer edges (clipping)

**Best Practices**:
- Apply small feather for natural blending
- Break complex masks into smaller, adjustable masks
- Keep feathered masks slightly inside layer bounds

### Track Mattes

**Definition**: Uses one layer to control opacity of another layer

**Four Track Matte Types**:

#### 1. Alpha Matte
- Uses alpha channel of matte layer
- Pixels >0% opacity become visible
- Transparent areas = hidden
- Best for: sharp cutouts, text animations

#### 2. Alpha Inverted Matte
- Uses inverse of alpha channel
- 0% opacity pixels become visible
- Opaque areas = hidden
- Inverts the visibility

#### 3. Luma Matte
- Uses brightness/luminance values
- White = opaque, black = transparent
- Gray values = partial transparency
- Best for: gradients, dynamic transitions

#### 4. Luma Inverted Matte
- Inverts luminance values
- Black = opaque, white = transparent
- Inverted gray scale

**Track Matte Features**:
- Any layer can be matte source for any other layer
- Multiple layers can reference single matte
- Matte layer doesn't need to be adjacent
- Can use with masks for complex shapes

**UI Location** (2025 interface):
- Toggle Switches/Modes at bottom of timeline
- Track Matte column shows layer names
- Alpha/Luma toggle in Mode column
- Inverted checkbox (may be hidden/subtle)
- Shortcut to show: Right-click > Columns > Track Matte

**Differences from Stencil/Silhouette**:
- Track mattes affect single layer
- Stencil/silhouette modes affect all layers beneath

---

## 6. Blending Modes

After Effects contains 38 blending modes organized into categories.

### Blending Mode Categories

#### Normal
- Normal (default): No blending

#### Darkening Modes
- **Darken**: Keeps darker pixels
- **Multiply**: Multiplies colors (darkens, like overlaying gels)
- **Color Burn**: Darkens and increases contrast
- **Classic Color Burn**: Legacy version
- **Linear Burn**: Similar to Color Burn with different curve
- **Darker Color**: Compares RGB values, uses darker

**Use Case**: Multiply most common for subtle tints, removing white backgrounds

#### Lightening Modes
- **Add**: Adds color values (brightens significantly)
- **Lighten**: Keeps lighter pixels
- **Screen**: Removes blacks, lightens (opposite of Multiply)
- **Color Dodge**: Brightens and decreases contrast
- **Classic Color Dodge**: Legacy version
- **Linear Dodge**: Similar to Color Dodge
- **Lighter Color**: Compares RGB values, uses lighter

**Use Case**: Screen/Add for removing black backgrounds, overlaying highlights

#### Contrast Modes
- **Overlay**: Multiply on darks, Screen on lights
- **Soft Light**: Subtle contrast increase
- **Hard Light**: Strong contrast increase
- **Linear Light**: Combination of Linear Burn/Dodge
- **Vivid Light**: Combination of Color Burn/Dodge
- **Pin Light**: Combination of Lighten/Darken
- **Hard Mix**: Posterizes to primary colors

**Use Case**: Overlay is one of most useful for texture overlays

#### Difference Modes
- **Difference**: Subtracts colors, inverts
- **Classic Difference**: Legacy version
- **Exclusion**: Similar to Difference, lower contrast
- **Subtract**: Subtracts underlying color
- **Divide**: Divides color values

#### HSL Modes
- **Hue**: Uses hue of source layer
- **Saturation**: Uses saturation of source
- **Color**: Uses hue and saturation of source
- **Luminosity**: Uses luminosity of source

#### Special Modes
- **Stencil Alpha/Luma**: Uses alpha/luma to affect all layers beneath
- **Silhouette Alpha/Luma**: Inverted stencil

### Most Used Modes
1. **Screen**: Remove blacks, overlay bright elements
2. **Multiply**: Remove whites, add subtle color tints
3. **Add**: Brighten significantly, additive blending
4. **Overlay**: Texture overlays with contrast preservation

### Keyboard Shortcuts
- **Shift + -** (hyphen): Cycle down through blend modes
- **Shift + =** (equal): Cycle up through blend modes

---

## 7. 3D System

### 3D Renderers

#### Classic 3D (Default)
- Simple 3D layer transformations
- Basic camera/light support
- Fastest rendering
- Limited material options

#### Cinema 4D Renderer
- Extruded text and shapes
- Bevel options
- More advanced 3D geometry
- Slower than Classic 3D

#### Advanced 3D (2025)
- High-quality, performance-oriented
- Physically-based rendering (PBR)
- Adobe Standard Material properties
- Beautiful antialiasing and transparency
- Up to 4x faster preview (optimized GPU acceleration)
- Shared rendering engine with Adobe/Substance products

### 3D Layers

**Enabling 3D**:
- Click 3D Layer Switch (cube icon) in timeline
- Unlocks Z-axis manipulation
- Adds 3D-specific properties

**3D Layer Properties**:
- Position: X, Y, Z
- Rotation: X, Y, Z (separate)
- Orientation: 3D rotation alternative
- Anchor Point: 3D pivot
- Scale: X, Y, Z

**Material Options**:
- **Casts Shadows**: Enable/disable shadow casting
- **Accepts Shadows**: Receive shadows from other layers
- **Accepts Lights**: Respond to lighting
- **Light Transmission**: Light pass-through amount
- **Specular**: Shininess and reflections
- **Diffuse**: Base color response to light
- **Ambient**: Self-illumination
- **Metal**: Metallic properties
- **Reflection Intensity/Sharpness**: Reflection quality

### Cameras

**Camera Properties**:
- **Position**: X, Y, Z location
- **Point of Interest**: Target/look-at point
- **Rotation/Orientation**: Camera angle
- **Zoom**: Lens focal length
- **FOV (Field of View)**: Angle of view
- **Aperture**: Lens opening size (affects DOF)
- **Focus Distance**: DOF focus plane
- **Blur Level**: DOF blur amount (100% = natural)
- **Near/Far**: Clipping planes

**Depth of Field**:
- Enable in camera settings
- Aperture controls blur amount
- F-Stop displays equivalent camera setting
- Focus Distance sets sharp plane
- Blur Level scales effect (100% = natural)

**Camera Types**:
- One-Node Camera: Position only
- Two-Node Camera: Position + Point of Interest

**Camera Parenting**:
- Can parent to null objects for control
- Useful for complex camera rigs

### Lights

**Light Types**:

#### Point Light
- Omnidirectional light source
- Radiates in all directions
- Properties: intensity, color, position
- Casts shadows

#### Spot Light
- Cone of light
- Properties: cone angle, cone feather, position, rotation
- Directional with falloff
- Casts shadows with defined shape

#### Directional Light
- Parallel rays (like sun)
- Infinite distance
- Only rotation matters (position irrelevant)
- Uniform illumination

#### Ambient Light
- Non-directional fill light
- No position or shadows
- Raises overall scene brightness
- No falloff

#### Environment Light (2025)
- Image-Based Lighting (IBL)
- Uses HDR/EXR files
- Can use videos, images, compositions as sources
- Realistic lighting and reflections
- Create Environment Light Background Layer for visualization

**Light Properties**:
- **Intensity**: Brightness (0-200%+)
- **Color**: Light color (RGB)
- **Cone Angle** (Spot): Width of light cone
- **Cone Feather** (Spot): Edge softness
- **Shadow Darkness**: Shadow intensity
- **Shadow Diffusion**: Shadow edge softness

**Shadow Catcher (2025)**:
- Allows 3D elements to interact with live footage
- Realistic shadow casting/receiving
- Auto-adjusts shadow properties to match scene lighting

**3D Scene Import (2025)**:
- FBX, GLB, GLTF, OBJ support
- Auto-creates camera/light layers from imported data
- Preserves animation with keyframes

### Depth Maps (2025)
- Precise depth data per 3D layer
- Improves depth of field effects
- Better atmospheric perspective
- Enhanced depth-based compositing

---

## 8. Compositions

### Composition Settings
- **Width/Height**: Resolution in pixels
- **Frame Rate**: FPS (23.976, 24, 25, 29.97, 30, 60, etc.)
- **Duration**: Length of composition
- **Background Color**: Comp background
- **Pixel Aspect Ratio**: Square vs. anamorphic
- **Preserve Resolution When Nested**: Keep resolution in parent comp
- **Preserve Frame Rate When Nested**: Keep frame rate in parent comp

### Precomposition

**Purpose**: Group multiple layers into single composition

**How to Precompose**:
- Select layers
- Layer > Pre-compose (Ctrl+Shift+C / Cmd+Shift+C)
- Choose options: "Leave all attributes" vs "Move all attributes"

**Benefits**:
- Simplify complex animations
- Apply effects to grouped layers
- Reuse compositions
- Isolate parts of project
- Better organization

**Precomp Options**:
- **Move all attributes into new composition**: Transfers properties to precomp
- **Leave all attributes in [composition name]**: Keeps properties in parent comp

**Advanced Settings**:
- Preserve resolution when nested
- Preserve frame rate when nested or in render queue

### Nested Compositions

**Features**:
- Compositions can contain other compositions
- Infinite nesting depth (practically)
- Updates propagate automatically
- Instance-based (one comp, multiple uses)

**Performance Considerations**:
- Deep nesting can impact performance
- Consider pre-rendering heavy nested comps
- Use "Collapse Transformations" for vector layers

---

## 9. Time Remapping

### Time Stretch

**Function**: Speed up or slow down entire layer uniformly

**Properties**:
- Applied to entire layer duration
- Percentage-based (100% = original speed)
- 50% = half speed (slower)
- 200% = double speed (faster)

**Limitations**:
- Uniform across entire layer
- Can cause jerky motion if frame rate mismatch

### Time Remapping

**Function**: Variable speed control with keyframes

**How it Works**:
- Enable: Right-click layer > Time > Enable Time Remapping
- Creates Time Remap property with keyframes
- Keyframe the time value to control speed

**Capabilities**:
- Speed up specific segments
- Slow down specific segments
- Freeze frames
- Reverse playback
- Combination of all above

**Comparison to Time Stretch**:
- Time Stretch: uniform speed change
- Time Remap: variable speed with keyframe control

### Frame Blending

**Purpose**: Smooth motion when changing playback speed

**Two Types**:

#### Frame Mix
- Blends adjacent frames
- Faster to render
- Simple cross-dissolve between frames

#### Pixel Motion
- Analyzes motion vectors
- Much better results, especially for slow motion
- Slower to render
- Can create artifacts (edges, warping)

**Enabling Frame Blending**:
- Per-layer: Enable layer Frame Blend switch
- Composition: Enable comp Frame Blend button

**Limitations with Precomps**:
- Cannot apply frame blending to precomp layer directly
- Can apply to layers inside the nested composition
- Workaround: apply inside nested comp

**When to Use**:
- Time-stretched footage
- Time-remapped footage
- Footage with frame rate different from comp
- Prevents jerky motion

**Pixel Motion Tips**:
- Try Pixel Motion first
- Fall back to Frame Mix if artifacts appear
- Careful with motion blur (consider shutter angle)

---

## 10. Motion Blur

### Enabling Motion Blur

**Two-Step Process**:
1. **Per-Layer**: Enable Motion Blur switch on layer
2. **Composition**: Enable Motion Blur button at top of timeline

### Motion Blur Settings

#### Composition Settings (Advanced Tab)

**Shutter Angle**:
- Measured in degrees
- Default: 180 degrees
- Range: 1° (minimal blur) to 720° (extreme blur)
- Simulates rotating camera shutter
- Higher value = more blur/streaking

**Shutter Phase**:
- Controls when shutter opens during frame
- Default: -90° (or 0°, varies)
- Negative phase: blur lags behind motion (natural look)
- At 0°: shutter opens at frame start
- Recommended: 50% of Shutter Angle (e.g., -90° for 180° angle)
- Important for motion tracking (keeps track centered)

**Samples Per Frame**:
- Controls motion blur quality/smoothness
- Default: typically 16
- Higher value: smoother, slower render
- Range: 2-64 (typical 8-16 for good quality)
- Trade-off between quality and speed

### Per-Layer Motion Blur
- Each layer can toggle motion blur on/off
- Useful for selective blur application
- Motion blur only where needed

### Effects-Based Motion Blur

**CC Force Motion Blur**:
- More manual control than native motion blur
- Set Shutter Angle and Samples manually
- Override composition settings per layer

**ReelSmart Motion Blur (RSMB)** (third-party):
- Advanced motion blur synthesis
- Better quality for complex motion
- Can add motion blur to footage without it

### Best Practices
- Use 180° shutter angle for natural look
- Set shutter phase to 50% of shutter angle
- Increase samples (8-16) for quality
- Enable only on layers that need it
- Preview at lower samples, render at higher

---

## 11. Parenting

### Parenting Basics

**Definition**: Links child layer's transform properties to parent layer

**How to Parent**:
- **Pick Whip**: Drag spiral icon from child to parent layer
- **Dropdown**: Select parent in Parent column dropdown
- Show Parent column: Right-click timeline > Columns > Parent & Link
- Keyboard shortcut: **Shift+F4** (show Parent column)

**Pick Whip**:
- Spiral/coil icon
- Located next to layer name in Parent column
- Click and drag to target parent
- Visual connection method

### Affected Properties
- **Position**: Child follows parent's movement
- **Scale**: Child scales with parent
- **Rotation**: Child rotates around parent's anchor
- **Orientation** (3D layers): 3D rotation inheritance
- **NOT Opacity**: Opacity is not inherited

### Null Objects for Parenting

**Purpose**: Invisible control layer for complex rigs

**Benefits**:
- Control multiple layers at once
- Create complex hierarchies
- Organize animation controls
- Doesn't render in output

**Creating Null Object**:
- Layer > New > Null Object
- Or right-click layer panel > New > Null Object
- Keyboard shortcut: Ctrl+Alt+Shift+Y (Win) / Cmd+Opt+Shift+Y (Mac)

**Use Cases**:
- Control rig for character animation
- Camera control target
- Group multiple layers
- Centralized animation control

### Layer Hierarchies

**Nested Parenting**:
- Parents can have parents (grandparent relationships)
- Create complex rigs: head → torso → legs
- Changes propagate down hierarchy

**Character Rigging Example**:
- Legs parented to hips
- Torso parented to hips
- Arms parented to torso
- Head parented to torso
- All controlled by single null object parent

### Common Issues

**Layer Jumps When Parented**:
- Child may jump to parent's position
- Use expression instead: `parent.transform.position` with offset
- Or add offset: `parent.transform.position + value`

**Using Expressions with Parenting**:
- Pick whip in expression field
- Child inherits exact parent values
- Add `value +` to add values instead of replace

**Wrong Pick Whip Used**:
- Parent & Link pick whip (parenting)
- Track Matte pick whip (different function)
- Ensure correct column is visible

---

## 12. Audio

### Audio Layers

**Properties**:
- Waveform display in timeline
- Volume levels
- Left/Right/Both channels
- Can be trimmed and time-stretched

**Viewing Audio**:
- **LL**: Show waveform
- **Shift+L**: Add audio levels keyframes
- Audio keyframes can control visual animations

### Audio Visualization Effects

#### Audio Spectrum
- Generates dynamic animated spectrum
- Responds to audio frequencies
- Shows full range of sound
- Highly customizable

**Properties**:
- Audio Layer: Select source audio
- Frequency Bands: Number of bars/lines
- Start/End Frequency: Range to visualize
- Maximum/Minimum Height: Bar size limits
- Thickness/Softness: Visual appearance

**Display Options**:
- Digital (bars)
- Analog Lines (single line with spikes)
- Analog Dots (dot pattern)
- Circle (wraps into ring)

**Path-Based Waveforms**:
- Can follow custom mask path
- Draw path with Pen tool
- Set Path to mask number in effect settings

#### Audio Waveform
- Visualizes amplitude over time
- Shows peaks and troughs
- Different from spectrum (amplitude vs frequency)

**Circular Waveforms**:
- Apply Polar Coordinates effect
- Set interpolation to 100%
- Creates circular audio visualization

### Convert Audio to Keyframes

**Process**:
- Right-click audio layer
- Keyframe Assistant > Convert Audio to Keyframes
- Creates new "Audio Amplitude" layer
- Contains: Left Channel, Right Channel, Both Channels

**Using Audio Keyframes**:
- Each channel has Slider property
- Pick whip from any property to slider
- Links property to audio amplitude
- Drives animations with audio

**Example**: Scale text with audio
1. Convert audio to keyframes
2. Use pick whip from text Scale to Both Channels > Slider
3. Text scales with audio amplitude

### Audio Effects

**Built-in Audio Effects**:
- Bass & Treble
- Delay
- Flange & Chorus
- High-Low Pass filters
- Modulator
- Parametric EQ
- Reverb
- Stereo Mixer
- Tone

### Audio-Driven Animation Workflow

1. Import audio file
2. Add to composition
3. Convert Audio to Keyframes
4. Link visual properties to audio sliders
5. Adjust sensitivity/scale as needed
6. Add Audio Spectrum/Waveform effects for visualization

### Advanced Techniques
- Audio reactivity with expressions
- Multiple properties driven by different frequency bands
- Combine audio amplitude with other animations
- Use audio as trigger for complex behaviors

---

## 13. Shape Layer Advanced Features

### Path Operations

#### Trim Paths
- Reveals shape gradually
- Animatable Start, End, Offset properties
- Perfect for: logo outlines, line-drawing animations, progress bars
- Similar to Write-on effect
- **Important**: Works on strokes, not filled shapes
- Shape must have stroke property (no fill or remove fill)

#### Merge Paths
- Combines multiple paths into single path
- Similar to Illustrator's Pathfinder
- Takes all paths above it in same group as input
- Output: single combined path
- Input paths remain in timeline but don't render

**Merge Modes**:
- Union (Add)
- Intersect
- Exclude
- Subtract

**Use Cases**:
- Intricate shape designs
- Smooth morphing animations
- Complex logo treatments

### Transform Hierarchy
- **Per-shape transforms**: Relative to individual shape
- **Layer transforms**: Affect entire layer
- Both can be animated independently

### Fill and Stroke Options
- Solid colors
- Gradients (linear, radial)
- Stroke width, caps, joins
- Dashes and gaps

---

## 14. Expressions

Expressions provide procedural animation and property linking beyond keyframes.

### Common Expression Functions

#### wiggle(frequency, amplitude)
- Creates random motion
- Frequency: times per second
- Amplitude: amount of variation
- Example: `wiggle(2, 50)` = 2 times/sec, ±50 pixels

**Controlled Wiggle with Slider**:
- Add Slider Control effect
- Replace amplitude with slider: `wiggle(2, effect("Slider Control")("Slider"))`
- Now keyframeable

**Looping Wiggle**:
- Uses 5th parameter (time)
- Access different time values
- Creates seamless loop

```javascript
frequency = 2;
amplitude = 40;
secondsToLoop = 3;
t = time % secondsToLoop;
wiggle1 = wiggle(frequency, amplitude, 1, 0.5, t);
wiggle2 = wiggle(frequency, amplitude, 1, 0.5, t - secondsToLoop);
linear(t, 0, secondsToLoop, wiggle1, wiggle2)
```

#### time
- Current composition time in seconds
- Use for continuous motion
- Example: `time * 100` = moves 100 units per second
- Can combine with wiggle: `wiggle(3, 15) + time*10`

#### valueAtTime(time)
- Gets property value at specific time
- Example: `valueAtTime(1)` = value at 1 second
- Useful for delays and offsets

**Delayed Animation**:
```javascript
delay = 0.5;
valueAtTime(time - delay)
```
- Link delay to Slider Control for easy adjustment

#### loopOut(type)
- Loops keyframes after last keyframe
- Types: "cycle", "pingpong", "offset", "continue"
- Example: `loopOut("cycle")` = repeat infinitely

**Controlled Loop Stop**:
```javascript
loopDuration = key(numKeys).time - key(1).time;
stopTime = thisComp.layer("Null 1").effect("Slider Control")("Slider");
if (time < stopTime) {
  loopOut()
} else {
  valueAtTime(stopTime % loopDuration)
}
```

### Property Linking

**Pick Whip in Expressions**:
- Click pick whip next to expression field
- Drag to target property
- Auto-generates link code
- Example: `thisComp.layer("Control").transform.position`

**Adding Values**:
- Link copies exact value by default
- Add `value +` to add instead: `value + thisComp.layer("Control").transform.position`

### Expression Controls

**Effect > Expression Controls**:
- Slider Control: single numeric value
- Angle Control: angle picker
- Point Control: 2D position
- 3D Point Control: 3D position
- Checkbox Control: boolean on/off
- Color Control: color picker
- Layer Control: layer reference
- Dropdown Menu Control: list of options

**Benefits**:
- Centralized control
- Keyframeable expression values
- Organized parameters
- Easier for non-technical users

---

## Comparison Checklist for Weyl Compositor

### Implemented in Weyl
- ✅ Keyframe animation (all property types, bezier interpolation)
- ✅ Transform evaluation (position, rotation, scale, anchor point)
- ✅ Camera layer (3D camera with keyframes)
- ✅ Light layer (point, spot, directional, ambient)
- ✅ Video layer (time remap, playback control)
- ✅ Solid layer (color animation)
- ✅ Text layer (per-character animation)
- ✅ Spline layer (bezier paths)
- ✅ Null layer (parenting support)
- ✅ Particle system (GPU-based)
- ✅ Audio reactivity (basic)
- ✅ Property drivers (expression-based linking)

### Partially Implemented in Weyl
- ⚠️ Precomp layers (structure exists, render-to-texture needed)
- ⚠️ 3D system (basic 3D, missing material options)

### Not Yet Implemented in Weyl
- ❌ Shape layers (vector graphics with fill/stroke)
- ❌ Adjustment layers
- ❌ Full expression system (wiggle, loopOut, etc.)
- ❌ Track mattes (alpha/luma)
- ❌ Mask system (bezier masks with feathering)
- ❌ Blend modes (all 38 modes)
- ❌ Effects system (blur, glow, color correction, etc.)
- ❌ Frame blending
- ❌ Per-layer motion blur controls
- ❌ Audio visualization effects (Audio Spectrum, Waveform)
- ❌ Convert Audio to Keyframes
- ❌ Trim Paths / Merge Paths
- ❌ Graph Editor for fine easing control
- ❌ Hold keyframes (instant jumps)
- ❌ Depth of Field (camera)
- ❌ Advanced 3D renderer with PBR
- ❌ Environment lights
- ❌ Shadow system (cast/receive)

---

## Sources

- [Creating layers in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/creating-layers.html)
- [Understanding Layers in After Effects: A Complete Guide - AJ Graphics](https://aj-graphics.org/2025/02/17/understanding-layers-in-after-effects-a-complete-guide/)
- [Adjust layer properties in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/layer-properties.html)
- [Transform Properties in After Effects - Noble Desktop](https://www.nobledesktop.com/learn/after-effects/transform-properties-in-after-effects)
- [Working with 3D Layers in After Effects - AJ Graphics](https://aj-graphics.org/2025/02/25/working-with-3d-layers-in-after-effects-a-complete-guide/)
- [Keyframe interpolation in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/keyframe-interpolation.html)
- [Unseen World of Keyframe Interpolation in After Effects 2025 - The S Bit](https://thesbit.com/keyframe-interpolation-in-after-effects/)
- [Using the Graph Editor in After Effects - AJ Graphics](https://aj-graphics.org/2025/03/06/using-the-graph-editor-in-after-effects-to-refine-your-animations/)
- [Use blending modes and layer styles in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/blending-modes-layer-styles.html)
- [The Ultimate Guide to Blending Modes in After Effects - School of Motion](https://www.schoolofmotion.com/blog/blending-modes-after-effects)
- [Use alpha channels, masks, and mattes in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/alpha-channels-masks-mattes.html)
- [Track Mattes in After Effects: The Ultimate Guide - Filmora](https://filmora.wondershare.com/video-editing/track-matte-after-effects.html)
- [How to Use Alpha and Luma Track Mattes in After Effects - Pixflow](https://pixflow.net/blog/how-to-use-alpha-and-luma-track-mattes-in-after-effects/)
- [After Effects effect list - Adobe Help](https://helpx.adobe.com/after-effects/using/effect-list.html)
- [Using Color Correction effects in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/color-correction-effects.html)
- [Apply Blur and Sharpen effects in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/blur-sharpen-effects.html)
- [Apply Distort effects in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/distort-effects.html)
- [Cameras, lights, and points of interest in After Effects - Adobe Help](https://helpx.adobe.com/after-effects/using/cameras-lights-points-interest.html)
- [Working with 3D Layers in After Effects - AJ Graphics](https://aj-graphics.org/2025/02/25/working-with-3d-layers-in-after-effects-a-complete-guide/)
- [After Effects 2025 New Features - Upskillist](https://www.upskillist.com/blog/after-effects-2025-new-features-overview/)
- [Precomposing, nesting, and pre-rendering - Adobe Help](https://helpx.adobe.com/after-effects/using/precomposing-nesting-pre-rendering.html)
- [Time-stretching and time-remapping - Adobe Help](https://helpx.adobe.com/after-effects/using/time-stretching-time-remapping.html)
- [After Effects Time Remapping: A Comprehensive Guide - Nexrender](https://www.nexrender.com/blog/time-remapping-after-effects)
- [Step-by-Step Guide: Add Motion Blur in After Effects - HitPaw](https://www.hitpaw.com/more-ai-video-tips/motion-blur-after-effects.html)
- [How to Adjust Motion Blur in After Effects - aejuice](https://aejuice.com/blog/how-to-adjust-motion-blur-in-after-effects/)
- [AE Fundamentals: Parenting - Megan Friesth](https://www.meganfriesth.com/aefundamentals/parenting)
- [How to Use Null Objects in After Effects - Pixflow](https://pixflow.net/blog/how-to-use-null-objects-in-after-effects/)
- [3 After Effects Animations: Parenting, Null Objects, and Motion Blur - Storyblocks](https://www.storyblocks.com/resources/tutorials/after-effects-parenting-null-objects-motion-blurs)
- [How to Create Audio Waveform Visualizers in After Effects - Pixflow](https://pixflow.net/blog/create-audio-waveform-visualizers-in-after-effects/)
- [How to Create Audio Wave Effects in After Effects - Motion Array](https://motionarray.com/learn/after-effects/after-effects-audio-wave-effects/)
- [How to Make an Audio Visualizer in After Effects - Boris FX](https://borisfx.com/blog/how-to-make-an-audio-visualizer-in-after-effects-1/)
- [Overview of shape layers, paths, and vector graphics - Adobe Help](https://helpx.adobe.com/after-effects/using/overview-shape-layers-paths-vector.html)
- [Shape attributes, paint operations, and path operations - Adobe Help](https://helpx.adobe.com/after-effects/using/shape-attributes-paint-operations-path.html)
- [After Effects expression examples - Adobe Help](https://helpx.adobe.com/after-effects/using/expression-examples.html)
- [How to Use The Wiggle Expression in After Effects - Pixflow](https://pixflow.net/blog/how-to-use-the-wiggle-expression-in-after-effects-for-smooth-animations/)
- [Getting Started with the Wiggle Expression - School of Motion](https://www.schoolofmotion.com/blog/wiggle-expression)
- [Loop a Wiggle - AE Reference](https://aereference.com/expressions/loop-a-wiggle)
