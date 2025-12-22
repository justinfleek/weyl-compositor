# Three.js Camera System Research
## Comprehensive Feature Documentation and Implementation Guide

---

## Table of Contents
1. [Camera Types](#1-camera-types)
2. [Camera Properties](#2-camera-properties)
3. [Camera Controls](#3-camera-controls)
4. [Depth of Field](#4-depth-of-field)
5. [Camera Animation](#5-camera-animation)
6. [Projection and Matrix Manipulation](#6-projection-and-matrix-manipulation)
7. [Multi-Camera Systems](#7-multi-camera-systems)
8. [VR/XR Camera Handling](#8-vrxr-camera-handling)
9. [Frustum Culling](#9-frustum-culling)
10. [Camera Helpers](#10-camera-helpers)
11. [Professional 3D Software Camera Features](#11-professional-3d-software-camera-features)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Camera Types

### 1.1 PerspectiveCamera
**Description**: Mimics human eye perspective with realistic depth perception. Most common projection mode for 3D scenes.

**Key Properties**:
- `fov` (Field of View): Vertical angle in degrees (default: 50)
- `aspect`: Width/height ratio of render area
- `near`: Near clipping plane (default: 0.1, must be > 0)
- `far`: Far clipping plane (default: 2000)
- `zoom`: Zoom factor (default: 1)
- `filmGauge`: Film size reference in mm (default: 35)
- `focus`: World distance to focused object (default: 10)

**Use Cases**:
- Standard 3D scenes
- First-person games
- Architectural visualization
- Product viewers

**Implementation Notes**:
```javascript
const camera = new THREE.PerspectiveCamera(
  75,                           // fov
  window.innerWidth / window.innerHeight,  // aspect
  0.1,                          // near
  1000                          // far
);
```

### 1.2 OrthographicCamera
**Description**: Orthographic projection where object size remains constant regardless of distance from camera.

**Key Properties**:
- `left`, `right`, `top`, `bottom`: Frustum boundaries
- `near`: Near clipping plane (default: 0.1, 0 is valid unlike PerspectiveCamera)
- `far`: Far clipping plane (default: 2000)
- `zoom`: Zoom factor

**Use Cases**:
- 2D scenes and UI elements
- Technical/architectural drawings
- CAD applications
- Isometric games
- Minimap overlays

**Implementation Notes**:
```javascript
const camera = new THREE.OrthographicCamera(
  left, right, top, bottom, near, far
);
// Must call updateProjectionMatrix() after changing frustum properties
camera.updateProjectionMatrix();
```

### 1.3 CubeCamera
**Description**: Captures environment in 6 directions (forward, back, left, right, up, down) to create environment maps.

**Key Properties**:
- Contains 6 PerspectiveCameras internally
- Renders to WebGLCubeRenderTarget
- Inherits from Object3D

**Use Cases**:
- Environment mapping for reflections
- Real-time reflections on metallic/glass surfaces
- Dynamic cubemap generation
- Shadow mapping

**Implementation Notes**:
```javascript
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(near, far, cubeRenderTarget);
```

### 1.4 ArrayCamera
**Description**: Renders scene multiple times using multiple cameras, each rendering to a specific canvas area.

**Key Properties**:
- Array of sub-cameras
- Each sub-camera has defined viewport
- Enables split-screen rendering

**Use Cases**:
- Local multiplayer split-screen
- Multi-viewport editors
- Security camera grids
- Picture-in-picture effects

**Implementation Notes**:
```javascript
const cameras = [];
for (let i = 0; i < 4; i++) {
  const subcamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  subcamera.viewport = new THREE.Vector4(x, y, width, height);
  cameras.push(subcamera);
}
const arrayCamera = new THREE.ArrayCamera(cameras);
```

### 1.5 StereoCamera
**Description**: Renders scene through two cameras mimicking human eyes for stereoscopic 3D effects.

**Key Properties**:
- Creates parallax effect for depth perception
- Separate views for left and right eye
- Eye separation configurable

**Use Cases**:
- Virtual Reality (VR) applications
- Augmented Reality (AR)
- Stereoscopic 3D displays
- Anaglyph 3D (red/blue glasses)

**Implementation Notes**:
```javascript
const stereoCamera = new THREE.StereoCamera();
stereoCamera.aspect = aspect;
stereoCamera.eyeSep = 0.064; // Average human eye separation in meters
stereoCamera.update(mainCamera);
```

---

## 2. Camera Properties

### 2.1 Field of View (FOV)
**Description**: Vertical viewing angle in degrees determining scene visibility extent.

**Details**:
- Humans have ~180° FOV
- Games typically use 60-90°
- Higher FOV = wider angle view
- Lower FOV = zoomed-in/telephoto effect
- Only applies to PerspectiveCamera

**Best Practices**:
- Standard: 50-75°
- Wide angle: 90-110°
- Telephoto: 20-40°
- Must call `updateProjectionMatrix()` after changing

### 2.2 Aspect Ratio
**Description**: Ratio between horizontal and vertical render dimensions.

**Details**:
- Standard: `window.innerWidth / window.innerHeight`
- Affects image shape (wide vs tall)
- Must update on window resize
- Critical for preventing distortion

**Implementation**:
```javascript
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

### 2.3 Near and Far Clipping Planes
**Description**: Define visible rendering range from camera.

**Details**:
- **Near plane**: Minimum visible distance (PerspectiveCamera: must be > 0)
- **Far plane**: Maximum visible distance
- Objects outside range are culled
- Avoid extreme values to prevent z-fighting

**Best Practices**:
- Keep near > 0 for PerspectiveCamera
- Set near as large as possible for better depth precision
- Set far as small as possible for better depth precision
- Typical values: near = 0.1, far = 1000

### 2.4 Zoom
**Description**: Camera zoom factor for magnification without changing FOV.

**Details**:
- Default: 1
- Values > 1: Zoom in
- Values < 1: Zoom out
- Preferred over manipulating FOV for animation
- Works with both Perspective and Orthographic cameras

**Implementation**:
```javascript
camera.zoom = 2.0; // 2x zoom
camera.updateProjectionMatrix();
```

### 2.5 Focus Distance
**Description**: World-space distance to focused object for depth effects.

**Details**:
- Property: `camera.focus`
- Default: 10
- Used by StereoCamera and postprocessing
- Doesn't affect projection matrix directly
- Critical for realistic depth-of-field effects

### 2.6 Film Gauge and Focal Length
**Description**: Photographic camera properties for realistic lens simulation.

**Details**:
- **filmGauge**: Film size in mm (default: 35mm full frame)
- **filmOffset**: Horizontal film offset
- Methods:
  - `setFocalLength(focalLength)`: Set FOV by focal length
  - `getFocalLength()`: Get current focal length
  - `getFilmWidth()`: Get film width based on aspect
  - `getFilmHeight()`: Get film height based on aspect
  - `getEffectiveFOV()`: Get FOV considering zoom

**Professional Mapping**:
- 24mm = Wide angle (~84° FOV)
- 35mm = Standard (~54° FOV)
- 50mm = Normal (~40° FOV)
- 85mm = Portrait (~24° FOV)
- 200mm = Telephoto (~10° FOV)

---

## 3. Camera Controls

### 3.1 OrbitControls
**Description**: Most popular control system for examining objects from all angles.

**Features**:
- Rotate around target point
- Zoom in/out
- Pan (shift + drag)
- Damping for smooth motion
- Configurable constraints

**Properties**:
- `enableDamping`: Smooth momentum (requires update() in loop)
- `dampingFactor`: Damping strength (default: 0.05)
- `target`: Point camera orbits around
- `minDistance` / `maxDistance`: Zoom constraints
- `minPolarAngle` / `maxPolarAngle`: Vertical rotation limits
- `minAzimuthAngle` / `maxAzimuthAngle`: Horizontal rotation limits
- `enablePan`: Enable/disable panning
- `enableZoom`: Enable/disable zooming
- `enableRotate`: Enable/disable rotation

**Use Cases**:
- Product viewers
- 3D model inspection
- Architectural walkthroughs (fixed orbit)
- Character viewers

**Implementation**:
```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 100;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;

// In animation loop
controls.update();
```

### 3.2 TrackballControls
**Description**: Similar to OrbitControls but without maintaining constant up vector.

**Features**:
- Can orbit past polar extremes
- No gimbal lock
- Free rotation on all axes
- Rolling capability

**Differences from OrbitControls**:
- Camera can go upside down
- No concept of "up" direction
- More suitable for space simulations

**Use Cases**:
- Space games
- 3D modeling software
- Scientific visualization
- Objects without clear "up" direction

### 3.3 FlyControls
**Description**: Spacecraft-like movement with 6 degrees of freedom.

**Features**:
- Roll on all axes
- Forward/backward movement
- Requires delta time for frame-rate independence
- Continuous movement while keys held

**Properties**:
- `movementSpeed`: Translation speed
- `rollSpeed`: Roll rotation speed
- `dragToLook`: Require mouse drag to look
- `autoForward`: Continuous forward movement

**Use Cases**:
- Flight simulators
- Space exploration
- Architectural flythroughs
- Free-form navigation

**Implementation**:
```javascript
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

const controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 10;
controls.rollSpeed = Math.PI / 24;

// In animation loop (requires delta time)
const delta = clock.getDelta();
controls.update(delta);
```

### 3.4 FirstPersonControls
**Description**: Alternative to FlyControls with WASD and mouse control.

**Features**:
- WASD/Arrow keys for movement
- Mouse for looking around
- Similar to FlyControls
- Requires delta time

**Use Cases**:
- First-person games
- Virtual tours
- Walkthroughs

### 3.5 PointerLockControls
**Description**: Uses Pointer Lock API for first-person game controls.

**Features**:
- Captures mouse for infinite rotation
- Similar to FPS game controls
- Requires user interaction to activate
- No built-in movement (implement separately)

**Properties**:
- Only handles looking (rotation)
- Movement must be implemented manually
- Events: 'lock', 'unlock', 'change'

**Use Cases**:
- First-person shooters
- Immersive VR-like experiences
- Games requiring precise mouse control
- Minecraft-style controls

**Implementation**:
```javascript
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

const controls = new PointerLockControls(camera, document.body);

// Activate on click
document.addEventListener('click', () => {
  controls.lock();
});

// Listen for lock/unlock
controls.addEventListener('lock', () => console.log('Locked'));
controls.addEventListener('unlock', () => console.log('Unlocked'));

// Manual movement implementation
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function animate() {
  if (controls.isLocked) {
    // Implement WASD movement
    direction.z = Number(forward) - Number(backward);
    direction.x = Number(right) - Number(left);
    direction.normalize();

    if (forward || backward) velocity.z -= direction.z * 400 * delta;
    if (left || right) velocity.x -= direction.x * 400 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }
}
```

### 3.6 Additional Controls (React-Three-Fiber/Drei)
**Description**: Extended control systems available in React ecosystem.

- **MapControls**: Similar to OrbitControls but optimized for map viewing
- **ArcballControls**: Intuitive 3D rotation using arcball technique
- **DeviceOrientationControls**: Use device gyroscope for mobile VR
- **CameraControls**: Advanced camera control library with smooth transitions
- **FaceControls**: Control camera with face tracking

### 3.7 Delta Time Requirements
**Critical Note**: FlyControls and FirstPersonControls require delta time for frame-rate independence.

**Why Delta Time Matters**:
- Ensures consistent speed across different refresh rates
- Prevents faster movement on high-FPS systems
- Prevents slower movement on low-FPS systems

**Implementation**:
```javascript
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  controls.update(delta); // Pass delta time
  renderer.render(scene, camera);
}
```

---

## 4. Depth of Field

### 4.1 BokehPass (Official Three.js)
**Description**: Realistic depth-of-field with bokeh blur effect.

**Import Path**: `three/addons/postprocessing/BokehPass.js`

**Parameters**:
- `focus`: Distance to focus plane (0-1 normalized)
- `aperture`: Lens aperture size (0.00001 - 0.1)
- `maxblur`: Maximum blur amount (0-0.01)

**Features**:
- Real-time adjustable focus
- Realistic bokeh shapes
- Based on Martins Upitis shader
- Works with EffectComposer

**Implementation**:
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bokehPass = new BokehPass(scene, camera, {
  focus: 1.0,
  aperture: 0.025,
  maxblur: 0.01,
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

// Update at runtime
bokehPass.uniforms.focus.value = newFocus;
bokehPass.uniforms.aperture.value = newAperture;
bokehPass.uniforms.maxblur.value = newMaxBlur;

// Cleanup
bokehPass.dispose();
```

### 4.2 DOFEffect (pmndrs/postprocessing)
**Description**: Advanced depth-of-field effect from pmndrs library.

**Features**:
- Dynamic focal point setting
- More performant than BokehPass
- Better integration with React-Three-Fiber
- Customizable bokeh shapes
- Realistic blur gradients

**Implementation**:
```javascript
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';

// React Three Fiber
<EffectComposer>
  <DepthOfField
    focusDistance={0.0}
    focalLength={0.02}
    bokehScale={2.0}
    height={480}
  />
</EffectComposer>
```

### 4.3 Technique Comparison

| Feature | BokehPass | pmndrs DOFEffect |
|---------|-----------|------------------|
| Performance | Good | Better |
| Quality | High | High |
| Ease of Use | Moderate | Easy (especially with R3F) |
| Customization | Good | Excellent |
| React Support | Manual | Built-in |
| Bokeh Shapes | Circular | Customizable |

### 4.4 Focus Pulling Techniques
**Description**: Animating focus between objects (rack focus effect).

**Method 1: Manual Focus Animation**
```javascript
// Animate focus from object A to object B
const startFocus = objectA.position.distanceTo(camera.position);
const endFocus = objectB.position.distanceTo(camera.position);

gsap.to(bokehPass.uniforms.focus, {
  value: endFocus / camera.far, // Normalize
  duration: 2,
  ease: "power2.inOut"
});
```

**Method 2: Autofocus (tracking object)**
```javascript
function updateAutofocus(targetObject) {
  const distance = targetObject.position.distanceTo(camera.position);
  const normalizedDistance = distance / camera.far;
  bokehPass.uniforms.focus.value = normalizedDistance;
}
```

### 4.5 Performance Considerations
- DOF is expensive - use judiciously
- Lower resolution for DOF pass to improve performance
- Consider LOD (Level of Detail) for blurred objects
- Use selective focus rather than full-screen blur when possible

---

## 5. Camera Animation

### 5.1 Position Animation
**Description**: Moving camera through 3D space.

**Method 1: GSAP (GreenSock)**
```javascript
import gsap from 'gsap';

// Simple position tween
gsap.to(camera.position, {
  x: 10,
  y: 5,
  z: 15,
  duration: 2,
  ease: "power2.inOut"
});

// Timeline for complex sequences
const timeline = gsap.timeline();
timeline.to(camera.position, { x: 10, duration: 1 })
        .to(camera.position, { y: 5, duration: 1 })
        .to(camera.position, { z: 15, duration: 1 });
```

**Method 2: React-Spring (for React-Three-Fiber)**
```javascript
import { useSpring, animated } from '@react-spring/three';

const { position } = useSpring({
  position: active ? [10, 5, 15] : [0, 0, 5],
  config: { mass: 1, tension: 170, friction: 26 }
});

<animated.perspectiveCamera position={position} />
```

**Method 3: Manual Lerp**
```javascript
const targetPosition = new THREE.Vector3(10, 5, 15);
const speed = 0.05;

function animate() {
  camera.position.lerp(targetPosition, speed);
}
```

### 5.2 Rotation Animation
**Problem**: Direct rotation animation can cause gimbal lock (camera spinning unexpectedly).

**Solution**: Use Quaternions
```javascript
// Wrong way (can cause gimbal lock)
gsap.to(camera.rotation, { x: Math.PI / 4, y: Math.PI / 2 });

// Correct way (using quaternions)
const startQuaternion = camera.quaternion.clone();
const endQuaternion = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(Math.PI / 4, Math.PI / 2, 0)
);

gsap.to({ t: 0 }, {
  t: 1,
  duration: 2,
  onUpdate: function() {
    camera.quaternion.slerpQuaternions(
      startQuaternion,
      endQuaternion,
      this.targets()[0].t
    );
  }
});
```

### 5.3 LookAt Animation
**Description**: Smoothly transitioning camera's target point.

**Method 1: Separate LookAt Curve**
```javascript
// Create path for camera to look at
const lookAtCurve = new THREE.LineCurve3(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 5, 0)
);

// In animation loop
const lookAtPoint = lookAtCurve.getPointAt(progress);
camera.lookAt(lookAtPoint);
```

**Method 2: Smooth LookAt Transition**
```javascript
const currentLookAt = new THREE.Vector3();
const targetLookAt = new THREE.Vector3(10, 0, 0);

function animate() {
  currentLookAt.lerp(targetLookAt, 0.1);
  camera.lookAt(currentLookAt);
}
```

### 5.4 Path-Based Animation (Spline Curves)
**Description**: Camera follows predetermined 3D path.

**CatmullRomCurve3 (Smooth Curves)**
```javascript
// Define control points
const points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 5, 5),
  new THREE.Vector3(20, 0, 10),
  new THREE.Vector3(30, -5, 15)
];

// Create smooth curve
const curve = new THREE.CatmullRomCurve3(points);

// Visualize curve (optional)
const points = curve.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const splineObject = new THREE.Line(geometry, material);
scene.add(splineObject);

// Animate camera along path
let progress = 0;
function animate() {
  progress += 0.001;
  if (progress > 1) progress = 0;

  const point = curve.getPointAt(progress);
  camera.position.copy(point);

  // Look ahead on path
  const lookAheadPoint = curve.getPointAt((progress + 0.05) % 1);
  camera.lookAt(lookAheadPoint);
}
```

**CubicBezierCurve3 (Precise Control)**
```javascript
const curve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(0, 0, 0),      // Start point
  new THREE.Vector3(5, 10, 0),     // First control point
  new THREE.Vector3(15, 10, 0),    // Second control point
  new THREE.Vector3(20, 0, 0)      // End point
);

// Use same animation pattern as above
```

### 5.5 Cinematic Camera Techniques

**Dolly Zoom (Vertigo Effect)**
```javascript
// Keep object same size while changing FOV and position
function dollyZoom(targetObject, targetFOV) {
  const initialDistance = camera.position.distanceTo(targetObject.position);
  const initialFOV = camera.fov;

  // Calculate required distance for new FOV
  const factor = Math.tan(THREE.MathUtils.degToRad(initialFOV) / 2) /
                 Math.tan(THREE.MathUtils.degToRad(targetFOV) / 2);
  const newDistance = initialDistance * factor;

  gsap.to(camera, {
    fov: targetFOV,
    duration: 2,
    onUpdate: () => camera.updateProjectionMatrix()
  });

  gsap.to(camera.position, {
    z: camera.position.z + (newDistance - initialDistance),
    duration: 2
  });
}
```

**Ease In/Out with Custom Curves**
```javascript
// Use GSAP's easing functions
gsap.to(camera.position, {
  x: 10,
  duration: 2,
  ease: "power4.inOut"  // Smooth acceleration/deceleration
});

// Available easings: power1-4, back, elastic, bounce, circ, expo, sine
```

### 5.6 Camera Path Tools
**Using FlyControls for Path Planning**
```javascript
// Use FlyControls to find perfect angles
// Record positions and rotations
const waypoints = [];

document.addEventListener('keydown', (e) => {
  if (e.key === 'r') { // Record waypoint
    waypoints.push({
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone()
    });
    console.log('Waypoint recorded:', waypoints.length);
  }
});

// Export waypoints for production
console.log(JSON.stringify(waypoints));
```

### 5.7 Performance Optimization
- Use `requestAnimationFrame` for smooth 60fps
- Limit expensive lookAt calls
- Pre-calculate paths when possible
- Use LOD (Level of Detail) for objects far from camera
- Cull objects outside camera frustum

---

## 6. Projection and Matrix Manipulation

### 6.1 Understanding Three.js Matrices
**Description**: Three.js uses matrices for efficient 3D transformations.

**Key Matrices**:
1. **Model Matrix** (`object.matrixWorld`): Object's position/rotation/scale
2. **View Matrix** (`camera.matrixWorldInverse`): Camera's transform
3. **Projection Matrix** (`camera.projectionMatrix`): Camera's lens properties
4. **MVP Matrix**: Combined transformation matrix

**Matrix Hierarchy**:
```
Screen Space = Projection Matrix × View Matrix × Model Matrix × Vertex
```

### 6.2 World-to-Screen Conversion
**Description**: Converting 3D world coordinates to 2D screen coordinates.

**Basic Method**:
```javascript
// Get world position of object
const worldPosition = new THREE.Vector3();
object.getWorldPosition(worldPosition);

// Project to normalized device coordinates (-1 to 1)
worldPosition.project(camera);

// Convert to screen coordinates
const canvas = renderer.domElement;
const x = (worldPosition.x * 0.5 + 0.5) * canvas.clientWidth;
const y = (worldPosition.y * -0.5 + 0.5) * canvas.clientHeight;
const screenPosition = { x, y };

// Check if in front of camera (z < 1)
if (worldPosition.z < 1) {
  // Position is visible
}
```

**Advanced Method (with depth)**:
```javascript
function worldToScreen(worldPosition, camera, canvas) {
  const projected = worldPosition.clone().project(camera);

  return {
    x: (projected.x * 0.5 + 0.5) * canvas.clientWidth,
    y: (projected.y * -0.5 + 0.5) * canvas.clientHeight,
    z: projected.z, // -1 (near) to 1 (far)
    visible: projected.z < 1 &&
             projected.z > -1 &&
             Math.abs(projected.x) <= 1 &&
             Math.abs(projected.y) <= 1
  };
}
```

### 6.3 Screen-to-World Conversion (Raycasting)
**Description**: Converting 2D screen coordinates to 3D world ray.

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  // Normalize mouse coordinates (-1 to 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Create ray from camera through mouse position
  raycaster.setFromCamera(mouse, camera);

  // Find intersections
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const point = intersects[0].point; // 3D world position
    const object = intersects[0].object; // Hit object
    const distance = intersects[0].distance; // Distance from camera
  }
}

canvas.addEventListener('click', onMouseClick);
```

### 6.4 Custom Projection Matrix
**Description**: Manually controlling camera projection for advanced effects.

**Off-Center Projection (for portals, mirrors)**:
```javascript
function setAsymmetricFrustum(camera, left, right, top, bottom, near, far) {
  camera.projectionMatrix.makePerspective(
    left, right, bottom, top, near, far
  );
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

// Example: Off-center projection for VR
setAsymmetricFrustum(camera, -0.5, 0.7, 0.8, -0.8, 0.1, 1000);
```

**Oblique Projection (for water reflections)**:
```javascript
function setObliqueFrustum(camera, clipPlane) {
  const projectionMatrix = camera.projectionMatrix.clone();
  const q = new THREE.Vector4();

  q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
        projectionMatrix.elements[0];
  q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
        projectionMatrix.elements[5];
  q.z = -1.0;
  q.w = (1.0 + projectionMatrix.elements[10]) /
        projectionMatrix.elements[14];

  // Scale plane
  const c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

  // Replace third row of projection matrix
  projectionMatrix.elements[2] = c.x;
  projectionMatrix.elements[6] = c.y;
  projectionMatrix.elements[10] = c.z + 1.0;
  projectionMatrix.elements[14] = c.w;

  camera.projectionMatrix = projectionMatrix;
  camera.projectionMatrixInverse.copy(projectionMatrix).invert();
}
```

### 6.5 Camera from External Data
**Description**: Creating camera from calibration data or external sources.

**From Intrinsic Matrix**:
```javascript
function cameraFromIntrinsics(fx, fy, cx, cy, width, height, near, far) {
  const camera = new THREE.PerspectiveCamera();

  // Convert intrinsic parameters to Three.js format
  const fovY = 2 * Math.atan(height / (2 * fy)) * (180 / Math.PI);
  const aspect = width / height;

  camera.fov = fovY;
  camera.aspect = aspect;
  camera.near = near;
  camera.far = far;
  camera.updateProjectionMatrix();

  // Handle principal point offset if needed
  if (cx !== width / 2 || cy !== height / 2) {
    const offsetX = (cx - width / 2) / width;
    const offsetY = (cy - height / 2) / height;
    camera.setViewOffset(width, height,
      offsetX * width, offsetY * height,
      width, height);
  }

  return camera;
}
```

### 6.6 Texture Projection
**Description**: Projecting textures onto geometry using camera matrices.

```javascript
// In vertex shader
uniform mat4 textureProjectionMatrix;
varying vec4 vTexCoords;

void main() {
  vTexCoords = textureProjectionMatrix * modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// In fragment shader
uniform sampler2D projectedTexture;
varying vec4 vTexCoords;

void main() {
  vec3 projection = vTexCoords.xyz / vTexCoords.w;
  vec2 uv = projection.xy * 0.5 + 0.5;

  if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
    gl_FragColor = texture2D(projectedTexture, uv);
  }
}
```

### 6.7 Matrix Best Practices
- Always call `updateProjectionMatrix()` after modifying camera properties
- Use `matrixAutoUpdate = false` when manually controlling matrices
- Clone matrices before modification to preserve originals
- Use `decompose()` to extract position/rotation/scale from matrix

---

## 7. Multi-Camera Systems

### 7.1 ArrayCamera Implementation
**Description**: Native Three.js solution for split-screen rendering.

**Basic Setup**:
```javascript
// Create viewport cameras
const aspectRatio = window.innerWidth / window.innerHeight;
const cameras = [];

// Top-left viewport
const camera1 = new THREE.PerspectiveCamera(50, 0.5 * aspectRatio, 1, 1000);
camera1.viewport = new THREE.Vector4(0, 0.5, 0.5, 0.5); // x, y, width, height (normalized)
camera1.position.set(0, 100, 200);
cameras.push(camera1);

// Top-right viewport
const camera2 = new THREE.PerspectiveCamera(50, 0.5 * aspectRatio, 1, 1000);
camera2.viewport = new THREE.Vector4(0.5, 0.5, 0.5, 0.5);
camera2.position.set(100, 100, 100);
cameras.push(camera2);

// Bottom-left viewport
const camera3 = new THREE.PerspectiveCamera(50, 0.5 * aspectRatio, 1, 1000);
camera3.viewport = new THREE.Vector4(0, 0, 0.5, 0.5);
camera3.position.set(-100, 100, 100);
cameras.push(camera3);

// Bottom-right viewport
const camera4 = new THREE.PerspectiveCamera(50, 0.5 * aspectRatio, 1, 1000);
camera4.viewport = new THREE.Vector4(0.5, 0, 0.5, 0.5);
camera4.position.set(0, 100, -200);
cameras.push(camera4);

// Create ArrayCamera
const arrayCamera = new THREE.ArrayCamera(cameras);

// Render
renderer.render(scene, arrayCamera);
```

### 7.2 Manual Viewport Rendering
**Description**: Using scissor test for custom viewport rendering.

**Method 1: Multiple Cameras, Single Renderer**
```javascript
const cameras = [camera1, camera2, camera3, camera4];
const viewports = [
  { x: 0, y: 0.5, width: 0.5, height: 0.5 },     // Top-left
  { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },   // Top-right
  { x: 0, y: 0, width: 0.5, height: 0.5 },       // Bottom-left
  { x: 0.5, y: 0, width: 0.5, height: 0.5 }      // Bottom-right
];

function render() {
  renderer.setScissorTest(true);

  cameras.forEach((camera, index) => {
    const viewport = viewports[index];
    const left = Math.floor(window.innerWidth * viewport.x);
    const bottom = Math.floor(window.innerHeight * viewport.y);
    const width = Math.floor(window.innerWidth * viewport.width);
    const height = Math.floor(window.innerHeight * viewport.height);

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    renderer.render(scene, camera);
  });

  renderer.setScissorTest(false);
}
```

### 7.3 Picture-in-Picture
**Description**: Small camera view overlaid on main view.

```javascript
function renderPictureInPicture() {
  // Main camera - full screen
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, mainCamera);

  // PiP camera - small inset (bottom-right corner)
  const pipWidth = window.innerWidth * 0.25;
  const pipHeight = window.innerHeight * 0.25;
  const pipX = window.innerWidth - pipWidth - 20;
  const pipY = 20;

  renderer.setScissorTest(true);
  renderer.setViewport(pipX, pipY, pipWidth, pipHeight);
  renderer.setScissor(pipX, pipY, pipWidth, pipHeight);
  renderer.clearDepth(); // Clear depth buffer for proper overlay
  renderer.render(scene, pipCamera);

  renderer.setScissorTest(false);
}
```

### 7.4 Minimap Implementation
**Description**: Top-down orthographic camera as minimap.

```javascript
// Main perspective camera
const mainCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

// Minimap orthographic camera (top-down)
const minimapCamera = new THREE.OrthographicCamera(
  -50, 50, 50, -50, 0.1, 1000
);
minimapCamera.position.set(0, 100, 0);
minimapCamera.lookAt(0, 0, 0);
minimapCamera.rotation.z = -Math.PI / 2; // Orient north-up

// Add player marker
const playerMarker = new THREE.Mesh(
  new THREE.ConeGeometry(2, 4, 3),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
playerMarker.rotation.x = -Math.PI / 2;

function updateMinimap() {
  // Follow player
  minimapCamera.position.x = player.position.x;
  minimapCamera.position.z = player.position.z;

  // Update player marker rotation
  playerMarker.rotation.z = -player.rotation.y;
}

function render() {
  // Main view
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, mainCamera);

  // Minimap (top-right corner)
  const minimapSize = 200;
  const minimapX = window.innerWidth - minimapSize - 20;
  const minimapY = window.innerHeight - minimapSize - 20;

  renderer.setScissorTest(true);
  renderer.setViewport(minimapX, minimapY, minimapSize, minimapSize);
  renderer.setScissor(minimapX, minimapY, minimapSize, minimapSize);
  renderer.clearDepth();
  renderer.render(scene, minimapCamera);
  renderer.setScissorTest(false);
}
```

### 7.5 Security Camera Grid
**Description**: Multiple static camera views in grid layout.

```javascript
class SecurityCameraSystem {
  constructor(renderer, scene, gridSize = 2) {
    this.renderer = renderer;
    this.scene = scene;
    this.gridSize = gridSize;
    this.cameras = [];
    this.setupCameras();
  }

  addCamera(position, target) {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.copy(position);
    camera.lookAt(target);
    this.cameras.push(camera);
  }

  render() {
    const totalCameras = this.cameras.length;
    const cellsPerRow = Math.ceil(Math.sqrt(totalCameras));
    const cellWidth = window.innerWidth / cellsPerRow;
    const cellHeight = window.innerHeight / cellsPerRow;

    this.renderer.setScissorTest(true);

    this.cameras.forEach((camera, index) => {
      const row = Math.floor(index / cellsPerRow);
      const col = index % cellsPerRow;

      const x = col * cellWidth;
      const y = row * cellHeight;

      this.renderer.setViewport(x, y, cellWidth, cellHeight);
      this.renderer.setScissor(x, y, cellWidth, cellHeight);
      this.renderer.render(this.scene, camera);
    });

    this.renderer.setScissorTest(false);
  }
}

// Usage
const securitySystem = new SecurityCameraSystem(renderer, scene);
securitySystem.addCamera(new THREE.Vector3(10, 10, 10), new THREE.Vector3(0, 0, 0));
securitySystem.addCamera(new THREE.Vector3(-10, 10, 10), new THREE.Vector3(0, 0, 0));
securitySystem.addCamera(new THREE.Vector3(10, 10, -10), new THREE.Vector3(0, 0, 0));
securitySystem.addCamera(new THREE.Vector3(-10, 10, -10), new THREE.Vector3(0, 0, 0));
```

### 7.6 Multi-Scene Rendering
**Description**: Different scenes for different cameras.

```javascript
// Create multiple scenes
const mainScene = new THREE.Scene();
const uiScene = new THREE.Scene();

// Setup cameras
const mainCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const uiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

function render() {
  // Render main 3D scene
  renderer.render(mainScene, mainCamera);

  // Render UI overlay (no depth clearing)
  renderer.autoClear = false;
  renderer.render(uiScene, uiCamera);
  renderer.autoClear = true;
}
```

### 7.7 Performance Considerations
- Each camera render is a full scene pass - expensive
- Use LOD (Level of Detail) for distant viewports
- Reduce render resolution for secondary viewports
- Consider render targets for static viewports
- Cull objects outside each camera's frustum
- Use lower quality settings for small viewports

---

## 8. VR/XR Camera Handling

### 8.1 WebXRManager Overview
**Description**: Three.js abstraction of WebXR Device API for VR/AR.

**Key Properties**:
- Automatically manages XR camera updates
- Provides stereo rendering
- Handles controller input
- Manages reference spaces

**Basic Setup**:
```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.xr.enabled = true; // Enable XR
renderer.xr.setFramebufferScaleFactor(1.0); // Adjust resolution (0.5-2.0)

// Add VR button
document.body.appendChild(VRButton.createButton(renderer));

// Set animation loop (required for XR)
renderer.setAnimationLoop(function() {
  renderer.render(scene, camera);
});
```

### 8.2 Session Modes
**Description**: Different XR experiences require different session modes.

**Modes**:
1. **immersive-vr**: Full VR experience (headset)
2. **immersive-ar**: AR experience overlaying real world
3. **inline**: Non-immersive 3D in webpage (magic window)

**Starting Session**:
```javascript
// Request VR session
const sessionInit = {
  optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
};

navigator.xr.requestSession('immersive-vr', sessionInit)
  .then((session) => {
    renderer.xr.setSession(session);
  });
```

### 8.3 Reference Spaces
**Description**: Coordinate systems for positioning in XR.

**Types**:
- **viewer**: Origin at viewer's head
- **local**: Origin at session start, stable tracking
- **local-floor**: Origin at floor level
- **bounded-floor**: Physical boundaries defined
- **unbounded**: Large-scale environments

**Setting Reference Space**:
```javascript
renderer.xr.setReferenceSpaceType('local-floor');
```

### 8.4 Stereoscopic Rendering
**Description**: Separate rendering for left and right eyes.

**How It Works**:
1. WebXRManager automatically creates two cameras
2. Each frame provides pose data via XRFrame
3. View matrices and projection matrices provided per eye
4. XRWebGLLayer binds WebGL context to XR session

**Camera Setup**:
```javascript
// Disable matrix auto-update (XR API handles it)
camera.matrixAutoUpdate = false;

// XR system will update camera.matrix automatically each frame
// via camera.matrix.fromArray(view.transform.matrix)
```

### 8.5 Camera Position in XR
**Description**: Handling camera position differences between XR and non-XR modes.

**Issue**: XR camera position is controlled by headset, not your code.

**Solution**: Use a camera rig/dolly
```javascript
// Create camera rig (parent object)
const cameraRig = new THREE.Group();
cameraRig.position.set(0, 1.6, 5); // Initial position
scene.add(cameraRig);

// Add camera to rig
cameraRig.add(camera);

// Move the rig, not the camera
function moveForward(distance) {
  const direction = new THREE.Vector3();
  cameraRig.getWorldDirection(direction);
  cameraRig.position.addScaledVector(direction, distance);
}
```

### 8.6 Controller Handling
**Description**: Accessing VR controllers for input.

```javascript
// Get controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

// Add controller models
const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

// Listen for controller events
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);

scene.add(controller1);
scene.add(controller2);
```

### 8.7 AR Camera (Hit Testing)
**Description**: Placing objects in real-world space using AR.

```javascript
let hitTestSource = null;
let hitTestSourceRequested = false;

function animate() {
  const session = renderer.xr.getSession();

  if (session && !hitTestSourceRequested) {
    session.requestReferenceSpace('viewer').then((referenceSpace) => {
      session.requestHitTestSource({ space: referenceSpace })
        .then((source) => {
          hitTestSource = source;
        });
    });
    hitTestSourceRequested = true;
  }

  if (hitTestSource) {
    const frame = renderer.xr.getFrame();
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(renderer.xr.getReferenceSpace());

      // Place object at hit location
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.visible = false;
    }
  }

  renderer.render(scene, camera);
}
```

### 8.8 360 Video (Stereoscopic)
**Description**: Displaying 360° stereo video for VR.

```javascript
// Create sphere for video
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1); // Invert for inside view

// Load stereoscopic video texture
const video = document.createElement('video');
video.src = 'stereo-360-video.mp4';
video.loop = true;
video.play();

const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;

// Top-bottom stereo layout
const material = new THREE.MeshBasicMaterial({ map: texture });

// Adjust UVs for top half (left eye) and bottom half (right eye)
// This is done automatically by XRWebGLLayer when layersEnabled
```

### 8.9 Device Support
**Compatible Devices**:
- Meta Quest (1, 2, 3, Pro)
- HTC Vive / Vive Pro
- Valve Index
- Windows Mixed Reality headsets
- Android ARCore devices (Chrome)
- iOS devices (WebXR Viewer app, limited)

**Feature Detection**:
```javascript
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr')
    .then((supported) => {
      if (supported) {
        // Show VR button
      } else {
        // Show fallback
      }
    });
}
```

### 8.10 Performance Optimization for XR
- Target 90fps minimum (72fps acceptable, 120fps ideal)
- Use `setFramebufferScaleFactor(0.8)` on mobile for performance
- Minimize draw calls (use instancing, merging)
- Use fixed foveated rendering if available
- Simplify shaders (XR renders twice)
- Use LOD aggressively
- Test on target hardware early

---

## 9. Frustum Culling

### 9.1 Overview
**Description**: Performance optimization that skips rendering objects outside camera view.

**Culling Types**:
1. **Backface Culling**: WebGL native, culls triangles facing away
2. **Frustum Culling**: Three.js automatic, culls objects outside camera frustum
3. **Occlusion Culling**: Advanced, culls objects hidden behind others (not native in Three.js)

### 9.2 How Three.js Frustum Culling Works
**Process**:
1. During render, Three.js filters visible objects
2. Only Mesh, Line, and Points objects are tested (not Groups)
3. Objects' bounding spheres tested against camera frustum
4. Objects outside frustum are skipped

**Frustum Test**:
```javascript
// Three.js does this internally
const frustum = new THREE.Frustum();
const matrix = new THREE.Matrix4();
matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
frustum.setFromProjectionMatrix(matrix);

// Test if object is visible
if (frustum.intersectsObject(mesh)) {
  // Render object
}
```

### 9.3 Controlling Frustum Culling
**Enable/Disable Per Object**:
```javascript
// Disable culling (always render)
mesh.frustumCulled = false;

// Enable culling (default behavior)
mesh.frustumCulled = true;
```

**When to Disable**:
- Objects that extend beyond their bounding volume
- Objects with custom shaders that modify vertices
- Skyboxes
- Always-visible UI elements

### 9.4 Optimizing Frustum Culling
**Technique 1: Tighter Bounding Volumes**
```javascript
// Recompute bounding sphere/box after geometry changes
mesh.geometry.computeBoundingSphere();
mesh.geometry.computeBoundingBox();

// Manual bounding sphere (if automatic is too large)
mesh.geometry.boundingSphere = new THREE.Sphere(
  new THREE.Vector3(0, 0, 0), // Center
  10 // Radius
);
```

**Technique 2: Group-Level Culling**
```javascript
// Create bounding box for entire group
function createGroupBoundingBox(group) {
  const box = new THREE.Box3();
  box.makeEmpty();

  group.traverse((object) => {
    if (object.geometry) {
      if (!object.geometry.boundingBox) {
        object.geometry.computeBoundingBox();
      }
      const objectBox = object.geometry.boundingBox.clone();
      objectBox.applyMatrix4(object.matrixWorld);
      box.union(objectBox);
    }
  });

  // Create invisible mesh with bounding box for culling
  const boxGeometry = new THREE.BoxGeometry(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );
  const boxMesh = new THREE.Mesh(boxGeometry);
  boxMesh.position.copy(box.getCenter(new THREE.Vector3()));
  boxMesh.visible = false;

  return boxMesh;
}

// Check group visibility
const groupBoundingMesh = createGroupBoundingBox(buildingGroup);
if (groupBoundingMesh.frustumCulled && !isInFrustum(groupBoundingMesh)) {
  buildingGroup.visible = false;
} else {
  buildingGroup.visible = true;
}
```

### 9.5 InstancedMesh Culling
**Problem**: Standard InstancedMesh treats all instances as one object for culling.

**Solution 1: InstancedMesh2 Library**
```javascript
// https://github.com/agargaro/three.ez
import { InstancedMesh2 } from '@three.ez/main';

const instancedMesh = new InstancedMesh2(geometry, material, count, {
  behaviour: InstancedMeshBehaviour.DYNAMIC,
  frustumCulling: true // Per-instance culling
});
```

**Solution 2: Manual Per-Instance Culling**
```javascript
class CullableInstancedMesh extends THREE.InstancedMesh {
  constructor(geometry, material, count) {
    super(geometry, material, count);
    this.frustumCulled = false; // Disable automatic culling
    this.instancePositions = [];
    this.instanceRadii = [];
  }

  setInstancePosition(index, position, radius) {
    this.instancePositions[index] = position.clone();
    this.instanceRadii[index] = radius;
  }

  cullInstances(camera) {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    let visibleCount = 0;
    const tempMatrix = new THREE.Matrix4();

    for (let i = 0; i < this.count; i++) {
      const sphere = new THREE.Sphere(
        this.instancePositions[i],
        this.instanceRadii[i]
      );

      if (frustum.intersectsSphere(sphere)) {
        this.getMatrixAt(i, tempMatrix);
        this.setMatrixAt(visibleCount, tempMatrix);
        visibleCount++;
      }
    }

    this.count = visibleCount;
    this.instanceMatrix.needsUpdate = true;
  }
}
```

### 9.6 GPU-Based Culling
**Description**: Performing culling on GPU for massive instance counts.

**Approach**: Use compute shaders (WebGPU) or transform feedback (WebGL2)
```javascript
// WebGPU approach (future)
// Use compute shader to test instances against frustum
// Write visible instances to buffer
// Use indirect drawing to render only visible instances
```

### 9.7 Optimizing Near/Far Planes
**Importance**: Smaller frustum = better depth precision and culling efficiency.

**Best Practices**:
```javascript
// Bad: Huge frustum
camera.near = 0.001;
camera.far = 100000;

// Good: Tight frustum
camera.near = 1;
camera.far = 100;

// Adjust based on scene scale
const sceneBounds = computeSceneBounds();
camera.near = sceneBounds.min * 0.9;
camera.far = sceneBounds.max * 1.1;
```

**Avoid Z-Fighting**:
- Don't put objects right on far plane
- Keep near/far ratio reasonable (< 10000:1)
- Use logarithmic depth buffer for large scenes

### 9.8 Additional Performance Tips
**Renderer Settings**:
```javascript
// Prefer high-performance GPU
const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance'
});
```

**Conditional Rendering**:
```javascript
// Only render when camera moves
let lastCameraPosition = new THREE.Vector3();
let lastCameraQuaternion = new THREE.Quaternion();

function shouldRender() {
  const positionChanged = !camera.position.equals(lastCameraPosition);
  const rotationChanged = !camera.quaternion.equals(lastCameraQuaternion);

  if (positionChanged || rotationChanged) {
    lastCameraPosition.copy(camera.position);
    lastCameraQuaternion.copy(camera.quaternion);
    return true;
  }
  return false;
}

// With OrbitControls
controls.addEventListener('change', () => renderer.render(scene, camera));
```

**Level of Detail (LOD)**:
```javascript
const lod = new THREE.LOD();

// High detail (near)
lod.addLevel(highDetailMesh, 0);

// Medium detail
lod.addLevel(mediumDetailMesh, 50);

// Low detail (far)
lod.addLevel(lowDetailMesh, 100);

scene.add(lod);

// Update LOD in render loop
lod.update(camera);
```

---

## 10. Camera Helpers

### 10.1 CameraHelper Overview
**Description**: Visualizes camera frustum using line segments for debugging.

**Purpose**:
- Debug camera positioning
- Visualize camera FOV and frustum
- Understand shadow camera coverage
- Debug multi-camera setups

**Basic Usage**:
```javascript
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const helper = new THREE.CameraHelper(camera);
scene.add(helper);

// Must be a child of scene, not camera
```

### 10.2 CameraHelper Properties
**Key Properties**:
- `camera`: Reference to camera being visualized
- `pointMap`: Contains frustum visualization points
- `matrix`: Reference to camera.matrixWorld
- `matrixAutoUpdate`: Set to false (uses camera's matrix)

**Methods**:
- `update()`: Updates helper based on camera's projection matrix
- `setColors(...)`: Customize helper colors
- `dispose()`: Free GPU resources

### 10.3 Updating Camera Helper
**Manual Update**:
```javascript
// Call after changing camera properties
camera.fov = 90;
camera.updateProjectionMatrix();
helper.update(); // Update helper to match
```

**Automatic Update**:
```javascript
// In animation loop
function animate() {
  helper.update(); // Updates every frame
  renderer.render(scene, camera);
}
```

### 10.4 Customizing Helper Colors
**Color Scheme**:
```javascript
// Default colors
helper.setColors(
  0xff0000, // Frustum
  0xffaa00, // Cone
  0x0000ff, // Up
  0x00aaff, // Target
  0xffffff, // Cross
);

// Subtle colors
helper.setColors(
  0x444444, // Frustum - dark gray
  0x444444, // Cone - dark gray
  0x00ff00, // Up - green
  0x0000ff, // Target - blue
  0xffffff  // Cross - white
);
```

### 10.5 Multi-Camera Visualization
**Security Camera Setup**:
```javascript
const cameras = [];
const helpers = [];

// Create 4 security cameras
for (let i = 0; i < 4; i++) {
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 50);
  const helper = new THREE.CameraHelper(camera);

  cameras.push(camera);
  helpers.push(helper);
  scene.add(camera);
  scene.add(helper);
}

// Position cameras
cameras[0].position.set(20, 20, 20);
cameras[1].position.set(-20, 20, 20);
cameras[2].position.set(20, 20, -20);
cameras[3].position.set(-20, 20, -20);

// Point at center
cameras.forEach(cam => cam.lookAt(0, 0, 0));

// Update helpers
function animate() {
  helpers.forEach(helper => helper.update());
}
```

### 10.6 Shadow Camera Debugging
**Visualizing Directional Light Shadow Camera**:
```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;

// Configure shadow camera
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;

// Visualize shadow camera
const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(shadowCameraHelper);

// Update after changing shadow properties
function updateShadowCamera() {
  directionalLight.shadow.camera.updateProjectionMatrix();
  shadowCameraHelper.update();
}
```

**Visualizing Spot Light Shadow Camera**:
```javascript
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.castShadow = true;
spotLight.shadow.camera.near = 0.1;
spotLight.shadow.camera.far = 100;
spotLight.shadow.camera.fov = 45;

const spotLightHelper = new THREE.CameraHelper(spotLight.shadow.camera);
scene.add(spotLightHelper);
```

### 10.7 Common Issues and Solutions

**Issue 1: Helper Not Updating**
```javascript
// Problem: Helper appears frozen
// Solution: Call update() regularly or after camera changes

camera.fov = 60;
camera.updateProjectionMatrix();
helper.update(); // Don't forget this!
```

**Issue 2: Helper at Wrong Position**
```javascript
// Problem: Helper renders at false position when camera in rotated Group
// Solution: Add helper directly to scene root, not as child of camera

// Wrong
camera.add(helper); // Don't do this

// Correct
scene.add(helper); // Do this
```

**Issue 3: Helper Visible in Render**
```javascript
// Problem: Helper appears in camera it's visualizing
// Solution: Use layers to hide helper from that camera

// Setup layers
helper.layers.set(1); // Helper on layer 1
camera.layers.enable(0); // Camera sees layer 0
camera.layers.disable(1); // Camera doesn't see layer 1

// Main camera sees everything
mainCamera.layers.enableAll();
```

**Issue 4: NaN Errors**
```javascript
// Problem: "BufferGeometry.computeBoundingSphere(): Computed radius is NaN"
// Cause: Camera has invalid parameters (e.g., near >= far, fov = 0)

// Validate camera parameters
if (camera.near >= camera.far) {
  console.error('Invalid camera: near must be < far');
}
if (camera.fov <= 0 || camera.fov >= 180) {
  console.error('Invalid camera: fov must be between 0 and 180');
}
```

### 10.8 React Three Fiber Integration
**Using useHelper Hook**:
```javascript
import { useHelper } from '@react-three/drei';
import { CameraHelper } from 'three';

function Scene() {
  const cameraRef = useRef();

  // Automatically creates and updates helper
  useHelper(cameraRef, CameraHelper);

  return (
    <perspectiveCamera ref={cameraRef} position={[10, 10, 10]} />
  );
}
```

### 10.9 Custom Camera Helpers
**Creating Custom Visualization**:
```javascript
class CustomCameraHelper extends THREE.Object3D {
  constructor(camera) {
    super();
    this.camera = camera;
    this.createHelper();
  }

  createHelper() {
    // Create custom visualization (e.g., film frame outline)
    const aspect = this.camera.aspect;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(fov / 2);
    const width = height * aspect;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      opacity: 0.5,
      transparent: true
    });

    const frame = new THREE.Mesh(geometry, material);
    frame.position.z = -1; // 1 unit in front of camera
    this.add(frame);
  }

  update() {
    this.matrix.copy(this.camera.matrixWorld);
    this.matrixWorldNeedsUpdate = true;
  }
}
```

### 10.10 Performance Considerations
- Helpers add geometry to scene - impacts performance
- Disable helpers in production builds
- Use layers to selectively show/hide helpers
- Remove helpers when not debugging

```javascript
// Conditional helper creation
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  const helper = new THREE.CameraHelper(camera);
  scene.add(helper);
}
```

---

## 11. Professional 3D Software Camera Features

### 11.1 Camera Rigs

#### 11.1.1 Cinema 4D Camera Rigs
**Overview**: Cinema 4D uses hierarchical null objects to create professional camera rigs.

**Basic Dolly/Crane Rig**:
- 4 null objects: Dolly (base), Boom (height), Arm (extension), Camera (end)
- Each null represents one axis of movement/rotation
- User Data on root null for easy control
- Allows separation of heading, pitch, and bank

**Key Features**:
- Spline-based paths with Align to Spline tag
- Animate along path while controlling aim independently
- Two-node camera (similar to After Effects)
- Target object separate from orbit point

**Available Plugins**:

**GorillaCam** (Greyscalegorilla):
- Cinematic handheld camera movement
- Realistic shake (subtle to heavy)
- Classic stabilizer look with smoothing
- Large camera rig simulation with overshoot
- Three adjustable shake speeds for position and rotation
- "Jolt" feature for specific impacts

**Camera GripTools**:
- Simulates professional grip equipment
- Modes: Tripod, Dolly, Crane, Car, Plane, Helicopter, Flying platform, Handheld
- Approximates real-world mounting systems
- Realistic movement constraints per mode

**HP Dolly Crane**:
- Operates like real-world camera crane
- All parameters animatable
- Realistic physics simulation

**Implementation in Three.js**:
```javascript
class CameraRig {
  constructor(camera) {
    this.dolly = new THREE.Group(); // Base movement
    this.boom = new THREE.Group();  // Height control
    this.arm = new THREE.Group();   // Extension
    this.camera = camera;

    this.dolly.add(this.boom);
    this.boom.add(this.arm);
    this.arm.add(this.camera);

    // Default positions
    this.boom.position.y = 1.6; // Eye height
    this.arm.position.z = 2;    // Arm extension
  }

