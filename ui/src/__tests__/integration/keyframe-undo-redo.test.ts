/**
 * Keyframe Undo/Redo Integration Tests
 *
 * Verifies the pushHistory fix for keyframe actions works correctly.
 * Uses REAL compositorStore - no mocks.
 *
 * These are focused smoke tests. Comprehensive undo/redo testing
 * will be done in tutorial-01 tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCompositorStore } from '@/stores/compositorStore';

describe('Keyframe Undo/Redo (REAL Store)', () => {
  let store: ReturnType<typeof useCompositorStore>;

  beforeEach(() => {
    // Create fresh Pinia and store for each test
    const pinia = createPinia();
    setActivePinia(pinia);
    store = useCompositorStore();
  });

  describe('Add Keyframe', () => {
    it('add keyframe → undo → keyframe gone → redo → keyframe back', () => {
      // Setup: Create a layer
      const layer = store.createLayer('solid', 'Test Layer');
      expect(layer).toBeDefined();

      // Get initial keyframe count
      const initialKeyframes = layer!.transform.position.keyframes.length;
      expect(initialKeyframes).toBe(0);

      // Action: Add keyframe at frame 10
      store.setFrame(10);
      const keyframe = store.addKeyframe(layer!.id, 'position', { x: 100, y: 200 });
      expect(keyframe).toBeDefined();

      // Verify keyframe was added
      const layerAfterAdd = store.getLayerById(layer!.id);
      expect(layerAfterAdd!.transform.position.keyframes.length).toBe(1);
      expect(layerAfterAdd!.transform.position.keyframes[0].value).toEqual({ x: 100, y: 200 });

      // Undo: Keyframe should be gone
      expect(store.canUndo).toBe(true);
      store.undo();

      const layerAfterUndo = store.getLayerById(layer!.id);
      expect(layerAfterUndo!.transform.position.keyframes.length).toBe(0);

      // Redo: Keyframe should be back
      expect(store.canRedo).toBe(true);
      store.redo();

      const layerAfterRedo = store.getLayerById(layer!.id);
      expect(layerAfterRedo!.transform.position.keyframes.length).toBe(1);
      expect(layerAfterRedo!.transform.position.keyframes[0].value).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Move Keyframe', () => {
    it('move keyframe → undo → keyframe at original position', () => {
      // Setup: Create layer with keyframe
      const layer = store.createLayer('solid', 'Test Layer');
      store.setFrame(10);
      const keyframe = store.addKeyframe(layer!.id, 'position', { x: 100, y: 100 });
      expect(keyframe).toBeDefined();

      // Verify initial state
      let currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].frame).toBe(10);

      // Action: Move keyframe to frame 30
      store.moveKeyframe(layer!.id, 'position', keyframe!.id, 30);

      // Verify move worked
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].frame).toBe(30);

      // Undo: Keyframe should be back at frame 10
      store.undo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].frame).toBe(10);

      // Redo: Keyframe should be at frame 30 again
      store.redo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].frame).toBe(30);
    });
  });

  describe('Delete Keyframe', () => {
    it('delete keyframe → undo → keyframe restored', () => {
      // Setup: Create layer with keyframe
      const layer = store.createLayer('solid', 'Test Layer');
      store.setFrame(20);
      const keyframe = store.addKeyframe(layer!.id, 'position', { x: 50, y: 75 });
      expect(keyframe).toBeDefined();

      // Verify initial state
      let currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes.length).toBe(1);
      expect(currentLayer!.transform.position.animated).toBe(true);

      // Action: Delete the keyframe
      store.removeKeyframe(layer!.id, 'position', keyframe!.id);

      // Verify deletion
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes.length).toBe(0);
      expect(currentLayer!.transform.position.animated).toBe(false);

      // Undo: Keyframe should be restored
      store.undo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes.length).toBe(1);
      expect(currentLayer!.transform.position.keyframes[0].value).toEqual({ x: 50, y: 75 });
      expect(currentLayer!.transform.position.animated).toBe(true);

      // Redo: Keyframe should be deleted again
      store.redo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes.length).toBe(0);
    });
  });

  describe('Set Keyframe Value', () => {
    it('change value → undo → original value restored', () => {
      // Setup: Create layer with keyframe
      const layer = store.createLayer('solid', 'Test Layer');
      store.setFrame(15);
      const keyframe = store.addKeyframe(layer!.id, 'position', { x: 0, y: 0 });
      expect(keyframe).toBeDefined();

      // Action: Change keyframe value
      store.setKeyframeValue(layer!.id, 'position', keyframe!.id, { x: 999, y: 888 });

      // Verify change
      let currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].value).toEqual({ x: 999, y: 888 });

      // Undo: Should have original value
      store.undo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].value).toEqual({ x: 0, y: 0 });

      // Redo: Should have new value
      store.redo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].value).toEqual({ x: 999, y: 888 });
    });
  });

  describe('Set Keyframe Interpolation', () => {
    it('change interpolation → undo → original interpolation restored', () => {
      // Setup: Create layer with keyframe (default is 'linear')
      const layer = store.createLayer('solid', 'Test Layer');
      store.setFrame(5);
      const keyframe = store.addKeyframe(layer!.id, 'position', { x: 100, y: 100 });
      expect(keyframe).toBeDefined();
      expect(keyframe!.interpolation).toBe('linear');

      // Action: Change to 'hold'
      store.setKeyframeInterpolation(layer!.id, 'position', keyframe!.id, 'hold');

      // Verify change
      let currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].interpolation).toBe('hold');

      // Undo: Should be back to 'linear'
      store.undo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].interpolation).toBe('linear');

      // Redo: Should be 'hold' again
      store.redo();
      currentLayer = store.getLayerById(layer!.id);
      expect(currentLayer!.transform.position.keyframes[0].interpolation).toBe('hold');
    });
  });
});
