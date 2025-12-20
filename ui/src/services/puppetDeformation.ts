/**
 * Puppet Deformation Service
 *
 * Provides mesh-based deformation using control pins.
 * Similar to After Effects Puppet Tool / VectorSkinning.
 *
 * Algorithm:
 * 1. Triangulate control points + pins
 * 2. Calculate inverse-distance weights for each vertex
 * 3. Apply weighted pin transformations per frame
 */

import type { ControlPoint, AnimatableProperty } from '@/types/project';
import { createLogger } from '@/utils/logger';

const logger = createLogger('PuppetDeformation');

// ============================================================================
// Types
// ============================================================================

export interface PuppetPin {
  /** Unique ID */
  id: string;
  /** Display name */
  name: string;
  /** Position (animatable) */
  position: AnimatableProperty<{ x: number; y: number }>;
  /** Influence radius */
  radius: number;
  /** Stiffness (0-1, higher = less influence from other pins) */
  stiffness: number;
  /** Rotation (animatable, degrees) */
  rotation: AnimatableProperty<number>;
  /** Scale (animatable, 0-200%) */
  scale: AnimatableProperty<number>;
  /** Pin type */
  type: 'position' | 'rotation' | 'starch';
}

export interface PuppetMesh {
  /** Associated layer ID */
  layerId: string;
  /** Deformation pins */
  pins: PuppetPin[];
  /** Triangulation indices */
  triangulation: number[];
  /** Per-vertex weights (flattened: vertex * pinCount) */
  weights: Float32Array;
  /** Original vertex positions (flattened x,y pairs) */
  originalVertices: Float32Array;
  /** Is mesh valid and ready for deformation */
  isValid: boolean;
}

export interface DeformedPoint {
  x: number;
  y: number;
  /** Original point reference */
  originalIndex: number;
}

// ============================================================================
// Puppet Deformation Service
// ============================================================================

export class PuppetDeformationService {
  private meshCache = new Map<string, PuppetMesh>();

  /**
   * Create a puppet mesh from control points and pins
   */
  createMesh(
    layerId: string,
    controlPoints: ControlPoint[],
    pins: PuppetPin[]
  ): PuppetMesh {
    if (controlPoints.length < 3) {
      logger.warn('Need at least 3 control points for mesh');
      return this.createEmptyMesh(layerId);
    }

    if (pins.length === 0) {
      logger.warn('Need at least 1 pin for deformation');
      return this.createEmptyMesh(layerId);
    }

    // Store original vertices
    const originalVertices = new Float32Array(controlPoints.length * 2);
    for (let i = 0; i < controlPoints.length; i++) {
      originalVertices[i * 2] = controlPoints[i].x;
      originalVertices[i * 2 + 1] = controlPoints[i].y;
    }

    // Triangulate (simple ear clipping for convex-ish shapes)
    const triangulation = this.triangulate(controlPoints);

    // Calculate weights (inverse distance)
    const weights = this.calculateWeights(originalVertices, pins);

    const mesh: PuppetMesh = {
      layerId,
      pins: [...pins],
      triangulation,
      weights,
      originalVertices,
      isValid: true,
    };

    this.meshCache.set(layerId, mesh);
    return mesh;
  }

  /**
   * Get or create mesh for a layer
   */
  getMesh(layerId: string): PuppetMesh | undefined {
    return this.meshCache.get(layerId);
  }

  /**
   * Update pin positions (for animation)
   */
  updatePins(layerId: string, pins: PuppetPin[]): void {
    const mesh = this.meshCache.get(layerId);
    if (mesh) {
      mesh.pins = [...pins];
    }
  }