  // Dolly movement (XZ plane)
  moveDolly(x, z) {
    this.dolly.position.x += x;
    this.dolly.position.z += z;
  }

  // Boom height
  setBoomHeight(y) {
    this.boom.position.y = y;
  }

  // Arm extension
  setArmLength(z) {
    this.arm.position.z = z;
  }

  // Heading (dolly rotation)
  setHeading(angle) {
    this.dolly.rotation.y = angle;
  }

  // Pitch (boom rotation)
  setPitch(angle) {
    this.boom.rotation.x = angle;
  }

  // Bank (camera roll)
  setBank(angle) {
    this.camera.rotation.z = angle;
  }

  getGroup() {
    return this.dolly;
  }
}

// Usage
const rig = new CameraRig(camera);
scene.add(rig.getGroup());

// Animate crane shot
gsap.timeline()
  .to(rig.boom.position, { y: 10, duration: 3 })
  .to(rig.boom.rotation, { x: -Math.PI / 6, duration: 3 }, 0);
```

#### 11.1.2 Blender Camera Rigs
**Built-in Add-on**: "Add Camera Rigs"

**Dolly Rig**:
- Camera bone: Controls camera position (slides on track)
- Aim bone: Target that camera points at
- Simulates real dolly + focus puller workflow
- "Set DOF to Aim" button links aim to focal distance
- Perfect for dolly zoom effect

**Crane Rig**:
- Arm Height and Arm Length bones
- Cinematic crane shots
- Physical constraints like real equipment

**2D Camera Rig**:
- Constrained to 2D plane
- For side-scrolling or isometric views

**Implementation in Three.js**:
```javascript
class DollyRig {
  constructor(camera) {
    this.track = new THREE.Group();
    this.dollyPosition = new THREE.Object3D();
    this.camera = camera;
    this.aim = new THREE.Object3D();

    this.track.add(this.dollyPosition);
    this.dollyPosition.add(this.camera);
    this.track.add(this.aim);

    // Default positions
    this.aim.position.set(0, 0, 0);
    this.dollyPosition.position.set(0, 1.6, 5);
  }

