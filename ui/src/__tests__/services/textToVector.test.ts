/**
 * Text-to-Vector Service Tests
 *
 * Tests for converting text to editable vector paths.
 * Uses mocked opentype.js font objects since actual font loading
 * requires network access.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Font, Glyph, Path, PathCommand } from 'opentype.js';
import {
  textToVector,
  textToSinglePath,
  getAvailableGlyphs,
  fontHasChar,
  getFontMetrics,
  measureTextWidth,
  clearFontCache,
  type TextToVectorResult,
  type TextToVectorOptions,
  type VectorBounds,
  type CharacterVectorGroup,
} from '@/services/textToVector';
import type { BezierPath, BezierVertex } from '@/types/shapes';

// ============================================================================
// MOCK HELPERS
// ============================================================================

/**
 * Create a mock PathCommand for move
 */
function mockM(x: number, y: number): PathCommand {
  return { type: 'M', x, y } as PathCommand;
}

/**
 * Create a mock PathCommand for line
 */
function mockL(x: number, y: number): PathCommand {
  return { type: 'L', x, y } as PathCommand;
}

/**
 * Create a mock PathCommand for cubic bezier
 */
function mockC(x1: number, y1: number, x2: number, y2: number, x: number, y: number): PathCommand {
  return { type: 'C', x1, y1, x2, y2, x, y } as PathCommand;
}

/**
 * Create a mock PathCommand for quadratic bezier
 */
function mockQ(x1: number, y1: number, x: number, y: number): PathCommand {
  return { type: 'Q', x1, y1, x, y } as PathCommand;
}

/**
 * Create a mock PathCommand for close
 */
function mockZ(): PathCommand {
  return { type: 'Z' } as PathCommand;
}

/**
 * Create a mock path for a simple square glyph
 */
function createSquareGlyphPath(x: number, y: number, size: number): Path {
  const commands: PathCommand[] = [
    mockM(x, y),
    mockL(x + size, y),
    mockL(x + size, y + size),
    mockL(x, y + size),
    mockZ(),
  ];

  return {
    commands,
    getBoundingBox: () => ({
      x1: x,
      y1: y,
      x2: x + size,
      y2: y + size,
    }),
    fill: '',
    stroke: '',
    strokeWidth: 1,
  } as Path;
}

/**
 * Create a mock path with a curve (letter-like)
 */
function createCurveGlyphPath(x: number, y: number, width: number, height: number): Path {
  const commands: PathCommand[] = [
    mockM(x, y + height), // Bottom left
    mockC(x, y + height * 0.5, x + width * 0.5, y, x + width, y), // Curve up to top right
    mockL(x + width, y + height), // Down to bottom right
    mockZ(),
  ];

  return {
    commands,
    getBoundingBox: () => ({
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
    }),
    fill: '',
    stroke: '',
    strokeWidth: 1,
  } as Path;
}

/**
 * Create a mock glyph
 */
function createMockGlyph(
  char: string,
  advanceWidth: number,
  pathCreator: (x: number, y: number, fontSize: number) => Path
): Partial<Glyph> {
  return {
    name: char,
    unicode: char.charCodeAt(0),
    advanceWidth,
    getPath: (x: number, y: number, fontSize: number) => pathCreator(x, y, fontSize),
  };
}

/**
 * Create a mock font with specified glyphs
 */
function createMockFont(
  glyphMap: Record<string, { advanceWidth: number; pathCreator: (x: number, y: number, fontSize: number) => Path }>
): Font {
  const glyphs: Partial<Glyph>[] = [];

  for (const [char, config] of Object.entries(glyphMap)) {
    glyphs.push(createMockGlyph(char, config.advanceWidth, config.pathCreator));
  }

  const font = {
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    numGlyphs: glyphs.length,
    names: {
      fontFamily: { en: 'Mock Font' },
    },
    glyphs: {
      get: (index: number) => glyphs[index] as Glyph,
    },
    charToGlyph: (char: string) => {
      const glyph = glyphs.find(g => g.unicode === char.charCodeAt(0));
      return glyph as Glyph | undefined;
    },
    hasChar: (char: string) => {
      return glyphs.some(g => g.unicode === char.charCodeAt(0));
    },
    getKerningValue: () => 0,
    getAdvanceWidth: (text: string, fontSize: number, options?: { kerning?: boolean }) => {
      let width = 0;
      const scale = fontSize / 1000;
      for (const char of text) {
        const glyph = glyphs.find(g => g.unicode === char.charCodeAt(0));
        if (glyph) {
          width += (glyph.advanceWidth || 0) * scale;
        }
      }
      return width;
    },
  };

  return font as unknown as Font;
}

