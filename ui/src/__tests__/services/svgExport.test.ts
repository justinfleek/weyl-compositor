/**
 * SVG Export Service Tests
 *
 * Tests for exporting spline layers and compositions to SVG format:
 * - Path data generation
 * - Layer export
 * - Document creation
 * - Options handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  controlPointsToPathData,
  bezierPathToPathData,
  exportSplineLayer,
  exportLayers,
  exportBezierPath,
  wrapInSVGDocument,
  SVGExportService,
  svgExport,
  DEFAULT_SVG_OPTIONS,
  type SVGExportOptions,
} from '@/services/svgExport';
import type { ControlPoint, Layer, SplineData } from '@/types/project';
import type { BezierPath, BezierVertex } from '@/types/shapes';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a control point
 */
function createControlPoint(
  x: number,
  y: number,
  options: {
    handleIn?: { x: number; y: number } | null;
    handleOut?: { x: number; y: number } | null;
  } = {}
): ControlPoint {
  return {
    id: `cp_${x}_${y}`,
    x,
    y,
    handleIn: options.handleIn ?? null,
    handleOut: options.handleOut ?? null,
    selected: false,
    cornerType: 'smooth',
    group: undefined,
  };
}

/**
 * Create a square of control points
 */
function createSquarePoints(): ControlPoint[] {
  return [
    createControlPoint(0, 0),
    createControlPoint(100, 0),
    createControlPoint(100, 100),
    createControlPoint(0, 100),
  ];
}

/**
 * Create a curved path with handles
 */
function createCurvedPoints(): ControlPoint[] {
  return [
    createControlPoint(0, 0, { handleOut: { x: 33, y: 0 } }),
    createControlPoint(100, 0, { handleIn: { x: 67, y: 0 }, handleOut: { x: 133, y: 0 } }),
    createControlPoint(100, 100, { handleIn: { x: 100, y: 67 } }),
  ];
}

/**
 * Create a BezierVertex
 */
function createBezierVertex(
  x: number,
  y: number,
  inHandle: { x: number; y: number } = { x: 0, y: 0 },
  outHandle: { x: number; y: number } = { x: 0, y: 0 }
): BezierVertex {
  return {
    point: { x, y },
    inHandle,
    outHandle,
  };
}

/**
 * Create a BezierPath
 */
function createBezierPath(
  vertices: BezierVertex[],
  closed: boolean = true
): BezierPath {
  return { vertices, closed };
}

/**
 * Create a mock spline layer
 */