  // Move along track (0-1)
  setTrackPosition(t) {
    // Assume track is along Z axis
    this.dollyPosition.position.z = THREE.MathUtils.lerp(-10, 10, t);
  }

  // Move aim target
  setAimPosition(x, y, z) {
    this.aim.position.set(x, y, z);
  }

  update() {
    this.camera.lookAt(this.aim.getWorldPosition(new THREE.Vector3()));
  }

  // Dolly zoom effect
  dollyZoom(targetFOV, duration) {
    const startFOV = this.camera.fov;
    const startZ = this.dollyPosition.position.z;
    const distance = this.camera.position.distanceTo(this.aim.position);

    // Calculate new Z to keep aim same size
    const factor = Math.tan(THREE.MathUtils.degToRad(startFOV) / 2) /
                   Math.tan(THREE.MathUtils.degToRad(targetFOV) / 2);
    const newZ = startZ + (distance * (factor - 1));

    gsap.timeline()
      .to(this.camera, {
        fov: targetFOV,
        duration: duration,
        onUpdate: () => this.camera.updateProjectionMatrix()
      })
      .to(this.dollyPosition.position, {
        z: newZ,
        duration: duration
      }, 0);
  }

  getGroup() {
    return this.track;
  }
}
```

**Crane Rig Implementation**:
```javascript
class CraneRig {
  constructor(camera) {
    this.base = new THREE.Group();
    this.pivot = new THREE.Group();
    this.arm = new THREE.Group();
    this.camera = camera;

    this.base.add(this.pivot);
    this.pivot.add(this.arm);
    this.arm.add(this.camera);

    // Default setup
    this.pivot.position.y = 2; // Crane base height
    this.arm.position.z = -5;  // Arm length
    this.camera.position.y = 0;
  }

