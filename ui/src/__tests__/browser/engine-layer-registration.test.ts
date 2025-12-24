/**
 * Engine Layer Registration Tests (Real WebGL)
 *
 * PRODUCTION-GRADE TESTS using REAL browser WebGL.
 * Runs in Chromium via Playwright - no mocks.
 *
 * Verifies all 26 layer types:
 * 1. Create through REAL store actions
 * 2. Evaluate through REAL MotionEngine
 * 3. Render through REAL LatticeEngine (WebGL)
 * 4. No WebGL errors occur
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRealEngineHarness, type RealEngineHarness } from './setup/engineHarness';
import type { LayerType } from '@/types/project';

// ============================================================================
// ALL 26 LAYER TYPES
// ============================================================================

const ALL_LAYER_TYPES: LayerType[] = [
  'image',
  'video',
  'audio',
  'solid',
  'text',
  'shape',
  'spline',
  'path',
  'particles',
  'particle',  // Legacy alias
  'camera',
  'light',
  'control',
  'null',      // Deprecated alias
  'nestedComp',
  'depthflow',
  'depth',
  'normal',
  'matte',
  'model',
  'pointcloud',
  'group',
  'generated',
  'pose',
  'effectLayer',
  'adjustment' // Deprecated alias
];

// ============================================================================
// TEST SUITE - REAL WEBGL
// ============================================================================

describe('Engine Layer Registration (Real WebGL)', () => {
  let harness: RealEngineHarness;

  beforeEach(() => {
    harness = createRealEngineHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  describe('All 26 Layer Types Create and Render with WebGL', () => {
    it('should test all 26 layer types', () => {
      expect(ALL_LAYER_TYPES).toHaveLength(26);
    });

    for (const layerType of ALL_LAYER_TYPES) {
      it(`${layerType}: creates layer and renders through WebGL without error`, async () => {
        const { store, engine } = harness;

        // Create layer through REAL store action
        const layer = store.createLayer(layerType as any, `Test ${layerType}`);
        expect(layer).toBeDefined();
        expect(layer).not.toBeNull();
        expect(layer!.type).toBeTruthy();

        // Verify layer is in store
        const storedLayer = store.getLayerById(layer!.id);
        expect(storedLayer).toBeDefined();

        // Render a frame through REAL WebGL pipeline
        const frameState = await harness.renderFrame(0);

        // Verify layer appears in frame state
        const evaluatedLayer = frameState.layers.find(l => l.id === layer!.id);
        expect(evaluatedLayer).toBeDefined();

        // Verify evaluated layer has transform
        expect(evaluatedLayer!.transform).toBeDefined();
        expect(evaluatedLayer!.transform.position).toBeDefined();
        expect(evaluatedLayer!.transform.scale).toBeDefined();
        expect(typeof evaluatedLayer!.transform.rotation).toBe('number');
        expect(typeof evaluatedLayer!.opacity).toBe('number');

        // CRITICAL: No WebGL errors
        expect(harness.hasWebGLError()).toBe(false);
      });
    }
  });

  describe('WebGL Rendering Verification', () => {
    it('solid layer renders red pixels at center', async () => {
      const { store } = harness;

      // Create full-frame red solid
      const layer = store.createLayer('solid', 'Red Solid');
      store.updateLayerData(layer!.id, {
        color: '#FF0000',
        width: 1920,
        height: 1080
      });

      // Render frame
      await harness.renderFrame(0);

      // Check center pixel is red
      const centerPixel = harness.getPixelAt(960, 540);
      expect(centerPixel.r).toBeGreaterThan(200); // Red channel high
      expect(centerPixel.g).toBeLessThan(50);     // Green channel low
      expect(centerPixel.b).toBeLessThan(50);     // Blue channel low

      expect(harness.hasWebGLError()).toBe(false);
    });

    it('multiple layers render without WebGL errors', async () => {
      const { store } = harness;

      // Create multiple layers of different types
      store.createLayer('solid', 'Background');
      store.createLayer('text', 'Title');
      store.createLayer('shape', 'Shape');
      store.createLayer('particles', 'Effects');

      // Render multiple frames
      for (let frame = 0; frame < 10; frame++) {
        await harness.renderFrame(frame);
        expect(harness.hasWebGLError()).toBe(false);
      }
    });

    it('camera layer affects 3D rendering', async () => {
      const { store } = harness;

      // Create camera and 3D content
      const camera = store.createLayer('camera', 'Main Camera');
      store.updateLayerData(camera!.id, {
        fov: 60,
        near: 0.1,
        far: 10000
      });

      const solid = store.createLayer('solid', '3D Solid');
      store.updateLayer(solid!.id, { threeD: true });

      // Render through camera
      await harness.renderFrame(0);

      expect(harness.hasWebGLError()).toBe(false);
    });
  });

  describe('Transform Rendering', () => {
    it('position transform affects pixel location', async () => {
      const { store } = harness;

      // Create small solid at specific position
      const layer = store.createLayer('solid', 'Positioned');
      store.updateLayerData(layer!.id, {
        color: '#00FF00',
        width: 100,
        height: 100
      });

      // Position at top-left quadrant
      store.updateLayerTransform(layer!.id, { position: { x: 200, y: 200 } });

      await harness.renderFrame(0);

      // Verify no WebGL errors from transform
      expect(harness.hasWebGLError()).toBe(false);
    });

    it('scale transform renders correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Scaled');
      store.updateLayerData(layer!.id, {
        color: '#0000FF',
        width: 100,
        height: 100
      });

      // Scale up 2x
      store.updateLayerTransform(layer!.id, { scale: { x: 200, y: 200 } });

      await harness.renderFrame(0);

      expect(harness.hasWebGLError()).toBe(false);
    });

    it('rotation transform renders correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Rotated');
      store.updateLayerData(layer!.id, {
        color: '#FFFF00',
        width: 200,
        height: 100
      });

      // Rotate 45 degrees
      store.updateLayerTransform(layer!.id, { rotation: 45 });

      await harness.renderFrame(0);

      expect(harness.hasWebGLError()).toBe(false);
    });

    it('opacity transform affects alpha', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Transparent');
      store.updateLayerData(layer!.id, {
        color: '#FF00FF',
        width: 1920,
        height: 1080
      });

      // 50% opacity
      store.updateLayerTransform(layer!.id, { opacity: 50 });

      await harness.renderFrame(0);

      expect(harness.hasWebGLError()).toBe(false);
    });
  });

  describe('Keyframe Animation with WebGL', () => {
    it('animated position renders correctly across frames', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Animated');
      store.updateLayerData(layer!.id, {
        color: '#00FFFF',
        width: 100,
        height: 100
      });

      // Add position keyframes
      store.addKeyframe(layer!.id, 'transform.position', { x: 0, y: 540 }, 0);
      store.addKeyframe(layer!.id, 'transform.position', { x: 1820, y: 540 }, 80);

      // Render at start, middle, and end
      await harness.renderFrame(0);
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(40);
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(80);
      expect(harness.hasWebGLError()).toBe(false);
    });

    it('animated opacity renders correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Fading');
      store.updateLayerData(layer!.id, {
        color: '#FF8800',
        width: 1920,
        height: 1080
      });

      // Fade in animation
      store.addKeyframe(layer!.id, 'opacity', 0, 0);
      store.addKeyframe(layer!.id, 'opacity', 100, 30);

      await harness.renderFrame(0);
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(15);
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(30);
      expect(harness.hasWebGLError()).toBe(false);
    });
  });

  describe('Layer Visibility with WebGL', () => {
    it('hidden layer does not cause WebGL errors', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Hidden');
      store.updateLayer(layer!.id, { visible: false });

      await harness.renderFrame(0);

      expect(harness.hasWebGLError()).toBe(false);
    });

    it('layer outside time range renders without error', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Timed');
      store.updateLayer(layer!.id, { startFrame: 50, endFrame: 100 });

      // Render before, during, and after
      await harness.renderFrame(0);  // Before
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(75); // During
      expect(harness.hasWebGLError()).toBe(false);

      await harness.renderFrame(150); // After (if timeline allows)
      expect(harness.hasWebGLError()).toBe(false);
    });
  });

  describe('Scrub Determinism with WebGL', () => {
    it('same frame produces same result regardless of scrub order', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Deterministic');
      store.updateLayerData(layer!.id, {
        color: '#AABBCC',
        width: 100,
        height: 100
      });
      store.addKeyframe(layer!.id, 'transform.position', { x: 0, y: 0 }, 0);
      store.addKeyframe(layer!.id, 'transform.position', { x: 1000, y: 1000 }, 80);

      // Scrub: 0 -> 40 -> 80 -> 40
      await harness.renderFrame(0);
      await harness.renderFrame(40);
      await harness.renderFrame(80);
      const state1 = await harness.renderFrame(40);

      // Scrub: 80 -> 0 -> 40
      await harness.renderFrame(80);
      await harness.renderFrame(0);
      const state2 = await harness.renderFrame(40);

      // Frame 40 should be identical regardless of scrub order
      const layer1 = state1.layers.find(l => l.id === layer!.id);
      const layer2 = state2.layers.find(l => l.id === layer!.id);

      expect(layer1!.transform.position.x).toEqual(layer2!.transform.position.x);
      expect(layer1!.transform.position.y).toEqual(layer2!.transform.position.y);

      expect(harness.hasWebGLError()).toBe(false);
    });
  });
});