function createSplineLayer(
  name: string,
  controlPoints: ControlPoint[],
  options: {
    closed?: boolean;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    visible?: boolean;
  } = {}
): Layer {
  const splineData: SplineData = {
    controlPoints,
    closed: options.closed ?? true,
    stroke: options.stroke ?? '#000000',
    strokeWidth: options.strokeWidth ?? 2,
    fill: options.fill ?? '',
    fillOpacity: 100,
    strokeOpacity: 100,
  };

  return {
    id: `layer_${name}`,
    name,
    type: 'spline',
    visible: options.visible ?? true,
    locked: false,
    inPoint: 0,
    outPoint: 80,
    data: splineData,
    transform: {
      position: { id: 'pos', name: 'Position', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
      rotation: { id: 'rot', name: 'Rotation', type: 'number', value: 0, animated: false, keyframes: [] },
      scale: { id: 'scale', name: 'Scale', type: 'scale', value: { x: 100, y: 100 }, animated: false, keyframes: [] },
      anchorPoint: { id: 'anchor', name: 'Anchor', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
      opacity: { id: 'opacity', name: 'Opacity', type: 'number', value: 100, animated: false, keyframes: [] },
    },
  };
}

// ============================================================================
// PATH DATA GENERATION TESTS
// ============================================================================

describe('controlPointsToPathData', () => {
  it('should return empty string for empty points', () => {
    const result = controlPointsToPathData([], false);
    expect(result).toBe('');
  });

  it('should generate M command for single point', () => {
    const points = [createControlPoint(50, 75)];
    const result = controlPointsToPathData(points, false);

    expect(result).toBe('M50,75');
  });

  it('should generate line commands for points without handles', () => {
    const points = createSquarePoints();
    const result = controlPointsToPathData(points, false);

    expect(result).toContain('M0,0');
    expect(result).toContain('L100,0');
    expect(result).toContain('L100,100');
    expect(result).toContain('L0,100');
  });

  it('should add Z for closed paths', () => {
    const points = createSquarePoints();
    const result = controlPointsToPathData(points, true);

    expect(result).toContain('Z');
  });

  it('should not add Z for open paths', () => {
    const points = createSquarePoints();
    const result = controlPointsToPathData(points, false);

    expect(result).not.toContain('Z');
  });

  it('should generate cubic bezier commands for curved paths', () => {
    const points = createCurvedPoints();
    const result = controlPointsToPathData(points, false);

    expect(result).toContain('C');
  });

  it('should respect precision parameter', () => {
    const points = [
      createControlPoint(0.123456, 0.654321),
      createControlPoint(100.111111, 50.999999),
    ];

    const result2 = controlPointsToPathData(points, false, 2);
    const result4 = controlPointsToPathData(points, false, 4);

    expect(result2).toContain('0.12');
    expect(result4).toContain('0.1235');
  });
});

describe('bezierPathToPathData', () => {
  it('should return empty string for empty path', () => {
    const path = createBezierPath([]);
    const result = bezierPathToPathData(path);

    expect(result).toBe('');
  });

  it('should generate path data from BezierPath', () => {
    const vertices = [
      createBezierVertex(0, 0, { x: 0, y: 0 }, { x: 33, y: 0 }),
      createBezierVertex(100, 0, { x: -33, y: 0 }, { x: 0, y: 0 }),
    ];
    const path = createBezierPath(vertices, false);

    const result = bezierPathToPathData(path);

    expect(result).toContain('M0,0');
    expect(result).toContain('C'); // Should have curve command
  });

  it('should add Z for closed paths', () => {
    const vertices = [
      createBezierVertex(0, 0),
      createBezierVertex(100, 0),
      createBezierVertex(100, 100),
    ];
    const path = createBezierPath(vertices, true);

    const result = bezierPathToPathData(path);

    expect(result).toContain('Z');
  });

  it('should convert relative handles to absolute coordinates', () => {
    const vertices = [
      createBezierVertex(50, 50, { x: 0, y: 0 }, { x: 25, y: 0 }),
      createBezierVertex(100, 50, { x: -25, y: 0 }, { x: 0, y: 0 }),
    ];
    const path = createBezierPath(vertices, false);

    const result = bezierPathToPathData(path);

    // Out handle: 50 + 25 = 75
    // In handle: 100 - 25 = 75
    expect(result).toContain('75');
  });
});

// ============================================================================
// LAYER EXPORT TESTS
// ============================================================================

describe('exportSplineLayer', () => {
  it('should return empty string for non-spline layer', () => {
    const layer: Layer = {
      id: 'text-layer',
      name: 'Text',
      type: 'text',
      visible: true,
      locked: false,
      inPoint: 0,
      outPoint: 80,
      data: {},
      transform: {
        position: { id: 'pos', name: 'Position', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
        rotation: { id: 'rot', name: 'Rotation', type: 'number', value: 0, animated: false, keyframes: [] },
        scale: { id: 'scale', name: 'Scale', type: 'scale', value: { x: 100, y: 100 }, animated: false, keyframes: [] },
        anchorPoint: { id: 'anchor', name: 'Anchor', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
        opacity: { id: 'opacity', name: 'Opacity', type: 'number', value: 100, animated: false, keyframes: [] },
      },
    };

    const result = exportSplineLayer(layer);
    expect(result).toBe('');
  });

  it('should return empty string for layer with no control points', () => {
    const layer = createSplineLayer('Empty', []);
    const result = exportSplineLayer(layer);

    expect(result).toBe('');
  });

  it('should generate path element for spline layer', () => {
    const layer = createSplineLayer('Square', createSquarePoints());
    const result = exportSplineLayer(layer);

    expect(result).toContain('<path');
    expect(result).toContain('d="');
    expect(result).toContain('/>');
  });

  it('should include layer ID when option is enabled', () => {
    const layer = createSplineLayer('MyShape', createSquarePoints());
    const result = exportSplineLayer(layer, { includeIds: true });

    expect(result).toContain('id="MyShape"');
  });

  it('should sanitize layer ID', () => {
    const layer = createSplineLayer('Shape #1 (test)', createSquarePoints());
    const result = exportSplineLayer(layer, { includeIds: true });

    // Special characters should be replaced
    expect(result).toContain('id="Shape__1__test_"');
  });

  it('should include stroke attributes', () => {
    const layer = createSplineLayer('Stroked', createSquarePoints(), {
      stroke: '#ff0000',
      strokeWidth: 5,
    });

    const result = exportSplineLayer(layer, { includeStrokes: true });

    expect(result).toContain('stroke="#ff0000"');
    expect(result).toContain('stroke-width="5"');
  });

  it('should include fill attributes', () => {
    const layer = createSplineLayer('Filled', createSquarePoints(), {
      fill: '#00ff00',
    });

    const result = exportSplineLayer(layer, { includeFills: true });

    expect(result).toContain('fill="#00ff00"');
  });

  it('should set stroke="none" when no stroke', () => {
    const layer = createSplineLayer('NoStroke', createSquarePoints(), {
      strokeWidth: 0,
    });

    const result = exportSplineLayer(layer, { includeStrokes: true });

    expect(result).toContain('stroke="none"');
  });

  it('should set fill="none" when no fill', () => {
    const layer = createSplineLayer('NoFill', createSquarePoints(), {
      fill: '',
    });

    const result = exportSplineLayer(layer, { includeFills: true });

    expect(result).toContain('fill="none"');
  });
});

// ============================================================================
// COMPOSITION EXPORT TESTS
// ============================================================================

describe('exportLayers', () => {
  it('should return empty string for empty layers', () => {
    const result = exportLayers([]);
    expect(result).toBe('');
  });

  it('should return empty string for no spline layers', () => {
    const textLayer: Layer = {
      id: 'text',
      name: 'Text',
      type: 'text',
      visible: true,
      locked: false,
      inPoint: 0,
      outPoint: 80,
      data: {},
      transform: {
        position: { id: 'pos', name: 'Position', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
        rotation: { id: 'rot', name: 'Rotation', type: 'number', value: 0, animated: false, keyframes: [] },
        scale: { id: 'scale', name: 'Scale', type: 'scale', value: { x: 100, y: 100 }, animated: false, keyframes: [] },
        anchorPoint: { id: 'anchor', name: 'Anchor', type: 'position', value: { x: 0, y: 0 }, animated: false, keyframes: [] },
        opacity: { id: 'opacity', name: 'Opacity', type: 'number', value: 100, animated: false, keyframes: [] },
      },
    };

    const result = exportLayers([textLayer]);
    expect(result).toBe('');
  });

  it('should generate complete SVG document', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = exportLayers([layer]);

    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('<svg');
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(result).toContain('</svg>');
  });

  it('should include viewBox attribute', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = exportLayers([layer]);

    expect(result).toContain('viewBox="');
  });

  it('should use custom viewBox when provided', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = exportLayers([layer], {
      viewBox: { x: 0, y: 0, width: 500, height: 500 },
    });

    expect(result).toContain('viewBox="0 0 500 500"');
    expect(result).toContain('width="500"');
    expect(result).toContain('height="500"');
  });

  it('should include metadata comment', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = exportLayers([layer], { includeMetadata: true });

    expect(result).toContain('<!-- Generated by Weyl Compositor -->');
  });

  it('should not include XML declaration when not standalone', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = exportLayers([layer], { standalone: false });

    expect(result).not.toContain('<?xml');
  });

  it('should export multiple layers', () => {
    const layer1 = createSplineLayer('Shape1', createSquarePoints(), { stroke: '#ff0000' });
    const layer2 = createSplineLayer('Shape2', [
      createControlPoint(200, 0),
      createControlPoint(300, 0),
      createControlPoint(250, 100),
    ], { stroke: '#00ff00' });

    const result = exportLayers([layer1, layer2]);

    expect(result).toContain('id="Shape1"');
    expect(result).toContain('id="Shape2"');
  });

  it('should skip invisible layers', () => {
    const visible = createSplineLayer('Visible', createSquarePoints(), { visible: true });
    const invisible = createSplineLayer('Invisible', createSquarePoints(), { visible: false });

    const result = exportLayers([visible, invisible]);

    expect(result).toContain('id="Visible"');
    expect(result).not.toContain('id="Invisible"');
  });

  it('should optimize output when option is set', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());

    const normal = exportLayers([layer], { optimize: false });
    const optimized = exportLayers([layer], { optimize: true });

    // Optimized should have no newlines
    expect(normal).toContain('\n');
    expect(optimized).not.toContain('\n');
  });
});

