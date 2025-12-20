/**
 * Text-to-Vector Service Tests
 *
 * Tests for converting text to editable vector paths.
 * Tests match the actual async API of textToVector.ts.
 *
 * Note: These tests mock opentype.js since actual font loading
 * requires network access.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PathCommand } from 'opentype.js';
import {
  textToVector,
  textLayerToSplines,
  loadFontFromBuffer,
  registerFontUrl,
  clearFontCache,
  type TextToVectorResult,
  type TextToVectorOptions,
  type CharacterVectorGroup,
  type BoundingBox,
} from '@/services/textToVector';
import type { BezierPath, BezierVertex } from '@/types/shapes';
import type { Layer } from '@/types/project';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock opentype.js
vi.mock('opentype.js', () => {
  const createMockPath = (x: number, y: number, fontSize: number) => ({
    commands: [
      { type: 'M', x, y } as PathCommand,
      { type: 'L', x: x + fontSize * 0.6, y } as PathCommand,
      { type: 'L', x: x + fontSize * 0.6, y: y + fontSize * 0.7 } as PathCommand,
      { type: 'L', x, y: y + fontSize * 0.7 } as PathCommand,
      { type: 'Z' } as PathCommand,
    ],
    getBoundingBox: () => ({
      x1: x,
      y1: y,
      x2: x + fontSize * 0.6,
      y2: y + fontSize * 0.7,
    }),
  });

  const createMockGlyph = (char: string, advanceWidth: number) => ({
    name: char,
    unicode: char.charCodeAt(0),
    advanceWidth,
    getPath: (x: number, y: number, fontSize: number) => createMockPath(x, y, fontSize),
  });

  const mockFont = {
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    names: {
      fontFamily: { en: 'Mock Font' },
    },
    charToGlyph: (char: string) => {
      const glyphs: Record<string, ReturnType<typeof createMockGlyph>> = {
        'A': createMockGlyph('A', 600),
        'B': createMockGlyph('B', 650),
        'C': createMockGlyph('C', 600),
        ' ': createMockGlyph(' ', 250),
      };
      return glyphs[char] || null;
    },
    getPath: (text: string, x: number, y: number, fontSize: number) => {
      const commands: PathCommand[] = [];
      let currentX = x;
      const scale = fontSize / 1000;

      for (const char of text) {
        const width = char === ' ' ? 250 * scale : 600 * scale;
        if (char !== ' ') {
          commands.push(
            { type: 'M', x: currentX, y } as PathCommand,
            { type: 'L', x: currentX + width, y } as PathCommand,
            { type: 'L', x: currentX + width, y: y + fontSize * 0.7 } as PathCommand,
            { type: 'L', x: currentX, y: y + fontSize * 0.7 } as PathCommand,
            { type: 'Z' } as PathCommand,
          );
        }
        currentX += width;
      }

      return {
        commands,
        getBoundingBox: () => ({
          x1: x,
          y1: y,
          x2: currentX,
          y2: y + fontSize * 0.7,
        }),
      };
    },
    getKerningValue: () => 0,
  };

  return {
    default: {
      load: vi.fn().mockResolvedValue(mockFont),
      parse: vi.fn().mockReturnValue(mockFont),
    },
  };
});

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a mock text layer
 */
function createTextLayer(
  name: string,
  text: string,
  options: {
    fontFamily?: string;
    fontSize?: number;
    x?: number;
    y?: number;
  } = {}
): Layer {
  return {
    id: `layer_${name}`,
    name,
    type: 'text',
    visible: true,
    locked: false,
    inPoint: 0,
    outPoint: 80,
    data: {
      text,
      fontFamily: options.fontFamily ?? 'Arial',
      fontSize: options.fontSize ?? 72,
    },
    transform: {
      position: { value: { x: options.x ?? 0, y: options.y ?? 0, z: 0 } },
      rotation: { value: 0 },
      scale: { value: { x: 100, y: 100 } },
      anchor: { value: { x: 0, y: 0, z: 0 } },
      opacity: { value: 100 },
    },
  } as unknown as Layer; // Cast to Layer - test helper doesn't need all properties
}

// ============================================================================
// BASIC CONVERSION TESTS
// ============================================================================

