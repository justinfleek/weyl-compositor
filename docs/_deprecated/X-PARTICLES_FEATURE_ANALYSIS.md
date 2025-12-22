# X-Particles Feature Analysis for WebGL Implementation

Comprehensive research on Insydium X-Particles for Cinema 4D, focusing on features applicable to WebGL particle systems.

---

## 1. EMITTER TYPES

### Emission Sources
- **Points**: Emit from object vertices (supports Vertex Color tag)
- **Edges**: Emit from polygon edges or along spline length
- **N-gon Centre**: Emit from n-gon centers (weighted by size)
- **Object Position**: Emit from object's world position
- **Object Volume**: Emit from random points inside object volume

### Emitter Shapes
- Box
- Cylinder
- Sphere (implied from primitives)
- Custom object shapes (any Cinema 4D object except null objects)

### Special Emission Features
- **Vertex Map Emission**: Control emission via vertex maps with threshold slider
- **Illumination-Based Emission**: Emit based on object illumination
- **Shader/Texture Emission**: Emit based on shader/texture data
- **MoGraph Integration**: Support for Cloner, Matrix, Fracture, Voronoi Fracture objects
- **Real-time Simulate Mode**: Particle birth without timeline playback

### WebGL Feasibility
- Points, edges, object position: **High** (standard WebGL capabilities)
- Object volume: **Medium** (requires ray-polygon intersection or voxel sampling)
- Illumination-based: **Medium** (requires light calculation or pre-baked maps)
- Vertex maps: **High** (can use vertex attributes)

---

## 2. PARTICLE TYPES

### Standard Particles
- Bare particles with infinite small size
- Spherical collision bounds (defined by radius parameter)

### Sprites
- **Cube**: Small cube primitive
- **Cross**: 2D or 3D cross objects
- **Points (Individual)**: Series of splines with one point each (for Metaballs)
- **Points (Point Cloud)**: Single polygon object with vertices, no polygons
- **Text**: Simple text generation
- **Rubble**: Small object primitives for debris/gravel

### Objects & Instances
- Custom geometry attachment to particles
- Instanced primitives for performance
- Support for Redshift native optimized sphere primitive

### Splines
- Generated via Trail object
- Points mode for Metaball compatibility
- Point cloud mode for Skinner/OpenVDB mesher

### WebGL Feasibility
- Standard particles: **High** (point sprites or instanced spheres)
- Sprite primitives: **High** (instanced geometry)
- Custom objects/instances: **High** (WebGL instancing)
- Point clouds: **High** (vertex buffers)
- Splines: **Medium** (line strips or tube geometry)

---

## 3. MODIFIERS

### Standard Motion Modifiers
1. **Gravity Modifier**
   - Standard mode (Cinema 4D equivalent)
   - Newton mode (Newtonian gravity simulation)

2. **Wind Modifier**
   - Turbulence amount, frequency, scale
   - Directional wind forces

3. **Turbulence Modifier**
   - Standard turbulence
   - Wavy turbulence (smoother effect)
   - fBm (fractal Brownian motion) - chaotic movement

4. **Attractor Modifier**
   - Attract to modifier position or object list
   - Support for Cloner/Matrix objects

5. **Vortex Modifier**
   - Spiral/vortex forces

6. **Push Apart Modifier**
   - Particle separation

7. **Limit Modifier**
   - Boundary constraints

8. **Transform Modifier**
   - Position/rotation/scale changes

9. **Rotator Modifier**
   - Particle rotation control

10. **Weight Modifier**
    - Mass/weight adjustments

11. **Inheritance Modifier**
    - Inherit motion from emitter

12. **Network Modifier**
    - Network-based influences

13. **Physical Modifier**
    - Physics-based behavior

14. **Sticky Modifier**
    - Stick particles to surfaces

15. **Strange Attractor Modifier**
    - Chaotic attractor patterns

16. **Sound Modifier**
    - Audio-driven particle behavior

17. **Sound Displacement Modifier**
    - Audio-based displacement

18. **Spline Flow Modifier**
    - Follow spline paths

19. **Trigger Action Modifier**
    - Trigger actions on particles

20. **Python Modifier**
    - Custom Python scripting

### Sprite Modifiers
- **Light**: Light-based sprite effects
- **Sprites**: Sprite generation
- **Sprite Shader**: Shader application to sprites
- **Text**: Text sprite generation

