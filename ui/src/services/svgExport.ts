/**
 * SVG Export Service
 *
 * Exports spline layers and compositions to SVG format for round-trip
 * compatibility with vector graphics applications.
 *
 * Key features:
 * - Export individual layers or full compositions
 * - Preserve stroke and fill properties
 * - Support for transforms
 * - Configurable precision
 * - SVG path data generation from control points
 */

import type { ControlPoint, Layer, SplineData } from '@/types/project';
import type { BezierPath, BezierVertex, Point2D } from '@/types/shapes';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SVGExport');

// ============================================================================
// TYPES
// ============================================================================

/** Options for SVG export */
export interface SVGExportOptions {
  /** Include stroke styling */
  includeStrokes: boolean;
  /** Include fill styling */
  includeFills: boolean;
  /** Coordinate precision (decimal places) */
  precision: number;
  /** Custom viewBox dimensions */
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Include transform attributes */
  includeTransforms: boolean;
  /** Export as standalone SVG document */
  standalone: boolean;
  /** Include layer names as IDs */
  includeIds: boolean;
  /** Optimize output (remove unnecessary whitespace) */
  optimize: boolean;
  /** Add metadata comments */
  includeMetadata: boolean;
}

/** Default export options */
export const DEFAULT_SVG_OPTIONS: SVGExportOptions = {
  includeStrokes: true,
  includeFills: true,
  precision: 2,
  includeTransforms: true,
  standalone: true,
  includeIds: true,
  optimize: false,
  includeMetadata: true,
};

/** Color in various formats */
interface ColorValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Round number to specified precision */
function round(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/** Format a number for SVG output */
function formatNumber(value: number, precision: number): string {
  const rounded = round(value, precision);
  // Remove trailing zeros
  return rounded.toString();
}

/** Convert RGB color to hex string */
function colorToHex(color: ColorValue): string {
  const r = Math.round(color.r).toString(16).padStart(2, '0');
  const g = Math.round(color.g).toString(16).padStart(2, '0');
  const b = Math.round(color.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/** Convert RGBA color to SVG format (hex + opacity) */
function colorToSVG(color: ColorValue): { fill: string; opacity: string } {
  return {
    fill: colorToHex(color),
    opacity: color.a < 1 ? color.a.toFixed(2) : '1',
  };
}

/** Escape special XML characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Sanitize ID for use in SVG */
function sanitizeId(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^([0-9])/, '_$1');
}

// ============================================================================
// PATH DATA GENERATION
// ============================================================================

/**
 * Convert control points to SVG path data string
 *
 * @param points Array of control points
 * @param closed Whether the path is closed
 * @param precision Decimal precision for coordinates
 * @returns SVG path data string (d attribute value)
 */
export function controlPointsToPathData(
  points: ControlPoint[],
  closed: boolean,
  precision: number = 2
): string {
  if (points.length === 0) {
    return '';
  }

  const fmt = (n: number) => formatNumber(n, precision);
  const parts: string[] = [];

  // Move to first point
  parts.push(`M${fmt(points[0].x)},${fmt(points[0].y)}`);

  // Draw curves to each subsequent point
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];

    // Handle outgoing control point (default to current position if null)
    const cp1x = curr.handleOut ? curr.handleOut.x : curr.x;
    const cp1y = curr.handleOut ? curr.handleOut.y : curr.y;

    // Handle incoming control point (default to next position if null)
    const cp2x = next.handleIn ? next.handleIn.x : next.x;
    const cp2y = next.handleIn ? next.handleIn.y : next.y;

    // Check if this is a straight line (handles at endpoints)
    const isLine =
      Math.abs(cp1x - curr.x) < 0.01 &&
      Math.abs(cp1y - curr.y) < 0.01 &&
      Math.abs(cp2x - next.x) < 0.01 &&
      Math.abs(cp2y - next.y) < 0.01;

    if (isLine) {
      parts.push(`L${fmt(next.x)},${fmt(next.y)}`);
    } else {
      parts.push(
        `C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(next.x)},${fmt(next.y)}`
      );
    }
  }

  // Close path if needed
  if (closed && points.length > 1) {
    // Draw curve back to first point
    const last = points[points.length - 1];
    const first = points[0];

    const cp1x = last.handleOut ? last.handleOut.x : last.x;
    const cp1y = last.handleOut ? last.handleOut.y : last.y;
    const cp2x = first.handleIn ? first.handleIn.x : first.x;
    const cp2y = first.handleIn ? first.handleIn.y : first.y;

    const isLine =
      Math.abs(cp1x - last.x) < 0.01 &&
      Math.abs(cp1y - last.y) < 0.01 &&
      Math.abs(cp2x - first.x) < 0.01 &&
      Math.abs(cp2y - first.y) < 0.01;

    if (!isLine) {
      parts.push(
        `C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(first.x)},${fmt(first.y)}`
      );
    }

    parts.push('Z');
  }

  return parts.join(' ');
}