  // Set crane arm height (rotation around pivot)
  setArmHeight(angle) {
    this.pivot.rotation.x = angle;
  }

  // Set arm length
  setArmLength(length) {
    this.arm.position.z = -length;
  }

  // Rotate base
  setPan(angle) {
    this.base.rotation.y = angle;
  }

  getGroup() {
    return this.base;
  }
}

// Usage: Classic crane up and reveal shot
const crane = new CraneRig(camera);
scene.add(crane.getGroup());

gsap.timeline()
  .from(crane.pivot.rotation, {
    x: -Math.PI / 3, // Start low
    duration: 4,
    ease: "power2.inOut"
  })
  .to(crane.pivot.rotation, {
    x: 0, // End level
    duration: 4,
    ease: "power2.inOut"
  });
```

### 11.2 Handheld Camera Shake

#### 11.2.1 Procedural Shake Implementation
**Perlin Noise-Based Shake**:
```javascript
import { createNoise3D } from 'simplex-noise';

class HandheldShake {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.originalPosition = camera.position.clone();
    this.originalRotation = camera.rotation.clone();

    this.intensity = options.intensity || 0.01;
    this.speed = options.speed || 1.0;
    this.rotationIntensity = options.rotationIntensity || 0.001;

    this.noise = createNoise3D();
    this.time = 0;
  }

  update(deltaTime) {
    this.time += deltaTime * this.speed;

    // Position shake (3D noise for each axis)
    const noiseX = this.noise(this.time, 0, 0) * this.intensity;
    const noiseY = this.noise(0, this.time, 0) * this.intensity;
    const noiseZ = this.noise(0, 0, this.time) * this.intensity;

    this.camera.position.x = this.originalPosition.x + noiseX;
    this.camera.position.y = this.originalPosition.y + noiseY;
    this.camera.position.z = this.originalPosition.z + noiseZ;

    // Rotation shake
    const rotNoiseX = this.noise(this.time + 100, 0, 0) * this.rotationIntensity;
    const rotNoiseY = this.noise(0, this.time + 100, 0) * this.rotationIntensity;
    const rotNoiseZ = this.noise(0, 0, this.time + 100) * this.rotationIntensity;

    this.camera.rotation.x = this.originalRotation.x + rotNoiseX;
    this.camera.rotation.y = this.originalRotation.y + rotNoiseY;
    this.camera.rotation.z = this.originalRotation.z + rotNoiseZ;
  }

  setIntensity(intensity) {
    this.intensity = intensity;
  }

  updateOrigin() {
    this.originalPosition.copy(this.camera.position);
    this.originalRotation.copy(this.camera.rotation);
  }
}