### Generation Modifiers
1. **Branch**: Create branching structures (snowflakes, trees)
2. **Dynamic Particles**: Dynamic particle generation
3. **Geometry**: Geometry generation
4. **Morph**: Object morphing
5. **MultiLevel Spawn**: Hierarchical spawning
6. **Spawn**: Particle spawning
7. **Tendril**: Tendril/vine generation
8. **Kill**: Particle destruction
9. **Color**: Color changes with threshold for randomness

### Modifier Modes
- **Independent Mode**: Affects particles in field of effect
- **Action-Controlled Mode**: Only affects particles when triggered by actions

### WebGL Feasibility
- Gravity, wind, turbulence, attractor, vortex: **High** (standard force calculations)
- Push apart, limit, transform, rotator, weight: **High** (per-particle attributes)
- Spawn, kill, color: **High** (particle system fundamentals)
- Branch, morph, tendril: **Medium** (complex algorithmic generation)
- Sound modifiers: **High** (Web Audio API integration)
- Python modifier: **Low** (would need JavaScript equivalent)
- Strange attractor: **Medium** (mathematical functions)

---

## 4. DYNAMICS

### Collision Detection
- **Sphere-based collision**: Each particle has invisible spherical bounds
- **Polygon objects**: Collide with polygon meshes
- **Splines**: Collide with spline objects
- **Primitive objects**: Collide with Cinema 4D primitives
- **Generator objects**: Collide with generated geometry
- **Fast-moving objects**: Special handling for rotating/moving colliders

### Particle-to-Particle Collisions
- Same emitter collisions
- Different emitter collisions
- Spawn on collision support
- No collider tag required (separate object controls this)

### Collision Tag (xpCollision)
- Required for object collision detection
- Works with SDS (Subdivision Surfaces) objects
- Adjustable particle radius for collision accuracy
- Tolerance settings to prevent leakage

### Cloth Simulation (ClothFX)
- Particles along polygon vertices
- Cloth-like behavior without overhead
- "Polygon Edges" connection mode
- "Polygon Diag" (diagonal) connection mode
- Collision with other objects

### Fluid Simulation

#### xpFluidFX (SPH Solver)
- Small and large-scale fluid simulations
- Latest SPH (Smooth Particle Hydrodynamics) methods
- Mixed density support (water, snow, sand simultaneously)
- Fast and accurate results

#### xpFluidFLIP (FLIP/APIC Solvers)
- **FLIP** (Fluid Implicit Particle): Better for splashes and foam
- **APIC** (Affine Particle-in-Cell): Better momentum preservation, more stable
- Static and dynamic collider support
- Interaction with all xpDynamics objects
- More energetic, detailed simulations

### Grains
- xpFluidFX Granular solver
- Physically accurate sand and snow effects
- Render as particles or custom geometry

### Bullet Physics (xpBullet)
- Industry-standard Bullet physics engine
- Collision detection
- Rigid body dynamics
- Soft body dynamics
- Shattering and collapsing
- Particle-based solving

### WebGL Feasibility
- Basic sphere-polygon collision: **Medium-High** (ray-sphere/AABB tests)
- Particle-particle collisions: **Medium** (spatial hashing or grid)
- Cloth simulation: **Medium** (constraint-based physics)
- Fluid SPH/FLIP: **Low-Medium** (computationally expensive, needs GPU compute)
- Bullet physics: **Medium** (physics libraries exist: Ammo.js, Cannon.js, Rapier)
- Fast collision detection: **Medium** (BVH or octree acceleration)

---

## 5. GENERATORS

### Trail Generator
- Similar to MoGraph Tracer
- Splines from particle paths
- Compatible with Hair, Sketch, Toon
- "Nearest by Distance" connection mode
- Individual or grouped spline generation

### Sprite Generator (xpSprite)
- Efficient primitive rendering
- Lightweight viewport performance
- Material attachment
- Multiple sprite types
- Radial cloning with MoGraph

### Object Generator (xpGenerator)
- Multi-instance support
- Custom geometry from particles
- Morphing support

### Mesh Generation

#### Skinner Object
- Mesh from particles
- Skin particles with surface

#### OpenVDB Mesher
- Mesh primitives, splines, particles
- Voxel size control
- Point radius adjustment
- Smoothness control
- Filter stack (Median, Gaussian)
- Fast, interactive meshing

