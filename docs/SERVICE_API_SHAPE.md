# SERVICE API - Shape & Geometry Services

**Lattice Compositor - Path, Spline, and Shape Operation Services**

---

## 5.1 arcLength.ts

**Purpose**: Arc-length parameterization for even spacing along curves using Three.js.

**Location**: `ui/src/services/arcLength.ts`

**Size**: ~8KB

**Note**: Uses Three.js curves (not bezier-js). Three.js has built-in arc-length parameterization.

### Exports

```typescript
import * as THREE from 'three';

interface PointOnPath {
  point: { x: number; y: number };
  tangent: { x: number; y: number };
  t: number;
}

interface PointOnPath3D {
  point: { x: number; y: number; z: number };
  tangent: { x: number; y: number; z: number };
  t: number;
}

// Main parameterizer class (wraps Three.js curves)
export class ArcLengthParameterizer {
  public totalLength: number;

  constructor(
    curve: THREE.Curve<THREE.Vector2 | THREE.Vector3>,
    arcLengthDivisions?: number  // Default: 200
  );

  // Convert arc length distance to t parameter
  distanceToT(distance: number): number;

  // Get point and tangent at arc length distance (2D)
  getPointAtDistance(distance: number): PointOnPath;

  // Get point and tangent at arc length distance (3D)
  getPointAtDistance3D(distance: number): PointOnPath3D;

  // Get evenly spaced points along the curve (2D)
  getEvenlySpacedPoints(count: number): PointOnPath[];

  // Get evenly spaced points along the curve (3D)
  getEvenlySpacedPoints3D(count: number): PointOnPath3D[];
}

// Multi-segment parameterizer (uses THREE.CurvePath)
export class MultiSegmentParameterizer {
  public totalLength: number;

  constructor(curves: THREE.Curve<THREE.Vector2 | THREE.Vector3>[]);

  distanceToT(distance: number): number;
  getPointAtDistance(distance: number): PointOnPath;
  getEvenlySpacedPoints(count: number): PointOnPath[];
}

// Helper to create Three.js bezier curve from control points
export function createBezierCurve(
  p1: Point2D | Point3D,
  cp1: Point2D | Point3D,
  cp2: Point2D | Point3D,
  p2: Point2D | Point3D
): THREE.CubicBezierCurve3;

// Convert control points array to Bezier curves
export function controlPointsToBeziers(
  controlPoints: Array<{
    x: number;
    y: number;
    z?: number;
    handleIn: { x: number; y: number; z?: number } | null;
    handleOut: { x: number; y: number; z?: number } | null;
  }>
): THREE.CubicBezierCurve3[];

// Convert SVG-style path commands to Bezier curve (legacy support)
export function pathCommandsToBezier(
  pathCommands: any[]
): THREE.CubicBezierCurve3 | null;

// Default export
export default ArcLengthParameterizer;
```

### Usage Example

```typescript
import * as THREE from 'three';
import { ArcLengthParameterizer } from '@/services/arcLength';

// Create a cubic bezier curve using Three.js
const curve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(50, 100, 0),
  new THREE.Vector3(100, 100, 0),
  new THREE.Vector3(150, 0, 0)
);

// Create parameterizer
const param = new ArcLengthParameterizer(curve);

// Get point at 50% of curve length
const midPoint = param.getPointAtDistance(param.totalLength * 0.5);

// Get 10 evenly spaced points
const points = param.getEvenlySpacedPoints(10);
```

---

## 5.2 textOnPath.ts

**Purpose**: Position text characters along a path with proper spacing.

**Location**: `ui/src/services/textOnPath.ts`

**Size**: ~12KB

### Exports

```typescript
export interface TextOnPathConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  letterSpacing: number;        // Additional spacing
  startOffset: number;          // Start position on path (0-1)
  alignment: 'left' | 'center' | 'right';
  baselineShift: number;        // Perpendicular offset
  flip: boolean;                // Flip text direction
}

export interface PathPoint {
  x: number;
  y: number;
  angle: number;                // Tangent angle in radians
  t: number;                    // Original t parameter
}

export interface CharacterPlacement {
  char: string;
  x: number;
  y: number;
  angle: number;
  width: number;
}

export class TextOnPathService {
  constructor();

  // Set the path to place text on (uses Three.js CurvePath)
  setPath(curvePath: THREE.CurvePath<THREE.Vector3>): void;

  // Calculate character placements
  placeText(config: TextOnPathConfig): CharacterPlacement[];

  // Get path point at distance
  getPointAtDistance(distance: number): PathPoint;

  // Get total path length
  getPathLength(): number;
}

// Factory
export function createTextOnPathService(): TextOnPathService;

// Default configuration
export function createDefaultPathConfig(): TextOnPathConfig;
```

---

## 5.3 shapeOperations.ts

**Purpose**: Bezier path manipulation (offset, wiggle, boolean ops, etc.)