/**
 * Convert BezierPath to SVG path data string
 *
 * @param path BezierPath object
 * @param precision Decimal precision
 * @returns SVG path data string
 */
export function bezierPathToPathData(
  path: BezierPath,
  precision: number = 2
): string {
  if (path.vertices.length === 0) {
    return '';
  }

  const fmt = (n: number) => formatNumber(n, precision);
  const parts: string[] = [];

  const first = path.vertices[0];
  parts.push(`M${fmt(first.point.x)},${fmt(first.point.y)}`);

  // Draw curves between vertices
  const numSegments = path.closed ? path.vertices.length : path.vertices.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const curr = path.vertices[i];
    const next = path.vertices[(i + 1) % path.vertices.length];

    // Out handle is relative, convert to absolute
    const cp1x = curr.point.x + curr.outHandle.x;
    const cp1y = curr.point.y + curr.outHandle.y;

    // In handle is relative, convert to absolute
    const cp2x = next.point.x + next.inHandle.x;
    const cp2y = next.point.y + next.inHandle.y;

    parts.push(
      `C${fmt(cp1x)},${fmt(cp1y)} ${fmt(cp2x)},${fmt(cp2y)} ${fmt(next.point.x)},${fmt(next.point.y)}`
    );
  }

  if (path.closed) {
    parts.push('Z');
  }

  return parts.join(' ');
}

// ============================================================================
// LAYER EXPORT
// ============================================================================

/**
 * Generate SVG attributes for stroke styling
 */
function getStrokeAttributes(splineData: SplineData, precision: number): string {
  const attrs: string[] = [];

  // Check if stroke is enabled (has color and width)
  const hasStroke = splineData.stroke && splineData.strokeWidth > 0;

  if (hasStroke) {
    // Stroke color (already hex string)
    attrs.push(`stroke="${splineData.stroke}"`);

    // Stroke opacity
    if (splineData.strokeOpacity !== undefined && splineData.strokeOpacity < 100) {
      attrs.push(`stroke-opacity="${(splineData.strokeOpacity / 100).toFixed(2)}"`);
    }

    // Stroke width
    attrs.push(`stroke-width="${formatNumber(splineData.strokeWidth, precision)}"`);

    // Line cap and join
    const lineCap = splineData.strokeLineCap ?? 'round';
    const lineJoin = splineData.strokeLineJoin ?? 'round';
    if (lineCap !== 'butt') attrs.push(`stroke-linecap="${lineCap}"`);
    if (lineJoin !== 'miter') attrs.push(`stroke-linejoin="${lineJoin}"`);

    // Dash pattern
    const dashArray = splineData.strokeDashArray;
    if (dashArray) {
      // Handle both static and animated dash arrays
      const dashValues = Array.isArray(dashArray) ? dashArray : dashArray.value;
      if (dashValues && dashValues.length > 0) {
        attrs.push(`stroke-dasharray="${dashValues.join(' ')}"`);

        const dashOffset = splineData.strokeDashOffset;
        if (dashOffset !== undefined) {
          const offsetValue = typeof dashOffset === 'number' ? dashOffset : dashOffset.value;
          if (offsetValue !== 0) {
            attrs.push(`stroke-dashoffset="${offsetValue}"`);
          }
        }
      }
    }
  } else {
    attrs.push('stroke="none"');
  }

  return attrs.join(' ');
}

/**
 * Generate SVG attributes for fill styling
 */