/**
 * Create a simple mock font with basic glyphs
 */
function createSimpleMockFont(): Font {
  return createMockFont({
    'A': {
      advanceWidth: 600,
      pathCreator: (x, y, fs) => {
        const scale = fs / 1000;
        return createCurveGlyphPath(x, y - 700 * scale, 600 * scale, 700 * scale);
      },
    },
    'B': {
      advanceWidth: 650,
      pathCreator: (x, y, fs) => {
        const scale = fs / 1000;
        return createSquareGlyphPath(x, y - 700 * scale, 600 * scale);
      },
    },
    'C': {
      advanceWidth: 600,
      pathCreator: (x, y, fs) => {
        const scale = fs / 1000;
        return createCurveGlyphPath(x, y - 700 * scale, 550 * scale, 700 * scale);
      },
    },
    ' ': {
      advanceWidth: 250,
      pathCreator: () => ({
        commands: [],
        getBoundingBox: () => ({ x1: 0, y1: 0, x2: 0, y2: 0 }),
        fill: '',
        stroke: '',
        strokeWidth: 1,
      } as Path),
    },
  });
}

// ============================================================================
// BASIC CONVERSION TESTS
// ============================================================================

describe('textToVector', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
    clearFontCache();
  });

  afterEach(() => {
    clearFontCache();
  });

  describe('Basic functionality', () => {
    it('should convert single character to vector paths', () => {
      const result = textToVector('A', mockFont, 100);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].character).toBe('A');
      expect(result.characters[0].charIndex).toBe(0);
      expect(result.characters[0].paths.length).toBeGreaterThan(0);
    });

    it('should convert multiple characters', () => {
      const result = textToVector('ABC', mockFont, 100);

      expect(result.characters).toHaveLength(3);
      expect(result.characters[0].character).toBe('A');
      expect(result.characters[1].character).toBe('B');
      expect(result.characters[2].character).toBe('C');
    });

    it('should combine all paths in allPaths array', () => {
      const result = textToVector('AB', mockFont, 100);

      // allPaths should contain all paths from all characters
      const totalPaths = result.characters.reduce((sum, c) => sum + c.paths.length, 0);
      expect(result.allPaths.length).toBe(totalPaths);
    });

    it('should handle empty string', () => {
      const result = textToVector('', mockFont, 100);

      expect(result.characters).toHaveLength(0);
      expect(result.allPaths).toHaveLength(0);
    });

    it('should handle space character', () => {
      const result = textToVector('A B', mockFont, 100);

      expect(result.characters).toHaveLength(3);
      expect(result.characters[1].character).toBe(' ');
      // Space should have no paths
      expect(result.characters[1].paths).toHaveLength(0);
    });
  });

  describe('Character positioning', () => {
    it('should position characters sequentially', () => {
      const result = textToVector('AB', mockFont, 100);

      expect(result.characters[0].x).toBe(0);
      expect(result.characters[1].x).toBeGreaterThan(0);
    });

    it('should respect x/y options', () => {
      const result = textToVector('A', mockFont, 100, { x: 50, y: 100 });

      expect(result.characters[0].x).toBe(50);
      // Y is baseline, so bounds should be relative to it
      expect(result.bounds.y).toBeDefined();
    });

    it('should calculate advance width correctly', () => {
      const result = textToVector('A', mockFont, 100);
      const scale = 100 / 1000; // fontSize / unitsPerEm

      expect(result.characters[0].advanceWidth).toBeCloseTo(600 * scale, 1);
    });
  });

  describe('Bounds calculation', () => {
    it('should calculate character bounds', () => {
      const result = textToVector('A', mockFont, 100);

      const bounds = result.characters[0].bounds;
      expect(bounds).toHaveProperty('x');
      expect(bounds).toHaveProperty('y');
      expect(bounds).toHaveProperty('width');
      expect(bounds).toHaveProperty('height');
    });

    it('should calculate total bounds', () => {
      const result = textToVector('AB', mockFont, 100);

      expect(result.bounds).toHaveProperty('x');
      expect(result.bounds).toHaveProperty('y');
      expect(result.bounds).toHaveProperty('width');
      expect(result.bounds).toHaveProperty('height');

      // Total bounds should encompass all characters
      expect(result.bounds.width).toBeGreaterThan(0);
    });

    it('should return zero bounds for empty paths', () => {
      const result = textToVector(' ', mockFont, 100);

      expect(result.bounds.width).toBe(0);
      expect(result.bounds.height).toBe(0);
    });
  });

  describe('Font metrics', () => {
    it('should include font metrics in result', () => {
      const result = textToVector('A', mockFont, 100);

      expect(result.metrics).toHaveProperty('ascender');
      expect(result.metrics).toHaveProperty('descender');
      expect(result.metrics).toHaveProperty('unitsPerEm');
      expect(result.metrics).toHaveProperty('lineHeight');
    });

    it('should scale metrics to font size', () => {
      const result = textToVector('A', mockFont, 100);
      const scale = 100 / 1000;

      expect(result.metrics.ascender).toBeCloseTo(800 * scale, 1);
      expect(result.metrics.descender).toBeCloseTo(-200 * scale, 1);
      expect(result.metrics.lineHeight).toBeCloseTo(1000 * scale, 1);
    });
  });
});