  /**
   * Deform mesh vertices based on current pin state
   */
  deformMesh(mesh: PuppetMesh, frame: number): DeformedPoint[] {
    if (!mesh.isValid || mesh.pins.length === 0) {
      return this.originalToDeformed(mesh.originalVertices);
    }

    const vertexCount = mesh.originalVertices.length / 2;
    const deformed: DeformedPoint[] = [];

    // Get pin states at current frame
    const pinStates = mesh.pins.map(pin => ({
      x: this.evaluateProperty(pin.position, frame).x,
      y: this.evaluateProperty(pin.position, frame).y,
      rotation: this.evaluateProperty(pin.rotation, frame) || 0,
      scale: (this.evaluateProperty(pin.scale, frame) || 100) / 100,
      origX: (pin.position.value as { x: number; y: number }).x,
      origY: (pin.position.value as { x: number; y: number }).y,
    }));

    // Deform each vertex
    for (let v = 0; v < vertexCount; v++) {
      const origX = mesh.originalVertices[v * 2];
      const origY = mesh.originalVertices[v * 2 + 1];

      let newX = 0;
      let newY = 0;
      let totalWeight = 0;

      // Blend contributions from all pins
      for (let p = 0; p < mesh.pins.length; p++) {
        const weight = mesh.weights[v * mesh.pins.length + p];
        if (weight < 0.0001) continue;

        const pin = pinStates[p];
        
        // Calculate deformed position relative to pin
        let dx = origX - pin.origX;
        let dy = origY - pin.origY;

        // Apply pin rotation
        if (pin.rotation !== 0) {
          const rad = (pin.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const rdx = dx * cos - dy * sin;
          const rdy = dx * sin + dy * cos;
          dx = rdx;
          dy = rdy;
        }

        // Apply pin scale
        dx *= pin.scale;
        dy *= pin.scale;

        // Add pin translation
        const px = pin.x + dx;
        const py = pin.y + dy;

        newX += px * weight;
        newY += py * weight;
        totalWeight += weight;
      }

      // Normalize weights
      if (totalWeight > 0) {
        newX /= totalWeight;
        newY /= totalWeight;
      } else {
        newX = origX;
        newY = origY;
      }

      deformed.push({ x: newX, y: newY, originalIndex: v });
    }

    return deformed;
  }

  /**
   * Get deformed control points (for rendering)
   */
  getDeformedControlPoints(mesh: PuppetMesh, frame: number): ControlPoint[] {
    const deformed = this.deformMesh(mesh, frame);
    
    // Rebuild control points with deformed positions
    // Note: handles are interpolated based on original handle directions
    const result: ControlPoint[] = [];
    
    for (const dp of deformed) {
      result.push({
        id: 'deformed_' + dp.originalIndex,
        x: dp.x,
        y: dp.y,
        type: 'smooth',
        // Handle deformation would require more complex math
        // For now, we'll let the renderer interpolate
      });
    }

    return result;
  }

  /**
   * Triangulate control points using ear clipping
   */
  private triangulate(points: ControlPoint[]): number[] {
    const n = points.length;
    if (n < 3) return [];

    const indices: number[] = [];
    const remaining = points.map((_, i) => i);

    // Simple fan triangulation (works for convex shapes)
    // For complex concave shapes, would need proper ear clipping
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i, i + 1);
    }

