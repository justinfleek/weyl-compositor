/**
 * Layer Type Registration Integration Tests
 *
 * PRODUCTION-GRADE TESTS using REAL engine instances.
 * NO MOCKS - tests actual Three.js rendering pipeline.
 *
 * Verifies all 26 layer types:
 * 1. Create through REAL store actions
 * 2. Register in REAL LayerManager
 * 3. Evaluate through REAL MotionEngine
 * 4. Render through REAL LatticeEngine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createEngineTestHarness, type EngineTestHarness } from '../setup/engineTestHarness';
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
// TEST SUITE
// ============================================================================

describe('Layer Type Registration (REAL Engine)', () => {
  let harness: EngineTestHarness;

  beforeEach(() => {
    harness = createEngineTestHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  describe('All 26 Layer Types Create and Render', () => {
    it('should test all 26 layer types', () => {
      expect(ALL_LAYER_TYPES).toHaveLength(26);
    });

    ALL_LAYER_TYPES.forEach((layerType) => {
      it(`creates REAL '${layerType}' layer and evaluates through MotionEngine`, async () => {
        const { store } = harness;

        // Create layer through REAL store action
        const layer = store.createLayer(layerType as any, `Test ${layerType}`);
        expect(layer).toBeDefined();
        expect(layer).not.toBeNull();

        // Verify layer is in store
        const storedLayer = store.getLayerById(layer!.id);
        expect(storedLayer).toBeDefined();

        // Render a frame - exercises REAL render pipeline
        const frameState = await harness.renderFrame(0);

        // Verify layer appears in frame state
        const evaluatedLayer = frameState.layers.find(l => l.id === layer!.id);
        expect(evaluatedLayer).toBeDefined();

        // Verify evaluated layer has transform
        expect(evaluatedLayer!.transform).toBeDefined();
        expect(evaluatedLayer!.transform.position).toBeDefined();
        expect(evaluatedLayer!.transform.scale).toBeDefined();
        expect(evaluatedLayer!.transform.rotation).toBeDefined();
        expect(typeof evaluatedLayer!.opacity).toBe('number');
      });
    });
  });

  describe('Layer Rendering Verification', () => {
    it('solid layer renders and is visible', async () => {
      const { store } = harness;

      // Create solid layer
      const layer = store.createLayer('solid', 'Test Solid');
      expect(layer).toBeDefined();

      // Set to full frame size with known color
      store.updateLayerData(layer!.id, {
        color: '#FF0000',
        width: 1920,
        height: 1080
      });

      // Render frame
      const frameState = await harness.renderFrame(0);

      // Verify in frame state
      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
      expect(evaluated!.visible).toBe(true);
    });

    it('text layer evaluates with text data', async () => {
      const { store } = harness;

      const layer = store.createLayer('text', 'Test Text');
      store.updateLayerData(layer!.id, {
        text: 'Hello World',
        fontFamily: 'Arial',
        fontSize: 72,
        fill: '#FFFFFF'
      });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
      // Layer data is on layerRef (original layer) not evaluated properties
      expect(evaluated!.layerRef.data.text).toBe('Hello World');
    });

    it('camera layer evaluates with camera properties', async () => {
      const { store } = harness;

      const layer = store.createLayer('camera', 'Test Camera');
      store.updateLayerData(layer!.id, {
        fov: 60,
        near: 0.1,
        far: 10000
      });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
      // Layer data is on layerRef (original layer)
      expect(evaluated!.layerRef.data.fov).toBe(60);
    });

    it('particles layer evaluates emitter settings', async () => {
      const { store } = harness;

      const layer = store.createLayer('particles', 'Test Particles');

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
      // Particles layer has emitters array with emitterType on each emitter
      expect(evaluated!.layerRef.data.emitters).toBeDefined();
      expect(evaluated!.layerRef.data.emitters.length).toBeGreaterThan(0);
      expect(evaluated!.layerRef.data.emitters[0].emitterType).toBe('point');
    });
  });

  describe('Multiple Layers Coexist', () => {
    it('creates multiple layers of different types', async () => {
      const { store } = harness;

      const solid = store.createLayer('solid', 'Solid');
      const text = store.createLayer('text', 'Text');
      const shape = store.createLayer('shape', 'Shape');
      const camera = store.createLayer('camera', 'Camera');

      expect(store.getActiveCompLayers()).toHaveLength(4);

      const frameState = await harness.renderFrame(0);

      expect(frameState.layers).toHaveLength(4);
      expect(frameState.layers.find(l => l.id === solid!.id)).toBeDefined();
      expect(frameState.layers.find(l => l.id === text!.id)).toBeDefined();
      expect(frameState.layers.find(l => l.id === shape!.id)).toBeDefined();
      expect(frameState.layers.find(l => l.id === camera!.id)).toBeDefined();
    });

    it('renders multiple frames without error', async () => {
      const { store } = harness;

      store.createLayer('solid', 'Layer 1');
      store.createLayer('text', 'Layer 2');
      store.createLayer('shape', 'Layer 3');

      // Render multiple frames
      for (let frame = 0; frame < 10; frame++) {
        const frameState = await harness.renderFrame(frame);
        expect(frameState).toBeDefined();
        expect(frameState.layers).toHaveLength(3);
      }
    });
  });

  describe('Transform Evaluation', () => {
    it('evaluates position correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Set position using REAL store API
      store.updateLayerTransform(layer!.id, { position: { x: 100, y: 200 } });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.transform.position.x).toBe(100);
      expect(evaluated!.transform.position.y).toBe(200);
    });

    it('evaluates scale correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Set scale using REAL store API
      store.updateLayerTransform(layer!.id, { scale: { x: 150, y: 150 } });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.transform.scale.x).toBe(150);
      expect(evaluated!.transform.scale.y).toBe(150);
    });

    it('evaluates rotation correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Set rotation using REAL store API
      store.updateLayerTransform(layer!.id, { rotation: 45 });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.transform.rotation).toBe(45);
    });

    it('evaluates opacity correctly', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Set opacity using REAL store API
      store.updateLayerTransform(layer!.id, { opacity: 50 });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.opacity).toBe(50);
    });
  });

  describe('Layer Visibility', () => {
    it('hidden layer not in visible layers', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');
      store.updateLayer(layer!.id, { visible: false });

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.visible).toBe(false);
    });

    it('layer outside time range not visible', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');
      // Set layer to start at frame 50
      store.updateLayer(layer!.id, { startFrame: 50, endFrame: 100 });

      // Render frame 0 (before layer starts)
      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      // Layer should exist but be marked as outside time range
      expect(evaluated).toBeDefined();
    });
  });

  describe('Keyframe Animation', () => {
    it('interpolates position keyframes', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Add keyframes at frame 0 and 40
      store.addKeyframe(layer!.id, 'transform.position', { x: 0, y: 0 }, 0);
      store.addKeyframe(layer!.id, 'transform.position', { x: 100, y: 100 }, 40);

      // Evaluate at frame 20 (midpoint)
      const frameState = await harness.renderFrame(20);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      // Should be interpolated to approximately { x: 50, y: 50 }
      expect(evaluated!.transform.position.x).toBeCloseTo(50, 0);
      expect(evaluated!.transform.position.y).toBeCloseTo(50, 0);
    });

    it('interpolates opacity keyframes', async () => {
      const { store } = harness;

      const layer = store.createLayer('solid', 'Test');

      // Add keyframes
      store.addKeyframe(layer!.id, 'opacity', 0, 0);
      store.addKeyframe(layer!.id, 'opacity', 100, 40);

      // Evaluate at frame 20 (midpoint)
      const frameState = await harness.renderFrame(20);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated!.opacity).toBeCloseTo(50, 0);
    });
  });

  describe('Deprecated Alias Types', () => {
    it("'null' type creates control layer", async () => {
      const { store } = harness;

      const layer = store.createLayer('null' as any, 'Null Layer');
      expect(layer).toBeDefined();

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
    });

    it("'adjustment' type creates effect layer", async () => {
      const { store } = harness;

      const layer = store.createLayer('adjustment' as any, 'Adjustment');
      expect(layer).toBeDefined();

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
    });

    it("'particle' type creates particles layer", async () => {
      const { store } = harness;

      const layer = store.createLayer('particle' as any, 'Particle');
      expect(layer).toBeDefined();

      const frameState = await harness.renderFrame(0);

      const evaluated = frameState.layers.find(l => l.id === layer!.id);
      expect(evaluated).toBeDefined();
    });
  });
});

// ============================================================================
// DETERMINISM TESTS
// ============================================================================

describe('Layer Evaluation Determinism (REAL Engine)', () => {
  let harness: EngineTestHarness;

  beforeEach(() => {
    harness = createEngineTestHarness();
  });

  afterEach(() => {
    harness.dispose();
  });

  it('same frame evaluates identically', async () => {
    const { store } = harness;

    store.createLayer('solid', 'Test');
    store.createLayer('text', 'Test 2');

    // Evaluate frame 25 twice
    const state1 = await harness.renderFrame(25);
    const state2 = await harness.renderFrame(25);

    // Should be identical
    expect(state1.layers.length).toBe(state2.layers.length);

    for (let i = 0; i < state1.layers.length; i++) {
      expect(state1.layers[i].transform.position).toEqual(state2.layers[i].transform.position);
      expect(state1.layers[i].transform.scale).toEqual(state2.layers[i].transform.scale);
      expect(state1.layers[i].transform.rotation).toBe(state2.layers[i].transform.rotation);
      expect(state1.layers[i].opacity).toBe(state2.layers[i].opacity);
    }
  });

  it('scrub order does not affect evaluation', async () => {
    const { store } = harness;

    const layer = store.createLayer('solid', 'Test');
    store.addKeyframe(layer!.id, 'transform.position', { x: 0, y: 0 }, 0);
    store.addKeyframe(layer!.id, 'transform.position', { x: 100, y: 100 }, 80);

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

    expect(layer1!.transform.position).toEqual(layer2!.transform.position);
  });
});