// ============================================================================
// BEZIER PATH EXPORT TESTS
// ============================================================================

describe('exportBezierPath', () => {
  it('should export path with default options', () => {
    const vertices = [
      createBezierVertex(0, 0),
      createBezierVertex(100, 0),
      createBezierVertex(100, 100),
    ];
    const path = createBezierPath(vertices, true);

    const result = exportBezierPath(path);

    expect(result).toContain('<path');
    expect(result).toContain('d="');
  });

  it('should include custom ID', () => {
    const path = createBezierPath([createBezierVertex(0, 0)], false);
    const result = exportBezierPath(path, { id: 'myPath' });

    expect(result).toContain('id="myPath"');
  });

  it('should include stroke and fill options', () => {
    const path = createBezierPath([createBezierVertex(0, 0)], false);
    const result = exportBezierPath(path, {
      stroke: '#ff0000',
      strokeWidth: 3,
      fill: '#00ff00',
    });

    expect(result).toContain('stroke="#ff0000"');
    expect(result).toContain('stroke-width="3"');
    expect(result).toContain('fill="#00ff00"');
  });
});

// ============================================================================
// DOCUMENT WRAPPER TESTS
// ============================================================================

describe('wrapInSVGDocument', () => {
  it('should wrap elements in SVG document', () => {
    const elements = ['<path d="M0,0 L100,100"/>'];
    const viewBox = { x: 0, y: 0, width: 100, height: 100 };

    const result = wrapInSVGDocument(elements, viewBox);

    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
    expect(result).toContain('<path');
  });

  it('should include viewBox', () => {
    const elements: string[] = [];
    const viewBox = { x: 10, y: 20, width: 200, height: 300 };

    const result = wrapInSVGDocument(elements, viewBox);

    expect(result).toContain('viewBox="10 20 200 300"');
  });

  it('should respect options', () => {
    const elements: string[] = [];
    const viewBox = { x: 0, y: 0, width: 100, height: 100 };

    const withMeta = wrapInSVGDocument(elements, viewBox, { includeMetadata: true });
    const withoutMeta = wrapInSVGDocument(elements, viewBox, { includeMetadata: false });

    expect(withMeta).toContain('Generated by Weyl');
    expect(withoutMeta).not.toContain('Generated by Weyl');
  });
});