#### Planar Mesher
- Add polygons (triangles) between close particles
- Same algorithm as Trail "Nearest by Distance"
- Can combine with Trail for outlined triangles
- Adjustable distance threshold

### WebGL Feasibility
- Trail generation: **High** (line strips or instanced tubes)
- Sprite generation: **High** (instanced geometry)
- Skinner: **Medium** (marching cubes or metaball meshing)
- OpenVDB: **Low** (requires VDB library port or alternative)
- Planar mesher: **High** (Delaunay triangulation or nearest neighbor)

---

## 6. GROUPS

### Group System
- **Non-emitter-specific**: Groups can contain particles from multiple emitters
- **Unlimited groups**: Add as many groups as needed
- **Per-particle assignment**: Each particle can belong to one group
- **Pre-creation requirement**: Group must exist before assignment

### Group Interactions
1. **Use All Groups**: Connect regardless of group
2. **Only Same Group**: Connect only within same group
3. **Only Different Groups**: Connect only to different groups
4. **Specific Group**: Connect only to specified group
5. **All Except Specific Group**: Avoid specified group

### Group Usage
- Modifier targeting (affect specific groups)
- Action targeting (trigger actions on groups)
- Constraint connections (group-based linking)
- Trail/mesh generation filtering

### Change Group Modifier
- Dynamically reassign particles to different groups
- Action-triggered group changes

### WebGL Feasibility
- Group assignment: **High** (particle attribute/buffer)
- Group filtering: **High** (shader conditionals or separate buffers)
- Dynamic group changes: **High** (attribute updates)

---

## 7. QUESTIONS/ACTIONS SYSTEM

### Overview
Rule-based logic for conditional particle behavior without XPresso complexity.

### Question System
- **Created from emitter**: Questions tab in emitter
- **Multiple questions**: Unlimited per emitter
- **Multiple actions per question**: Flexible action combinations
- **Reusable**: Same question can be used by multiple emitters

### Question Types (Detected from Research)
1. **Age-based**: Test particle age against threshold
2. **Speed-based**: Test particle velocity
3. **Distance-based**: Test distance to objects/positions
4. **Proximity**: Test distance to other particles
5. **Collision**: Detect object collisions (requires xpCollision tag)
6. **Particle-to-Particle Collision**: Detect inter-particle collisions

### Question Parameters
- **Condition operators**: Greater than, less than, equal, etc.
- **Threshold values**: Numeric comparison values
- **Object lists**: Target objects for distance/collision tests
- **Pass/Fail states**: Determine if action triggers

### Action Categories

#### 1. Editor Display Actions
- Change particle display in viewport

#### 2. Object Actions
- Change object settings
- Change particle data
- Change Trails

#### 3. Control Modifier Actions
- Activate/deactivate modifiers per particle
- Direction Modifier
- Gravity Modifier
- Wind Modifier
- Trigger Action Modifier

#### 4. Direct Actions
- **Change Custom Data**: Modify custom particle data
- **Change Geometry**: Switch particle geometry
- **Change Group**: Reassign to different group
- **Change Infectio**: Modify infection parameters
- **Change Life**: Adjust particle lifespan
- **Change Lights**: Modify light sprites
- **Change Scale**: Adjust particle scale
- **Change Speed**: Modify velocity
- **Change Spin**: Adjust rotation
- **Change Sprites**: Switch sprite types
- **Control History**: Manage particle history
- **Control Morphing**: Trigger morphing
- **Control Negate**: Invert effects
- **Control Spawning**: Trigger spawn modifier
- **Explode Particles**: Explosive forces
- **Freeze Particles**: Stop particle motion

#### 5. Dynamics Actions
- **Sheeter Object**: Control sheeter dynamics

#### 6. Other Actions
- **Output to Console**: Debug output
- **Stop Following Spline**: Release from spline path
- **Unlink TP**: Disconnect from Thinking Particles
- **Unstick from Source Object**: Release sticky particles

### Action Requirements
- Modifiers must be in "Action-Controlled" mode
- Actions added to Question's action list
- Per-particle basis (individual particle control)

### WebGL Feasibility
- Question evaluation: **High** (per-particle conditionals in compute or update loop)
- Age/speed/distance tests: **High** (simple calculations)
- Collision detection: **Medium** (requires collision system)
- Action triggering: **High** (conditional attribute updates)
- Modifier control: **High** (toggle per-particle flags)
- Change attributes (color, scale, speed, etc.): **High** (direct attribute modification)