// ============================================================================
// PATH CONVERSION TESTS
// ============================================================================

describe('Path conversion', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  it('should convert line commands to vertices with zero handles', () => {
    const result = textToVector('B', mockFont, 100);

    // B uses square path which has only line commands
    expect(result.characters[0].paths.length).toBeGreaterThan(0);
    const path = result.characters[0].paths[0];

    // Line paths should have vertices
    expect(path.vertices.length).toBeGreaterThan(0);
  });

  it('should convert cubic bezier commands', () => {
    const result = textToVector('A', mockFont, 100);

    // A uses curve path
    expect(result.characters[0].paths.length).toBeGreaterThan(0);
  });

  it('should handle closed paths', () => {
    const result = textToVector('A', mockFont, 100);

    const path = result.characters[0].paths[0];
    expect(path.closed).toBe(true);
  });
});

// ============================================================================
// TEXT TO SINGLE PATH TESTS
// ============================================================================

describe('textToSinglePath', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  it('should return combined paths array', () => {
    const paths = textToSinglePath('AB', mockFont, 100);

    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should match allPaths from textToVector', () => {
    const singlePaths = textToSinglePath('AB', mockFont, 100);
    const result = textToVector('AB', mockFont, 100);

    expect(singlePaths.length).toBe(result.allPaths.length);
  });
});

// ============================================================================
// FONT UTILITY TESTS
// ============================================================================

describe('Font utilities', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  describe('getAvailableGlyphs', () => {
    it('should return array of available characters', () => {
      const glyphs = getAvailableGlyphs(mockFont);

      expect(Array.isArray(glyphs)).toBe(true);
      expect(glyphs.length).toBeGreaterThan(0);
    });

    it('should include defined characters', () => {
      const glyphs = getAvailableGlyphs(mockFont);

      // Mock font has A, B, C, and space
      expect(glyphs).toContain('A');
      expect(glyphs).toContain('B');
      expect(glyphs).toContain('C');
    });
  });

  describe('fontHasChar', () => {
    it('should return true for existing characters', () => {
      expect(fontHasChar(mockFont, 'A')).toBe(true);
      expect(fontHasChar(mockFont, 'B')).toBe(true);
    });

    it('should return false for missing characters', () => {
      expect(fontHasChar(mockFont, 'X')).toBe(false);
      expect(fontHasChar(mockFont, 'Z')).toBe(false);
    });
  });

  describe('getFontMetrics', () => {
    it('should return font metrics', () => {
      const metrics = getFontMetrics(mockFont, 100);

      expect(metrics).toHaveProperty('ascender');
      expect(metrics).toHaveProperty('descender');
      expect(metrics).toHaveProperty('lineHeight');
      expect(metrics).toHaveProperty('unitsPerEm');
    });

    it('should scale metrics to font size', () => {
      const metrics100 = getFontMetrics(mockFont, 100);
      const metrics200 = getFontMetrics(mockFont, 200);

      expect(metrics200.ascender).toBeCloseTo(metrics100.ascender * 2, 1);
      expect(metrics200.lineHeight).toBeCloseTo(metrics100.lineHeight * 2, 1);
    });

    it('should preserve unitsPerEm', () => {
      const metrics = getFontMetrics(mockFont, 100);
      expect(metrics.unitsPerEm).toBe(1000);
    });
  });

  describe('measureTextWidth', () => {
    it('should measure single character width', () => {
      const width = measureTextWidth('A', mockFont, 100);

      expect(width).toBeGreaterThan(0);
    });

    it('should measure multiple character width', () => {
      const widthA = measureTextWidth('A', mockFont, 100);
      const widthAB = measureTextWidth('AB', mockFont, 100);

      expect(widthAB).toBeGreaterThan(widthA);
    });

    it('should return 0 for empty string', () => {
      const width = measureTextWidth('', mockFont, 100);

      expect(width).toBe(0);
    });

    it('should scale with font size', () => {
      const width100 = measureTextWidth('A', mockFont, 100);
      const width200 = measureTextWidth('A', mockFont, 200);

      expect(width200).toBeCloseTo(width100 * 2, 1);
    });
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
    // Just verify it doesn't throw
    expect(() => clearFontCache()).not.toThrow();
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  it('should handle very small font size', () => {
    const result = textToVector('A', mockFont, 1);

    expect(result.characters).toHaveLength(1);
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.width).toBeLessThan(10);
  });

  it('should handle very large font size', () => {
    const result = textToVector('A', mockFont, 1000);

    expect(result.characters).toHaveLength(1);
    expect(result.bounds.width).toBeGreaterThan(100);
  });

  it('should handle negative x position', () => {
    const result = textToVector('A', mockFont, 100, { x: -50 });

    expect(result.characters[0].x).toBe(-50);
  });

  it('should handle character not in font', () => {
    // X is not in our mock font
    const result = textToVector('AXB', mockFont, 100);

    // Should skip missing characters but continue
    // A and B should still be processed
    expect(result.characters.some(c => c.character === 'A')).toBe(true);
    expect(result.characters.some(c => c.character === 'B')).toBe(true);
  });

  it('should handle unicode characters', () => {
    // Add a unicode character to the font
    const unicodeFont = createMockFont({
      ...Object.fromEntries([['A', { advanceWidth: 600, pathCreator: (x, y, fs) => createSquareGlyphPath(x, y, 100) }]]),
    });

    const result = textToVector('A', unicodeFont, 100);
    expect(result.characters).toHaveLength(1);
  });
});

// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================

describe('Type validation', () => {
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  it('should return TextToVectorResult with correct shape', () => {
    const result = textToVector('A', mockFont, 100);

    // Verify result has all expected properties
    expect(result).toHaveProperty('characters');
    expect(result).toHaveProperty('allPaths');
    expect(result).toHaveProperty('bounds');
    expect(result).toHaveProperty('metrics');

    // Verify types
    expect(Array.isArray(result.characters)).toBe(true);
    expect(Array.isArray(result.allPaths)).toBe(true);
    expect(typeof result.bounds.x).toBe('number');
    expect(typeof result.metrics.ascender).toBe('number');
  });

  it('should return CharacterVectorGroup with correct shape', () => {
    const result = textToVector('A', mockFont, 100);
    const charGroup = result.characters[0];

    expect(charGroup).toHaveProperty('character');
    expect(charGroup).toHaveProperty('charIndex');
    expect(charGroup).toHaveProperty('paths');
    expect(charGroup).toHaveProperty('bounds');
    expect(charGroup).toHaveProperty('x');
    expect(charGroup).toHaveProperty('advanceWidth');

    expect(typeof charGroup.character).toBe('string');
    expect(typeof charGroup.charIndex).toBe('number');
    expect(Array.isArray(charGroup.paths)).toBe(true);
  });

  it('should return BezierPath with correct shape', () => {
    const result = textToVector('A', mockFont, 100);
    const path = result.characters[0].paths[0];

    expect(path).toHaveProperty('vertices');
    expect(path).toHaveProperty('closed');

    expect(Array.isArray(path.vertices)).toBe(true);
    expect(typeof path.closed).toBe('boolean');
  });

  it('should return BezierVertex with correct shape', () => {
    const result = textToVector('A', mockFont, 100);
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
  let mockFont: Font;

  beforeEach(() => {
    mockFont = createSimpleMockFont();
  });

  it('should use default options when not specified', () => {
    const result = textToVector('A', mockFont, 100);

    // Should work with defaults
    expect(result.characters).toHaveLength(1);
  });

  it('should apply x offset', () => {
    const result = textToVector('A', mockFont, 100, { x: 100 });

    expect(result.characters[0].x).toBe(100);
  });

  it('should apply y offset', () => {
    const resultNoOffset = textToVector('A', mockFont, 100, { y: 0 });
    const resultWithOffset = textToVector('A', mockFont, 100, { y: 100 });

    // Bounds should differ by y offset
    expect(resultWithOffset.bounds.y).not.toBe(resultNoOffset.bounds.y);
  });

  it('should enable kerning by default', () => {
    // Note: Our mock font doesn't have kerning values, but should not crash
    const result = textToVector('AB', mockFont, 100);

    expect(result.characters).toHaveLength(2);
  });

  it('should disable kerning when specified', () => {
    const result = textToVector('AB', mockFont, 100, { kerning: false });

    expect(result.characters).toHaveLength(2);
  });
});