// Usage
const shake = new HandheldShake(camera, {
  intensity: 0.02,
  speed: 2.0,
  rotationIntensity: 0.005
});

function animate() {
  const delta = clock.getDelta();
  shake.update(delta);
  renderer.render(scene, camera);
}
```

**Impact/Jolt Shake**:
```javascript
class ImpactShake {
  constructor(camera) {
    this.camera = camera;
    this.shakeOffset = new THREE.Vector3();
    this.shakeVelocity = new THREE.Vector3();
    this.shakeDamping = 0.9;
  }

  trigger(intensity = 0.5, direction = null) {
    if (direction) {
      this.shakeVelocity.copy(direction).multiplyScalar(intensity);
    } else {
      this.shakeVelocity.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }
  }

  update() {
    // Apply velocity to offset
    this.shakeOffset.add(this.shakeVelocity);

    // Apply damping
    this.shakeVelocity.multiplyScalar(this.shakeDamping);
    this.shakeOffset.multiplyScalar(this.shakeDamping);

    // Apply to camera
    this.camera.position.add(this.shakeOffset);
    this.camera.position.sub(this.shakeOffset); // Reset for next frame

    // Stop when very small
    if (this.shakeOffset.length() < 0.001) {
      this.shakeOffset.set(0, 0, 0);
      this.shakeVelocity.set(0, 0, 0);
    }
  }
}