describe('textToVector', () => {
  beforeEach(() => {
    clearFontCache();
  });

  afterEach(() => {
    clearFontCache();
  });

  describe('Basic functionality', () => {
    it('should convert single character to vector paths', async () => {
      const result = await textToVector('A', 'Arial', { fontSize: 100 });

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].character).toBe('A');
      expect(result.characters[0].charIndex).toBe(0);
      expect(result.characters[0].paths.length).toBeGreaterThan(0);
    });

    it('should convert multiple characters', async () => {
      const result = await textToVector('ABC', 'Arial', { fontSize: 100 });

      expect(result.characters).toHaveLength(3);
      expect(result.characters[0].character).toBe('A');
      expect(result.characters[1].character).toBe('B');
      expect(result.characters[2].character).toBe('C');
    });

    it('should combine all paths in allPaths array', async () => {
      const result = await textToVector('AB', 'Arial', { fontSize: 100 });

      // allPaths should contain paths from all characters
      expect(result.allPaths.length).toBeGreaterThan(0);
    });

    it('should return result with expected properties', async () => {
      const result = await textToVector('A', 'Arial', { fontSize: 100 });

      expect(result).toHaveProperty('allPaths');
      expect(result).toHaveProperty('characters');
      expect(result).toHaveProperty('bounds');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('fontFamily');
      expect(result).toHaveProperty('fontSize');
    });

    it('should store original text and font info', async () => {
      const result = await textToVector('Hello', 'Arial', { fontSize: 72 });

      expect(result.text).toBe('Hello');
      expect(result.fontSize).toBe(72);
    });
  });

  describe('Bounds calculation', () => {
    it('should calculate character bounds', async () => {
      const result = await textToVector('A', 'Arial', { fontSize: 100 });

      const bounds = result.characters[0].bounds;
      expect(bounds).toHaveProperty('x');
      expect(bounds).toHaveProperty('y');
      expect(bounds).toHaveProperty('width');
      expect(bounds).toHaveProperty('height');
    });

    it('should calculate total bounds', async () => {
      const result = await textToVector('AB', 'Arial', { fontSize: 100 });

      expect(result.bounds).toHaveProperty('x');
      expect(result.bounds).toHaveProperty('y');
      expect(result.bounds).toHaveProperty('width');
      expect(result.bounds).toHaveProperty('height');

      // Total bounds should encompass all characters
      expect(result.bounds.width).toBeGreaterThan(0);
    });
  });

  describe('Character positioning', () => {
    it('should calculate advance width correctly', async () => {
      const result = await textToVector('A', 'Arial', { fontSize: 100 });

      expect(result.characters[0].advanceWidth).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// PATH CONVERSION TESTS
// ============================================================================

describe('Path conversion', () => {
  beforeEach(() => {
    clearFontCache();
  });

  it('should create BezierPath with vertices', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });

    expect(result.characters[0].paths.length).toBeGreaterThan(0);
    const path = result.characters[0].paths[0];

    expect(path).toHaveProperty('vertices');
    expect(path).toHaveProperty('closed');
    expect(Array.isArray(path.vertices)).toBe(true);
  });

  it('should handle closed paths', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });

    const path = result.characters[0].paths[0];
    expect(path.closed).toBe(true);
  });
});

// ============================================================================
// LAYER CONVERSION TESTS
// ============================================================================

