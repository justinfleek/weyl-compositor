/**
 * Expression Control Effects Tests
 *
 * Tests for Tutorial 04: Time Remapping & Expressions
 * Phase C (Steps 338-365) - Expression Control Effects
 *
 * Tests all expression control types:
 * 1. Slider Control - Numeric slider
 * 2. Checkbox Control - Boolean toggle
 * 3. Color Control - Color picker
 * 4. Point Control - 2D position
 * 5. 3D Point Control - 3D position
 * 6. Angle Control - Rotation dial
 * 7. Dropdown Menu Control - Selection menu
 * 8. Layer Control - Layer reference
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCustomExpression } from '@/services/expressions/expressionEvaluator';
import type { ExpressionContext } from '@/services/expressions/types';
import {
  isExpressionControl,
  getControlParameterName,
} from '@/services/effects/expressionControlRenderer';
import { EFFECT_DEFINITIONS } from '@/types/effects';

// ============================================================================
// HELPERS
// ============================================================================

function evalExpr(ctx: ExpressionContext, code: string): number | number[] | string {
  return evaluateCustomExpression(code, ctx);
}

function createTestContext(overrides: Partial<ExpressionContext> = {}): ExpressionContext {
  return {
    time: 1.0,
    frame: 24,
    fps: 24,
    duration: 10,
    compWidth: 1920,
    compHeight: 1080,
    layerId: 'layer_test',
    layerIndex: 1,
    layerName: 'Test Layer',
    inPoint: 0,
    outPoint: 5,
    propertyName: 'position',
    value: [960, 540],
    velocity: [0, 0],
    numKeys: 0,
    keyframes: [],
    layerTransform: {
      position: [960, 540, 0],
      rotation: [0, 0, 0],
      scale: [100, 100, 100],
      opacity: 100,
      origin: [0, 0, 0],
    },
    layerEffects: [],
    allLayers: [
      { id: 'layer_test', name: 'Test Layer', index: 1 },
      { id: 'layer_control', name: 'Control Layer', index: 2 },
    ],
    ...overrides,
  };
}

// ============================================================================
// EFFECT DEFINITIONS TESTS
// ============================================================================

describe('Expression Control Effect Definitions', () => {
  it('slider-control is defined', () => {
    expect(EFFECT_DEFINITIONS['slider-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['slider-control'].name).toBe('Slider Control');
    expect(EFFECT_DEFINITIONS['slider-control'].category).toBe('utility');
  });

  it('checkbox-control is defined', () => {
    expect(EFFECT_DEFINITIONS['checkbox-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['checkbox-control'].name).toBe('Checkbox Control');
  });

  it('dropdown-menu-control is defined', () => {
    expect(EFFECT_DEFINITIONS['dropdown-menu-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['dropdown-menu-control'].name).toBe('Dropdown Menu Control');
  });

  it('color-control is defined', () => {
    expect(EFFECT_DEFINITIONS['color-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['color-control'].name).toBe('Color Control');
  });

  it('point-control is defined', () => {
    expect(EFFECT_DEFINITIONS['point-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['point-control'].name).toBe('Point Control');
  });

  it('3d-point-control is defined', () => {
    expect(EFFECT_DEFINITIONS['3d-point-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['3d-point-control'].name).toBe('3D Point Control');
  });

  it('angle-control is defined', () => {
    expect(EFFECT_DEFINITIONS['angle-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['angle-control'].name).toBe('Angle Control');
  });

  it('layer-control is defined', () => {
    expect(EFFECT_DEFINITIONS['layer-control']).toBeDefined();
    expect(EFFECT_DEFINITIONS['layer-control'].name).toBe('Layer Control');
  });
});

// ============================================================================
// UTILITY FUNCTIONS TESTS
// ============================================================================

describe('isExpressionControl', () => {
  it('identifies slider-control', () => {
    expect(isExpressionControl('slider-control')).toBe(true);
  });

  it('identifies checkbox-control', () => {
    expect(isExpressionControl('checkbox-control')).toBe(true);
  });

  it('identifies dropdown-menu-control', () => {
    expect(isExpressionControl('dropdown-menu-control')).toBe(true);
  });

  it('identifies color-control', () => {
    expect(isExpressionControl('color-control')).toBe(true);
  });

  it('identifies point-control', () => {
    expect(isExpressionControl('point-control')).toBe(true);
  });

  it('identifies 3d-point-control', () => {
    expect(isExpressionControl('3d-point-control')).toBe(true);
  });

  it('identifies angle-control', () => {
    expect(isExpressionControl('angle-control')).toBe(true);
  });

  it('identifies layer-control', () => {
    expect(isExpressionControl('layer-control')).toBe(true);
  });

  it('rejects non-expression-control effects', () => {
    expect(isExpressionControl('gaussian-blur')).toBe(false);
    expect(isExpressionControl('brightness-contrast')).toBe(false);
    expect(isExpressionControl('glow')).toBe(false);
  });
});

describe('getControlParameterName', () => {
  it('returns slider for slider-control', () => {
    expect(getControlParameterName('slider-control')).toBe('slider');
  });

  it('returns checkbox for checkbox-control', () => {
    expect(getControlParameterName('checkbox-control')).toBe('checkbox');
  });

  it('returns menu for dropdown-menu-control', () => {
    expect(getControlParameterName('dropdown-menu-control')).toBe('menu');
  });

  it('returns color for color-control', () => {
    expect(getControlParameterName('color-control')).toBe('color');
  });

  it('returns point for point-control', () => {
    expect(getControlParameterName('point-control')).toBe('point');
  });

  it('returns point3D for 3d-point-control', () => {
    expect(getControlParameterName('3d-point-control')).toBe('point3D');
  });

  it('returns angle for angle-control', () => {
    expect(getControlParameterName('angle-control')).toBe('angle');
  });

  it('returns layer for layer-control', () => {
    expect(getControlParameterName('layer-control')).toBe('layer');
  });

  it('returns value for unknown effect', () => {
    expect(getControlParameterName('unknown-effect')).toBe('value');
  });
});

// ============================================================================
// SLIDER CONTROL EXPRESSION ACCESS (Steps 338-342)
// ============================================================================

describe('Slider Control - Expression Access', () => {
  it('accesses slider value via effect("Slider Control")("Slider")', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Slider Control',
          effectKey: 'slider-control',
          enabled: true,
          parameters: { Slider: 75 },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Slider Control")("Slider")');
    expect(result).toBe(75);
  });

  it('accesses slider value via .slider shorthand', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Speed',
          effectKey: 'slider-control',
          enabled: true,
          parameters: { Slider: 150, slider: 150 },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Speed").slider');
    expect(result).toBe(150);
  });

  it('returns default 0 when slider not found', () => {
    const ctx = createTestContext({ layerEffects: [] });
    const result = evalExpr(ctx, 'thisLayer.effect("Nonexistent").slider');
    expect(result).toBe(0);
  });
});

// ============================================================================
// CHECKBOX CONTROL EXPRESSION ACCESS (Steps 343-345)
// ============================================================================

describe('Checkbox Control - Expression Access', () => {
  it('returns true (1) when checked', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Checkbox Control',
          effectKey: 'checkbox-control',
          enabled: true,
          parameters: { Checkbox: true, checkbox: true },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Checkbox Control").checkbox');
    expect(result).toBe(true);
  });

  it('returns false (0) when unchecked', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Toggle',
          effectKey: 'checkbox-control',
          enabled: true,
          parameters: { Checkbox: false, checkbox: false },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Toggle").checkbox');
    expect(result).toBe(false);
  });

  it('can be used in conditional expressions', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Show',
          effectKey: 'checkbox-control',
          enabled: true,
          parameters: { checkbox: true },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Show").checkbox ? 100 : 0');
    expect(result).toBe(100);
  });
});

// ============================================================================
// COLOR CONTROL EXPRESSION ACCESS (Steps 346-348)
// ============================================================================

describe('Color Control - Expression Access', () => {
  it('accesses color value', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Color Control',
          effectKey: 'color-control',
          enabled: true,
          parameters: { Color: [1, 0, 0, 1], color: [1, 0, 0, 1] },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Color Control").color');
    expect(result).toEqual([1, 0, 0, 1]);
  });

  it('returns default white when color not found', () => {
    const ctx = createTestContext({ layerEffects: [] });
    const result = evalExpr(ctx, 'thisLayer.effect("Missing").color');
    expect(result).toEqual([1, 1, 1, 1]);
  });
});

// ============================================================================
// POINT CONTROL EXPRESSION ACCESS (Steps 349-351)
// ============================================================================

describe('Point Control - Expression Access', () => {
  it('accesses 2D point value', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Point Control',
          effectKey: 'point-control',
          enabled: true,
          parameters: { Point: [960, 540], point: [960, 540] },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Point Control").point');
    expect(result).toEqual([960, 540]);
  });

  it('can access individual point components', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Position',
          effectKey: 'point-control',
          enabled: true,
          parameters: { point: [100, 200] },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Position").point[0]');
    expect(result).toBe(100);
  });
});

// ============================================================================
// 3D POINT CONTROL EXPRESSION ACCESS (Steps 352-354)
// ============================================================================

describe('3D Point Control - Expression Access', () => {
  it('accesses 3D point value', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: '3D Point Control',
          effectKey: '3d-point-control',
          enabled: true,
          parameters: { '3D Point': [100, 200, 300], point3D: [100, 200, 300] },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("3D Point Control").point3D');
    expect(result).toEqual([100, 200, 300]);
  });

  it('returns default [0,0,0] when 3D point not found', () => {
    const ctx = createTestContext({ layerEffects: [] });
    const result = evalExpr(ctx, 'thisLayer.effect("Missing").point3D');
    expect(result).toEqual([0, 0, 0]);
  });
});

// ============================================================================
// ANGLE CONTROL EXPRESSION ACCESS (Steps 355-357)
// ============================================================================

describe('Angle Control - Expression Access', () => {
  it('accesses angle value in degrees', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Angle Control',
          effectKey: 'angle-control',
          enabled: true,
          parameters: { Angle: 45, angle: 45 },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Angle Control").angle');
    expect(result).toBe(45);
  });

  it('can be used in rotation calculations', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Spin',
          effectKey: 'angle-control',
          enabled: true,
          parameters: { angle: 90 },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Spin").angle * 2');
    expect(result).toBe(180);
  });
});

// ============================================================================
// DROPDOWN MENU CONTROL EXPRESSION ACCESS (Steps 358-360)
// ============================================================================

describe('Dropdown Menu Control - Expression Access', () => {
  it('accesses menu selection index (1-based)', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Dropdown Menu Control',
          effectKey: 'dropdown-menu-control',
          enabled: true,
          parameters: { Menu: 2, menu: 2 },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Dropdown Menu Control").menu');
    expect(result).toBe(2);
  });

  it('returns default 1 when menu not found', () => {
    const ctx = createTestContext({ layerEffects: [] });
    const result = evalExpr(ctx, 'thisLayer.effect("Missing").menu');
    expect(result).toBe(1);
  });

  it('can be used in switch expressions', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Mode',
          effectKey: 'dropdown-menu-control',
          enabled: true,
          parameters: { menu: 3 },
        },
      ],
    });

    // Menu index 3 = third option
    const result = evalExpr(ctx, `
      var mode = thisLayer.effect("Mode").menu;
      mode == 1 ? 100 : mode == 2 ? 200 : 300
    `);
    expect(result).toBe(300);
  });
});

// ============================================================================
// LAYER CONTROL EXPRESSION ACCESS (Steps 361-365)
// ============================================================================

describe('Layer Control - Expression Access', () => {
  it('accesses layer reference', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Layer Control',
          effectKey: 'layer-control',
          enabled: true,
          parameters: { Layer: 'layer_control', layer: 'layer_control' },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Layer Control").layer');
    expect(result).toBe('layer_control');
  });

  it('returns null when layer not specified', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Target',
          effectKey: 'layer-control',
          enabled: true,
          parameters: { layer: null },
        },
      ],
    });

    const result = evalExpr(ctx, 'thisLayer.effect("Target").layer');
    expect(result).toBe(null);
  });
});

// ============================================================================
// MULTIPLE CONTROLS INTEGRATION
// ============================================================================

describe('Multiple Expression Controls', () => {
  it('can access multiple controls on same layer', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Scale',
          effectKey: 'slider-control',
          enabled: true,
          parameters: { slider: 150 },
        },
        {
          name: 'Enabled',
          effectKey: 'checkbox-control',
          enabled: true,
          parameters: { checkbox: true },
        },
        {
          name: 'Color',
          effectKey: 'color-control',
          enabled: true,
          parameters: { color: [0, 1, 0, 1] },
        },
      ],
    });

    const scaleResult = evalExpr(ctx, 'thisLayer.effect("Scale").slider');
    const enabledResult = evalExpr(ctx, 'thisLayer.effect("Enabled").checkbox');
    const colorResult = evalExpr(ctx, 'thisLayer.effect("Color").color');

    expect(scaleResult).toBe(150);
    expect(enabledResult).toBe(true);
    expect(colorResult).toEqual([0, 1, 0, 1]);
  });

  it('controls can reference each other in expressions', () => {
    const ctx = createTestContext({
      layerEffects: [
        {
          name: 'Base',
          effectKey: 'slider-control',
          enabled: true,
          parameters: { slider: 100 },
        },
        {
          name: 'Multiplier',
          effectKey: 'slider-control',
          enabled: true,
          parameters: { slider: 2 },
        },
      ],
    });

    const result = evalExpr(
      ctx,
      'thisLayer.effect("Base").slider * thisLayer.effect("Multiplier").slider'
    );
    expect(result).toBe(200);
  });
});

// ============================================================================
// DETERMINISM VERIFICATION
// ============================================================================

describe('Expression Control DETERMINISM', () => {
  it('slider values are deterministic', () => {
    const ctx1 = createTestContext({
      layerEffects: [
        { name: 'Speed', effectKey: 'slider-control', enabled: true, parameters: { slider: 50 } },
      ],
    });
    const ctx2 = createTestContext({
      layerEffects: [
        { name: 'Speed', effectKey: 'slider-control', enabled: true, parameters: { slider: 50 } },
      ],
    });

    const result1 = evalExpr(ctx1, 'thisLayer.effect("Speed").slider');
    const result2 = evalExpr(ctx2, 'thisLayer.effect("Speed").slider');

    expect(result1).toBe(result2);
  });

  it('control values at different frames are deterministic', () => {
    const createCtx = (frame: number) =>
      createTestContext({
        frame,
        time: frame / 24,
        layerEffects: [
          { name: 'Value', effectKey: 'slider-control', enabled: true, parameters: { slider: frame * 10 } },
        ],
      });

    // Evaluate at frame 24
    const result24_first = evalExpr(createCtx(24), 'thisLayer.effect("Value").slider');

    // Scrub around
    evalExpr(createCtx(0), 'thisLayer.effect("Value").slider');
    evalExpr(createCtx(48), 'thisLayer.effect("Value").slider');
    evalExpr(createCtx(12), 'thisLayer.effect("Value").slider');

    // Evaluate at frame 24 again
    const result24_second = evalExpr(createCtx(24), 'thisLayer.effect("Value").slider');

    expect(result24_first).toBe(result24_second);
  });
});