// Usage
const impactShake = new ImpactShake(camera);

// Trigger on event (e.g., explosion)
impactShake.trigger(0.8, new THREE.Vector3(0.5, 0.3, 0));
```

**Screen Shake Tool (from Three.js Forum)**:
```javascript
class ScreenShake {
  constructor() {
    this.offset = new THREE.Vector3();
    this.active = false;
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
  }

  shake(camera, offset, duration) {
    this.offset.copy(offset);
    this.intensity = offset.length();
    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
  }

  update(camera, deltaTime) {
    if (!this.active) return;

    this.elapsed += deltaTime;
    const progress = this.elapsed / this.duration;

    if (progress >= 1) {
      this.active = false;
      return;
    }

    // Ease out
    const ease = 1 - Math.pow(progress, 2);
    const currentIntensity = this.intensity * ease;

    // Random offset
    const randomOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    randomOffset.normalize().multiplyScalar(currentIntensity);
    camera.position.add(randomOffset);
  }
}

// Usage
const screenShake = new ScreenShake();
screenShake.shake(camera, new THREE.Vector3(0.1, 0.1, 0), 300);

function animate() {
  const delta = clock.getDelta();
  screenShake.update(camera, delta);
  renderer.render(scene, camera);
}
```

### 11.3 Focus Pulling / Rack Focus

#### 11.3.1 Blender Focus Techniques
**Method 1: Focus Object with DOF**:
- Enable Depth of Field in camera settings
- Create Empty object as focus target
- Animate Empty from object A to object B
- Use Track To constraint for automatic focus

**Method 2: Autofocus Pro Add-on**:
- Automatic focus distance calculation
- Smooth focus pulls with adjustable speed
- Keyframes focus automatically
- Simulates realistic camera autofocus behavior

**Method 3: Compositor-Based**:
- Render without DOF
- Add DOF in compositor
- Faster for animation (no render-time DOF)
- More control in post

#### 11.3.2 Three.js Rack Focus Implementation
**Smooth Focus Pull**:
```javascript
class FocusController {
  constructor(bokehPass, camera) {
    this.bokehPass = bokehPass;
    this.camera = camera;
    this.currentFocus = 10;
    this.targetFocus = 10;
    this.focusSpeed = 0.05; // Slower = more realistic
  }

  focusOnObject(object, speed = null) {
    const distance = object.position.distanceTo(this.camera.position);
    this.targetFocus = distance / this.camera.far; // Normalize
    if (speed) this.focusSpeed = speed;
  }

  update() {
    // Smooth interpolation
    this.currentFocus = THREE.MathUtils.lerp(
      this.currentFocus,
      this.targetFocus,
      this.focusSpeed
    );

    this.bokehPass.uniforms.focus.value = this.currentFocus;
  }
}

// Usage
const focusController = new FocusController(bokehPass, camera);

// Rack focus from object A to object B
function rackFocus(fromObject, toObject, duration) {
  focusController.focusOnObject(fromObject);

  setTimeout(() => {
    focusController.focusOnObject(toObject, 0.02); // Slower for realistic pull
  }, duration * 0.5); // Start halfway through
}

// In animation loop
function animate() {
  focusController.update();
  composer.render();
}
```

**Autofocus Implementation**:
```javascript
class Autofocus {
  constructor(bokehPass, camera, scene) {
    this.bokehPass = bokehPass;
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.currentFocus = 10;
    this.focusSpeed = 0.03; // Slow = smooth autofocus
  }

  update() {
    // Raycast from center of screen
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const targetFocus = intersects[0].distance / this.camera.far;
      this.currentFocus = THREE.MathUtils.lerp(
        this.currentFocus,
        targetFocus,
        this.focusSpeed
      );
    }

    this.bokehPass.uniforms.focus.value = this.currentFocus;
  }

  setSpeed(speed) {
    this.focusSpeed = speed;
  }
}

// Usage
const autofocus = new Autofocus(bokehPass, camera, scene);

// Fast autofocus (action scene)
autofocus.setSpeed(0.1);

// Slow autofocus (cinematic)
autofocus.setSpeed(0.02);
```

### 11.4 Lens Distortion

#### 11.4.1 Types of Distortion
**Barrel Distortion**: Lines bulge outward (wide-angle lenses)
**Pincushion Distortion**: Lines pinch inward (telephoto lenses)
**Chromatic Aberration**: Color fringing at edges

#### 11.4.2 Implementation in Shaders
**Barrel Distortion Shader**:
```glsl
// Fragment shader
uniform sampler2D tDiffuse;
uniform float distortion; // 0.0 = none, 0.3 = strong
uniform float dispersion; // Chromatic aberration
varying vec2 vUv;

vec2 distort(vec2 uv, float amount) {
  vec2 centered = uv - 0.5;
  float r = length(centered);
  float factor = 1.0 + amount * r * r;
  return centered * factor + 0.5;
}

void main() {
  // Chromatic aberration (RGB shift)
  vec2 uvR = distort(vUv, distortion * (1.0 + dispersion));
  vec2 uvG = distort(vUv, distortion);
  vec2 uvB = distort(vUv, distortion * (1.0 - dispersion));

  float r = texture2D(tDiffuse, uvR).r;
  float g = texture2D(tDiffuse, uvG).g;
  float b = texture2D(tDiffuse, uvB).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
```

**Three.js Pass Implementation**:
```javascript
class LensDistortionPass extends THREE.Pass {
  constructor() {
    super();

    this.uniforms = {
      tDiffuse: { value: null },
      distortion: { value: 0.2 },
      dispersion: { value: 0.01 }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl from above */
    });

    this.fsQuad = new THREE.FullScreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tDiffuse.value = readBuffer.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.fsQuad.render(renderer);
    }
  }
}

// Usage
const distortionPass = new LensDistortionPass();
distortionPass.uniforms.distortion.value = 0.15; // Wide angle
distortionPass.uniforms.dispersion.value = 0.02; // Chromatic aberration
composer.addPass(distortionPass);
```

### 11.5 Anamorphic Effects

#### 11.5.1 Anamorphic Characteristics
- 2.39:1 aspect ratio (ultra-wide)
- Horizontal lens flares
- Oval bokeh (not circular)
- Curved distortion at edges
- 2:1 squeeze ratio

#### 11.5.2 Anamorphic Lens Flare
```javascript
class AnamorphicLensFlare {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.flares = [];
  }

  addFlare(light, color, length = 100) {
    // Create horizontal streak
    const geometry = new THREE.PlaneGeometry(length, 0.5);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });

    const flare = new THREE.Mesh(geometry, material);
    flare.userData.light = light;
    this.flares.push(flare);
    this.scene.add(flare);
  }

  update() {
    this.flares.forEach(flare => {
      const light = flare.userData.light;

      // Project light position to screen
      const screenPos = light.position.clone().project(this.camera);

      // Position flare on screen
      flare.position.copy(light.position);
      flare.lookAt(this.camera.position);

      // Fade based on angle to camera
      const angleToCamera = Math.abs(screenPos.x);
      flare.material.opacity = 0.3 * (1 - angleToCamera);
    });
  }
}
```

**Anamorphic Bokeh (Oval Shape)**:
```javascript
// Modify BokehPass to use horizontal oval bokeh
bokehPass.uniforms.aspect.value = 2.0; // 2:1 anamorphic squeeze