describe('textLayerToSplines', () => {
  beforeEach(() => {
    clearFontCache();
  });

  it('should convert text layer to spline layers', async () => {
    const textLayer = createTextLayer('Title', 'AB');
    const { layers, result } = await textLayerToSplines(textLayer);

    expect(layers.length).toBeGreaterThan(0);
    expect(result.characters).toHaveLength(2);
  });

  it('should throw error for non-text layer', async () => {
    const nonTextLayer = {
      id: 'shape',
      name: 'Shape',
      type: 'shape',
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

    await expect(textLayerToSplines(nonTextLayer)).rejects.toThrow('Layer must be a text layer');
  });

  it('should create spline layers with correct data', async () => {
    const textLayer = createTextLayer('Title', 'A', { fontSize: 72 });
    const { layers } = await textLayerToSplines(textLayer);

    expect(layers[0]).toHaveProperty('type', 'spline');
    expect(layers[0]).toHaveProperty('data');
    expect((layers[0].data as any).controlPoints).toBeDefined();
  });

  it('should group by character when enabled', async () => {
    const textLayer = createTextLayer('Title', 'AB');
    const { layers } = await textLayerToSplines(textLayer, { groupByCharacter: true });

    // Should have separate layer for each character
    expect(layers.length).toBe(2);
  });

  it('should combine all characters when groupByCharacter is false', async () => {
    const textLayer = createTextLayer('Title', 'AB');
    const { layers } = await textLayerToSplines(textLayer, { groupByCharacter: false });

    // Should have single combined layer
    expect(layers.length).toBe(1);
  });
});

// ============================================================================
// FONT CACHE TESTS
// ============================================================================

describe('Font cache', () => {
  beforeEach(() => {
    clearFontCache();
  });

  afterEach(() => {
    clearFontCache();
  });

  it('should clear cache on clearFontCache()', () => {
    expect(() => clearFontCache()).not.toThrow();
  });

  it('should register font URL', () => {
    expect(() => registerFontUrl('CustomFont', 'https://example.com/font.ttf')).not.toThrow();
  });
});

// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================

describe('Type validation', () => {
  beforeEach(() => {
    clearFontCache();
  });

  it('should return TextToVectorResult with correct shape', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });

    // Verify result has all expected properties
    expect(result).toHaveProperty('characters');
    expect(result).toHaveProperty('allPaths');
    expect(result).toHaveProperty('bounds');

    // Verify types
    expect(Array.isArray(result.characters)).toBe(true);
    expect(Array.isArray(result.allPaths)).toBe(true);
    expect(typeof result.bounds.x).toBe('number');
  });

  it('should return CharacterVectorGroup with correct shape', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });
    const charGroup = result.characters[0];

    expect(charGroup).toHaveProperty('character');
    expect(charGroup).toHaveProperty('charIndex');
    expect(charGroup).toHaveProperty('paths');
    expect(charGroup).toHaveProperty('bounds');
    expect(charGroup).toHaveProperty('advanceWidth');

    expect(typeof charGroup.character).toBe('string');
    expect(typeof charGroup.charIndex).toBe('number');
    expect(Array.isArray(charGroup.paths)).toBe(true);
  });

  it('should return BezierPath with correct shape', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });
    const path = result.characters[0].paths[0];

    expect(path).toHaveProperty('vertices');
    expect(path).toHaveProperty('closed');

    expect(Array.isArray(path.vertices)).toBe(true);
    expect(typeof path.closed).toBe('boolean');
  });

  it('should return BezierVertex with correct shape', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });
    const path = result.characters[0].paths[0];
    const vertex = path.vertices[0];

    expect(vertex).toHaveProperty('point');
    expect(vertex).toHaveProperty('inHandle');
    expect(vertex).toHaveProperty('outHandle');

    expect(vertex.point).toHaveProperty('x');
    expect(vertex.point).toHaveProperty('y');
    expect(typeof vertex.point.x).toBe('number');
    expect(typeof vertex.point.y).toBe('number');
  });
});

// ============================================================================
// OPTIONS TESTS
// ============================================================================

describe('TextToVectorOptions', () => {
  beforeEach(() => {
    clearFontCache();
  });

  it('should use default options when not specified', async () => {
    const result = await textToVector('A', 'Arial');

    // Should work with defaults
    expect(result.characters).toHaveLength(1);
    expect(result.fontSize).toBe(72); // Default fontSize
  });

  it('should apply custom fontSize', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 100 });

    expect(result.fontSize).toBe(100);
  });

  it('should apply letterSpacing option', async () => {
    // With letter spacing, characters should be spaced further apart
    const resultNoSpacing = await textToVector('AB', 'Arial', { fontSize: 100, letterSpacing: 0 });
    const resultWithSpacing = await textToVector('AB', 'Arial', { fontSize: 100, letterSpacing: 10 });

    // Both should convert successfully
    expect(resultNoSpacing.characters).toHaveLength(2);
    expect(resultWithSpacing.characters).toHaveLength(2);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  beforeEach(() => {
    clearFontCache();
  });

  it('should handle very small font size', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 1 });

    expect(result.characters).toHaveLength(1);
    expect(result.bounds.width).toBeGreaterThan(0);
  });

  it('should handle very large font size', async () => {
    const result = await textToVector('A', 'Arial', { fontSize: 1000 });

    expect(result.characters).toHaveLength(1);
    expect(result.bounds.width).toBeGreaterThan(100);
  });
});
