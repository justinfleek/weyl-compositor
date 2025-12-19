# SERVICE API - Shape & Geometry Services

**Weyl Compositor - Path, Spline, and Shape Operation Services**

---

## 5.1 arcLength.ts

**Purpose**: Arc-length parameterization for even spacing along curves.

**Location**: `ui/src/services/arcLength.ts`

**Size**: ~8KB

### Exports

```typescript
// Main parameterizer class
export class ArcLengthParameterizer {
  constructor(curve: Bezier, samples?: number);  // Default: 100 samples

  // Get total curve length
  getTotalLength(): number;

  // Get t parameter for given arc length distance
  getTAtLength(length: number): number;

  // Get point at arc length distance
  getPointAtLength(length: number): { x: number; y: number };

  // Get tangent at arc length distance
  getTangentAtLength(length: number): { x: number; y: number };

  // Get normal at arc length distance
  getNormalAtLength(length: number): { x: number; y: number };

  // Resample curve at even intervals
  resample(count: number): Array<{ x: number; y: number }>;
}

// Convert SVG path commands to Bezier
export function pathCommandsToBezier(
  pathCommands: Array<{
    type: string;
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }>
): Bezier | null;

// Convert control points to Bezier curves
export function controlPointsToBeziers(
  controlPoints: Array<{
    x: number;
    y: number;
    handleIn?: { x: number; y: number };
    handleOut?: { x: number; y: number };
  }>
): Bezier[];

// Multi-segment parameterizer (for paths with multiple curves)
export class MultiSegmentParameterizer {
  constructor(curves: Bezier[]);

  getTotalLength(): number;
  getPointAtLength(length: number): { x: number; y: number };
  getTangentAtLength(length: number): { x: number; y: number };
  resample(count: number): Array<{ x: number; y: number }>;
}
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

  // Set the path to place text on
  setPath(curves: Bezier[]): void;

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

*Generated: December 19, 2024*
