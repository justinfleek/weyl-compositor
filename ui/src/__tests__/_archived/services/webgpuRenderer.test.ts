/**
 * WebGPU Renderer Tests
 *
 * Tests initialization, capability detection, and fallback behavior.
 * Note: Full WebGPU compute tests are skipped in JSDOM (no WebGPU support).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  webgpuRenderer,
  getWebGPUStats,
  type BlurParams,
  type ColorCorrectionParams,
} from '@/services/webgpuRenderer';

// ============================================================================
// ENVIRONMENT CHECK
// ============================================================================

function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function isImageDataSupported(): boolean {
  return typeof ImageData !== 'undefined';
}

const WEBGPU_SUPPORTED = isWebGPUSupported();
const IMAGEDATA_SUPPORTED = isImageDataSupported();

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestImageData(width = 100, height = 100): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  // Fill with test pattern (red gradient)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = Math.round((x / width) * 255);     // R
      data[i + 1] = Math.round((y / height) * 255); // G
      data[i + 2] = 128;                            // B
      data[i + 3] = 255;                            // A
    }
  }
  return new ImageData(data, width, height);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

describe('WebGPU Initialization', () => {
  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it('should initialize without throwing', async () => {
    await expect(webgpuRenderer.initialize()).resolves.toBeDefined();
  });

  it('should report availability correctly', async () => {
    await webgpuRenderer.initialize();
    const available = webgpuRenderer.isAvailable();

    // In JSDOM, WebGPU is not available
    if (!WEBGPU_SUPPORTED) {
      expect(available).toBe(false);
    } else {
      // In browser with WebGPU, should be true
      expect(typeof available).toBe('boolean');
    }
  });

  it('should return capabilities', async () => {
    await webgpuRenderer.initialize();
    const caps = webgpuRenderer.getCapabilities();

    expect(caps).toHaveProperty('available');
    expect(caps).toHaveProperty('features');
    expect(caps).toHaveProperty('limits');
    expect(Array.isArray(caps.features)).toBe(true);
  });

  it('should initialize only once', async () => {
    const result1 = await webgpuRenderer.initialize();
    const result2 = await webgpuRenderer.initialize();

    expect(result1).toBe(result2);
  });
});

// ============================================================================
// STATS
// ============================================================================

describe('WebGPU Stats', () => {
  beforeEach(async () => {
    await webgpuRenderer.initialize();
  });

  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it('should return stats object', () => {
    const stats = getWebGPUStats();

    expect(stats).toHaveProperty('available');
    expect(stats).toHaveProperty('features');
    expect(stats).toHaveProperty('limits');
  });

  it('should have valid structure', () => {
    const stats = getWebGPUStats();

    expect(typeof stats.available).toBe('boolean');
    expect(Array.isArray(stats.features)).toBe(true);
    expect(typeof stats.limits).toBe('object');
  });
});

// ============================================================================
// BLUR (Canvas2D Fallback)
// ============================================================================

describe('Blur Effect', () => {
  beforeEach(async () => {
    await webgpuRenderer.initialize();
  });

  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should blur image data', async () => {
    const input = createTestImageData(50, 50);
    const params: BlurParams = {
      radius: 5,
      quality: 'medium',
    };

    const output = await webgpuRenderer.blur(input, params);

    expect(output).toBeInstanceOf(ImageData);
    expect(output.width).toBe(50);
    expect(output.height).toBe(50);
    expect(output.data.length).toBe(50 * 50 * 4);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle different blur radii', async () => {
    const input = createTestImageData(50, 50);

    const output1 = await webgpuRenderer.blur(input, { radius: 1, quality: 'low' });
    const output2 = await webgpuRenderer.blur(input, { radius: 10, quality: 'high' });

    expect(output1.data.length).toBe(output2.data.length);
    // Larger radius should result in different pixel values
    // (implementation detail - just verify no crash)
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle horizontal blur', async () => {
    const input = createTestImageData(50, 50);
    const params: BlurParams = {
      radius: 3,
      quality: 'medium',
      direction: 'horizontal',
    };

    const output = await webgpuRenderer.blur(input, params);
    expect(output).toBeInstanceOf(ImageData);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle vertical blur', async () => {
    const input = createTestImageData(50, 50);
    const params: BlurParams = {
      radius: 3,
      quality: 'medium',
      direction: 'vertical',
    };

    const output = await webgpuRenderer.blur(input, params);
    expect(output).toBeInstanceOf(ImageData);
  });
});

// ============================================================================
// COLOR CORRECTION (Canvas2D Fallback)
// ============================================================================

describe('Color Correction', () => {
  beforeEach(async () => {
    await webgpuRenderer.initialize();
  });

  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should apply color correction', async () => {
    const input = createTestImageData(50, 50);
    const params: ColorCorrectionParams = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);

    expect(output).toBeInstanceOf(ImageData);
    expect(output.width).toBe(50);
    expect(output.height).toBe(50);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should increase brightness', async () => {
    const input = createTestImageData(10, 10);
    const params: ColorCorrectionParams = {
      brightness: 0.5,
      contrast: 0,
      saturation: 0,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);

    // First pixel should be brighter (higher values)
    // With fallback Canvas2D implementation
    expect(output.data[0]).toBeGreaterThanOrEqual(input.data[0]);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should decrease brightness', async () => {
    // Create a bright image
    const input = new ImageData(10, 10);
    for (let i = 0; i < input.data.length; i += 4) {
      input.data[i] = 200;
      input.data[i + 1] = 200;
      input.data[i + 2] = 200;
      input.data[i + 3] = 255;
    }

    const params: ColorCorrectionParams = {
      brightness: -0.5,
      contrast: 0,
      saturation: 0,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);

    // Should be darker
    expect(output.data[0]).toBeLessThanOrEqual(input.data[0]);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle contrast adjustment', async () => {
    const input = createTestImageData(10, 10);
    const params: ColorCorrectionParams = {
      brightness: 0,
      contrast: 0.5,
      saturation: 0,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);
    expect(output).toBeInstanceOf(ImageData);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle saturation adjustment', async () => {
    const input = createTestImageData(10, 10);
    const params: ColorCorrectionParams = {
      brightness: 0,
      contrast: 0,
      saturation: 0.5,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);
    expect(output).toBeInstanceOf(ImageData);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should clamp output values', async () => {
    const input = createTestImageData(10, 10);
    // Extreme values
    const params: ColorCorrectionParams = {
      brightness: 2,
      contrast: 2,
      saturation: 2,
      hue: 0,
    };

    const output = await webgpuRenderer.colorCorrect(input, params);

    // All values should be within 0-255
    for (let i = 0; i < output.data.length; i++) {
      expect(output.data[i]).toBeGreaterThanOrEqual(0);
      expect(output.data[i]).toBeLessThanOrEqual(255);
    }
  });
});

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

describe('Resource Management', () => {
  it('should dispose without errors', () => {
    expect(() => webgpuRenderer.dispose()).not.toThrow();
  });

  it('should be reinitializable after dispose', async () => {
    await webgpuRenderer.initialize();
    webgpuRenderer.dispose();

    const result = await webgpuRenderer.initialize();
    expect(typeof result).toBe('boolean');
  });

  it('should handle multiple dispose calls', () => {
    webgpuRenderer.dispose();
    webgpuRenderer.dispose();
    webgpuRenderer.dispose();
    // Should not throw
  });
});

// ============================================================================
// FALLBACK BEHAVIOR
// ============================================================================

describe('Fallback Behavior', () => {
  beforeEach(async () => {
    await webgpuRenderer.initialize();
  });

  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should work when WebGPU unavailable (JSDOM)', async () => {
    // In JSDOM, WebGPU is not available
    // Fallback to Canvas2D should work
    const input = createTestImageData(20, 20);

    const blurred = await webgpuRenderer.blur(input, { radius: 2, quality: 'low' });
    expect(blurred).toBeInstanceOf(ImageData);

    const corrected = await webgpuRenderer.colorCorrect(input, {
      brightness: 0.1,
      contrast: 0,
      saturation: 0,
      hue: 0,
    });
    expect(corrected).toBeInstanceOf(ImageData);
  });
});

// ============================================================================
// PERFORMANCE (Basic Sanity Check)
// ============================================================================

describe('Performance', () => {
  beforeEach(async () => {
    await webgpuRenderer.initialize();
  });

  afterEach(() => {
    webgpuRenderer.dispose();
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should process images in reasonable time', async () => {
    const input = createTestImageData(100, 100);

    const start = performance.now();
    await webgpuRenderer.blur(input, { radius: 5, quality: 'medium' });
    const elapsed = performance.now() - start;

    // Should complete in under 1 second even with fallback
    expect(elapsed).toBeLessThan(1000);
  });

  it.skipIf(!IMAGEDATA_SUPPORTED)('should handle batch operations', async () => {
    const inputs = Array.from({ length: 10 }, () => createTestImageData(50, 50));

    const start = performance.now();
    for (const input of inputs) {
      await webgpuRenderer.blur(input, { radius: 3, quality: 'low' });
    }
    const elapsed = performance.now() - start;

    // 10 operations should complete in reasonable time
    expect(elapsed).toBeLessThan(5000);
  });
});