// Or use custom bokeh shape texture
const bokehTexture = textureLoader.load('anamorphic-bokeh.png');
bokehPass.uniforms.bokehTexture = { value: bokehTexture };
```

### 11.6 Motion Blur

#### 11.6.1 Camera Motion Blur Techniques
**realism-effects Library**:
```javascript
import { MotionBlurEffect } from 'realism-effects';

// Setup with composer
const motionBlur = new MotionBlurEffect(scene, camera, {
  intensity: 1.0,
  jitter: 0.5,
  samples: 16
});

composer.addPass(motionBlur);

// Adjust intensity based on camera speed
function updateMotionBlur() {
  const velocity = camera.getWorldDirection(new THREE.Vector3())
    .multiplyScalar(cameraSpeed);
  motionBlur.intensity = velocity.length() * 0.5;
}
```

**Per-Object Motion Blur** (Garrett Johnson):
```javascript
// Uses velocity buffer technique
// 1. Render velocity (current - previous position) to buffer
// 2. Use velocity to blur in post-processing

// Velocity pass
class VelocityPass extends THREE.Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.previousMatrices = new Map();
  }

  render(renderer, writeBuffer, readBuffer) {
    // Store previous matrices
    this.scene.traverse((object) => {
      if (object.isMesh) {
        if (!this.previousMatrices.has(object)) {
          this.previousMatrices.set(object, object.matrixWorld.clone());
        }

        // Calculate velocity
        const prevMatrix = this.previousMatrices.get(object);
        object.userData.velocity = object.matrixWorld.clone()
          .multiply(prevMatrix.clone().invert());

        // Update previous
        this.previousMatrices.set(object, object.matrixWorld.clone());
      }
    });

    // Render velocity to buffer
    // ... (render with velocity shader)
  }
}
```

#### 11.6.2 Physical Camera Motion Blur
**Shutter Speed Simulation**:
```javascript
class PhysicalMotionBlur {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.shutterSpeed = 1/50; // 1/50 second
    this.samples = 8;
  }

  render(renderTarget) {
    // Accumulate multiple frames during "shutter open" time
    const deltaTime = this.shutterSpeed / this.samples;

    // Clear accumulation buffer
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.clear();

    // Render multiple samples
    for (let i = 0; i < this.samples; i++) {
      // Advance time slightly
      this.updateSceneTime(deltaTime);

      // Render with blend
      this.renderer.render(this.scene, this.camera);

      // Blend mode for accumulation
      // (implement frame accumulation shader)
    }

    this.renderer.setRenderTarget(null);
  }

  setShutterSpeed(speed) {
    this.shutterSpeed = speed;
    // Longer shutter = more blur
    // 1/1000 = crisp, 1/30 = blurry
  }
}
```

### 11.7 Physical Camera Properties

#### 11.7.1 ISO (Film Speed)
**Effect**: Controls sensor sensitivity and exposure brightness
**Implementation**:
```javascript
class PhysicalCamera extends THREE.PerspectiveCamera {
  constructor(...args) {
    super(...args);
    this.iso = 100; // Standard daylight
    this.fStop = 2.8;
    this.shutterSpeed = 1/60;
  }

  get exposure() {
    // Calculate EV (Exposure Value)
    const ev = Math.log2((this.fStop * this.fStop) / this.shutterSpeed);

    // Convert to exposure multiplier
    const isoFactor = this.iso / 100;
    return Math.pow(2, -ev) / isoFactor;
  }

  applyToRenderer(renderer) {
    renderer.toneMappingExposure = this.exposure;
  }
}

// Usage
const physicalCamera = new PhysicalCamera(75, aspect, 0.1, 1000);
physicalCamera.iso = 400; // Low light
physicalCamera.fStop = 1.4; // Wide aperture
physicalCamera.shutterSpeed = 1/30; // Slower shutter
physicalCamera.applyToRenderer(renderer);
```

#### 11.7.2 F-Stop (Aperture)
**Effect**: Controls depth of field and exposure
**Implementation**:
```javascript
function fStopToBokeh(fStop) {
  // Lower f-stop = wider aperture = more blur
  // f/1.4 = shallow DOF, f/22 = deep DOF
  return 0.1 / fStop;
}

// Set DOF based on f-stop
bokehPass.uniforms.aperture.value = fStopToBokeh(physicalCamera.fStop);

// Common f-stops:
// f/1.4 - Very shallow DOF, portraits
// f/2.8 - Shallow DOF, general use
// f/5.6 - Moderate DOF
// f/11 - Deep DOF, landscapes
// f/22 - Maximum DOF
```

#### 11.7.3 Shutter Speed
**Effect**: Controls motion blur and exposure
**Implementation**: (See Motion Blur section above)

**Common Shutter Speeds**:
- 1/1000s - Freeze fast action
- 1/250s - Sports
- 1/60s - Standard video (180° shutter at 30fps)
- 1/30s - More motion blur
- 1/4s - Long exposure blur

#### 11.7.4 Sensor Size / Film Gauge
```javascript
// Full frame 35mm
camera.filmGauge = 35;

// APS-C (crop sensor)
camera.filmGauge = 24;

// Medium format
camera.filmGauge = 44;

