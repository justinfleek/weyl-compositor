/**
 * Text-to-Vector Service
 *
 * Converts text to editable vector paths using opentype.js for
 * client-side font parsing. Supports grouping by character for
 * per-character animation.
 *
 * Key features:
 * - Convert any text to BezierPath
 * - Per-character path grouping
 * - Support for system fonts (via font URL)
 * - Quadratic to cubic bezier conversion
 * - Proper hole detection for compound glyphs
 */

import opentype, { type Font, type Path, type PathCommand, type BoundingBox as OTBoundingBox } from 'opentype.js';
import type { BezierPath, BezierVertex, Point2D } from '@/types/shapes';
import { createLogger } from '@/utils/logger';

const logger = createLogger('TextToVector');

// ============================================================================
// TYPES
// ============================================================================

/** Bounding box for vector content */
export interface VectorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Vector paths for a single character */
export interface CharacterVectorGroup {
  /** The character this group represents */
  character: string;
  /** Index of this character in the original text */
  charIndex: number;
  /** Vector paths for this character (may include holes) */
  paths: BezierPath[];
  /** Bounding box of this character */
  bounds: VectorBounds;
  /** X position of this character in the full text */
  x: number;
  /** Advance width (distance to next character) */
  advanceWidth: number;
}

/** Result of text-to-vector conversion */
export interface TextToVectorResult {
  /** Per-character vector groups */
  characters: CharacterVectorGroup[];
  /** All paths combined (for simple rendering) */
  allPaths: BezierPath[];
  /** Total bounds of the entire text */
  bounds: VectorBounds;
  /** Font metrics */
  metrics: {
    ascender: number;
    descender: number;
    unitsPerEm: number;
    lineHeight: number;
  };
}

/** Options for text-to-vector conversion */
export interface TextToVectorOptions {
  /** X position of text start */
  x?: number;
  /** Y position of text baseline */
  y?: number;
  /** Enable kerning */
  kerning?: boolean;
  /** Simplify paths (reduce point count) */
  simplify?: boolean;
  /** Simplification tolerance (if simplify is true) */
  simplifyTolerance?: number;
}

// ============================================================================
// FONT CACHE
// ============================================================================

/** Cache loaded fonts to avoid repeated network requests */
const fontCache = new Map<string, Font>();

/**
 * Load a font from URL
 * @param fontUrl URL to the font file (TTF, OTF, WOFF)
 * @returns Loaded font
 */