function getFillAttributes(splineData: SplineData, _precision: number): string {
  const attrs: string[] = [];

  // Check if fill is enabled (has color)
  const hasFill = splineData.fill && splineData.fill !== '';

  if (hasFill) {
    // Fill color (already hex string)
    attrs.push(`fill="${splineData.fill}"`);

    // Fill opacity
    if (splineData.fillOpacity !== undefined && splineData.fillOpacity < 100) {
      attrs.push(`fill-opacity="${(splineData.fillOpacity / 100).toFixed(2)}"`);
    }
  } else {
    attrs.push('fill="none"');
  }

  return attrs.join(' ');
}

/**
 * Export a spline layer to SVG path element
 *
 * @param layer Layer to export
 * @param options Export options
 * @returns SVG path element string
 */
export function exportSplineLayer(
  layer: Layer,
  options: Partial<SVGExportOptions> = {}
): string {
  const opts = { ...DEFAULT_SVG_OPTIONS, ...options };

  if (layer.type !== 'spline' || !layer.data) {
    logger.warn('exportSplineLayer: Not a spline layer');
    return '';
  }

  const splineData = layer.data as SplineData;
  const points = splineData.controlPoints || [];

  if (points.length === 0) {
    return '';
  }

  // Generate path data
  const pathData = controlPointsToPathData(points, splineData.closed || false, opts.precision);

  // Build attributes
  const attrs: string[] = [];

  // ID
  if (opts.includeIds) {
    attrs.push(`id="${sanitizeId(layer.name)}"`);
  }

  // Path data
  attrs.push(`d="${pathData}"`);

  // Stroke
  if (opts.includeStrokes) {
    attrs.push(getStrokeAttributes(splineData, opts.precision));
  }

  // Fill
  if (opts.includeFills) {
    attrs.push(getFillAttributes(splineData, opts.precision));
  }

  // Transform
  if (opts.includeTransforms && layer.transform) {
    const transforms: string[] = [];

    // Position (translate) - access .value for AnimatableProperty
    const posValue = layer.transform.position?.value;
    if (posValue && (posValue.x !== 0 || posValue.y !== 0)) {
      transforms.push(
        `translate(${formatNumber(posValue.x, opts.precision)}, ${formatNumber(posValue.y, opts.precision)})`
      );
    }

    // Rotation - access .value for AnimatableProperty
    const rotValue = layer.transform.rotation?.value;
    if (rotValue && rotValue !== 0) {
      // Rotate around anchor point (default to 0,0)
      const anchorValue = layer.transform.anchorPoint?.value;
      const anchorX = anchorValue?.x ?? 0;
      const anchorY = anchorValue?.y ?? 0;
      transforms.push(
        `rotate(${formatNumber(rotValue, opts.precision)}, ${formatNumber(anchorX, opts.precision)}, ${formatNumber(anchorY, opts.precision)})`
      );
    }

    // Scale - access .value for AnimatableProperty
    const scaleValue = layer.transform.scale?.value;
    if (scaleValue && (scaleValue.x !== 100 || scaleValue.y !== 100)) {
      const sx = scaleValue.x / 100;
      const sy = scaleValue.y / 100;
      transforms.push(`scale(${formatNumber(sx, opts.precision)}, ${formatNumber(sy, opts.precision)})`);
    }

    if (transforms.length > 0) {
      attrs.push(`transform="${transforms.join(' ')}"`);
    }
  }

  return `<path ${attrs.join(' ')}/>`;
}

// ============================================================================
// COMPOSITION EXPORT
// ============================================================================

/**
 * Calculate bounds of all layers
 */
function calculateBounds(layers: Layer[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layer of layers) {
    if (layer.type !== 'spline' || !layer.data) continue;

    const splineData = layer.data as SplineData;
    const points = splineData.controlPoints || [];

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);

      // Include handles in bounds
      if (point.handleIn) {
        minX = Math.min(minX, point.handleIn.x);
        minY = Math.min(minY, point.handleIn.y);
        maxX = Math.max(maxX, point.handleIn.x);
        maxY = Math.max(maxY, point.handleIn.y);
      }
      if (point.handleOut) {
        minX = Math.min(minX, point.handleOut.x);
        minY = Math.min(minY, point.handleOut.y);
        maxX = Math.max(maxX, point.handleOut.x);
        maxY = Math.max(maxY, point.handleOut.y);
      }
    }
  }

  // Handle empty or invalid bounds
  if (!isFinite(minX)) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  // Add padding
  const padding = 10;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Export multiple layers to SVG document
 *
 * @param layers Layers to export
 * @param options Export options
 * @returns Complete SVG document string
 */
