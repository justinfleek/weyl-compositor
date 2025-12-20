/**
 * SVG Export Service Tests
 *
 * Tests for exporting spline layers and compositions to SVG format.
 * Tests match the actual API of svgExport.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  controlPointsToPathData,
  SVGExportService,
  svgExportService,
  exportSplineLayerToSVG,
  exportCompositionToSVG,
  exportSplineLayer,
  exportLayers,
  type SVGExportOptions,
  type SVGExportResult,
} from '@/services/svgExport';
import type { ControlPoint, Layer, SplineData } from '@/types/project';

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
    handleIn?: { x: number; y: number };
    handleOut?: { x: number; y: number };
  } = {}
): ControlPoint {
  return {
    id: `cp_${x}_${y}`,
    x,
    y,
    handleIn: options.handleIn ?? null,
    handleOut: options.handleOut ?? null,
    type: 'smooth',
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
 * Create a mock spline layer (simplified for testing)
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
  return {
    id: `layer_${name}`,
    name,
    type: 'spline',
    visible: options.visible ?? true,
    locked: false,
    inPoint: 0,
    outPoint: 80,
    data: {
      pathData: '',
      controlPoints,
      closed: options.closed ?? true,
      stroke: options.stroke ?? '#000000',
      strokeWidth: options.strokeWidth ?? 2,
      fill: options.fill ?? 'none',
      strokeColor: options.stroke ?? '#000000', // For svgExport compatibility
      fillColor: options.fill ?? 'none',
    } as SplineData,
    transform: {
      position: { value: { x: 0, y: 0, z: 0 } },
      rotation: { value: 0 },
      scale: { value: { x: 100, y: 100 } },
      anchor: { value: { x: 0, y: 0, z: 0 } },
      opacity: { value: 100 },
    },
  } as unknown as Layer; // Cast to Layer - test helper doesn't need all properties
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

// ============================================================================
// LAYER EXPORT TESTS
// ============================================================================

describe('exportSplineLayer (convenience function)', () => {
  it('should return empty string for non-spline layer', () => {
    const layer = {
      id: 'text-layer',
      name: 'Text',
      type: 'text',
      visible: true,
      locked: false,
      inPoint: 0,
      outPoint: 80,
      data: null,
      transform: {
        position: { value: { x: 0, y: 0, z: 0 } },
        rotation: { value: 0 },
        scale: { value: { x: 100, y: 100 } },
        anchor: { value: { x: 0, y: 0, z: 0 } },
        opacity: { value: 100 },
      },
    } as unknown as Layer;

    const result = exportSplineLayer(layer);
    expect(result).toBe('');
  });

  it('should generate SVG with path element for spline layer', () => {
    const layer = createSplineLayer('Square', createSquarePoints());
    const result = exportSplineLayer(layer);

    expect(result).toContain('<path');
    expect(result).toContain('d="');
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
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
});

// ============================================================================
// COMPOSITION EXPORT TESTS
// ============================================================================

describe('exportLayers', () => {
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

  it('should include metadata comment when enabled', () => {
    // Note: includeMetadata is only supported in exportSplineLayer, not exportComposition/exportLayers
    const layer = createSplineLayer('Shape', createSquarePoints());
    const result = svgExportService.exportSplineLayer(layer, { includeMetadata: true });

    expect(result.svg).toContain('<!-- Exported from Weyl Compositor -->');
  });

  it('should minify output when option is set', () => {
    const layer = createSplineLayer('Shape', createSquarePoints());

    const normal = exportLayers([layer], { minify: false });
    const minified = exportLayers([layer], { minify: true });

    // Normal should have newlines, minified should not
    expect(normal).toContain('\n');
    expect(minified).not.toContain('\n');
  });
});

// ============================================================================
// SVGExportService CLASS TESTS
// ============================================================================

describe('SVGExportService', () => {
  let service: SVGExportService;

  beforeEach(() => {
    service = new SVGExportService();
  });

  it('should export spline layer and return SVGExportResult', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = service.exportSplineLayer(layer);

    expect(result).toHaveProperty('svg');
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
    expect(result).toHaveProperty('pathCount');
    expect(result).toHaveProperty('warnings');

    expect(result.svg).toContain('<path');
    expect(result.pathCount).toBe(1);
  });

  it('should export composition with multiple layers', () => {
    const layer1 = createSplineLayer('Shape1', createSquarePoints(), { stroke: '#ff0000' });
    const layer2 = createSplineLayer('Shape2', [
      createControlPoint(200, 0),
      createControlPoint(300, 0),
      createControlPoint(250, 100),
    ], { stroke: '#00ff00' });

    const composition = { settings: { width: 1920, height: 1080 } };
    const result = service.exportComposition(composition, [layer1, layer2]);

    expect(result.pathCount).toBe(2);
    expect(result.svg).toContain('<g id="layer_Shape1">');
    expect(result.svg).toContain('<g id="layer_Shape2">');
  });

  it('should convert control points to path data', () => {
    const points = createSquarePoints();
    const result = service.controlPointsToPathData(points, true);

    expect(result).toContain('M0,0');
    expect(result).toContain('Z');
  });
});

// ============================================================================
// SINGLETON TESTS
// ============================================================================

describe('svgExportService singleton', () => {
  it('should be an instance of SVGExportService', () => {
    expect(svgExportService).toBeInstanceOf(SVGExportService);
  });

  it('should export spline layer', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = svgExportService.exportSplineLayer(layer);

    expect(result.svg).toContain('<svg');
  });
});

// ============================================================================
// FUNCTION EXPORTS TESTS
// ============================================================================

describe('exportSplineLayerToSVG', () => {
  it('should return SVGExportResult', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const result = exportSplineLayerToSVG(layer);

    expect(result).toHaveProperty('svg');
    expect(result).toHaveProperty('width');
    expect(result).toHaveProperty('height');
  });
});

describe('exportCompositionToSVG', () => {
  it('should return SVGExportResult for composition', () => {
    const layer = createSplineLayer('Test', createSquarePoints());
    const composition = { settings: { width: 1920, height: 1080 } };
    const result = exportCompositionToSVG(composition, [layer]);

    expect(result).toHaveProperty('svg');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
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

  it('should sanitize layer IDs with special characters', () => {
    const layer = createSplineLayer('Shape #1 (test)', createSquarePoints());
    const service = new SVGExportService();
    const composition = { settings: { width: 100, height: 100 } };
    const result = service.exportComposition(composition, [layer]);

    // Should sanitize special characters in ID
    expect(result.svg).toContain('id="layer_Shape__1__test_"');
  });
});