    return indices;
  }

  /**
   * Calculate inverse-distance weights for each vertex-pin pair
   */
  private calculateWeights(vertices: Float32Array, pins: PuppetPin[]): Float32Array {
    const vertexCount = vertices.length / 2;
    const pinCount = pins.length;
    const weights = new Float32Array(vertexCount * pinCount);

    for (let v = 0; v < vertexCount; v++) {
      const vx = vertices[v * 2];
      const vy = vertices[v * 2 + 1];

      let totalWeight = 0;
      const pinWeights: number[] = [];

      for (let p = 0; p < pinCount; p++) {
        const pin = pins[p];
        const pos = pin.position.value as { x: number; y: number };
        
        const dx = vx - pos.x;
        const dy = vy - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Inverse distance weight with radius falloff
        let w = 0;
        if (dist < pin.radius) {
          // Smooth falloff using cosine
          const t = dist / pin.radius;
          w = (1 - t) * (1 - t) * (1 + pin.stiffness);
        } else {
          // Outside radius: use inverse square falloff
          w = Math.pow(pin.radius / dist, 2) * 0.5;
        }

        pinWeights.push(w);
        totalWeight += w;
      }

      // Normalize and store
      for (let p = 0; p < pinCount; p++) {
        weights[v * pinCount + p] = totalWeight > 0 ? pinWeights[p] / totalWeight : 0;
      }
    }

    return weights;
  }

  /**
   * Evaluate animatable property at frame
   */
  private evaluateProperty<T>(prop: AnimatableProperty<T>, frame: number): T {
    // Simple evaluation - actual keyframe interpolation would use interpolation service
    if (!prop.keyframes || prop.keyframes.length === 0) {
      return prop.value;
    }

    // Find keyframes
    const kfs = prop.keyframes;
    
    // Before first keyframe
    if (frame <= kfs[0].frame) {
      return kfs[0].value;
    }

    // After last keyframe
    if (frame >= kfs[kfs.length - 1].frame) {
      return kfs[kfs.length - 1].value;
    }

    // Find surrounding keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
      if (frame >= kfs[i].frame && frame <= kfs[i + 1].frame) {
        const t = (frame - kfs[i].frame) / (kfs[i + 1].frame - kfs[i].frame);
        return this.lerpValue(kfs[i].value, kfs[i + 1].value, t);
      }
    }

    return prop.value;
  }

  /**
   * Linear interpolation for values
   */
  private lerpValue<T>(a: T, b: T, t: number): T {
    if (typeof a === 'number' && typeof b === 'number') {
      return (a + (b - a) * t) as T;
    }

    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const result: any = {};
      for (const key of Object.keys(a as object)) {
        result[key] = this.lerpValue((a as any)[key], (b as any)[key], t);
      }
      return result as T;
    }

    return t < 0.5 ? a : b;
  }

  /**
   * Convert original vertices to DeformedPoint array
   */
  private originalToDeformed(vertices: Float32Array): DeformedPoint[] {
    const result: DeformedPoint[] = [];
    for (let i = 0; i < vertices.length / 2; i++) {
      result.push({
        x: vertices[i * 2],
        y: vertices[i * 2 + 1],
        originalIndex: i,
      });
    }
    return result;
  }

  /**
   * Create empty/invalid mesh
   */
  private createEmptyMesh(layerId: string): PuppetMesh {
    return {
      layerId,
      pins: [],
      triangulation: [],
      weights: new Float32Array(0),
      originalVertices: new Float32Array(0),
      isValid: false,
    };
  }

  /**
   * Clear mesh cache for a layer
   */
  clearMesh(layerId: string): void {
    this.meshCache.delete(layerId);
  }

  /**
   * Clear all cached meshes
   */
  clearAllMeshes(): void {
    this.meshCache.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const puppetDeformationService = new PuppetDeformationService();

// ============================================================================
// Convenience Functions
// ============================================================================

export function createPuppetMesh(
  layerId: string,
  controlPoints: ControlPoint[],
  pins: PuppetPin[]
): PuppetMesh {
  return puppetDeformationService.createMesh(layerId, controlPoints, pins);
}

export function deformMesh(mesh: PuppetMesh, frame: number): DeformedPoint[] {
  return puppetDeformationService.deformMesh(mesh, frame);
}

export function getDeformedControlPoints(mesh: PuppetMesh, frame: number): ControlPoint[] {
  return puppetDeformationService.getDeformedControlPoints(mesh, frame);
}

/**
 * Create a default pin at position
 */
export function createDefaultPin(x: number, y: number, name?: string): PuppetPin {
  return {
    id: 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name || 'Pin',
    position: { value: { x, y } },
    radius: 100,
    stiffness: 0.5,
    rotation: { value: 0 },
    scale: { value: 100 },
    type: 'position',
  };
}

export default puppetDeformationService;