---

## 8. DATA MAPPING

### Data Mapping System
Map parameters to particle data, shaders, or time values.

### Texture & Shader Mapping
- Sample bitmap or Cinema 4D shader in 3D space
- Returns value 0-1 based on brightness
- Black = 0, White = 1, Gray = interpolated
- Multiply with parameter value
- Zero point adjustment (offset range)

### Vertex Map Integration
- **Emission Vertex Mode**: Map to emission vertex weight
- **Tag Selection**: Choose vertex map from object
- **Unrelated Objects**: Can use vertex maps from any object
- **Parametric Objects**: VertexMap Maker enables maps on primitives
- **Weight Ranges**: Min/max weight limits

### VertexMap Maker
- Automatic vertex map tag creation
- Multi-object support
- Layer blending
- Works on polygon objects, primitives, generators, splines

### Data Channels
Custom particle data storage for mapping.

### Falloffs
- **Cinema 4D Falloffs**: Standard falloff support in most modifiers
- **Age-based Falloffs**: Spline interface for age-dependent effects
  - Left = newly created particles
  - Right = particles near death
  - Zero = no effect
  - Negative = inverted effect

### Advanced Mapping Features
- **Looping Data Channels**: Cycle data values (added in 2025.4)
- **Layered GPU Falloffs**: Stack multiple falloffs (NeXus 2025.4)
- **Illumination Mapping**: Emission controlled by surface lighting

### VertexMap Applications
- Emission control
- Displacement in renderers (Redshift)
- Opacity control
- ExplosiaFX vertex map output
- Cinema 4D R20+ features (animated, layered, field-modified)

### WebGL Feasibility
- Texture sampling: **High** (shader texture lookups)
- Vertex maps: **High** (vertex attributes)
- Falloff curves: **High** (1D lookup texture or function)
- Age-based falloffs: **High** (particle age attribute)
- Data channels: **High** (custom particle attributes)
- Illumination mapping: **Medium** (requires lighting calculation)

---

## 9. FLUIDS

### ExplosiaFX (xpExplosiaFX)
- Hollywood-standard smoke and fire
- **Upres capability**: Low-res simulation with high-res final detail
- **Particle advection**: Control via data channels
- **Custom layering**: Emitters, collisions, forces
- **Gaseous material**: X-Particles renderer
- **VDB export**: Export as OpenVDB volumes for other renderers

### Fluid Solvers

#### 1. xpFluidFX (SPH)
- Smooth Particle Hydrodynamics
- Small to large-scale simulations
- Mixed density (water + snow + sand simultaneously)
- Highly realistic grain and liquid solving
- Fast and accurate

#### 2. xpFluidFLIP
- **FLIP Solver**: Fluid Implicit Particle method
  - Better for splashes and foam
  - More energetic

- **APIC Solver**: Affine Particle-in-Cell
  - Maintains liquid momentum
  - Preserves natural flow
  - More stable simulation
  - Better angular velocity preservation

- **Collision System**:
  - Static colliders
  - Fast-moving colliders
  - Rotating colliders
  - Interaction with all xpDynamics objects

- **Enhancements**:
  - X-Particles modifiers integration
  - xpFoam support
  - Dynamic and stable results

#### 3. PBD (Position Based Dynamics)
- Third fluid solver option

### OpenVDB Support
- **Export**: Save simulations as .vdb files
- **Import**: Other applications can read volumes
- **Rendering**: Octane and Redshift VDB import
- **Meshing**: OpenVDB Mesher for fluid surfaces

### Meshing Fluids
- OpenVDB Mesher (primary method)
- Render as particles (alternative)
- Custom geometry via OpenVDB
- Voxel-based smoothness control

### Caching
- ExplosiaFX caching system
- Save simulations to disk
- Scrub through cached results

### WebGL Feasibility
- Smoke/fire simulation: **Low** (volumetric, GPU-intensive)
- SPH fluids: **Low-Medium** (compute shaders possible, but heavy)
- FLIP/APIC: **Low** (very computationally expensive)
- VDB export: **N/A** (file format, not real-time)
- Particle-based fluid rendering: **Medium** (point sprites or instanced)
- Volumetric rendering: **Low-Medium** (ray marching, performance concerns)

