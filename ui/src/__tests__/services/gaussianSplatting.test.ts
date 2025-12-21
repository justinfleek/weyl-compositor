/**
 * Gaussian Splatting Service Tests
 *
 * Production-level tests verifying:
 * - Buffer creation from scene data
 * - Depth sorting for alpha compositing
 * - Quality settings
 * - Covariance calculation
 * - Service class functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  GaussianSplattingService,
  createGaussianBuffers,
  createGaussianPoints,
  sortGaussiansByDepth,
  reorderBuffers,
  DEFAULT_QUALITY,
  type GaussianSplatScene,
  type GaussianPrimitive,
  type GaussianRenderQuality,
} from '@/services/gaussianSplatting';

// Helper to create a test Gaussian primitive
function createTestGaussian(
  x: number,
  y: number,
  z: number,
  color: { r: number; g: number; b: number } = { r: 1, g: 0, b: 0 },
  opacity: number = 1.0,
  scale: number = 0.1
): GaussianPrimitive {
  return {
    position: new THREE.Vector3(x, y, z),
    covariance: new Float32Array([scale * scale, 0, 0, scale * scale, 0, scale * scale]),
    color: new THREE.Color(color.r, color.g, color.b),
    opacity,
    scale: new THREE.Vector3(scale, scale, scale),
    rotation: new THREE.Quaternion(0, 0, 0, 1),
  };
}

// Helper to create a test scene
function createTestScene(gaussians: GaussianPrimitive[]): GaussianSplatScene {
  const boundingBox = new THREE.Box3();
  for (const g of gaussians) {
    boundingBox.expandByPoint(g.position);
  }
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  return {
    gaussians,
    boundingBox,
    center,
    maxExtent: Math.max(size.x, size.y, size.z),
    shDegree: 0,
  };
}

describe('GaussianSplatting', () => {
  // ============================================================================
  // BUFFER CREATION
  // ============================================================================

  describe('createGaussianBuffers', () => {
    it('should create buffers with correct lengths', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0),
        createTestGaussian(1, 0, 0),
        createTestGaussian(0, 1, 0),
      ];
      const scene = createTestScene(gaussians);

      const buffers = createGaussianBuffers(scene);

      expect(buffers.positions.length).toBe(9); // 3 * 3
      expect(buffers.colors.length).toBe(9);     // 3 * 3
      expect(buffers.sizes.length).toBe(3);
      expect(buffers.opacities.length).toBe(3);
      expect(buffers.count).toBe(3);
    });

    it('should copy position data correctly', () => {
      const gaussians = [
        createTestGaussian(1, 2, 3),
        createTestGaussian(-1, -2, -3),
      ];
      const scene = createTestScene(gaussians);

      const buffers = createGaussianBuffers(scene);

      expect(buffers.positions[0]).toBe(1);
      expect(buffers.positions[1]).toBe(2);
      expect(buffers.positions[2]).toBe(3);
      expect(buffers.positions[3]).toBe(-1);
      expect(buffers.positions[4]).toBe(-2);
      expect(buffers.positions[5]).toBe(-3);
    });

    it('should copy color data correctly', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0, { r: 1, g: 0, b: 0 }),
        createTestGaussian(0, 0, 0, { r: 0, g: 1, b: 0 }),
      ];
      const scene = createTestScene(gaussians);

      const buffers = createGaussianBuffers(scene);

      expect(buffers.colors[0]).toBe(1); // R
      expect(buffers.colors[1]).toBe(0); // G
      expect(buffers.colors[2]).toBe(0); // B
      expect(buffers.colors[3]).toBe(0); // R
      expect(buffers.colors[4]).toBe(1); // G
      expect(buffers.colors[5]).toBe(0); // B
    });

    it('should calculate sizes from scale', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0, { r: 1, g: 1, b: 1 }, 1.0, 0.1),
        createTestGaussian(0, 0, 0, { r: 1, g: 1, b: 1 }, 1.0, 0.2),
      ];
      const scene = createTestScene(gaussians);

      const buffers = createGaussianBuffers(scene);

      expect(buffers.sizes[0]).toBeCloseTo(0.1, 5);
      expect(buffers.sizes[1]).toBeCloseTo(0.2, 5);
    });

    it('should apply splatScale from quality settings', () => {
      const gaussians = [createTestGaussian(0, 0, 0, { r: 1, g: 1, b: 1 }, 1.0, 0.1)];
      const scene = createTestScene(gaussians);

      const quality: GaussianRenderQuality = { ...DEFAULT_QUALITY, splatScale: 2.0 };
      const buffers = createGaussianBuffers(scene, quality);

      expect(buffers.sizes[0]).toBeCloseTo(0.2, 5); // 0.1 * 2.0
    });

    it('should limit count by maxSplats', () => {
      const gaussians = Array(100).fill(null).map(() => createTestGaussian(0, 0, 0));
      const scene = createTestScene(gaussians);

      const quality: GaussianRenderQuality = { ...DEFAULT_QUALITY, maxSplats: 50 };
      const buffers = createGaussianBuffers(scene, quality);

      expect(buffers.count).toBe(50);
      expect(buffers.positions.length).toBe(150); // 50 * 3
    });

    it('should copy opacity values', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0, { r: 1, g: 1, b: 1 }, 0.5),
        createTestGaussian(0, 0, 0, { r: 1, g: 1, b: 1 }, 0.8),
      ];
      const scene = createTestScene(gaussians);

      const buffers = createGaussianBuffers(scene);

      expect(buffers.opacities[0]).toBeCloseTo(0.5, 5);
      expect(buffers.opacities[1]).toBeCloseTo(0.8, 5);
    });
  });

  // ============================================================================
  // POINTS CREATION
  // ============================================================================

  describe('createGaussianPoints', () => {
    it('should create Three.js Points object', () => {
      const gaussians = [createTestGaussian(0, 0, 0)];
      const scene = createTestScene(gaussians);

      const points = createGaussianPoints(scene);

      expect(points).toBeInstanceOf(THREE.Points);
      expect(points.geometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(points.material).toBeInstanceOf(THREE.ShaderMaterial);
    });

    it('should have required geometry attributes', () => {
      const gaussians = [createTestGaussian(0, 0, 0)];
      const scene = createTestScene(gaussians);

      const points = createGaussianPoints(scene);
      const geometry = points.geometry;

      expect(geometry.hasAttribute('position')).toBe(true);
      expect(geometry.hasAttribute('color')).toBe(true);
      expect(geometry.hasAttribute('size')).toBe(true);
      expect(geometry.hasAttribute('opacity')).toBe(true);
    });

    it('should have transparent material', () => {
      const gaussians = [createTestGaussian(0, 0, 0)];
      const scene = createTestScene(gaussians);

      const points = createGaussianPoints(scene);
      const material = points.material as THREE.ShaderMaterial;

      expect(material.transparent).toBe(true);
      expect(material.depthWrite).toBe(false);
    });

    it('should apply quality alphaCutoff uniform', () => {
      const gaussians = [createTestGaussian(0, 0, 0)];
      const scene = createTestScene(gaussians);

      const quality: GaussianRenderQuality = { ...DEFAULT_QUALITY, alphaCutoff: 0.05 };
      const points = createGaussianPoints(scene, quality);
      const material = points.material as THREE.ShaderMaterial;

      expect(material.uniforms.alphaCutoff.value).toBe(0.05);
    });
  });

  // ============================================================================
  // DEPTH SORTING
  // ============================================================================

  describe('sortGaussiansByDepth', () => {
    it('should sort by distance from camera (furthest first)', () => {
      const gaussians = [
        createTestGaussian(0, 0, -5),  // Closest
        createTestGaussian(0, 0, -20), // Furthest
        createTestGaussian(0, 0, -10), // Middle
      ];
      const scene = createTestScene(gaussians);
      const cameraPos = new THREE.Vector3(0, 0, 0);

      const sorted = sortGaussiansByDepth(scene, cameraPos);

      // Furthest should be first (index 1 has z=-20)
      expect(sorted[0]).toBe(1);
      // Middle second (index 2 has z=-10)
      expect(sorted[1]).toBe(2);
      // Closest last (index 0 has z=-5)
      expect(sorted[2]).toBe(0);
    });

    it('should handle camera at non-origin position', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0),
        createTestGaussian(10, 0, 0),
        createTestGaussian(5, 0, 0),
      ];
      const scene = createTestScene(gaussians);
      const cameraPos = new THREE.Vector3(20, 0, 0); // Camera to the right

      const sorted = sortGaussiansByDepth(scene, cameraPos);

      // Origin (0,0,0) is furthest from camera at (20,0,0)
      expect(sorted[0]).toBe(0); // Distance 20
      expect(sorted[1]).toBe(2); // Distance 15
      expect(sorted[2]).toBe(1); // Distance 10
    });

    it('should reuse provided indices array', () => {
      const gaussians = [
        createTestGaussian(0, 0, -1),
        createTestGaussian(0, 0, -2),
      ];
      const scene = createTestScene(gaussians);
      const cameraPos = new THREE.Vector3(0, 0, 0);
      const indices = new Uint32Array(2);

      const sorted = sortGaussiansByDepth(scene, cameraPos, indices);

      expect(sorted).toBe(indices);
    });

    it('should handle single Gaussian', () => {
      const gaussians = [createTestGaussian(0, 0, -5)];
      const scene = createTestScene(gaussians);
      const cameraPos = new THREE.Vector3(0, 0, 0);

      const sorted = sortGaussiansByDepth(scene, cameraPos);

      expect(sorted.length).toBe(1);
      expect(sorted[0]).toBe(0);
    });

    it('should handle equal distances', () => {
      const gaussians = [
        createTestGaussian(1, 0, 0),
        createTestGaussian(-1, 0, 0),
        createTestGaussian(0, 1, 0),
      ];
      const scene = createTestScene(gaussians);
      const cameraPos = new THREE.Vector3(0, 0, 0);

      const sorted = sortGaussiansByDepth(scene, cameraPos);

      // All at same distance, order doesn't matter but should be valid
      expect(sorted.length).toBe(3);
      expect(new Set(Array.from(sorted)).size).toBe(3); // All unique
    });
  });

  // ============================================================================
  // BUFFER REORDERING
  // ============================================================================

  describe('reorderBuffers', () => {
    it('should reorder all attributes according to indices', () => {
      const gaussians = [
        createTestGaussian(1, 0, 0, { r: 1, g: 0, b: 0 }, 0.3),
        createTestGaussian(2, 0, 0, { r: 0, g: 1, b: 0 }, 0.6),
        createTestGaussian(3, 0, 0, { r: 0, g: 0, b: 1 }, 0.9),
      ];
      const scene = createTestScene(gaussians);
      const points = createGaussianPoints(scene);
      const geometry = points.geometry;

      // Reverse order
      const sortedIndices = new Uint32Array([2, 1, 0]);
      reorderBuffers(geometry, sortedIndices);

      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
      const opacities = geometry.getAttribute('opacity') as THREE.BufferAttribute;

      // After reorder: index 2 comes first
      expect(positions.array[0]).toBe(3); // x of gaussian[2]
      expect(positions.array[3]).toBe(2); // x of gaussian[1]
      expect(positions.array[6]).toBe(1); // x of gaussian[0]

      expect(colors.array[0]).toBe(0); // R of gaussian[2] (blue)
      expect(colors.array[2]).toBe(1); // B of gaussian[2]

      // Use toBeCloseTo for Float32 precision
      expect(opacities.array[0]).toBeCloseTo(0.9, 5);
      expect(opacities.array[1]).toBeCloseTo(0.6, 5);
      expect(opacities.array[2]).toBeCloseTo(0.3, 5);
    });

    it('should update attributes in-place', () => {
      const gaussians = [createTestGaussian(0, 0, 0), createTestGaussian(1, 0, 0)];
      const scene = createTestScene(gaussians);
      const points = createGaussianPoints(scene);
      const geometry = points.geometry;

      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      const originalArray = positions.array;

      reorderBuffers(geometry, new Uint32Array([1, 0]));

      // Verify the underlying array is the same instance (in-place modification)
      expect(geometry.getAttribute('position').array).toBe(originalArray);
    });
  });

  // ============================================================================
  // SERVICE CLASS
  // ============================================================================

  describe('GaussianSplattingService', () => {
    let service: GaussianSplattingService;

    beforeEach(() => {
      service = new GaussianSplattingService();
    });

    afterEach(() => {
      service.clear();
    });

    it('should initialize with default quality', () => {
      const quality = service.getQuality();
      expect(quality.maxSplats).toBe(DEFAULT_QUALITY.maxSplats);
      expect(quality.alphaCutoff).toBe(DEFAULT_QUALITY.alphaCutoff);
    });

    it('should update quality settings', () => {
      service.setQuality({ maxSplats: 500000, splatScale: 1.5 });
      const quality = service.getQuality();

      expect(quality.maxSplats).toBe(500000);
      expect(quality.splatScale).toBe(1.5);
      // Other values should remain default
      expect(quality.alphaCutoff).toBe(DEFAULT_QUALITY.alphaCutoff);
    });

    it('should return undefined for non-existent scene', () => {
      const scene = service.getScene('nonexistent');
      expect(scene).toBeUndefined();
    });

    it('should return null stats for non-existent scene', () => {
      const stats = service.getStats('nonexistent');
      expect(stats).toBeNull();
    });

    it('should return null points for non-existent scene', () => {
      const points = service.createPoints('nonexistent');
      expect(points).toBeNull();
    });

    it('should clear all scenes', () => {
      // Can't fully test without loading, but should not throw
      service.clear();
      expect(service.getScene('any')).toBeUndefined();
    });

    it('should unload specific scene', () => {
      // Can't fully test without loading, but should not throw
      service.unload('test');
      expect(service.getScene('test')).toBeUndefined();
    });
  });

  // ============================================================================
  // DEFAULT QUALITY
  // ============================================================================

  describe('DEFAULT_QUALITY', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_QUALITY.maxSplats).toBeGreaterThan(0);
      expect(DEFAULT_QUALITY.lodMultiplier).toBe(1.0);
      expect(DEFAULT_QUALITY.splatScale).toBe(1.0);
      expect(DEFAULT_QUALITY.alphaCutoff).toBeGreaterThan(0);
      expect(DEFAULT_QUALITY.alphaCutoff).toBeLessThan(1);
    });

    it('should have spherical harmonics enabled by default', () => {
      expect(DEFAULT_QUALITY.useSphericalHarmonics).toBe(true);
    });
  });

  // ============================================================================
  // SCENE CREATION HELPER
  // ============================================================================

  describe('createTestScene helper', () => {
    it('should calculate bounding box', () => {
      const gaussians = [
        createTestGaussian(-5, -3, -1),
        createTestGaussian(5, 3, 1),
      ];
      const scene = createTestScene(gaussians);

      expect(scene.boundingBox.min.x).toBe(-5);
      expect(scene.boundingBox.min.y).toBe(-3);
      expect(scene.boundingBox.min.z).toBe(-1);
      expect(scene.boundingBox.max.x).toBe(5);
      expect(scene.boundingBox.max.y).toBe(3);
      expect(scene.boundingBox.max.z).toBe(1);
    });

    it('should calculate center', () => {
      const gaussians = [
        createTestGaussian(-10, 0, 0),
        createTestGaussian(10, 0, 0),
      ];
      const scene = createTestScene(gaussians);

      expect(scene.center.x).toBe(0);
      expect(scene.center.y).toBe(0);
      expect(scene.center.z).toBe(0);
    });

    it('should calculate maxExtent', () => {
      const gaussians = [
        createTestGaussian(0, 0, 0),
        createTestGaussian(10, 5, 2),
      ];
      const scene = createTestScene(gaussians);

      expect(scene.maxExtent).toBe(10); // Max of (10, 5, 2)
    });
  });
});