export function exportLayers(
  layers: Layer[],
  options: Partial<SVGExportOptions> = {}
): string {
  const opts = { ...DEFAULT_SVG_OPTIONS, ...options };

  // Filter to only spline layers
  const splineLayers = layers.filter(l => l.type === 'spline' && l.data);

  if (splineLayers.length === 0) {
    logger.warn('exportLayers: No spline layers to export');
    return '';
  }

  // Calculate viewBox
  const viewBox = opts.viewBox ?? calculateBounds(splineLayers);

  const lines: string[] = [];

  // XML declaration for standalone
  if (opts.standalone) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  // Metadata comment
  if (opts.includeMetadata) {
    lines.push('<!-- Generated by Weyl Compositor -->');
  }

  // SVG root element
  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}" width="${viewBox.width}" height="${viewBox.height}">`
  );

  // Export each layer
  for (const layer of splineLayers) {
    if (!layer.visible) continue;

    const pathElement = exportSplineLayer(layer, opts);
    if (pathElement) {
      lines.push(`  ${pathElement}`);
    }
  }

  lines.push('</svg>');

  // Optimize if requested
  let output = lines.join(opts.optimize ? '' : '\n');

  return output;
}

/**
 * Export a BezierPath to SVG path element
 */
export function exportBezierPath(
  path: BezierPath,
  options: {
    id?: string;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    precision?: number;
  } = {}
): string {
  const {
    id,
    stroke = 'none',
    strokeWidth = 1,
    fill = 'none',
    precision = 2,
  } = options;

  const pathData = bezierPathToPathData(path, precision);

  const attrs: string[] = [];
  if (id) attrs.push(`id="${sanitizeId(id)}"`);
  attrs.push(`d="${pathData}"`);
  attrs.push(`stroke="${stroke}"`);
  attrs.push(`stroke-width="${strokeWidth}"`);
  attrs.push(`fill="${fill}"`);

  return `<path ${attrs.join(' ')}/>`;
}

/**
 * Wrap SVG elements in a complete SVG document
 */
export function wrapInSVGDocument(
  elements: string[],
  viewBox: { x: number; y: number; width: number; height: number },
  options: Partial<SVGExportOptions> = {}
): string {
  const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
  const lines: string[] = [];

  if (opts.standalone) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  if (opts.includeMetadata) {
    lines.push('<!-- Generated by Weyl Compositor -->');
  }

  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}" width="${viewBox.width}" height="${viewBox.height}">`
  );

  for (const element of elements) {
    lines.push(`  ${element}`);
  }

  lines.push('</svg>');

  return lines.join(opts.optimize ? '' : '\n');
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class SVGExportService {
  /**
   * Export a single spline layer to SVG
   */
  exportSplineLayer(layer: Layer, options?: Partial<SVGExportOptions>): string {
    return exportSplineLayer(layer, options);
  }

  /**
   * Export multiple layers to SVG document
   */
  exportLayers(layers: Layer[], options?: Partial<SVGExportOptions>): string {
    return exportLayers(layers, options);
  }

  /**
   * Convert control points to SVG path data
   */
  controlPointsToPathData(
    points: ControlPoint[],
    closed: boolean,
    precision?: number
  ): string {
    return controlPointsToPathData(points, closed, precision);
  }

  /**
   * Convert BezierPath to SVG path data
   */
  bezierPathToPathData(path: BezierPath, precision?: number): string {
    return bezierPathToPathData(path, precision);
  }

  /**
   * Export BezierPath to SVG path element
   */
  exportBezierPath(
    path: BezierPath,
    options?: {
      id?: string;
      stroke?: string;
      strokeWidth?: number;
      fill?: string;
      precision?: number;
    }
  ): string {
    return exportBezierPath(path, options);
  }

  /**
   * Create a complete SVG document
   */
  createDocument(
    elements: string[],
    viewBox: { x: number; y: number; width: number; height: number },
    options?: Partial<SVGExportOptions>
  ): string {
    return wrapInSVGDocument(elements, viewBox, options);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const svgExport = new SVGExportService();

// ============================================================================
// EXPORTS
// ============================================================================

export const SVGExport = {
  exportSplineLayer,
  exportLayers,
  exportBezierPath,
  controlPointsToPathData,
  bezierPathToPathData,
  wrapInSVGDocument,
};

export default svgExport;
