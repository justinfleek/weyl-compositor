/**
 * Real Engine Test Harness for Browser Tests
 *
 * Creates a REAL test environment with actual WebGL/Three.js rendering.
 * This runs in a real Chromium browser via Playwright.
 *
 * Features:
 * - REAL HTMLCanvasElement with WebGL2 context
 * - REAL LatticeEngine with Three.js rendering
 * - REAL MotionEngine evaluation
 * - REAL compositorStore actions
 */

import { createPinia, setActivePinia } from 'pinia';
import { useCompositorStore } from '@/stores/compositorStore';
import { LatticeEngine } from '@/engine/LatticeEngine';
import { MotionEngine } from '@/engine/MotionEngine';
import type { FrameState } from '@/engine/MotionEngine';

export interface RealEngineHarness {
  store: ReturnType<typeof useCompositorStore>;
  engine: LatticeEngine;
  motionEngine: MotionEngine;
  canvas: HTMLCanvasElement;
  pinia: ReturnType<typeof createPinia>;

  renderFrame(frame: number): Promise<FrameState>;
  getPixels(): Uint8Array;
  getPixelAt(x: number, y: number): { r: number; g: number; b: number; a: number };
  hasWebGLError(): boolean;
  dispose(): void;
}

/**
 * Creates a real engine harness with WebGL support.
 * Must be called in a browser environment (Vitest browser mode).
 */
export function createRealEngineHarness(): RealEngineHarness {
  // Create real Pinia instance
  const pinia = createPinia();
  setActivePinia(pinia);

  // Get real store
  const store = useCompositorStore();

  // Create REAL canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  canvas.style.position = 'absolute';
  canvas.style.left = '-9999px'; // Off-screen but still rendered
  document.body.appendChild(canvas);

  // Initialize REAL LatticeEngine with WebGL
  const engine = new LatticeEngine(canvas, {
    width: 1920,
    height: 1080,
    antialias: false, // Faster for tests
    preserveDrawingBuffer: true // Needed for pixel reading
  });

  // Real motion engine for evaluation
  const motionEngine = new MotionEngine();

  return {
    store,
    engine,
    motionEngine,
    canvas,
    pinia,

    /**
     * Evaluate and render a frame using the REAL engine pipeline
     */
    async renderFrame(frame: number): Promise<FrameState> {
      // Evaluate through REAL MotionEngine
      const frameState = motionEngine.evaluate(
        frame,
        store.project,
        store.audioAnalysis
      );

      // Apply to REAL LatticeEngine
      engine.applyFrameState(frameState);

      // Render through REAL WebGL
      engine.render();

      return frameState;
    },

    /**
     * Get canvas pixels for verification (requires preserveDrawingBuffer: true)
     */
    getPixels(): Uint8Array {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      if (gl) {
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      }
      return pixels;
    },

    /**
     * Get a specific pixel's RGBA values
     */
    getPixelAt(x: number, y: number): { r: number; g: number; b: number; a: number } {
      const pixels = this.getPixels();
      // WebGL reads from bottom-left, flip Y
      const flippedY = canvas.height - 1 - y;
      const index = (flippedY * canvas.width + x) * 4;
      return {
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
        a: pixels[index + 3]
      };
    },

    /**
     * Check if there are any WebGL errors
     */
    hasWebGLError(): boolean {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return true;
      return gl.getError() !== gl.NO_ERROR;
    },

    /**
     * Cleanup all resources
     */
    dispose() {
      engine.dispose();
      canvas.remove();
      store.$reset();
    }
  };
}

export type { FrameState };