**Location**: `ui/src/services/shapeOperations.ts`

**Size**: ~45KB | **Lines**: ~1550

### Exports

```typescript
// Point operations
export function distance(a: Point2D, b: Point2D): number;
export function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D;
export function addPoints(a: Point2D, b: Point2D): Point2D;
export function subtractPoints(a: Point2D, b: Point2D): Point2D;
export function scalePoint(p: Point2D, s: number): Point2D;
export function normalize(p: Point2D): Point2D;
export function perpendicular(p: Point2D): Point2D;
export function dot(a: Point2D, b: Point2D): number;
export function cross(a: Point2D, b: Point2D): number;
export function rotatePoint(p: Point2D, angle: number): Point2D;
export function rotateAround(p: Point2D, center: Point2D, angle: number): Point2D;

// Clone functions
export function clonePoint(p: Point2D): Point2D;
export function cloneVertex(v: BezierVertex): BezierVertex;
export function clonePath(path: BezierPath): BezierPath;

// Bezier operations
export function cubicBezierPoint(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): Point2D;

export function cubicBezierDerivative(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): Point2D;

export function splitCubicBezier(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): [Point2D[], Point2D[]];

export function cubicBezierLength(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  samples?: number
): number;

// Path operations
export function getPathLength(path: BezierPath): number;

export function getPointAtDistance(
  path: BezierPath,
  distance: number
): { point: Point2D; tangent: Point2D; t: number };

export function trimPath(
  path: BezierPath,
  start: number,    // 0-1
  end: number       // 0-1
): BezierPath;

export function mergePaths(
  paths: BezierPath[],
  mode: 'union' | 'intersect' | 'subtract' | 'xor'
): BezierPath[];

// Path modifiers
export function offsetPath(
  path: BezierPath,
  offset: number,
  joinType?: 'miter' | 'round' | 'bevel'
): BezierPath;

export function offsetPathMultiple(
  path: BezierPath,
  offsets: number[],
  joinType?: 'miter' | 'round' | 'bevel'
): BezierPath[];

export function puckerBloat(path: BezierPath, amount: number): BezierPath;

export function wigglePath(
  path: BezierPath,
  size: number,
  detail: number,
  seed?: number
): BezierPath;

export function zigZagPath(
  path: BezierPath,
  size: number,
  ridges: number,
  smooth?: boolean
): BezierPath;

export function twistPath(
  path: BezierPath,
  angle: number,
  center?: Point2D
): BezierPath;

export function roundCorners(path: BezierPath, radius: number): BezierPath;

export function simplifyPath(
  path: BezierPath,
  tolerance: number
): BezierPath;

export function smoothPath(path: BezierPath, amount: number): BezierPath;

export function applyRepeater(
  path: BezierPath,
  copies: number,
  offset?: Point2D,
  rotation?: number,
  scale?: number
): BezierPath[];

export function transformPath(
  path: BezierPath,
  matrix: [number, number, number, number, number, number]  // 2D transform
): BezierPath;

// Shape generators
export function generateRectangle(
  x: number, y: number,
  width: number, height: number,
  cornerRadius?: number
): BezierPath;

export function generateEllipse(
  cx: number, cy: number,
  rx: number, ry: number
): BezierPath;

export function generatePolygon(
  cx: number, cy: number,
  radius: number,
  sides: number,
  rotation?: number
): BezierPath;

export function generateStar(
  cx: number, cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
  rotation?: number
): BezierPath;

// Bundled export object
export const ShapeOperations: {
  // All above functions as methods
};
```

---

## 5.4 imageTrace.ts

**Purpose**: Convert raster images to vector paths.

**Location**: `ui/src/services/imageTrace.ts`

**Size**: ~15KB

### Exports

```typescript
export type TraceMode = 'blackAndWhite' | 'grayscale' | 'color';

export interface TraceOptions {
  mode: TraceMode;
  threshold: number;            // For B&W mode
  colorCount: number;           // For color mode
  cornerThreshold: number;
  optimizePaths: boolean;
  ignoreWhite: boolean;
  minPathLength: number;
}

export interface TraceResult {
  paths: BezierPath[];
  colors: string[];             // Hex colors for each path
  bounds: { x: number; y: number; width: number; height: number };
}

export const DEFAULT_TRACE_OPTIONS: TraceOptions;

// Trace image
export async function traceImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
  options?: Partial<TraceOptions>
): Promise<TraceResult>;

// Class-based interface
export class ImageTrace {
  constructor(options?: Partial<TraceOptions>);

  setOptions(options: Partial<TraceOptions>): void;

  trace(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData
  ): Promise<TraceResult>;

  traceToSVG(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData
  ): Promise<string>;
}
```

---

**See also**: [SERVICE_API_REFERENCE.md](./SERVICE_API_REFERENCE.md) for index of all categories.

*Generated: December 23, 2025*