// ============================================================================
// SERVICE CLASS TESTS
// ============================================================================

describe('SVGExportService', () => {
  let service: SVGExportService;

  beforeEach(() => {
    service = new SVGExportService();
  });

  it('should export spline layer', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = service.exportSplineLayer(layer);

    expect(result).toContain('<path');
  });

  it('should export layers to document', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = service.exportLayers([layer]);

    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('should convert control points to path data', () => {
    const points = createSquarePoints();
    const result = service.controlPointsToPathData(points, true);

    expect(result).toContain('M0,0');
    expect(result).toContain('Z');
  });

  it('should convert bezier path to path data', () => {
    const path = createBezierPath([createBezierVertex(0, 0)], false);
    const result = service.bezierPathToPathData(path);

    expect(result).toContain('M0,0');
  });

  it('should export bezier path', () => {
    const path = createBezierPath([createBezierVertex(0, 0)], false);
    const result = service.exportBezierPath(path);

    expect(result).toContain('<path');
  });

  it('should create document', () => {
    const elements = ['<path d="M0,0"/>'];
    const viewBox = { x: 0, y: 0, width: 100, height: 100 };
    const result = service.createDocument(elements, viewBox);

    expect(result).toContain('<svg');
  });
});

// ============================================================================
// SINGLETON TESTS
// ============================================================================