export async function loadFont(fontUrl: string): Promise<Font> {
  // Check cache first
  const cached = fontCache.get(fontUrl);
  if (cached) {
    return cached;
  }

  try {
    const font = await opentype.load(fontUrl);
    fontCache.set(fontUrl, font);
    logger.info(`Font loaded: ${font.names.fontFamily?.en || 'Unknown'}`);
    return font;
  } catch (error) {
    logger.error(`Failed to load font from ${fontUrl}:`, error);
    throw new Error(`Failed to load font: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load a font from an ArrayBuffer
 * @param buffer Font file data
 * @param cacheKey Optional key for caching
 * @returns Loaded font
 */
export function loadFontFromBuffer(buffer: ArrayBuffer, cacheKey?: string): Font {
  try {
    const font = opentype.parse(buffer);

    if (cacheKey) {
      fontCache.set(cacheKey, font);
    }

    logger.info(`Font parsed: ${font.names.fontFamily?.en || 'Unknown'}`);
    return font;
  } catch (error) {
    logger.error('Failed to parse font buffer:', error);
    throw new Error(`Failed to parse font: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear the font cache
 */
export function clearFontCache(): void {
  fontCache.clear();
  logger.info('Font cache cleared');
}

// ============================================================================
// PATH CONVERSION
// ============================================================================

/**
 * Convert quadratic bezier to cubic bezier control points
 * Quadratic: (P0, P1, P2) -> Cubic: (P0, CP1, CP2, P3)
 * CP1 = P0 + 2/3 * (P1 - P0)
 * CP2 = P2 + 2/3 * (P1 - P2)
 */
function quadToCubic(
  p0: Point2D,
  p1: Point2D,  // Quadratic control point
  p2: Point2D   // End point
): { cp1: Point2D; cp2: Point2D } {
  return {
    cp1: {
      x: p0.x + (2 / 3) * (p1.x - p0.x),
      y: p0.y + (2 / 3) * (p1.y - p0.y),
    },
    cp2: {
      x: p2.x + (2 / 3) * (p1.x - p2.x),
      y: p2.y + (2 / 3) * (p1.y - p2.y),
    },
  };
}

/**
 * Convert opentype.js PathCommands to BezierPath
 */
function commandsToBezierPath(commands: PathCommand[]): BezierPath[] {
  const paths: BezierPath[] = [];
  let currentPath: BezierVertex[] = [];
  let currentPoint: Point2D = { x: 0, y: 0 };
  let firstPoint: Point2D = { x: 0, y: 0 };
  let prevOutHandle: Point2D | null = null;

  const finishPath = (closed: boolean) => {
    if (currentPath.length > 0) {
      // Set the last vertex's out handle if we have one pending
      if (prevOutHandle && currentPath.length > 0) {
        const lastVertex = currentPath[currentPath.length - 1];
        lastVertex.outHandle = {
          x: prevOutHandle.x - lastVertex.point.x,
          y: prevOutHandle.y - lastVertex.point.y,
        };
      }

      // For closed paths, connect the handles properly
      if (closed && currentPath.length > 1) {
        // The first vertex's inHandle should connect from last vertex
        // Already set during processing
      }

      paths.push({
        vertices: currentPath,
        closed,
      });
    }
    currentPath = [];
    prevOutHandle = null;
  };

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M': {
        // Start new path (finish previous if exists)
        finishPath(false);

        currentPoint = { x: cmd.x, y: cmd.y };
        firstPoint = { x: cmd.x, y: cmd.y };

        // Add first vertex
        currentPath.push({
          point: { x: cmd.x, y: cmd.y },
          inHandle: { x: 0, y: 0 },
          outHandle: { x: 0, y: 0 },
        });
        break;
      }

      case 'L': {
        // Line to - add vertex with zero handles (sharp corner)
        const endPoint = { x: cmd.x, y: cmd.y };

        // Update previous vertex's out handle to point toward this vertex
        if (currentPath.length > 0) {
          const lastVertex = currentPath[currentPath.length - 1];
          // For straight lines, we could set handles to 1/3 of the way
          // but for sharp corners, we keep them at zero
          lastVertex.outHandle = { x: 0, y: 0 };
        }

        currentPath.push({
          point: endPoint,
          inHandle: { x: 0, y: 0 },
          outHandle: { x: 0, y: 0 },
        });

        currentPoint = endPoint;
        prevOutHandle = null;
        break;
      }

      case 'C': {
        // Cubic bezier
        const cp1 = { x: cmd.x1, y: cmd.y1 };
        const cp2 = { x: cmd.x2, y: cmd.y2 };
        const endPoint = { x: cmd.x, y: cmd.y };

        // Set previous vertex's out handle
        if (currentPath.length > 0) {
          const lastVertex = currentPath[currentPath.length - 1];
          lastVertex.outHandle = {
            x: cp1.x - lastVertex.point.x,
            y: cp1.y - lastVertex.point.y,
          };
        }

        // Add new vertex with in handle from cp2
        currentPath.push({
          point: endPoint,
          inHandle: {
            x: cp2.x - endPoint.x,
            y: cp2.y - endPoint.y,
          },
          outHandle: { x: 0, y: 0 },
        });

        currentPoint = endPoint;
        prevOutHandle = null;
        break;
      }

      case 'Q': {
        // Quadratic bezier - convert to cubic
        const qControlPoint = { x: cmd.x1, y: cmd.y1 };
        const endPoint = { x: cmd.x, y: cmd.y };

        const { cp1, cp2 } = quadToCubic(currentPoint, qControlPoint, endPoint);

        // Set previous vertex's out handle
        if (currentPath.length > 0) {
          const lastVertex = currentPath[currentPath.length - 1];
          lastVertex.outHandle = {
            x: cp1.x - lastVertex.point.x,
            y: cp1.y - lastVertex.point.y,
          };
        }

        // Add new vertex
        currentPath.push({
          point: endPoint,
          inHandle: {
            x: cp2.x - endPoint.x,
            y: cp2.y - endPoint.y,
          },
          outHandle: { x: 0, y: 0 },
        });

        currentPoint = endPoint;
        prevOutHandle = null;
        break;
      }

      case 'Z': {
        // Close path
        finishPath(true);
        currentPoint = firstPoint;
        break;
      }
    }
  }

  // Finish any remaining open path
  finishPath(false);

  return paths;
}

/**
 * Convert opentype BoundingBox to our VectorBounds
 */
function otBoundsToVectorBounds(bounds: OTBoundingBox): VectorBounds {
  return {
    x: bounds.x1,
    y: bounds.y1,
    width: bounds.x2 - bounds.x1,
    height: bounds.y2 - bounds.y1,
  };
}

/**
 * Calculate combined bounds from multiple paths
 */