---

## 10. CONSTRAINTS

### xpConstraints Overview
Invisible spring connections between particles or particles and colliders.

### Constraint Types
- **Spring Connections**: Tiny springs between particles
- **Particle-to-Particle**: Connect individual particles
- **Particle-to-Collider**: Attach particles to objects
- **Polygon Edges**: Connect along polygon edges (cloth-like)
- **Polygon Diag**: Connect along diagonals (additional structure)

### Constraint Properties
- **Stretch**: Springs can extend
- **Pull**: Springs can contract
- **Break**: Springs can break at threshold
- **Stiffness**: Spring strength (lower with higher iterations is more stable)
- **Connection Radius**: Distance for automatic connections
- **Connection Count**: Number of springs per particle

### Applications
1. **Cloth Simulation**: Edge and diagonal connections
2. **Fluid Behavior**: Surface tension, viscosity, friction
3. **Viscous Fluids**: Multiple constraint types for realism
4. **Granular Effects**: Friction-based connections
5. **Soft Body**: Deformable objects

### Simulation Settings
- **Sub-steps**: Increase for accuracy (slower)
- **Iterations**: Higher = stiffer connections (slower)
- **Collision Stiffness**: Dynamic spring for particle separation

### Dynamic Features
- Connections created at particle birth
- Breaking point threshold
- Real-time constraint solving

### Performance Considerations
- High iterations = slower but more stable
- Very high stiffness can cause instability
- Sub-stepping improves accuracy

### WebGL Feasibility
- Basic spring constraints: **Medium** (Verlet integration or constraint solver)
- Cloth simulation: **Medium** (constraint-based cloth exists in WebGL demos)
- Constraint breaking: **High** (conditional removal)
- Multiple constraint types: **Medium** (different constraint classes)
- High iteration counts: **Low-Medium** (performance bottleneck)

---

## 11. PERFORMANCE

### NeXus GPU System (2025+)

#### Overview
- **Vulkan-based**: Cross-platform GPU particle simulation
- **GPU Acceleration**: Massive speed improvements over CPU
- **Real-time Interaction**: Viewport manipulation of simple systems
- **Integrated**: Seamlessly works with X-Particles ecosystem

#### 2025.4 Enhancements
- **Rebuilt Core**: Re-engineered for faster GPU simulation
- **Reduced VRAM**: Lower memory usage
- **Responsive Data Handling**: Improved particle and fluid data
- **Expanded Mapping**: Looping data channels, layered GPU falloffs

#### GPU Features
- Fluids on GPU
- Grains on GPU
- Constraints on GPU
- Particle modifiers on GPU

#### System Requirements
- **GPU**: Modern NVIDIA, AMD, Intel, or Apple M Series
- **VRAM**: Minimum 4GB
- **API**: Vulkan support required
- **Compute**: Advanced GPU compute capability
- **Drivers**: Up-to-date, stable drivers

#### Limitations
- **Single GPU**: Simulations run on one GPU (no multi-GPU)
- **Local Processing**: Cannot offload to distributed rendering
- **Tile Rendering**: Multi-GPU only for render tiles, not simulation
- **TDR Timeout**: Windows may need timeout adjustments for long sessions

#### Performance Tips
- First playback has delay (data transfer to GPU)
- Subsequent plays start promptly if no changes
- Simulation updates in real-time without timeline

### Multi-Threading (CPU)
- **TerraformFX**: Fully multi-threaded, uses all CPU threads
- **X-Particles CPU**: Non-real-time, CPU-bound engine
- **Scalability**: Billions of particles with performant CPU

### Render Performance
- **Multi-instance Support**: xpGenerator and xpScatter (efficient)
- **Instanced Rendering**: Primitives and custom geometry
- **Viewport Modes**: Multiple display modes for fast preview

### Hardware Recommendations
- **CPU**: AMD Ryzen Threadripper PRO 3955WX or equivalent
- **PCIe**: 4.0 support for double I/O performance vs 3.0

### Cloud Rendering
- X-Particles compatible with cloud rendering services
- High-speed rendering for Cinema 4D + X-Particles

### WebGL Feasibility

#### High Feasibility
- **Instancing**: WebGL 2.0 instanced rendering (high particle counts)
- **Compute Shaders**: WebGPU compute for physics (emerging standard)
- **Transform Feedback**: GPU particle updates (WebGL 2.0)
- **Multi-threading**: Web Workers for parallel CPU tasks
- **Spatial Optimization**: Octrees, grids, BVH for collision