describe('svgExport singleton', () => {
  it('should be an instance of SVGExportService', () => {
    expect(svgExport).toBeInstanceOf(SVGExportService);
  });

  it('should export layers', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = svgExport.exportLayers([layer]);

    expect(result).toContain('<svg');
  });
});

// ============================================================================
// DEFAULT OPTIONS TESTS
// ============================================================================

describe('DEFAULT_SVG_OPTIONS', () => {
  it('should have expected defaults', () => {
    expect(DEFAULT_SVG_OPTIONS.includeStrokes).toBe(true);
    expect(DEFAULT_SVG_OPTIONS.includeFills).toBe(true);
    expect(DEFAULT_SVG_OPTIONS.precision).toBe(2);
    expect(DEFAULT_SVG_OPTIONS.includeTransforms).toBe(true);
    expect(DEFAULT_SVG_OPTIONS.standalone).toBe(true);
    expect(DEFAULT_SVG_OPTIONS.includeIds).toBe(true);
    expect(DEFAULT_SVG_OPTIONS.optimize).toBe(false);
    expect(DEFAULT_SVG_OPTIONS.includeMetadata).toBe(true);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  it('should handle very small coordinates', () => {
    const points = [
      createControlPoint(0.0001, 0.0002),
      createControlPoint(0.0003, 0.0004),
    ];
    const result = controlPointsToPathData(points, false, 4);

    expect(result).toContain('0.0001');
    expect(result).toContain('0.0002');
  });

  it('should handle very large coordinates', () => {
    const points = [
      createControlPoint(10000, 20000),
      createControlPoint(30000, 40000),
    ];
    const result = controlPointsToPathData(points, false);

    expect(result).toContain('10000');
    expect(result).toContain('40000');
  });

  it('should handle negative coordinates', () => {
    const points = [
      createControlPoint(-50, -100),
      createControlPoint(50, 100),
    ];
    const result = controlPointsToPathData(points, false);

    expect(result).toContain('-50');
    expect(result).toContain('-100');
  });

  it('should handle single vertex bezier path', () => {
    const path = createBezierPath([createBezierVertex(50, 50)], false);
    const result = bezierPathToPathData(path);

    expect(result).toBe('M50,50');
  });

  it('should handle layer with special characters in name', () => {
    const layer = createSplineLayer('Shape <test> & "quotes"', createSquarePoints());
    const result = exportSplineLayer(layer, { includeIds: true });

    // Should sanitize but not crash
    expect(result).toContain('id=');
    expect(result).not.toContain('<test>');
  });
});

// ============================================================================
// TRANSFORM EXPORT TESTS
// ============================================================================

describe('Transform export', () => {
  it('should include translate transform', () => {
    const layer = createSplineLayer('Translated', createSquarePoints());
    layer.transform.position!.value = { x: 50, y: 100 };

    const result = exportSplineLayer(layer, { includeTransforms: true });

    expect(result).toContain('transform="translate(50, 100)"');
  });

  it('should include rotation transform', () => {
    const layer = createSplineLayer('Rotated', createSquarePoints());
    layer.transform.rotation!.value = 45;

    const result = exportSplineLayer(layer, { includeTransforms: true });

    expect(result).toContain('rotate(45');
  });

  it('should include scale transform', () => {
    const layer = createSplineLayer('Scaled', createSquarePoints());
    layer.transform.scale!.value = { x: 200, y: 50 };

    const result = exportSplineLayer(layer, { includeTransforms: true });

    expect(result).toContain('scale(2, 0.5)');
  });

  it('should not include transform when values are default', () => {
    const layer = createSplineLayer('Default', createSquarePoints());

    const result = exportSplineLayer(layer, { includeTransforms: true });

    expect(result).not.toContain('transform=');
  });

  it('should not include transform when option is disabled', () => {
    const layer = createSplineLayer('Moved', createSquarePoints());
    layer.transform.position!.value = { x: 100, y: 100 };

    const result = exportSplineLayer(layer, { includeTransforms: false });

    expect(result).not.toContain('transform=');
  });
});