// Affects FOV for given focal length
camera.setFocalLength(50); // 50mm lens
```

---

## 12. Implementation Roadmap

### 12.1 Phase 1: Core Camera System (Week 1-2)

#### Priority 1: Essential Features
- [ ] **PerspectiveCamera Management**
  - Create/delete cameras
  - Adjust FOV, aspect, near/far
  - Real-time property updates
  - Presets (standard, wide, telephoto)

- [ ] **OrbitControls Integration**
  - Enable/disable controls
  - Configure damping
  - Set rotation constraints
  - Zoom limits

- [ ] **Camera Serialization**
  - Save camera state to JSON
  - Load camera state from JSON
  - Export camera animations

#### Priority 2: UI Controls
- [ ] Camera property panel
  - FOV slider (20-120°)
  - Near/far plane inputs
  - Position XYZ controls
  - Rotation controls

- [ ] Camera presets dropdown
  - Wide angle (90°)
  - Standard (50°)
  - Telephoto (35°)
  - Macro (close near plane)

- [ ] Quick actions
  - Reset to default view
  - Focus on selected object
  - Frame all objects

### 12.2 Phase 2: Advanced Controls (Week 3-4)

#### Priority 1: Control Systems
- [ ] **Multiple Control Types**
  - OrbitControls
  - FlyControls
  - FirstPersonControls
  - PointerLockControls (for immersive mode)

- [ ] **Control Switching**
  - Runtime control type change
  - Preserve camera position on switch
  - Control-specific settings panel

#### Priority 2: Camera Rigs
- [ ] **Basic Rig System**
  - Dolly rig (track movement)
  - Crane rig (boom + arm)
  - Two-node rig (camera + target)

- [ ] **Rig UI**
  - Rig type selector
  - Hierarchical controls
  - Visual rig representation

### 12.3 Phase 3: Depth of Field (Week 5)

#### Priority 1: DOF Implementation
- [ ] **BokehPass Integration**
  - Add to postprocessing pipeline
  - Focus distance control
  - Aperture control
  - Max blur control

- [ ] **Focus Tools**
  - Click-to-focus (raycasting)
  - Distance display
  - Focus visualizer
  - Autofocus mode

#### Priority 2: UI
- [ ] DOF panel
  - Enable/disable toggle
  - Focus distance slider
  - Aperture slider (f-stop equivalent)
  - Max blur slider
  - Focus mode (manual/auto)

### 12.4 Phase 4: Camera Animation (Week 6-7)

#### Priority 1: Path Animation
- [ ] **Spline-Based Paths**
  - CatmullRomCurve3 implementation
  - Visual path editing (control points)
  - Path preview
  - Tangent handles

- [ ] **Animation Controls**
  - Playback controls (play/pause/stop)
  - Speed control
  - Loop mode
  - Progress scrubbing

#### Priority 2: Keyframe System
- [ ] **Keyframe Timeline**
  - Position keyframes
  - Rotation keyframes (quaternion)
  - FOV keyframes
  - Focus distance keyframes

- [ ] **Interpolation**
  - Linear interpolation
  - Ease in/out
  - Custom easing curves
  - Bezier curve editor

### 12.5 Phase 5: Multi-Camera (Week 8)

#### Priority 1: Multiple Cameras
- [ ] **Camera Management**
  - Create multiple cameras
  - Camera list/hierarchy
  - Active camera switching
  - Camera naming

- [ ] **Split-Screen**
  - 2-way split (horizontal/vertical)
  - 4-way split (quad)
  - Custom viewport layouts
  - Picture-in-picture

#### Priority 2: Visualization
- [ ] **CameraHelper Integration**
  - Show frustum for non-active cameras
  - Color coding per camera
  - Toggle visibility
  - Update on property changes

### 12.6 Phase 6: Professional Effects (Week 9-10)

#### Priority 1: Handheld Shake
- [ ] **Shake System**
  - Perlin noise implementation
  - Intensity control
  - Speed control
  - Position + rotation shake

- [ ] **Impact/Jolt**
  - Trigger-based shake
  - Direction control
  - Decay curve

#### Priority 2: Lens Effects
- [ ] **Lens Distortion**
  - Barrel distortion shader
  - Pincushion distortion
  - Chromatic aberration
  - Intensity controls

- [ ] **Anamorphic**
  - Aspect ratio presets
  - Horizontal lens flares
  - Oval bokeh shape

### 12.7 Phase 7: Motion Blur (Week 11)

#### Priority 1: Basic Motion Blur
- [ ] **Camera Motion Blur**
  - Velocity-based blur
  - Intensity control
  - Sample count
  - Direction visualization

#### Priority 2: Advanced
- [ ] **Per-Object Blur**
  - Velocity buffer pass
  - Object motion vectors
  - Quality presets

### 12.8 Phase 8: Physical Camera (Week 12)

#### Priority 1: Physical Properties
- [ ] **Camera Settings**
  - ISO control (100-6400)
  - F-stop control (1.4-22)
  - Shutter speed (1/1000-1/30)
  - Sensor size presets

- [ ] **Exposure**
  - Auto-exposure
  - Exposure compensation
  - Histogram display
  - Clipping warnings

#### Priority 2: Focus
- [ ] **Focus System**
  - Autofocus zones
  - Manual focus control
  - Focus peaking (highlight)
  - Rack focus presets

### 12.9 Phase 9: VR/XR Support (Week 13)

#### Priority 1: WebXR Integration
- [ ] **VR Camera**
  - WebXRManager setup
  - Stereoscopic rendering
  - VR button integration
  - Camera rig for movement

#### Priority 2: Controllers
- [ ] **XR Controllers**
  - Controller models
  - Teleportation
  - Object interaction
  - UI interaction

### 12.10 Phase 10: Optimization (Week 14)

#### Priority 1: Performance
- [ ] **Frustum Culling**
  - Optimize near/far planes
  - Group-level culling
  - LOD integration
  - Culling statistics

#### Priority 2: Rendering
- [ ] **Render Optimization**
  - Conditional rendering
  - LOD management
  - Resolution scaling
  - Performance monitoring

### 12.11 Implementation Best Practices

**Code Organization**:
```
src/
├── camera/
│   ├── CameraManager.ts         # Main camera management
│   ├── CameraRig.ts             # Rig system base class
│   ├── rigs/
│   │   ├── DollyRig.ts
│   │   ├── CraneRig.ts
│   │   └── TwoNodeRig.ts
│   ├── controls/
│   │   └── ControlsManager.ts   # Handle different control types
│   ├── animation/
│   │   ├── PathAnimator.ts      # Spline-based animation
│   │   └── KeyframeSystem.ts    # Keyframe timeline
│   ├── effects/
│   │   ├── HandheldShake.ts
│   │   ├── MotionBlur.ts
│   │   └── LensDistortion.ts
│   └── PhysicalCamera.ts        # Physical camera properties
```

**Testing Strategy**:
- Unit tests for camera property calculations
- Integration tests for rig systems
- Visual regression tests for lens effects
- Performance benchmarks for culling
- VR testing on actual hardware

**Documentation**:
- API reference for all camera classes
- Tutorial: Basic camera setup
- Tutorial: Creating custom rigs
- Tutorial: Animating cameras
- Example projects for each feature

---

## 13. Sources

### Three.js Official Documentation
- [Exploring Cameras in Three.js | Medium](https://medium.com/@gopisaikrishna.vuta/exploring-cameras-in-three-js-32e268a6bebd)
- [Cameras — Three.js Journey](https://threejs-journey.com/lessons/cameras)
- [Three.js Official Docs](https://threejs.org/docs/)
- [Camera - Three.js Tutorials](https://sbcode.net/threejs/camera/)
- [PerspectiveCamera - Three.js Docs](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [OrthographicCamera – three.js docs](https://threejs.org/docs/api/en/cameras/OrthographicCamera.html)
- [Three.js Cameras](https://threejsfundamentals.org/threejs/lessons/threejs-cameras.html)

### Camera Properties
- [Three.js - PerspectiveCamera](https://www.tutorialspoint.com/threejs/threejs_perspectivecamera.htm)
- [The Perspective camera in threejs | Dustin John Pfister](https://dustinpfister.github.io/2018/04/07/threejs-camera-perspective/)
- [Camera position vs zoom vs fov - three.js forum](https://discourse.threejs.org/t/camera-position-vs-zoom-vs-fov/2259)
- [Understanding scale and the three.js perspective camera | Observable](https://observablehq.com/@grantcuster/understanding-scale-and-the-three-js-perspective-camera)

### Camera Controls
- [6. [Three.js] Camera Control | Documentation Technique](https://sangmin.fr/blog/threejs-camera-controls/)
- [Controls - React-Three-Drei](https://drei.docs.pmnd.rs/controls/introduction)
- [THREE.JS - CAMERAS & CONTROLS](https://giridhar7632.github.io/Three.js/07-cameras-and-controls.html)
- [GitHub - yomotsu/camera-controls](https://github.com/yomotsu/camera-controls)

### Depth of Field
- [three.js webgl - postprocessing - depth-of-field](https://threejs.org/examples/webgl_postprocessing_dof2.html)
- [BokehPass - Three.js Docs](https://threejs.org/docs/pages/BokehPass.html)
- [How do I use bokehPass for post-processing? | React-Three-Fiber Discussion](https://github.com/react-spring/react-three-fiber/discussions/512)

### Camera Animation
- [Coding a cinematic camera path - DEPT®](https://www.deptagency.com/en-us/insight/coding-a-cinematic-camera-path/)
- [How to Animate Camera lookAt movement - three.js forum](https://discourse.threejs.org/t/how-to-animate-camera-lookat-movement/18719)
- [Three.js camera on path - three.js forum](https://discourse.threejs.org/t/three-js-camera-on-path/21554)
- [3D Camera Movement in Three.js | Perficient](https://blogs.perficient.com/2020/05/21/3d-camera-movement-in-three-js-i-learned-the-hard-way-so-you-dont-have-to/)

### Projection and Matrix Manipulation
- [Projection-based World-to-Screen Coordinate Conversion in Three.js](https://copyprogramming.com/howto/converting-world-coordinates-to-screen-coordinates-in-three-js-using-projection)
- [Playing with Texture Projection in Three.js | Codrops](https://tympanus.net/codrops/2020/01/07/playing-with-texture-projection-in-three-js/)
- [Transformations and Coordinate Systems | Discover three.js](https://discoverthreejs.com/book/first-steps/transformations/)
- [Simulating Real Cameras using Three.js | Segments.ai](https://segments.ai/blog/simulating-cameras-three-js/)

### Multi-Camera Systems
- [Three.js - Multiple Cameras | CodePen](https://codepen.io/jdrew1303/pen/poyVOyG)
- [Multiple Cameras (Three.js) | Stemkoski](https://stemkoski.github.io/Three.js/Multiple-Cameras.html)
- [three.js webgl - multiple views](https://threejs.org/examples/webgl_multiple_views.html)
- [ThreeJS example of multiple camera viewports | Observable](https://observablehq.com/@vicapow/threejs-example-of-multiple-camera-viewports)

### VR/XR Camera Handling
- [WebXRManager – three.js docs](https://threejs.org/docs/api/en/renderers/webxr/WebXRManager.html)
- [What Is WebXR? The Future of VR and AR on the Web](https://wpdean.com/what-is-webxr/)
- [Create an immersive AR session using WebXR | Google Developers](https://developers.google.com/ar/develop/webxr/hello-webxr)
- [Rendering immersive web experiences with Three.JS and WebXR | Medium](https://medium.com/@darktears/https-medium-com-darktears-rendering-immersive-web-experiences-with-three-js-and-webxr-8de7e06982d9)

### Frustum Culling
- [InstancedMesh2 - Easy handling and frustum culling - three.js forum](https://discourse.threejs.org/t/instancedmesh2-easy-handling-and-frustum-culling/58622)
- [Speeding Up Three.JS with Depth-Based Fragment Culling](https://cprimozic.net/blog/depth-based-fragment-culling-webgl/)
- [The Big List of three.js Tips and Tricks! | Discover three.js](https://discoverthreejs.com/tips-and-tricks/)
- [three.js docs - Object3D.frustumCulled](https://threejs.org/docs/#api/core/Object3D.frustumCulled)

### Camera Helpers
- [CameraHelper – three.js docs](https://threejs.org/docs/api/en/helpers/CameraHelper.html)
- [CameraHelper - Three.js Docs](https://threejs.org/docs/pages/CameraHelper.html)
- [Using cameraHelper | React-Three-Fiber Discussion](https://github.com/pmndrs/react-three-fiber/discussions/740)

### Cinema 4D Camera Features
- [Ultimate Cinema 4D Camera Rig | helloluxx](https://helloluxx.com/tutorial/cinema-4d-camera-rig/)
- [setup for cinema 4d camera crane dolly rig | Lesterbanks](https://lesterbanks.com/tag/setup-for-cinema-4d-camera-crane-dolly-rig/)
- [GorillaCam | Greyscalegorilla](https://greyscalegorilla.com/plugins/gorillacam)
- [Working With Cameras in Cinema 4D](https://www.schoolofmotion.com/blog/working-with-cameras-in-cinema-4d)

### Blender Camera Features
- [Top 10 Epic Blender Camera Add-ons](https://yelzkizi.org/top-10-blender-add-ons-for-camera-animation/)
- [Add Camera Rigs — Blender Extensions](https://extensions.blender.org/add-ons/add-camera-rigs/)
- [Add Camera Rigs — Blender Manual](https://docs.blender.org/manual/en/3.6/addons/camera/camera_rigs.html)
- [Autofocus Pro - Superhive](https://superhivemarket.com/products/aperture/)

### Lens Distortion and Anamorphic
- [Lens Sim - Superhive](https://superhivemarket.com/products/lens-sim)
- [Lens Distortion and Anamorphic Padding – Boris FX](https://support.borisfx.com/hc/en-us/articles/24185792901261-Lens-Distortion-and-Anamorphic-Padding)
- [aeAnamorphic Overview - Aitor Echeveste](https://aitorecheveste.com/aeanamorphic-overview/)
- [Anamorphic Workflow | VFX Camera Database](https://vfxcamdb.com/anamorphic-workflow/)

### Motion Blur
- [Adding Motion Blur to the 3D Scene | Foundry](https://learn.foundry.com/nuke/content/comp_environment/3d_compositing/adding_motion_blur_3d_scene.html)
- [Motion Blur Rendering: State of the Art](https://graphics.unizar.es/papers/Navarro_motionblur.pdf)
- [Chapter 27. Motion Blur as a Post-Processing Effect | NVIDIA](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-27-motion-blur-post-processing-effect)
- [Simple motion blur effect - three.js forum](https://discourse.threejs.org/t/simple-motion-blur-effect/3107)
- [GitHub - 0beqz/realism-effects](https://github.com/0beqz/realism-effects)
- [threejs webgl - postprocessing - per-object motion blur](https://gkjohnson.github.io/threejs-sandbox/motionBlurPass/webgl_postprocessing_perobjectmotionblur.html)
- [Screen Shake tool - three.js forum](https://discourse.threejs.org/t/screen-shake-tool/8009)

### Physical Camera Properties
- [Physical Camera - V-Ray for Cinema 4D](https://docs.chaos.com/display/VC4D/Physical+Camera)
- [Physical Camera Attributes - V-Ray for Blender](https://docs.chaos.com/display/VBLD/Physical+Camera+Attributes)
- [Physical camera Attributes - V-Ray for Maya](https://docs.chaos.com/display/VMAYA/Physical+camera+Attributes)
- [Understanding The Physical Render and Exposure Control in Cinema 4D](https://lesterbanks.com/2012/10/understanding-the-physical-render-and-exposure-control-in-cinema-4d/)
- [Corona Camera Tag - Corona for Cinema 4D](https://docs.chaos.com/display/CRC4D/Corona+Camera+Tag)

### Viewport and Render Targets
- [What to use a renderer's scissor for? - three.js forum](https://discourse.threejs.org/t/solved-what-to-use-a-renderers-scissor-for/1050)
- [Partial Context Clearing (scissor/viewport regions) - three.js forum](https://discourse.threejs.org/t/partial-context-clearing-scissor-viewport-regions/4676)
- [RenderTarget - Three.js Docs](https://threejs.org/docs/pages/RenderTarget.html)

---

**Document Version**: 1.0
**Last Updated**: December 16, 2025
**Research Conducted By**: Claude Opus 4.5
**Total Sources**: 100+