#### Medium Feasibility
- **GPU Particles**: Possible but less flexible than compute shaders
- **GPGPU via Textures**: Encode particle data in textures (GPGPU hack)
- **Parallel.js/GPU.js**: Libraries for GPU computation
- **WebAssembly**: Near-native performance for physics

#### Limitations
- No Vulkan (WebGPU is emerging equivalent)
- Less VRAM access than native
- Browser performance variability
- Single-threaded main loop (use Workers for physics)

---

## ADDITIONAL FEATURES

### xpScatter
- Scatter objects on multiple geometries
- Slope, height, curvature-based distribution
- Texture-driven placement
- Modifiers and effectors integration
- Overlap prevention (kill or push apart)
- Camera frustum culling
- Falloff/field integration
- Multi-instance support

### Proximity Shader
- Distance-based shading
- Min/max distance ranges
- Falloff spline control
- Per-emitter selection

### xpCover Modifier
- Target or cover objects
- Acuteness of turn control
- Snap tolerance
- Minimum distance threshold

### Integration Features
- **MoGraph**: Cloner, Matrix, Fracture compatibility
- **Cinema 4D Modifiers**: All standard modifiers work
- **Object Deformers**: Deformer compatibility
- **Hair Module**: Hair integration
- **Thinking Particles**: TP compatibility
- **Dynamics R14+**: Native dynamics integration
- **Renderers**: Standard, Physical, Redshift, Arnold, Octane

### History & Industry Use
- First release: 2012
- Used in: Doctor Strange, 007 Spectre, Blade Runner 2049
- Found in major VFX studios

---

## WEBGL IMPLEMENTATION PRIORITY

### HIGH PRIORITY (Highly Feasible)
1. **Basic Emitters**: Point, edge, object position emission
2. **Standard Modifiers**: Gravity, wind, turbulence, attractor, vortex
3. **Particle Types**: Standard particles, sprite primitives, instances
4. **Groups**: Group assignment and filtering
5. **Questions/Actions**: Age, speed, distance-based conditionals
6. **Actions**: Color, scale, speed, kill, spawn changes
7. **Data Mapping**: Texture sampling, vertex attributes, falloffs
8. **Trail Generation**: Line strips or instanced tubes
9. **Instanced Rendering**: High particle counts with instancing
10. **Transform Feedback**: GPU particle updates (WebGL 2.0)

### MEDIUM PRIORITY (Feasible with Effort)
1. **Object Volume Emission**: Voxel or ray-based sampling
2. **Collision Detection**: Spatial hashing for particle-particle
3. **Basic Cloth**: Constraint-based cloth simulation
4. **Constraints**: Spring connections between particles
5. **Mesh Generation**: Marching cubes or Planar mesher
6. **SPH Fluids**: Basic smooth particle hydrodynamics
7. **Physics Integration**: Ammo.js, Cannon.js, or Rapier
8. **Compute Shaders**: WebGPU for advanced GPU particles

### LOW PRIORITY (Difficult/Performance-Heavy)
1. **FLIP/APIC Fluids**: Very expensive, needs compute
2. **ExplosiaFX**: Volumetric smoke/fire
3. **OpenVDB**: Complex library, not real-time
4. **Bullet Physics**: Full rigid/soft body (heavy)
5. **Advanced Fluid Rendering**: Volumetric ray marching
6. **Python Scripting**: Would need JavaScript equivalent

---

## RECOMMENDED WEBGL FEATURE SET

### Core System
- Multi-emitter management
- Point, edge, object position emission
- Vertex map and texture-driven emission
- Standard particles with sprite/instance rendering
- Group system with dynamic assignment

### Modifiers
- Gravity (standard and Newtonian)
- Wind (with turbulence)
- Turbulence (standard, wavy, fBm)
- Attractor (point and object-based)
- Vortex
- Spawn
- Kill
- Color
- Transform
- Rotator

### Questions/Actions
- Age-based questions
- Speed-based questions
- Distance-based questions
- Basic collision questions
- Change color action
- Change scale action
- Change speed action
- Kill action
- Spawn action
- Change group action

### Data Mapping
- Texture sampling for parameters
- Falloff curves (age-based, distance-based)
- Vertex attribute mapping
- Custom data channels

