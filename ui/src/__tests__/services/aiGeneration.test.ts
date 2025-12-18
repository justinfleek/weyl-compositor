/**
 * AI Generation Service Tests
 *
 * Tests the AI generation service stubs and model management.
 * Note: Actual inference tests require backend connection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  aiGeneration,
  getAvailableModels,
  type AIModelType,
  type ModelInfo,
} from '@/services/aiGeneration';

// ============================================================================
// MODEL REGISTRY
// ============================================================================

describe('AI Model Registry', () => {
  it('should list all available models', () => {
    const models = getAvailableModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.some(m => m.type === 'depth-anything')).toBe(true);
    expect(models.some(m => m.type === 'normal-crafter')).toBe(true);
    expect(models.some(m => m.type === 'segment-anything')).toBe(true);
  });

  it('should have required properties for each model', () => {
    const models = getAvailableModels();

    for (const model of models) {
      expect(model.type).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.description).toBeDefined();
      expect(model.memoryRequired).toBeGreaterThan(0);
      expect(model.status).toBeDefined();
    }
  });

  it('should get model info by type', () => {
    const depthModel = aiGeneration.getModelInfo('depth-anything');

    expect(depthModel.type).toBe('depth-anything');
    expect(depthModel.name).toBe('Depth Anything');
    expect(depthModel.memoryRequired).toBeGreaterThan(0);
  });

  it('should initialize models as not-loaded', () => {
    const models = getAvailableModels();

    for (const model of models) {
      expect(model.status).toBe('not-loaded');
    }
  });

  it('should return empty array for loaded models initially', () => {
    const loaded = aiGeneration.getLoadedModels();
    expect(loaded).toEqual([]);
  });
});

// ============================================================================
// MODEL CATEGORIES
// ============================================================================

describe('AI Model Categories', () => {
  it('should have depth estimation models', () => {
    const depthModels: AIModelType[] = ['depth-anything', 'depth-anything-v2'];

    for (const type of depthModels) {
      const model = aiGeneration.getModelInfo(type);
      expect(model).toBeDefined();
      expect(model.name.toLowerCase()).toContain('depth');
    }
  });

  it('should have segmentation models', () => {
    const segModels: AIModelType[] = ['segment-anything', 'segment-anything-2', 'mat-seg'];

    for (const type of segModels) {
      const model = aiGeneration.getModelInfo(type);
      expect(model).toBeDefined();
    }
  });

  it('should have generation models', () => {
    const genModels: AIModelType[] = ['stable-diffusion', 'sdxl', 'flux'];

    for (const type of genModels) {
      const model = aiGeneration.getModelInfo(type);
      expect(model).toBeDefined();
    }
  });
});

// ============================================================================
// MODEL AVAILABILITY
// ============================================================================

describe('Model Availability', () => {
  it('should report models as unavailable when not loaded', () => {
    expect(aiGeneration.isModelAvailable('depth-anything')).toBe(false);
    expect(aiGeneration.isModelAvailable('normal-crafter')).toBe(false);
  });
});

// ============================================================================
// API STRUCTURE (Without Backend)
// ============================================================================

describe('API Structure', () => {
  it('should have estimateDepth method', () => {
    expect(typeof aiGeneration.estimateDepth).toBe('function');
  });

  it('should have generateNormalMap method', () => {
    expect(typeof aiGeneration.generateNormalMap).toBe('function');
  });

  it('should have segment method', () => {
    expect(typeof aiGeneration.segment).toBe('function');
  });

  it('should have segmentInteractive method', () => {
    expect(typeof aiGeneration.segmentInteractive).toBe('function');
  });

  it('should have generate method', () => {
    expect(typeof aiGeneration.generate).toBe('function');
  });

  it('should have loadModel method', () => {
    expect(typeof aiGeneration.loadModel).toBe('function');
  });

  it('should have unloadModel method', () => {
    expect(typeof aiGeneration.unloadModel).toBe('function');
  });

  it('should have checkConnection method', () => {
    expect(typeof aiGeneration.checkConnection).toBe('function');
  });

  it('should have getBackendStatus method', () => {
    expect(typeof aiGeneration.getBackendStatus).toBe('function');
  });
});

// ============================================================================
// MOCK BACKEND TESTS
// ============================================================================

describe('Mock Backend Operations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle connection check failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const connected = await aiGeneration.checkConnection();
    expect(connected).toBe(false);
  });

  it('should return disconnected status on backend failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const status = await aiGeneration.getBackendStatus();

    expect(status.connected).toBe(false);
    expect(status.gpuAvailable).toBe(false);
    expect(status.loadedModels).toEqual([]);
  });

  it('should handle model load failure gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'GPU out of memory' }),
    });

    const success = await aiGeneration.loadModel('depth-anything');
    expect(success).toBe(false);

    const info = aiGeneration.getModelInfo('depth-anything');
    expect(info.status).toBe('error');
    expect(info.error).toBeDefined();
  });

  it('should track load time on successful load', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await aiGeneration.loadModel('depth-anything');

    const info = aiGeneration.getModelInfo('depth-anything');
    expect(info.status).toBe('ready');
    expect(info.loadTime).toBeDefined();
    expect(info.loadTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle inference failure gracefully', async () => {
    // First call for load model (success)
    // Second call for inference (fail)
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    const mockImageData = {
      data: new Uint8ClampedArray(100),
      width: 10,
      height: 10,
      colorSpace: 'srgb',
    } as ImageData;

    // Create mock OffscreenCanvas
    const mockCanvas = {
      getContext: () => ({
        putImageData: vi.fn(),
      }),
      convertToBlob: () => Promise.resolve(new Blob(['test'])),
    };
    global.OffscreenCanvas = vi.fn().mockImplementation(() => mockCanvas);

    const result = await aiGeneration.estimateDepth(mockImageData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// MEMORY REQUIREMENTS
// ============================================================================

describe('Memory Requirements', () => {
  it('should have increasing memory for larger models', () => {
    const sd15 = aiGeneration.getModelInfo('stable-diffusion');
    const sdxl = aiGeneration.getModelInfo('sdxl');
    const flux = aiGeneration.getModelInfo('flux');

    expect(sdxl.memoryRequired).toBeGreaterThan(sd15.memoryRequired);
    expect(flux.memoryRequired).toBeGreaterThan(sdxl.memoryRequired);
  });

  it('should have reasonable memory estimates', () => {
    const models = getAvailableModels();

    for (const model of models) {
      // Should be at least 500MB, at most 16GB
      expect(model.memoryRequired).toBeGreaterThan(500);
      expect(model.memoryRequired).toBeLessThan(16000);
    }
  });
});

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

describe('Config Management', () => {
  it('should allow setting base URL', () => {
    // Should not throw
    expect(() => aiGeneration.setBaseUrl('/custom/ai')).not.toThrow();
  });
});
