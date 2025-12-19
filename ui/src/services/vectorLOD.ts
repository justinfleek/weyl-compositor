/**
 * Vector Level of Detail (LOD) Service
 *
 * Provides automatic level-of-detail management for complex vector paths.
 * Improves playback performance by using simplified paths when appropriate.
 *
 * Key features:
 * - Generate multiple LOD levels from control points
 * - Automatic LOD selection based on zoom and playback state
 * - Viewport culling for off-screen geometry
 * - Path simplification using Douglas-Peucker algorithm
 */

import type { ControlPoint } from '@/types/project';
import { createLogger } from '@/utils/logger';

const logger = createLogger('VectorLOD');

// ============================================================================
// TYPES
// ============================================================================

/** A single LOD level */
export interface LODLevel {
  /** Simplification tolerance used to generate this level */
  tolerance: number;
  /** Control points at this LOD level */
  controlPoints: ControlPoint[];
  /** Number of points in this level */
  pointCount: number;
  /** Quality level (0 = lowest, higher = better) */
  quality: number;
}

/** Context for LOD selection */
export interface LODContext {
  /** Current viewport zoom level (1 = 100%) */
  zoom: number;
  /** Is the composition currently playing */
  isPlaying: boolean;
  /** Is user actively scrubbing/dragging */
  isScrubbing: boolean;
  /** Current frame rate target */
  targetFps: number;
  /** Actual achieved frame rate */
  actualFps: number;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
}

/** LOD configuration */
export interface LODConfig {
  /** Enable LOD system */
  enabled: boolean;
  /** LOD mode: when to use simplified paths */
  mode: 'zoom' | 'playback' | 'both' | 'auto';
  /** Pre-generated LOD levels */
  levels: LODLevel[];
  /** Maximum points before considering LOD */
  maxPointsForPreview: number;
  /** Base tolerance for simplification */
  simplificationTolerance: number;
  /** Enable viewport culling */
  cullingEnabled: boolean;
  /** Margin around viewport for culling (pixels) */
  cullMargin: number;
}

/** Rectangle for viewport/bounds calculations */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Default LOD configuration */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  enabled: true,
  mode: 'both',
  levels: [],
  maxPointsForPreview: 100,
  simplificationTolerance: 2.0,
  cullingEnabled: true,
  cullMargin: 50,
};

// ============================================================================
// SIMPLIFICATION ALGORITHM
// ============================================================================

interface Point2D {
  x: number;
  y: number;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;

  if (lineLengthSq === 0) {
    // Line is a point - return distance to that point
    const ddx = point.x - lineStart.x;
    const ddy = point.y - lineStart.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }

  // Project point onto line
  const t = Math.max(0, Math.min(1,
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq
  ));

  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  const ddx = point.x - projection.x;
  const ddy = point.y - projection.y;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

/**
 * Simplify control points using Ramer-Douglas-Peucker algorithm
 * Preserves curve structure by keeping handles
 *
 * @param points Original control points
 * @param tolerance Maximum allowed deviation
 * @returns Simplified control points
 */
export function simplifyControlPoints(
  points: ControlPoint[],
  tolerance: number
): ControlPoint[] {
  if (points.length <= 2) {
    return points.map(cloneControlPoint);
  }

  // Find point with maximum distance
  let maxDist = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      { x: points[i].x, y: points[i].y },
      { x: first.x, y: first.y },
      { x: last.x, y: last.y }
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance exceeds tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyControlPoints(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyControlPoints(points.slice(maxIndex), tolerance);

    // Combine results, avoiding duplicate at the split point
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, just keep endpoints
  return [cloneControlPoint(first), cloneControlPoint(last)];
}

/**
 * Clone a control point
 */
function cloneControlPoint(point: ControlPoint): ControlPoint {
  return {
    ...point,
    handleIn: point.handleIn ? { ...point.handleIn } : null,
    handleOut: point.handleOut ? { ...point.handleOut } : null,
  };
}

// ============================================================================
// LOD GENERATION
// ============================================================================

/**
 * Generate multiple LOD levels from control points
 *
 * @param controlPoints Original high-quality control points
 * @param numLevels Number of LOD levels to generate (default 4)
 * @param baseTolerance Starting tolerance for lowest quality level
 * @returns Array of LOD levels from lowest to highest quality
 */
export function generateLODLevels(
  controlPoints: ControlPoint[],
  numLevels: number = 4,
  baseTolerance: number = 2.0
): LODLevel[] {
  if (controlPoints.length === 0) {
    return [];
  }

  const levels: LODLevel[] = [];

  // Generate levels with decreasing tolerance (increasing quality)
  // Level 0: lowest quality (highest tolerance)
  // Level N-1: highest quality (original points)

  for (let i = 0; i < numLevels; i++) {
    // Tolerance decreases exponentially
    // Level 0: baseTolerance * 4
    // Level 1: baseTolerance * 2
    // Level 2: baseTolerance
    // Level N-1: 0 (original)
    const factor = Math.pow(2, numLevels - 1 - i);
    const tolerance = i === numLevels - 1 ? 0 : baseTolerance * factor;

    let simplifiedPoints: ControlPoint[];
    if (tolerance === 0) {
      // Highest quality - use original points
      simplifiedPoints = controlPoints.map(cloneControlPoint);
    } else {
      simplifiedPoints = simplifyControlPoints(controlPoints, tolerance);
    }

    levels.push({
      tolerance,
      controlPoints: simplifiedPoints,
      pointCount: simplifiedPoints.length,
      quality: i,
    });
  }

  logger.debug(
    `Generated ${numLevels} LOD levels:`,
    levels.map(l => `L${l.quality}: ${l.pointCount} points`).join(', ')
  );

  return levels;
}

// ============================================================================
// LOD SELECTION
// ============================================================================

/**
 * Select appropriate LOD level based on current context
 *
 * @param levels Available LOD levels
 * @param context Current rendering context
 * @returns Best LOD level for the context
 */
export function selectLODLevel(
  levels: LODLevel[],
  context: LODContext
): LODLevel | null {
  if (levels.length === 0) {
    return null;
  }

  // Default to highest quality
  let selectedIndex = levels.length - 1;

  // During playback, use lower quality
  if (context.isPlaying) {
    // Use lower quality if frame rate is suffering
    if (context.actualFps < context.targetFps * 0.8) {
      selectedIndex = Math.max(0, selectedIndex - 2);
    } else if (context.actualFps < context.targetFps * 0.95) {
      selectedIndex = Math.max(0, selectedIndex - 1);
    } else {
      // Playback is smooth, use medium quality
      selectedIndex = Math.max(0, Math.floor(levels.length / 2));
    }
  }

  // During scrubbing, use lowest quality for responsiveness
  if (context.isScrubbing) {
    selectedIndex = 0;
  }

  // Adjust for zoom level
  if (context.zoom < 0.25) {
    // Very zoomed out - use lowest quality
    selectedIndex = Math.min(selectedIndex, 0);
  } else if (context.zoom < 0.5) {
    // Zoomed out - use low quality
    selectedIndex = Math.min(selectedIndex, 1);
  } else if (context.zoom < 1) {
    // Slightly zoomed out - use medium quality
    selectedIndex = Math.min(selectedIndex, Math.floor(levels.length / 2));
  }
  // At 100% zoom or higher, allow full quality based on performance

  return levels[selectedIndex];
}

// ============================================================================
// VIEWPORT CULLING
// ============================================================================

/**
 * Check if a point is within or near a rectangle
 */
function isPointInRect(point: Point2D, rect: Rect, margin: number = 0): boolean {
  return (
    point.x >= rect.x - margin &&
    point.x <= rect.x + rect.width + margin &&
    point.y >= rect.y - margin &&
    point.y <= rect.y + rect.height + margin
  );
}

/**
 * Check if a line segment intersects or is near a rectangle
 */
function doesSegmentIntersectRect(
  p1: Point2D,
  p2: Point2D,
  rect: Rect,
  margin: number = 0
): boolean {
  // Simple check: if either endpoint is inside, intersects
  if (isPointInRect(p1, rect, margin) || isPointInRect(p2, rect, margin)) {
    return true;
  }

  // Check if line crosses the expanded rectangle
  const expandedRect = {
    x: rect.x - margin,
    y: rect.y - margin,
    width: rect.width + margin * 2,
    height: rect.height + margin * 2,
  };

  // Check line-rectangle intersection using parametric line
  // This is a simplified check that may have false positives but no false negatives
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Check if line crosses horizontal edges
  if (dx !== 0) {
    const t1 = (expandedRect.x - p1.x) / dx;
    const t2 = (expandedRect.x + expandedRect.width - p1.x) / dx;

    for (const t of [t1, t2]) {
      if (t >= 0 && t <= 1) {
        const y = p1.y + t * dy;
        if (y >= expandedRect.y && y <= expandedRect.y + expandedRect.height) {
          return true;
        }
      }
    }
  }

  // Check if line crosses vertical edges
  if (dy !== 0) {
    const t1 = (expandedRect.y - p1.y) / dy;
    const t2 = (expandedRect.y + expandedRect.height - p1.y) / dy;

    for (const t of [t1, t2]) {
      if (t >= 0 && t <= 1) {
        const x = p1.x + t * dx;
        if (x >= expandedRect.x && x <= expandedRect.x + expandedRect.width) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Filter control points to only those visible in the viewport
 * Keeps points whose segments intersect the viewport plus margin
 *
 * @param points All control points
 * @param viewport Visible viewport rectangle
 * @param margin Extra margin around viewport (pixels)
 * @returns Control points visible in viewport
 */
export function cullOffScreenPoints(
  points: ControlPoint[],
  viewport: Rect,
  margin: number = 50
): ControlPoint[] {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    return isPointInRect(points[0], viewport, margin) ? [cloneControlPoint(points[0])] : [];
  }

  const visibleIndices = new Set<number>();

  // Check each segment
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (doesSegmentIntersectRect(
      { x: p1.x, y: p1.y },
      { x: p2.x, y: p2.y },
      viewport,
      margin
    )) {
      visibleIndices.add(i);
      visibleIndices.add(i + 1);
    }
  }

  // If closed path, check closing segment
  const first = points[0];
  const last = points[points.length - 1];
  if (doesSegmentIntersectRect(
    { x: last.x, y: last.y },
    { x: first.x, y: first.y },
    viewport,
    margin
  )) {
    visibleIndices.add(0);
    visibleIndices.add(points.length - 1);
  }

  // Return visible points
  return Array.from(visibleIndices)
    .sort((a, b) => a - b)
    .map(i => cloneControlPoint(points[i]));
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class VectorLODService {
  private lodCache = new Map<string, LODLevel[]>();

  /**
   * Generate LOD levels for a layer
   *
   * @param layerId Layer identifier for caching
   * @param controlPoints Original control points
   * @param numLevels Number of LOD levels
   * @param baseTolerance Base simplification tolerance
   * @returns Generated LOD levels
   */
  generateLODLevels(
    layerId: string,
    controlPoints: ControlPoint[],
    numLevels: number = 4,
    baseTolerance: number = 2.0
  ): LODLevel[] {
    const levels = generateLODLevels(controlPoints, numLevels, baseTolerance);
    this.lodCache.set(layerId, levels);
    return levels;
  }

  /**
   * Get cached LOD levels for a layer
   */
  getLODLevels(layerId: string): LODLevel[] | undefined {
    return this.lodCache.get(layerId);
  }

  /**
   * Clear LOD cache for a layer
   */
  clearLODLevels(layerId: string): void {
    this.lodCache.delete(layerId);
  }

  /**
   * Select appropriate LOD level
   */
  selectLODLevel(levels: LODLevel[], context: LODContext): LODLevel | null {
    return selectLODLevel(levels, context);
  }

  /**
   * Get control points for a layer at appropriate LOD
   *
   * @param layerId Layer identifier
   * @param context Rendering context
   * @param fallbackPoints Fallback points if no LOD data
   * @returns Control points at appropriate detail level
   */
  getControlPointsAtLOD(
    layerId: string,
    context: LODContext,
    fallbackPoints: ControlPoint[]
  ): ControlPoint[] {
    const levels = this.lodCache.get(layerId);

    if (!levels || levels.length === 0) {
      return fallbackPoints;
    }

    const level = selectLODLevel(levels, context);
    return level ? level.controlPoints : fallbackPoints;
  }

  /**
   * Cull off-screen points
   */
  cullOffScreenPoints(
    points: ControlPoint[],
    viewport: Rect,
    margin: number = 50
  ): ControlPoint[] {
    return cullOffScreenPoints(points, viewport, margin);
  }

  /**
   * Check if LOD should be used for given point count
   */
  shouldUseLOD(pointCount: number, config: LODConfig): boolean {
    return config.enabled && pointCount > config.maxPointsForPreview;
  }

  /**
   * Clear all cached LOD data
   */
  clearAllLOD(): void {
    this.lodCache.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const vectorLOD = new VectorLODService();

// ============================================================================
// EXPORTS
// ============================================================================

export const VectorLOD = {
  generateLODLevels,
  selectLODLevel,
  simplifyControlPoints,
  cullOffScreenPoints,
};

export default vectorLOD;