### Rendering
- Instanced geometry rendering
- Point sprite rendering
- Trail generation (line strips)
- Planar mesher (triangle mesh)
- LOD system for performance

### Performance
- Spatial hashing for collision
- Octree/BVH for optimization
- Transform feedback for GPU updates
- Web Workers for physics offload
- WebGPU compute (when available)

---

## SOURCES

### Official Documentation
- [INSYDIUM X-Particles](https://insydium.ltd/products/x-particles/)
- [X-Particles Documentation - Emitter Object](https://docs.x-particles.net/html/emitterv4_object_emitter.php)
- [X-Particles Documentation - Particle Modifiers](https://docs.x-particles.net/html/modifiers.php)
- [X-Particles Documentation - Sprite Object](https://docs.x-particles.net/html/sprite.php)
- [X-Particles Documentation - Generator Objects](https://docs.x-particles.net/html/generators.php)
- [X-Particles Documentation - Group Object](https://docs.x-particles.net/html/groupobject.php)
- [X-Particles Documentation - The X-Particles Control System](https://docs.x-particles.net/html/controlsys.php)
- [X-Particles Documentation - Question Object](https://docs.x-particles.net/html/questionobj.php)
- [X-Particles Documentation - Actions](https://docs.x-particles.net/html/actions.php)
- [X-Particles Documentation - Data Mapping](https://docs.x-particles.net/html/datamapping.php)
- [X-Particles Documentation - ExplosiaFX](https://docs.x-particles.net/html/explosia.php)
- [X-Particles Documentation - FLIP/APIC Fluid Object](https://docs.x-particles.net/html/flipdomain.php)
- [X-Particles Documentation - Constraints Object](https://docs.x-particles.net/html/constraints.php)
- [X-Particles Documentation - Collision Engine](https://docs.x-particles.net/html/collengine.php)
- [X-Particles Documentation - Collider Tag](https://docs.x-particles.net/html/collidertag.php)

### Product Information
- [INSYDIUM Fused - NeXus](https://insydium.ltd/products/nexus/)
- [INSYDIUM - Fluids and Grains](https://insydium.ltd/products/x-particles/fluids-and-grains/)
- [INSYDIUM - Dynamics](https://insydium.ltd/products/x-particles/dynamics/)
- [INSYDIUM - xpScatter](https://insydium.ltd/products/x-particles/xpscatter/)
- [INSYDIUM - Key Features](https://insydium.ltd/products/x-particles/key-features/)
- [INSYDIUM - NeXus FAQ](https://insydium.ltd/help/?q=3897)

### Integration & Compatibility
- [Maxon - Cinema 4D - X-Particles Integration](https://www.maxon.net/en/cinema-4d/features/x-particles-integration)
- [Cinema 4D Particles Help](https://help.maxon.net/r3d/cinema/en-us/Content/html/Cinema+4D+Particles.html)

### News & Updates
- [CG Channel - Insydium releases NeXus](https://www.cgchannel.com/2022/09/insydium-unveils-nexus/)
- [Digital Production - INSYDIUM Fused 2025.4](https://digitalproduction.com/2025/12/12/insydium-fused-2025-4-faster-nexus-new-gpu-sims-and-a-procedural-animation-toolkit/)
- [CG Channel - X-Particles 2020 update](https://www.cgchannel.com/2020/07/sneak-peek-the-x-particles-2020-public-release/)

### Third-Party Resources
- [Creative Dojo - X-Particles: Cinema 4D's Most Powerful Particle System](https://creativedojo.net/x-particles-cinema-4ds-powerful-particle-system/)
- [ParticleSystems.Net - X-Particles for Cinema 4D Overview](https://particlesystems.net/x-particles/)
- [Travis Vermilye - 9 Reasons to Add X-Particles to Your C4D Workflow](https://www.travisvermilye.com/add-x-particles-to-your-c4d-workflow/)
- [iRender - X-Particles Features](https://irendering.net/the-most-powerful-insydium-features-for-cinema4d/)
- [Lesterbanks - Meshing Fluid Sims With ExplosiaFX](https://lesterbanks.com/2020/09/meshing-fluid-sims-with-explosiafx-in-c4d/)

---

**Document Version**: 1.0
**Research Date**: December 16, 2025
**Focus**: WebGL Implementation Feasibility