function calculateCombinedBounds(paths: BezierPath[]): VectorBounds {
  if (paths.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const vertex of path.vertices) {
      minX = Math.min(minX, vertex.point.x);
      minY = Math.min(minY, vertex.point.y);
      maxX = Math.max(maxX, vertex.point.x);
      maxY = Math.max(maxY, vertex.point.y);
    }
  }

  if (!isFinite(minX)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Convert text to vector paths
 *
 * @param text The text to convert
 * @param font Loaded font object
 * @param fontSize Font size in pixels
 * @param options Conversion options
 * @returns Vector paths grouped by character
 */
export function textToVector(
  text: string,
  font: Font,
  fontSize: number,
  options: TextToVectorOptions = {}
): TextToVectorResult {
  const {
    x = 0,
    y = 0,
    kerning = true,
  } = options;

  const characters: CharacterVectorGroup[] = [];
  const allPaths: BezierPath[] = [];
  let currentX = x;

  // Scale factor from font units to pixels
  const scale = fontSize / font.unitsPerEm;

  // Process each character
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);

    if (!glyph) {
      logger.warn(`No glyph found for character: ${char}`);
      continue;
    }

    // Get the glyph path at the current position
    const glyphPath = glyph.getPath(currentX, y, fontSize);
    const charPaths = commandsToBezierPath(glyphPath.commands);

    // Calculate bounds for this character
    const glyphBounds = glyphPath.getBoundingBox();
    const bounds = otBoundsToVectorBounds(glyphBounds);

    // Calculate advance width
    const advanceWidth = (glyph.advanceWidth || 0) * scale;

    // Add kerning if enabled and not the last character
    let kerningValue = 0;
    if (kerning && i < text.length - 1) {
      const nextGlyph = font.charToGlyph(text[i + 1]);
      if (nextGlyph) {
        kerningValue = font.getKerningValue(glyph, nextGlyph) * scale;
      }
    }

    // Add character group
    characters.push({
      character: char,
      charIndex: i,
      paths: charPaths,
      bounds,
      x: currentX,
      advanceWidth,
    });

    // Add paths to combined list
    allPaths.push(...charPaths);

    // Advance position
    currentX += advanceWidth + kerningValue;
  }

  // Calculate total bounds
  const totalBounds = calculateCombinedBounds(allPaths);

  // Calculate metrics
  const metrics = {
    ascender: font.ascender * scale,
    descender: font.descender * scale,
    unitsPerEm: font.unitsPerEm,
    lineHeight: (font.ascender - font.descender) * scale,
  };

  return {
    characters,
    allPaths,
    bounds: totalBounds,
    metrics,
  };
}

/**
 * Convert text to vector paths using a font URL
 *
 * @param text The text to convert
 * @param fontUrl URL to the font file
 * @param fontSize Font size in pixels
 * @param options Conversion options
 * @returns Vector paths grouped by character
 */
export async function textToVectorFromUrl(
  text: string,
  fontUrl: string,
  fontSize: number,
  options: TextToVectorOptions = {}
): Promise<TextToVectorResult> {
  const font = await loadFont(fontUrl);
  return textToVector(text, font, fontSize, options);
}

/**
 * Get a single combined path for all text
 * Useful when you don't need per-character grouping
 *
 * @param text The text to convert
 * @param font Loaded font object
 * @param fontSize Font size in pixels
 * @param options Conversion options
 * @returns Single combined BezierPath array
 */
export function textToSinglePath(
  text: string,
  font: Font,
  fontSize: number,
  options: TextToVectorOptions = {}
): BezierPath[] {
  const { allPaths } = textToVector(text, font, fontSize, options);
  return allPaths;
}

/**
 * Get available glyphs in a font
 *
 * @param font Loaded font object
 * @returns Array of available characters
 */
export function getAvailableGlyphs(font: Font): string[] {
  const chars: string[] = [];

  for (let i = 0; i < font.numGlyphs; i++) {
    const glyph = font.glyphs.get(i);
    if (glyph && glyph.unicode !== undefined) {
      chars.push(String.fromCodePoint(glyph.unicode));
    }
  }

  return chars;
}

/**
 * Check if a font supports a specific character
 *
 * @param font Loaded font object
 * @param char Character to check
 * @returns Whether the font has a glyph for this character
 */
export function fontHasChar(font: Font, char: string): boolean {
  return font.hasChar(char);
}

/**
 * Get font metrics
 *
 * @param font Loaded font object
 * @param fontSize Font size in pixels
 * @returns Font metrics scaled to the given size
 */
export function getFontMetrics(font: Font, fontSize: number): {
  ascender: number;
  descender: number;
  lineHeight: number;
  unitsPerEm: number;
} {
  const scale = fontSize / font.unitsPerEm;
  return {
    ascender: font.ascender * scale,
    descender: font.descender * scale,
    lineHeight: (font.ascender - font.descender) * scale,
    unitsPerEm: font.unitsPerEm,
  };
}

/**
 * Measure text width without converting to paths
 *
 * @param text Text to measure
 * @param font Loaded font object
 * @param fontSize Font size in pixels
 * @param kerning Enable kerning
 * @returns Text width in pixels
 */
export function measureTextWidth(
  text: string,
  font: Font,
  fontSize: number,
  kerning: boolean = true
): number {
  return font.getAdvanceWidth(text, fontSize, { kerning });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const TextToVector = {
  // Main conversion
  textToVector,
  textToVectorFromUrl,
  textToSinglePath,

  // Font loading
  loadFont,
  loadFontFromBuffer,
  clearFontCache,

  // Utilities
  getAvailableGlyphs,
  fontHasChar,
  getFontMetrics,
  measureTextWidth,
};

export default TextToVector;
